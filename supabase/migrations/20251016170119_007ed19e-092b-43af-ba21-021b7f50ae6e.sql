-- Drop the complex invitation policy
DROP POLICY IF EXISTS "Users can join team with valid invitation" ON team_members;

-- Create a simpler policy that allows users to insert themselves if they have a valid invitation
CREATE POLICY "Users can join team with valid invitation"
ON team_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM team_invitations ti
    JOIN profiles p ON p.email = ti.email
    WHERE ti.team_id = team_members.team_id
      AND p.id = auth.uid()
      AND ti.accepted_at IS NULL
      AND ti.expires_at > now()
  )
);