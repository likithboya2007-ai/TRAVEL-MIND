import { verifyToken } from './supabase.js';
import rateLimiter, { RATE_LIMITS } from './rateLimiter.js';
import { routingRequestSchema, type RoutingRequest } from './schemas.js';

interface RoutingHandlerOptions {
  coordinates: RoutingRequest['coordinates'];
  profile?: RoutingRequest['profile'];
  options?: RoutingRequest['options'];
  token?: string;
}

interface RoutingHandlerResult {
  success: boolean;
  data?: any;
  error?: string;
  status: number;
}

/**
 * Shared routing handler using OpenRouteService
 * Used by both dev server (server.js) and serverless function (api/routing.ts)
 */
export async function handleRoutingRequest(options: RoutingHandlerOptions): Promise<RoutingHandlerResult> {
  const { coordinates, profile = 'driving-car', options: routingOptions, token } = options;
  
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
  const rateLimitOk = rateLimiter.check(user.id, RATE_LIMITS.routing);
  if (!rateLimitOk) {
    return {
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      status: 429,
    };
  }
  
  // 3. Validate request body
  const validation = routingRequestSchema.safeParse({
    coordinates,
    profile,
    options: routingOptions,
  });
  
  if (!validation.success) {
    const errorMessage = validation.error.errors[0]?.message || 'Invalid request data';
    return {
      success: false,
      error: errorMessage,
      status: 400,
    };
  }
  
  // 4. Check OpenRouteService API key
  const apiKey = process.env.OPENROUTE_API_KEY;
  if (!apiKey) {
    console.error('Missing OPENROUTE_API_KEY environment variable');
    return {
      success: false,
      error: 'Routing service temporarily unavailable',
      status: 500,
    };
  }
  
  // 5. Process routing request
  try {
    const requestBody = {
      coordinates,
      instructions: true,
      units: routingOptions?.units || 'km',
      language: routingOptions?.language || 'en',
      geometry: true,
      alternative_routes: {
        target_count: routingOptions?.alternatives || 0,
      },
    };

    const url = `https://api.openrouteservice.org/v2/directions/${profile}/json`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouteService error:', response.status, errorText);
      
      // Don't expose internal error details
      return {
        success: false,
        error: 'Failed to calculate route',
        status: response.status >= 500 ? 500 : 400,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      data,
      status: 200,
    };
  } catch (error: any) {
    console.error('Routing API Error:', error);
    
    // Don't expose internal error details
    return {
      success: false,
      error: 'Failed to process request',
      status: 500,
    };
  }
}
