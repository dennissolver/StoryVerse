-- Create subscriptions table for Stripe billing
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'seedling', 'growing', 'family')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  books_this_month INTEGER DEFAULT 0,
  voice_clones_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view family subscription" ON subscriptions
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (true);

-- Indexes
CREATE INDEX idx_subscriptions_family_id ON subscriptions(family_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- Function to check book creation limits
CREATE OR REPLACE FUNCTION check_book_limit(p_family_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  sub RECORD;
  tier_limit INTEGER;
BEGIN
  SELECT * INTO sub FROM subscriptions WHERE family_id = p_family_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  tier_limit := CASE sub.tier
    WHEN 'free' THEN 1
    WHEN 'seedling' THEN 2
    WHEN 'growing' THEN 4
    WHEN 'family' THEN 999
    ELSE 0
  END;
  
  RETURN sub.books_this_month < tier_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's family_id
CREATE OR REPLACE FUNCTION get_user_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;
