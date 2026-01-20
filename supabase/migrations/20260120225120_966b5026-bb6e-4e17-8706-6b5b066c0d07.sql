-- ============================================
-- GHL-Level Automation Engine Database Schema
-- ============================================

-- 1. Automation Step Logs - Detailed per-step execution logging
CREATE TABLE IF NOT EXISTS public.automation_step_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.automation_runs(id) ON DELETE CASCADE NOT NULL,
  step_id text NOT NULL,
  action_type text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms int,
  status text NOT NULL DEFAULT 'pending', -- pending, running, success, failed, skipped
  skip_reason text,
  input_snapshot jsonb,
  output_snapshot jsonb,
  error_message text,
  retry_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_step_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for automation_step_logs
CREATE POLICY "Team members can view their step logs"
  ON public.automation_step_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_runs ar
      JOIN public.team_members tm ON ar.team_id = tm.team_id
      WHERE ar.id = automation_step_logs.run_id
        AND tm.user_id = auth.uid()
    )
  );

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_step_logs_run_id ON public.automation_step_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_step_logs_status ON public.automation_step_logs(status);

-- 2. Scheduled Automation Jobs - For wait_until and scheduled triggers
CREATE TABLE IF NOT EXISTS public.scheduled_automation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  automation_id uuid REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL,
  run_id uuid REFERENCES public.automation_runs(id) ON DELETE CASCADE,
  step_id text,
  context_snapshot jsonb NOT NULL DEFAULT '{}',
  resume_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, running, completed, failed, canceled
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.scheduled_automation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Team members can view their scheduled jobs"
  ON public.scheduled_automation_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = scheduled_automation_jobs.team_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team admins can manage scheduled jobs"
  ON public.scheduled_automation_jobs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = scheduled_automation_jobs.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

-- Indexes for efficient job processing
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_resume ON public.scheduled_automation_jobs(resume_at) 
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_team ON public.scheduled_automation_jobs(team_id, status);

-- 3. Automation Rate Limits - Per-team/automation channel limits
CREATE TABLE IF NOT EXISTS public.automation_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  automation_id uuid REFERENCES public.automations(id) ON DELETE CASCADE,
  channel text NOT NULL, -- 'sms', 'email', 'voice'
  max_per_hour int DEFAULT 100,
  max_per_day int DEFAULT 1000,
  current_hour_count int DEFAULT 0,
  current_day_count int DEFAULT 0,
  hour_reset_at timestamptz,
  day_reset_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, automation_id, channel)
);

-- Enable RLS
ALTER TABLE public.automation_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Team admins can manage rate limits"
  ON public.automation_rate_limits
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = automation_rate_limits.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

-- 4. Team Business Hours - For business_hours action
CREATE TABLE IF NOT EXISTS public.team_business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  open_time time NOT NULL DEFAULT '09:00:00',
  close_time time NOT NULL DEFAULT '17:00:00',
  is_closed boolean DEFAULT false,
  timezone text DEFAULT 'America/New_York',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.team_business_hours ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Team members can view business hours"
  ON public.team_business_hours
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_business_hours.team_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team admins can manage business hours"
  ON public.team_business_hours
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_business_hours.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

-- 5. Automation Templates - Pre-built workflow templates
CREATE TABLE IF NOT EXISTS public.automation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL, -- 'lead_nurture', 'appointment', 'no_show', 'payment', 'onboarding', 'retention'
  icon text,
  definition jsonb NOT NULL, -- Same structure as automations.definition
  is_system boolean DEFAULT false, -- System templates vs user-created
  is_public boolean DEFAULT false, -- Shared with all teams
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE, -- NULL for system templates
  created_by uuid REFERENCES auth.users(id),
  use_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for templates
CREATE POLICY "Anyone can view system and public templates"
  ON public.automation_templates
  FOR SELECT
  USING (is_system = true OR is_public = true);

CREATE POLICY "Team members can view their team templates"
  ON public.automation_templates
  FOR SELECT
  USING (
    team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = automation_templates.team_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team admins can create templates"
  ON public.automation_templates
  FOR INSERT
  WITH CHECK (
    team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = automation_templates.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.automation_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_system ON public.automation_templates(is_system) WHERE is_system = true;

-- 6. Add columns to automation_runs for enhanced tracking
ALTER TABLE public.automation_runs 
  ADD COLUMN IF NOT EXISTS duration_ms int,
  ADD COLUMN IF NOT EXISTS replay_of_run_id uuid REFERENCES public.automation_runs(id);

-- 7. Add columns to automations for organization and stats
ALTER TABLE public.automations
  ADD COLUMN IF NOT EXISTS folder_id uuid,
  ADD COLUMN IF NOT EXISTS version int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS run_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_count int DEFAULT 0;

-- 8. Extend message_logs for delivery tracking
ALTER TABLE public.message_logs
  ADD COLUMN IF NOT EXISTS delivery_status text, -- queued, sent, delivered, failed, bounced
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS clicked_at timestamptz,
  ADD COLUMN IF NOT EXISTS provider_message_id text,
  ADD COLUMN IF NOT EXISTS webhook_payload jsonb;