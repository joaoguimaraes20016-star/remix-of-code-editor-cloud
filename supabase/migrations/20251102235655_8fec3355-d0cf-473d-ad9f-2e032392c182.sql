-- Update has_team_role function to treat 'owner' as having admin permissions
-- This allows owners to perform all admin actions without updating individual RLS policies
CREATE OR REPLACE FUNCTION public.has_team_role(_user_id uuid, _team_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND (
        role = _role 
        OR (role = 'owner' AND _role = 'admin')
      )
  )
$$;