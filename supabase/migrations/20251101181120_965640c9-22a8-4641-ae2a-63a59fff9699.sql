-- Phase 1: Fix Critical Data Issues
-- Backfill missing pipeline_stage values for existing appointments
-- Using a safer approach that doesn't assume enum values

-- Set all appointments without pipeline_stage to 'booked' as default
UPDATE appointments 
SET pipeline_stage = 'booked',
    updated_at = now()
WHERE pipeline_stage IS NULL;

-- Phase 5: Create transaction-safe commission recalculation function
CREATE OR REPLACE FUNCTION recalculate_team_commissions(
  p_team_id UUID,
  p_setter_percentage NUMERIC,
  p_closer_percentage NUMERIC
)
RETURNS TABLE (
  updated_count INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_sale_record RECORD;
BEGIN
  -- Use a transaction to ensure all-or-nothing update
  BEGIN
    -- Update all sales for the team with new commission rates
    FOR v_sale_record IN
      SELECT id, revenue
      FROM sales
      WHERE team_id = p_team_id
    LOOP
      -- Calculate new commissions
      UPDATE sales
      SET 
        commission = ROUND((v_sale_record.revenue * p_closer_percentage / 100)::numeric, 2),
        setter_commission = ROUND((v_sale_record.revenue * p_setter_percentage / 100)::numeric, 2),
        updated_at = now()
      WHERE id = v_sale_record.id;
      
      v_updated_count := v_updated_count + 1;
    END LOOP;

    -- Return success
    RETURN QUERY SELECT v_updated_count, NULL::TEXT;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback happens automatically, return error
    RETURN QUERY SELECT 0, SQLERRM;
  END;
END;
$$;

-- Create error logging table for Phase 4
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view error logs for their team
CREATE POLICY "Team admins can view error logs"
  ON error_logs
  FOR SELECT
  USING (
    is_team_member(auth.uid(), team_id) AND 
    has_team_role(auth.uid(), team_id, 'admin')
  );

-- Service role can insert error logs
CREATE POLICY "Service role can insert error logs"
  ON error_logs
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_error_logs_team_created 
  ON error_logs(team_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_type 
  ON error_logs(error_type, created_at DESC);