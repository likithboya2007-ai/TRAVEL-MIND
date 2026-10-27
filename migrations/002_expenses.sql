-- Expense Tracking Schema
-- Run this in Supabase SQL Editor AFTER the saved_trips migration

-- Create expenses table
CREATE TABLE IF NOT EXISTS trip_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES saved_trips(id) ON DELETE CASCADE,
  
  -- Expense details
  category TEXT NOT NULL CHECK (category IN ('accommodation', 'transport', 'food', 'activities', 'other')),
  description TEXT NOT NULL,
  amount_inr DECIMAL(10, 2) NOT NULL CHECK (amount_inr >= 0),
  expense_date DATE NOT NULL,
  
  -- Optional details
  notes TEXT,
  receipt_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT valid_amount CHECK (amount_inr >= 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON trip_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON trip_expenses(user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON trip_expenses(user_id, category);

-- Enable Row Level Security
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own expenses" ON trip_expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON trip_expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON trip_expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON trip_expenses;

-- RLS Policies: Users can only access their own expenses

-- SELECT: Users can view their own expenses
CREATE POLICY "Users can view their own expenses"
  ON trip_expenses
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can create their own expenses
CREATE POLICY "Users can insert their own expenses"
  ON trip_expenses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own expenses
CREATE POLICY "Users can update their own expenses"
  ON trip_expenses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own expenses
CREATE POLICY "Users can delete their own expenses"
  ON trip_expenses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_trip_expenses_updated_at ON trip_expenses;
CREATE TRIGGER update_trip_expenses_updated_at
  BEFORE UPDATE ON trip_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for expense summaries per trip
CREATE OR REPLACE VIEW trip_expense_summary AS
SELECT 
  trip_id,
  user_id,
  category,
  SUM(amount_inr) as total_amount,
  COUNT(*) as expense_count,
  MIN(expense_date) as first_expense,
  MAX(expense_date) as last_expense
FROM trip_expenses
GROUP BY trip_id, user_id, category;

-- Grant access to the view
GRANT SELECT ON trip_expense_summary TO authenticated;
