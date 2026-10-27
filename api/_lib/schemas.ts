import { z } from 'zod';

// Chat request validation schema
export const chatRequestSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters'),
  
  tripContext: z.object({
    destination: z.string(),
    days: z.number().positive(),
    budget: z.number().positive(),
    mood: z.string(),
    currentItinerary: z.any().optional(),
  }).optional(),
  
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).max(20, 'Conversation history cannot exceed 20 messages').optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

// Routing request validation schema
export const routingRequestSchema = z.object({
  coordinates: z.array(
    z.tuple([z.number(), z.number()])
  ).min(2, 'At least 2 coordinates are required'),
  
  profile: z.enum([
    'driving-car',
    'driving-hgv',
    'cycling-regular',
    'cycling-road',
    'cycling-mountain',
    'cycling-electric',
    'foot-walking',
    'foot-hiking',
    'wheelchair'
  ]).default('driving-car'),
  
  options: z.object({
    units: z.enum(['km', 'mi', 'm']).optional(),
    language: z.string().optional(),
    alternatives: z.number().min(0).max(3).optional(),
  }).optional(),
});

export type RoutingRequest = z.infer<typeof routingRequestSchema>;

// Attraction validation schema (for LLM-generated attractions)
export const AttractionSchema = z.object({
  name: z.string().min(3).max(100),
  category: z.enum(['Adventure', 'Culture', 'Nature', 'Food', 'Relaxation', 'Photography']),
  durationHours: z.number().min(0.5).max(8),
  estimatedCostInr: z.number().min(0).max(50000),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'sunset']),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  description: z.string().min(10).max(500),
  highlight: z.string().min(10).max(200),
  bestFor: z.array(z.string()).min(1).max(4),
});

export const AttractionsRequestSchema = z.object({
  name: z.string().min(1, 'Destination name is required'),
  state: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  mood: z.enum(['Adventure', 'Photography', 'Food', 'Romantic', 'Peaceful', 'Culture']),
  groupType: z.enum(['Solo', 'Couple', 'Friends', 'Family']),
  days: z.number().min(1).max(14),
});

export type AttractionResponse = z.infer<typeof AttractionSchema>;
export type AttractionsRequest = z.infer<typeof AttractionsRequestSchema>;
