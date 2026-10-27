import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from './supabase.js';
import rateLimiter, { RATE_LIMITS } from './rateLimiter.js';
import { AttractionsRequestSchema, AttractionSchema, type AttractionsRequest, type AttractionResponse } from './schemas.js';
import { z } from 'zod';

interface AttractionsHandlerOptions extends AttractionsRequest {
  token?: string;
}

interface AttractionsHandlerResult {
  success: boolean;
  attractions?: AttractionResponse[];
  error?: string;
  status: number;
}

/**
 * Calculate Haversine distance between two geographic coordinates
 * @returns Distance in kilometers
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate cache key from rounded lat/lng
 */
function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

/**
 * Check Supabase cache for existing attractions
 */
async function checkCache(
  locationKey: string,
  supabase: ReturnType<typeof createClient>
): Promise<AttractionResponse[] | null> {
  try {
    const { data, error } = await supabase
      .from('generated_attractions')
      .select('attractions, created_at')
      .eq('location_key', locationKey)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    // Check if cache is still valid (30 days)
    const createdAt = new Date(data.created_at);
    const now = new Date();
    const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation > 30) {
      return null; // Cache expired
    }
    
    return data.attractions as AttractionResponse[];
  } catch (error) {
    console.error('Cache check failed:', error);
    return null;
  }
}

/**
 * Save generated attractions to Supabase cache
 */
async function saveCache(
  locationKey: string,
  request: AttractionsRequest,
  attractions: AttractionResponse[],
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  try {
    await supabase
      .from('generated_attractions')
      .upsert({
        location_key: locationKey,
        name: request.name,
        state: request.state || null,
        country: request.country,
        lat: request.lat,
        lng: request.lng,
        mood: request.mood,
        group_type: request.groupType,
        attractions: attractions,
        updated_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Failed to save cache:', error);
    // Don't throw - caching is optional
  }
}

/**
 * Generate attractions using Groq AI with JSON mode
 */
async function generateAttractions(
  request: AttractionsRequest,
  groq: Groq,
  attempt: number = 1
): Promise<AttractionResponse[]> {
  const systemPrompt = `You are a travel expert. Generate ${attempt === 1 ? '8-15' : '10-12'} real tourist attractions for ${request.name}, ${request.country}.
Return ONLY valid JSON array matching this exact schema:

[{
  "name": "string",
  "category": "Adventure"|"Culture"|"Nature"|"Food"|"Relaxation"|"Photography",
  "durationHours": number (0.5-8),
  "estimatedCostInr": number,
  "timeOfDay": "morning"|"afternoon"|"evening"|"sunset",
  "lat": number,
  "lng": number,
  "description": "string (1-2 sentences)",
  "highlight": "string (key feature, 1 sentence)",
  "bestFor": ["string"] (e.g., ["Couple", "Solo"])
}]

Focus on ${request.mood} experiences for ${request.groupType} travelers.
Use real, precise coordinates within 50km of ${request.lat}, ${request.lng}.
Ensure variety across categories and times of day.
${attempt === 2 ? 'IMPORTANT: Ensure all fields match the exact schema. Previous response was invalid.' : ''}`;

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Generate attractions for ${request.name}. Return ONLY valid JSON array.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2500,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Empty response from Groq');
    }

    // Parse JSON response
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
      
      // Handle different JSON structures (array vs object with array)
      if (Array.isArray(parsed)) {
        // Direct array
      } else if (parsed.attractions && Array.isArray(parsed.attractions)) {
        parsed = parsed.attractions;
      } else if (parsed.results && Array.isArray(parsed.results)) {
        parsed = parsed.results;
      } else {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      throw new Error(`Failed to parse JSON: ${parseError}`);
    }

    // Validate each attraction
    const AttractionsArraySchema = z.array(AttractionSchema).min(8).max(15);
    const validationResult = AttractionsArraySchema.safeParse(parsed);
    
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.errors);
      throw new Error(`Invalid attractions schema: ${validationResult.error.errors[0]?.message}`);
    }

    // Filter attractions by distance (max 50km from center)
    const filteredAttractions = validationResult.data.filter((attraction) => {
      const distance = haversineDistance(
        request.lat,
        request.lng,
        attraction.lat,
        attraction.lng
      );
      return distance <= 50;
    });

    if (filteredAttractions.length < 8) {
      throw new Error(`Only ${filteredAttractions.length} attractions within 50km range`);
    }

    return filteredAttractions;
  } catch (error) {
    if (attempt === 1) {
      console.warn('First attempt failed, retrying:', error);
      // Retry once with refined prompt
      return generateAttractions(request, groq, 2);
    }
    throw error;
  }
}

/**
 * Main handler for attractions generation endpoint
 */
export async function handleAttractionsRequest(
  options: AttractionsHandlerOptions
): Promise<AttractionsHandlerResult> {
  const { token, ...requestData } = options;
  
  // 1. Verify authentication
  if (!token) {
    return {
      success: false,
      error: 'Authentication required',
      status: 401,
    };
  }
  
  const user = await verifyToken(token);
  if (!user) {
    return {
      success: false,
      error: 'Invalid or expired token',
      status: 401,
    };
  }
  
  // 2. Check rate limit
  const rateLimitOk = rateLimiter.check(user.id, RATE_LIMITS.attractions);
  if (!rateLimitOk) {
    return {
      success: false,
      error: 'Rate limit exceeded. Please try again in a few minutes.',
      status: 429,
    };
  }
  
  // 3. Validate request data
  const validation = AttractionsRequestSchema.safeParse(requestData);
  if (!validation.success) {
    const errorMessage = validation.error.errors[0]?.message || 'Invalid request data';
    return {
      success: false,
      error: errorMessage,
      status: 400,
    };
  }
  
  const request = validation.data;
  
  // 4. Check environment variables
  const groqApiKey = process.env.GROQ_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!groqApiKey) {
    console.error('Missing GROQ_API_KEY environment variable');
    return {
      success: false,
      error: 'AI service temporarily unavailable',
      status: 500,
    };
  }
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    return {
      success: false,
      error: 'Database service temporarily unavailable',
      status: 500,
    };
  }
  
  // 5. Initialize clients
  const groq = new Groq({ apiKey: groqApiKey });
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // 6. Check cache
  const locationKey = getCacheKey(request.lat, request.lng);
  const cachedAttractions = await checkCache(locationKey, supabase);
  
  if (cachedAttractions) {
    console.log(`Cache hit for ${locationKey}`);
    return {
      success: true,
      attractions: cachedAttractions,
      status: 200,
    };
  }
  
  // 7. Generate attractions using Groq
  try {
    const attractions = await generateAttractions(request, groq);
    
    // 8. Save to cache
    await saveCache(locationKey, request, attractions, supabase);
    
    return {
      success: true,
      attractions,
      status: 200,
    };
  } catch (error) {
    console.error('Failed to generate attractions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate attractions',
      status: 500,
    };
  }
}
