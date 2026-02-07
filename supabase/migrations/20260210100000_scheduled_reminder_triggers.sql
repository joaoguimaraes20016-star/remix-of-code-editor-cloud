-- ==============================
-- Migration: Scheduled Reminder Triggers
--
-- Adds pg_cron jobs for time-based automation triggers:
--   1. birthday_reminder - Daily at midnight UTC
--   2. task_reminder - Every hour
--   3. stale_opportunity - Daily at 6 AM UTC
--   4. invoice_overdue - Daily at 9 AM UTC
--
-- All jobs use fire_automation_event() with idempotency keys
-- to prevent duplicate trigger fires.
-- ==============================


-- ==============================
-- 1. Birthday Reminder
-- Runs daily at midnight UTC
-- Fires for contacts with birthday tomorrow (giving time to send wishes)
-- ==============================

SELECT cron.schedule(
  'birthday-reminder-check',
  '0 0 * * *',
  $$
  SELECT fire_automation_event(
    c.team_id,
    'birthday_reminder',
    jsonb_build_object(
      'contactId', c.id,
      'lead', jsonb_build_object(
        'id', c.id,
        'name', COALESCE(c.name, COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')),
        'first_name', c.first_name,
        'last_name', c.last_name,
        'email', c.email,
        'phone', c.phone,
        'tags', COALESCE(to_jsonb(c.tags), '[]'::jsonb),
        'date_of_birth', c.date_of_birth,
        'custom_fields', COALESCE(c.custom_fields, '{}'::jsonb)
      ),
      'meta', jsonb_build_object(
        'reminderType', 'birthday',
        'birthdayDate', c.date_of_birth
      )
    ),
    'birthday:' || c.id || ':' || CURRENT_DATE::text
  )
  FROM contacts c
  WHERE c.date_of_birth IS NOT NULL
    AND EXTRACT(MONTH FROM c.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE + interval '1 day')
    AND EXTRACT(DAY FROM c.date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE + interval '1 day');
  $$
);


-- ==============================
-- 2. Task Reminder
-- Runs every hour
-- Fires for tasks due within next 2 hours that are still pending
-- Idempotency key uses hour truncation to prevent re-firing within same hour
-- ==============================

SELECT cron.schedule(
  'task-reminder-check',
  '0 * * * *',
  $$
  SELECT fire_automation_event(
    ct.team_id,
    'task_reminder',
    jsonb_build_object(
      'taskId', ct.id,
      'task', jsonb_build_object(
        'id', ct.id,
        'task_type', ct.task_type,
        'due_at', ct.due_at,
        'status', ct.status,
        'pipeline_stage', ct.pipeline_stage,
        'follow_up_reason', ct.follow_up_reason
      ),
      'lead', CASE
        WHEN c.id IS NOT NULL THEN jsonb_build_object(
          'id', c.id,
          'name', COALESCE(c.name, COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')),
          'email', c.email,
          'phone', c.phone
        )
        ELSE jsonb_build_object(
          'name', a.lead_name,
          'email', a.lead_email,
          'phone', a.lead_phone
        )
      END,
      'appointment', jsonb_build_object(
        'id', a.id,
        'lead_name', a.lead_name,
        'start_at_utc', a.start_at_utc
      ),
      'meta', jsonb_build_object(
        'reminderType', 'task',
        'dueAt', ct.due_at,
        'hoursUntilDue', EXTRACT(EPOCH FROM (ct.due_at - NOW())) / 3600
      )
    ),
    'task_reminder:' || ct.id || ':' || DATE_TRUNC('hour', ct.due_at)::text
  )
  FROM confirmation_tasks ct
  LEFT JOIN appointments a ON ct.appointment_id = a.id
  LEFT JOIN contacts c ON c.email = a.lead_email AND c.team_id = ct.team_id
  WHERE ct.status = 'pending'
    AND ct.due_at IS NOT NULL
    AND ct.due_at BETWEEN NOW() AND NOW() + interval '2 hours';
  $$
);


-- ==============================
-- 3. Stale Opportunity
-- Runs daily at 6 AM UTC
-- Fires for deals with no activity for 7+ days
-- Excludes closed/cancelled/won/lost deals
-- ==============================

SELECT cron.schedule(
  'stale-opportunity-check',
  '0 6 * * *',
  $$
  SELECT fire_automation_event(
    a.team_id,
    'stale_opportunity',
    jsonb_build_object(
      'appointmentId', a.id,
      'deal', jsonb_build_object(
        'id', a.id,
        'lead_name', a.lead_name,
        'lead_email', a.lead_email,
        'lead_phone', a.lead_phone,
        'pipeline_stage', a.pipeline_stage,
        'status', a.status,
        'revenue', COALESCE(a.revenue, 0),
        'last_activity', a.updated_at,
        'created_at', a.created_at
      ),
      'lead', COALESCE(
        (SELECT jsonb_build_object(
          'id', c.id,
          'name', COALESCE(c.name, COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')),
          'email', c.email,
          'phone', c.phone,
          'tags', COALESCE(to_jsonb(c.tags), '[]'::jsonb)
        )
        FROM contacts c
        WHERE c.team_id = a.team_id AND c.email = a.lead_email
        LIMIT 1),
        jsonb_build_object(
          'name', a.lead_name,
          'email', a.lead_email,
          'phone', a.lead_phone
        )
      ),
      'meta', jsonb_build_object(
        'reminderType', 'stale_opportunity',
        'daysSinceActivity', EXTRACT(DAY FROM NOW() - a.updated_at)::int,
        'threshold', 7
      )
    ),
    'stale_deal:' || a.id || ':' || CURRENT_DATE::text
  )
  FROM appointments a
  WHERE a.status NOT IN ('CLOSED', 'CANCELLED', 'NO_SHOW')
    AND a.pipeline_stage IS NOT NULL
    AND a.pipeline_stage NOT IN ('won', 'lost', 'closed_won', 'closed_lost')
    AND a.updated_at < NOW() - interval '7 days';
  $$
);


-- ==============================
-- 4. Invoice Overdue
-- Runs daily at 9 AM UTC
-- Fires for payment events of type invoice that remain unpaid after 7 days
-- ==============================

SELECT cron.schedule(
  'invoice-overdue-check',
  '0 9 * * *',
  $$
  SELECT fire_automation_event(
    pe.team_id,
    'invoice_overdue',
    jsonb_build_object(
      'payment', jsonb_build_object(
        'id', pe.id,
        'event_id', pe.event_id,
        'amount', pe.amount,
        'currency', pe.currency,
        'customer_email', pe.customer_email,
        'customer_id', pe.customer_id,
        'status', pe.status,
        'provider', pe.provider,
        'subscription_id', pe.subscription_id
      ),
      'lead', jsonb_build_object(
        'email', pe.customer_email
      ),
      'meta', jsonb_build_object(
        'reminderType', 'invoice_overdue',
        'daysOverdue', EXTRACT(DAY FROM NOW() - pe.created_at)::int,
        'provider', pe.provider,
        'invoiceId', pe.event_id
      )
    ),
    'invoice_overdue:' || pe.id || ':' || CURRENT_DATE::text
  )
  FROM payment_events pe
  WHERE pe.event_type LIKE 'invoice.%'
    AND pe.status IN ('open', 'draft', 'uncollectible')
    AND pe.created_at < NOW() - interval '7 days';
  $$
);
