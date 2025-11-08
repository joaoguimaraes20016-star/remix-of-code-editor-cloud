-- Create team_follow_up_flow_config table
CREATE TABLE team_follow_up_flow_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  pipeline_stage TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  label TEXT NOT NULL,
  hours_after INTEGER NOT NULL,
  assigned_role TEXT NOT NULL DEFAULT 'setter',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, pipeline_stage, sequence)
);

-- Enable RLS
ALTER TABLE team_follow_up_flow_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view follow-up flow config"
ON team_follow_up_flow_config FOR SELECT
USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Admins can manage follow-up flow config"
ON team_follow_up_flow_config FOR ALL
USING (
  is_team_member(auth.uid(), team_id) AND 
  (has_team_role(auth.uid(), team_id, 'admin') OR has_team_role(auth.uid(), team_id, 'offer_owner'))
);

-- Add follow_up_sequence column to confirmation_tasks
ALTER TABLE confirmation_tasks
ADD COLUMN IF NOT EXISTS follow_up_sequence INTEGER DEFAULT 1;

-- Function to initialize default follow-up flow config for existing teams
CREATE OR REPLACE FUNCTION initialize_follow_up_flow_config()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  team_record RECORD;
BEGIN
  FOR team_record IN SELECT id FROM teams LOOP
    -- No Show default flow
    INSERT INTO team_follow_up_flow_config (team_id, pipeline_stage, sequence, label, hours_after, assigned_role, enabled)
    VALUES 
      (team_record.id, 'no_show', 1, 'First Follow-Up', 24, 'setter', true),
      (team_record.id, 'no_show', 2, 'Second Attempt', 72, 'closer', true)
    ON CONFLICT (team_id, pipeline_stage, sequence) DO NOTHING;
    
    -- Canceled default flow
    INSERT INTO team_follow_up_flow_config (team_id, pipeline_stage, sequence, label, hours_after, assigned_role, enabled)
    VALUES 
      (team_record.id, 'canceled', 1, 'Re-engagement Call', 48, 'setter', true)
    ON CONFLICT (team_id, pipeline_stage, sequence) DO NOTHING;
    
    -- Disqualified default flow
    INSERT INTO team_follow_up_flow_config (team_id, pipeline_stage, sequence, label, hours_after, assigned_role, enabled)
    VALUES 
      (team_record.id, 'disqualified', 1, 'Future Nurture', 168, 'setter', true)
    ON CONFLICT (team_id, pipeline_stage, sequence) DO NOTHING;
  END LOOP;
END;
$$;

-- Initialize defaults for existing teams
SELECT initialize_follow_up_flow_config();

-- Trigger to initialize follow-up flow for new teams
CREATE OR REPLACE FUNCTION initialize_team_follow_up_flow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO team_follow_up_flow_config (team_id, pipeline_stage, sequence, label, hours_after, assigned_role, enabled)
  VALUES 
    (NEW.id, 'no_show', 1, 'First Follow-Up', 24, 'setter', true),
    (NEW.id, 'no_show', 2, 'Second Attempt', 72, 'closer', true),
    (NEW.id, 'canceled', 1, 'Re-engagement Call', 48, 'setter', true),
    (NEW.id, 'disqualified', 1, 'Future Nurture', 168, 'setter', true);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_initialize_team_follow_up_flow
AFTER INSERT ON teams
FOR EACH ROW
EXECUTE FUNCTION initialize_team_follow_up_flow();