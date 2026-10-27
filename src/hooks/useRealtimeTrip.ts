import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { GeneratedItinerary } from '../utils/plannerLogic';

export function useRealtimeTrip(tripId: string | null) {
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);

  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`trip:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'saved_trips',
          filter: `id=eq.${tripId}`,
        },
        (payload) => {
          console.log('Trip updated by collaborator:', payload);
          if (payload.new && payload.new.itinerary_data) {
            setItinerary(payload.new.itinerary_data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  return itinerary;
}
