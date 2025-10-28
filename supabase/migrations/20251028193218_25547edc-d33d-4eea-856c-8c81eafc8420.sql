-- Update function to properly cast status enum
CREATE OR REPLACE FUNCTION insert_appointments_batch(appointments_data JSONB)
RETURNS SETOF appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO appointments (
    team_id,
    lead_name,
    lead_email,
    lead_phone,
    start_at_utc,
    closer_id,
    closer_name,
    setter_id,
    setter_name,
    event_type_uri,
    event_type_name,
    status,
    pipeline_stage
  )
  SELECT
    (elem->>'team_id')::uuid,
    elem->>'lead_name',
    elem->>'lead_email',
    elem->>'lead_phone',
    (elem->>'start_at_utc')::timestamptz,
    (elem->>'closer_id')::uuid,
    elem->>'closer_name',
    (elem->>'setter_id')::uuid,
    elem->>'setter_name',
    elem->>'event_type_uri',
    elem->>'event_type_name',
    (elem->>'status')::appointment_status,
    COALESCE(elem->>'pipeline_stage', 'booked')
  FROM jsonb_array_elements(appointments_data) AS elem
  RETURNING *;
END;
$$;