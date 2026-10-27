import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Receipt, TrendingUp, TrendingDown } from 'lucide-react';
import { expenseService, TripExpense, ExpenseCategory, ExpenseSummary } from '../services/expenseService';
import { ExpenseSplitSummary } from './ExpenseSplitSummary';

interface ExpenseTrackerProps {
  tripId?: string;
  plannedBudget: number;
  onExpensesChange?: (summary: ExpenseSummary) => void;
}

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({
  tripId,
  plannedBudget,
  onExpensesChange,
}) => {
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary>({
    accommodation: 0,
    transport: 0,
    food: 0,
    activities: 0,
    other: 0,
    total: 0,
  });
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    category: 'food' as ExpenseCategory,
    description: '',
    amount_inr: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Load expenses when component mounts or tripId changes
  useEffect(() => {
    if (tripId) {
      loadExpenses();
    }
  }, [tripId]);

  const loadExpenses = async () => {
    if (!tripId) return;

    setLoading(true);
    try {
      const data = await expenseService.getExpensesByTrip(tripId);
      setExpenses(data);

      const expenseSummary = await expenseService.getExpenseSummary(tripId);
      setSummary(expenseSummary);
      
      if (onExpensesChange) {
        onExpensesChange(expenseSummary);
      }
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('Failed to load expenses:', err);
      }
      setError('Failed to load expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!formData.description || !formData.amount_inr) {
      setError('Please fill in description and amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await expenseService.addExpense({
        trip_id: tripId,
        category: formData.category,
        description: formData.description,
        amount_inr: parseFloat(formData.amount_inr),
        expense_date: formData.expense_date,
        notes: formData.notes || undefined,
      });

      // Reset form
      setFormData({
        category: 'food',
        description: '',
        amount_inr: '',
        expense_date: new Date().toISOString().split('T')[0],
        notes: '',
      });

      setIsAddingExpense(false);
      await loadExpenses();
    } catch (err: any) {
      setError('Failed to add expense. Please try again.');
      if (import.meta.env.DEV) {
        console.error('Add expense error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    setLoading(true);
    try {
      await expenseService.deleteExpense(id);
      await loadExpenses();
    } catch (err: any) {
      setError('Failed to delete expense. Please try again.');
      if (import.meta.env.DEV) {
        console.error('Delete expense error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: ExpenseCategory) => {
    const icons = {
      accommodation: '🏨',
      transport: '🚗',
      food: '🍽️',
      activities: '🎯',
      other: '💰',
    };
    return icons[category];
  };

  const getCategoryName = (category: ExpenseCategory) => {
    const names = {
      accommodation: 'Accommodation',
      transport: 'Transport',
      food: 'Food & Dining',
      activities: 'Activities',
      other: 'Other',
    };
    return names[category];
  };

  const getPlannedAmount = (category: ExpenseCategory): number => {
    // Simplified: distribute budget evenly across categories
    // In a real app, this could be more sophisticated
    const categoryCount = 5; // accommodation, transport, food, activities, other
    return plannedBudget / categoryCount;
  };

  const calculateProgress = (category: ExpenseCategory): number => {
    const planned = getPlannedAmount(category);
    const actual = summary[category];
    if (planned === 0) return 0;
    return Math.min((actual / planned) * 100, 100);
  };

  const isOverBudget = (category: ExpenseCategory): boolean => {
    return summary[category] > getPlannedAmount(category);
  };

  const totalPlanned = plannedBudget;
  const totalActual = summary.total;
  const totalProgress = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
  const totalOverBudget = totalActual > totalPlanned;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Expense Tracker</h3>
        </div>
        {!isAddingExpense && (
          <button
            onClick={() => setIsAddingExpense(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add Expense Form */}
      {isAddingExpense && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="accommodation">🏨 Accommodation</option>
                <option value="transport">🚗 Transport</option>
                <option value="food">🍽️ Food & Dining</option>
                <option value="activities">🎯 Activities</option>
                <option value="other">💰 Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={formData.amount_inr}
                onChange={(e) => setFormData({ ...formData, amount_inr: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What did you spend on?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddExpense}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Expense
            </button>
            <button
              onClick={() => {
                setIsAddingExpense(false);
                setError(null);
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Budget Comparison */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-semibold text-gray-700">Planned vs Actual</h4>

        {(['accommodation', 'transport', 'food', 'activities'] as ExpenseCategory[]).map((category) => {
          const planned = getPlannedAmount(category);
          const actual = summary[category];
          const progress = calculateProgress(category);
          const overBudget = isOverBudget(category);

          return (
            <div key={category} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span>{getCategoryIcon(category)}</span>
                  <span className="font-medium text-gray-700">{getCategoryName(category)}</span>
                </span>
                <span className={`font-semibold ${overBudget ? 'text-red-600' : 'text-gray-900'}`}>
                  ₹{actual.toLocaleString('en-IN')} / ₹{planned.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    overBudget ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Total */}
        <div className="pt-4 border-t border-gray-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Total Spent</span>
            <div className="flex items-center gap-2">
              {totalOverBudget ? (
                <TrendingUp className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500" />
              )}
              <span className={`font-bold text-lg ${totalOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                ₹{totalActual.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                totalOverBudget ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(totalProgress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Budget: ₹{totalPlanned.toLocaleString('en-IN')}</span>
            <span>{totalProgress.toFixed(1)}% used</span>
          </div>
        </div>
      </div>

      {/* Expense List */}
      {expenses.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Expenses</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{getCategoryIcon(expense.category)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{expense.description}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(expense.expense_date).toLocaleDateString('en-IN')} •{' '}
                      {getCategoryName(expense.category)}
                    </p>
                    {expense.notes && (
                      <p className="text-xs text-gray-500 mt-1">{expense.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">
                    ₹{expense.amount_inr.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Delete expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length === 0 && !isAddingExpense && !loading && (
        <div className="text-center py-8 text-gray-500">
          <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No expenses added yet</p>
          <p className="text-xs mt-1">Click "Add Expense" to start tracking</p>
        </div>
      )}

      {/* Expense Split Summary */}
      {tripId && <div className="mt-6"><ExpenseSplitSummary tripId={tripId} /></div>}
    </div>
  );
};
