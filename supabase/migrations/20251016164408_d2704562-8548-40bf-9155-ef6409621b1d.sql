-- Add foreign key constraint from team_members to profiles
ALTER TABLE team_members 
DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;

ALTER TABLE team_members
ADD CONSTRAINT team_members_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;