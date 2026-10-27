-- Migration: Create saved_trips table
-- Description: Store user trip plans with RLS policies
-- Created: 2024

-- Create saved_trips table
CREATE TABLE IF NOT EXISTS saved_trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Trip data as JSONB for flexibility
  trip_data JSONB NOT NULL,
  
  -- Denormalized fields for easy querying and sorting
  destination_name TEXT NOT NULL,
  destination_state TEXT,
  start_city TEXT,
  departure_date DATE,
  days INTEGER,
  total_cost_inr NUMERIC(10, 2),
  mood TEXT,
  
  -- Trip status tracking
  is_visited BOOLEAN DEFAULT FALSE,
  visited_date TIMESTAMP,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE saved_trips ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own trips
CREATE POLICY "Users can view own trips"
  ON saved_trips
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own trips
CREATE POLICY "Users can insert own trips"
  ON saved_trips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own trips
CREATE POLICY "Users can update own trips"
  ON saved_trips
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own trips
CREATE POLICY "Users can delete own trips"
  ON saved_trips
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_trips_user_id ON saved_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_trips_created_at ON saved_trips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_trips_departure_date ON saved_trips(departure_date);
CREATE INDEX IF NOT EXISTS idx_saved_trips_is_visited ON saved_trips(is_visited);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on updates
CREATE TRIGGER update_saved_trips_updated_at
  BEFORE UPDATE ON saved_trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE saved_trips IS 'User-saved trip plans with full itinerary data';
COMMENT ON COLUMN saved_trips.trip_data IS 'Full GeneratedItinerary JSON object';
COMMENT ON COLUMN saved_trips.is_visited IS 'Whether the trip has been completed';
COMMENT ON COLUMN saved_trips.notes IS 'User notes about the trip';
