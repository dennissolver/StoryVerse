-- Create user profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to create profile and family on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id UUID;
BEGIN
  -- Create a new family for the user
  INSERT INTO families (name) VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Family') || '''s Family')
  RETURNING id INTO new_family_id;
  
  -- Create the user profile
  INSERT INTO user_profiles (id, email, full_name, family_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    new_family_id,
    'owner'
  );
  
  -- Create a default subscription
  INSERT INTO subscriptions (family_id, tier, status)
  VALUES (new_family_id, 'free', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
