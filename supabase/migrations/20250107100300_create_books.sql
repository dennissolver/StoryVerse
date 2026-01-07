-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT CHECK (theme IN ('adventure', 'friendship', 'family', 'learning', 'nature', 'fantasy', 'bedtime', 'holidays', 'emotions')),
  illustration_style TEXT CHECK (illustration_style IN ('watercolor', 'cartoon', 'anime', 'realistic', 'storybook', 'whimsical')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'published', 'failed')),
  cover_url TEXT,
  page_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER,
  age_range TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view family books" ON books
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert family books" ON books
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update family books" ON books
  FOR UPDATE USING (
    family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
  );

-- Indexes
CREATE INDEX idx_books_family_id ON books(family_id);
CREATE INDEX idx_books_child_id ON books(child_id);
CREATE INDEX idx_books_status ON books(status);
