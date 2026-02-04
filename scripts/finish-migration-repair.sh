#!/bin/bash

# Script to finish the migration repair process
# This handles the remaining migrations that need to be marked as "applied"

set -e

echo "Finishing migration repair..."

# First, mark the one migration as reverted
echo "Marking 20251220044651 as reverted..."
npx supabase@latest migration repair --status reverted 20251220044651

# Now mark all the migrations that should be applied
echo ""
echo "Marking migrations as applied..."

APPLIED_MIGRATIONS=(
  "20251108175228"
  "20251113221023"
  "20251116002156"
  "20251116004213"
  "20251116004314"
  "20251117201316"
  "20251118154258"
  "20251118155006"
  "20251118162956"
  "20251120191651"
  "20251124014235"
  "20251201194558"
  "20251201200506"
  "20251201221016"
  "20251201222917"
  "20251204013645"
  "20251204032217"
  "20251204041440"
  "20251204045828"
  "20251205174632"
  "20251206184754"
  "20251208052611"
  "20251209040021"
  "20251209040715"
  "20251209043100"
  "20251209051949"
  "20251209052947"
  "20251209230834"
  "20251210041659"
  "20251210091359"
  "20251210221854"
  "20251210224741"
  "20251210230918"
  "20251211002428"
  "20251211005829"
  "20251211011259"
  "20251211040143"
  "20251211042625"
  "20251211044003"
  "20251212032355"
  "20251212052738"
  "20251212180548"
  "20251213000000"
  "20251228090000"
  "20260107090000"
  "20260108161433"
  "20260118224648"
  "20260120225120"
  "20260121004933"
  "20260121021721"
  "20260121022524"
  "20260121044611"
  "20260121190045"
  "20260121203437"
  "20260121212344"
  "20260121225227"
  "20260122004436"
  "20260122010053"
  "20260122010537"
  "20260122050323"
  "20260122061457"
  "20260123041210"
  "20260123045000"
  "20260123175144"
  "20260123194623"
  "20260123195003"
  "20260124064029"
  "20260126190753"
  "20260126194213"
  "20260127182008"
  "20260131120000"
)

TOTAL=${#APPLIED_MIGRATIONS[@]}
COUNTER=0
FAILED=0

for migration in "${APPLIED_MIGRATIONS[@]}"; do
  COUNTER=$((COUNTER + 1))
  echo "[$COUNTER/$TOTAL] Marking as applied: $migration"
  
  if npx supabase@latest migration repair --status applied "$migration" 2>&1; then
    echo "✓ Successfully marked as applied: $migration"
  else
    echo "✗ Failed to mark as applied: $migration"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "=========================================="
echo "Migration repair completed!"
echo "Total migrations processed: $TOTAL"
echo "Successful: $((TOTAL - FAILED))"
echo "Failed: $FAILED"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
  echo ""
  echo "All migrations repaired successfully!"
  echo "You can now run: npx supabase@latest db pull"
else
  echo ""
  echo "Some migrations failed. Please check the errors above."
fi
