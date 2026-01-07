-- Create voice profiles table for ElevenLabs voice clones
CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  elevenlabs_voice_id TEXT,
  sample_audio_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view family voice profiles" ON voice_profiles
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert voice profiles" ON voice_profiles
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update family voice profiles" ON voice_profiles
  FOR UPDATE USING (
    family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete family voice profiles" ON voice_profiles
  FOR DELETE USING (
    family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
  );

-- Indexes
CREATE INDEX idx_voice_profiles_family_id ON voice_profiles(family_id);
CREATE INDEX idx_voice_profiles_user_id ON voice_profiles(user_id);
