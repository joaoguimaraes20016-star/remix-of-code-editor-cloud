-- ============================================
-- Update RLS Policies to Support Account/Subaccount Access
-- Updates key policies to use can_access_workspace() for parent account visibility
-- ============================================

-- Update funnel_leads SELECT policy to allow parent account access
DROP POLICY IF EXISTS "Team members can view their funnel leads" ON public.funnel_leads;
DROP POLICY IF EXISTS "Users can view funnel leads" ON public.funnel_leads;

CREATE POLICY "Users can view funnel leads"
ON public.funnel_leads FOR SELECT
USING (public.can_access_workspace(auth.uid(), team_id));

-- Update funnels SELECT policy to allow parent account access
DROP POLICY IF EXISTS "Team members can view their funnels" ON public.funnels;

CREATE POLICY "Users can view funnels"
ON public.funnels FOR SELECT
USING (public.can_access_workspace(auth.uid(), team_id));

-- Update contacts SELECT policy to allow parent account access
DROP POLICY IF EXISTS "Contacts accessible to team members only" ON public.contacts;
DROP POLICY IF EXISTS "Team members can view their contacts" ON public.contacts;

CREATE POLICY "Users can view contacts"
ON public.contacts FOR SELECT
USING (public.can_access_workspace(auth.uid(), team_id));

-- Update appointments SELECT policy (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'appointments' 
    AND policyname LIKE '%team members%view%'
  ) THEN
    EXECUTE (
      SELECT 'DROP POLICY IF EXISTS "' || policyname || '" ON public.appointments'
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'appointments' 
      AND policyname LIKE '%team members%view%'
      LIMIT 1
    );
  END IF;
END $$;

-- Create appointments SELECT policy if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments') THEN
    CREATE POLICY "Users can view appointments"
    ON public.appointments FOR SELECT
    USING (public.can_access_workspace(auth.uid(), team_id));
  END IF;
END $$;

-- Update clients SELECT policy (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'clients' 
    AND policyname LIKE '%team members%view%'
  ) THEN
    EXECUTE (
      SELECT 'DROP POLICY IF EXISTS "' || policyname || '" ON public.clients'
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'clients' 
      AND policyname LIKE '%team members%view%'
      LIMIT 1
    );
  END IF;
END $$;

-- Create clients SELECT policy if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    CREATE POLICY "Users can view clients"
    ON public.clients FOR SELECT
    USING (public.can_access_workspace(auth.uid(), team_id));
  END IF;
END $$;

-- Update events SELECT policy to allow parent account access
DROP POLICY IF EXISTS "Team members can view funnel events" ON public.events;

CREATE POLICY "Users can view funnel events"
ON public.events FOR SELECT
USING (public.can_access_workspace(auth.uid(), public.get_funnel_team_id(funnel_id)));

-- Note: INSERT/UPDATE/DELETE policies remain unchanged as they should still require direct membership
-- Only SELECT policies are updated to allow parent account visibility
