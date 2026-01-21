-- Add email_balance to team_credits
ALTER TABLE public.team_credits 
ADD COLUMN IF NOT EXISTS email_balance integer NOT NULL DEFAULT 0;

-- Add email packages to credit_packages
INSERT INTO public.credit_packages (name, credits, price_cents, channel, is_active, is_popular, sort_order)
VALUES 
  ('Starter', 1000, 500, 'email', true, false, 1),
  ('Growth', 5000, 2000, 'email', true, true, 2),
  ('Pro', 25000, 7500, 'email', true, false, 3),
  ('Enterprise', 100000, 25000, 'email', true, false, 4)
ON CONFLICT DO NOTHING;

-- Add usage tracking columns to team_sending_domains
ALTER TABLE public.team_sending_domains 
ADD COLUMN IF NOT EXISTS emails_sent integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_email_at timestamp with time zone;

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.add_credits(uuid, text, integer, text, text, text);

-- Recreate add_credits function to handle email channel
CREATE FUNCTION public.add_credits(
  p_team_id uuid,
  p_channel text,
  p_amount integer,
  p_transaction_type text,
  p_description text DEFAULT NULL,
  p_reference_id text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  -- Get or create team credits record
  INSERT INTO team_credits (team_id, sms_balance, voice_minutes_balance, whatsapp_balance, email_balance)
  VALUES (p_team_id, 0, 0, 0, 0)
  ON CONFLICT (team_id) DO NOTHING;

  -- Update the appropriate balance based on channel
  IF p_channel = 'sms' THEN
    UPDATE team_credits 
    SET sms_balance = sms_balance + p_amount
    WHERE team_id = p_team_id
    RETURNING sms_balance INTO v_new_balance;
  ELSIF p_channel = 'voice' THEN
    UPDATE team_credits 
    SET voice_minutes_balance = voice_minutes_balance + p_amount
    WHERE team_id = p_team_id
    RETURNING voice_minutes_balance INTO v_new_balance;
  ELSIF p_channel = 'whatsapp' THEN
    UPDATE team_credits 
    SET whatsapp_balance = whatsapp_balance + p_amount
    WHERE team_id = p_team_id
    RETURNING whatsapp_balance INTO v_new_balance;
  ELSIF p_channel = 'email' THEN
    UPDATE team_credits 
    SET email_balance = email_balance + p_amount
    WHERE team_id = p_team_id
    RETURNING email_balance INTO v_new_balance;
  ELSE
    RAISE EXCEPTION 'Invalid channel: %', p_channel;
  END IF;

  -- Log the transaction
  INSERT INTO credit_transactions (
    team_id,
    channel,
    amount,
    balance_after,
    transaction_type,
    description,
    reference_id
  ) VALUES (
    p_team_id,
    p_channel,
    p_amount,
    v_new_balance,
    p_transaction_type,
    p_description,
    p_reference_id
  );

  RETURN v_new_balance;
END;
$$;