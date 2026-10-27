import type { GeneratedItinerary } from './plannerLogic';
import { supabase } from '../lib/supabase';
import { DESTINATIONS } from '../data/destinations';

const destinations = DESTINATIONS;

export interface TripFeatures {
  mood: string;
  categories: string[];
  budgetBand: 'low' | 'mid' | 'high';
  region: 'north' | 'south' | 'east' | 'west' | 'central';
  duration: number;
}

export interface Recommendation {
  destination: any;
  score: number;
  reason: string;
}

export function extractFeatures(itinerary: GeneratedItinerary): TripFeatures {
  const categories = Array.from(
    new Set(itinerary.days.flatMap(d => d.stops.map(s => s.category)))
  );

  const budgetBand =
    itinerary.costBreakdown.totalEstimatedInr < 15000 ? 'low' :
    itinerary.costBreakdown.totalEstimatedInr < 40000 ? 'mid' : 'high';

  return {
    mood: itinerary.input.mood,
    categories,
    budgetBand,
    region: getRegion(itinerary.destination.state),
    duration: itinerary.days.length
  };
}

function getRegion(state: string): TripFeatures['region'] {
  const regions: Record<string, string[]> = {
    north: ['Rajasthan', 'Himachal Pradesh', 'Uttarakhand', 'Punjab', 'Haryana', 'Delhi'],
    south: ['Karnataka', 'Kerala', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana'],
    east: ['West Bengal', 'Odisha', 'Meghalaya', 'Assam', 'Sikkim'],
    west: ['Goa', 'Maharashtra', 'Gujarat'],
    central: ['Madhya Pradesh', 'Chhattisgarh']
  };

  for (const [region, states] of Object.entries(regions)) {
    if (states.includes(state)) return region as TripFeatures['region'];
  }
  return 'central';
}

export function calculateSimilarity(profile: TripFeatures, dest: any): number {
  let score = 0;

  if (dest.mood === profile.mood) score += 0.3;

  const destCategories = dest.attractions.map((a: any) => a.category);
  const overlap = profile.categories.filter(c => destCategories.includes(c)).length;
  score += (overlap / Math.max(profile.categories.length, 1)) * 0.4;

  const destRegion = getRegion(dest.state);
  if (destRegion !== profile.region) score += 0.1;

  return score;
}

export async function getRecommendations(userId: string): Promise<Recommendation[]> {
  const { data: trips } = await supabase
    .from('saved_trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!trips || trips.length === 0) {
    return destinations.slice(0, 5).map(d => ({
      destination: d,
      score: 1,
      reason: 'Popular destination'
    }));
  }

  const profiles = trips.map(t => extractFeatures(t.itinerary_data));
  const userProfile: TripFeatures = {
    mood: mostFrequent(profiles.map(p => p.mood)),
    categories: Array.from(new Set(profiles.flatMap(p => p.categories))),
    budgetBand: mostFrequent(profiles.map(p => p.budgetBand)),
    region: mostFrequent(profiles.map(p => p.region)),
    duration: Math.round(average(profiles.map(p => p.duration)))
  };

  const scored = destinations
    .filter(dest => !trips.some(t => t.itinerary_data.destination.id === dest.id))
    .map(dest => ({
      destination: dest,
      score: calculateSimilarity(userProfile, dest),
      reason: generateReason(userProfile, dest)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored;
}

function generateReason(profile: TripFeatures, dest: any): string {
  const reasons = [];
  
  if (dest.mood === profile.mood) {
    reasons.push(`you enjoy ${profile.mood.toLowerCase()} trips`);
  }
  
  const common = profile.categories.filter(c =>
    dest.attractions.some((a: any) => a.category === c)
  );
  if (common.length > 0) {
    reasons.push(`you like ${common.slice(0, 2).join(' and ').toLowerCase()}`);
  }
  
  return reasons.length > 0 ? `Because ${reasons.join(', and ')}` : 'Popular destination';
}

function mostFrequent<T>(arr: T[]): T {
  const counts = new Map<T, number>();
  arr.forEach(item => counts.set(item, (counts.get(item) || 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
}

function average(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
