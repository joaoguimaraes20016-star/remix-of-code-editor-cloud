#!/bin/bash

# Script to repair the remaining UUID-based migrations from October 2025
# These are migrations that exist in remote but not locally

set -e

echo "Repairing remaining UUID-based migrations..."

REVERTED_UUID_MIGRATIONS=(
  "20251015234728_beb572c9-c1b0-439c-a172-c0a260129671.sql"
  "20251015234821_fdeb02fb-98b6-42c8-93f0-64d98974ae06.sql"
  "20251015235145_19ca6b16-bfbd-4f61-9ed6-991fe6264ad0.sql"
  "20251015235422_534169cc-d3cd-4262-878d-aab4949dfc4e.sql"
  "20251015235810_7a48c1c2-7450-444d-a708-b414dd6d01a1.sql"
  "20251016001521_c85ec6b6-87f3-47f3-8dd8-c85e55276d02.sql"
  "20251016002709_7cbe78f5-20ba-466c-a4ef-324008954c95.sql"
  "20251016004345_4ed50adb-1d9d-4dbd-8028-a6d629baafae.sql"
  "20251016015736_d8ee6ead-b25d-4168-bcd2-14685324c718.sql"
  "20251016015857_03794fe3-2afc-4496-ba38-fd93623e0422.sql"
  "20251016020332_0ac69cca-2098-45f9-a43d-1c6322f7b7ea.sql"
  "20251016021630_dfedd7fa-3bc4-4091-8573-4339e3db653c.sql"
  "20251016023244_a9d4e430-57b2-4580-8e6d-15c4a3ba2ca2.sql"
  "20251016025401_f20d4817-2270-4091-a5fc-b37fd0dc3cf9.sql"
  "20251016025800_ba6a2e71-6351-4c44-85ca-6f2f1f6b0225.sql"
  "20251016025857_1631075d-b8c5-4c40-bde7-a79ebe83cb2f.sql"
  "20251016031733_190381c2-89de-46ee-b198-800307a3b16e.sql"
  "20251016032539_c9485176-61a1-4f83-ad3b-045bea5f0688.sql"
  "20251016042642_2c8a269f-0a40-4c0c-bf8d-b0e9e2ed4097.sql"
  "20251016135223_ef397582-4299-45e2-ab0e-d2542132a5e0.sql"
  "20251016145042_6e3616cb-f49e-4922-a1b5-bb378a194646.sql"
  "20251016150452_8aecc311-2e77-4ae5-9add-b1780f183227.sql"
  "20251016162954_22737ac9-c4aa-460b-bbfa-3e075f630462.sql"
  "20251016164408_d2704562-8548-40bf-9155-ef6409621b1d.sql"
  "20251016164800_9e0c6616-d395-44fa-9906-95071604ebb7.sql"
  "20251016165823_de49168f-cb18-4977-8fc4-de5b84f8fbb2.sql"
  "20251016170119_007ed19e-092b-43af-ba21-021b7f50ae6e.sql"
  "20251016170600_475653cf-58de-46d9-b797-191ddc678dbd.sql"
  "20251016170733_b00ee8cb-d798-423a-9bda-f09d0ff44ba4.sql"
  "20251016172511_1e60eedc-6024-41f9-bfd2-4e9a956c633f.sql"
  "20251016233518_5dc86d6f-fae5-4771-bbea-8a9a416a86c1.sql"
  "20251017013713_784eaf79-06f5-40e0-9db6-7f5a2b0d8acd.sql"
  "20251017024416_f8e5eab7-96a0-4502-ac69-864b102b88ca.sql"
  "20251017025816_bc86a482-ca7a-4af3-bc3b-5c3e3d2b1a4c.sql"
  "20251017031717_8eb0a6f7-ab38-47c7-b7b0-029be5e4c55f.sql"
  "20251017173724_a3387a36-4bca-4056-8e92-095539e68c05.sql"
  "20251017183911_30b59d1f-7e6d-44dd-8ede-a53b3911da2d.sql"
  "20251018183638_5d6e0dc5-81ac-4e90-a623-9aa4882d6d49.sql"
  "20251018224743_1e8f6a2e-2cf1-4c9a-b3f4-70b43b0e7e15.sql"
  "20251018232157_082f670d-105a-4614-bfd3-fe725db15aca.sql"
  "20251018232633_ef1705ab-f392-43b9-8b6d-55249e0b3213.sql"
  "20251018232933_949389f0-8992-478a-b4ba-b55d15438445.sql"
  "20251018233113_56e5bbed-808f-4c6d-bf4c-91a59c0247b5.sql"
  "20251018233319_b21ae511-7e78-49b5-b661-9031e7e61e31.sql"
  "20251018233335_18ef8a6f-ad16-47a1-afe5-f6c0e0d54b58.sql"
  "20251019001439_669e1c5f-29db-4180-9ed2-39ba1392e321.sql"
  "20251019013045_39eec767-3456-4470-937e-807f4e140402.sql"
  "20251019140115_832e1d8d-5506-4233-a19e-81b92ec419bc.sql"
  "20251019203518_e234ff35-33c9-46a9-b337-408a9f76c47d.sql"
  "20251019223945_21c90ded-19f3-4f69-8399-8c634354e20b.sql"
  "20251020160737_2d98530e-c241-4f09-b678-0cbc2cd0b049.sql"
  "20251020163757_8849353e-6bc4-4388-bf2e-8c262e1373f0.sql"
  "20251020164847_f41a4974-ec7b-4a30-b0db-ff27c7c1f604.sql"
  "20251021164337_c6dee4b3-3e75-4568-97d4-e28dfa2e0b62.sql"
  "20251021171144_666b835a-bbed-4917-b2a3-ae0885f9c523.sql"
)

TOTAL=${#REVERTED_UUID_MIGRATIONS[@]}
COUNTER=0
FAILED=0

echo "Found $TOTAL UUID-based migrations to repair"

for migration in "${REVERTED_UUID_MIGRATIONS[@]}"; do
  COUNTER=$((COUNTER + 1))
  # Extract just the timestamp part (before the underscore)
  migration_timestamp=$(echo "$migration" | cut -d'_' -f1)
  echo "[$COUNTER/$TOTAL] Repairing migration: $migration_timestamp (from $migration)"
  
  if npx supabase@latest migration repair --status reverted "$migration_timestamp" 2>&1; then
    echo "✓ Successfully repaired: $migration_timestamp"
  else
    echo "✗ Failed to repair: $migration_timestamp"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "=========================================="
echo "UUID migration repair completed!"
echo "Total migrations processed: $TOTAL"
echo "Successful: $((TOTAL - FAILED))"
echo "Failed: $FAILED"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
  echo ""
  echo "All UUID migrations repaired successfully!"
  echo "You can now run: npx supabase@latest db push"
else
  echo ""
  echo "Some migrations failed. These may not exist in the remote database."
  echo "You can try running: npx supabase@latest db push"
fi
