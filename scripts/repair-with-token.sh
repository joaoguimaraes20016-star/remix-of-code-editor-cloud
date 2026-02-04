#!/bin/bash

# Script to repair Supabase migrations using an existing access token
# Usage: SUPABASE_ACCESS_TOKEN=your_token_here ./scripts/repair-with-token.sh

set -e

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN environment variable is required"
  echo "Usage: SUPABASE_ACCESS_TOKEN=your_token_here ./scripts/repair-with-token.sh"
  exit 1
fi

export SUPABASE_ACCESS_TOKEN

echo "Using existing Supabase access token..."
echo "Starting migration repair..."

# Run the repair script
./scripts/repair-supabase-migrations.sh
