# Implementation Plan: AI-Powered Itinerary Generation and Agentic Copilot

## Project Context Summary

**Tech Stack:**
- React 19 + TypeScript (strict mode)
- Vite build system
- Supabase (auth + PostgreSQL with RLS)
- Groq AI (model: `openai/gpt-oss-120b`)
- Express dev server (port 3001) + Vercel serverless functions
- Vitest for testing
- Zod for validation

**Existing Architecture:**
- API handlers in `api/_lib/` (shared between dev server and serverless)
- Rate limiting via in-memory `rateLimiter.ts` (20 chat/10min, 60 routing/10min)
- JWT auth via `api/_lib/supabase.ts`
- Rule-based itinerary generation in `src/utils/plannerLogic.ts`
- Copilot UI in `src/components/TravelCopilot.tsx`
- Weather service exists in `src/services/realWeatherService.ts` (Open-Meteo API)

**Key Findings:**
- Current `plannerLogic.ts` uses `scoreAttraction()` for rule-based planning
- Custom destinations (IDs starting with `place-*`) get placeholder "exploratory blocks"
- Weather data is fetched but not used in itinerary optimization
- Copilot is read-only (no tool calling, no itinerary modifications)
- No geographic clustering (attractions aren't grouped by proximity)
- Tests exist: `plannerLogic.test.ts`, `searchServices.test.ts`, `weatherService.test.ts`
- Database migration pattern: numbered SQL files in `migrations/`

---

## Phase 1: LLM-Generated Attractions Endpoint

### 1.1 Create Database Migration for Attractions Cache

**Create:** `migrations/003_generated_attractions.sql`

**Purpose:** Cache LLM-generated attractions to reduce API costs and latency.

**Schema:**
```sql
CREATE TABLE generated_attractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_key TEXT NOT NULL UNIQUE,  -- "lat_lng" rounded to 2 decimals
  name TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  lat DECIMAL(10, 6) NOT NULL,
  lng DECIMAL(10, 6) NOT NULL,
  mood TEXT,
  group_type TEXT,
  attractions JSONB NOT NULL,  -- Array of Attraction objects
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_generated_attractions_key ON generated_attractions(location_key);
CREATE INDEX idx_generated_attractions_created ON generated_attractions(created_at DESC);
```

**Cache TTL:** 30 days (attractions don't change frequently)

**Verification:** Run migration in Supabase SQL Editor and confirm table exists with `SELECT * FROM generated_attractions LIMIT 1;`

---

### 1.2 Create Zod Schema for Attraction Validation

**Update:** `api/_lib/schemas.ts`

Add:
```typescript
export const AttractionSchema = z.object({
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

export const AttractionsRequestSchema = z.object({
  name: z.string().min(1),
  state: z.string().optional(),
  country: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  mood: z.enum(['Adventure', 'Photography', 'Food', 'Romantic', 'Peaceful', 'Culture']),
  groupType: z.enum(['Solo', 'Couple', 'Friends', 'Family']),
  days: z.number().min(1).max(14)
});

export type AttractionsRequest = z.infer<typeof AttractionsRequestSchema>;
export type AttractionResponse = z.infer<typeof AttractionSchema>;
```

**Files:** `api/_lib/schemas.ts`

**Verification:** `npm run lint` passes without errors.

---

### 1.3 Create Attractions Handler with Groq Integration

**Create:** `api/_lib/attractions.ts`

**Key functions:**
- `handleAttractionsRequest()`: Main handler with auth, rate limiting, validation
- `generateAttractions()`: Calls Groq with JSON mode + retry logic
- `haversineDistance()`: Filter attractions >50km from center
- `getCacheKey()`: Generate location key from rounded lat/lng
- `checkCache()` and `saveCache()`: Supabase cache operations

**Groq Prompt Template:**
```typescript
You are a travel expert. Generate 8-15 real tourist attractions for ${name}, ${country}.
Return ONLY valid JSON array matching this schema:
[{
  "name": string,
  "category": "Adventure"|"Culture"|"Nature"|"Food"|"Relaxation"|"Photography",
  "durationHours": number (0.5-8),
  "estimatedCostInr": number,
  "timeOfDay": "morning"|"afternoon"|"evening"|"sunset",
  "lat": number,
  "lng": number,
  "description": string (1-2 sentences),
  "highlight": string (key feature, 1 sentence),
  "bestFor": string[] (e.g., ["Couple", "Solo"])
}]

Focus on ${mood} experiences for ${groupType} travelers. Use precise coordinates. 
Ensure variety across categories and times.
```

**Rate Limit:** Add `attractions: { maxRequests: 10, windowMs: 600000 }` to `RATE_LIMITS` in `rateLimiter.ts`.

**Retry Logic:** On validation failure, retry once with refined prompt: "Previous response was invalid. Ensure all fields match the exact schema. Return ONLY valid JSON."

**Files:** `api/_lib/attractions.ts`, `api/_lib/rateLimiter.ts`

**Verification:** Unit test with mock Groq response, verify schema validation catches invalid data.

---

### 1.4 Create Serverless Function Wrapper

**Create:** `api/attractions.ts`

**Content:**
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAttractionsRequest } from './_lib/attractions.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const result = await handleAttractionsRequest({
    ...req.body,
    token
  });

  return res.status(result.status).json(
    result.success ? { attractions: result.attractions } : { error: result.error }
  );
}
```

**Files:** `api/attractions.ts`

**Verification:** Start dev server, POST to `/api/attractions` with test payload, confirm 401 without token.

---

### 1.5 Create Client Service for Attractions

**Create:** `src/services/attractionsService.ts`

**Functions:**
- `fetchAIAttractions()`: POST to `/api/attractions` with JWT token
- Error handling with user-friendly messages

**Files:** `src/services/attractionsService.ts`

**Verification:** Call from React component, verify network request in DevTools.

---

### 1.6 Update Planner Logic to Use AI Attractions

**Update:** `src/utils/plannerLogic.ts`

**Changes:**
1. In `generateTripPlan()`, after finding destination:
   ```typescript
   let attractions = destination.attractions || [];
   
   if (attractions.length === 0 && destination.id.startsWith('place-')) {
     try {
       const aiAttractions = await fetchAIAttractions({
         name: destination.name,
         state: destination.state || '',
         country: 'India', // or extract from destination metadata
         lat: destination.lat,
         lng: destination.lng,
         mood: input.mood,
         groupType: input.groupType,
         days: input.days
       });
       
       attractions = aiAttractions.map(a => ({
         ...a,
         id: `ai-${a.name.toLowerCase().replace(/\s+/g, '-')}`,
         isAIGenerated: true
       }));
     } catch (error) {
       console.error('AI attractions fetch failed:', error);
       // Fallback to existing placeholder logic
     }
   }
   ```

2. Update `Attraction` interface in `src/data/destinations.ts` to add `isAIGenerated?: boolean`

**Files:** `src/utils/plannerLogic.ts`, `src/data/destinations.ts`

**Verification:** Generate itinerary for custom destination, verify attractions appear on map.

---

### 1.7 Add AI Badge to Itinerary UI

**Update:** `src/components/ActivitiesItinerary.tsx`

**Add badge:**
```tsx
{stop.isAIGenerated && (
  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 rounded-full">
    <Sparkles className="w-3 h-3" />
    AI-suggested — verify timings
  </span>
)}
```

**Files:** `src/components/ActivitiesItinerary.tsx`

**Verification:** Visual check in browser for custom destination itinerary.

---

## Phase 2: Geographic Day Clustering

### 2.1 Create Clustering Utility

**Create:** `src/utils/geoClustering.ts`

**Key functions:**
- `clusterAttractionsByDay(attractions, days, centerLat, centerLng)`: K-means clustering
- `kMeans()`: K-means algorithm implementation
- `initializeCentroids()`: Seed with farthest points (k-means++)
- `findNearestCentroid()`: Assign attractions to clusters
- `computeCentroid()`: Recalculate cluster centers
- `orderByNearestNeighbor(cluster, startLat, startLng)`: TSP-style ordering within day
- `haversineDistance(lat1, lng1, lat2, lng2)`: Great-circle distance in km

**Algorithm:**
1. Initialize k centroids using k-means++ (pick first random, then pick points furthest from existing centroids)
2. Iterate (max 50 iterations):
   - Assign each attraction to nearest centroid
   - Recompute centroids as mean of assigned attractions
   - Stop if no assignments changed
3. Order each cluster using nearest-neighbor from hotel/center

**Files:** `src/utils/geoClustering.ts`

**Verification:** Unit tests in `src/utils/geoClustering.test.ts`:
- Test: No attraction assigned to multiple days
- Test: All attractions are assigned
- Test: Single-day returns input unchanged
- Test: Empty attractions returns empty array

---

### 2.2 Optional: Add Travel Time Calculation

**Update:** `src/utils/geoClustering.ts`

**Add function:**
```typescript
export async function addTravelTimeGaps(
  dayStops: ItineraryStop[],
  token: string
): Promise<ItineraryStop[]> {
  if (dayStops.length <= 1) return dayStops;
  
  const coordinates = dayStops.map(s => [s.lng, s.lat]);
  
  try {
    const response = await fetch('/api/routing/matrix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ coordinates, profile: 'driving-car' })
    });
    
    const matrix = await response.json();
    
    return dayStops.map((stop, i) => {
      if (i === 0) return stop;
      
      const travelMinutes = Math.round(matrix.durations[i-1][i] / 60);
      const travelDistance = matrix.distances[i-1][i] / 1000; // km
      
      return { ...stop, travelTimeMinutes, travelDistance };
    });
  } catch (error) {
    console.warn('Travel time fetch failed:', error);
    // Fallback to Haversine estimate: distance / 40 km/h
    return dayStops.map((stop, i) => {
      if (i === 0) return stop;
      const prevStop = dayStops[i - 1];
      const dist = haversineDistance(prevStop.lat, prevStop.lng, stop.lat, stop.lng);
      return { ...stop, travelDistance: dist, travelTimeMinutes: Math.round(dist / 40 * 60) };
    });
  }
}
```

**Create:** `api/routing/matrix.ts` (NEW endpoint, proxies OpenRouteService matrix API)

**Files:** `src/utils/geoClustering.ts`, `api/routing/matrix.ts`

**Verification:** Test with 3-stop day, verify `travelTimeMinutes` and `travelDistance` populated.

---

### 2.3 Integrate Clustering into Planner Logic

**Update:** `src/utils/plannerLogic.ts`

**Changes:**
1. Import `clusterAttractionsByDay` and `addTravelTimeGaps`
2. After scoring attractions, before distributing across days:
   ```typescript
   // Cluster attractions geographically
   const clusteredDays = clusterAttractionsByDay(
     scored.map(s => s.attraction),
     input.days,
     dest.lat,
     dest.lng
   );
   
   // Order within each day by nearest-neighbor
   const dayPlans: DayPlan[] = [];
   for (let d = 0; d < clusteredDays.length; d++) {
     const dayAttractions = clusteredDays[d];
     // ... existing stop creation logic using dayAttractions ...
     
     // Optionally add travel times
     if (token) {
       dayStops = await addTravelTimeGaps(dayStops, token);
     }
   }
   ```

**Files:** `src/utils/plannerLogic.ts`

**Verification:** Generate 5-day itinerary, verify stops within each day are geographically close.

---

### 2.4 Update Route Insight

**Update:** `src/utils/plannerLogic.ts`

**In `generateInsights()` function:**
```typescript
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
    title: 'Geographic Clustering',
    summary: routeInsights.join('. ')
  });
}
```

**Files:** `src/utils/plannerLogic.ts`

**Verification:** Check insights panel shows km per day.

---

### 2.5 Display Travel Times in UI

**Update:** `src/components/ActivitiesItinerary.tsx`

**Add between stops:**
```tsx
{stop.travelTimeMinutes && (
  <div className="flex items-center gap-2 text-sm text-gray-500 my-2">
    <ArrowDown className="w-4 h-4" />
    <span>{stop.travelTimeMinutes} min travel ({stop.travelDistance?.toFixed(1)} km)</span>
  </div>
)}
```

**Files:** `src/components/ActivitiesItinerary.tsx`

**Verification:** Visual check shows travel time gaps between stops.

---

## Phase 3: Weather-Aware Activity Planning

### 3.1 Add Weather Optimization Logic

**Update:** `src/utils/plannerLogic.ts`

**Add function:**
```typescript
interface WeatherForecast {
  dayNumber: number;
  rainProbability: number;
  temp: number;
}

async function applyWeatherOptimizations(
  days: DayPlan[],
  destination: Destination,
  departureDate: string
): Promise<{ days: DayPlan[]; swaps: string[] }> {
  const swaps: string[] = [];
  
  try {
    // Fetch weather from existing service
    const forecast = await fetchRealWeatherForecast(
      destination.lat,
      destination.lng,
      destination.name,
      departureDate,
      days.length
    );
    
    // Identify rainy days (>60% probability)
    const rainyDayIndices = forecast.days
      .filter(f => f.precipitationChance > 60)
      .map(f => f.dayNumber - 1);
    
    if (rainyDayIndices.length === 0) return { days, swaps };
    
    // For each rainy day, find outdoor activities
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
          
          const rainyStopIdx = rainyDay.stops.indexOf(outdoor);
          const dryStopIdx = dryDay.stops.indexOf(indoor);
          
          rainyDay.stops[rainyStopIdx] = indoor;
          dryDay.stops[dryStopIdx] = outdoor;
          
          swaps.push(
            `Moved "${outdoor.name}" to Day ${dryIdx + 1} (better weather), ` +
            `"${indoor.name}" to Day ${rainyIdx + 1} (rain expected ${forecast.days[rainyIdx].precipitationChance}%)`
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

**Files:** `src/utils/plannerLogic.ts`

**Verification:** Mock rainy weather, verify outdoor activities moved to dry days.

---

### 3.2 Add Off-Season Warning

**Update:** `src/utils/plannerLogic.ts`

**Add function:**
```typescript
function checkOffSeasonWarning(
  destination: Destination,
  departureDate: string
): string | null {
  const month = new Date(departureDate).toLocaleString('en', { month: 'long' });
  const bestMonths = destination.bestMonths || '';
  
  if (!bestMonths.includes(month)) {
    return `⚠️ ${month} is outside the recommended season (${bestMonths}). ` +
           `Expect different weather and possible closures.`;
  }
  
  return null;
}
```

**Files:** `src/utils/plannerLogic.ts`

**Verification:** Generate trip in off-season month, verify warning appears in insights.

---

### 3.3 Integrate Weather Optimization

**Update:** `src/utils/plannerLogic.ts`

**In `generateTripPlan()`, after creating `dayPlans`:**
```typescript
// Apply weather-aware optimizations
const { days: optimizedDays, swaps } = await applyWeatherOptimizations(
  dayPlans,
  dest,
  input.departureDate
);

// Add weather insights
if (swaps.length > 0) {
  insights.push({
    type: 'weather',
    title: 'Weather Optimization',
    summary: `Itinerary adjusted for weather: ${swaps.join('; ')}`
  });
}

const offSeasonWarning = checkOffSeasonWarning(dest, input.departureDate);
if (offSeasonWarning) {
  insights.push({
    type: 'warning',
    title: 'Season Advisory',
    summary: offSeasonWarning
  });
}
```

**Files:** `src/utils/plannerLogic.ts`

**Verification:** Generate itinerary with rainy forecast, verify activities swapped and insight added.

---

### 3.4 Add Weather Icons to UI

**Update:** `src/components/ActivitiesItinerary.tsx`

**Add weather indicator per day:**
```tsx
{dayWeather && (
  <div className="flex items-center gap-2 text-sm text-gray-600">
    {dayWeather.conditionIcon === 'cloud-rain' && <CloudRain className="w-4 h-4" />}
    {dayWeather.conditionIcon === 'sun' && <Sun className="w-4 h-4" />}
    {/* ... other icons ... */}
    <span>{dayWeather.condition}, {dayWeather.tempHighC}°C</span>
  </div>
)}
```

**Files:** `src/components/ActivitiesItinerary.tsx`

**Verification:** Visual check shows weather icons per day.

---

## Phase 4: Agentic Copilot with Tool Calling

### 4.1 Add Tool Definitions to Chat Handler

**Update:** `api/_lib/chat.ts`

**Add Groq tools:**
```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'replace_stop',
      description: 'Replace a stop in the itinerary with a new activity',
      parameters: {
        type: 'object',
        properties: {
          day: { type: 'number', description: 'Day number (1-indexed)' },
          order: { type: 'number', description: 'Stop order in day (0-indexed)' },
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

**Files:** `api/_lib/chat.ts`

**Verification:** TypeScript compiles without errors.

---

### 4.2 Add Compact Itinerary Format

**Update:** `src/services/aiCopilotService.ts`

**Add interfaces and function:**
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

export function compactifyItinerary(itinerary: GeneratedItinerary): CompactItinerary {
  return {
    destination: `${itinerary.destination.name}, ${itinerary.destination.state}`,
    days: itinerary.input.days,
    budget: itinerary.input.budgetInr,
    dailyPlans: itinerary.days.map((day, idx) => ({
      day: idx + 1,
      date: day.dateStr,
      stops: day.stops.map((stop, order) => ({
        order,
        name: stop.name,
        category: stop.category,
        time: stop.startTime,
        duration: stop.durationHours,
        cost: stop.estimatedCostInr
      })),
      totalCost: day.estimatedDayCostInr
    })),
    costBreakdown: {
      transport: itinerary.costBreakdown.transportInr,
      accommodation: itinerary.costBreakdown.stayInr,
      food: itinerary.costBreakdown.foodInr,
      activities: itinerary.costBreakdown.activitiesInr,
      total: itinerary.costBreakdown.totalEstimatedInr
    }
  };
}
```

**Files:** `src/services/aiCopilotService.ts`

**Verification:** Call `compactifyItinerary()` with sample itinerary, verify JSON size reduced.

---

### 4.3 Implement Tool Execution Logic

**Update:** `api/_lib/chat.ts`

**Add function:**
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
          newStop: { ...stop, cost: Math.round(stop.cost * 0.6), name: `${stop.name} (budget option)` }
        });
      });
      break;
  }
  
  return {
    success: true,
    changes,
    message: `Proposed ${changes.length} change(s)`
  };
}
```

**Update `handleChatRequest()` to use tools:**
```typescript
const completion = await groq.chat.completions.create({
  model,
  messages,
  tools: tripContext ? tools : undefined,
  temperature: 0.7,
  max_tokens: 1024
});

const message = completion.choices[0]?.message;

// Check for tool calls
if (message.tool_calls && message.tool_calls.length > 0) {
  const toolResults = [];
  for (const toolCall of message.tool_calls) {
    const result = await handleToolCall(
      toolCall.function.name,
      JSON.parse(toolCall.function.arguments),
      tripContext.currentItinerary
    );
    toolResults.push(result);
  }
  
  return {
    success: true,
    response: message.content || '',
    toolCalls: toolResults,
    status: 200
  };
}
```

**Files:** `api/_lib/chat.ts`

**Verification:** Send copilot message "make day 2 cheaper", verify tool call returned with changes.

---

### 4.4 Create Diff Preview Component

**Update:** `src/components/TravelCopilot.tsx`

**Add component:**
```tsx
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
    <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50 my-3">
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
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Apply Changes
        </button>
        <button
          onClick={onDiscard}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
```

**Files:** `src/components/TravelCopilot.tsx`

**Verification:** Trigger tool call, verify diff preview shows with apply/discard buttons.

---

### 4.5 Implement Change Application Logic

**Update:** `src/components/TripPlanner.tsx`

**Add function:**
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
          name: change.newStop.name,
          category: change.newStop.category,
          durationHours: change.newStop.duration,
          estimatedCostInr: change.newStop.cost
        };
        break;
        
      case 'remove':
        day.stops.splice(change.order, 1);
        break;
        
      case 'add':
        day.stops.push({
          id: `copilot-${Date.now()}`,
          ...change.stop,
          dayNumber: change.day,
          orderInDay: day.stops.length
        });
        break;
        
      case 'move':
        const stop = updated.days[change.fromDay - 1].stops.splice(change.fromOrder, 1)[0];
        updated.days[change.toDay - 1].stops.splice(change.toOrder, 0, stop);
        break;
    }
  });
  
  // Recompute cost breakdown
  updated.costBreakdown = recalculateCostBreakdown(updated);
  
  return updated;
}

function recalculateCostBreakdown(itinerary: GeneratedItinerary): CostBreakdown {
  const activitiesTotal = itinerary.days.reduce(
    (sum, day) => sum + day.stops.reduce((s, stop) => s + stop.estimatedCostInr, 0),
    0
  );
  
  return {
    ...itinerary.costBreakdown,
    activitiesInr: activitiesTotal,
    totalEstimatedInr: 
      itinerary.costBreakdown.stayInr +
      itinerary.costBreakdown.transportInr +
      activitiesTotal +
      itinerary.costBreakdown.foodInr +
      itinerary.costBreakdown.contingencyInr
  };
}
```

**Files:** `src/components/TripPlanner.tsx`

**Verification:** Apply changes from diff preview, verify itinerary state updates.

---

### 4.6 Add Undo/Redo System

**Update:** `src/components/TripPlanner.tsx`

**Add state:**
```typescript
const [itineraryHistory, setItineraryHistory] = useState<GeneratedItinerary[]>([]);
const [historyIndex, setHistoryIndex] = useState<number>(-1);

function saveToHistory(itinerary: GeneratedItinerary) {
  const newHistory = itineraryHistory.slice(0, historyIndex + 1);
  newHistory.push(JSON.parse(JSON.stringify(itinerary))); // Deep clone
  
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

**Add UI buttons:**
```tsx
<div className="flex gap-2">
  <button onClick={undo} disabled={historyIndex <= 0}>
    <Undo className="w-4 h-4" />
  </button>
  <button onClick={redo} disabled={historyIndex >= itineraryHistory.length - 1}>
    <Redo className="w-4 h-4" />
  </button>
</div>
```

**Files:** `src/components/TripPlanner.tsx`

**Verification:** Apply change, click undo, verify itinerary reverts.

---

### 4.7 Optional: Add SSE Streaming

**Update:** `api/_lib/chat.ts`

**Add streaming handler:**
```typescript
export async function handleChatStream(
  options: ChatHandlerOptions
): Promise<ReadableStream> {
  const encoder = new TextEncoder();
  
  return new ReadableStream({
    async start(controller) {
      try {
        const stream = await groq.chat.completions.create({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
          messages: buildMessages(options),
          tools: options.tripContext ? tools : undefined,
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

**Create:** `api/chat/stream.ts`

**Update:** `src/services/aiCopilotService.ts` with SSE parsing

**Files:** `api/_lib/chat.ts`, `api/chat/stream.ts`, `src/services/aiCopilotService.ts`

**Verification:** Send copilot message, verify streaming tokens appear incrementally.

---

## Phase 5: Testing and Documentation

### 5.1 Test Clustering Algorithm

**Create:** `src/utils/geoClustering.test.ts`

**Tests:**
```typescript
describe('clusterAttractionsByDay', () => {
  it('should not assign a stop to multiple days', () => {
    const attractions = mockAttractions(20);
    const clustered = clusterAttractionsByDay(attractions, 5, 15.0, 75.0);
    
    const allStopIds = new Set<string>();
    const duplicates: string[] = [];
    
    clustered.forEach(day => {
      day.forEach(stop => {
        if (allStopIds.has(stop.id)) duplicates.push(stop.id);
        allStopIds.add(stop.id);
      });
    });
    
    expect(duplicates).toEqual([]);
  });
  
  it('should assign all attractions', () => {
    const attractions = mockAttractions(15);
    const clustered = clusterAttractionsByDay(attractions, 3, 15.0, 75.0);
    
    const totalAssigned = clustered.reduce((sum, day) => sum + day.length, 0);
    expect(totalAssigned).toBe(attractions.length);
  });
  
  it('should handle single day', () => {
    const attractions = mockAttractions(5);
    const clustered = clusterAttractionsByDay(attractions, 1, 15.0, 75.0);
    
    expect(clustered.length).toBe(1);
    expect(clustered[0]).toEqual(attractions);
  });
  
  it('should order stops within day by proximity', () => {
    const attractions = [
      { id: '1', lat: 15.0, lng: 75.0, ...mockAttraction() },
      { id: '2', lat: 15.01, lng: 75.01, ...mockAttraction() },
      { id: '3', lat: 15.005, lng: 75.005, ...mockAttraction() }
    ];
    
    const clustered = clusterAttractionsByDay(attractions, 1, 15.0, 75.0);
    const ordered = clustered[0];
    
    // First stop should be closest to center
    expect(ordered[0].id).toBe('1');
  });
});

describe('haversineDistance', () => {
  it('should calculate distance correctly', () => {
    const dist = haversineDistance(15.0, 75.0, 15.01, 75.01);
    expect(dist).toBeGreaterThan(1);
    expect(dist).toBeLessThan(2);
  });
});
```

**Files:** `src/utils/geoClustering.test.ts`

**Verification:** `npm run test -- geoClustering.test.ts` passes.

---

### 5.2 Test Weather Optimization

**Create:** `src/utils/weatherOptimization.test.ts`

**Tests:**
```typescript
describe('applyWeatherOptimizations', () => {
  it('should swap outdoor activities to dry days', async () => {
    const days = mockDayPlans([
      { stops: [outdoorStop, indoorStop] },
      { stops: [indoorStop2, outdoorStop2] }
    ]);
    
    const { days: optimized, swaps } = await applyWeatherOptimizations(
      days,
      mockDestination,
      '2026-06-01'
    );
    
    // Mock rainy day 1
    expect(swaps.length).toBeGreaterThan(0);
    expect(optimized[0].stops.some(s => s.category === 'Culture')).toBe(true);
  });
  
  it('should handle all rainy days', async () => {
    const days = mockDayPlans([{ stops: [outdoorStop] }]);
    
    const { days: optimized, swaps } = await applyWeatherOptimizations(
      days,
      mockDestination,
      '2026-06-01'
    );
    
    // If all days rainy, no swaps possible
    expect(swaps.length).toBe(0);
  });
});
```

**Files:** `src/utils/weatherOptimization.test.ts`

**Verification:** `npm run test -- weatherOptimization.test.ts` passes.

---

### 5.3 Test Tool Calling Schemas

**Create:** `api/_lib/chat.test.ts`

**Tests:**
```typescript
describe('handleToolCall', () => {
  it('should create replace change', async () => {
    const result = await handleToolCall(
      'replace_stop',
      { day: 1, order: 0, newStop: mockStop },
      mockItinerary
    );
    
    expect(result.success).toBe(true);
    expect(result.changes.length).toBe(1);
    expect(result.changes[0].type).toBe('replace');
  });
  
  it('should create remove change', async () => {
    const result = await handleToolCall(
      'remove_stop',
      { day: 1, order: 0 },
      mockItinerary
    );
    
    expect(result.changes[0].type).toBe('remove');
  });
  
  it('should create budget adjustment changes', async () => {
    const result = await handleToolCall(
      'adjust_budget',
      { targetBudget: 15000 },
      mockItinerary
    );
    
    expect(result.changes.length).toBeGreaterThan(0);
    expect(result.changes.every(c => c.type === 'replace')).toBe(true);
  });
});
```

**Files:** `api/_lib/chat.test.ts`

**Verification:** `npm run test -- api/_lib/chat.test.ts` passes.

---

### 5.4 Test Attractions Rate Limiting

**Create:** `api/_lib/attractions.test.ts`

**Tests:**
```typescript
describe('handleAttractionsRequest', () => {
  it('should enforce rate limit', async () => {
    const token = mockToken();
    
    // Make 10 requests (limit)
    for (let i = 0; i < 10; i++) {
      const result = await handleAttractionsRequest({ ...mockRequest, token });
      expect(result.status).toBe(200);
    }
    
    // 11th request should fail
    const result = await handleAttractionsRequest({ ...mockRequest, token });
    expect(result.status).toBe(429);
  });
  
  it('should validate schema', async () => {
    const result = await handleAttractionsRequest({
      name: '', // Invalid
      lat: 91, // Invalid
      token: mockToken()
    });
    
    expect(result.status).toBe(400);
  });
  
  it('should filter attractions >50km away', async () => {
    const attractions = await generateAttractions(mockRequest);
    
    attractions.forEach(a => {
      const dist = haversineDistance(mockRequest.lat, mockRequest.lng, a.lat, a.lng);
      expect(dist).toBeLessThanOrEqual(50);
    });
  });
});
```

**Files:** `api/_lib/attractions.test.ts`

**Verification:** `npm run test -- api/_lib/attractions.test.ts` passes.

---

### 5.5 Integration Test: End-to-End Flow

**Create:** `src/integration.test.ts`

**Test:**
```typescript
describe('E2E: AI Itinerary Generation', () => {
  it('should generate → cluster → optimize → copilot edit', async () => {
    // 1. Generate attractions for custom destination
    const attractions = await fetchAIAttractions({
      name: 'Kyoto',
      country: 'Japan',
      lat: 35.0116,
      lng: 135.7681,
      mood: 'Culture',
      groupType: 'Couple',
      days: 5
    });
    
    expect(attractions.length).toBeGreaterThanOrEqual(8);
    
    // 2. Generate itinerary
    const itinerary = await generateTripPlan({
      startCity: 'Tokyo',
      destinationId: 'place-kyoto',
      departureDate: '2026-06-01',
      days: 5,
      budgetInr: 100000,
      travelMode: 'train',
      mood: 'Culture',
      groupType: 'Couple',
      energyLevel: 'Balanced'
    });
    
    expect(itinerary.days.length).toBe(5);
    
    // 3. Verify clustering (stops per day are geographically close)
    itinerary.days.forEach(day => {
      if (day.stops.length > 1) {
        const maxDist = Math.max(...day.stops.map((s, i) => {
          if (i === 0) return 0;
          const prev = day.stops[i - 1];
          return haversineDistance(prev.lat, prev.lng, s.lat, s.lng);
        }));
        expect(maxDist).toBeLessThan(20); // Stops within 20km
      }
    });
    
    // 4. Verify weather optimization applied
    expect(itinerary.insights.some(i => i.type === 'weather')).toBe(true);
    
    // 5. Test copilot tool call
    const changes = await sendCopilotMessage(
      'make day 2 cheaper',
      itinerary,
      token
    );
    
    expect(changes.length).toBeGreaterThan(0);
    
    // 6. Apply changes
    const updated = applyItineraryChanges(itinerary, changes);
    
    expect(updated.days[1].estimatedDayCostInr).toBeLessThan(
      itinerary.days[1].estimatedDayCostInr
    );
  });
});
```

**Files:** `src/integration.test.ts`

**Verification:** `npm run test -- integration.test.ts` passes.

---

### 5.6 Update README

**Update:** `README.md`

**Add sections:**
```markdown
## New Features (Phase 2)

### AI-Generated Attractions
- LLM-powered attraction generation for any destination worldwide
- Groq AI integration with JSON mode and validation
- Supabase caching (30-day TTL) to reduce API costs
- Visual "AI-suggested" badges on itinerary

### Geographic Day Clustering
- K-means clustering groups attractions by proximity
- Nearest-neighbor ordering minimizes travel within days
- Real travel time calculation via OpenRouteService
- Route insights show km covered per day

### Weather-Aware Planning
- Open-Meteo 7-day forecasts integrated
- Automatic activity swapping for rainy days (indoor vs outdoor)
- Off-season warnings based on destination best months
- Weather icons displayed per day

### Agentic Copilot
- Natural language itinerary editing via Groq function calling
- Tools: replace_stop, remove_stop, add_stop, move_stop, adjust_budget
- Visual diff preview before applying changes
- Undo/redo system (10-level history stack)
- SSE streaming for responsive UX

## Environment Variables (Updated)

Add to `.env.local`:
```
GROQ_MODEL=openai/gpt-oss-120b
SUPABASE_SERVICE_KEY=<your-service-key>
```

## API Endpoints (New)

- `POST /api/attractions` - Generate attractions for custom destinations
  - Rate limit: 10 requests / 10 minutes per user
  - Authentication: Required (JWT)
  - Response: Array of Attraction objects

- `POST /api/chat/stream` - Streaming copilot responses (optional)
  - Rate limit: 20 requests / 10 minutes per user
  - Authentication: Required (JWT)
  - Response: Server-Sent Events (SSE)

## Testing

Run full test suite:
```bash
npm run test
```

Run specific tests:
```bash
npm run test -- geoClustering.test.ts
npm run test -- weatherOptimization.test.ts
npm run test -- chat.test.ts
```

## Acceptance Criteria

✅ Search any city (e.g., "Hampi", "Kyoto") and generate real named attractions
✅ Attractions appear on map with precise coordinates
✅ Multi-day itineraries cluster stops geographically (minimize travel)
✅ Weather forecasts trigger indoor/outdoor activity swaps
✅ Copilot command "make day 2 cheaper" shows diff preview
✅ Apply changes updates itinerary and recomputes costs
✅ Undo/redo works for all copilot edits
✅ All existing tests pass + new tests for clustering, weather, tools
✅ `npm run lint` passes with 0 TypeScript errors
```

**Files:** `README.md`

**Verification:** Read README, verify all sections accurate.

---

### 5.7 Update .env.example

**Update:** `.env.example`

**Add:**
```
# Groq AI Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Supabase Service Key (server-side only)
SUPABASE_SERVICE_KEY=your_service_key_here

# Rate Limits (optional)
CHAT_RATE_LIMIT=20
ROUTING_RATE_LIMIT=60
RATE_LIMIT_WINDOW=600000
```

**Files:** `.env.example`

**Verification:** Compare with `.env.local`, ensure all keys documented.

---

## Order of Implementation

### Phase 1: LLM-Generated Attractions (Steps 1.1 → 1.7)
**Dependencies:** None
**Estimated Time:** 2-3 hours
**Critical Path:** Must complete before other phases can use AI attractions

### Phase 2: Geographic Day Clustering (Steps 2.1 → 2.5)
**Dependencies:** Phase 1 complete (to test with AI attractions)
**Estimated Time:** 2-3 hours
**Critical Path:** Required for Phase 3 (weather optimization needs clustered days)

### Phase 3: Weather-Aware Planning (Steps 3.1 → 3.4)
**Dependencies:** Phase 2 complete (operates on clustered days)
**Estimated Time:** 1-2 hours
**Critical Path:** Independent from Phase 4

### Phase 4: Agentic Copilot (Steps 4.1 → 4.7)
**Dependencies:** Phase 1, 2, 3 complete (copilot needs full itinerary structure)
**Estimated Time:** 3-4 hours
**Critical Path:** Most complex, should be last implementation

### Phase 5: Testing and Documentation (Steps 5.1 → 5.7)
**Dependencies:** All phases complete
**Estimated Time:** 2-3 hours
**Critical Path:** Final verification before deployment

**Total Estimated Time:** 10-15 hours

---

## Integration Points

### Planner Logic ↔ Attractions Service
- `plannerLogic.ts` calls `fetchAIAttractions()` for custom destinations
- Returns `Attraction[]` with `isAIGenerated: true` flag

### Clustering ↔ Planner Logic
- `plannerLogic.ts` calls `clusterAttractionsByDay()` before distributing stops
- Returns `Attraction[][]` (array per day)
- Calls `addTravelTimeGaps()` to populate `travelTimeMinutes` and `travelDistance`

### Weather Service ↔ Planner Logic
- `plannerLogic.ts` calls `applyWeatherOptimizations()` after clustering
- Uses existing `realWeatherService.ts` for forecast data
- Returns modified `DayPlan[]` and swap descriptions for insights

### Copilot ↔ Planner State
- `TravelCopilot.tsx` sends `CompactItinerary` to chat API
- Chat API returns `ItineraryChange[]` via tool calls
- `TripPlanner.tsx` applies changes using `applyItineraryChanges()`
- State updates trigger React re-render

### Rate Limiter ↔ API Handlers
- All API handlers (`chat.ts`, `routing.ts`, `attractions.ts`) use `rateLimiter.check()`
- Shared `RATE_LIMITS` config in `rateLimiter.ts`

### Auth ↔ All API Handlers
- All handlers call `verifyToken()` from `supabase.ts`
- Returns `User` object or `null`

---

## Potential Risks and Mitigations

### Risk 1: Groq API Rate Limits
**Impact:** AI attractions fail to generate, copilot becomes non-functional
**Mitigation:**
- Cache attractions in Supabase (30-day TTL)
- Implement exponential backoff on 429 errors
- Fallback to placeholder blocks if API unavailable
- Client-side rate limit tracking shows user remaining requests

### Risk 2: K-means Clustering Produces Unbalanced Days
**Impact:** Some days have 0 stops, others have 10+
**Mitigation:**
- Post-process clusters to enforce min/max stops per day (1-4)
- If cluster empty, redistribute from largest cluster
- Fall back to round-robin if clustering fails

### Risk 3: Weather API Downtime
**Impact:** Weather optimization skipped, off-season warnings missing
**Mitigation:**
- Wrap weather calls in try/catch with graceful degradation
- Log errors but don't fail itinerary generation
- Show UI warning: "Weather data unavailable"

### Risk 4: Tool Calling Schema Mismatch
**Impact:** Copilot tool calls fail validation, changes not applied
**Mitigation:**
- Strict Zod validation on tool arguments
- Return error message to copilot with schema details
- Allow copilot to retry with corrected arguments
- Unit tests for all tool call scenarios

### Risk 5: Large Itineraries Exceed Token Limits
**Impact:** Copilot context truncated, loses itinerary details
**Mitigation:**
- Use `CompactItinerary` format (reduces JSON size 60%)
- Only send current itinerary, not full history
- If still too large, chunk by days (only send relevant days)

### Risk 6: Clustering Performance on 14-day Trips
**Impact:** K-means takes >1s, blocks UI
**Mitigation:**
- Move clustering to web worker (async)
- Show loading spinner during clustering
- Cache clustered results per destination
- Max iterations limit: 50

### Risk 7: Undo/Redo State Grows Too Large
**Impact:** Memory usage increases, performance degrades
**Mitigation:**
- Limit history to 10 versions
- Use shallow comparison to detect changes
- Clear history when user navigates away

### Risk 8: Supabase Migration Fails
**Impact:** Cache table missing, attractions API errors
**Mitigation:**
- Provide rollback SQL in migration file
- Test migration on dev instance first
- Add conditional table creation: `CREATE TABLE IF NOT EXISTS`
- Document manual migration steps in README

---

## File Structure Summary

### New Files (18)
```
migrations/
  003_generated_attractions.sql

api/
  attractions.ts (serverless wrapper)
  chat/
    stream.ts (SSE endpoint)
  _lib/
    attractions.ts (handler + Groq integration)

src/
  services/
    attractionsService.ts (client fetch)
  utils/
    geoClustering.ts (k-means + nearest-neighbor)
    geoClustering.test.ts
    weatherOptimization.test.ts
  integration.test.ts
  
api/_lib/
  chat.test.ts
  attractions.test.ts
```

### Modified Files (10)
```
api/_lib/
  schemas.ts (add AttractionSchema, AttractionsRequestSchema)
  rateLimiter.ts (add attractions rate limit)
  chat.ts (add tools, tool execution, streaming)
  
src/
  data/
    destinations.ts (add isAIGenerated to Attraction)
  utils/
    plannerLogic.ts (integrate clustering, weather, AI attractions)
  components/
    TravelCopilot.tsx (add diff preview, tool call handling)
    TripPlanner.tsx (add change application, undo/redo)
    ActivitiesItinerary.tsx (add AI badge, travel times)
    
README.md
.env.example
```

---

## Definition of Done

✅ **Phase 1:** Custom destination generates real attractions via Groq API
✅ **Phase 2:** Multi-day itineraries group stops geographically, show km per day
✅ **Phase 3:** Rainy days swap outdoor activities for indoor ones
✅ **Phase 4:** Copilot command "make day 2 cheaper" shows diff with apply/discard
✅ **Phase 5:** All tests pass (`npm run test`)
✅ **Build:** `npm run lint` passes with 0 errors
✅ **Build:** `npm run build` succeeds
✅ **Manual:** Generate itinerary for "Kyoto", verify attractions on map
✅ **Manual:** Use copilot to edit trip, verify changes applied
✅ **Manual:** Test undo/redo, verify state reverts correctly
✅ **Docs:** README updated with new features and API endpoints
✅ **Env:** `.env.example` documents all required variables

---

## Notes

- All timestamps use ISO 8601 format
- Currency in Indian Rupees (INR)
- Coordinates in decimal degrees (WGS84)
- Rate limits per user (identified by JWT `sub` claim)
- Cache keys rounded to 2 decimals (e.g., `"35.01_135.77"`)
- Tool names use snake_case (Groq convention)
- Component props use camelCase (React convention)
- Database columns use snake_case (PostgreSQL convention)

---

**Plan Version:** 1.0
**Created:** 2025-01-28
**Author:** AI Planning Agent
