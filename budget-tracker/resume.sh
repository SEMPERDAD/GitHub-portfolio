#!/usr/bin/env bash
#
# Resume the build against an existing spreadsheet.
# Usage: ./resume.sh <SPREADSHEET_ID> [start_phase]
# Phases: 3 (format) | 4 (validation) | 5 (conditional) | 6 (charts) | 7 (finalize)
# Default start_phase is 5.
#
# Example:
#   ./resume.sh 1ZS0mtLSt3iDQPe4Kpsxu4cYXuZe9JLBuFSzoZbwVxOE 5

set -euo pipefail

SHEET_ID="${1:-}"
START="${2:-5}"

if [[ -z "$SHEET_ID" ]]; then
  echo "Usage: $0 <spreadsheet_id> [start_phase]"
  exit 2
fi

command -v gws >/dev/null || { echo "gws not found"; exit 2; }
command -v jq  >/dev/null || { echo "jq not found"; exit 2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAYLOADS="$SCRIPT_DIR/payloads"

hr() { printf '\n\e[1;34m──── %s ────\e[0m\n' "$1"; }

run_batch() {
  local label="$1" payload_file="$2"
  hr "$label"
  gws sheets spreadsheets batchUpdate \
    --params "$(jq -n --arg id "$SHEET_ID" '{spreadsheetId: $id}')" \
    --json "$(cat "$payload_file")" >/dev/null
  echo "  ✓ $label applied"
}

[[ $START -le 3 ]] && run_batch "Apply formatting"             "$PAYLOADS/03-format.json"
[[ $START -le 4 ]] && run_batch "Apply data validation"        "$PAYLOADS/04-validation.json"
[[ $START -le 5 ]] && run_batch "Apply conditional formatting" "$PAYLOADS/05-conditional.json"
[[ $START -le 6 ]] && run_batch "Add charts"                   "$PAYLOADS/06-charts.json"
[[ $START -le 7 ]] && run_batch "Finalize (hide Reference)"    "$PAYLOADS/07-finalize.json"

hr "Resume complete"
echo "https://docs.google.com/spreadsheets/d/$SHEET_ID/edit"
