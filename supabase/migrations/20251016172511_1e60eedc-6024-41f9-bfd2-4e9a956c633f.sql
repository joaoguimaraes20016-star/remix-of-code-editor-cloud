-- Allow anyone to read invitations by token (needed for signup flow)
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON team_invitations;

CREATE POLICY "Anyone can view invitations by token"
ON team_invitations
FOR SELECT
TO anon, authenticated
USING (true);