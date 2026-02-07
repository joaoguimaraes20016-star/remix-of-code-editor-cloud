# Automation Trigger Implementation Roadmap

## Status Overview

- **Implemented (17)**: Database triggers that fire automatically on data changes
- **Planned (37)**: Require webhook receivers, scheduled jobs, or API integrations

---

## Implemented Triggers (17)

These triggers have database triggers that fire automatically:

### Contact Triggers
| Trigger | DB Trigger | Table | Event |
|---------|-----------|-------|-------|
| `lead_created` | `on_contact_insert_automation` | `contacts` | INSERT |
| `lead_tag_added` | `on_tag_added_automation` | `contacts` | UPDATE (tags) |
| `lead_tag_removed` | `on_tag_removed_automation` | `contacts` | UPDATE (tags) |
| `contact_changed` | `on_contact_changed_automation` | `contacts` | UPDATE (fields) |
| `contact_dnd` | `on_contact_dnd_automation` | `contacts` | UPDATE (dnd_*) |
| `note_added` | `on_note_added_automation` | `activity_logs` | INSERT |
| `note_changed` | `on_note_changed_automation` | `activity_logs` | UPDATE (note) |

### Appointment Triggers
| Trigger | DB Trigger | Table | Event |
|---------|-----------|-------|-------|
| `appointment_booked` | `on_appointment_booked_automation` | `appointments` | INSERT |
| `appointment_rescheduled` | `on_appointment_rescheduled_automation` | `appointments` | UPDATE |
| `appointment_canceled` | `on_appointment_canceled_automation` | `appointments` | UPDATE (status) |
| `appointment_no_show` | `on_appointment_no_show_automation` | `appointments` | UPDATE (status) |
| `appointment_completed` | `on_appointment_status_completed_automation` | `appointments` | UPDATE (status) |

### Pipeline Triggers
| Trigger | DB Trigger | Table | Event |
|---------|-----------|-------|-------|
| `stage_changed` | `on_stage_changed_automation` | `appointments` | UPDATE (pipeline_stage) |
| `deal_created` | `on_deal_created_automation` | `appointments` | INSERT |
| `deal_won` | `on_deal_won_automation` | `appointments` | UPDATE (pipeline_stage) |
| `deal_lost` | `on_deal_lost_automation` | `appointments` | UPDATE (pipeline_stage) |

### Task Triggers
| Trigger | DB Trigger | Table | Event |
|---------|-----------|-------|-------|
| `task_added` | `on_task_added_automation` | `confirmation_tasks` | INSERT |
| `task_completed` | `on_task_completed_automation` | `confirmation_tasks` | UPDATE (status) |

---

## Planned Triggers (37)

### Category 1: Scheduled Triggers (Need pg_cron Jobs)

These triggers need scheduled PostgreSQL jobs to scan for matching conditions.

| Trigger | Implementation Needed | Complexity | Priority |
|---------|----------------------|------------|----------|
| `birthday_reminder` | Nightly cron to scan contacts for upcoming birthdays | Medium | Medium |
| `custom_date_reminder` | Nightly cron for custom date fields | Medium | Low |
| `task_reminder` | Hourly cron for tasks approaching due date | Low | Medium |
| `stale_opportunity` | Daily cron for deals inactive beyond threshold | Low | Medium |
| `invoice_overdue` | Daily cron for unpaid invoices past due | Low | Medium |

**Implementation pattern:**
```sql
-- Example: Birthday reminder cron job (runs nightly at midnight UTC)
SELECT cron.schedule('check_birthdays', '0 0 * * *', $$
  SELECT fire_automation_event(
    c.team_id,
    'birthday_reminder',
    jsonb_build_object(
      'contactId', c.id,
      'lead', jsonb_build_object('id', c.id, 'name', c.first_name || ' ' || c.last_name)
    ),
    'birthday:' || c.id || ':' || CURRENT_DATE::text
  )
  FROM contacts c
  WHERE c.date_of_birth IS NOT NULL
    AND EXTRACT(MONTH FROM c.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE + interval '1 day')
    AND EXTRACT(DAY FROM c.date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE + interval '1 day');
$$);
```

---

### Category 2: Messaging Triggers (Need Webhook Receivers)

These triggers fire based on inbound messaging events from external services.

| Trigger | Implementation Needed | Complexity | Priority |
|---------|----------------------|------------|----------|
| `customer_replied` | Inbound message webhook from Twilio/messaging provider | High | High |
| `email_opened` | Email tracking pixel or webhook from email service | High | Medium |
| `email_bounced` | Bounce webhook from email service | Medium | Medium |
| `messaging_error` | Twilio error status callback | Low | Low |
| `new_review_received` | Review platform webhook (Google, Yelp, etc.) | Medium | Low |
| `call_status` | Twilio call status callback (already has DB trigger) | Done | - |

**Implementation pattern:**
```typescript
// Edge function: receive-inbound-message
// POST /functions/v1/receive-inbound-message
serve(async (req) => {
  const payload = await req.json();
  const teamId = await resolveTeamFromPhone(payload.to);
  
  await supabase.rpc('fire_automation_event', {
    p_team_id: teamId,
    p_trigger_type: 'customer_replied',
    p_payload: { lead: { phone: payload.from }, meta: { message: payload.body } },
    p_idempotency_key: `reply:${payload.messageSid}`
  });
});
```

---

### Category 3: Payment Triggers (Need Stripe/Whop Webhooks)

These triggers fire from payment processor webhook events. Low complexity because existing Stripe webhook handlers can be extended.

| Trigger | Stripe Event | Complexity | Priority |
|---------|-------------|------------|----------|
| `payment_received` | `payment_intent.succeeded` | Low | High |
| `payment_failed` | `payment_intent.payment_failed` | Low | High |
| `invoice_paid` | `invoice.paid` | Low | High |
| `invoice_created` | `invoice.created` | Low | Medium |
| `invoice_sent` | `invoice.sent` | Low | Medium |
| `subscription_created` | `customer.subscription.created` | Low | High |
| `subscription_cancelled` | `customer.subscription.deleted` | Low | High |
| `subscription_renewed` | `invoice.paid` (recurring) | Low | Medium |
| `refund_issued` | `charge.refunded` | Low | Medium |
| `order_submitted` | Whop `order.created` | Low | Low |

**Implementation pattern:**
```typescript
// In existing Stripe webhook handler, add:
case 'payment_intent.succeeded': {
  // ... existing payment processing ...
  
  // Fire automation event
  await supabase.rpc('fire_automation_event', {
    p_team_id: teamId,
    p_trigger_type: 'payment_received',
    p_payload: {
      payment: { amount: paymentIntent.amount, currency: paymentIntent.currency },
      lead: { email: customer.email }
    },
    p_idempotency_key: `payment:${paymentIntent.id}`
  });
  break;
}
```

---

### Category 4: Form/Funnel Triggers (Need Frontend Integration)

These triggers fire from user interactions with forms, surveys, and funnels.

| Trigger | Implementation Needed | Complexity | Priority |
|---------|----------------------|------------|----------|
| `form_submitted` | Fire event from form submission handler | Low | High |
| `survey_submitted` | Fire event from survey completion | Low | Medium |
| `quiz_submitted` | Fire event from quiz completion | Low | Medium |
| `funnel_page_view` | Fire event from funnel renderer | Low | Medium |
| `trigger_link_clicked` | Fire event from trigger link handler | Low | Low |

**Implementation pattern:**
```typescript
// In form submission handler:
await supabase.functions.invoke('automation-trigger', {
  body: {
    triggerType: 'form_submitted',
    teamId: team.id,
    payload: {
      lead: { email: formData.email, name: formData.name },
      meta: { formId: form.id, formName: form.name, fields: formData }
    }
  }
});
```

---

### Category 5: Integration Triggers (Need OAuth + Webhooks)

These triggers require OAuth connections to external platforms and webhook receivers.

| Trigger | Platform | Complexity | Priority |
|---------|----------|------------|----------|
| `facebook_lead_form` | Facebook Lead Ads | High | Medium |
| `tiktok_form_submitted` | TikTok Lead Gen | High | Low |
| `google_lead_form` | Google Ads Lead Forms | High | Low |
| `typeform_response` | Typeform | Medium | Low |
| `fathom_summary_received` | Fathom AI | Medium | Low |

**Implementation pattern:** Each requires:
1. OAuth token management
2. Webhook subscription setup
3. Edge function to receive events
4. Mapping external data to automation context

---

### Category 6: Manual/API Triggers

| Trigger | Implementation Needed | Complexity | Priority |
|---------|----------------------|------------|----------|
| `webhook_received` | Already implemented via custom_webhook action | Done | - |
| `manual_trigger` | Add "Run Now" button in automation UI | Low | Medium |
| `scheduled_trigger` | UI for cron expression + pg_cron job creation | Medium | Low |

---

### Category 7: Pipeline Triggers (Partial)

| Trigger | Implementation Needed | Complexity | Priority |
|---------|----------------------|------------|----------|
| `opportunity_changed` | DB trigger on appointments field changes | Low | Medium |

---

## Priority Recommendations

### Sprint 1 (Highest Value, Lowest Effort)
1. **Stripe payment webhooks** - 7 triggers, all low complexity. Extend existing webhook handler.
2. **Form/funnel triggers** - 5 triggers, fire from existing submission handlers.
3. **Manual trigger** - Add "Run Now" button in UI.

### Sprint 2 (Medium Value)
4. **Scheduled reminders** - Birthday, task, appointment reminders via pg_cron.
5. **Stale opportunity detection** - Daily scan for inactive deals.
6. **Customer replied trigger** - Inbound message webhook.

### Sprint 3 (Advanced)
7. **Email tracking** - Open/bounce tracking pixels and webhooks.
8. **Integration webhooks** - Facebook, TikTok, Google lead forms (require OAuth).
9. **Scheduled trigger UI** - Cron expression builder.

---

## Architecture Notes

### How Triggers Work

All triggers use the same mechanism:

1. **Database triggers** call `fire_automation_event()` SQL function
2. **Edge functions** call `supabase.functions.invoke('automation-trigger')`
3. **pg_cron jobs** call `fire_automation_event()` directly

The `fire_automation_event()` function:
1. Finds all active automations matching the trigger type and team
2. Checks trigger constraints (filters)
3. Checks enrollment rules
4. Executes the automation steps

### Adding a New Trigger

1. Define the trigger type in `TriggerType` union (both frontend and backend types.ts)
2. Add display entry in `TriggerNodeCard.tsx` TRIGGER_DISPLAY map
3. Create the event source (DB trigger, webhook handler, or cron job)
4. Call `fire_automation_event()` with the trigger type and payload
5. Optionally add trigger constraint handling in `matchesTriggerConstraints()`
