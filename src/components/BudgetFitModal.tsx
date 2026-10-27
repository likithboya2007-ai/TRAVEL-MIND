import { X, TrendingDown } from 'lucide-react';
import type { BudgetAdjustment } from '../utils/budgetOptimizer';

interface BudgetFitModalProps {
  isOpen: boolean;
  onClose: () => void;
  changes: BudgetAdjustment[];
  finalCost: number;
  targetBudget: number;
  onApply: () => void;
}

export function BudgetFitModal({ isOpen, onClose, changes, finalCost, targetBudget, onApply }: BudgetFitModalProps) {
  if (!isOpen) return null;

  const totalSavings = changes.reduce((sum, c) => sum + c.savedInr, 0);
  const isUnderBudget = finalCost <= targetBudget;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <TrendingDown className="text-green-600" size={32} />
          <h2 className="text-2xl font-bold">Fit to Budget</h2>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-gray-600">We can optimize your trip to fit ₹{targetBudget.toLocaleString()}:</p>
          
          {changes.map((change, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium capitalize">{change.type}: </span>
                  <span className="text-gray-600">{change.from} → {change.to}</span>
                </div>
                <span className="text-green-600 font-semibold">-₹{change.savedInr.toLocaleString()}</span>
              </div>
            </div>
          ))}

          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Total Savings:</span>
              <span className="text-green-600 font-bold">₹{totalSavings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">New Total:</span>
              <span className="text-2xl font-bold">₹{finalCost.toLocaleString()}</span>
            </div>
            {isUnderBudget && (
              <p className="text-green-600 text-sm mt-2">✓ Under budget!</p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
