-- Migration 004: Trip Sharing
-- Add shareable links functionality

-- Add share columns to saved_trips
ALTER TABLE saved_trips ADD COLUMN IF NOT EXISTS share_id TEXT UNIQUE;
ALTER TABLE saved_trips ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Index for public shared trips
CREATE INDEX IF NOT EXISTS idx_saved_trips_share_id ON saved_trips(share_id) WHERE is_public = true;

-- RLS: Allow public to view shared trips
CREATE POLICY IF NOT EXISTS "Public can view shared trips" ON saved_trips
  FOR SELECT
  USING (is_public = true AND share_id IS NOT NULL);
