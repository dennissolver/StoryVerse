-- Onboarding sessions for voice agent family setup
-- Stores conversation state and extracted preferences

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  
  -- Conversation state
  state TEXT NOT NULL DEFAULT 'greeting',
  language TEXT NOT NULL DEFAULT 'en',
  
  -- Guardian verification
  guardian_verified BOOLEAN DEFAULT false,
  guardian_relationship TEXT,
  guardian_name TEXT,
  
  -- Family info gathered
  family_name TEXT,
  family_structure TEXT,
  
  -- Children info (JSONB array)
  children JSONB DEFAULT '[]'::jsonb,
  
  -- Cultural/Religious discovery
  cultural_background TEXT[],
  cultural_notes TEXT,
  religious_tradition TEXT,
  observance_level TEXT,
  religious_notes TEXT,
  
  -- Values and goals
  family_values TEXT[],
  educational_goals TEXT[],
  character_traits_to_encourage TEXT[],
  topics_to_explore TEXT[],
  topics_to_avoid TEXT[],
  
  -- Discovered preferences
  discovered_preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Full conversation history for context
  conversation_history JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies are defined in 20250107101700_comprehensive_rls_policies.sql

-- Index for faster lookups
CREATE INDEX idx_onboarding_sessions_family ON onboarding_sessions(family_id);
CREATE INDEX idx_onboarding_sessions_state ON onboarding_sessions(state);

-- Function to clean up old incomplete sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_onboarding_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM onboarding_sessions
  WHERE state != 'complete'
  AND updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
