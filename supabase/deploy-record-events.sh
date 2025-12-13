#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Using pnpm dlx supabase@latest to run Supabase CLI (no global install required)"

SUPABASE_CMD="pnpm dlx supabase@latest"

echo "Deploying Supabase migrations..."
$SUPABASE_CMD migration deploy

echo "Deploying record-funnel-event Edge Function..."
$SUPABASE_CMD functions deploy record-funnel-event

echo "Finished deploying Supabase migrations and functions."
