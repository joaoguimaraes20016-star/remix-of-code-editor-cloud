-- Add policy to allow owners and admins to assign appointments
CREATE POLICY "Owners and admins can assign appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  is_team_member(auth.uid(), team_id) AND (
    has_team_role(auth.uid(), team_id, 'owner'::text) OR 
    has_team_role(auth.uid(), team_id, 'admin'::text)
  )
)
WITH CHECK (
  is_team_member(auth.uid(), team_id) AND (
    has_team_role(auth.uid(), team_id, 'owner'::text) OR 
    has_team_role(auth.uid(), team_id, 'admin'::text)
  )
);