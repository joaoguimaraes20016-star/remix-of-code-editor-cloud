-- Add offer_owner as a valid role for team members
-- First, check if the role constraint exists and update it
DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_members_role_check' 
    AND table_name = 'team_members'
  ) THEN
    ALTER TABLE public.team_members DROP CONSTRAINT team_members_role_check;
  END IF;
  
  -- Add new constraint with offer_owner included
  ALTER TABLE public.team_members 
  ADD CONSTRAINT team_members_role_check 
  CHECK (role IN ('owner', 'admin', 'closer', 'setter', 'member', 'offer_owner'));
END $$;

-- Update team_invitations role constraint as well
DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_invitations_role_check' 
    AND table_name = 'team_invitations'
  ) THEN
    ALTER TABLE public.team_invitations DROP CONSTRAINT team_invitations_role_check;
  END IF;
  
  -- Add new constraint with offer_owner included
  ALTER TABLE public.team_invitations 
  ADD CONSTRAINT team_invitations_role_check 
  CHECK (role IN ('owner', 'admin', 'closer', 'setter', 'member', 'offer_owner'));
END $$;