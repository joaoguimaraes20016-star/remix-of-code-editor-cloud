#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Checking supabase CLI..."
if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found. Install from https://supabase.com/docs/guides/cli"
  exit 1
fi

echo "Deploying Supabase migrations..."
supabase migration deploy

echo "Deploying record-funnel-event Edge Function..."
supabase functions deploy record-funnel-event

echo "Finished deploying Supabase migrations and functions."
