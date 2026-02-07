-- Add notes column to confirmation_tasks for storing task titles/descriptions
-- This fixes the misuse of pipeline_stage column for task titles

ALTER TABLE confirmation_tasks 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment explaining the column purpose
COMMENT ON COLUMN confirmation_tasks.notes IS 'Task title or description. Used by automation actions to store custom task titles.';
