-- =============================================
-- TWILIO RESELLER / WHITE-LABEL SYSTEM
-- =============================================

-- 1. Team Credits (Wallet for each team)
CREATE TABLE public.team_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  sms_balance integer NOT NULL DEFAULT 0,
  voice_minutes_balance integer NOT NULL DEFAULT 0,
  whatsapp_balance integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_credits_team_id_unique UNIQUE (team_id)
);

-- 2. Credit Transactions (Audit trail)
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  transaction_type text NOT NULL, -- 'purchase', 'usage', 'refund', 'bonus', 'number_rental'
  channel text NOT NULL, -- 'sms', 'voice', 'whatsapp', 'number'
  amount integer NOT NULL, -- Positive=add, Negative=deduct
  balance_after integer NOT NULL,
  reference_id text, -- Stripe payment ID, message_log ID, or phone_number_sid
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Team Phone Numbers (Provisioned from master Twilio account)
CREATE TABLE public.team_phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  phone_number_sid text NOT NULL, -- Twilio PN SID
  friendly_name text,
  country_code text NOT NULL DEFAULT 'US',
  capabilities jsonb NOT NULL DEFAULT '{"sms": true, "voice": true, "mms": false, "whatsapp": false}'::jsonb,
  monthly_cost_cents integer NOT NULL DEFAULT 250, -- $2.50/month charged to team
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  webhook_configured boolean NOT NULL DEFAULT false,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  CONSTRAINT team_phone_numbers_phone_unique UNIQUE (phone_number),
  CONSTRAINT team_phone_numbers_sid_unique UNIQUE (phone_number_sid)
);

-- 4. Messaging Pricing Configuration
CREATE TABLE public.messaging_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL, -- 'sms', 'voice', 'whatsapp'
  country_code text NOT NULL DEFAULT 'US',
  direction text NOT NULL DEFAULT 'outbound', -- 'outbound', 'inbound'
  credits_per_unit integer NOT NULL DEFAULT 1, -- Credits per message/minute
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT messaging_pricing_unique UNIQUE (channel, country_code, direction)
);

-- Insert default pricing
INSERT INTO public.messaging_pricing (channel, country_code, direction, credits_per_unit, description) VALUES
  ('sms', 'US', 'outbound', 1, '1 credit per outbound SMS'),
  ('sms', 'US', 'inbound', 0, 'Free inbound SMS'),
  ('voice', 'US', 'outbound', 2, '2 credits per outbound voice minute'),
  ('voice', 'US', 'inbound', 1, '1 credit per inbound voice minute'),
  ('whatsapp', 'US', 'outbound', 1, '1 credit per outbound WhatsApp message'),
  ('whatsapp', 'US', 'inbound', 0, 'Free inbound WhatsApp messages');

-- 5. Credit Packages (What users can buy)
CREATE TABLE public.credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credits integer NOT NULL,
  price_cents integer NOT NULL, -- Price in cents
  channel text NOT NULL DEFAULT 'sms', -- 'sms', 'voice', 'whatsapp', 'universal'
  stripe_price_id text, -- For Stripe integration
  is_popular boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default credit packages
INSERT INTO public.credit_packages (name, credits, price_cents, channel, is_popular, sort_order) VALUES
  ('Starter', 500, 1000, 'sms', false, 1),
  ('Growth', 1500, 2500, 'sms', true, 2),
  ('Pro', 5000, 7500, 'sms', false, 3),
  ('Enterprise', 15000, 20000, 'sms', false, 4);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.team_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

-- Team Credits: Team members can view, only service role can modify
CREATE POLICY "Team members can view their credits"
  ON public.team_credits FOR SELECT
  USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Service role can manage credits"
  ON public.team_credits FOR ALL
  USING (true);

-- Credit Transactions: Team members can view their own
CREATE POLICY "Team members can view their transactions"
  ON public.credit_transactions FOR SELECT
  USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Service role can insert transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (true);

-- Team Phone Numbers: Team admins can manage
CREATE POLICY "Team members can view their phone numbers"
  ON public.team_phone_numbers FOR SELECT
  USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can manage phone numbers"
  ON public.team_phone_numbers FOR ALL
  USING (is_team_admin(auth.uid(), team_id));

-- Messaging Pricing: Anyone can read (public pricing)
CREATE POLICY "Anyone can view messaging pricing"
  ON public.messaging_pricing FOR SELECT
  USING (is_active = true);

-- Credit Packages: Anyone can read active packages
CREATE POLICY "Anyone can view credit packages"
  ON public.credit_packages FOR SELECT
  USING (is_active = true);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_credit_transactions_team_id ON public.credit_transactions(team_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX idx_team_phone_numbers_team_id ON public.team_phone_numbers(team_id);
CREATE INDEX idx_team_phone_numbers_active ON public.team_phone_numbers(team_id) WHERE is_active = true;

-- =============================================
-- TRIGGER FOR updated_at
-- =============================================

CREATE TRIGGER update_team_credits_updated_at
  BEFORE UPDATE ON public.team_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messaging_pricing_updated_at
  BEFORE UPDATE ON public.messaging_pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- HELPER FUNCTION: Deduct credits atomically
-- =============================================

CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_team_id uuid,
  p_channel text,
  p_amount integer,
  p_reference_id text DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
  v_column_name text;
BEGIN
  -- Determine which balance column to use
  CASE p_channel
    WHEN 'sms' THEN v_column_name := 'sms_balance';
    WHEN 'voice' THEN v_column_name := 'voice_minutes_balance';
    WHEN 'whatsapp' THEN v_column_name := 'whatsapp_balance';
    ELSE RETURN jsonb_build_object('success', false, 'error', 'Invalid channel');
  END CASE;

  -- Get current balance with row lock
  EXECUTE format('SELECT %I FROM team_credits WHERE team_id = $1 FOR UPDATE', v_column_name)
  INTO v_current_balance
  USING p_team_id;

  -- Check if team has credits record
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No credits found for team');
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient credits',
      'current_balance', v_current_balance,
      'required', p_amount
    );
  END IF;

  -- Deduct credits
  v_new_balance := v_current_balance - p_amount;
  
  EXECUTE format('UPDATE team_credits SET %I = $1, updated_at = now() WHERE team_id = $2', v_column_name)
  USING v_new_balance, p_team_id;

  -- Log transaction
  INSERT INTO credit_transactions (team_id, transaction_type, channel, amount, balance_after, reference_id, description)
  VALUES (p_team_id, 'usage', p_channel, -p_amount, v_new_balance, p_reference_id, p_description);

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'deducted', p_amount
  );
END;
$$;

-- =============================================
-- HELPER FUNCTION: Add credits
-- =============================================

CREATE OR REPLACE FUNCTION public.add_credits(
  p_team_id uuid,
  p_channel text,
  p_amount integer,
  p_transaction_type text DEFAULT 'purchase',
  p_reference_id text DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
  v_column_name text;
BEGIN
  -- Determine which balance column to use
  CASE p_channel
    WHEN 'sms' THEN v_column_name := 'sms_balance';
    WHEN 'voice' THEN v_column_name := 'voice_minutes_balance';
    WHEN 'whatsapp' THEN v_column_name := 'whatsapp_balance';
    ELSE RETURN jsonb_build_object('success', false, 'error', 'Invalid channel');
  END CASE;

  -- Ensure team has credits record (upsert)
  INSERT INTO team_credits (team_id)
  VALUES (p_team_id)
  ON CONFLICT (team_id) DO NOTHING;

  -- Get current balance with row lock
  EXECUTE format('SELECT %I FROM team_credits WHERE team_id = $1 FOR UPDATE', v_column_name)
  INTO v_current_balance
  USING p_team_id;

  -- Add credits
  v_new_balance := COALESCE(v_current_balance, 0) + p_amount;
  
  EXECUTE format('UPDATE team_credits SET %I = $1, updated_at = now() WHERE team_id = $2', v_column_name)
  USING v_new_balance, p_team_id;

  -- Log transaction
  INSERT INTO credit_transactions (team_id, transaction_type, channel, amount, balance_after, reference_id, description)
  VALUES (p_team_id, p_transaction_type, p_channel, p_amount, v_new_balance, p_reference_id, p_description);

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', COALESCE(v_current_balance, 0),
    'new_balance', v_new_balance,
    'added', p_amount
  );
END;
$$;