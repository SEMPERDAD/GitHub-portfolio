#!/usr/bin/env bash
#
# 50/30/20 Budget Tracker — end-to-end build via the gws CLI.
#
# Prereqs:
#   - gws installed:   brew install googleworkspace-cli   (or: npm i -g @googleworkspace/cli)
#   - authenticated:   gws auth login --scopes sheets,drive
#   - jq installed:    brew install jq
#
# Usage:
#   cd budget-tracker
#   ./build.sh
#
# Output: prints the spreadsheet URL on completion.

set -euo pipefail

# --- preflight -------------------------------------------------------------
command -v gws >/dev/null 2>&1 || { echo "ERROR: gws not found. brew install googleworkspace-cli"; exit 2; }
command -v jq  >/dev/null 2>&1 || { echo "ERROR: jq not found. brew install jq"; exit 2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAYLOADS="$SCRIPT_DIR/payloads"

for f in 01-create 02-values 03-format 04-validation 05-conditional 06-charts 07-finalize; do
  [[ -f "$PAYLOADS/$f.json" ]] || { echo "ERROR: missing $PAYLOADS/$f.json"; exit 2; }
done

# --- helpers ---------------------------------------------------------------
hr() { printf '\n\e[1;34m──── %s ────\e[0m\n' "$1"; }

run_batch() {
  local label="$1" payload_file="$2"
  hr "$label"
  gws sheets spreadsheets batchUpdate \
    --params "$(jq -n --arg id "$SHEET_ID" '{spreadsheetId: $id}')" \
    --json "$(cat "$payload_file")" >/dev/null
  echo "  ✓ $label applied"
}

# --- phase 1: create spreadsheet + all sheets ------------------------------
hr "Create spreadsheet with 6 sheets"
CREATE_RESPONSE="$(gws sheets spreadsheets create --json "$(cat "$PAYLOADS/01-create.json")")"
SHEET_ID="$(echo "$CREATE_RESPONSE" | jq -r '.spreadsheetId')"
SHEET_URL="$(echo "$CREATE_RESPONSE" | jq -r '.spreadsheetUrl')"

if [[ -z "$SHEET_ID" || "$SHEET_ID" == "null" ]]; then
  echo "ERROR: spreadsheet create failed. Response:"
  echo "$CREATE_RESPONSE"
  exit 1
fi
echo "  ✓ spreadsheetId: $SHEET_ID"

# --- phase 2: write all values and formulas --------------------------------
hr "Write values, formulas, and seed data"
gws sheets spreadsheets values batchUpdate \
  --params "$(jq -n --arg id "$SHEET_ID" '{spreadsheetId: $id}')" \
  --json "$(cat "$PAYLOADS/02-values.json")" >/dev/null
echo "  ✓ values written"

# --- phase 3: formatting ---------------------------------------------------
run_batch "Apply formatting (colors, merges, widths, number formats)" "$PAYLOADS/03-format.json"

# --- phase 4: data validation (dropdowns, checkboxes, ranges) --------------
run_batch "Apply data validation" "$PAYLOADS/04-validation.json"

# --- phase 5: conditional formatting ---------------------------------------
run_batch "Apply conditional formatting" "$PAYLOADS/05-conditional.json"

# --- phase 6: charts -------------------------------------------------------
run_batch "Add charts (bar + donut)" "$PAYLOADS/06-charts.json"

# --- phase 7: finalize (hide Reference tab) --------------------------------
run_batch "Finalize (hide Reference tab)" "$PAYLOADS/07-finalize.json"

hr "Build complete"
echo "Open your spreadsheet:"
echo "  $SHEET_URL"
