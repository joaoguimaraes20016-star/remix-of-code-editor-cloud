-- Migration: create events table for funnel event sink
-- Run via supabase migrations or paste into Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  funnel_id text NOT NULL,
  step_id text NOT NULL,
  element_id text,
  lead_id text,
  session_id text NOT NULL,
  dedupe_key text NOT NULL UNIQUE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS events_lead_created_at_idx ON public.events (lead_id, created_at);
CREATE INDEX IF NOT EXISTS events_session_created_at_idx ON public.events (session_id, created_at);
CREATE INDEX IF NOT EXISTS events_funnel_created_at_idx ON public.events (funnel_id, created_at);
