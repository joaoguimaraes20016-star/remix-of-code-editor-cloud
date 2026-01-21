-- =============================================
-- Automation Engine Solidification Migration
-- =============================================

-- 1. ENROLLMENT TRACKING
-- Tracks which contacts are enrolled in which automations to prevent duplicates

CREATE TABLE IF NOT EXISTS public.automation_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'exited', 'paused')),
  current_step_id TEXT,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  exit_reason TEXT,
  exited_at TIMESTAMPTZ,
  context_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one enrollment per contact per automation
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollment_unique_contact 
  ON public.automation_enrollments(automation_id, contact_id) 
  WHERE contact_id IS NOT NULL;

-- Index for querying by automation
CREATE INDEX IF NOT EXISTS idx_enrollments_automation ON public.automation_enrollments(automation_id);

-- Index for querying by contact
CREATE INDEX IF NOT EXISTS idx_enrollments_contact ON public.automation_enrollments(contact_id);

-- Index for querying active enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON public.automation_enrollments(status) WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.automation_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view their team's enrollments"
  ON public.automation_enrollments FOR SELECT
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Team members can insert enrollments"
  ON public.automation_enrollments FOR INSERT
  WITH CHECK (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Team members can update their team's enrollments"
  ON public.automation_enrollments FOR UPDATE
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

-- 2. AUTOMATION GOALS
-- Goals that can exit contacts from automations when met

CREATE TABLE IF NOT EXISTS public.automation_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  condition JSONB NOT NULL DEFAULT '[]',
  exit_on_goal BOOLEAN NOT NULL DEFAULT true,
  go_to_step_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by automation
CREATE INDEX IF NOT EXISTS idx_goals_automation ON public.automation_goals(automation_id);

-- Enable RLS
ALTER TABLE public.automation_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view their team's goals"
  ON public.automation_goals FOR SELECT
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Team members can manage their team's goals"
  ON public.automation_goals FOR ALL
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

-- 3. UPDATE TIMESTAMP TRIGGERS
CREATE OR REPLACE FUNCTION public.update_enrollment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_automation_enrollments_updated_at
  BEFORE UPDATE ON public.automation_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_enrollment_updated_at();

CREATE TRIGGER update_automation_goals_updated_at
  BEFORE UPDATE ON public.automation_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_enrollment_updated_at();

-- 4. FUNCTION TO FIRE AUTOMATION EVENT
-- This function can be called from DB triggers or edge functions to fire automations
CREATE OR REPLACE FUNCTION public.fire_automation_event(
  p_team_id UUID,
  p_trigger_type TEXT,
  p_event_payload JSONB,
  p_event_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  -- This function is a placeholder for now
  -- In production, you would use pg_net extension to call the edge function
  -- SELECT net.http_post(...)
  
  -- For now, we'll log the event and return
  INSERT INTO public.error_logs (error_type, error_message, error_context, team_id)
  VALUES (
    'automation_event_queued',
    'Automation event queued for processing',
    jsonb_build_object(
      'trigger_type', p_trigger_type,
      'event_payload', p_event_payload,
      'event_id', p_event_id
    ),
    p_team_id
  );
  
  RETURN jsonb_build_object('queued', true, 'trigger_type', p_trigger_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;