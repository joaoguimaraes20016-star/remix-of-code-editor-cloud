-- Add notification preferences and personal integration columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"new_leads": true, "task_reminders": true}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zoom_connected boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_meet_connected boolean DEFAULT false;