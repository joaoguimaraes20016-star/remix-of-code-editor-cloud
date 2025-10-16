-- Allow team members to view profiles of other team members
CREATE POLICY "Team members can view teammate profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM team_members tm1
    JOIN team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = profiles.id
  )
);