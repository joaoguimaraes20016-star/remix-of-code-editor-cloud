-- Migration: Team-Wide Availability Support
-- Makes availability_schedules support both team-wide (user_id = NULL) and per-user modes
-- Adds availability_mode to event_types to control which mode is used

-- Step 1: Make user_id nullable in availability_schedules
ALTER TABLE public.availability_schedules 
  ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Drop existing unique constraint
ALTER TABLE public.availability_schedules 
  DROP CONSTRAINT IF EXISTS availability_schedules_team_id_user_id_day_of_week_key;

-- Step 3: Create new unique constraints supporting both modes
-- Team-wide schedules: one per team per day (user_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS availability_schedules_team_day_unique 
  ON public.availability_schedules(team_id, day_of_week) 
  WHERE user_id IS NULL;

-- Per-user schedules: one per user per team per day (user_id IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS availability_schedules_user_day_unique 
  ON public.availability_schedules(team_id, user_id, day_of_week) 
  WHERE user_id IS NOT NULL;

-- Step 4: Add availability_mode to event_types
ALTER TABLE public.event_types 
  ADD COLUMN IF NOT EXISTS availability_mode text DEFAULT 'team_wide' 
  CHECK (availability_mode IN ('team_wide', 'per_user'));

-- Step 5: Add google_calendar_mode to event_types (for Phase 4)
ALTER TABLE public.event_types 
  ADD COLUMN IF NOT EXISTS google_calendar_mode text DEFAULT 'per_user' 
  CHECK (google_calendar_mode IN ('team', 'per_user'));

-- Step 6: Update RLS policies for team-wide schedules
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Team members can view team availability" ON public.availability_schedules;
DROP POLICY IF EXISTS "Admins can manage team availability" ON public.availability_schedules;

-- Team members can view team-wide schedules
CREATE POLICY "Team members can view team availability"
  ON public.availability_schedules FOR SELECT
  USING (
    user_id IS NULL AND 
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = availability_schedules.team_id
      AND tm.user_id = auth.uid()
      AND tm.is_active = true
    )
  );

-- Admins can manage team-wide schedules
CREATE POLICY "Admins can manage team availability"
  ON public.availability_schedules FOR ALL
  USING (
    user_id IS NULL AND 
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = availability_schedules.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND tm.is_active = true
    )
  );

-- Step 7: Migrate existing per-user schedules to team-wide defaults
-- Create team-wide schedules from the first admin's schedule per team
INSERT INTO public.availability_schedules (team_id, user_id, day_of_week, start_time, end_time, is_available, timezone)
SELECT DISTINCT ON (a.team_id, a.day_of_week)
  a.team_id,
  NULL as user_id,  -- Team-wide
  a.day_of_week,
  a.start_time,
  a.end_time,
  a.is_available,
  a.timezone
FROM public.availability_schedules a
JOIN public.team_members tm ON tm.user_id = a.user_id AND tm.team_id = a.team_id
WHERE tm.role IN ('owner', 'admin')
  AND a.user_id IS NOT NULL  -- Only migrate existing per-user schedules
ORDER BY a.team_id, a.day_of_week, tm.created_at
ON CONFLICT DO NOTHING;

-- Step 8: Update availability_overrides to also support team-wide (make user_id nullable)
ALTER TABLE public.availability_overrides 
  ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing unique constraint
ALTER TABLE public.availability_overrides 
  DROP CONSTRAINT IF EXISTS availability_overrides_team_id_user_id_date_key;

-- Create new unique constraints for overrides
CREATE UNIQUE INDEX IF NOT EXISTS availability_overrides_team_date_unique 
  ON public.availability_overrides(team_id, date) 
  WHERE user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS availability_overrides_user_date_unique 
  ON public.availability_overrides(team_id, user_id, date) 
  WHERE user_id IS NOT NULL;
