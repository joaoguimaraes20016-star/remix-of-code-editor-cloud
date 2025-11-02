-- Create transaction-based close deal function
CREATE OR REPLACE FUNCTION close_deal_transaction(
  p_appointment_id uuid,
  p_closer_id uuid,
  p_cc_amount numeric,
  p_mrr_amount numeric,
  p_mrr_months integer,
  p_product_name text,
  p_notes text DEFAULT NULL,
  p_closer_name text DEFAULT NULL,
  p_closer_commission_pct numeric DEFAULT 10.0,
  p_setter_commission_pct numeric DEFAULT 5.0
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appointment record;
  v_sale_id uuid;
  v_total_revenue numeric;
  v_closer_commission numeric;
  v_setter_commission numeric;
  v_result json;
  v_month_date date;
  v_existing_sale_id uuid;
BEGIN
  -- Start transaction (implicit in function)
  
  -- 1. Lock and validate appointment
  SELECT * INTO v_appointment
  FROM appointments
  WHERE id = p_appointment_id
  FOR UPDATE; -- Lock row to prevent race conditions
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found: %', p_appointment_id;
  END IF;
  
  IF v_appointment.status = 'CLOSED' THEN
    RAISE EXCEPTION 'Appointment already closed';
  END IF;
  
  -- 2. Calculate totals
  v_total_revenue := p_cc_amount + (p_mrr_amount * COALESCE(p_mrr_months, 0));
  v_closer_commission := ROUND((v_total_revenue * p_closer_commission_pct / 100)::numeric, 2);
  v_setter_commission := ROUND((v_total_revenue * p_setter_commission_pct / 100)::numeric, 2);
  
  -- 3. Update appointment (single atomic operation)
  UPDATE appointments
  SET 
    status = 'CLOSED',
    pipeline_stage = 'won',
    cc_collected = p_cc_amount,
    mrr_amount = p_mrr_amount,
    mrr_months = p_mrr_months,
    revenue = v_total_revenue,
    product_name = p_product_name,
    updated_at = now()
  WHERE id = p_appointment_id;
  
  -- 4. Check for existing sale to prevent duplicates
  SELECT id INTO v_existing_sale_id
  FROM sales
  WHERE customer_name = v_appointment.lead_name
    AND date = v_appointment.start_at_utc::date
    AND sales_rep = COALESCE(p_closer_name, v_appointment.closer_name)
  LIMIT 1;
  
  -- 5. Upsert sale record
  IF v_existing_sale_id IS NOT NULL THEN
    -- Update existing sale
    UPDATE sales
    SET
      revenue = v_total_revenue,
      commission = v_closer_commission,
      setter_commission = v_setter_commission,
      product_name = p_product_name,
      status = 'Closed Won',
      updated_at = now()
    WHERE id = v_existing_sale_id;
    
    v_sale_id := v_existing_sale_id;
  ELSE
    -- Insert new sale
    INSERT INTO sales (
      team_id,
      customer_name,
      sales_rep,
      setter,
      offer_owner,
      product_name,
      date,
      revenue,
      commission,
      setter_commission,
      status
    ) VALUES (
      v_appointment.team_id,
      v_appointment.lead_name,
      COALESCE(p_closer_name, v_appointment.closer_name),
      v_appointment.setter_name,
      v_appointment.closer_name,
      p_product_name,
      v_appointment.start_at_utc::date,
      v_total_revenue,
      v_closer_commission,
      v_setter_commission,
      'Closed Won'
    )
    RETURNING id INTO v_sale_id;
  END IF;
  
  -- 6. Handle MRR commissions if applicable
  IF p_mrr_amount > 0 AND p_mrr_months > 0 THEN
    -- Delete existing MRR commissions for this appointment to prevent duplicates
    DELETE FROM mrr_commissions
    WHERE appointment_id = p_appointment_id;
    
    -- Create MRR commissions for each month
    FOR i IN 0..(p_mrr_months - 1) LOOP
      v_month_date := (v_appointment.start_at_utc::date + (i || ' months')::interval)::date;
      
      -- Closer commission
      INSERT INTO mrr_commissions (
        team_id,
        sale_id,
        appointment_id,
        team_member_id,
        team_member_name,
        prospect_name,
        prospect_email,
        role,
        mrr_amount,
        commission_percentage,
        commission_amount,
        month_date
      ) VALUES (
        v_appointment.team_id,
        v_sale_id,
        p_appointment_id,
        p_closer_id,
        COALESCE(p_closer_name, v_appointment.closer_name),
        v_appointment.lead_name,
        v_appointment.lead_email,
        'closer',
        p_mrr_amount,
        p_closer_commission_pct,
        ROUND((p_mrr_amount * p_closer_commission_pct / 100)::numeric, 2),
        v_month_date
      );
      
      -- Setter commission (if setter exists)
      IF v_appointment.setter_id IS NOT NULL THEN
        INSERT INTO mrr_commissions (
          team_id,
          sale_id,
          appointment_id,
          team_member_id,
          team_member_name,
          prospect_name,
          prospect_email,
          role,
          mrr_amount,
          commission_percentage,
          commission_amount,
          month_date
        ) VALUES (
          v_appointment.team_id,
          v_sale_id,
          p_appointment_id,
          v_appointment.setter_id,
          v_appointment.setter_name,
          v_appointment.lead_name,
          v_appointment.lead_email,
          'setter',
          p_mrr_amount,
          p_setter_commission_pct,
          ROUND((p_mrr_amount * p_setter_commission_pct / 100)::numeric, 2),
          v_month_date
        );
      END IF;
    END LOOP;
    
    -- Create MRR schedule
    INSERT INTO mrr_schedules (
      team_id,
      appointment_id,
      client_name,
      client_email,
      mrr_amount,
      first_charge_date,
      next_renewal_date,
      status,
      notes
    ) VALUES (
      v_appointment.team_id,
      p_appointment_id,
      v_appointment.lead_name,
      v_appointment.lead_email,
      p_mrr_amount,
      v_appointment.start_at_utc::date,
      (v_appointment.start_at_utc::date + '1 month'::interval)::date,
      'active',
      p_notes
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- 7. Log activity
  INSERT INTO activity_logs (
    team_id,
    appointment_id,
    actor_id,
    actor_name,
    action_type,
    note
  ) VALUES (
    v_appointment.team_id,
    p_appointment_id,
    p_closer_id,
    COALESCE(p_closer_name, 'Closer'),
    'Status Changed',
    'Deal closed via transaction - CC: $' || p_cc_amount || ', MRR: $' || p_mrr_amount || ' x ' || COALESCE(p_mrr_months, 0) || ' months'
  );
  
  -- 8. Return success result
  v_result := json_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'appointment_id', p_appointment_id,
    'total_revenue', v_total_revenue,
    'closer_commission', v_closer_commission,
    'setter_commission', v_setter_commission
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Rollback happens automatically
  RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$;

-- Create data integrity check function
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE(
  issue_type text,
  issue_count integer,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check for appointments without confirmation tasks
  RETURN QUERY
  SELECT 
    'appointments_without_tasks'::text,
    COUNT(*)::integer,
    jsonb_agg(jsonb_build_object('appointment_id', a.id, 'lead_name', a.lead_name))
  FROM appointments a
  LEFT JOIN confirmation_tasks ct ON ct.appointment_id = a.id
  WHERE ct.id IS NULL
    AND a.status = 'NEW'
    AND a.created_at > now() - interval '30 days'
  HAVING COUNT(*) > 0;
  
  -- Check for duplicate confirmation tasks
  RETURN QUERY
  SELECT 
    'duplicate_confirmation_tasks'::text,
    COUNT(*)::integer,
    jsonb_agg(jsonb_build_object('appointment_id', appointment_id, 'task_count', task_count))
  FROM (
    SELECT appointment_id, COUNT(*) as task_count
    FROM confirmation_tasks
    WHERE task_type = 'call_confirmation'
    GROUP BY appointment_id
    HAVING COUNT(*) > 1
  ) dupes
  HAVING COUNT(*) > 0;
  
  -- Check for closed appointments without sales
  RETURN QUERY
  SELECT 
    'closed_appointments_without_sales'::text,
    COUNT(*)::integer,
    jsonb_agg(jsonb_build_object('appointment_id', a.id, 'lead_name', a.lead_name, 'revenue', a.revenue))
  FROM appointments a
  LEFT JOIN sales s ON s.customer_name = a.lead_name 
    AND s.date = a.start_at_utc::date
  WHERE a.status = 'CLOSED'
    AND a.revenue > 0
    AND s.id IS NULL
  HAVING COUNT(*) > 0;
  
  -- Check for orphaned MRR commissions
  RETURN QUERY
  SELECT 
    'orphaned_mrr_commissions'::text,
    COUNT(*)::integer,
    jsonb_agg(jsonb_build_object('mrr_id', mc.id, 'appointment_id', mc.appointment_id))
  FROM mrr_commissions mc
  LEFT JOIN appointments a ON a.id = mc.appointment_id
  WHERE a.id IS NULL
  HAVING COUNT(*) > 0;
END;
$$;

-- Create data integrity log table
CREATE TABLE IF NOT EXISTS data_integrity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  issue_type text NOT NULL,
  issue_count integer NOT NULL,
  details jsonb,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on integrity logs
ALTER TABLE data_integrity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view integrity logs
CREATE POLICY "Admins can view integrity logs"
ON data_integrity_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
      AND tm.role = 'admin'
  )
);

-- Service role can insert logs
CREATE POLICY "Service role can insert integrity logs"
ON data_integrity_logs
FOR INSERT
WITH CHECK (true);