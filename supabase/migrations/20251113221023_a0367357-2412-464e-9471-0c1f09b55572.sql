-- Add conditional follow-up control column
ALTER TABLE team_follow_up_flow_config
ADD COLUMN IF NOT EXISTS require_no_status_change_for_next BOOLEAN DEFAULT true;

-- Update the auto_create_next_follow_up trigger function to respect the new setting
CREATE OR REPLACE FUNCTION public.auto_create_next_follow_up()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_appointment RECORD;
  v_next_config RECORD;
  v_original_stage TEXT;
  v_current_config RECORD;
BEGIN
  -- Only proceed if task was just completed and is a follow-up
  IF NEW.status = 'completed' 
     AND OLD.status != 'completed' 
     AND NEW.task_type = 'follow_up' 
  THEN
    
    -- Get the current task's config to check the conditional setting
    SELECT * INTO v_current_config
    FROM team_follow_up_flow_config
    WHERE team_id = NEW.team_id
      AND pipeline_stage = NEW.pipeline_stage
      AND sequence = NEW.follow_up_sequence
    LIMIT 1;
    
    -- Get appointment's current stage
    SELECT pipeline_stage INTO v_appointment
    FROM appointments
    WHERE id = NEW.appointment_id;
    
    -- Get the original stage this follow-up was for
    v_original_stage := NEW.pipeline_stage;
    
    -- Check if we should proceed based on the conditional setting
    -- If require_no_status_change_for_next is false, always create next follow-up
    -- If true, only create if stage hasn't changed
    IF (v_current_config.require_no_status_change_for_next = false) 
       OR (v_appointment.pipeline_stage = v_original_stage) 
    THEN
      
      -- Look up next follow-up config
      SELECT * INTO v_next_config
      FROM team_follow_up_flow_config
      WHERE team_id = NEW.team_id
        AND pipeline_stage = v_original_stage
        AND sequence = (NEW.follow_up_sequence + 1)
        AND enabled = true
      LIMIT 1;
      
      -- If next config exists, create the task
      IF FOUND THEN
        INSERT INTO confirmation_tasks (
          team_id,
          appointment_id,
          task_type,
          pipeline_stage,
          follow_up_sequence,
          due_at,
          status,
          assigned_role,
          routing_mode
        ) VALUES (
          NEW.team_id,
          NEW.appointment_id,
          'follow_up',
          v_original_stage,
          NEW.follow_up_sequence + 1,
          NOW() + (v_next_config.hours_after * INTERVAL '1 hour'),
          'pending',
          v_next_config.assigned_role,
          'auto_chained'
        );
      END IF;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;