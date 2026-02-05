-- ============================================
-- Fix Performance Tab RLS Policies
-- Run this script in Supabase SQL Editor to fix RLS issues
-- ============================================

-- Step 1: Ensure can_access_workspace function exists and is correct
-- This version handles missing parent_account_id column gracefully
CREATE OR REPLACE FUNCTION public.can_access_workspace(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check direct membership first (always works)
  IF EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = _user_id AND team_id = _team_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check parent account access (only if parent_account_id column exists)
  BEGIN
    RETURN EXISTS (
      SELECT 1 FROM public.team_members tm
      JOIN public.teams t ON t.parent_account_id = tm.team_id
      WHERE tm.user_id = _user_id AND t.id = _team_id
        AND tm.role IN ('admin', 'owner')
    );
  EXCEPTION WHEN undefined_column THEN
    -- Column doesn't exist yet - return FALSE (no parent account access)
    RETURN FALSE;
  END;
END;
$$;

-- Step 2: Fix funnel_leads SELECT policy
DROP POLICY IF EXISTS "Team members can view their funnel leads" ON public.funnel_leads;
DROP POLICY IF EXISTS "Users can view funnel leads" ON public.funnel_leads;

CREATE POLICY "Users can view funnel leads"
ON public.funnel_leads FOR SELECT
USING (public.can_access_workspace(auth.uid(), team_id));

-- Step 3: Fix funnels SELECT policy (needed for Performance tab to work)
DROP POLICY IF EXISTS "Team members can view their funnels" ON public.funnels;
DROP POLICY IF EXISTS "Users can view funnels" ON public.funnels;

CREATE POLICY "Users can view funnels"
ON public.funnels FOR SELECT
USING (public.can_access_workspace(auth.uid(), team_id));

-- Step 4: Fix events SELECT policy for consistency
DROP POLICY IF EXISTS "Team members can view funnel events" ON public.events;
DROP POLICY IF EXISTS "Users can view funnel events" ON public.events;

-- Ensure get_funnel_team_id function exists
CREATE OR REPLACE FUNCTION public.get_funnel_team_id(p_funnel_id text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM funnels WHERE id::text = p_funnel_id LIMIT 1
$$;

CREATE POLICY "Users can view funnel events"
ON public.events FOR SELECT
USING (public.can_access_workspace(auth.uid(), public.get_funnel_team_id(funnel_id)));

-- Step 5: Verify policies were created correctly
SELECT 
  'funnel_leads' as table_name,
  policyname,
  cmd as command
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'funnel_leads'
  AND cmd = 'SELECT'
UNION ALL
SELECT 
  'funnels' as table_name,
  policyname,
  cmd as command
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'funnels'
  AND cmd = 'SELECT'
UNION ALL
SELECT 
  'events' as table_name,
  policyname,
  cmd as command
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'events'
  AND cmd = 'SELECT'
ORDER BY table_name, policyname;

-- Step 6: Test can_access_workspace function
-- This will show TRUE if you can access your teams
SELECT 
  t.id as team_id,
  t.name as team_name,
  public.can_access_workspace(auth.uid(), t.id) as can_access
FROM teams t
WHERE t.id IN (
  SELECT team_id FROM team_members WHERE user_id = auth.uid()
)
ORDER BY t.name;

-- Step 7: Test funnel_leads query (should return data if RLS is correct)
SELECT 
  COUNT(*) as visible_leads,
  COUNT(DISTINCT funnel_id) as unique_funnels,
  MIN(created_at) as oldest_lead,
  MAX(created_at) as newest_lead
FROM funnel_leads
WHERE team_id IN (
  SELECT team_id FROM team_members WHERE user_id = auth.uid()
);

-- Success message
SELECT 'RLS policies updated successfully! Refresh your Performance tab to see data.' as status;
