import { generateTripPlan, TripInput, GeneratedItinerary, MoodType, GroupType, EnergyType } from './plannerLogic';
import { DESTINATIONS } from '../data/destinations';

export interface MultiCityLeg {
  city: string;
  days: number;
  itinerary: GeneratedItinerary;
  transportToNext?: {
    mode: 'flight' | 'train' | 'bus';
    duration: string;
    estimatedCost: number;
  };
}

export interface MultiCityTrip {
  legs: MultiCityLeg[];
  totalDays: number;
  totalCost: number;
  startDate: string;
  endDate: string;
}

export async function generateMultiCityTrip(
  cities: string[],
  totalDays: number,
  budgetPerPerson: number,
  startCity: string,
  mood: MoodType,
  groupType: GroupType,
  energyLevel: EnergyType,
  travellers: number,
  startDate: string
): Promise<MultiCityTrip> {
  if (cities.length < 2 || cities.length > 4) {
    throw new Error('Multi-city trips must have 2-4 destinations');
  }

  // Allocate days per city (simple: divide equally, with remainder to first city)
  const transportDays = cities.length - 1; // 1 day per inter-city transport
  const availableDays = totalDays - transportDays;
  const daysPerCity = Math.floor(availableDays / cities.length);
  const remainder = availableDays % cities.length;

  const legs: MultiCityLeg[] = [];
  let currentDate = new Date(startDate);
  let totalCost = 0;

  for (let i = 0; i < cities.length; i++) {
    const cityDays = daysPerCity + (i === 0 ? remainder : 0);
    const cityBudget = Math.floor(budgetPerPerson * (cityDays / totalDays));

    // Generate itinerary for this city
    const destination = DESTINATIONS.find(d => 
      d.name.toLowerCase() === cities[i].toLowerCase() || 
      d.id === cities[i].toLowerCase().replace(/\s+/g, '-')
    );

    if (!destination) {
      throw new Error(`Destination not found: ${cities[i]}`);
    }

    const legStartDate = currentDate.toISOString().split('T')[0];
    const legEndDate = new Date(currentDate.getTime() + cityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const input: TripInput = {
      startCity,
      destinationId: destination.id,
      departureDate: legStartDate,
      returnDate: legEndDate,
      days: cityDays,
      travellers,
      budgetInr: cityBudget,
      travelMode: i === 0 ? 'flight' : 'train',
      mood,
      groupType,
      energyLevel,
      travelStyle: budgetPerPerson > 50000 ? 'Comfortable' : budgetPerPerson > 30000 ? 'Balanced' : 'Budget',
    };

    const itinerary = await generateTripPlan(input);
    
    // Calculate inter-city transport
    let transportToNext;
    if (i < cities.length - 1) {
      const distance = calculateDistance(cities[i], cities[i + 1]);
      transportToNext = calculateInterCityTransport(distance, budgetPerPerson);
      totalCost += transportToNext.estimatedCost * travellers;
    }

    legs.push({
      city: cities[i],
      days: cityDays,
      itinerary,
      transportToNext
    });

    totalCost += itinerary.costBreakdown.totalEstimatedInr;
    currentDate = new Date(currentDate.getTime() + (cityDays + 1) * 24 * 60 * 60 * 1000);
  }

  const endDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    legs,
    totalDays,
    totalCost,
    startDate,
    endDate
  };
}

function calculateDistance(city1: string, city2: string): number {
  // Simplified: return rough distance in km
  // In production, use actual lat/lng calculation
  const cityDistances: Record<string, Record<string, number>> = {
    'delhi': { 'agra': 230, 'jaipur': 280, 'mumbai': 1400, 'goa': 1900, 'ladakh': 1050 },
    'mumbai': { 'goa': 450, 'pune': 150, 'delhi': 1400, 'jaipur': 1150 },
    'bangalore': { 'mysore': 150, 'coorg': 250, 'goa': 560, 'hampi': 350 },
    'hampi': { 'bangalore': 350, 'goa': 300, 'mysore': 400 },
    'goa': { 'mumbai': 450, 'bangalore': 560, 'hampi': 300, 'delhi': 1900 },
    'jaipur': { 'delhi': 280, 'agra': 240, 'udaipur': 400, 'mumbai': 1150 },
    'agra': { 'delhi': 230, 'jaipur': 240 },
    'ladakh': { 'delhi': 1050, 'manali': 480 },
  };

  const c1 = city1.toLowerCase();
  const c2 = city2.toLowerCase();
  
  return cityDistances[c1]?.[c2] || cityDistances[c2]?.[c1] || 500; // default 500km
}

function calculateInterCityTransport(distanceKm: number, budgetPerPerson: number): MultiCityLeg['transportToNext'] {
  if (distanceKm > 1000 || budgetPerPerson > 50000) {
    return {
      mode: 'flight',
      duration: `${Math.floor(distanceKm / 800)}h ${Math.round((distanceKm % 800) / 800 * 60)}m`,
      estimatedCost: Math.round(distanceKm * 4) // ₹4/km for flights
    };
  } else if (distanceKm > 300) {
    return {
      mode: 'train',
      duration: `${Math.floor(distanceKm / 60)}h ${Math.round((distanceKm % 60))}m`,
      estimatedCost: Math.round(distanceKm * 1) // ₹1/km for trains
    };
  } else {
    return {
      mode: 'bus',
      duration: `${Math.floor(distanceKm / 50)}h ${Math.round((distanceKm % 50) / 50 * 60)}m`,
      estimatedCost: Math.round(distanceKm * 0.5) // ₹0.5/km for buses
    };
  }
}
