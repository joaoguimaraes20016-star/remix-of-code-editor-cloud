
-- Drop the existing policy that only allows self-updates
DROP POLICY IF EXISTS "Team members can update their own booking code" ON team_members;

-- Create new policies for booking code updates
-- Policy 1: Users can update their own booking code
CREATE POLICY "Users can update own booking code"
ON team_members
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Admins and owners can update booking codes for their team members
CREATE POLICY "Admins can update team booking codes"
ON team_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'owner', 'offer_owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'owner', 'offer_owner')
  )
);
