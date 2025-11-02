-- Phase 1: Critical Data Integrity Fixes
-- Add unique constraints to prevent duplicate entries

-- 1. Add unique constraint to sales table
-- This prevents duplicate sales for same customer/rep/date
ALTER TABLE sales ADD CONSTRAINT unique_sale 
  UNIQUE (team_id, customer_name, date, sales_rep);

-- 2. Add unique constraint to mrr_commissions table
-- This prevents duplicate commission entries for same person/prospect/month
ALTER TABLE mrr_commissions ADD CONSTRAINT unique_mrr_commission 
  UNIQUE (team_id, team_member_id, prospect_email, month_date);

-- 3. Strengthen appointments unique constraint
-- Create partial unique index to prevent duplicate appointments (excluding cancelled)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_appointment 
  ON appointments (team_id, lead_email, start_at_utc) 
  WHERE status != 'CANCELLED';

-- 4. Add index on confirmation_tasks to prevent duplicates
-- This helps with the duplicate task error we saw in logs
CREATE UNIQUE INDEX IF NOT EXISTS unique_confirmation_task_per_appointment
  ON confirmation_tasks (appointment_id, task_type, confirmation_sequence)
  WHERE status != 'completed';