import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateMultiCityTrip } from '../multiCityLogic';
import * as plannerLogic from '../plannerLogic';

// Mock the plannerLogic module
vi.mock('../plannerLogic', async () => {
  const actual = await vi.importActual('../plannerLogic');
  return {
    ...actual,
    generateTripPlan: vi.fn(),
  };
});

describe('multiCityLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMultiCityTrip', () => {
    it('should throw error for less than 2 cities', async () => {
      await expect(
        generateMultiCityTrip(
          ['Goa'],
          7,
          40000,
          'Mumbai',
          'Adventure',
          'Couple',
          'Balanced',
          2,
          '2026-12-01'
        )
      ).rejects.toThrow('Multi-city trips must have 2-4 destinations');
    });

    it('should throw error for more than 4 cities', async () => {
      await expect(
        generateMultiCityTrip(
          ['Goa', 'Hampi', 'Jaipur', 'Delhi', 'Agra'],
          14,
          50000,
          'Mumbai',
          'Culture',
          'Family',
          'Balanced',
          4,
          '2026-12-01'
        )
      ).rejects.toThrow('Multi-city trips must have 2-4 destinations');
    });

    it('should allocate days evenly across cities', async () => {
      const mockItinerary = {
        id: 'test-trip',
        createdAt: '2026-12-01',
        input: {} as any,
        destination: {} as any,
        days: [],
        costBreakdown: {
          stayInr: 5000,
          transportInr: 2000,
          activitiesInr: 3000,
          foodInr: 2500,
          contingencyInr: 500,
          totalEstimatedInr: 13000,
          userBudgetInr: 15000,
          budgetStatus: 'balanced' as const,
          varianceInr: 2000,
        },
        insights: [],
      };

      vi.mocked(plannerLogic.generateTripPlan).mockResolvedValue(mockItinerary);

      const result = await generateMultiCityTrip(
        ['Goa', 'Hampi'],
        7,
        40000,
        'Mumbai',
        'Adventure',
        'Couple',
        'Balanced',
        2,
        '2026-12-01'
      );

      // 7 days - 1 transport day = 6 days available
      // 6 days / 2 cities = 3 days per city
      expect(result.legs.length).toBe(2);
      expect(result.legs[0].days).toBe(3);
      expect(result.legs[1].days).toBe(3);
      expect(result.totalDays).toBe(7);
    });

    it('should assign remainder days to first city', async () => {
      const mockItinerary = {
        id: 'test-trip',
        createdAt: '2026-12-01',
        input: {} as any,
        destination: {} as any,
        days: [],
        costBreakdown: {
          stayInr: 5000,
          transportInr: 2000,
          activitiesInr: 3000,
          foodInr: 2500,
          contingencyInr: 500,
          totalEstimatedInr: 13000,
          userBudgetInr: 15000,
          budgetStatus: 'balanced' as const,
          varianceInr: 2000,
        },
        insights: [],
      };

      vi.mocked(plannerLogic.generateTripPlan).mockResolvedValue(mockItinerary);

      const result = await generateMultiCityTrip(
        ['Goa', 'Hampi', 'Jaipur'],
        10,
        50000,
        'Mumbai',
        'Culture',
        'Friends',
        'Balanced',
        3,
        '2026-12-01'
      );

      // 10 days - 2 transport days = 8 days available
      // 8 days / 3 cities = 2 days per city + 2 remainder
      expect(result.legs.length).toBe(3);
      expect(result.legs[0].days).toBe(4); // 2 + 2 remainder
      expect(result.legs[1].days).toBe(2);
      expect(result.legs[2].days).toBe(2);
    });

    it('should calculate transport between cities', async () => {
      const mockItinerary = {
        id: 'test-trip',
        createdAt: '2026-12-01',
        input: {} as any,
        destination: {} as any,
        days: [],
        costBreakdown: {
          stayInr: 5000,
          transportInr: 2000,
          activitiesInr: 3000,
          foodInr: 2500,
          contingencyInr: 500,
          totalEstimatedInr: 13000,
          userBudgetInr: 15000,
          budgetStatus: 'balanced' as const,
          varianceInr: 2000,
        },
        insights: [],
      };

      vi.mocked(plannerLogic.generateTripPlan).mockResolvedValue(mockItinerary);

      const result = await generateMultiCityTrip(
        ['Goa', 'Hampi'],
        7,
        40000,
        'Mumbai',
        'Adventure',
        'Couple',
        'Balanced',
        2,
        '2026-12-01'
      );

      // First leg should have transport to next city
      expect(result.legs[0].transportToNext).toBeDefined();
      expect(result.legs[0].transportToNext?.mode).toBeDefined();
      expect(result.legs[0].transportToNext?.duration).toBeDefined();
      expect(result.legs[0].transportToNext?.estimatedCost).toBeGreaterThan(0);

      // Last leg should not have transport
      expect(result.legs[1].transportToNext).toBeUndefined();
    });

    it('should select appropriate transport mode based on distance', async () => {
      const mockItinerary = {
        id: 'test-trip',
        createdAt: '2026-12-01',
        input: {} as any,
        destination: {} as any,
        days: [],
        costBreakdown: {
          stayInr: 5000,
          transportInr: 2000,
          activitiesInr: 3000,
          foodInr: 2500,
          contingencyInr: 500,
          totalEstimatedInr: 13000,
          userBudgetInr: 15000,
          budgetStatus: 'balanced' as const,
          varianceInr: 2000,
        },
        insights: [],
      };

      vi.mocked(plannerLogic.generateTripPlan).mockResolvedValue(mockItinerary);

      // Short distance: Goa to Hampi (300 km) - should use bus
      const shortResult = await generateMultiCityTrip(
        ['Goa', 'Hampi'],
        7,
        30000,
        'Mumbai',
        'Adventure',
        'Couple',
        'Balanced',
        2,
        '2026-12-01'
      );

      expect(shortResult.legs[0].transportToNext?.mode).toBe('bus');

      // Long distance with high budget - should use flight
      const longResult = await generateMultiCityTrip(
        ['Jaipur', 'Goa'],
        7,
        60000,
        'Mumbai',
        'Romantic',
        'Couple',
        'Relaxed',
        2,
        '2026-12-01'
      );

      expect(longResult.legs[0].transportToNext?.mode).toBe('flight');
    });

    it('should calculate total cost including all legs and transport', async () => {
      const mockItinerary = {
        id: 'test-trip',
        createdAt: '2026-12-01',
        input: {} as any,
        destination: {} as any,
        days: [],
        costBreakdown: {
          stayInr: 5000,
          transportInr: 2000,
          activitiesInr: 3000,
          foodInr: 2500,
          contingencyInr: 500,
          totalEstimatedInr: 13000,
          userBudgetInr: 15000,
          budgetStatus: 'balanced' as const,
          varianceInr: 2000,
        },
        insights: [],
      };

      vi.mocked(plannerLogic.generateTripPlan).mockResolvedValue(mockItinerary);

      const result = await generateMultiCityTrip(
        ['Goa', 'Hampi'],
        7,
        40000,
        'Mumbai',
        'Adventure',
        'Couple',
        'Balanced',
        2,
        '2026-12-01'
      );

      // Total cost should include both legs plus inter-city transport
      const expectedMinCost = 13000 * 2; // Two legs
      expect(result.totalCost).toBeGreaterThanOrEqual(expectedMinCost);
    });

    it('should throw error for unknown destination', async () => {
      await expect(
        generateMultiCityTrip(
          ['UnknownCity', 'Goa'],
          7,
          40000,
          'Mumbai',
          'Adventure',
          'Couple',
          'Balanced',
          2,
          '2026-12-01'
        )
      ).rejects.toThrow('Destination not found: UnknownCity');
    });

    it('should set correct start and end dates', async () => {
      const mockItinerary = {
        id: 'test-trip',
        createdAt: '2026-12-01',
        input: {} as any,
        destination: {} as any,
        days: [],
        costBreakdown: {
          stayInr: 5000,
          transportInr: 2000,
          activitiesInr: 3000,
          foodInr: 2500,
          contingencyInr: 500,
          totalEstimatedInr: 13000,
          userBudgetInr: 15000,
          budgetStatus: 'balanced' as const,
          varianceInr: 2000,
        },
        insights: [],
      };

      vi.mocked(plannerLogic.generateTripPlan).mockResolvedValue(mockItinerary);

      const startDate = '2026-12-01';
      const result = await generateMultiCityTrip(
        ['Goa', 'Hampi'],
        7,
        40000,
        'Mumbai',
        'Adventure',
        'Couple',
        'Balanced',
        2,
        startDate
      );

      expect(result.startDate).toBe(startDate);
      
      // End date should be 7 days after start (inclusive)
      const expectedEndDate = new Date('2026-12-01');
      expectedEndDate.setDate(expectedEndDate.getDate() + 7);
      expect(result.endDate).toBe(expectedEndDate.toISOString().split('T')[0]);
    });

    it('should distribute budget proportionally across cities', async () => {
      const mockCalls: any[] = [];
      vi.mocked(plannerLogic.generateTripPlan).mockImplementation((input) => {
        mockCalls.push(input);
        return Promise.resolve({
          id: 'test-trip',
          createdAt: '2026-12-01',
          input,
          destination: {} as any,
          days: [],
          costBreakdown: {
            stayInr: 5000,
            transportInr: 2000,
            activitiesInr: 3000,
            foodInr: 2500,
            contingencyInr: 500,
            totalEstimatedInr: 13000,
            userBudgetInr: input.budgetInr,
            budgetStatus: 'balanced' as const,
            varianceInr: 2000,
          },
          insights: [],
        });
      });

      const totalBudget = 60000;
      await generateMultiCityTrip(
        ['Goa', 'Hampi'],
        7,
        totalBudget,
        'Mumbai',
        'Adventure',
        'Couple',
        'Balanced',
        2,
        '2026-12-01'
      );

      // Each city should get budget proportional to its days
      // With 7 total days and 1 transport day, we have 6 available days
      // 3 days per city, so each gets approximately 50% of budget per-leg-days/total-days
      expect(mockCalls.length).toBe(2);
      
      const budgetSum = mockCalls.reduce((sum, call) => sum + call.budgetInr, 0);
      // Budget distribution should roughly match total (rounding causes variance)
      // Each leg gets budgetPerPerson * (cityDays / totalDays) where cityDays excludes transport
      expect(budgetSum).toBeGreaterThanOrEqual(totalBudget * 0.80);
      expect(budgetSum).toBeLessThanOrEqual(totalBudget * 1.05);
    });
  });
});
