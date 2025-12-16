ingest-funnel-event

Minimal Supabase Edge Function to ingest funnel events for dev.

Example curl (replace SUPABASE_URL and ANON_KEY):

```bash
curl -X POST "$SUPABASE_URL/functions/v1/ingest-funnel-event" \
  -H "Content-Type: application/json" \
  -H "apikey: $ANON_KEY" \
  -d '{
    "funnel_id":"dev-funnel-1",
    "step_id":"dev-step-1",
    "intent":"capture",
    "lead_id":"dev-lead-1",
    "payload":{"email":"dev@example.com"},
    "dedupe_key":"dev-funnel-1:dev-step-1:capture:dev-lead-1",
    "occurred_at":"2025-12-16T00:00:00Z"
  }'
```

The function validates required fields and logs the received payload, returning `{ ok: true }` on success.
