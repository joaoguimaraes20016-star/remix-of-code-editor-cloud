-- ============================================
-- Ensure All Existing Teams Are Main Accounts
-- Sets parent_account_id to NULL for all existing teams
-- This ensures teams created before the migration are treated as main accounts
-- ============================================

-- Set all existing teams (where parent_account_id is not already set) to be main accounts
-- This preserves existing team structure
UPDATE public.teams 
SET parent_account_id = NULL 
WHERE parent_account_id IS NULL;

-- Note: This is idempotent - running it multiple times won't cause issues
-- All teams without a parent are now explicitly main accounts
