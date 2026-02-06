-- ==============================
-- Migration: Pure Automation Architecture (GoHighLevel Style)
-- All confirmations and reminders are handled via automations.
-- Remove built-in reminder_config system.
-- ==============================

-- ==============================
-- PART 1: Insert default booking automation templates
-- Uses the existing automation_templates table
-- ==============================

-- Booking Confirmation Template (immediate email + SMS)
INSERT INTO public.automation_templates (
  name, description, category, icon, definition, is_system, is_public
) VALUES (
  'Booking Confirmation',
  'Sends an immediate email and SMS confirmation when someone books an appointment.',
  'appointment',
  'mail-check',
  '{
    "name": "Booking Confirmation",
    "trigger": {
      "type": "appointment_booked",
      "config": {}
    },
    "steps": [
      {
        "id": "step_confirm_email",
        "order": 0,
        "type": "send_email",
        "config": {
          "subject": "Confirmed: {{appointment.event_type_name}}",
          "body": "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\"><h2>Your Appointment is Confirmed</h2><p>Hi {{lead.name}},</p><p>Your <strong>{{appointment.event_type_name}}</strong> has been confirmed.</p><div style=\"background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;\"><p style=\"margin: 4px 0;\"><strong>Date & Time:</strong> {{appointment.start_at_utc}}</p><p style=\"margin: 4px 0;\"><strong>Duration:</strong> {{appointment.duration_minutes}} minutes</p><p style=\"margin: 4px 0;\"><strong>Host:</strong> {{appointment.closer_name}}</p>{{#appointment.meeting_link}}<p style=\"margin: 4px 0;\"><strong>Meeting Link:</strong> <a href=\"{{appointment.meeting_link}}\">Join Meeting</a></p>{{/appointment.meeting_link}}</div><p>Need to make changes?</p><p><a href=\"{{appointment.reschedule_url}}\" style=\"color: #3B82F6;\">Reschedule</a> | <a href=\"{{appointment.cancel_url}}\" style=\"color: #EF4444;\">Cancel</a></p></div>",
          "to": "{{lead.email}}"
        }
      },
      {
        "id": "step_confirm_sms",
        "order": 1,
        "type": "send_sms",
        "config": {
          "message": "Confirmed: {{appointment.event_type_name}} on {{appointment.start_at_utc}}. {{appointment.meeting_link}}",
          "to": "{{lead.phone}}"
        }
      }
    ]
  }'::jsonb,
  true,
  true
)
ON CONFLICT DO NOTHING;

-- 24-Hour Reminder Template
INSERT INTO public.automation_templates (
  name, description, category, icon, definition, is_system, is_public
) VALUES (
  '24-Hour Reminder',
  'Sends an email reminder 24 hours before the appointment.',
  'appointment',
  'clock',
  '{
    "name": "24-Hour Reminder",
    "trigger": {
      "type": "appointment_booked",
      "config": {}
    },
    "steps": [
      {
        "id": "step_wait_24h",
        "order": 0,
        "type": "wait_until",
        "config": {
          "waitType": "before_appointment",
          "hours_before": 24,
          "appointment_field": "appointment.start_at_utc"
        }
      },
      {
        "id": "step_reminder_email",
        "order": 1,
        "type": "send_email",
        "config": {
          "subject": "Reminder: Your {{appointment.event_type_name}} is tomorrow",
          "body": "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\"><h2>Appointment Reminder</h2><p>Hi {{lead.name}},</p><p>This is a friendly reminder that your <strong>{{appointment.event_type_name}}</strong> is scheduled for tomorrow.</p><div style=\"background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;\"><p style=\"margin: 4px 0;\"><strong>Date & Time:</strong> {{appointment.start_at_utc}}</p><p style=\"margin: 4px 0;\"><strong>Duration:</strong> {{appointment.duration_minutes}} minutes</p>{{#appointment.meeting_link}}<p style=\"margin: 4px 0;\"><strong>Meeting Link:</strong> <a href=\"{{appointment.meeting_link}}\">Join Meeting</a></p>{{/appointment.meeting_link}}</div><p><a href=\"{{appointment.reschedule_url}}\" style=\"color: #3B82F6;\">Reschedule</a> | <a href=\"{{appointment.cancel_url}}\" style=\"color: #EF4444;\">Cancel</a></p></div>",
          "to": "{{lead.email}}"
        }
      }
    ]
  }'::jsonb,
  true,
  true
)
ON CONFLICT DO NOTHING;

-- 1-Hour Reminder Template
INSERT INTO public.automation_templates (
  name, description, category, icon, definition, is_system, is_public
) VALUES (
  '1-Hour Reminder',
  'Sends an SMS reminder 1 hour before the appointment.',
  'appointment',
  'bell',
  '{
    "name": "1-Hour Reminder",
    "trigger": {
      "type": "appointment_booked",
      "config": {}
    },
    "steps": [
      {
        "id": "step_wait_1h",
        "order": 0,
        "type": "wait_until",
        "config": {
          "waitType": "before_appointment",
          "hours_before": 1,
          "appointment_field": "appointment.start_at_utc"
        }
      },
      {
        "id": "step_reminder_sms",
        "order": 1,
        "type": "send_sms",
        "config": {
          "message": "Your {{appointment.event_type_name}} starts in 1 hour! {{appointment.meeting_link}}",
          "to": "{{lead.phone}}"
        }
      }
    ]
  }'::jsonb,
  true,
  true
)
ON CONFLICT DO NOTHING;

-- Complete Booking Flow Template (confirmation + all reminders in one workflow)
INSERT INTO public.automation_templates (
  name, description, category, icon, definition, is_system, is_public
) VALUES (
  'Complete Booking Flow',
  'All-in-one: immediate confirmation, 24-hour email reminder, and 1-hour SMS reminder.',
  'appointment',
  'zap',
  '{
    "name": "Complete Booking Flow",
    "trigger": {
      "type": "appointment_booked",
      "config": {}
    },
    "steps": [
      {
        "id": "step_confirm_email",
        "order": 0,
        "type": "send_email",
        "config": {
          "subject": "Confirmed: {{appointment.event_type_name}}",
          "body": "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\"><h2>Your Appointment is Confirmed</h2><p>Hi {{lead.name}},</p><p>Your <strong>{{appointment.event_type_name}}</strong> has been confirmed.</p><div style=\"background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;\"><p style=\"margin: 4px 0;\"><strong>Date & Time:</strong> {{appointment.start_at_utc}}</p><p style=\"margin: 4px 0;\"><strong>Duration:</strong> {{appointment.duration_minutes}} minutes</p><p style=\"margin: 4px 0;\"><strong>Host:</strong> {{appointment.closer_name}}</p>{{#appointment.meeting_link}}<p style=\"margin: 4px 0;\"><strong>Meeting Link:</strong> <a href=\"{{appointment.meeting_link}}\">Join Meeting</a></p>{{/appointment.meeting_link}}</div><p><a href=\"{{appointment.reschedule_url}}\" style=\"color: #3B82F6;\">Reschedule</a> | <a href=\"{{appointment.cancel_url}}\" style=\"color: #EF4444;\">Cancel</a></p></div>",
          "to": "{{lead.email}}"
        }
      },
      {
        "id": "step_confirm_sms",
        "order": 1,
        "type": "send_sms",
        "config": {
          "message": "Confirmed: {{appointment.event_type_name}} on {{appointment.start_at_utc}}. {{appointment.meeting_link}}",
          "to": "{{lead.phone}}"
        }
      },
      {
        "id": "step_wait_24h",
        "order": 2,
        "type": "wait_until",
        "config": {
          "waitType": "before_appointment",
          "hours_before": 24,
          "appointment_field": "appointment.start_at_utc"
        }
      },
      {
        "id": "step_reminder_24h_email",
        "order": 3,
        "type": "send_email",
        "config": {
          "subject": "Reminder: Your {{appointment.event_type_name}} is tomorrow",
          "body": "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\"><h2>Appointment Reminder</h2><p>Hi {{lead.name}},</p><p>Your <strong>{{appointment.event_type_name}}</strong> is scheduled for tomorrow.</p>{{#appointment.meeting_link}}<p><a href=\"{{appointment.meeting_link}}\" style=\"background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;\">Join Meeting</a></p>{{/appointment.meeting_link}}<p><a href=\"{{appointment.reschedule_url}}\" style=\"color: #3B82F6;\">Reschedule</a> | <a href=\"{{appointment.cancel_url}}\" style=\"color: #EF4444;\">Cancel</a></p></div>",
          "to": "{{lead.email}}"
        }
      },
      {
        "id": "step_wait_1h",
        "order": 4,
        "type": "wait_until",
        "config": {
          "waitType": "before_appointment",
          "hours_before": 1,
          "appointment_field": "appointment.start_at_utc"
        }
      },
      {
        "id": "step_reminder_1h_sms",
        "order": 5,
        "type": "send_sms",
        "config": {
          "message": "Your {{appointment.event_type_name}} starts in 1 hour! {{appointment.meeting_link}}",
          "to": "{{lead.phone}}"
        }
      }
    ]
  }'::jsonb,
  true,
  true
)
ON CONFLICT DO NOTHING;

-- ==============================
-- PART 2: Remove old reminder system
-- ==============================

-- Drop booking_reminders table
DROP TABLE IF EXISTS public.booking_reminders CASCADE;

-- Remove reminder_config column from event_types
ALTER TABLE public.event_types DROP COLUMN IF EXISTS reminder_config;

-- Unschedule the booking reminders cron job (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-booking-reminders') THEN
    PERFORM cron.unschedule('send-booking-reminders');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- pg_cron may not be available, ignore
    RAISE NOTICE 'Could not unschedule send-booking-reminders cron job: %', SQLERRM;
END;
$$;
