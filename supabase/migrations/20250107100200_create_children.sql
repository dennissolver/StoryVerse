-- Create children table
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say')),
  photo_url TEXT,
  interests TEXT[] DEFAULT '{}',
  reading_level TEXT CHECK (reading_level IN ('emerging', 'early', 'fluent', 'advanced')),
  favorite_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view family children" ON children
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert family children" ON children
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update family children" ON children
  FOR UPDATE USING (
    family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete family children" ON children
  FOR DELETE USING (
    family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
  );

-- Indexes
CREATE INDEX idx_children_family_id ON children(family_id);
