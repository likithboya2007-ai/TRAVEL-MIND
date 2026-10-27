import { DayPlan } from '../utils/plannerLogic';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: ItineraryChange[];
}

export interface ItineraryChange {
  type: 'replace' | 'remove' | 'add' | 'move';
  day: number;
  order?: number;
  oldStop?: {
    name: string;
    category?: string;
    duration?: number;
    cost?: number;
  };
  newStop?: {
    name: string;
    category?: string;
    duration?: number;
    durationHours?: number;
    cost?: number;
    estimatedCostInr?: number;
    description?: string;
    highlight?: string;
    timeOfDay?: string;
    time?: string;
    lat?: number;
    lng?: number;
    bestFor?: string[];
  };
  stop?: {
    name: string;
    category?: string;
    duration?: number;
    durationHours?: number;
    cost?: number;
    estimatedCostInr?: number;
    description?: string;
    highlight?: string;
    timeOfDay?: string;
    time?: string;
    lat?: number;
    lng?: number;
    bestFor?: string[];
  };
  fromDay?: number;
  fromOrder?: number;
  toDay?: number;
  toOrder?: number;
}

export interface TripContext {
  destination: string;
  days: number;
  budget: number;
  mood: string;
  currentItinerary?: DayPlan[];
}

export const aiCopilotService = {
  /**
   * Send a message to the AI copilot
   * Returns response text and optional tool calls
   */
  async sendMessage(
    message: string,
    tripContext?: TripContext,
    conversationHistory?: ChatMessage[],
    token?: string
  ): Promise<{ response: string; toolCalls?: ItineraryChange[] }> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is provided
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          tripContext,
          conversationHistory: conversationHistory?.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get AI response');
      }

      const data = await response.json();
      return {
        response: data.response,
        toolCalls: data.toolCalls || undefined,
      };
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('AI Copilot Error:', error);
      }
      throw new Error(error.message || 'Failed to communicate with AI copilot');
    }
  },

  /**
   * Get quick suggestions based on trip context
   */
  getQuickSuggestions(tripContext?: TripContext): string[] {
    if (!tripContext) {
      return [
        'Help me plan a trip',
        'What are popular destinations?',
        'Budget travel tips',
        'Best time to visit India',
      ];
    }

    return [
      `Suggest activities for ${tripContext.destination}`,
      `Optimize my ${tripContext.days}-day itinerary`,
      `Budget-friendly options for ₹${tripContext.budget?.toLocaleString('en-IN')}`,
      `Best ${tripContext.mood.toLowerCase()} experiences`,
      'Add a hidden gem to my trip',
    ];
  },
};
