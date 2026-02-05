-- ============================================
-- Account/Subaccount System Migration
-- Adds parent_account_id to teams for subaccount hierarchy
-- ============================================

-- Add parent_account_id column to teams table
-- NULL = main account (primary workspace)
-- NOT NULL = subaccount (belongs to parent)
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS parent_account_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- Create trigger function to prevent nested subaccounts (only 2 levels allowed)
-- Subaccounts cannot have their own subaccounts
CREATE OR REPLACE FUNCTION public.prevent_nested_subaccounts()
RETURNS TRIGGER AS $$
BEGIN
  -- If parent_account_id is being set, check if parent is itself a subaccount
  IF NEW.parent_account_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.teams 
      WHERE id = NEW.parent_account_id 
      AND parent_account_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Cannot create nested subaccounts. Subaccounts cannot have their own subaccounts.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce no nested subaccounts
DROP TRIGGER IF EXISTS trigger_prevent_nested_subaccounts ON public.teams;
CREATE TRIGGER trigger_prevent_nested_subaccounts
  BEFORE INSERT OR UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_nested_subaccounts();

-- Create function to check if user can access a workspace
-- This includes both direct membership and parent account access
-- Handles missing parent_account_id column gracefully
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

-- Create index for performance on parent_account_id lookups
CREATE INDEX IF NOT EXISTS idx_teams_parent_account_id ON public.teams(parent_account_id) WHERE parent_account_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.teams.parent_account_id IS 'Parent account ID. NULL for main accounts, NOT NULL for subaccounts.';
