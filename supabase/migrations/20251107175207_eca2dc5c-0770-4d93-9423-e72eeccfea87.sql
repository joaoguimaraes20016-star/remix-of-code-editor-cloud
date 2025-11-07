-- Step 1: Backfill NULL due_at values for existing confirmation tasks
-- First, update tasks that have valid appointments
UPDATE confirmation_tasks ct
SET due_at = (
  SELECT 
    CASE 
      WHEN t.confirmation_schedule IS NOT NULL AND jsonb_array_length(t.confirmation_schedule) > 0
      THEN a.start_at_utc - ((t.confirmation_schedule->0->>'hours_before')::numeric * INTERVAL '1 hour')
      ELSE a.start_at_utc - INTERVAL '24 hours'
    END
  FROM appointments a
  JOIN teams t ON t.id = a.team_id
  WHERE a.id = ct.appointment_id
)
WHERE ct.due_at IS NULL
  AND ct.task_type = 'call_confirmation'
  AND ct.appointment_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM appointments a WHERE a.id = ct.appointment_id
  );

-- Step 2: Delete orphaned tasks (tasks without appointments or where calculation fails)
DELETE FROM confirmation_tasks
WHERE due_at IS NULL
  AND (appointment_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM appointments a WHERE a.id = appointment_id
  ));

-- Step 3: For any remaining NULL values, set to now() as fallback
UPDATE confirmation_tasks
SET due_at = now()
WHERE due_at IS NULL;

-- Step 4: Add NOT NULL constraint to prevent future NULL values
ALTER TABLE confirmation_tasks 
ALTER COLUMN due_at SET NOT NULL;