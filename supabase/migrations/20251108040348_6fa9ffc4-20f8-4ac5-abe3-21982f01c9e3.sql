-- Drop the old 6-parameter version of create_task_with_assignment
DROP FUNCTION IF EXISTS create_task_with_assignment(uuid, uuid, task_type, date, text, date);