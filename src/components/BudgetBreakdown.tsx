import React from 'react';
import { Info } from 'lucide-react';
import { CostBreakdown } from '../utils/plannerLogic';

interface BudgetBreakdownProps {
  costBreakdown: CostBreakdown;
  groupType: string;
  days: number;
  travelMode: string;
}

export const BudgetBreakdown: React.FC<BudgetBreakdownProps> = ({
  costBreakdown,
  groupType,
  days,
  travelMode,
}) => {
  const perPersonTotal = Math.round(costBreakdown.totalEstimatedInr / getGroupSize(groupType));

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">
            Estimated Budget Breakdown
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            Transparent estimates based on {days} {days === 1 ? 'day' : 'days'} for {groupType.toLowerCase()} travelers
          </p>
        </div>
        <div className="sm:text-right shrink-0">
          <span className="text-xs text-gray-600 block mb-1">Total Estimated Cost</span>
          <span className="font-sans tabular-nums text-3xl font-bold text-blue-600">
            ₹{costBreakdown.totalEstimatedInr.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-gray-600 block mt-1">
            ₹{perPersonTotal.toLocaleString('en-IN')} per person
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
          <span className="text-gray-600 block mb-2">Accommodation</span>
          <span className="font-sans tabular-nums font-semibold text-gray-900 text-lg">
            ₹{costBreakdown.stayInr.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
          <span className="text-gray-600 block mb-2">Transport</span>
          <span className="font-sans tabular-nums font-semibold text-gray-900 text-lg">
            ₹{costBreakdown.transportInr.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-gray-500 mt-1 block">{travelMode}</span>
        </div>
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
          <span className="text-gray-600 block mb-2">Activities</span>
          <span className="font-sans tabular-nums font-semibold text-gray-900 text-lg">
            ₹{costBreakdown.activitiesInr.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
          <span className="text-gray-600 block mb-2">Food</span>
          <span className="font-sans tabular-nums font-semibold text-gray-900 text-lg">
            ₹{costBreakdown.foodInr.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
          <span className="text-gray-600 block mb-2">Contingency</span>
          <span className="font-sans tabular-nums font-semibold text-gray-900 text-lg">
            ₹{costBreakdown.contingencyInr.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-gray-500 mt-1 block">8% buffer</span>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-gray-700 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-gray-900 mb-1">Estimates based on travel style, not guaranteed booking prices</p>
          <p className="text-sm text-gray-600">
            All pricing values are calculated estimates for planning purposes. Actual costs may vary based on season, 
            availability, and individual booking choices. For Indian destinations, estimates are displayed in INR (₹).
            Always verify current prices and availability before booking.
          </p>
        </div>
      </div>
    </div>
  );
};

function getGroupSize(groupType: string): number {
  const map: Record<string, number> = {
    Solo: 1,
    Couple: 2,
    Friends: 3,
    Family: 4,
  };
  return map[groupType] || 2;
}
