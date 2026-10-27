/**
 * Advanced Routing Service using OpenRouteService API
 * Provides turn-by-turn directions, route optimization, and alternative routes
 * https://openrouteservice.org/
 * 
 * Free tier: 2000 requests/day (40 requests/day for directions)
 * Requires API key from: https://openrouteservice.org/dev/#/signup
 */

export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface RouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  type: number; // maneuver type code
  name: string; // street/road name
  wayPoints: [number, number]; // [start, end] indices in coordinates array
}

export interface RouteSegment {
  distance: number; // meters
  duration: number; // seconds
  steps: RouteStep[];
}

export interface Route {
  summary: {
    distance: number; // meters
    duration: number; // seconds
  };
  segments: RouteSegment[];
  geometry: {
    coordinates: [number, number][]; // [lng, lat] pairs
    type: 'LineString';
  };
  wayPoints: number[]; // indices of waypoints in coordinates array
}

export interface RoutingResponse {
  routes: Route[];
  metadata: {
    query: {
      coordinates: [number, number][];
      profile: string;
    };
    service: string;
    timestamp: number;
  };
}

export interface TurnByTurnDirection {
  stepNumber: number;
  instruction: string;
  distance: string; // formatted (e.g., "1.2 km")
  duration: string; // formatted (e.g., "5 min")
  roadName: string;
  maneuverType: string; // "turn-left", "turn-right", "straight", etc.
}

export interface ProcessedRoute {
  totalDistance: string;
  totalDuration: string;
  directions: TurnByTurnDirection[];
  polyline: RouteCoordinate[];
  alternativeAvailable: boolean;
}

/**
 * Maneuver type code to human-readable string
 * Reference: https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/
 */
function getManeuverType(typeCode: number): string {
  const types: { [key: number]: string } = {
    0: 'turn-left',
    1: 'turn-right',
    2: 'turn-sharp-left',
    3: 'turn-sharp-right',
    4: 'turn-slight-left',
    5: 'turn-slight-right',
    6: 'straight',
    7: 'enter-roundabout',
    8: 'exit-roundabout',
    9: 'u-turn',
    10: 'arrive',
    11: 'depart',
    12: 'keep-left',
    13: 'keep-right',
  };
  return types[typeCode] || 'continue';
}

/**
 * Format distance in meters to human-readable string
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
  }
  return `${minutes} min`;
}

/**
 * Fetch route from OpenRouteService API via server proxy
 */
export async function fetchRoute(
  coordinates: RouteCoordinate[],
  profile: 'driving-car' | 'driving-hgv' | 'cycling-regular' | 'foot-walking' = 'driving-car',
  options?: {
    alternatives?: number; // number of alternative routes (0-3)
    units?: 'km' | 'mi';
    language?: string;
    token?: string; // Auth token
  }
): Promise<ProcessedRoute> {
  try {
    // Convert coordinates to ORS format [lng, lat]
    const orsCoordinates = coordinates.map(coord => [coord.lng, coord.lat]);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if token is provided
    if (options?.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    // Call server proxy endpoint
    const response = await fetch('/api/routing', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        coordinates: orsCoordinates,
        profile,
        options: {
          alternatives: options?.alternatives,
          units: options?.units,
          language: options?.language,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to calculate route');
    }

    const data: RoutingResponse = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found between the specified locations');
    }

    // Process the main route
    const mainRoute = data.routes[0];
    const directions: TurnByTurnDirection[] = [];
    let stepCounter = 1;

    // Extract turn-by-turn directions from all segments
    for (const segment of mainRoute.segments) {
      for (const step of segment.steps) {
        directions.push({
          stepNumber: stepCounter++,
          instruction: step.instruction,
          distance: formatDistance(step.distance),
          duration: formatDuration(step.duration),
          roadName: step.name || 'Unnamed road',
          maneuverType: getManeuverType(step.type),
        });
      }
    }

    // Convert geometry to RouteCoordinate format
    const polyline: RouteCoordinate[] = mainRoute.geometry.coordinates.map(coord => ({
      lng: coord[0],
      lat: coord[1],
    }));

    return {
      totalDistance: formatDistance(mainRoute.summary.distance),
      totalDuration: formatDuration(mainRoute.summary.duration),
      directions,
      polyline,
      alternativeAvailable: data.routes.length > 1,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      if (import.meta.env.DEV) {
        console.error('Routing service error:', error);
      }
      if (import.meta.env.DEV) {
        console.error('Routing service error:', error);
      }}
    throw error;
  }
}

/**
 * Calculate route between multiple stops (optimization)
 * Returns optimized order of waypoints
 */
export async function fetchOptimizedRoute(
  start: RouteCoordinate,
  stops: RouteCoordinate[],
  end: RouteCoordinate,
  profile: 'driving-car' | 'foot-walking' = 'driving-car',
  token?: string
): Promise<ProcessedRoute> {
  // For now, just calculate direct route through all points in order
  // Full optimization requires ORS optimization endpoint (different API call)
  const allCoordinates = [start, ...stops, end];
  return fetchRoute(allCoordinates, profile, { token });
}

/**
 * Get simple straight-line polyline as fallback when API is unavailable
 */
export function getStraightLineRoute(
  coordinates: RouteCoordinate[]
): ProcessedRoute {
  // Calculate approximate distance using Haversine formula
  let totalDistance = 0;
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const from = coordinates[i];
    const to = coordinates[i + 1];
    totalDistance += calculateDistance(from.lat, from.lng, to.lat, to.lng);
  }

  // Estimate duration (assuming 50 km/h average speed)
  const totalDurationSeconds = (totalDistance / 50) * 3600;

  const directions: TurnByTurnDirection[] = coordinates.map((coord, index) => ({
    stepNumber: index + 1,
    instruction: index === 0 
      ? 'Start your journey'
      : index === coordinates.length - 1
      ? 'Arrive at destination'
      : `Continue to waypoint ${index}`,
    distance: index < coordinates.length - 1
      ? formatDistance(calculateDistance(
          coord.lat,
          coord.lng,
          coordinates[index + 1].lat,
          coordinates[index + 1].lng
        ) * 1000)
      : '0 m',
    duration: '~',
    roadName: 'Direct route',
    maneuverType: 'straight',
  }));

  return {
    totalDistance: formatDistance(totalDistance * 1000),
    totalDuration: formatDuration(totalDurationSeconds),
    directions,
    polyline: coordinates,
    alternativeAvailable: false,
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if routing API is configured
 * Always returns true since API is server-side
 */
export function isRoutingConfigured(): boolean {
  return true; // Server handles API key validation
}

