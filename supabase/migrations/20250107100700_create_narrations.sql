-- Create narrations table for generated audio
CREATE TABLE IF NOT EXISTS narrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  voice_profile_id UUID REFERENCES voice_profiles(id),
  audio_url TEXT,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE narrations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view narrations" ON narrations
  FOR SELECT USING (
    book_id IN (
      SELECT id FROM books WHERE family_id IN (
        SELECT family_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert narrations" ON narrations
  FOR INSERT WITH CHECK (
    book_id IN (
      SELECT id FROM books WHERE family_id IN (
        SELECT family_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- Index
CREATE INDEX idx_narrations_book_id ON narrations(book_id);
