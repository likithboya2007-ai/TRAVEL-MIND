import { supabase } from '../lib/supabase';
import type { Attraction } from '../data/destinations';

export interface AIAttractionRequest {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lng: number;
  mood: 'Adventure' | 'Photography' | 'Food' | 'Romantic' | 'Peaceful' | 'Culture';
  groupType: 'Solo' | 'Couple' | 'Friends' | 'Family';
  days: number;
}

export interface AIAttraction extends Omit<Attraction, 'id'> {
  // AI-generated attractions don't have IDs initially
}

/**
 * Fetch AI-generated attractions from the backend API
 * @throws Error if request fails or user is not authenticated
 */
export async function fetchAIAttractions(params: AIAttractionRequest): Promise<Attraction[]> {
  try {
    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required. Please sign in to generate attractions.');
    }

    // Call attractions API
    const response = await fetch('/api/attractions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few minutes.');
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else {
        throw new Error(errorData.error || 'Failed to generate attractions');
      }
    }

    const { attractions } = await response.json();
    
    // Add IDs to attractions
    return attractions.map((attr: AIAttraction, index: number) => ({
      ...attr,
      id: `ai-${params.name.toLowerCase().replace(/\s+/g, '-')}-${index}`,
    }));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error fetching AI attractions:', error);
    }
    throw error;
  }
}
