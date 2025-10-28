
-- Assign existing unassigned tasks to Byron on GRWTH ENGINE team
UPDATE confirmation_tasks
SET 
  assigned_to = '9042a9ed-7eac-4472-8c56-684a652bd33f',
  assigned_at = now(),
  auto_return_at = now() + interval '2 hours'
WHERE team_id = 'cdf7b6b7-750d-4a92-abd6-b1a39b0ce204'
  AND assigned_to IS NULL
  AND status = 'pending';

-- Log activity for these assignments
INSERT INTO activity_logs (team_id, appointment_id, actor_name, action_type, note)
SELECT 
  team_id,
  appointment_id,
  'System',
  'Assigned',
  'Task auto-assigned to setter'
FROM confirmation_tasks
WHERE team_id = 'cdf7b6b7-750d-4a92-abd6-b1a39b0ce204'
  AND assigned_to = '9042a9ed-7eac-4472-8c56-684a652bd33f'
  AND status = 'pending'
  AND assigned_at >= now() - interval '1 minute';
