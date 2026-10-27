import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database Types
export interface SavedTrip {
  id: string;
  user_id: string;
  trip_data: any; // Full GeneratedItinerary JSON
  destination_name: string;
  destination_state: string;
  start_city: string;
  departure_date: string;
  days: number;
  total_cost_inr: number;
  mood: string;
  is_visited: boolean;
  visited_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
