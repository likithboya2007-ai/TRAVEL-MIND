import type { GeneratedItinerary, DayPlan } from './plannerLogic';

export interface BudgetAdjustment {
  type: 'stay' | 'transport' | 'activity';
  from: string;
  to: string;
  savedInr: number;
}

export interface BudgetFitResult {
  adjustedItinerary: GeneratedItinerary;
  changes: BudgetAdjustment[];
  finalCost: number;
}

export function fitToBudget(
  itinerary: GeneratedItinerary,
  targetBudget: number
): BudgetFitResult {
  const clone = JSON.parse(JSON.stringify(itinerary));
  const changes: BudgetAdjustment[] = [];
  let currentCost = clone.costBreakdown.totalEstimatedInr;

  // Strategy 1: Downgrade stay
  if (currentCost > targetBudget && clone.input.stayTier !== 'budget') {
    const oldTier = clone.input.stayTier;
    const newTier = oldTier === 'luxury' ? 'mid' : 'budget';
    const oldCost = clone.costBreakdown.stayInr;
    const savingsMultiplier = oldTier === 'luxury' ? 0.5 : 0.6;
    
    clone.costBreakdown.stayInr = Math.round(oldCost * savingsMultiplier);
    const savedInr = oldCost - clone.costBreakdown.stayInr;
    
    changes.push({ type: 'stay', from: oldTier, to: newTier, savedInr });
    currentCost -= savedInr;
  }

  // Strategy 2: Downgrade transport
  if (currentCost > targetBudget && clone.input.transportMode === 'flight') {
    const oldMode = 'flight';
    const newMode = 'train';
    const oldCost = clone.costBreakdown.transportInr;
    
    clone.costBreakdown.transportInr = Math.round(oldCost * 0.3);
    const savedInr = oldCost - clone.costBreakdown.transportInr;
    
    changes.push({ type: 'transport', from: oldMode, to: newMode, savedInr });
    currentCost -= savedInr;
  }

  // Strategy 3: Remove expensive activities
  if (currentCost > targetBudget) {
    const paidStops = clone.days
      .flatMap((day: DayPlan, dayIdx: number) =>
        day.stops.map((stop, stopIdx: number) => ({ stop, dayIdx, stopIdx }))
      )
      .filter(({ stop }) => (stop.estimatedCostInr || 0) > 0)
      .sort((a, b) => (b.stop.estimatedCostInr || 0) - (a.stop.estimatedCostInr || 0));

    for (const { stop, dayIdx, stopIdx } of paidStops) {
      if (currentCost <= targetBudget) break;
      
      const savedInr = stop.estimatedCostInr || 0;
      clone.days[dayIdx].stops.splice(stopIdx, 1);
      changes.push({
        type: 'activity',
        from: stop.name,
        to: 'removed',
        savedInr
      });
      currentCost -= savedInr;
    }
  }

  clone.costBreakdown.totalEstimatedInr = currentCost;
  clone.costBreakdown.varianceInr = targetBudget - currentCost;

  return { adjustedItinerary: clone, changes, finalCost: currentCost };
}
