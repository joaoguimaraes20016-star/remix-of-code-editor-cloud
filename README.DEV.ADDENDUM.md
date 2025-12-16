## Ingest endpoint (dev)

A minimal Supabase Edge Function `ingest-funnel-event` was added under `supabase/functions/ingest-funnel-event`.

You can call it via your Supabase project's function URL (or via the Supabase CLI/local emulator).

Example curl (replace `SUPABASE_URL` and `ANON_KEY` with your project values):

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

The function will validate required fields and log the received payload, returning `{ ok: true }` on success.
