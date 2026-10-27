import { nanoid } from 'nanoid';
import { supabase } from '../lib/supabase';

import type { GeneratedItinerary } from '../utils/plannerLogic';

export async function generateShareLink(tripId: string): Promise<string> {
  const shareId = nanoid(10);
  
  const { error } = await supabase
    .from('saved_trips')
    .update({ share_id: shareId, is_public: true })
    .eq('id', tripId);

  if (error) throw error;

  return `${window.location.origin}/trip/${shareId}`;
}

export async function revokeShareLink(tripId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_trips')
    .update({ is_public: false })
    .eq('id', tripId);

  if (error) throw error;
}

export async function shareTrip(itinerary: GeneratedItinerary, shareUrl?: string): Promise<void> {
  const text = `Check out my ${itinerary.days?.length || 3}-day trip to ${itinerary.destination?.name}! ${shareUrl || ''}`;

  if (navigator.share) {
    await navigator.share({
      title: `${itinerary.destination?.name} Trip`,
      text,
      url: shareUrl
    });
  } else {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }
}
