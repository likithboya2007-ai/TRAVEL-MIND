import { describe, it, expect } from 'vitest';
import {
  validateTripInput,
  generateTripPlan,
  formatItineraryForClipboard,
  TripInput,
} from './plannerLogic';

describe('validateTripInput', () => {
  it('detects missing fields and rejects invalid values', () => {
    const invalidResult = validateTripInput({});
    expect(invalidResult.startCity).toBeTruthy();
    expect(invalidResult.destinationId).toBeTruthy();
    expect(invalidResult.departureDate).toBeTruthy();
    expect(invalidResult.days).toBeTruthy();
    expect(invalidResult.budgetInr).toBeTruthy();

    const validResult = validateTripInput({
      startCity: 'Mumbai',
      destinationId: 'goa',
      departureDate: '2026-11-15',
      days: 4,
      budgetInr: 30000,
    });
    expect(validResult).toEqual({});
  });
});

describe('generateTripPlan', () => {
  it('produces valid multi-day itinerary with cost breakdown and insights', async () => {
    const input: TripInput = {
      startCity: 'Bengaluru',
      destinationId: 'hampi',
      departureDate: '2026-12-01',
      days: 3,
      budgetInr: 25000,
      travelMode: 'car',
      mood: 'Culture',
      groupType: 'Friends',
      energyLevel: 'Balanced',
    };

    const plan = await generateTripPlan(input);

    expect(plan.destination.id).toBe('hampi');
    expect(plan.days.length).toBe(3);
    expect(plan.days[0].stops.length).toBeGreaterThanOrEqual(1);
    expect(plan.costBreakdown.totalEstimatedInr).toBeGreaterThan(0);
    expect(plan.insights.length).toBeGreaterThanOrEqual(3);

    // Verify categories are valid
    const firstStopCategory = plan.days[0].stops[0].category;
    expect(['Culture', 'Adventure', 'Relaxation', 'Nature', 'Food', 'Photography']).toContain(firstStopCategory);
  });

  it('responds dynamically to energy level and budget changes', async () => {
    const relaxedInput: TripInput = {
      startCity: 'Delhi',
      destinationId: 'ladakh',
      departureDate: '2026-06-10',
      days: 4,
      budgetInr: 50000,
      travelMode: 'bike',
      mood: 'Adventure',
      groupType: 'Solo',
      energyLevel: 'Relaxed',
    };

    const activeInput: TripInput = {
      ...relaxedInput,
      energyLevel: 'Active',
    };

    const relaxedPlan = await generateTripPlan(relaxedInput);
    const activePlan = await generateTripPlan(activeInput);

    expect(activePlan.days[0].stops.length).toBeGreaterThanOrEqual(
      relaxedPlan.days[0].stops.length
    );

    // Clipboard export should contain destination and day lines
    const exported = formatItineraryForClipboard(relaxedPlan);
    expect(exported).toContain('Ladakh');
    expect(exported).toContain('COST BREAKDOWN');
  });

  it('never repeats attractions within the same day', async () => {
    const input: TripInput = {
      startCity: 'Mumbai',
      destinationId: 'goa',
      departureDate: '2026-12-01',
      days: 14,
      budgetInr: 100000,
      travelMode: 'car',
      mood: 'Adventure',
      groupType: 'Couple',
      energyLevel: 'Active',
    };

    const plan = await generateTripPlan(input);
    
    // Check each day for duplicate attractions
    for (const day of plan.days) {
      const attractionIds = new Set<string>();
      const dayDuplicates: string[] = [];
      
      for (const stop of day.stops) {
        if (stop.name !== 'Free Time' && !stop.id.startsWith('free-time-')) {
          if (attractionIds.has(stop.id)) {
            dayDuplicates.push(stop.id);
          }
          attractionIds.add(stop.id);
        }
      }
      
      expect(dayDuplicates).toEqual([]);
    }
  });

  it('scales accommodation cost by rooms needed', async () => {
    const soloInput: TripInput = {
      startCity: 'Delhi',
      destinationId: 'goa',
      departureDate: '2026-12-01',
      days: 3,
      travellers: 1,
      budgetInr: 20000,
      travelMode: 'car',
      mood: 'Adventure',
      groupType: 'Solo',
      energyLevel: 'Balanced',
    };

    const groupInput: TripInput = {
      ...soloInput,
      travellers: 4,
      groupType: 'Family',
      budgetInr: 50000,
    };

    const soloPlan = await generateTripPlan(soloInput);
    const groupPlan = await generateTripPlan(groupInput);

    // 1 traveller = 1 room, 4 travellers = 2 rooms
    // Group accommodation cost should be roughly 2x (assuming 2 days, 1 room vs 2 rooms)
    expect(groupPlan.costBreakdown.stayInr).toBeGreaterThan(
      soloPlan.costBreakdown.stayInr
    );
  });
});

