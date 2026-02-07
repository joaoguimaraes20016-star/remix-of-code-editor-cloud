-- ==============================
-- Migration: Atomic Rate Limit Increment
-- Creates a PostgreSQL function that performs check-and-increment as a single
-- atomic operation, preventing the read-modify-write race condition where
-- concurrent requests could both read the same count and both pass the check.
-- Uses FOR UPDATE row-level locking to serialize access per rate limit row.
-- ==============================

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_team_id UUID,
  p_channel TEXT,
  p_automation_id UUID DEFAULT NULL,
  p_max_per_hour INT DEFAULT 500,
  p_max_per_day INT DEFAULT 5000
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_record automation_rate_limits%ROWTYPE;
  v_now TIMESTAMPTZ := now();
  v_hour_count INT;
  v_day_count INT;
BEGIN
  -- Try to get and lock the row atomically (FOR UPDATE prevents concurrent access)
  SELECT * INTO v_record
    FROM automation_rate_limits
    WHERE team_id = p_team_id
      AND channel = p_channel
      AND (automation_id = p_automation_id OR (automation_id IS NULL AND p_automation_id IS NULL))
    FOR UPDATE;

  IF NOT FOUND THEN
    -- Attempt to insert a new record (first request for this team/channel/automation)
    INSERT INTO automation_rate_limits (
      team_id, channel, automation_id,
      max_per_hour, max_per_day,
      current_hour_count, current_day_count,
      hour_reset_at, day_reset_at
    ) VALUES (
      p_team_id, p_channel, p_automation_id,
      p_max_per_hour, p_max_per_day,
      1, 1,
      date_trunc('hour', v_now) + interval '1 hour',
      date_trunc('day', v_now) + interval '1 day'
    )
    ON CONFLICT (team_id, automation_id, channel) DO NOTHING;

    -- Re-read the row after potential conflict.
    -- If another transaction inserted first, we need the actual counts.
    SELECT * INTO v_record
      FROM automation_rate_limits
      WHERE team_id = p_team_id
        AND channel = p_channel
        AND (automation_id = p_automation_id OR (automation_id IS NULL AND p_automation_id IS NULL))
      FOR UPDATE;

    IF NOT FOUND THEN
      -- This should never happen after an insert attempt
      RAISE EXCEPTION 'Rate limit record not found after insert attempt';
    END IF;

    -- Fall through to the normal check-and-increment logic below
    -- (don't return early -- the row may already have counts from another transaction)
  END IF;

  -- Reset counters if time windows have expired
  v_hour_count := CASE WHEN v_now >= v_record.hour_reset_at THEN 0 ELSE v_record.current_hour_count END;
  v_day_count := CASE WHEN v_now >= v_record.day_reset_at THEN 0 ELSE v_record.current_day_count END;

  -- Check limits BEFORE incrementing
  IF v_hour_count >= COALESCE(v_record.max_per_hour, p_max_per_hour) THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', format('Hourly limit exceeded (%s/%s)', v_hour_count, COALESCE(v_record.max_per_hour, p_max_per_hour)),
      'current_hour_count', v_hour_count,
      'current_day_count', v_day_count
    );
  END IF;

  IF v_day_count >= COALESCE(v_record.max_per_day, p_max_per_day) THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', format('Daily limit exceeded (%s/%s)', v_day_count, COALESCE(v_record.max_per_day, p_max_per_day)),
      'current_hour_count', v_hour_count,
      'current_day_count', v_day_count
    );
  END IF;

  -- Atomically increment counters and reset windows if needed
  UPDATE automation_rate_limits SET
    current_hour_count = v_hour_count + 1,
    current_day_count = v_day_count + 1,
    hour_reset_at = CASE WHEN v_now >= v_record.hour_reset_at THEN date_trunc('hour', v_now) + interval '1 hour' ELSE v_record.hour_reset_at END,
    day_reset_at = CASE WHEN v_now >= v_record.day_reset_at THEN date_trunc('day', v_now) + interval '1 day' ELSE v_record.day_reset_at END,
    updated_at = v_now
  WHERE id = v_record.id;

  RETURN jsonb_build_object(
    'allowed', true,
    'current_hour_count', v_hour_count + 1,
    'current_day_count', v_day_count + 1
  );
END;
$$;
