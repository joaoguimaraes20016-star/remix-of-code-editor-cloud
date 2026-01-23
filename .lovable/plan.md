
# Complete Meta Lead Ads End-to-End Integration

## Current State Analysis

The codebase already has significant Meta integration infrastructure. After thorough review, here's what exists:

| Component | Status | Notes |
|-----------|--------|-------|
| `meta-leadgen-webhook` | ✅ Exists | Handles verification + lead ingestion |
| `meta-subscribe-page` | ✅ Exists | Subscribes pages to leadgen webhooks |
| `meta-enable-feature` | ✅ Exists | Server-side permission check |
| `meta-fetch-assets` | ✅ Exists | Fetches pages/lead forms |
| `MetaAssetSelector` | ✅ Exists | Page/form selection UI |
| `MetaConfig` | ✅ Exists | Main config UI |
| `META_WEBHOOK_VERIFY_TOKEN` | ❌ Missing | Required secret |
| Automation trigger | ❌ TODO | Not wired up |
| Config cleanup | ❌ Needed | Dead entries |

---

## What Needs To Be Done

### 1. Add Missing Secret: META_WEBHOOK_VERIFY_TOKEN

Add the `META_WEBHOOK_VERIFY_TOKEN` secret to Supabase Edge Function secrets.

**Value**: Generate a random secure string (e.g., `stackit_meta_webhook_2024_secure`)

**Where to add**: Supabase Dashboard → Settings → Edge Functions → Secrets

---

### 2. Update config.toml

**Remove dead entries:**
- `meta-connect-feature` (obsolete OAuth flow)
- `meta-feature-callback` (obsolete callback)

**Add missing entry:**
- `meta-enable-feature` (new permission-check flow)

```toml
# Remove these lines:
[functions.meta-connect-feature]
verify_jwt = false

[functions.meta-feature-callback]
verify_jwt = false

# Add this line:
[functions.meta-enable-feature]
verify_jwt = false
```

---

### 3. Delete Obsolete Edge Functions

Delete these folders entirely:
- `supabase/functions/meta-connect-feature/`
- `supabase/functions/meta-feature-callback/`

---

### 4. Wire Up Automation Trigger in Webhook

**File**: `supabase/functions/meta-leadgen-webhook/index.ts`

Replace the TODO comment (line 235-236) with actual automation trigger call:

```typescript
// After creating/updating contact, trigger automation
if (contactId) {
  // Fire automation for facebook_lead_form trigger
  try {
    await supabase.rpc("fire_automation_event", {
      p_team_id: teamId,
      p_trigger_type: "facebook_lead_form",
      p_event_payload: {
        teamId,
        lead: {
          id: contactId,
          email: leadInfo.email,
          phone: leadInfo.phone,
          name: leadInfo.name,
          first_name: leadInfo.first_name,
          last_name: leadInfo.last_name,
          source: "facebook_lead_form",
        },
        meta: {
          facebook_lead_id: leadgenId,
          facebook_form_id: formId,
          facebook_page_id: pageId,
          form_name: formId, // Could be enhanced to get actual form name
        },
      },
      p_event_id: `fb_lead:${leadgenId}`,
    });
    console.log(`Automation triggered for lead ${leadgenId}`);
  } catch (automationError) {
    console.error("Failed to trigger automation:", automationError);
    // Don't fail the webhook - lead is already saved
  }
}
```

---

### 5. Enhance Logging in Webhook

Add structured logging for easier debugging:

```typescript
console.log("[Meta Webhook] Verification request received", {
  mode: url.searchParams.get("hub.mode"),
  hasChallenge: !!url.searchParams.get("hub.challenge"),
});

console.log("[Meta Webhook] Lead received", {
  leadgenId,
  formId,
  pageId,
  teamId: matchedIntegration?.team_id,
});
```

---

## Meta Developer Console Configuration

### Webhook Setup

1. Go to **Meta Developers Console** → Your App → **Webhooks**
2. Click **Add Subscription** for **Page**
3. Configure:

| Field | Value |
|-------|-------|
| Callback URL | `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/meta-leadgen-webhook` |
| Verify Token | (Same value as `META_WEBHOOK_VERIFY_TOKEN` secret) |
| Subscription Fields | `leadgen` |

4. Click **Verify and Save**

### Facebook Login Settings

Ensure these OAuth Redirect URIs are configured:

| URI | Purpose |
|-----|---------|
| `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/meta-oauth-callback` | Basic login callback |

---

## End-to-End Flow After Implementation

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Complete Meta Lead Ads Flow                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. USER CONNECTS (Basic OAuth)                                             │
│     ─────────────────────────────                                           │
│     "Connect Facebook" button                                               │
│          │                                                                  │
│          ▼                                                                  │
│     OAuth popup (public_profile, email only)                                │
│          │                                                                  │
│          ▼                                                                  │
│     meta-oauth-callback stores token                                        │
│          │                                                                  │
│          ▼                                                                  │
│     UI shows "Connected"                                                    │
│                                                                             │
│  2. USER ENABLES LEAD FORMS                                                 │
│     ───────────────────────────                                             │
│     Click "Enable" on Lead Forms card                                       │
│          │                                                                  │
│          ▼                                                                  │
│     meta-enable-feature checks GET /me/permissions                          │
│          │                                                                  │
│          ├─── Has permissions → Enable feature                              │
│          └─── Missing permissions → Show "App Review Required"              │
│                                                                             │
│  3. USER SELECTS PAGES/FORMS                                                │
│     ────────────────────────────                                            │
│     MetaAssetSelector shows list of Pages                                   │
│          │                                                                  │
│          ▼                                                                  │
│     User clicks "Subscribe" on a Page                                       │
│          │                                                                  │
│          ▼                                                                  │
│     meta-subscribe-page calls POST /{page_id}/subscribed_apps               │
│          │                                                                  │
│          ▼                                                                  │
│     Page is now receiving leadgen webhooks                                  │
│                                                                             │
│  4. LEAD COMES IN VIA WEBHOOK                                               │
│     ────────────────────────────                                            │
│     User submits Facebook Lead Form                                         │
│          │                                                                  │
│          ▼                                                                  │
│     Meta sends POST to meta-leadgen-webhook                                 │
│          │                                                                  │
│          ▼                                                                  │
│     Webhook fetches full lead details from Meta API                         │
│          │                                                                  │
│          ▼                                                                  │
│     Lead saved to contacts table                                            │
│          │                                                                  │
│          ▼                                                                  │
│     fire_automation_event("facebook_lead_form", {...})                      │
│          │                                                                  │
│          ▼                                                                  │
│     Automation workflows execute (emails, tags, tasks, etc.)                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `supabase/config.toml` | Modify | Remove dead entries, add meta-enable-feature |
| `supabase/functions/meta-leadgen-webhook/index.ts` | Modify | Add automation trigger, enhance logging |

## Files to Delete

| File | Reason |
|------|--------|
| `supabase/functions/meta-connect-feature/` | Replaced by meta-enable-feature |
| `supabase/functions/meta-feature-callback/` | No longer needed (no OAuth for features) |

---

## Secret to Add

| Name | Purpose |
|------|---------|
| `META_WEBHOOK_VERIFY_TOKEN` | Verify incoming Meta webhooks |

**Suggested value**: `stackit_meta_webhook_2024_secure` (or generate a random 32-character string)

---

## Testing Checklist

After implementation:

1. **Webhook Verification**
   - Configure webhook in Meta Developer Console
   - Should receive "Webhook verified successfully" in logs

2. **Page Subscription**
   - Connect Meta, enable Lead Forms
   - Select a Page, click Subscribe
   - Check that page is in `config.selected_pages`

3. **Lead Ingestion**
   - Use Meta Lead Ads Testing Tool to send a test lead
   - Check Supabase logs for webhook receipt
   - Verify contact appears in `contacts` table
   - Verify automation runs (if configured)

4. **Error Cases**
   - Verify "App Review Required" shows for non-admin users
   - Verify graceful handling of missing tokens

---

## Technical Notes

### Why the existing code is mostly correct:

1. **meta-leadgen-webhook** already handles:
   - GET verification with `META_WEBHOOK_VERIFY_TOKEN`
   - POST with signature verification using `META_CLIENT_SECRET`
   - Team lookup by subscribed page
   - Lead data normalization
   - Contact creation/update

2. **meta-subscribe-page** already handles:
   - Page subscription via `POST /{page_id}/subscribed_apps`
   - Storing page access tokens in config
   - Unsubscribe functionality

3. **MetaAssetSelector** already shows:
   - List of user's pages
   - Subscribe/Unsubscribe buttons
   - Lead forms for subscribed pages

### Main gap was:
- Missing `META_WEBHOOK_VERIFY_TOKEN` secret
- Automation trigger not wired up (was a TODO)
- Dead code cluttering the codebase
