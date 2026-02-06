-- ============================================
-- Fix Analytics RLS Policies
-- Ensures can_access_workspace() function exists and restores missing write policies
-- ============================================

-- 1. Ensure can_access_workspace() function exists
-- This is idempotent - safe to run multiple times
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

-- 2. Restore missing contacts write policies
-- The Feb 4 migration dropped the FOR ALL policy but only created FOR SELECT
-- This restores INSERT/UPDATE/DELETE for authenticated users

-- Drop old policies if they exist (cleanup)
DROP POLICY IF EXISTS "Team members can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Team members can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Team members can delete contacts" ON public.contacts;

-- Recreate with can_access_workspace
CREATE POLICY "Users can create contacts"
ON public.contacts FOR INSERT
WITH CHECK (public.can_access_workspace(auth.uid(), team_id));

CREATE POLICY "Users can update contacts"
ON public.contacts FOR UPDATE
USING (public.can_access_workspace(auth.uid(), team_id));

CREATE POLICY "Users can delete contacts"
ON public.contacts FOR DELETE
USING (public.can_access_workspace(auth.uid(), team_id));

-- 3. Ensure funnel_leads UPDATE policy exists
-- INSERT policy remains public (allows anonymous funnel submissions)
-- UPDATE policy needed for authenticated users to modify leads

DROP POLICY IF EXISTS "Team members can update funnel leads" ON public.funnel_leads;

CREATE POLICY "Users can update funnel leads"
ON public.funnel_leads FOR UPDATE
USING (public.can_access_workspace(auth.uid(), team_id));

-- Note: The "Service role can manage contacts" policy remains unchanged
-- This allows edge functions to insert/update contacts without RLS restrictions
