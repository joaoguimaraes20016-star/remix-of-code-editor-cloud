-- Update RLS policy to allow offer_owner to update teams
DROP POLICY IF EXISTS "Team owners can update teams" ON public.teams;

CREATE POLICY "Team owners and offer owners can update teams"
ON public.teams
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM team_members
    WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'offer_owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM team_members
    WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'offer_owner')
  )
);