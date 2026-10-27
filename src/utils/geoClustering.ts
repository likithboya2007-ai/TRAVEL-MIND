/**
 * Geographic clustering utilities for organizing attractions by proximity
 * Uses K-means clustering and nearest-neighbor ordering to minimize travel time
 */

import type { Attraction } from '../data/destinations';

interface ClusterableAttraction extends Attraction {
  clusterId?: number;
}

interface Centroid {
  lat: number;
  lng: number;
}

/**
 * Calculate Haversine distance between two geographic coordinates
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Initialize k centroids using k-means++ algorithm
 * Chooses centroids that are far apart for better clustering
 */
function initializeCentroids(attractions: Attraction[], k: number): Centroid[] {
  if (attractions.length === 0) return [];
  if (k >= attractions.length) {
    return attractions.map((a) => ({ lat: a.lat, lng: a.lng }));
  }

  const centroids: Centroid[] = [];

  // 1. Choose first centroid randomly
  const firstIdx = Math.floor(Math.random() * attractions.length);
  centroids.push({
    lat: attractions[firstIdx].lat,
    lng: attractions[firstIdx].lng,
  });

  // 2. For remaining centroids, pick points furthest from existing centroids
  for (let i = 1; i < k; i++) {
    const distances = attractions.map((attr) => {
      // Find minimum distance to any existing centroid
      const minDist = Math.min(
        ...centroids.map((c) =>
          haversineDistance(attr.lat, attr.lng, c.lat, c.lng)
        )
      );
      return minDist;
    });

    // Pick attraction with maximum min-distance (furthest from all centroids)
    const maxDistIdx = distances.indexOf(Math.max(...distances));
    centroids.push({
      lat: attractions[maxDistIdx].lat,
      lng: attractions[maxDistIdx].lng,
    });
  }

  return centroids;
}

/**
 * Find nearest centroid for an attraction
 */
function findNearestCentroid(
  attraction: Attraction,
  centroids: Centroid[]
): number {
  let nearestIdx = 0;
  let minDist = Infinity;

  centroids.forEach((centroid, idx) => {
    const dist = haversineDistance(
      attraction.lat,
      attraction.lng,
      centroid.lat,
      centroid.lng
    );
    if (dist < minDist) {
      minDist = dist;
      nearestIdx = idx;
    }
  });

  return nearestIdx;
}

/**
 * Compute centroid (mean lat/lng) of a set of attractions
 */
function computeCentroid(attractions: Attraction[]): Centroid {
  if (attractions.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sumLat = attractions.reduce((sum, a) => sum + a.lat, 0);
  const sumLng = attractions.reduce((sum, a) => sum + a.lng, 0);

  return {
    lat: sumLat / attractions.length,
    lng: sumLng / attractions.length,
  };
}

/**
 * K-means clustering algorithm for attractions
 * Groups attractions into k clusters based on geographic proximity
 */
function kMeans(
  attractions: ClusterableAttraction[],
  k: number
): Attraction[][] {
  if (attractions.length === 0) return [];
  if (k <= 1) return [attractions];

  // Initialize centroids using k-means++
  let centroids = initializeCentroids(attractions, k);

  let iterations = 0;
  const maxIterations = 50;
  let changed = true;

  while (changed && iterations < maxIterations) {
    changed = false;

    // Assign each attraction to nearest centroid
    attractions.forEach((attr) => {
      const nearestIdx = findNearestCentroid(attr, centroids);
      if (attr.clusterId !== nearestIdx) {
        attr.clusterId = nearestIdx;
        changed = true;
      }
    });

    // Recompute centroids as mean of assigned attractions
    for (let i = 0; i < k; i++) {
      const clusterAttractions = attractions.filter((a) => a.clusterId === i);
      if (clusterAttractions.length > 0) {
        centroids[i] = computeCentroid(clusterAttractions);
      }
    }

    iterations++;
  }

  // Group by cluster ID
  const result: Attraction[][] = [];
  for (let i = 0; i < k; i++) {
    const cluster = attractions.filter((a) => a.clusterId === i);
    if (cluster.length > 0) {
      result.push(cluster);
    }
  }

  return result;
}

/**
 * Order attractions within a cluster using nearest-neighbor algorithm
 * Minimizes total travel distance by always visiting the nearest unvisited attraction
 * @param attractions - Attractions to order
 * @param startLat - Starting point latitude (e.g., hotel)
 * @param startLng - Starting point longitude
 */
export function orderByNearestNeighbor(
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

    // Add nearest to ordered list and remove from remaining
    const nearest = remaining.splice(nearestIdx, 1)[0];
    ordered.push(nearest);
    currentLat = nearest.lat;
    currentLng = nearest.lng;
  }

  return ordered;
}

/**
 * Cluster attractions into days based on geographic proximity
 * @param attractions - All attractions to cluster
 * @param days - Number of days to cluster into
 * @param centerLat - Center point latitude (destination center or hotel)
 * @param centerLng - Center point longitude
 * @returns Array of attraction arrays, one per day
 */
export function clusterAttractionsByDay(
  attractions: Attraction[],
  days: number,
  centerLat: number,
  centerLng: number
): Attraction[][] {
  if (attractions.length === 0) return [];
  if (days <= 1) return [attractions];

  // Clone attractions to avoid mutating originals
  const clonedAttractions: ClusterableAttraction[] = attractions.map((a) => ({
    ...a,
  }));

  // Use k-means to cluster by proximity
  const clusters = kMeans(clonedAttractions, days);

  // Order stops within each cluster by nearest-neighbor
  const orderedClusters = clusters.map((cluster) =>
    orderByNearestNeighbor(cluster, centerLat, centerLng)
  );

  return orderedClusters;
}

/**
 * Calculate total distance for a day's route
 * @param stops - Ordered stops for the day
 * @param startLat - Starting point (hotel/center)
 * @param startLng - Starting point
 * @returns Total distance in kilometers
 */
export function calculateDayDistance(
  stops: Attraction[],
  startLat: number,
  startLng: number
): number {
  if (stops.length === 0) return 0;

  let totalDistance = 0;
  let currentLat = startLat;
  let currentLng = startLng;

  for (const stop of stops) {
    totalDistance += haversineDistance(currentLat, currentLng, stop.lat, stop.lng);
    currentLat = stop.lat;
    currentLng = stop.lng;
  }

  return totalDistance;
}
