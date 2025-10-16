-- Add account_type to profiles to track if user is a creator or invited member
ALTER TABLE public.profiles 
ADD COLUMN account_type TEXT DEFAULT 'invited' CHECK (account_type IN ('creator', 'invited'));

-- Update existing team owners to be creators
UPDATE public.profiles
SET account_type = 'creator'
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM public.team_members 
  WHERE role = 'owner'
);

-- Create function to check if user is a creator
CREATE OR REPLACE FUNCTION public.is_creator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT account_type = 'creator' FROM public.profiles WHERE id = _user_id),
    false
  )
$$;

-- Update the can_create_teams function to only allow creators
CREATE OR REPLACE FUNCTION public.can_create_teams(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT is_creator(_user_id)
$$;