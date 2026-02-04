#!/bin/bash

# Alternative approach: Use db pull to sync migrations
# This will pull the remote schema and create migration files locally

set -e

echo "Attempting to sync migrations from remote database..."
echo "This will create local migration files to match the remote state"

npx supabase@latest db pull

echo ""
echo "If successful, you can then run: npx supabase@latest db push"
echo "to verify everything is in sync"
