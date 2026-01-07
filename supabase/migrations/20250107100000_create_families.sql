-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Family',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Index for faster lookups
CREATE INDEX idx_families_created_at ON families(created_at);
