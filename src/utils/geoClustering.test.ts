import { describe, it, expect } from 'vitest';
import { clusterAttractionsByDay, orderByNearestNeighbor, haversineDistance } from './geoClustering';
import type { Attraction } from '../data/destinations';

describe('geoClustering', () => {
  const mockAttractions: Attraction[] = [
    {
      id: 'attr-1',
      name: 'North Attraction',
      category: 'Culture',
      durationHours: 2,
      estimatedCostInr: 500,
      timeOfDay: 'morning',
      lat: 15.35,
      lng: 76.46,
      description: 'Test',
      highlight: 'Test',
      bestFor: ['Solo'],
    },
    {
      id: 'attr-2',
      name: 'South Attraction',
      category: 'Adventure',
      durationHours: 3,
      estimatedCostInr: 800,
      timeOfDay: 'afternoon',
      lat: 15.30,
      lng: 76.46,
      description: 'Test',
      highlight: 'Test',
      bestFor: ['Couple'],
    },
    {
      id: 'attr-3',
      name: 'East Attraction',
      category: 'Nature',
      durationHours: 2.5,
      estimatedCostInr: 600,
      timeOfDay: 'evening',
      lat: 15.335,
      lng: 76.50,
      description: 'Test',
      highlight: 'Test',
      bestFor: ['Family'],
    },
    {
      id: 'attr-4',
      name: 'West Attraction',
      category: 'Food',
      durationHours: 1.5,
      estimatedCostInr: 400,
      timeOfDay: 'sunset',
      lat: 15.335,
      lng: 76.42,
      description: 'Test',
      highlight: 'Test',
      bestFor: ['Friends'],
    },
  ];

  describe('clusterAttractionsByDay', () => {
    it('should not assign a stop to multiple days', () => {
      const days = 2;
      const result = clusterAttractionsByDay(mockAttractions, days, 15.335, 76.46);

      const allIds = new Set<string>();
      const duplicates = new Set<string>();

      result.forEach((dayAttractions) => {
        dayAttractions.forEach((attr) => {
          if (allIds.has(attr.id)) {
            duplicates.add(attr.id);
          }
          allIds.add(attr.id);
        });
      });

      expect(duplicates.size).toBe(0);
    });

    it('should assign all attractions', () => {
      const days = 2;
      const result = clusterAttractionsByDay(mockAttractions, days, 15.335, 76.46);

      const totalAssigned = result.reduce((sum, day) => sum + day.length, 0);
      expect(totalAssigned).toBe(mockAttractions.length);
    });

    it('should return single day for days=1', () => {
      const days = 1;
      const result = clusterAttractionsByDay(mockAttractions, days, 15.335, 76.46);

      expect(result.length).toBe(1);
      expect(result[0].length).toBe(mockAttractions.length);
    });

    it('should return empty array for empty attractions', () => {
      const days = 2;
      const result = clusterAttractionsByDay([], days, 15.335, 76.46);

      expect(result).toEqual([]);
    });

    it('should cluster into multiple days', () => {
      const days = 2;
      const result = clusterAttractionsByDay(mockAttractions, days, 15.335, 76.46);

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(days);
    });
  });

  describe('orderByNearestNeighbor', () => {
    it('should order attractions by proximity', () => {
      const startLat = 15.335;
      const startLng = 76.46;

      const result = orderByNearestNeighbor(mockAttractions, startLat, startLng);

      // First attraction should be closest to start
      const firstDist = haversineDistance(startLat, startLng, result[0].lat, result[0].lng);
      
      for (let i = 1; i < result.length; i++) {
        const dist = haversineDistance(startLat, startLng, result[i].lat, result[i].lng);
        // First should be equal or closer than others (allowing for floating point)
        expect(firstDist).toBeLessThanOrEqual(dist + 0.1);
        break; // Just check first vs second
      }
    });

    it('should return single attraction unchanged', () => {
      const single = [mockAttractions[0]];
      const result = orderByNearestNeighbor(single, 15.335, 76.46);

      expect(result).toEqual(single);
    });

    it('should return empty array for empty input', () => {
      const result = orderByNearestNeighbor([], 15.335, 76.46);

      expect(result).toEqual([]);
    });
  });

  describe('haversineDistance', () => {
    it('should calculate distance between two points', () => {
      const dist = haversineDistance(15.335, 76.46, 15.35, 76.46);

      expect(dist).toBeGreaterThan(0);
      expect(dist).toBeLessThan(5); // ~1.7 km
    });

    it('should return 0 for same coordinates', () => {
      const dist = haversineDistance(15.335, 76.46, 15.335, 76.46);

      expect(dist).toBe(0);
    });

    it('should be symmetric', () => {
      const dist1 = haversineDistance(15.335, 76.46, 15.35, 76.50);
      const dist2 = haversineDistance(15.35, 76.50, 15.335, 76.46);

      expect(dist1).toBeCloseTo(dist2, 5);
    });
  });
});
