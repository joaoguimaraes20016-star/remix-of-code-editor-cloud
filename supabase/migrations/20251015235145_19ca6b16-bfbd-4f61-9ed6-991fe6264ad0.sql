-- Drop the problematic policies
DROP POLICY IF EXISTS "Team members can view team membership" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can manage members" ON public.team_members;

-- Create security definer function to check if user is team owner
CREATE OR REPLACE FUNCTION public.is_team_owner(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.team_id = _team_id
      AND team_members.user_id = _user_id
      AND team_members.role = 'owner'
  )
$$;

-- Create security definer function to check if user is team member
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.team_id = _team_id
      AND team_members.user_id = _user_id
  )
$$;

-- Recreate team_members policies using security definer functions
CREATE POLICY "Team members can view team membership"
  ON public.team_members FOR SELECT
  USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team owners can insert members"
  ON public.team_members FOR INSERT
  WITH CHECK (public.is_team_owner(auth.uid(), team_id));

CREATE POLICY "Team owners can update members"
  ON public.team_members FOR UPDATE
  USING (public.is_team_owner(auth.uid(), team_id));

CREATE POLICY "Team owners can delete members"
  ON public.team_members FOR DELETE
  USING (public.is_team_owner(auth.uid(), team_id));