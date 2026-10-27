# Spec: AI Itinerary Generation and Agentic Copilot

## Overview
Transform TravelMind AI from rule-based planning to AI-powered itinerary generation with an agentic copilot that can intelligently edit trips through natural language commands.

## Goals
1. Generate real attractions for any destination using LLM
2. Cluster attractions geographically for logical daily routes
3. Adapt itineraries based on weather forecasts
4. Enable copilot to edit itineraries via tool calling
5. Provide visual diff preview for all changes

## Current State

### Problems
- Non-curated destinations (IDs: `place-*`) have no attractions → generic placeholders
- Days aren't geographically clustered → inefficient routes
- Weather data fetched but unused in planning
- Copilot is read-only → can't modify trips
- No undo/redo for itinerary changes

### What Works
- Rule-based scoring in `src/utils/plannerLogic.ts`
- Weather API integration in `src/services/realWeatherService.ts`
- Copilot chat in `src/components/TravelCopilot.tsx`
- OpenRouteService for routing

---

## Requirements

### 1. LLM-Generated Attractions for Non-Curated Destinations

#### 1.1 Server Endpoint

**Create:** `api/attractions.ts` (serverless) and `api/_lib/attractions.ts` (handler)

**Endpoint:** `POST /api/attractions`

**Request Schema:**
```typescript
{
  name: string;          // "Kyoto"
  state?: string;        // "Kyoto Prefecture"
  country: string;       // "Japan"
  lat: number;           // 35.0116
  lng: number;           // 135.7681
  mood: MoodType;        // "Culture"
  groupType: GroupType;  // "Couple"
  days: number;          // 5
}
```

**Authentication:** Required (JWT token)

**Rate Limiting:** 10 requests per 10 minutes per user

**Process:**
1. Check cache in `generated_attractions` table first
2. If not cached, call Groq with JSON mode
3. Validate response with Zod schema
4. Filter attractions >50km from destination center
5. Cache valid results
6. Return 8-15 attractions matching `Attraction` interface

**Groq Prompt:**
```typescript
You are a travel planning expert. Generate 8-15 real tourist attractions 
for ${name}, ${country}. Return ONLY valid JSON array matching this schema:

[{
  "name": string,              // Real attraction name
  "category": enum,            // "Adventure" | "Culture" | "Nature" | "Food" | "Relaxation" | "Photography"
  "durationHours": number,     // 1-8 hours
  "estimatedCostInr": number,  // Cost in Indian Rupees
  "timeOfDay": enum,           // "morning" | "afternoon" | "evening" | "sunset"
  "lat": number,               // Precise coordinates
  "lng": number,
  "description": string,       // 1-2 sentences
  "highlight": string,         // Key feature (1 sentence)
  "bestFor": string[]          // ["Couple", "Family", "Solo", "Friends"]
}]

Focus on ${mood} experiences for ${groupType} travelers.
Use real coordinates. Ensure variety across categories and times.
```

**Validation:**
```typescript
const AttractionSchema = z.object({
  name: z.string().min(3).max(100),
  category: z.enum(['Adventure', 'Culture', 'Nature', 'Food', 'Relaxation', 'Photography']),
  durationHours: z.number().min(0.5).max(8),
  estimatedCostInr: z.number().min(0).max(50000),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'sunset']),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  description: z.string().min(10).max(500),
  highlight: z.string().min(10).max(200),
  bestFor: z.array(z.string()).min(1).max(4)
});

const AttractionsResponseSchema = z.array(AttractionSchema).min(8).max(15);
```

**Retry Logic:**
- 1 retry on validation failure with refined prompt
- Fallback to placeholder blocks if both attempts fail

**Distance Filter:**
```typescript
function isWithinRange(
  centerLat: number, 
  centerLng: number, 
  pointLat: number, 
  pointLng: number, 
  maxKm: number = 50
): boolean {
  const R = 6371; // Earth radius in km
  const dLat = toRad(pointLat - centerLat);
  const dLng = toRad(pointLng - centerLng);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(centerLat)) * Math.cos(toRad(pointLat)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance <= maxKm;
}
```

#### 1.2 Caching Layer

**Create:** Supabase migration `migrations/003_generated_attractions.sql`

```sql
CREATE TABLE generated_attractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_key TEXT NOT NULL UNIQUE, -- "35.01_135.77" (rounded to 2 decimals)
  name TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  lat DECIMAL(10, 6) NOT NULL,
  lng DECIMAL(10, 6) NOT NULL,
  attractions JSONB NOT NULL,        -- Array of Attraction objects
  mood TEXT,
  group_type TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_generated_attractions_key ON generated_attractions(location_key);
CREATE INDEX idx_generated_attractions_created ON generated_attractions(created_at DESC);

-- Auto-expire after 30 days
CREATE INDEX idx_generated_attractions_expire ON generated_attractions(created_at) 
WHERE created_at < NOW() - INTERVAL '30 days';
```

**Cache Key:** `${lat.toFixed(2)}_${lng.toFixed(2)}`

**Cache TTL:** 30 days (attractions don't change frequently)

#### 1.3 Client Integration

**Update:** `src/services/attractionsService.ts` (NEW)

```typescript
export async function fetchAIAttractions(params: {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lng: number;
  mood: MoodType;
  groupType: GroupType;
  days: number;
}): Promise<Attraction[]> {
  const token = await getSupabaseToken();
  const response = await fetch('/api/attractions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(params)
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate attractions');
  }
  
  return response.json();
}
```

**Update:** `src/utils/plannerLogic.ts`

```typescript
// In generateTripPlan()
let attractions = destination.attractions || [];

// If no curated attractions and is custom destination
if (attractions.length === 0 && destination.id.startsWith('place-')) {
  try {
    attractions = await fetchAIAttractions({
      name: destination.name,
      state: destination.state,
      country: 'India', // or detect from geocoding
      lat: destination.lat,
      lng: destination.lng,
      mood: input.mood,
      groupType: input.groupType,
      days: input.days
    });
    
    // Mark as AI-generated
    attractions = attractions.map(a => ({
      ...a,
      id: `ai-${a.name.toLowerCase().replace(/\s+/g, '-')}`,
      isAIGenerated: true
    }));
  } catch (error) {
    console.error('Failed to fetch AI attractions:', error);
    // Fallback to placeholder blocks
    attractions = generatePlaceholderAttractions(input.days);
  }
}
```

**Update:** `src/components/ActivitiesItinerary.tsx`

Add badge for AI-generated stops:

```tsx
{stop.isAIGenerated && (
  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 rounded-full">
    <Sparkles className="w-3 h-3" />
    AI-suggested — verify timings
  </span>
)}
```

---

### 2. Geographic Day Clustering

#### 2.1 K-Means Clustering Algorithm

**Create:** `src/utils/geoClustering.ts`

```typescript
interface ClusterableAttraction extends Attraction {
  clusterId?: number;
}

/**
 * Cluster attractions into N days using K-means on lat/lng
 */
export function clusterAttractionsByDay(
  attractions: Attraction[],
  days: number,
  centerLat: number,
  centerLng: number
): Attraction[][] {
  if (attractions.length === 0) return [];
  if (days <= 1) return [attractions];
  
  // K-means clustering
  const clusters = kMeans(attractions, days, centerLat, centerLng);
  
  // Order stops within each cluster by nearest-neighbor
  const orderedClusters = clusters.map(cluster => 
    orderByNearestNeighbor(cluster, centerLat, centerLng)
  );
  
  return orderedClusters;
}

function kMeans(
  attractions: ClusterableAttraction[], 
  k: number,
  centerLat: number,
  centerLng: number
): Attraction[][] {
  // Initialize centroids (seed with k attractions furthest from each other)
  const centroids = initializeCentroids(attractions, k);
  
  let iterations = 0;
  const maxIterations = 50;
  let changed = true;
  
  while (changed && iterations < maxIterations) {
    changed = false;
    
    // Assign each attraction to nearest centroid
    attractions.forEach(attr => {
      const nearestIdx = findNearestCentroid(attr, centroids);
      if (attr.clusterId !== nearestIdx) {
        attr.clusterId = nearestIdx;
        changed = true;
      }
    });
    
    // Recompute centroids
    for (let i = 0; i < k; i++) {
      const clusterAttractions = attractions.filter(a => a.clusterId === i);
      if (clusterAttractions.length > 0) {
        centroids[i] = computeCentroid(clusterAttractions);
      }
    }
    
    iterations++;
  }
  
  // Group by cluster
  const result: Attraction[][] = [];
  for (let i = 0; i < k; i++) {
    result.push(attractions.filter(a => a.clusterId === i));
  }
  
  // Ensure no empty clusters (merge into nearest)
  return result.filter(c => c.length > 0);
}

function orderByNearestNeighbor(
  attractions: Attraction[],
  startLat: number,
  startLng: number
): Attraction[] {
  if (attractions.length <= 1) return attractions;
  
  const ordered: Attraction[] = [];
  const remaining = [...attractions];
  let currentLat = startLat;
  let currentLng = startLng;
  
  while (remaining.length > 0) {
    // Find nearest unvisited attraction
    let nearestIdx = 0;
    let nearestDist = Infinity;
    
    remaining.forEach((attr, idx) => {
      const dist = haversineDistance(currentLat, currentLng, attr.lat, attr.lng);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    });
    
    const nearest = remaining.splice(nearestIdx, 1)[0];
    ordered.push(nearest);
    currentLat = nearest.lat;
    currentLng = nearest.lng;
  }
  
  return ordered;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

#### 2.2 Optional: Real Travel Times

**Update:** `src/utils/geoClustering.ts`

```typescript
/**
 * Add travel time gaps between stops using OpenRouteService matrix
 */
export async function addTravelTimeGaps(
  dayStops: DayStop[],
  token: string
): Promise<DayStop[]> {
  if (dayStops.length <= 1) return dayStops;
  
  const coordinates = dayStops.map(s => [s.lng, s.lat]);
  
  try {
    const matrix = await fetchTravelTimeMatrix(coordinates, token);
    
    // Add travel time to each stop
    const withTravelTimes = dayStops.map((stop, i) => {
      if (i === 0) return stop; // First stop has no travel time
      
      const travelMinutes = Math.round(matrix.durations[i-1][i] / 60);
      return {
        ...stop,
        travelTimeMinutes,
        travelDistance: matrix.distances[i-1][i] / 1000 // km
      };
    });
    
    return withTravelTimes;
  } catch (error) {
    console.warn('Failed to fetch travel times, using estimates:', error);
    return dayStops;
  }
}

async function fetchTravelTimeMatrix(
  coordinates: number[][],
  token: string
): Promise<{ durations: number[][]; distances: number[][] }> {
  const response = await fetch('/api/routing/matrix', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      coordinates,
      profile: 'driving-car'
    })
  });
  
  return response.json();
}
```

**Create:** `api/routing/matrix.ts` (NEW endpoint)

Proxies OpenRouteService matrix API with authentication.

#### 2.3 Update Insights

**Update:** `src/utils/plannerLogic.ts`

Re-enable geographic clustering insight:

```typescript
// In generateInsights()
const routeInsights: string[] = [];

itinerary.days.forEach((day, idx) => {
  const totalKm = day.stops.reduce((sum, stop) => 
    sum + (stop.travelDistance || 0), 0
  );
  
  if (totalKm > 0) {
    routeInsights.push(
      `Day ${idx + 1} covers ${totalKm.toFixed(1)} km with ${day.stops.length} stops clustered geographically`
    );
  }
});

if (routeInsights.length > 0) {
  insights.push({
    type: 'route',
    text: routeInsights.join('. '),
    icon: 'map'
  });
}
```

---

### 3. Weather-Aware Planning

#### 3.1 Weather-Based Activity Swapping

**Update:** `src/utils/plannerLogic.ts`

```typescript
interface WeatherForecast {
  date: string;
  rainProbability: number; // 0-100
  temp: number;
  conditions: string;
}

/**
 * Adjust itinerary based on weather forecast
 */
async function applyWeatherOptimizations(
  days: DayPlan[],
  destination: Destination,
  departureDate: string
): Promise<{ days: DayPlan[]; swaps: string[] }> {
  const swaps: string[] = [];
  
  try {
    const forecast = await fetchWeatherForecast(
      destination.lat,
      destination.lng,
      departureDate,
      days.length
    );
    
    // Identify rainy days (>60% probability)
    const rainyDayIndices = forecast
      .map((f, i) => f.rainProbability > 60 ? i : -1)
      .filter(i => i !== -1);
    
    if (rainyDayIndices.length === 0) return { days, swaps };
    
    // Find outdoor activities on rainy days
    rainyDayIndices.forEach(rainyIdx => {
      const rainyDay = days[rainyIdx];
      const outdoorStops = rainyDay.stops.filter(s => 
        ['Adventure', 'Nature', 'Photography'].includes(s.category)
      );
      
      if (outdoorStops.length === 0) return;
      
      // Find dry days with indoor activities to swap
      days.forEach((dryDay, dryIdx) => {
        if (rainyDayIndices.includes(dryIdx)) return;
        
        const indoorStops = dryDay.stops.filter(s =>
          ['Culture', 'Food', 'Relaxation'].includes(s.category)
        );
        
        // Swap one outdoor with one indoor
        if (outdoorStops.length > 0 && indoorStops.length > 0) {
          const outdoor = outdoorStops.pop()!;
          const indoor = indoorStops.pop()!;
          
          // Swap
          const rainyStopIdx = rainyDay.stops.indexOf(outdoor);
          const dryStopIdx = dryDay.stops.indexOf(indoor);
          
          rainyDay.stops[rainyStopIdx] = indoor;
          dryDay.stops[dryStopIdx] = outdoor;
          
          swaps.push(
            `Moved "${outdoor.name}" to Day ${dryIdx + 1} (better weather) ` +
            `and "${indoor.name}" to Day ${rainyIdx + 1} (rain expected ${forecast[rainyIdx].rainProbability}%)`
          );
        }
      });
    });
    
  } catch (error) {
    console.warn('Weather optimization failed:', error);
  }
  
  return { days, swaps };
}
```

#### 3.2 Off-Season Warning

**Update:** `src/utils/plannerLogic.ts`

```typescript
function checkOffSeasonWarning(
  destination: Destination,
  departureDate: string
): string | null {
  const month = new Date(departureDate).toLocaleString('en', { month: 'long' });
  const bestMonths = destination.bestMonths || '';
  
  if (!bestMonths.includes(month)) {
    return `⚠️ ${month} is outside the recommended travel season (${bestMonths}). ` +
           `Expect different weather conditions and possible closures.`;
  }
  
  return null;
}
```

#### 3.3 Add Weather Insights

```typescript
// In generateInsights()
if (swaps.length > 0) {
  insights.push({
    type: 'weather',
    text: `Itinerary optimized for weather: ${swaps.join('; ')}`,
    icon: 'cloud-rain'
  });
}

const offSeasonWarning = checkOffSeasonWarning(destination, input.departureDate);
if (offSeasonWarning) {
  insights.push({
    type: 'warning',
    text: offSeasonWarning,
    icon: 'alert-triangle'
  });
}
```

---

### 4. Agentic Copilot with Tool Calling

#### 4.1 Itinerary Context in Copilot

**Update:** `src/services/aiCopilotService.ts`

```typescript
interface CompactItinerary {
  destination: string;
  days: number;
  budget: number;
  dailyPlans: Array<{
    day: number;
    date: string;
    stops: Array<{
      order: number;
      name: string;
      category: string;
      time: string;
      duration: number;
      cost: number;
    }>;
    totalCost: number;
  }>;
  costBreakdown: {
    transport: number;
    accommodation: number;
    food: number;
    activities: number;
    total: number;
  };
}

function compactifyItinerary(itinerary: GeneratedItinerary): CompactItinerary {
  return {
    destination: `${itinerary.destination.name}, ${itinerary.destination.state}`,
    days: itinerary.input.days,
    budget: itinerary.input.budgetInr,
    dailyPlans: itinerary.days.map((day, idx) => ({
      day: idx + 1,
      date: day.date,
      stops: day.stops.map((stop, order) => ({
        order,
        name: stop.name,
        category: stop.category,
        time: stop.time,
        duration: stop.durationHours,
        cost: stop.estimatedCost
      })),
      totalCost: day.stops.reduce((sum, s) => sum + s.estimatedCost, 0)
    })),
    costBreakdown: {
      transport: itinerary.costBreakdown.transportCost,
      accommodation: itinerary.costBreakdown.accommodationCost,
      food: itinerary.costBreakdown.foodCost,
      activities: itinerary.costBreakdown.activitiesCost,
      total: itinerary.costBreakdown.totalCost
    }
  };
}
```

#### 4.2 Tool Definitions

**Update:** `api/_lib/chat.ts`

```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'replace_stop',
      description: 'Replace a specific stop in the itinerary with a new activity',
      parameters: {
        type: 'object',
        properties: {
          day: { type: 'number', description: 'Day number (1-indexed)' },
          order: { type: 'number', description: 'Stop order in that day (0-indexed)' },
          newStop: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string', enum: ['Adventure', 'Culture', 'Nature', 'Food', 'Relaxation', 'Photography'] },
              duration: { type: 'number' },
              cost: { type: 'number' }
            },
            required: ['name', 'category', 'duration', 'cost']
          }
        },
        required: ['day', 'order', 'newStop']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'remove_stop',
      description: 'Remove a stop from the itinerary',
      parameters: {
        type: 'object',
        properties: {
          day: { type: 'number' },
          order: { type: 'number' }
        },
        required: ['day', 'order']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_stop',
      description: 'Add a new stop to a specific day',
      parameters: {
        type: 'object',
        properties: {
          day: { type: 'number' },
          stop: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              duration: { type: 'number' },
              cost: { type: 'number' },
              time: { type: 'string' }
            },
            required: ['name', 'category', 'duration', 'cost']
          }
        },
        required: ['day', 'stop']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'move_stop',
      description: 'Move a stop from one day/position to another',
      parameters: {
        type: 'object',
        properties: {
          fromDay: { type: 'number' },
          fromOrder: { type: 'number' },
          toDay: { type: 'number' },
          toOrder: { type: 'number' }
        },
        required: ['fromDay', 'fromOrder', 'toDay', 'toOrder']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'adjust_budget',
      description: 'Adjust itinerary to meet a target budget by swapping to cheaper options',
      parameters: {
        type: 'object',
        properties: {
          targetBudget: { type: 'number', description: 'Target budget in INR' }
        },
        required: ['targetBudget']
      }
    }
  }
];
```

#### 4.3 Tool Execution

**Update:** `api/_lib/chat.ts`

```typescript
async function handleToolCall(
  toolName: string,
  args: any,
  itinerary: CompactItinerary
): Promise<{ success: boolean; changes: ItineraryChange[]; message: string }> {
  const changes: ItineraryChange[] = [];
  
  switch (toolName) {
    case 'replace_stop':
      changes.push({
        type: 'replace',
        day: args.day,
        order: args.order,
        oldStop: itinerary.dailyPlans[args.day - 1].stops[args.order],
        newStop: args.newStop
      });
      break;
      
    case 'remove_stop':
      changes.push({
        type: 'remove',
        day: args.day,
        order: args.order,
        stop: itinerary.dailyPlans[args.day - 1].stops[args.order]
      });
      break;
      
    case 'add_stop':
      changes.push({
        type: 'add',
        day: args.day,
        stop: args.stop
      });
      break;
      
    case 'move_stop':
      const stop = itinerary.dailyPlans[args.fromDay - 1].stops[args.fromOrder];
      changes.push({
        type: 'move',
        fromDay: args.fromDay,
        fromOrder: args.fromOrder,
        toDay: args.toDay,
        toOrder: args.toOrder,
        stop
      });
      break;
      
    case 'adjust_budget':
      // Find most expensive stops and suggest cheaper alternatives
      const expensiveStops = findExpensiveStops(itinerary);
      expensiveStops.forEach(({ day, order, stop }) => {
        changes.push({
          type: 'replace',
          day,
          order,
          oldStop: stop,
          newStop: { ...stop, cost: stop.cost * 0.6, name: `${stop.name} (budget option)` }
        });
      });
      break;
  }
  
  return {
    success: true,
    changes,
    message: `Proposed ${changes.length} change(s) to your itinerary`
  };
}
```

#### 4.4 Client-Side Diff Preview

**Update:** `src/components/TravelCopilot.tsx`

```typescript
interface ItineraryChange {
  type: 'replace' | 'remove' | 'add' | 'move';
  day: number;
  order?: number;
  oldStop?: any;
  newStop?: any;
  stop?: any;
  fromDay?: number;
  fromOrder?: number;
  toDay?: number;
  toOrder?: number;
}

function ItineraryDiffPreview({ 
  changes, 
  onApply, 
  onDiscard 
}: { 
  changes: ItineraryChange[];
  onApply: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <FileEdit className="w-5 h-5 text-blue-600" />
        Proposed Changes
      </h3>
      
      <div className="space-y-2 mb-4">
        {changes.map((change, idx) => (
          <div key={idx} className="bg-white rounded-lg p-3 text-sm">
            {change.type === 'replace' && (
              <>
                <div className="text-red-600 line-through">
                  Day {change.day}, Stop {change.order + 1}: {change.oldStop.name} (₹{change.oldStop.cost})
                </div>
                <div className="text-green-600">
                  → {change.newStop.name} (₹{change.newStop.cost})
                </div>
              </>
            )}
            
            {change.type === 'remove' && (
              <div className="text-red-600 line-through">
                Day {change.day}, Stop {change.order + 1}: {change.stop.name} (removed)
              </div>
            )}
            
            {change.type === 'add' && (
              <div className="text-green-600">
                + Day {change.day}: {change.stop.name} (₹{change.stop.cost})
              </div>
            )}
            
            {change.type === 'move' && (
              <div className="text-blue-600">
                Move {change.stop.name} from Day {change.fromDay} to Day {change.toDay}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={onApply}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Apply Changes
        </button>
        <button
          onClick={onDiscard}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
```

#### 4.5 Apply Changes to Itinerary

**Update:** `src/components/TripPlanner.tsx`

```typescript
function applyItineraryChanges(
  itinerary: GeneratedItinerary,
  changes: ItineraryChange[]
): GeneratedItinerary {
  const updated = JSON.parse(JSON.stringify(itinerary)); // Deep clone
  
  changes.forEach(change => {
    const day = updated.days[change.day - 1];
    
    switch (change.type) {
      case 'replace':
        day.stops[change.order] = {
          ...day.stops[change.order],
          ...change.newStop
        };
        break;
        
      case 'remove':
        day.stops.splice(change.order, 1);
        break;
        
      case 'add':
        day.stops.push(change.stop);
        break;
        
      case 'move':
        const stop = updated.days[change.fromDay - 1].stops.splice(change.fromOrder, 1)[0];
        updated.days[change.toDay - 1].stops.splice(change.toOrder, 0, stop);
        break;
    }
  });
  
  // Recompute costs
  updated.costBreakdown = recalculateCosts(updated);
  
  return updated;
}
```

#### 4.6 Undo/Redo System

**Update:** `src/components/TripPlanner.tsx`

```typescript
const [itineraryHistory, setItineraryHistory] = useState<GeneratedItinerary[]>([]);
const [historyIndex, setHistoryIndex] = useState<number>(-1);

function saveToHistory(itinerary: GeneratedItinerary) {
  const newHistory = itineraryHistory.slice(0, historyIndex + 1);
  newHistory.push(itinerary);
  
  // Keep last 10 versions
  if (newHistory.length > 10) {
    newHistory.shift();
  }
  
  setItineraryHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
}

function undo() {
  if (historyIndex > 0) {
    setHistoryIndex(historyIndex - 1);
    setItinerary(itineraryHistory[historyIndex - 1]);
  }
}

function redo() {
  if (historyIndex < itineraryHistory.length - 1) {
    setHistoryIndex(historyIndex + 1);
    setItinerary(itineraryHistory[historyIndex + 1]);
  }
}
```

#### 4.7 Server-Sent Events (SSE) Streaming

**Update:** `api/_lib/chat.ts`

```typescript
export async function handleChatStream(
  message: string,
  itinerary: CompactItinerary | undefined,
  conversationHistory: ChatMessage[],
  userId: string
): Promise<ReadableStream> {
  const encoder = new TextEncoder();
  
  return new ReadableStream({
    async start(controller) {
      try {
        const stream = await groq.chat.completions.create({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
          messages: buildMessages(message, itinerary, conversationHistory),
          tools: itinerary ? tools : undefined,
          stream: true
        });
        
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          const toolCalls = chunk.choices[0]?.delta?.tool_calls;
          
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`)
            );
          }
          
          if (toolCalls) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'tool', toolCalls })}\n\n`)
            );
          }
        }
        
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
}
```

**Update:** `src/services/aiCopilotService.ts`

```typescript
export async function streamCopilotResponse(
  message: string,
  itinerary: GeneratedItinerary | undefined,
  conversationHistory: ChatMessage[],
  onChunk: (chunk: string) => void,
  onToolCall: (changes: ItineraryChange[]) => void
): Promise<void> {
  const token = await getSupabaseToken();
  
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message,
      itinerary: itinerary ? compactifyItinerary(itinerary) : undefined,
      conversationHistory
    })
  });
  
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        
        try {
          const parsed = JSON.parse(data);
          
          if (parsed.type === 'content') {
            onChunk(parsed.content);
          } else if (parsed.type === 'tool') {
            const changes = await executeToolCalls(parsed.toolCalls);
            onToolCall(changes);
          }
        } catch (e) {
          console.warn('Failed to parse SSE data:', e);
        }
      }
    }
  }
}
```

---

### 5. Tests

#### 5.1 Clustering Tests

**Create:** `src/utils/geoClustering.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { clusterAttractionsByDay, orderByNearestNeighbor } from './geoClustering';

describe('clusterAttractionsByDay', () => {
  it('should not assign a stop to multiple days', () => {
    const attractions = generateMockAttractions(20);
    const clusters = clusterAttractionsByDay(attractions, 3, 35, 139);
    
    const allStops = clusters.flat();
    const uniqueStops = new Set(allStops.map(s => s.id));
    
    expect(allStops.length).toBe(uniqueStops.size);
  });
  
  it('should assign all stops to some day', () => {
    const attractions = generateMockAttractions(15);
    const clusters = clusterAttractionsByDay(attractions, 4, 35, 139);
    
    const totalAssigned = clusters.reduce((sum, c) => sum + c.length, 0);
    expect(totalAssigned).toBe(attractions.length);
  });
  
  it('should create exactly N clusters when possible', () => {
    const attractions = generateMockAttractions(20);
    const clusters = clusterAttractionsByDay(attractions, 5, 35, 139);
    
    expect(clusters.length).toBeLessThanOrEqual(5);
    expect(clusters.every(c => c.length > 0)).toBe(true);
  });
});

describe('orderByNearestNeighbor', () => {
  it('should order stops by proximity', () => {
    const attractions = [
      { id: '1', lat: 35.0, lng: 139.0, name: 'A' },
      { id: '2', lat: 35.1, lng: 139.1, name: 'B' },
      { id: '3', lat: 35.05, lng: 139.05, name: 'C' }
    ];
    
    const ordered = orderByNearestNeighbor(attractions as any, 35.0, 139.0);
    
    // First should be closest to start (35, 139)
    expect(ordered[0].id).toBe('1');
  });
});
```

#### 5.2 Weather Swap Tests

**Create:** `src/utils/plannerLogic.test.ts` (add to existing)

```typescript
describe('applyWeatherOptimizations', () => {
  it('should move outdoor activities from rainy days to dry days', async () => {
    const days = [
      {
        day: 1,
        stops: [
          { name: 'Museum', category: 'Culture' },
          { name: 'Hiking', category: 'Adventure' }
        ]
      },
      {
        day: 2,
        stops: [
          { name: 'Beach', category: 'Nature' },
          { name: 'Market', category: 'Food' }
        ]
      }
    ];
    
    const forecast = [
      { date: '2024-01-01', rainProbability: 10 },
      { date: '2024-01-02', rainProbability: 80 }
    ];
    
    const { days: optimized, swaps } = await applyWeatherOptimizations(
      days,
      mockDestination,
      '2024-01-01'
    );
    
    expect(swaps.length).toBeGreaterThan(0);
    
    // Day 2 (rainy) should now have more indoor activities
    const day2Outdoor = optimized[1].stops.filter(s => 
      ['Adventure', 'Nature'].includes(s.category)
    );
    expect(day2Outdoor.length).toBeLessThan(days[1].stops.filter(s =>
      ['Adventure', 'Nature'].includes(s.category)
    ).length);
  });
});
```

#### 5.3 LLM Validation Tests

**Create:** `api/_lib/attractions.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { AttractionsResponseSchema } from './schemas';

describe('Attractions Zod Validation', () => {
  it('should accept valid attraction array', () => {
    const valid = [
      {
        name: 'Fushimi Inari Shrine',
        category: 'Culture',
        durationHours: 2,
        estimatedCostInr: 0,
        timeOfDay: 'morning',
        lat: 34.9671,
        lng: 135.7727,
        description: 'Famous shrine with thousands of red torii gates',
        highlight: 'Stunning pathway of torii gates up the mountain',
        bestFor: ['Solo', 'Photography', 'Culture']
      }
    ];
    
    const result = AttractionsResponseSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
  
  it('should reject invalid category', () => {
    const invalid = [
      {
        name: 'Test',
        category: 'InvalidCategory',
        durationHours: 2,
        estimatedCostInr: 0,
        timeOfDay: 'morning',
        lat: 35,
        lng: 139,
        description: 'Test',
        highlight: 'Test',
        bestFor: ['Solo']
      }
    ];
    
    const result = AttractionsResponseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
  
  it('should reject array with too few items', () => {
    const tooFew = [
      {
        name: 'Test',
        category: 'Culture',
        durationHours: 2,
        estimatedCostInr: 0,
        timeOfDay: 'morning',
        lat: 35,
        lng: 139,
        description: 'Test',
        highlight: 'Test',
        bestFor: ['Solo']
      }
    ];
    
    const result = AttractionsResponseSchema.safeParse(tooFew);
    expect(result.success).toBe(false); // Min 8 required
  });
});
```

#### 5.4 Copilot Tool Tests

**Create:** `src/utils/itineraryEditing.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { applyItineraryChanges } from './itineraryEditing';

describe('applyItineraryChanges', () => {
  it('should replace a stop correctly', () => {
    const itinerary = createMockItinerary();
    const changes = [{
      type: 'replace',
      day: 1,
      order: 0,
      oldStop: itinerary.days[0].stops[0],
      newStop: { name: 'New Activity', cost: 500 }
    }];
    
    const updated = applyItineraryChanges(itinerary, changes);
    
    expect(updated.days[0].stops[0].name).toBe('New Activity');
    expect(updated.days[0].stops[0].cost).toBe(500);
  });
  
  it('should remove a stop correctly', () => {
    const itinerary = createMockItinerary();
    const originalLength = itinerary.days[0].stops.length;
    
    const changes = [{
      type: 'remove',
      day: 1,
      order: 1
    }];
    
    const updated = applyItineraryChanges(itinerary, changes);
    
    expect(updated.days[0].stops.length).toBe(originalLength - 1);
  });
  
  it('should add a stop correctly', () => {
    const itinerary = createMockItinerary();
    const originalLength = itinerary.days[0].stops.length;
    
    const changes = [{
      type: 'add',
      day: 1,
      stop: { name: 'New Stop', cost: 300, category: 'Food' }
    }];
    
    const updated = applyItineraryChanges(itinerary, changes);
    
    expect(updated.days[0].stops.length).toBe(originalLength + 1);
    expect(updated.days[0].stops[originalLength].name).toBe('New Stop');
  });
  
  it('should move a stop between days', () => {
    const itinerary = createMockItinerary();
    const stopToMove = itinerary.days[0].stops[0];
    
    const changes = [{
      type: 'move',
      fromDay: 1,
      fromOrder: 0,
      toDay: 2,
      toOrder: 0
    }];
    
    const updated = applyItineraryChanges(itinerary, changes);
    
    expect(updated.days[1].stops[0].name).toBe(stopToMove.name);
    expect(updated.days[0].stops.length).toBe(itinerary.days[0].stops.length - 1);
  });
  
  it('should recalculate costs after changes', () => {
    const itinerary = createMockItinerary();
    const changes = [{
      type: 'replace',
      day: 1,
      order: 0,
      newStop: { ...itinerary.days[0].stops[0], cost: 9999 }
    }];
    
    const updated = applyItineraryChanges(itinerary, changes);
    
    expect(updated.costBreakdown.totalCost).toBeGreaterThan(
      itinerary.costBreakdown.totalCost
    );
  });
});
```

---

## Acceptance Criteria

### Functional
- [ ] Searching "Kyoto" produces 8-15 real attractions with names and locations
- [ ] AI-generated attractions appear on map with "AI-suggested" badge
- [ ] Multi-day trips cluster attractions geographically (no ping-ponging)
- [ ] Attractions ordered within day by nearest-neighbor
- [ ] Rainy days prefer indoor activities (Culture, Food)
- [ ] Off-season warning displays when applicable
- [ ] Copilot receives full itinerary context
- [ ] Asking "make day 2 cheaper" shows diff with cost changes
- [ ] "Apply changes" updates itinerary and recalculates costs
- [ ] "Discard" cancels proposed changes
- [ ] Undo/redo works (last 10 versions)
- [ ] Copilot responses stream (SSE)

### Technical
- [ ] `npm run lint` passes (0 TypeScript errors)
- [ ] `npm run test` passes (all tests green)
- [ ] `npm run build` succeeds
- [ ] `/api/attractions` requires authentication (401 if not logged in)
- [ ] LLM outputs validated with Zod
- [ ] Invalid LLM output triggers retry
- [ ] Attractions cached in Supabase (30-day TTL)
- [ ] Distance filter removes attractions >50km away
- [ ] Tool calls return structured changes
- [ ] SSE streaming works without buffering

### User Experience
- [ ] Search non-curated destination → real attractions appear
- [ ] Plan 7-day trip → days are geographically sensible
- [ ] Rainy forecast → indoor activities suggested for those days
- [ ] Chat "swap day 1 and day 2" → copilot proposes move operations
- [ ] Apply changes → itinerary updates instantly
- [ ] Undo → reverts to previous version
- [ ] Streaming feels responsive (< 500ms first token)

---

## Implementation Order

### Phase 1: LLM Attractions (HIGH)
1. Create `/api/attractions` endpoint with Groq integration
2. Add Zod validation schemas
3. Implement distance filtering
4. Create Supabase migration for caching
5. Integrate into `generateTripPlan()`
6. Add "AI-suggested" badge in UI

### Phase 2: Geographic Clustering (HIGH)
1. Implement k-means clustering algorithm
2. Add nearest-neighbor ordering
3. Optional: Add travel time matrix API
4. Update insights with route info
5. Add clustering tests

### Phase 3: Weather Optimization (MEDIUM)
1. Fetch forecast in planning flow
2. Implement activity swapping logic
3. Add off-season warnings
4. Update insights
5. Add weather swap tests

### Phase 4: Agentic Copilot (HIGH)
1. Send compact itinerary to copilot
2. Define tool schemas
3. Implement tool execution handlers
4. Build diff preview component
5. Add apply/discard functionality
6. Implement undo/redo system
7. Add SSE streaming
8. Add tool execution tests

### Phase 5: Testing & Polish (MEDIUM)
1. Add all unit tests
2. Integration testing
3. Manual testing with various destinations
4. Performance optimization
5. Documentation updates

---

## Dependencies to Add

```json
{
  "dependencies": {
    // Already have: zod
  }
}
```

No new dependencies needed! 🎉

---

## Environment Variables

**Add to `.env.example`:**

```bash
# Already exist:
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b

# OpenRouteService for travel times (optional)
OPENROUTE_API_KEY=your_openroute_key
```

---

## Testing Strategy

### Unit Tests
- K-means clustering algorithm
- Nearest-neighbor ordering
- Distance filtering
- Weather swap logic
- Zod validation
- Tool execution (replace, remove, add, move)
- Cost recalculation

### Integration Tests
- End-to-end attraction generation
- Clustering + ordering pipeline
- Copilot tool call execution
- SSE streaming

### Manual Testing
- Search "Kyoto" → verify real attractions
- Plan 14-day trip → verify geographic clustering
- Check rainy day → verify indoor preference
- Chat "make it cheaper" → verify budget adjustment
- Test undo/redo → verify state management

---

## Success Metrics

- **Coverage:** Any city worldwide has attractions
- **Quality:** 90%+ of AI attractions are real places
- **UX:** Geographic clustering reduces daily travel by 30%+
- **Intelligence:** Weather swaps prevent 80%+ outdoor activities on rainy days
- **Copilot:** 90%+ of edit requests produce valid diffs
- **Performance:** First token streams in <500ms

---

## Timeline Estimate

- Phase 1 (LLM Attractions): 4-5 hours
- Phase 2 (Clustering): 3-4 hours
- Phase 3 (Weather): 2-3 hours
- Phase 4 (Agentic Copilot): 5-6 hours
- Phase 5 (Testing): 3-4 hours

**Total: 17-22 hours** of focused development

---

## Migration Notes

### Breaking Changes
- None (all new features, backwards compatible)

### User Impact
- **Positive:** Better itineraries for all destinations
- **Positive:** Smarter, more capable copilot
- **Positive:** Weather-aware planning
- **Neutral:** May see "AI-suggested" badges on some stops

---

## Future Enhancements (Post-Spec)

1. **Multi-modal LLM** - Use vision models to identify attractions from photos
2. **Real-time pricing** - Fetch actual ticket prices via APIs
3. **Collaborative editing** - Multiple users edit same trip
4. **Voice commands** - "Hey TravelMind, make day 2 more relaxing"
5. **AR navigation** - Overlay route on camera view
6. **Local guides** - Connect with human guides in destination

---

This spec transforms TravelMind AI into a truly intelligent travel companion! 🚀✨
