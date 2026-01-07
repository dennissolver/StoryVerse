-- Parental Controls & Cultural Preferences
-- Only family admins/parents can modify these settings

-- Family cultural and content preferences
CREATE TABLE IF NOT EXISTS family_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE UNIQUE,
  
  -- Parental PIN for settings access (hashed)
  settings_pin_hash TEXT,
  pin_attempts INTEGER DEFAULT 0,
  pin_locked_until TIMESTAMPTZ,
  
  -- Cultural & Religious Background (affects story themes and imagery)
  cultural_background TEXT[], -- e.g., ['east-asian', 'christian', 'secular']
  religious_tradition TEXT, -- e.g., 'none', 'christian', 'muslim', 'jewish', 'hindu', 'buddhist', 'sikh', 'other'
  religious_observance_level TEXT DEFAULT 'secular', -- 'secular', 'cultural', 'observant', 'strict'
  
  -- Dietary preferences (affects food shown in stories)
  dietary_preferences TEXT[] DEFAULT '{}', -- e.g., ['halal', 'kosher', 'vegetarian', 'no-pork']
  
  -- Holiday/Celebration preferences
  celebrate_religious_holidays BOOLEAN DEFAULT true,
  celebrate_secular_holidays BOOLEAN DEFAULT true,
  specific_holidays TEXT[] DEFAULT '{}', -- holidays to include/feature
  excluded_holidays TEXT[] DEFAULT '{}', -- holidays to avoid
  
  -- Content boundaries (what to include/exclude)
  allow_magic_fantasy BOOLEAN DEFAULT true,
  allow_mythology TEXT DEFAULT 'all', -- 'all', 'own-culture', 'none'
  allow_talking_animals BOOLEAN DEFAULT true,
  allow_supernatural_elements BOOLEAN DEFAULT true,
  
  -- Family structure representation
  family_structure TEXT DEFAULT 'diverse', -- 'diverse', 'traditional', 'single-parent', 'same-gender', 'extended', 'custom'
  custom_family_notes TEXT,
  
  -- Gender and relationships
  gender_representation TEXT DEFAULT 'balanced', -- 'balanced', 'traditional', 'neutral'
  
  -- Violence and conflict
  conflict_level TEXT DEFAULT 'mild', -- 'none', 'mild', 'moderate' (age-appropriate)
  allow_mild_peril BOOLEAN DEFAULT true,
  
  -- Educational preferences
  include_educational_content BOOLEAN DEFAULT true,
  educational_focus TEXT[] DEFAULT '{}', -- e.g., ['science', 'history', 'nature', 'social-emotional']
  
  -- Modesty and dress
  modesty_level TEXT DEFAULT 'standard', -- 'standard', 'modest', 'very-modest'
  
  -- Music and arts
  allow_music_themes BOOLEAN DEFAULT true,
  allow_dance_themes BOOLEAN DEFAULT true,
  
  -- Custom exclusions (parent-specified)
  excluded_themes TEXT[] DEFAULT '{}',
  excluded_elements TEXT[] DEFAULT '{}',
  custom_guidelines TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-child preference overrides (child-specific settings)
CREATE TABLE IF NOT EXISTS child_content_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE UNIQUE,
  
  -- Override family settings for this child
  use_family_defaults BOOLEAN DEFAULT true,
  
  -- Child-specific overrides (only used if use_family_defaults = false)
  allow_magic_fantasy BOOLEAN DEFAULT true,
  allow_scary_elements BOOLEAN DEFAULT false, -- more conservative default for kids
  conflict_level TEXT DEFAULT 'mild',
  
  -- Specific fears/sensitivities to avoid
  avoid_themes TEXT[] DEFAULT '{}', -- e.g., ['dogs', 'water', 'dark', 'separation']
  
  -- Special interests to emphasize
  favorite_themes TEXT[] DEFAULT '{}',
  
  -- Accessibility needs
  needs_simple_language BOOLEAN DEFAULT false,
  needs_high_contrast_images BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family member roles and permissions
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role determines permissions
  role TEXT NOT NULL DEFAULT 'viewer', -- 'admin', 'parent', 'caregiver', 'viewer', 'child'
  
  -- Relationship to children (for display/personalization)
  relationship TEXT, -- 'mother', 'father', 'grandparent', 'aunt', 'uncle', 'guardian', 'nanny', 'sibling'
  
  -- What this member can do
  can_create_books BOOLEAN DEFAULT true,
  can_modify_children BOOLEAN DEFAULT false,
  can_modify_settings BOOLEAN DEFAULT false,
  can_manage_subscription BOOLEAN DEFAULT false,
  can_invite_members BOOLEAN DEFAULT false,
  
  -- Verification
  verified_adult BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'active', -- 'pending', 'active', 'suspended'
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(family_id, user_id)
);

-- Audit log for parental control changes
CREATE TABLE IF NOT EXISTS parental_control_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'settings_updated', 'pin_changed', 'member_added', 'permissions_changed'
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE family_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_content_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE parental_control_audit ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies are defined in 20250107101700_comprehensive_rls_policies.sql

-- Function to verify PIN
CREATE OR REPLACE FUNCTION verify_settings_pin(p_family_id UUID, p_pin TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_pin_hash TEXT;
  v_attempts INTEGER;
  v_locked_until TIMESTAMPTZ;
BEGIN
  SELECT settings_pin_hash, pin_attempts, pin_locked_until
  INTO v_pin_hash, v_attempts, v_locked_until
  FROM family_preferences
  WHERE family_id = p_family_id;
  
  -- Check if locked
  IF v_locked_until IS NOT NULL AND v_locked_until > NOW() THEN
    RETURN false;
  END IF;
  
  -- Verify PIN (using pgcrypto)
  IF v_pin_hash = crypt(p_pin, v_pin_hash) THEN
    -- Reset attempts on success
    UPDATE family_preferences 
    SET pin_attempts = 0, pin_locked_until = NULL
    WHERE family_id = p_family_id;
    RETURN true;
  ELSE
    -- Increment attempts
    UPDATE family_preferences 
    SET pin_attempts = pin_attempts + 1,
        pin_locked_until = CASE 
          WHEN pin_attempts >= 4 THEN NOW() + INTERVAL '15 minutes'
          ELSE NULL
        END
    WHERE family_id = p_family_id;
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set PIN
CREATE OR REPLACE FUNCTION set_settings_pin(p_family_id UUID, p_pin TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE family_preferences 
  SET settings_pin_hash = crypt(p_pin, gen_salt('bf')),
      pin_attempts = 0,
      pin_locked_until = NULL
  WHERE family_id = p_family_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences when family is created
CREATE OR REPLACE FUNCTION create_family_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO family_preferences (family_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_family_created_preferences
  AFTER INSERT ON families
  FOR EACH ROW
  EXECUTE FUNCTION create_family_preferences();

-- Indexes
CREATE INDEX idx_family_preferences_family ON family_preferences(family_id);
CREATE INDEX idx_child_content_prefs_child ON child_content_preferences(child_id);
CREATE INDEX idx_family_members_family ON family_members(family_id);
CREATE INDEX idx_family_members_user ON family_members(user_id);
CREATE INDEX idx_parental_audit_family ON parental_control_audit(family_id);
