-- ==============================
-- Migration: Add task_added automation trigger
-- Fires when a new task is created in confirmation_tasks table
-- ==============================

-- ==============================
-- Task Added Trigger
-- Fires when a new task is inserted into confirmation_tasks
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_task_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM fire_automation_event(
    NEW.team_id,
    'task_added',
    jsonb_build_object(
      'meta', jsonb_build_object(
        'taskId', NEW.id,
        'title', NEW.title,
        'description', NEW.description,
        'dueDate', NEW.due_date,
        'status', NEW.status
      ),
      'lead', jsonb_build_object(
        'id', NEW.contact_id
      ),
      'appointment', CASE
        WHEN NEW.appointment_id IS NOT NULL THEN
          jsonb_build_object('id', NEW.appointment_id)
        ELSE NULL
      END
    ),
    'task_added:' || NEW.id || ':' || now()::text
  );
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_task_added_automation ON confirmation_tasks;

-- Create the trigger
CREATE TRIGGER on_task_added_automation
  AFTER INSERT ON confirmation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_automation_on_task_added();
