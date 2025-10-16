-- Drop the problematic invitation policy
DROP POLICY IF EXISTS "Users can join team with valid invitation" ON team_members;

-- Create a security definer function to check invitation validity
CREATE OR REPLACE FUNCTION public.has_valid_invitation(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_invitations ti
    WHERE ti.team_id = _team_id
      AND ti.email = (SELECT email FROM auth.users WHERE id = _user_id)
      AND ti.accepted_at IS NULL
      AND ti.expires_at > now()
  )
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can join team with valid invitation"
ON team_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND has_valid_invitation(auth.uid(), team_id)
);