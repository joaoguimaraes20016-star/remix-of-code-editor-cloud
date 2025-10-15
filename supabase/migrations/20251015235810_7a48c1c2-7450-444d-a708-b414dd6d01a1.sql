-- Drop and recreate the teams SELECT policy to allow creators to see their teams immediately
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;

CREATE POLICY "Team members can view their teams"
  ON public.teams FOR SELECT
  USING (
    -- Allow if user created the team
    auth.uid() = created_by
    OR
    -- Or if user is a team member
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );