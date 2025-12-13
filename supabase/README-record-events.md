# Deploying events table and record-funnel-event function

This document explains how to apply the migration and deploy the `record-funnel-event` Edge Function.

Prerequisites
- Supabase CLI installed and logged in (`supabase login` or set `SUPABASE_ACCESS_TOKEN`).
- You have access to the target Supabase project defined in `supabase/config.toml` or via `--project-ref`.

Quick deploy (from repo root):

```bash
# Ensure SUPABASE_ACCESS_TOKEN is set (or run `supabase login`)
pnpm run supabase:deploy
```

What the script does
- Runs `supabase migration deploy` to apply SQL migrations in `supabase/migrations/`.
- Deploys the Edge Function `record-funnel-event` from `supabase/functions/record-funnel-event`.

Notes
- If you prefer to run steps individually:

```bash
supabase migration deploy
supabase functions deploy record-funnel-event
```

- The Edge Function expects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to be available as environment variables when executed in Supabase (you don't need to set them locally to deploy).
