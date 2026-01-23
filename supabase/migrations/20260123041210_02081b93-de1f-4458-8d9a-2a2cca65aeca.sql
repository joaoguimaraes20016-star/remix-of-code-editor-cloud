-- Complete the remaining security fixes

-- Drop conflicting policy before creating
DROP POLICY IF EXISTS "Team members can view their credits" ON public.team_credits;

-- Only team members can view their team's credits
CREATE POLICY "Team members can view their credits"
ON public.team_credits
FOR SELECT
USING (
  public.is_team_member(auth.uid(), team_id)
);

-- Drop and recreate admin policy for credits
DROP POLICY IF EXISTS "Team admins can manage credits" ON public.team_credits;

CREATE POLICY "Team admins can manage credits"
ON public.team_credits
FOR ALL
USING (
  public.is_team_admin(auth.uid(), team_id) OR public.is_team_owner(auth.uid(), team_id)
);

-- 5. Tighten contacts table RLS if needed
DROP POLICY IF EXISTS "contacts_team_policy" ON public.contacts;
DROP POLICY IF EXISTS "Contacts accessible to team members only" ON public.contacts;

CREATE POLICY "Contacts accessible to team members only"
ON public.contacts
FOR ALL
USING (
  public.is_team_member(auth.uid(), team_id)
)
WITH CHECK (
  public.is_team_member(auth.uid(), team_id)
);