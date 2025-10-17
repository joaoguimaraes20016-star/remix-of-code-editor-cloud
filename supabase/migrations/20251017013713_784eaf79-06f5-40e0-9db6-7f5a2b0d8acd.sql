-- Drop the restrictive policy and replace with one that allows unauthenticated access by token
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON team_invitations;

-- Allow anyone (including unauthenticated users) to view invitations by token
CREATE POLICY "Anyone can view invitations by token"
ON team_invitations
FOR SELECT
TO anon, authenticated
USING (true);