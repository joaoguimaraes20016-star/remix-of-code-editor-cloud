-- Create team_billing table for wallet and Stripe info
CREATE TABLE public.team_billing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_payment_method_id TEXT,
  payment_method_brand TEXT,
  payment_method_last4 TEXT,
  wallet_balance_cents INTEGER NOT NULL DEFAULT 0,
  auto_recharge_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_recharge_threshold_cents INTEGER NOT NULL DEFAULT 500,
  auto_recharge_amount_cents INTEGER NOT NULL DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT team_billing_team_id_key UNIQUE (team_id),
  CONSTRAINT wallet_balance_non_negative CHECK (wallet_balance_cents >= 0),
  CONSTRAINT threshold_positive CHECK (auto_recharge_threshold_cents > 0),
  CONSTRAINT recharge_amount_positive CHECK (auto_recharge_amount_cents >= 500)
);

-- Create wallet_transactions table for transaction history
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'usage', 'refund', 'auto_recharge')),
  amount_cents INTEGER NOT NULL,
  balance_after_cents INTEGER NOT NULL,
  channel TEXT CHECK (channel IN ('email', 'sms', 'voice', 'whatsapp')),
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create channel_pricing table for per-unit costs
CREATE TABLE public.channel_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel TEXT NOT NULL UNIQUE CHECK (channel IN ('email', 'sms', 'voice', 'whatsapp')),
  unit_price_cents NUMERIC(10, 4) NOT NULL,
  unit_label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default pricing
INSERT INTO public.channel_pricing (channel, unit_price_cents, unit_label) VALUES
  ('email', 0.1, 'email'),
  ('sms', 0.8, 'message'),
  ('voice', 3.0, 'minute'),
  ('whatsapp', 1.0, 'message');

-- Enable RLS
ALTER TABLE public.team_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_billing (admin only)
CREATE POLICY "Team admins can view billing" ON public.team_billing
  FOR SELECT USING (is_team_admin(auth.uid(), team_id));

CREATE POLICY "Team admins can update billing" ON public.team_billing
  FOR UPDATE USING (is_team_admin(auth.uid(), team_id));

CREATE POLICY "Team admins can insert billing" ON public.team_billing
  FOR INSERT WITH CHECK (is_team_admin(auth.uid(), team_id));

-- RLS Policies for wallet_transactions (admin only)
CREATE POLICY "Team admins can view transactions" ON public.wallet_transactions
  FOR SELECT USING (is_team_admin(auth.uid(), team_id));

CREATE POLICY "Team admins can insert transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (is_team_admin(auth.uid(), team_id));

-- RLS Policies for channel_pricing (public read)
CREATE POLICY "Anyone can view pricing" ON public.channel_pricing
  FOR SELECT USING (true);

-- Create indexes
CREATE INDEX idx_team_billing_team_id ON public.team_billing(team_id);
CREATE INDEX idx_wallet_transactions_team_id ON public.wallet_transactions(team_id);
CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_team_billing_updated_at
  BEFORE UPDATE ON public.team_billing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_channel_pricing_updated_at
  BEFORE UPDATE ON public.channel_pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to deduct from wallet with transaction logging
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(
  p_team_id UUID,
  p_amount_cents INTEGER,
  p_channel TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_billing RECORD;
BEGIN
  -- Get current balance with lock
  SELECT * INTO v_billing
  FROM team_billing
  WHERE team_id = p_team_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No billing record found');
  END IF;

  v_current_balance := v_billing.wallet_balance_cents;

  IF v_current_balance < p_amount_cents THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient wallet balance',
      'current_balance_cents', v_current_balance,
      'required_cents', p_amount_cents
    );
  END IF;

  v_new_balance := v_current_balance - p_amount_cents;

  -- Update balance
  UPDATE team_billing
  SET wallet_balance_cents = v_new_balance, updated_at = now()
  WHERE team_id = p_team_id;

  -- Log transaction
  INSERT INTO wallet_transactions (team_id, transaction_type, amount_cents, balance_after_cents, channel, reference_id, description)
  VALUES (p_team_id, 'usage', -p_amount_cents, v_new_balance, p_channel, p_reference_id, p_description);

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance_cents', v_current_balance,
    'new_balance_cents', v_new_balance,
    'deducted_cents', p_amount_cents,
    'should_auto_recharge', v_billing.auto_recharge_enabled AND v_new_balance < v_billing.auto_recharge_threshold_cents
  );
END;
$$;

-- Function to add funds to wallet
CREATE OR REPLACE FUNCTION public.add_wallet_balance(
  p_team_id UUID,
  p_amount_cents INTEGER,
  p_transaction_type TEXT DEFAULT 'deposit',
  p_reference_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Ensure billing record exists
  INSERT INTO team_billing (team_id)
  VALUES (p_team_id)
  ON CONFLICT (team_id) DO NOTHING;

  -- Update balance
  UPDATE team_billing
  SET wallet_balance_cents = wallet_balance_cents + p_amount_cents, updated_at = now()
  WHERE team_id = p_team_id
  RETURNING wallet_balance_cents INTO v_new_balance;

  -- Log transaction
  INSERT INTO wallet_transactions (team_id, transaction_type, amount_cents, balance_after_cents, reference_id, description)
  VALUES (p_team_id, p_transaction_type, p_amount_cents, v_new_balance, p_reference_id, p_description);

  RETURN jsonb_build_object(
    'success', true,
    'new_balance_cents', v_new_balance,
    'added_cents', p_amount_cents
  );
END;
$$;