import { supabase } from '../lib/supabase';

export type ExpenseCategory = 'accommodation' | 'transport' | 'food' | 'activities' | 'other';

export interface TripExpense {
  id: string;
  user_id: string;
  trip_id?: string;
  category: ExpenseCategory;
  description: string;
  amount_inr: number;
  expense_date: string;
  notes?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseSummary {
  accommodation: number;
  transport: number;
  food: number;
  activities: number;
  other: number;
  total: number;
}

export const expenseService = {
  /**
   * Get all expenses for a specific trip
   */
  async getExpensesByTrip(tripId: string): Promise<TripExpense[]> {
    const { data, error } = await supabase
      .from('trip_expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: false });

    if (error) {
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) {
          console.error('Error fetching expenses:', error);
        }
        if (import.meta.env.DEV) {
          console.error('Error fetching expenses:', error);
        }}
      throw error;
    }

    return data || [];
  },

  /**
   * Get expense summary for a trip
   */
  async getExpenseSummary(tripId: string): Promise<ExpenseSummary> {
    const expenses = await this.getExpensesByTrip(tripId);

    const summary: ExpenseSummary = {
      accommodation: 0,
      transport: 0,
      food: 0,
      activities: 0,
      other: 0,
      total: 0,
    };

    expenses.forEach((expense) => {
      summary[expense.category] += expense.amount_inr;
      summary.total += expense.amount_inr;
    });

    return summary;
  },

  /**
   * Add a new expense
   */
  async addExpense(expense: Omit<TripExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<TripExpense> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated to add expenses');
    }

    const { data, error } = await supabase
      .from('trip_expenses')
      .insert({
        user_id: user.id,
        ...expense,
      })
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) {
          console.error('Error adding expense:', error);
        }
        if (import.meta.env.DEV) {
          console.error('Error adding expense:', error);
        }}
      throw error;
    }

    return data;
  },

  /**
   * Update an expense
   */
  async updateExpense(id: string, updates: Partial<Omit<TripExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const { error } = await supabase
      .from('trip_expenses')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) {
          console.error('Error updating expense:', error);
        }
        if (import.meta.env.DEV) {
          console.error('Error updating expense:', error);
        }}
      throw error;
    }
  },

  /**
   * Delete an expense
   */
  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase.from('trip_expenses').delete().eq('id', id);

    if (error) {
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) {
          console.error('Error deleting expense:', error);
        }
        if (import.meta.env.DEV) {
          console.error('Error deleting expense:', error);
        }}
      throw error;
    }
  },

  /**
   * Get all expenses for the current user (not trip-specific)
   */
  async getAllUserExpenses(): Promise<TripExpense[]> {
    const { data, error } = await supabase
      .from('trip_expenses')
      .select('*')
      .order('expense_date', { ascending: false });

    if (error) {
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) {
          console.error('Error fetching user expenses:', error);
        }
        if (import.meta.env.DEV) {
          console.error('Error fetching user expenses:', error);
        }}
      throw error;
    }

    return data || [];
  },
};

