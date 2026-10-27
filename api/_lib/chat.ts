import Groq from 'groq-sdk';
import { verifyToken } from './supabase.js';
import rateLimiter, { RATE_LIMITS } from './rateLimiter.js';
import { chatRequestSchema, type ChatRequest } from './schemas.js';

interface ChatHandlerOptions {
  message: string;
  tripContext?: ChatRequest['tripContext'];
  conversationHistory?: ChatRequest['conversationHistory'];
  token?: string;
}

interface ItineraryChange {
  type: 'replace' | 'remove' | 'add' | 'move';
  day: number;
  order?: number;
  oldStop?: any;
  newStop?: any;
  stop?: any;
  fromDay?: number;
  fromOrder?: number;
  toDay?: number;
  toOrder?: number;
}

interface ChatHandlerResult {
  success: boolean;
  response?: string;
  error?: string;
  status: number;
  toolCalls?: ItineraryChange[];
}

/**
 * Groq tool definitions for itinerary editing
 */
const tools = [
  {
    type: 'function',
    function: {
      name: 'replace_stop',
      description: 'Replace a specific stop in the itinerary with a new activity',
      parameters: {
        type: 'object',
        properties: {
          day: { type: 'number', description: 'Day number (1-indexed)' },
          order: { type: 'number', description: 'Stop order in that day (0-indexed)' },
          newStop: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { 
                type: 'string', 
                enum: ['Adventure', 'Culture', 'Nature', 'Food', 'Relaxation', 'Photography'] 
              },
              duration: { type: 'number', description: 'Duration in hours' },
              cost: { type: 'number', description: 'Estimated cost in INR' },
            },
            required: ['name', 'category', 'duration', 'cost'],
          },
        },
        required: ['day', 'order', 'newStop'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_stop',
      description: 'Remove a stop from the itinerary',
      parameters: {
        type: 'object',
        properties: {
          day: { type: 'number', description: 'Day number (1-indexed)' },
          order: { type: 'number', description: 'Stop order in that day (0-indexed)' },
        },
        required: ['day', 'order'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_stop',
      description: 'Add a new stop to a specific day',
      parameters: {
        type: 'object',
        properties: {
          day: { type: 'number', description: 'Day number (1-indexed)' },
          stop: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              duration: { type: 'number' },
              cost: { type: 'number' },
              time: { type: 'string', description: 'Start time (e.g., 09:00 AM)' },
            },
            required: ['name', 'category', 'duration', 'cost'],
          },
        },
        required: ['day', 'stop'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'move_stop',
      description: 'Move a stop from one day/position to another',
      parameters: {
        type: 'object',
        properties: {
          fromDay: { type: 'number', description: 'Source day number' },
          fromOrder: { type: 'number', description: 'Source stop order (0-indexed)' },
          toDay: { type: 'number', description: 'Target day number' },
          toOrder: { type: 'number', description: 'Target stop order (0-indexed)' },
        },
        required: ['fromDay', 'fromOrder', 'toDay', 'toOrder'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'adjust_budget',
      description: 'Adjust itinerary to meet a target budget by swapping to cheaper options',
      parameters: {
        type: 'object',
        properties: {
          targetBudget: { type: 'number', description: 'Target budget in INR' },
        },
        required: ['targetBudget'],
      },
    },
  },
];

/**
 * Find expensive stops for budget optimization
 */
function findExpensiveStops(itinerary: any): Array<{ day: number; order: number; stop: any }> {
  const allStops: Array<{ day: number; order: number; stop: any; cost: number }> = [];
  
  itinerary.forEach((dayPlan: any, dayIdx: number) => {
    dayPlan.stops?.forEach((stop: any, stopIdx: number) => {
      allStops.push({
        day: dayIdx + 1,
        order: stopIdx,
        stop: stop,
        cost: stop.cost || stop.estimatedCostInr || 0,
      });
    });
  });
  
  // Sort by cost descending and return top 3
  allStops.sort((a, b) => b.cost - a.cost);
  return allStops.slice(0, 3);
}

/**
 * Execute tool call and return proposed changes
 */
function handleToolCall(
  toolName: string,
  args: any,
  itinerary: any
): ItineraryChange[] {
  const changes: ItineraryChange[] = [];
  
  try {
    // Handle both array format and full itinerary object
    const days = Array.isArray(itinerary) ? itinerary : itinerary?.days;
    
    if (!days || !Array.isArray(days)) {
      console.error('Invalid itinerary format:', itinerary);
      return changes;
    }
    
    switch (toolName) {
      case 'replace_stop':
        if (days[args.day - 1]?.stops?.[args.order]) {
          changes.push({
            type: 'replace',
            day: args.day,
            order: args.order,
            oldStop: days[args.day - 1].stops[args.order],
            newStop: args.newStop,
          });
        }
        break;
        
      case 'remove_stop':
        if (days[args.day - 1]?.stops?.[args.order]) {
          changes.push({
            type: 'remove',
            day: args.day,
            order: args.order,
            stop: days[args.day - 1].stops[args.order],
          });
        }
        break;
        
      case 'add_stop':
        changes.push({
          type: 'add',
          day: args.day,
          stop: args.stop,
        });
        break;
        
      case 'move_stop':
        if (days[args.fromDay - 1]?.stops?.[args.fromOrder]) {
          const stop = days[args.fromDay - 1].stops[args.fromOrder];
          changes.push({
            type: 'move',
            fromDay: args.fromDay,
            fromOrder: args.fromOrder,
            toDay: args.toDay,
            toOrder: args.toOrder,
            stop,
          });
        }
        break;
        
      case 'adjust_budget':
        const expensiveStops = findExpensiveStops(days);
        expensiveStops.forEach(({ day, order, stop }) => {
          changes.push({
            type: 'replace',
            day,
            order,
            oldStop: stop,
            newStop: { 
              ...stop, 
              cost: Math.round((stop.cost || stop.estimatedCostInr || 0) * 0.6), 
              name: `${stop.name} (budget option)` 
            },
          });
        });
        break;
    }
  } catch (error) {
    console.error('Tool execution error:', error);
  }
  
  return changes;
}

/**
 * Shared chat handler using Groq AI
 * Used by both dev server (server.js) and serverless function (api/chat.ts)
 */
export async function handleChatRequest(options: ChatHandlerOptions): Promise<ChatHandlerResult> {
  const { message, tripContext, conversationHistory, token } = options;
  
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
  const rateLimitOk = rateLimiter.check(user.id, RATE_LIMITS.chat);
  if (!rateLimitOk) {
    const status = rateLimiter.getStatus(user.id, RATE_LIMITS.chat);
    return {
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      status: 429,
    };
  }
  
  // 3. Validate request body
  const validation = chatRequestSchema.safeParse({
    message,
    tripContext,
    conversationHistory,
  });
  
  if (!validation.success) {
    const errorMessage = validation.error.errors[0]?.message || 'Invalid request data';
    return {
      success: false,
      error: errorMessage,
      status: 400,
    };
  }
  
  // 4. Check Groq API key
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('Missing GROQ_API_KEY environment variable');
    return {
      success: false,
      error: 'AI service temporarily unavailable',
      status: 500,
    };
  }
  
  // 5. Process chat request
  try {
    const groq = new Groq({ apiKey });
    
    // Build context-aware system prompt
    let systemPrompt = `You are an expert AI Travel Copilot for TravelMind AI, a travel planning platform. You help users plan their trips, suggest activities, modify itineraries, and provide travel advice.

Your role:
- Provide personalized travel recommendations
- Suggest activities and attractions
- Help modify itineraries
- Offer budget optimization tips
- Answer travel-related questions
- Be friendly, helpful, and concise

Guidelines:
- Always consider the user's current trip context
- Provide practical, actionable suggestions
- Include estimated costs in INR when relevant
- Be specific about locations, timings, and logistics
- If you don't have real-time data, say so clearly
- Keep responses focused and under 200 words unless asked for details`;

    if (tripContext) {
      systemPrompt += `\n\nCurrent Trip Context:
- Destination: ${tripContext.destination}
- Duration: ${tripContext.days} days
- Budget: ₹${tripContext.budget?.toLocaleString('en-IN')}
- Travel Mood: ${tripContext.mood}`;

      if (tripContext.currentItinerary) {
        systemPrompt += `\n- Current itinerary has ${tripContext.currentItinerary.length} days planned`;
      }
    }

    // Build conversation messages
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    // Get model from env or use default
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    // Determine if we should enable tools (only if itinerary is present)
    const enableTools = tripContext?.currentItinerary && tripContext.currentItinerary.length > 0;

    // Call Groq API
    const completion = await groq.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.95,
      ...(enableTools ? { tools: tools as any } : {}),
    });

    const responseMessage = completion.choices[0]?.message;
    const responseText = responseMessage?.content || 'No response generated';

    // Check if LLM made tool calls
    if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      const allChanges: ItineraryChange[] = [];
      
      for (const toolCall of responseMessage.tool_calls) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          const changes = handleToolCall(
            toolCall.function.name,
            args,
            tripContext?.currentItinerary
          );
          allChanges.push(...changes);
        } catch (error) {
          console.error('Tool call parsing error:', error);
        }
      }
      
      return {
        success: true,
        response: responseText,
        toolCalls: allChanges,
        status: 200,
      };
    }

    return {
      success: true,
      response: responseText,
      status: 200,
    };
  } catch (error: any) {
    console.error('Groq API Error:', error);
    
    // Don't expose internal error details
    return {
      success: false,
      error: 'Failed to process request',
      status: 500,
    };
  }
}
