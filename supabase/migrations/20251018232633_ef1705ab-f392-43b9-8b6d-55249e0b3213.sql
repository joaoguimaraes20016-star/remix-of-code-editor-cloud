-- Add super admin to felipe@grwthengine.org
-- First, get the user_id for felipe@grwthengine.org
DO $$
DECLARE
  felipe_user_id uuid;
BEGIN
  -- Get user ID
  SELECT id INTO felipe_user_id 
  FROM auth.users 
  WHERE email = 'felipe@grwthengine.org';
  
  -- Only proceed if user exists
  IF felipe_user_id IS NOT NULL THEN
    -- Insert or update to super_admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (felipe_user_id, 'super_admin'::global_role)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'super_admin'::global_role;
  END IF;
END $$;

-- Update team_members policies to allow super admins full access
DROP POLICY IF EXISTS "Super admins can manage all team members" ON public.team_members;
CREATE POLICY "Super admins can manage all team members"
ON public.team_members
FOR ALL
USING (has_global_role(auth.uid(), 'super_admin'::global_role));

-- Update teams policies to allow super admins full access
DROP POLICY IF EXISTS "Super admins can manage all teams" ON public.teams;
CREATE POLICY "Super admins can manage all teams"
ON public.teams
FOR ALL
USING (has_global_role(auth.uid(), 'super_admin'::global_role));

-- Update team_invitations to allow super admins to manage all invitations
DROP POLICY IF EXISTS "Super admins can manage all invitations" ON public.team_invitations;
CREATE POLICY "Super admins can manage all invitations"
ON public.team_invitations
FOR ALL
USING (has_global_role(auth.uid(), 'super_admin'::global_role));