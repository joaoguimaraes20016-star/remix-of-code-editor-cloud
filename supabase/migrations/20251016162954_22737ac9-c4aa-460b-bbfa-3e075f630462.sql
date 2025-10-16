-- Allow anyone to view team invitations by token (needed for signup flow)
CREATE POLICY "Anyone can view invitations by token"
ON team_invitations
FOR SELECT
TO anon
USING (true);

-- Update policy to allow invited users to accept invitations
CREATE POLICY "Users can update invitations they received"
ON team_invitations
FOR UPDATE
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));