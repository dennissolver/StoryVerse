-- Enable pgcrypto for secure token generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create family invites table
CREATE TABLE IF NOT EXISTS family_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies are defined in 20250107101700_comprehensive_rls_policies.sql

-- Indexes
CREATE INDEX idx_family_invites_family_id ON family_invites(family_id);
CREATE INDEX idx_family_invites_token ON family_invites(token);
