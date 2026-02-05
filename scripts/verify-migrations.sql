-- ============================================
-- Verify Account/Subaccount Migrations
-- Run this after deploying migrations to verify everything is set up correctly
-- ============================================

-- 1. Check if parent_account_id column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'teams' 
  AND column_name = 'parent_account_id';

-- 2. Check if constraint exists
SELECT 
  constraint_name, 
  constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
  AND table_name = 'teams' 
  AND constraint_name = 'no_nested_subaccounts';

-- 3. Check if function exists
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'can_access_workspace';

-- 4. Check if index exists
SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'teams' 
  AND indexname = 'idx_teams_parent_account_id';

-- 5. Verify all existing teams are main accounts (parent_account_id IS NULL)
SELECT 
  COUNT(*) as total_teams,
  COUNT(CASE WHEN parent_account_id IS NULL THEN 1 END) as main_accounts,
  COUNT(CASE WHEN parent_account_id IS NOT NULL THEN 1 END) as subaccounts
FROM public.teams;

-- 6. Check RLS policies were updated
SELECT 
  schemaname, 
  tablename, 
  policyname
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE '%can view%'
ORDER BY tablename, policyname;
