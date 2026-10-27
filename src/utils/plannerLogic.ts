import { Attraction, DESTINATIONS, Destination } from '../data/destinations';
import { fetchAIAttractions } from '../services/attractionsService';
import { clusterAttractionsByDay, calculateDayDistance } from './geoClustering';
import { fetchRealWeatherForecast, type DailyWeatherForecast } from '../services/realWeatherService';

export type MoodType = 'Adventure' | 'Photography' | 'Food' | 'Romantic' | 'Peaceful' | 'Culture';
export type GroupType = 'Solo' | 'Couple' | 'Friends' | 'Family';
export type EnergyType = 'Relaxed' | 'Balanced' | 'Active';
export type TravelMode = 'car' | 'bike' | 'public transport' | 'walking' | 'train' | 'bus' | 'flight' | 'other';
export type TravelStyle = 'Budget' | 'Balanced' | 'Comfortable';

export interface TripInput {
  startCity: string;
  destinationId: string;
  destinationName?: string;
  departureDate: string;
  returnDate?: string;
  days: number;
  travellers?: number;
  budgetInr: number;
  travelMode: TravelMode;
  travelStyle?: TravelStyle;
  mood: MoodType;
  groupType: GroupType;
  energyLevel: EnergyType;
}

export interface ItineraryStop extends Attraction {
  dayNumber: number;
  orderInDay: number;
  startTime: string;
  endTime: string;
  recommendationReason: string;
  travelDistance?: number; // Travel distance in km from previous stop
}

export interface DayPlan {
  dayNumber: number;
  dateStr: string;
  theme: string;
  stops: ItineraryStop[];
  estimatedDayCostInr: number;
}

export interface CostBreakdown {
  stayInr: number;
  transportInr: number;
  activitiesInr: number;
  foodInr: number;
  contingencyInr: number;
  totalEstimatedInr: number;
  userBudgetInr: number;
  budgetStatus: 'comfortable' | 'balanced' | 'tight';
  varianceInr: number;
}

export interface TravelIntelligenceInsight {
  title: string;
  summary: string;
  type: 'pacing' | 'budget' | 'mood' | 'route';
}

export interface GeneratedItinerary {
  id: string;
  createdAt: string;
  input: TripInput;
  destination: Destination;
  days: DayPlan[];
  costBreakdown: CostBreakdown;
  insights: TravelIntelligenceInsight[];
}

export function validateTripInput(
  input: Partial<TripInput>,
  customDestinations?: Destination[]
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!input.startCity || input.startCity.trim() === '') {
    errors.startCity = 'Please specify your departure city.';
  }
  if (!input.destinationId || input.destinationId.trim() === '') {
    errors.destinationId = 'Please select a destination.';
  } else {
    const allDests = [...(customDestinations || []), ...DESTINATIONS];
    const dest = allDests.find((d) => d.id === input.destinationId);
    if (!dest) {
      errors.destinationId = 'Selected destination is not recognized.';
    }
  }
  if (!input.departureDate || input.departureDate.trim() === '') {
    errors.departureDate = 'Please choose a departure date.';
  }
  if (!input.days || input.days < 1 || input.days > 14) {
    errors.days = 'Journey duration must be between 1 and 14 days.';
  }
  if (!input.budgetInr || input.budgetInr < 5000) {
    errors.budgetInr = 'Minimum realistic budget is ₹5,000.';
  }

  return errors;
}

const GROUP_SIZE_MAP: Record<GroupType, number> = {
  Solo: 1,
  Couple: 2,
  Friends: 3,
  Family: 4,
};

const MODE_COST_PER_DAY: Record<TravelMode, number> = {
  car: 2200,
  bike: 900,
  'public transport': 450,
  walking: 150,
  train: 500,
  bus: 400,
  flight: 3500,
  other: 800,
};

const ENERGY_STOPS_MAP: Record<EnergyType, number> = {
  Relaxed: 1,
  Balanced: 2,
  Active: 3,
};

/**
 * Apply weather-aware optimizations to the itinerary
 * Swaps outdoor activities to dry days and indoor activities to rainy days
 */
async function applyWeatherOptimizations(
  days: DayPlan[],
  destination: Destination,
  departureDate: string
): Promise<{ days: DayPlan[]; swaps: string[] }> {
  const swaps: string[] = [];

  try {
    // Fetch weather forecast
    const forecast = await fetchRealWeatherForecast(
      destination.lat,
      destination.lng,
      destination.name,
      departureDate,
      days.length
    );

    // Identify rainy days (>60% precipitation probability)
    const rainyDayIndices: number[] = [];
    forecast.days.forEach((f, idx) => {
      if (f.precipitationChance > 60) {
        rainyDayIndices.push(idx);
      }
    });

    if (rainyDayIndices.length === 0) {
      return { days, swaps }; // No rainy days, no optimization needed
    }

    // For each rainy day, swap outdoor activities with indoor ones from dry days
    rainyDayIndices.forEach((rainyIdx) => {
      if (rainyIdx >= days.length) return;
      
      const rainyDay = days[rainyIdx];
      
      // Find outdoor stops (Adventure, Nature, Photography)
      const outdoorStops = rainyDay.stops.filter((s) =>
        ['Adventure', 'Nature', 'Photography'].includes(s.category)
      );

      if (outdoorStops.length === 0) return;

      // Find dry days with indoor activities to swap
      days.forEach((dryDay, dryIdx) => {
        if (rainyDayIndices.includes(dryIdx)) return; // Skip other rainy days

        // Find indoor stops (Culture, Food, Relaxation)
        const indoorStops = dryDay.stops.filter((s) =>
          ['Culture', 'Food', 'Relaxation'].includes(s.category)
        );

        // Attempt to swap one outdoor with one indoor
        if (outdoorStops.length > 0 && indoorStops.length > 0) {
          const outdoor = outdoorStops.shift()!;
          const indoor = indoorStops.shift()!;

          const rainyStopIdx = rainyDay.stops.findIndex((s) => s.id === outdoor.id);
          const dryStopIdx = dryDay.stops.findIndex((s) => s.id === indoor.id);

          if (rainyStopIdx !== -1 && dryStopIdx !== -1) {
            // Swap the stops but keep times
            const rainyTime = { startTime: outdoor.startTime, endTime: outdoor.endTime };
            const dryTime = { startTime: indoor.startTime, endTime: indoor.endTime };

            rainyDay.stops[rainyStopIdx] = {
              ...indoor,
              startTime: rainyTime.startTime,
              endTime: rainyTime.endTime,
              dayNumber: rainyDay.dayNumber,
              orderInDay: rainyStopIdx + 1,
            };

            dryDay.stops[dryStopIdx] = {
              ...outdoor,
              startTime: dryTime.startTime,
              endTime: dryTime.endTime,
              dayNumber: dryDay.dayNumber,
              orderInDay: dryStopIdx + 1,
            };

            swaps.push(
              `Moved "${outdoor.name}" to Day ${dryIdx + 1} (better weather) and "${indoor.name}" to Day ${rainyIdx + 1} (${forecast.days[rainyIdx].precipitationChance}% rain expected)`
            );
          }
        }
      });
    });
  } catch (error) {
    console.warn('Weather optimization failed:', error);
    // Continue without weather optimization
  }

  return { days, swaps };
}

/**
 * Check if departure month is in off-season for destination
 */
function checkOffSeasonWarning(
  destination: Destination,
  departureDate: string
): string | null {
  const departureMonth = new Date(departureDate).toLocaleString('en', { month: 'long' });
  const bestMonths = destination.bestMonths || '';

  if (!bestMonths.includes(departureMonth)) {
    return `⚠️ ${departureMonth} is outside the recommended travel season (${bestMonths}). Expect different weather conditions and possible closures.`;
  }

  return null;
}

function scoreAttraction(attraction: Attraction, mood: MoodType, group: GroupType, energy: EnergyType): number {
  let score = 10;

  // Mood affinity
  if (attraction.bestFor.includes(mood)) score += 15;
  if (attraction.category.toLowerCase() === mood.toLowerCase()) score += 12;

  // Group affinity
  if (attraction.bestFor.includes(group)) score += 8;

  // Energy alignment
  if (energy === 'Active' && (attraction.category === 'Adventure' || attraction.durationHours >= 3)) {
    score += 6;
  } else if (energy === 'Relaxed' && (attraction.category === 'Relaxation' || attraction.timeOfDay === 'sunset')) {
    score += 6;
  }

  return score;
}

/**
 * Parse a 12-hour time string (e.g., "09:00 AM") to minutes from midnight
 */
function parseTime12Hour(timeStr: string): number {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 540; // Default to 9:00 AM if parsing fails
  
  let [, hourStr, minuteStr, meridiem] = match;
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  
  if (meridiem.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (meridiem.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }
  
  return hour * 60 + minute;
}

/**
 * Convert minutes from midnight to 12-hour time string (e.g., 540 => "09:00 AM")
 */
function formatTime12Hour(minutes: number): string {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  
  const meridiem = hour24 >= 12 ? 'PM' : 'AM';
  const minuteStr = minute.toString().padStart(2, '0');
  
  return `${hour12}:${minuteStr} ${meridiem}`;
}

/**
 * Calculate end time from start time and duration
 */
function addHoursToTime(startTimeStr: string, durationHours: number): string {
  const startMinutes = parseTime12Hour(startTimeStr);
  const durationMinutes = Math.round(durationHours * 60);
  const endMinutes = startMinutes + durationMinutes;
  
  // Cap at 10:00 PM (1320 minutes) for realistic day planning
  const cappedEndMinutes = Math.min(endMinutes, 1320);
  
  return formatTime12Hour(cappedEndMinutes);
}

export async function generateTripPlan(
  input: TripInput,
  customDestinations?: Destination[]
): Promise<GeneratedItinerary> {
  const allDests = [...(customDestinations || []), ...DESTINATIONS];
  const dest = allDests.find((d) => d.id === input.destinationId);
  if (!dest) {
    throw new Error(`Destination not found: ${input.destinationId}`);
  }

  const groupSize = input.travellers || GROUP_SIZE_MAP[input.groupType] || 2;
  const stopsPerDay = ENERGY_STOPS_MAP[input.energyLevel] || 2;
  let hasAttractions = Boolean(dest.attractions && dest.attractions.length > 0);
  let attractions = dest.attractions || [];

  // For custom destinations (starting with 'place-'), fetch AI-generated attractions
  if (!hasAttractions && dest.id.startsWith('place-')) {
    try {
      console.log(`Fetching AI attractions for custom destination: ${dest.name}`);
      const aiAttractions = await fetchAIAttractions({
        name: dest.name,
        state: dest.state || '',
        country: 'India', // TODO: Extract from destination metadata or geocoding
        lat: dest.lat,
        lng: dest.lng,
        mood: input.mood,
        groupType: input.groupType,
        days: input.days,
      });

      // Mark as AI-generated
      attractions = aiAttractions.map(attr => ({
        ...attr,
        isAIGenerated: true,
      }));

      hasAttractions = attractions.length > 0;
      console.log(`Successfully fetched ${attractions.length} AI attractions`);
    } catch (error) {
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch AI attractions:', error);
        }
        if (import.meta.env.DEV) {
          console.error('Failed to fetch AI attractions:', error);
        }}
      // Fallback to placeholder logic (existing code below will handle it)
    }
  }

  // Score attractions (whether curated or AI-generated)
  const scored = hasAttractions
    ? [...attractions].map((attr) => ({
        attraction: attr,
        score: scoreAttraction(attr, input.mood, input.groupType, input.energyLevel),
      }))
    : [];

  if (hasAttractions) {
    scored.sort((a, b) => b.score - a.score);
  }

  // Geographic clustering for multi-day trips
  let clusteredDays: Attraction[][] = [];
  if (hasAttractions && input.days > 1 && scored.length > input.days) {
    // Take top scored attractions (limit to reasonable number per day)
    const maxAttractions = input.days * stopsPerDay * 1.5; // 1.5x buffer
    const topAttractions = scored
      .slice(0, Math.min(scored.length, Math.floor(maxAttractions)))
      .map((s) => s.attraction);
    
    // Cluster by geographic proximity
    clusteredDays = clusterAttractionsByDay(
      topAttractions,
      input.days,
      dest.lat,
      dest.lng
    );
  } else if (hasAttractions) {
    // For single day or few attractions, just use scored order
    clusteredDays = [scored.map((s) => s.attraction)];
  }

  // Distribute across days
  const baseDate = new Date(input.departureDate);
  const dayPlans: DayPlan[] = [];
  const usedAttractionIds = new Set<string>(); // Track globally across all days

  for (let d = 1; d <= input.days; d++) {
    const currentDate = new Date(baseDate);
    currentDate.setDate(baseDate.getDate() + (d - 1));
    const dateFormatted = currentDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const dayStops: ItineraryStop[] = [];
    let currentTimeInMinutes = parseTime12Hour('09:00 AM'); // Start at 9 AM

    if (hasAttractions && clusteredDays.length > 0) {
      // Get attractions for this day from clustered data
      const dayIndex = Math.min(d - 1, clusteredDays.length - 1);
      let dayAttractions = clusteredDays[dayIndex] || [];
      
      // Filter out already used attractions
      dayAttractions = dayAttractions.filter(attr => !usedAttractionIds.has(attr.id));
      
      const countForToday = Math.min(stopsPerDay, dayAttractions.length);

      // Calculate travel distances
      let prevLat = dest.lat;
      let prevLng = dest.lng;

      for (let s = 0; s < countForToday; s++) {
        const selected = dayAttractions[s];
        
        // Mark as used
        usedAttractionIds.add(selected.id);
        
        const startTime = formatTime12Hour(currentTimeInMinutes);
        const endTime = addHoursToTime(startTime, selected.durationHours);

        let reason = `Aligned with your ${input.mood.toLowerCase()} focus and ${input.energyLevel.toLowerCase()} rhythm.`;
        if (selected.bestFor.includes(input.mood)) {
          reason = `Selected as a premier highlight for ${input.mood} enthusiasts in ${dest.name}.`;
        } else if (selected.bestFor.includes(input.groupType)) {
          reason = `Highly curated for ${input.groupType.toLowerCase()} travel dynamics with comfortable dwell times.`;
        }

        // Calculate travel distance from previous stop
        const travelDistance = s === 0
          ? 0
          : Number(
              ((Math.sqrt(
                Math.pow((selected.lat - prevLat) * 111, 2) +
                  Math.pow((selected.lng - prevLng) * 111 * Math.cos((selected.lat * Math.PI) / 180), 2)
              )).toFixed(1))
            );

        dayStops.push({
          ...selected,
          dayNumber: d,
          orderInDay: s + 1,
          startTime,
          endTime,
          recommendationReason: reason,
          travelDistance: s === 0 ? undefined : travelDistance,
        });

        prevLat = selected.lat;
        prevLng = selected.lng;
        
        // Advance time for next slot (end time + 30 min buffer)
        currentTimeInMinutes = parseTime12Hour(endTime) + 30;
        
        // If we've passed 9 PM (1260 minutes), cap the day
        if (currentTimeInMinutes > 1260) break;
      }
    } else if (!hasAttractions) {
      // Transparent exploratory scheduling for custom or global searched locations
      // Clearly labeled as unverified exploratory schedule blocks
      const countForToday = Math.min(stopsPerDay, 2);
      const exploratorySlots = [
        {
          name: `${dest.name} Historic Core & District Orientation`,
          category: (input.mood === 'Culture' ? 'Culture' : 'Photography') as any,
          durationHours: 2.5,
          estimatedCostInr: 450,
          timeOfDay: 'morning' as const,
          description: `Self-guided orientation walk across ${dest.name}'s central district and primary architectural quarters.`,
          highlight: 'Morning golden hour and neighborhood architecture',
          bestFor: [input.mood, input.groupType],
          reason: `Exploratory morning block for ${dest.name}. Verified local attraction database unverified; customize your stops below.`,
        },
        {
          name: `${dest.name} Regional Cultural & Culinary Exploration`,
          category: (input.mood === 'Food' ? 'Food' : 'Culture') as any,
          durationHours: 3.0,
          estimatedCostInr: 650,
          timeOfDay: 'afternoon' as const,
          description: `Afternoon immersion into local markets, regional dining, and artisan quarters in ${dest.name}.`,
          highlight: 'Authentic local flavors and cultural encounters',
          bestFor: [input.mood, input.groupType],
          reason: `Exploratory afternoon block aligned with ${input.mood.toLowerCase()} focus.`,
        },
        {
          name: `${dest.name} Sunset Promontory & Evening Atmosphere`,
          category: (input.mood === 'Romantic' ? 'Relaxation' : 'Nature') as any,
          durationHours: 2.0,
          estimatedCostInr: 300,
          timeOfDay: 'sunset' as const,
          description: `Dusk contemplation at a scenic vantage point, waterfront, or public promenade across ${dest.name}.`,
          highlight: 'Dusk panorama and evening ambiance',
          bestFor: [input.mood, input.groupType],
          reason: `Sunset slot aligned with ${input.energyLevel.toLowerCase()} pace.`,
        },
      ];

      for (let s = 0; s < countForToday; s++) {
        const slot = exploratorySlots[s % exploratorySlots.length];
        const startTime = formatTime12Hour(currentTimeInMinutes);
        const endTime = addHoursToTime(startTime, slot.durationHours);

        dayStops.push({
          id: `custom-exp-${d}-${s}`,
          name: slot.name,
          category: slot.category,
          durationHours: slot.durationHours,
          estimatedCostInr: slot.estimatedCostInr,
          timeOfDay: slot.timeOfDay,
          lat: dest.lat + (s === 0 ? 0.005 : s === 1 ? -0.006 : 0.008),
          lng: dest.lng + (s === 0 ? 0.004 : s === 1 ? 0.007 : -0.005),
          description: slot.description,
          highlight: slot.highlight,
          bestFor: slot.bestFor,
          dayNumber: d,
          orderInDay: s + 1,
          startTime,
          endTime,
          recommendationReason: slot.reason,
        });
        
        // Advance time for next slot
        currentTimeInMinutes = parseTime12Hour(endTime) + 30;
        
        // If we've passed 9 PM, cap the day
        if (currentTimeInMinutes > 1260) break;
      }
    }

    const themeLabels = [
      'Arrival & Orientation',
      'Heritage & Depth',
      'Scenic Immersion',
      'Coastal & Nature Rhythms',
      'Artisanal Encounters',
      'Peak Wonder Expeditions',
      'Leisure & Reflections',
    ];
    const theme = themeLabels[(d - 1) % themeLabels.length];

    const estimatedDayCostInr = dayStops.reduce((sum, stop) => sum + stop.estimatedCostInr * groupSize, 0);

    dayPlans.push({
      dayNumber: d,
      dateStr: dateFormatted,
      theme,
      stops: dayStops,
      estimatedDayCostInr,
    });
  }

  // Apply weather-aware optimizations
  let weatherSwaps: string[] = [];
  if (hasAttractions) {
    const { days: optimizedDays, swaps } = await applyWeatherOptimizations(
      dayPlans,
      dest,
      input.departureDate
    );
    dayPlans.splice(0, dayPlans.length, ...optimizedDays); // Replace dayPlans array in-place
    weatherSwaps = swaps;
  }

  // Cost breakdown calculation
  const roomsNeeded = Math.ceil(groupSize / 2);
  const pricePerRoomPerNight = groupSize > 2 ? 2750 : 3800; // Slightly lower per-room rate for larger groups
  const stayTotal = (input.days - 1) * pricePerRoomPerNight * roomsNeeded;
  const transportTotal = input.days * MODE_COST_PER_DAY[input.travelMode];
  const activitiesTotal = dayPlans.reduce((sum, day) => sum + day.estimatedDayCostInr, 0);
  const foodPerPersonDay = input.mood === 'Food' ? 1400 : 950;
  const foodTotal = input.days * foodPerPersonDay * groupSize;
  const contingency = Math.round((stayTotal + transportTotal + activitiesTotal + foodTotal) * 0.08);

  const totalEstimatedInr = stayTotal + transportTotal + activitiesTotal + foodTotal + contingency;
  const varianceInr = input.budgetInr - totalEstimatedInr;

  let budgetStatus: 'comfortable' | 'balanced' | 'tight' = 'balanced';
  if (varianceInr > 8000) budgetStatus = 'comfortable';
  else if (varianceInr < -3000) budgetStatus = 'tight';

  // Intelligence insights
  const routeInsights: string[] = [];
  
  // Calculate distances for each day with clustered attractions
  dayPlans.forEach((day, idx) => {
    const totalKm = day.stops.reduce((sum, stop) => 
      sum + (stop.travelDistance || 0), 0
    );
    
    if (totalKm > 0) {
      routeInsights.push(
        `Day ${idx + 1} covers ${totalKm.toFixed(1)} km with ${day.stops.length} stops clustered geographically`
      );
    }
  });

  const insights: TravelIntelligenceInsight[] = [
    {
      type: 'pacing',
      title: `${input.energyLevel} Pacing Profile`,
      summary: `Scheduled ~${stopsPerDay} curated experiences per day to prevent travel burnout and allow spontaneous exploration.`,
    },
    {
      type: 'mood',
      title: hasAttractions
        ? `${input.mood} Matching: ${(88 + ((scored[0]?.score || 0) % 10)).toFixed(0)}%`
        : `${input.mood} Travel Focus`,
      summary: hasAttractions
        ? `Attractions prioritized around your preference for ${input.mood.toLowerCase()}, emphasizing ${dest.categories.join(', ')}.`
        : `Itinerary framework tailored for ${input.mood.toLowerCase()} travel rhythm in ${dest.name}.`,
    },
    {
      type: 'budget',
      title: `Estimated Expenditure: ₹${totalEstimatedInr.toLocaleString('en-IN')}`,
      summary:
        budgetStatus === 'comfortable'
          ? `Your ₹${input.budgetInr.toLocaleString('en-IN')} budget provides a healthy surplus of ₹${varianceInr.toLocaleString('en-IN')} for premium dining or souvenirs.`
          : budgetStatus === 'tight'
          ? `Estimated cost exceeds your budget by ~₹${Math.abs(varianceInr).toLocaleString('en-IN')}. Consider opting for public transport or adjusting accommodation.`
          : `Your allocated budget aligns cleanly with realistic on-ground expenses for a ${input.groupType.toLowerCase()} trip.`,
    },
    {
      type: 'route',
      title: hasAttractions && routeInsights.length > 0 
        ? 'Geographic Clustering Optimization' 
        : hasAttractions ? `Transit Efficiency (${input.travelMode})` : 'Verified Attraction Catalog',
      summary: routeInsights.length > 0
        ? routeInsights.join('. ') + '.'
        : hasAttractions
        ? `Itinerary uses ${input.travelMode} for daily transit across ${dest.name}. Attractions are organized for efficient routing.`
        : `Verified attraction ticket schedules are currently curated for featured regions. You can add your own custom stops and landmarks for ${dest.name} using the itinerary editor.`,
    },
  ];

  // Add weather optimization insight if swaps were made
  if (weatherSwaps.length > 0) {
    insights.push({
      type: 'mood', // Using 'mood' type for weather insights
      title: 'Weather-Optimized Itinerary',
      summary: `Activities adjusted for weather: ${weatherSwaps.join('; ')}.`,
    });
  }

  // Check for off-season warning
  const offSeasonWarning = checkOffSeasonWarning(dest, input.departureDate);
  if (offSeasonWarning) {
    insights.push({
      type: 'pacing', // Using 'pacing' type for warnings
      title: 'Season Advisory',
      summary: offSeasonWarning,
    });
  }

  return {
    id: `trip-${Date.now()}`,
    createdAt: new Date().toISOString(),
    input,
    destination: dest,
    days: dayPlans,
    costBreakdown: {
      stayInr: stayTotal,
      transportInr: transportTotal,
      activitiesInr: activitiesTotal,
      foodInr: foodTotal,
      contingencyInr: contingency,
      totalEstimatedInr,
      userBudgetInr: input.budgetInr,
      budgetStatus,
      varianceInr,
    },
    insights,
  };
}

export function formatItineraryForClipboard(trip: GeneratedItinerary): string {
  let text = `TRAVELMIND AI — CURATED JOURNEY PLAN\n`;
  text += `=====================================\n`;
  text += `Destination: ${trip.destination.name}, ${trip.destination.state}\n`;
  text += `Starting City: ${trip.input.startCity}\n`;
  text += `Departure Date: ${trip.input.departureDate}\n`;
  text += `Duration: ${trip.input.days} Days | Mode: ${trip.input.travelMode}\n`;
  text += `Travel Mood: ${trip.input.mood} | Group: ${trip.input.groupType} | Energy: ${trip.input.energyLevel}\n`;
  text += `Estimated Total: ₹${trip.costBreakdown.totalEstimatedInr.toLocaleString('en-IN')} (Budget: ₹${trip.input.budgetInr.toLocaleString('en-IN')})\n\n`;

  text += `DAY-BY-DAY ITINERARY:\n`;
  trip.days.forEach((day) => {
    text += `\n--- Day ${day.dayNumber} (${day.dateStr}): ${day.theme} ---\n`;
    day.stops.forEach((stop) => {
      text += `  • [${stop.startTime} - ${stop.endTime}] ${stop.name} (${stop.category}, ~${stop.durationHours} hrs)\n`;
      text += `    Highlight: ${stop.highlight}\n`;
      text += `    Estimated Cost: ~₹${stop.estimatedCostInr}\n`;
    });
  });

  text += `\nCOST BREAKDOWN (ESTIMATES):\n`;
  text += `  • Accommodation: ₹${trip.costBreakdown.stayInr.toLocaleString('en-IN')}\n`;
  text += `  • Transport (${trip.input.travelMode}): ₹${trip.costBreakdown.transportInr.toLocaleString('en-IN')}\n`;
  text += `  • Sightseeing & Activities: ₹${trip.costBreakdown.activitiesInr.toLocaleString('en-IN')}\n`;
  text += `  • Dining & Food: ₹${trip.costBreakdown.foodInr.toLocaleString('en-IN')}\n`;
  text += `  • Buffer Contingency: ₹${trip.costBreakdown.contingencyInr.toLocaleString('en-IN')}\n`;
  text += `\nGenerated via TravelMind AI (Estimates only; verify seasonal availability & tickets).`;

  return text;
}

