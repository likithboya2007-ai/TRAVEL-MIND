import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { GeneratedItinerary } from '../utils/plannerLogic';

export function SharedTrip() {
  const { shareId } = useParams();
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shareId) {
      supabase
        .from('saved_trips')
        .select('*')
        .eq('share_id', shareId)
        .eq('is_public', true)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setItinerary(data.itinerary_data);
          }
          setLoading(false);
        });
    }
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Trip Not Found</h1>
          <p className="text-gray-600 mb-6">This shared trip is no longer available.</p>
          <a href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg">
            Create Your Own Trip
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-8 mb-6">
          <div className="text-sm text-gray-500 mb-2">Shared Trip</div>
          <h1 className="text-4xl font-bold mb-2">{itinerary.destination.name}</h1>
          <p className="text-gray-600">{itinerary.days.length} days • ₹{itinerary.costBreakdown.totalEstimatedInr.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-2xl p-8">
          {itinerary.days.map((day, i) => (
            <div key={i} className="mb-8 last:mb-0">
              <h3 className="text-xl font-bold mb-4">Day {i + 1}</h3>
              <div className="space-y-3">
                {day.stops.map((stop) => (
                  <div key={stop.id} className="flex gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold">{stop.name}</div>
                      <div className="text-sm text-gray-600">{stop.timeOfDay} • {stop.durationHours}h</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{stop.estimatedCostInr}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <a href="/" className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700 transition">
            Create Your Own Trip
          </a>
        </div>
      </div>
    </div>
  );
}
