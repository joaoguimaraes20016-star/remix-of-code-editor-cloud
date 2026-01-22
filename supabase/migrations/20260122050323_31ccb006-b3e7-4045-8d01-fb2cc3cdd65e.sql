-- Phase 1: Expand contacts table with GHL-grade fields
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address_1 text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address_2 text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country text DEFAULT 'US';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dnd_sms boolean DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dnd_email boolean DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dnd_voice boolean DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS owner_user_id uuid;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS engagement_score integer DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_type text DEFAULT 'lead';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS signature text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS calendar_link text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS twilio_phone text;

-- Expand appointments table with missing fields
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_link text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS add_to_google_calendar_link text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS add_to_ical_link text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_notes text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_timezone text DEFAULT 'America/New_York';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 30;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS assigned_user_id uuid;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS calendar_id uuid;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type_id uuid;

-- Create workflow_versions table for versioning support
CREATE TABLE IF NOT EXISTS workflow_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  definition_json jsonb NOT NULL,
  trigger_type text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  published_by uuid,
  is_active boolean DEFAULT true,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(automation_id, version_number)
);

-- Enable RLS on workflow_versions
ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for workflow_versions (using auth.uid() pattern)
CREATE POLICY "Team members can view workflow versions"
ON workflow_versions FOR SELECT
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can create workflow versions"
ON workflow_versions FOR INSERT
WITH CHECK (public.is_team_admin(auth.uid(), team_id));

CREATE POLICY "Team admins can update workflow versions"
ON workflow_versions FOR UPDATE
USING (public.is_team_admin(auth.uid(), team_id));

-- Add version tracking to automations
ALTER TABLE automations ADD COLUMN IF NOT EXISTS current_version_id uuid;
ALTER TABLE automation_runs ADD COLUMN IF NOT EXISTS version_id uuid;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_engagement ON contacts(team_id, engagement_score);
CREATE INDEX IF NOT EXISTS idx_contacts_last_activity ON contacts(team_id, last_activity_at);
CREATE INDEX IF NOT EXISTS idx_workflow_versions_automation ON workflow_versions(automation_id, version_number DESC);

-- Create a function to derive full_name
CREATE OR REPLACE FUNCTION get_contact_full_name(contact_row contacts)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT TRIM(COALESCE(contact_row.first_name, '') || ' ' || COALESCE(contact_row.last_name, ''))
$$;