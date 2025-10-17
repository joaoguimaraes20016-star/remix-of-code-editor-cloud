-- Add delete policy for appointments (only owners and admins can delete)
CREATE POLICY "Owners and admins can delete appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (
  is_team_member(auth.uid(), team_id) AND 
  (has_team_role(auth.uid(), team_id, 'owner') OR has_team_role(auth.uid(), team_id, 'admin'))
);