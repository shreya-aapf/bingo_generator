#!/usr/bin/env bash
set -euo pipefail

# Simple smoke-test script for Supabase Edge Functions (safe tests only)
# Does OPTIONS and an invalid POST for each function to verify reachability and validation.

BASE="https://jnsfslmcowcefhpszrfx.functions.supabase.co"
FUNCTIONS=("generate-proof" "claim" "send-card" "upload-winning-card")

echo "Running smoke tests against project: jnsfslmcowcefhpszrfx"

echo
for fn in "${FUNCTIONS[@]}"; do
  echo "=== OPTIONS /$fn ==="
  curl -i -X OPTIONS "$BASE/$fn" || true
  echo
  echo "=== POST /$fn (invalid payload) ==="
  # Send a deliberately invalid body to avoid side-effects (no secrets)
  curl -s -i -X POST "$BASE/$fn" -H "Content-Type: application/json" -d '{"cid":"short"}' || true
  echo -e "\n\n"
done

echo "Smoke tests complete. These are safe checks and avoid sending emails or using secrets."
