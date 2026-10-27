/**
 * Saved Trips Service
 * Manages user-saved trip itineraries in Supabase
 * Replaces localStorage-based trip storage
 */

import { supabase, SavedTrip } from '../lib/supabase';
import { GeneratedItinerary } from '../utils/plannerLogic';

export const savedTripsService = {
  /**
   * Fetch all saved trips for the authenticated user
   */
  async getAll(): Promise<SavedTrip[]> {
    const { data, error } = await supabase
      .from('saved_trips')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) {
          console.error('Error fetching saved trips:', error);
        }
        if (import.meta.env.DEV) {
          console.error('Error fetching saved trips:', error);
        }}
      throw error;
    }

    return data || [];
  },

  /**
   * Save a new trip
   */
  async save(trip: GeneratedItinerary): Promise<SavedTrip> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated to save trips');
    }

    const tripRecord = {
      user_id: user.id,
      trip_data: trip,
      destination_name: trip.destination.name,
      destination_state: trip.destination.state,
      start_city: trip.input.startCity,
      departure_date: trip.input.departureDate,
      days: trip.input.days,
      total_cost_inr: trip.costBreakdown.totalEstimatedInr,
      mood: trip.input.mood,
      is_visited: false,
    };

    const { data, error } = await supabase
      .from('saved_trips')
      .insert(tripRecord)
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) {
          console.error('Error saving trip:', error);
        }
        if (import.meta.env.DEV) {
          console.error('Error saving trip:', error);
        }}
      throw error;
    }

    return data;
  },

  /**
   * Update an existing trip
   */
  async update(id: string, trip: GeneratedItinerary): Promise<void> {
    const updateData = {
      trip_data: trip,
      destination_name: trip.destination.name,
      destination_state: trip.destination.state,
      start_city: trip.input.startCity,
      departure_date: trip.input.departureDate,
      days: trip.input.days,
      total_cost_inr: trip.costBreakdown.totalEstimatedInr,
      mood: trip.input.mood,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('saved_trips')
      .update(updateData)
      .eq('id', id);

    if (error) {
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) {
          console.error('Error updating trip:', error);
        }
        if (import.meta.env.DEV) {
          console.error('Error updating trip:', error);
        }}
      throw error;
    }
  },

  /**
   * Delete a trip
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('saved_trips')
      .delete()
      .eq('id', id);

    if (error) {
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) {
          console.error('Error deleting trip:', error);
        }
        if (import.meta.env.DEV) {
          console.error('Error deleting trip:', error);
        }}
      throw error;
    }
  },

  /**
   * Mark a trip as visited/completed
   */
  async toggleComplete(id: string, isCompleted: boolean): Promise<void> {
    const update: any = {
      is_visited: isCompleted,
      updated_at: new Date().toISOString(),
    };

    if (isCompleted) {
      update.visited_date = new Date().toISOString();
    } else {
      update.visited_date = null;
    }

    const { error } = await supabase
      .from('saved_trips')
      .update(update)
      .eq('id', id);

    if (error) {
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) {
          console.error('Error toggling completion status:', error);
        }
        if (import.meta.env.DEV) {
          console.error('Error toggling completion status:', error);
        }}
      throw error;
    }
  },

  /**
   * Update trip notes
   */
  async updateNotes(id: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('saved_trips')
      .update({
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) {
          console.error('Error updating notes:', error);
        }
        if (import.meta.env.DEV) {
          console.error('Error updating notes:', error);
        }}
      throw error;
    }
  },
};

