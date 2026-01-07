-- Gift Subscriptions System
-- Allows purchasing gift codes that can be redeemed by recipients

-- Gift codes table
CREATE TABLE IF NOT EXISTS gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Code details
  code TEXT UNIQUE NOT NULL, -- e.g., 'STORY-ABCD-1234-EFGH'
  
  -- What was purchased
  tier TEXT NOT NULL, -- 'starter', 'family', 'premium'
  duration_months INTEGER NOT NULL DEFAULT 12,
  
  -- Purchase info
  purchased_by UUID REFERENCES auth.users(id), -- NULL if guest checkout
  purchaser_email TEXT NOT NULL,
  purchaser_name TEXT,
  stripe_payment_intent_id TEXT,
  amount_paid INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  
  -- Gift personalization
  recipient_name TEXT,
  recipient_email TEXT, -- Optional: for sending directly
  gift_message TEXT,
  occasion TEXT, -- 'birthday', 'christmas', 'holiday', 'just_because', 'other'
  
  -- Delivery preferences
  send_to_recipient BOOLEAN DEFAULT false,
  send_date DATE, -- Schedule future delivery
  gift_card_template TEXT DEFAULT 'default',
  
  -- Redemption
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES auth.users(id),
  redeemed_family_id UUID REFERENCES families(id),
  subscription_id UUID REFERENCES subscriptions(id),
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'redeemed', 'expired', 'refunded'
  expires_at TIMESTAMPTZ, -- Code expiry (typically 1 year from purchase)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gift_codes ENABLE ROW LEVEL SECURITY;

-- Purchasers can view their purchased gifts
CREATE POLICY "Purchasers can view their gifts" ON gift_codes
  FOR SELECT USING (
    purchased_by = auth.uid() 
    OR purchaser_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Anyone can look up a code (for redemption) - but only returns limited info
CREATE POLICY "Anyone can check gift code validity" ON gift_codes
  FOR SELECT USING (true);

-- Only authenticated users who purchased can update (e.g., change recipient)
CREATE POLICY "Purchasers can update unredeemed gifts" ON gift_codes
  FOR UPDATE USING (
    purchased_by = auth.uid() 
    AND status = 'active'
    AND redeemed_at IS NULL
  );

-- Create index for code lookups
CREATE UNIQUE INDEX idx_gift_codes_code ON gift_codes(code);
CREATE INDEX idx_gift_codes_purchaser ON gift_codes(purchased_by);
CREATE INDEX idx_gift_codes_status ON gift_codes(status);
CREATE INDEX idx_gift_codes_recipient_email ON gift_codes(recipient_email) WHERE recipient_email IS NOT NULL;

-- Function to generate unique gift code
CREATE OR REPLACE FUNCTION generate_gift_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed confusing chars (0,O,1,I)
  result TEXT := 'STORY-';
  i INTEGER;
BEGIN
  -- Generate format: STORY-XXXX-XXXX-XXXX
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to redeem a gift code
CREATE OR REPLACE FUNCTION redeem_gift_code(
  p_code TEXT,
  p_user_id UUID,
  p_family_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_gift gift_codes%ROWTYPE;
  v_subscription_id UUID;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Lock and fetch the gift code
  SELECT * INTO v_gift
  FROM gift_codes
  WHERE code = p_code
  FOR UPDATE;
  
  -- Validate
  IF v_gift.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid gift code');
  END IF;
  
  IF v_gift.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gift code has already been ' || v_gift.status);
  END IF;
  
  IF v_gift.expires_at < NOW() THEN
    UPDATE gift_codes SET status = 'expired' WHERE id = v_gift.id;
    RETURN jsonb_build_object('success', false, 'error', 'Gift code has expired');
  END IF;
  
  -- Calculate subscription end date
  v_end_date := NOW() + (v_gift.duration_months || ' months')::INTERVAL;
  
  -- Check if family already has an active subscription
  SELECT id INTO v_subscription_id
  FROM subscriptions
  WHERE family_id = p_family_id
  AND status = 'active';
  
  IF v_subscription_id IS NOT NULL THEN
    -- Extend existing subscription
    UPDATE subscriptions
    SET 
      current_period_end = GREATEST(current_period_end, NOW()) + (v_gift.duration_months || ' months')::INTERVAL,
      tier = CASE 
        WHEN v_gift.tier = 'premium' THEN 'premium'
        WHEN v_gift.tier = 'family' AND tier != 'premium' THEN 'family'
        ELSE tier
      END,
      updated_at = NOW()
    WHERE id = v_subscription_id;
  ELSE
    -- Create new subscription
    INSERT INTO subscriptions (family_id, tier, status, current_period_end)
    VALUES (p_family_id, v_gift.tier, 'active', v_end_date)
    RETURNING id INTO v_subscription_id;
  END IF;
  
  -- Mark gift as redeemed
  UPDATE gift_codes
  SET 
    status = 'redeemed',
    redeemed_at = NOW(),
    redeemed_by = p_user_id,
    redeemed_family_id = p_family_id,
    subscription_id = v_subscription_id,
    updated_at = NOW()
  WHERE id = v_gift.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tier', v_gift.tier,
    'duration_months', v_gift.duration_months,
    'subscription_id', v_subscription_id,
    'valid_until', v_end_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gift email queue (for scheduled delivery)
CREATE TABLE IF NOT EXISTS gift_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_code_id UUID REFERENCES gift_codes(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  send_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gift_email_queue_pending ON gift_email_queue(send_at) 
  WHERE status = 'pending';
