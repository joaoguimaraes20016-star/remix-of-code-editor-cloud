-- ============================================
-- Native Booking System
-- Creates event_types, availability_schedules, availability_overrides,
-- google_calendar_connections, booking_reminders tables.
-- Extends appointments table with native booking columns.
-- Adds booking_slug to teams for public booking URLs.
-- ============================================

-- ============================================
-- 1. EVENT TYPES
-- Booking templates (like Calendly event types)
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  buffer_before_minutes integer DEFAULT 0,
  buffer_after_minutes integer DEFAULT 5,
  max_bookings_per_day integer,
  min_notice_hours integer DEFAULT 1,
  max_advance_days integer DEFAULT 60,
  color text DEFAULT '#3B82F6',
  location_type text DEFAULT 'zoom' CHECK (location_type IN ('zoom', 'google_meet', 'phone', 'in_person', 'custom')),
  location_value text,
  confirmation_type text DEFAULT 'automatic' CHECK (confirmation_type IN ('automatic', 'manual')),
  is_active boolean DEFAULT true,
  round_robin_mode text DEFAULT 'none' CHECK (round_robin_mode IN ('none', 'round_robin', 'availability_based')),
  round_robin_members uuid[] DEFAULT '{}',
  last_assigned_index integer DEFAULT 0,
  questions jsonb DEFAULT '[]',
  reminder_config jsonb DEFAULT '[{"type":"email","template":"24h_before","offset_hours":24},{"type":"email","template":"1h_before","offset_hours":1}]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, slug)
);

-- ============================================
-- 2. AVAILABILITY SCHEDULES
-- Weekly working hours per user
-- ============================================
CREATE TABLE IF NOT EXISTS public.availability_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '17:00',
  is_available boolean DEFAULT true,
  timezone text DEFAULT 'America/New_York',
  UNIQUE(team_id, user_id, day_of_week)
);

-- ============================================
-- 3. AVAILABILITY OVERRIDES
-- Date-specific exceptions (day off, custom hours)
-- ============================================
CREATE TABLE IF NOT EXISTS public.availability_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time,
  end_time time,
  is_available boolean DEFAULT false,
  reason text,
  UNIQUE(team_id, user_id, date)
);

-- ============================================
-- 4. GOOGLE CALENDAR CONNECTIONS
-- Per-user Google Calendar sync config
-- ============================================
CREATE TABLE IF NOT EXISTS public.google_calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  calendar_id text DEFAULT 'primary',
  sync_enabled boolean DEFAULT true,
  last_synced_at timestamptz,
  busy_calendars text[] DEFAULT '{primary}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- ============================================
-- 5. BOOKING REMINDERS
-- Scheduled reminders for upcoming appointments
-- ============================================
CREATE TABLE IF NOT EXISTS public.booking_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('email', 'sms')),
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  template text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for efficient cron job queries
CREATE INDEX IF NOT EXISTS idx_booking_reminders_pending
  ON public.booking_reminders (scheduled_for)
  WHERE status = 'pending';

-- ============================================
-- 6. EXTEND APPOINTMENTS TABLE
-- Add native booking columns
-- ============================================
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS source text DEFAULT 'calendly';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS booking_token text UNIQUE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS intake_answers jsonb;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS google_calendar_event_id text;

-- Index for booking token lookups (public reschedule/cancel)
CREATE INDEX IF NOT EXISTS idx_appointments_booking_token
  ON public.appointments (booking_token)
  WHERE booking_token IS NOT NULL;

-- ============================================
-- 7. ADD BOOKING SLUG TO TEAMS
-- URL-safe identifier for /book/:teamSlug/:eventSlug
-- ============================================
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS booking_slug text UNIQUE;

-- ============================================
-- 8. RLS POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_reminders ENABLE ROW LEVEL SECURITY;

-- EVENT TYPES: team members can CRUD their team's event types
CREATE POLICY "Team members can view event types"
  ON public.event_types FOR SELECT
  USING (public.can_access_workspace(auth.uid(), team_id));

CREATE POLICY "Team members can create event types"
  ON public.event_types FOR INSERT
  WITH CHECK (public.can_access_workspace(auth.uid(), team_id));

CREATE POLICY "Team members can update event types"
  ON public.event_types FOR UPDATE
  USING (public.can_access_workspace(auth.uid(), team_id));

CREATE POLICY "Team members can delete event types"
  ON public.event_types FOR DELETE
  USING (public.can_access_workspace(auth.uid(), team_id));

-- Service role bypass for edge functions
CREATE POLICY "Service role manages event types"
  ON public.event_types FOR ALL
  USING (auth.role() = 'service_role');

-- AVAILABILITY SCHEDULES: users CRUD their own
CREATE POLICY "Users can view own availability"
  ON public.availability_schedules FOR SELECT
  USING (public.can_access_workspace(auth.uid(), team_id));

CREATE POLICY "Users can create own availability"
  ON public.availability_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.can_access_workspace(auth.uid(), team_id));

CREATE POLICY "Users can update own availability"
  ON public.availability_schedules FOR UPDATE
  USING (auth.uid() = user_id AND public.can_access_workspace(auth.uid(), team_id));

CREATE POLICY "Users can delete own availability"
  ON public.availability_schedules FOR DELETE
  USING (auth.uid() = user_id AND public.can_access_workspace(auth.uid(), team_id));

-- Service role bypass for edge functions (slot calculation)
CREATE POLICY "Service role manages availability schedules"
  ON public.availability_schedules FOR ALL
  USING (auth.role() = 'service_role');

-- AVAILABILITY OVERRIDES: users CRUD their own
CREATE POLICY "Users can view own overrides"
  ON public.availability_overrides FOR SELECT
  USING (public.can_access_workspace(auth.uid(), team_id));

CREATE POLICY "Users can create own overrides"
  ON public.availability_overrides FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.can_access_workspace(auth.uid(), team_id));

CREATE POLICY "Users can update own overrides"
  ON public.availability_overrides FOR UPDATE
  USING (auth.uid() = user_id AND public.can_access_workspace(auth.uid(), team_id));

CREATE POLICY "Users can delete own overrides"
  ON public.availability_overrides FOR DELETE
  USING (auth.uid() = user_id AND public.can_access_workspace(auth.uid(), team_id));

-- Service role bypass
CREATE POLICY "Service role manages availability overrides"
  ON public.availability_overrides FOR ALL
  USING (auth.role() = 'service_role');

-- GOOGLE CALENDAR CONNECTIONS: users CRUD their own
CREATE POLICY "Users can view own gcal connections"
  ON public.google_calendar_connections FOR SELECT
  USING (auth.uid() = user_id AND public.can_access_workspace(auth.uid(), team_id));

CREATE POLICY "Users can create own gcal connections"
  ON public.google_calendar_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.can_access_workspace(auth.uid(), team_id));

CREATE POLICY "Users can update own gcal connections"
  ON public.google_calendar_connections FOR UPDATE
  USING (auth.uid() = user_id AND public.can_access_workspace(auth.uid(), team_id));

CREATE POLICY "Users can delete own gcal connections"
  ON public.google_calendar_connections FOR DELETE
  USING (auth.uid() = user_id AND public.can_access_workspace(auth.uid(), team_id));

-- Service role bypass
CREATE POLICY "Service role manages gcal connections"
  ON public.google_calendar_connections FOR ALL
  USING (auth.role() = 'service_role');

-- BOOKING REMINDERS: service role only
CREATE POLICY "Service role manages booking reminders"
  ON public.booking_reminders FOR ALL
  USING (auth.role() = 'service_role');

-- Team members can view their team's reminders (read-only)
CREATE POLICY "Team members can view booking reminders"
  ON public.booking_reminders FOR SELECT
  USING (public.can_access_workspace(auth.uid(), team_id));

-- ============================================
-- 9. UPDATED_AT TRIGGER FOR NEW TABLES
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Event types updated_at trigger
DROP TRIGGER IF EXISTS update_event_types_updated_at ON public.event_types;
CREATE TRIGGER update_event_types_updated_at
  BEFORE UPDATE ON public.event_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Google calendar connections updated_at trigger
DROP TRIGGER IF EXISTS update_google_calendar_connections_updated_at ON public.google_calendar_connections;
CREATE TRIGGER update_google_calendar_connections_updated_at
  BEFORE UPDATE ON public.google_calendar_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
