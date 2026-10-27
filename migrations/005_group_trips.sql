-- Migration 005: Group Trips
-- Add collaboration features

-- Trip members table
CREATE TABLE IF NOT EXISTS trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES saved_trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_members_trip ON trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_user ON trip_members(user_id);

-- Stop votes table
CREATE TABLE IF NOT EXISTS stop_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES saved_trips(id) ON DELETE CASCADE,
  stop_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, stop_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_stop_votes_trip_stop ON stop_votes(trip_id, stop_id);

-- Expense splits
ALTER TABLE trip_expenses ADD COLUMN IF NOT EXISTS paid_by_user_id UUID REFERENCES auth.users(id);
ALTER TABLE trip_expenses ADD COLUMN IF NOT EXISTS split_between UUID[] DEFAULT ARRAY[]::UUID[];

-- RLS Policies
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stop_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Members can view trip members" ON trip_members
  FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members WHERE trip_id = trip_members.trip_id AND user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Owners can manage members" ON trip_members
  FOR ALL
  USING (EXISTS (SELECT 1 FROM trip_members WHERE trip_id = trip_members.trip_id AND user_id = auth.uid() AND role = 'owner'));

CREATE POLICY IF NOT EXISTS "Members can vote" ON stop_votes
  FOR ALL
  USING (EXISTS (SELECT 1 FROM trip_members WHERE trip_id = stop_votes.trip_id AND user_id = auth.uid() AND status = 'accepted'));
