-- Create payment_events table to store webhook events from all payment providers
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'stripe', 'whop', 'fanbasis'
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL, -- Provider's event ID for deduplication
  customer_id TEXT,
  customer_email TEXT,
  amount INTEGER, -- In cents
  currency TEXT,
  status TEXT,
  subscription_id TEXT,
  product_id TEXT,
  raw_data JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint for deduplication
  UNIQUE(team_id, provider, event_id)
);

-- Enable RLS
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view their payment events"
ON public.payment_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = payment_events.team_id
    AND team_members.user_id = auth.uid()
  )
);

-- Service role can insert (for webhooks)
CREATE POLICY "Service role can insert payment events"
ON public.payment_events
FOR INSERT
WITH CHECK (true);

-- Index for common queries
CREATE INDEX idx_payment_events_team_provider ON public.payment_events(team_id, provider);
CREATE INDEX idx_payment_events_event_type ON public.payment_events(event_type);
CREATE INDEX idx_payment_events_customer_email ON public.payment_events(customer_email);
CREATE INDEX idx_payment_events_created_at ON public.payment_events(created_at DESC);