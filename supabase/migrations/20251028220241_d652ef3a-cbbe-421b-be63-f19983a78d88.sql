-- Add RLS policy to allow closers and admins to update deposit-related fields
CREATE POLICY "Closers and admins can update deposit fields"
ON appointments
FOR UPDATE
TO public
USING (
  is_team_member(auth.uid(), team_id) AND 
  (has_team_role(auth.uid(), team_id, 'closer') OR has_team_role(auth.uid(), team_id, 'admin'))
)
WITH CHECK (
  is_team_member(auth.uid(), team_id) AND 
  (has_team_role(auth.uid(), team_id, 'closer') OR has_team_role(auth.uid(), team_id, 'admin'))
);