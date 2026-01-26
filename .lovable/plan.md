
# Zapier Integration - Complete Triggers & Actions Implementation

## Overview
This plan expands the existing Zapier integration by adding comprehensive triggers and actions that mirror your internal automation system. The integration will allow Zapier users to automate workflows based on Stackit/Infostack events.

---

## Current State
- OAuth v2 flow is fully working (authorize, token, refresh, test)
- Basic triggers exist: `new_lead`, `new_appointment`, `lead_status_changed`
- Basic actions exist: `create_lead`, `update_lead`, `add_note`

---

## Proposed Triggers (From Stackit to Zapier)

| Trigger Key | Display Name | Description |
|-------------|--------------|-------------|
| `new_lead` | New Lead Created | When a new contact/lead is created |
| `new_appointment` | New Appointment Booked | When an appointment is booked |
| `appointment_rescheduled` | Appointment Rescheduled | When an appointment is rescheduled |
| `appointment_canceled` | Appointment Canceled | When an appointment is canceled |
| `appointment_no_show` | Appointment No-Show | When a lead doesn't show up |
| `appointment_completed` | Appointment Completed/Closed | When a deal is closed |
| `stage_changed` | Pipeline Stage Changed | When a deal moves to a different stage |
| `tag_added` | Tag Added to Contact | When a tag is added to a contact |
| `deal_won` | Deal Won | When a deal is marked as won |

---

## Proposed Actions (From Zapier to Stackit)

| Action Key | Display Name | Description |
|------------|--------------|-------------|
| `create_lead` | Create Lead/Contact | Creates a new contact in CRM |
| `update_lead` | Update Lead/Contact | Updates an existing contact |
| `add_note` | Add Note | Adds a note to a contact or appointment |
| `create_appointment` | Create Appointment | Creates a new appointment/deal |
| `update_appointment` | Update Appointment | Updates an existing appointment |
| `add_tag` | Add Tag to Contact | Adds one or more tags to a contact |
| `remove_tag` | Remove Tag from Contact | Removes tags from a contact |
| `change_stage` | Change Pipeline Stage | Moves an appointment to a different stage |

---

## Implementation Details

### 1. Update zapier-triggers Edge Function

**File:** `supabase/functions/zapier-triggers/index.ts`

Add new trigger cases:

```text
appointment_rescheduled
  - Query: appointments WHERE status = 'RESCHEDULED' ORDER BY updated_at DESC
  - Fields: id, lead_name, lead_email, lead_phone, original_date, new_date, event_type

appointment_canceled
  - Query: appointments WHERE status = 'CANCELLED' ORDER BY updated_at DESC
  - Fields: id, lead_name, lead_email, status, canceled_at

appointment_no_show
  - Query: appointments WHERE status = 'NO_SHOW' ORDER BY updated_at DESC
  - Fields: id, lead_name, lead_email, scheduled_time, marked_no_show_at

appointment_completed / deal_won
  - Query: appointments WHERE status = 'CLOSED' OR pipeline_stage = 'won'
  - Fields: id, lead_name, lead_email, revenue, product_name, closed_at

stage_changed
  - Query: appointments WHERE pipeline_stage IS NOT NULL ORDER BY updated_at DESC
  - Fields: id, lead_name, old_stage, new_stage, changed_at

tag_added
  - Query: contacts WHERE tags IS NOT NULL ORDER BY updated_at DESC
  - Fields: id, name, email, tags, updated_at
```

### 2. Update zapier-actions Edge Function

**File:** `supabase/functions/zapier-actions/index.ts`

Add new action cases:

```text
create_appointment
  - Required: lead_name, start_time
  - Optional: lead_email, lead_phone, event_type, closer_name, notes

update_appointment
  - Required: appointment_id
  - Optional: status, pipeline_stage, start_time, notes

add_tag
  - Required: contact_id, tags (string or array)
  - Logic: Merge with existing tags (no duplicates)

remove_tag
  - Required: contact_id, tags (string or array)
  - Logic: Filter out specified tags

change_stage
  - Required: appointment_id, stage
  - Validates stage exists for team
```

### 3. Update ZapierConfig UI Component

**File:** `src/components/ZapierConfig.tsx`

Update the triggers and actions lists to reflect all available options:

**Triggers list:**
- New Lead Created
- New Appointment Booked
- Appointment Rescheduled
- Appointment Canceled
- Appointment No-Show
- Deal Won/Closed
- Pipeline Stage Changed
- Tag Added to Contact

**Actions list:**
- Create Lead/Contact
- Update Lead/Contact
- Add Note
- Create Appointment
- Update Appointment
- Add/Remove Tags
- Change Pipeline Stage

---

## Technical Approach

### Token Validation (Shared)
Both edge functions already share the same token validation pattern:
1. Extract Bearer token from Authorization header
2. Look up `team_integrations` where `access_token` matches
3. Verify token hasn't expired
4. Return `team_id` for scoping queries

### Zapier Polling Pattern
Zapier triggers use polling - they fetch the most recent records and use the `id` field for deduplication. For status-change triggers, we create composite IDs like `{appointment_id}_{updated_at}` to ensure each change is treated as a unique event.

### Error Handling
All endpoints return:
- `200` with JSON array for successful trigger polls (even if empty)
- `401` for invalid/expired tokens
- `400` for validation errors (missing required fields)
- `500` for server errors

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/zapier-triggers/index.ts` | Add 6 new trigger cases |
| `supabase/functions/zapier-actions/index.ts` | Add 5 new action cases |
| `src/components/ZapierConfig.tsx` | Update UI to show all triggers/actions |

---

## Testing Strategy

After implementation:
1. Deploy edge functions automatically
2. Test each trigger via Zapier's test mode
3. Test each action by creating test Zaps
4. Verify data flows correctly both directions

---

## Estimated Changes
- ~150 lines added to zapier-triggers
- ~180 lines added to zapier-actions
- ~30 lines updated in ZapierConfig.tsx
