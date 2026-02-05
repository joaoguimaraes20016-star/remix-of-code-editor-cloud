-- ============================================
-- Performance Tab Diagnostic Script
-- Run this in Supabase SQL Editor to diagnose RLS and data issues
-- ============================================

-- 1. Check if can_access_workspace function exists
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'can_access_workspace';

-- 2. Check if parent_account_id column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'teams' 
  AND column_name = 'parent_account_id';

-- 3. Check funnel_leads RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'funnel_leads'
ORDER BY policyname;

-- 4. Check events table RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'events'
ORDER BY policyname;

-- 5. Test can_access_workspace function with current user
-- Replace 'YOUR_USER_ID' with auth.uid() when running
SELECT 
  auth.uid() as current_user_id,
  public.can_access_workspace(auth.uid(), 'TEAM_ID_HERE'::uuid) as can_access;

-- 6. Check team_members for current user
SELECT 
  tm.team_id,
  t.name as team_name,
  tm.role,
  tm.created_at as member_since,
  t.parent_account_id,
  CASE 
    WHEN t.parent_account_id IS NULL THEN 'Main Account'
    ELSE 'Subaccount'
  END as account_type
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
WHERE tm.user_id = auth.uid()
ORDER BY tm.created_at DESC;

-- 7. Count funnel_leads by team (for current user's teams)
SELECT 
  t.id as team_id,
  t.name as team_name,
  COUNT(fl.id) as total_leads,
  COUNT(CASE WHEN fl.name IS NOT NULL OR fl.email IS NOT NULL OR fl.phone IS NOT NULL THEN 1 END) as contacts,
  MAX(fl.created_at) as latest_lead
FROM teams t
LEFT JOIN funnel_leads fl ON fl.team_id = t.id
WHERE t.id IN (
  SELECT team_id FROM team_members WHERE user_id = auth.uid()
)
GROUP BY t.id, t.name
ORDER BY total_leads DESC;

-- 8. Test direct query (should work if RLS is correct)
SELECT 
  COUNT(*) as visible_leads,
  COUNT(DISTINCT funnel_id) as unique_funnels,
  MIN(created_at) as oldest_lead,
  MAX(created_at) as newest_lead
FROM funnel_leads
WHERE team_id IN (
  SELECT team_id FROM team_members WHERE user_id = auth.uid()
);

-- 9. Check if get_funnel_team_id function exists (for events table)
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_funnel_team_id';

-- 10. Count events by team (for current user's teams)
SELECT 
  t.id as team_id,
  t.name as team_name,
  COUNT(e.id) as total_events,
  COUNT(DISTINCT e.funnel_id) as unique_funnels,
  COUNT(DISTINCT e.event_type) as event_types,
  MAX(e.created_at) as latest_event
FROM teams t
LEFT JOIN funnels f ON f.team_id = t.id
LEFT JOIN events e ON e.funnel_id = f.id::text
WHERE t.id IN (
  SELECT team_id FROM team_members WHERE user_id = auth.uid()
)
GROUP BY t.id, t.name
ORDER BY total_events DESC;

-- 11. Check for any RLS errors in recent logs (if available)
-- Note: This may not be available depending on Supabase plan
SELECT 
  'Run this query in Supabase Dashboard > Logs > Postgres Logs' as note,
  'Look for RLS policy violations or function errors' as instruction;
