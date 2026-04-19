# 50/30/20 Budget Tracker — gws CLI Build

End-to-end build of a Google Sheets personal finance dashboard using the [`gws`](https://github.com/googleworkspace/cli) CLI.

## What this builds

A 6-tab spreadsheet:

| Tab | Purpose |
|---|---|
| **Dashboard** | Month selector (B2), KPI banner for Needs / Wants / Savings & Debt, cash flow bar chart, allocation donut chart, per-bucket summary tables |
| **Expense Log** | Raw transaction entry (date, amount, bucket, category, description, paid checkbox) |
| **Income Log** | Income sources by date |
| **Debt Tracker** | Avalanche-method payoff with `NPER()` and visual progress bars |
| **Sinking Funds** | Target-based savings goals with status indicators |
| **Reference** *(hidden)* | Dropdown lookup lists and customizable budget ratio targets |

Seeded with ~44 expense rows and 8 income entries across Jan–Mar 2025.

## Prerequisites

On your local machine:

```bash
brew install googleworkspace-cli     # or: npm install -g @googleworkspace/cli
brew install jq
gws auth login --scopes sheets,drive
```

The OAuth flow requires a Google Cloud project with a Desktop OAuth client. If you haven't set one up, run `gws auth setup` first (needs `gcloud`) or do it manually in Cloud Console.

## Run

```bash
cd budget-tracker
./build.sh
```

The script prints the spreadsheet URL on completion.

## Files

```
budget-tracker/
├── build.sh                         # orchestrator — runs all 7 payloads in order
├── prompt.md                        # the original build prompt
├── spreadsheet_prompt_generator.md  # prompt-engineering spec for gws sheet builds
└── payloads/
    ├── 01-create.json       # create spreadsheet + 6 sheets (sheetId 0–5)
    ├── 02-values.json       # all data, formulas, seed rows
    ├── 03-format.json       # merges, colors, column widths, number formats, fonts
    ├── 04-validation.json   # dropdowns, checkboxes, number ranges
    ├── 05-conditional.json  # conditional formatting (over-budget, funded status, etc.)
    ├── 06-charts.json       # cash flow bar chart + allocation donut chart
    └── 07-finalize.json     # hide Reference tab
```

## Design

- **Palette:** navy `#0D1B2A`, deep navy `#1A2F45`, teal `#0097A7`, light sage `#B2EBF2`, medium mint `#80DEEA`, amber `#FFB74D` (warnings), alert red `#EF5350`.
- **Formulas:** all native Google Sheets (`SUMIFS`, `NPER`, `EDATE`, `ARRAYFORMULA`, `REPT`). No Apps Script.
- **Dynamic filtering:** Dashboard `B2` drives every SUMIFS via the auto-tagged `Month` column in Expense/Income logs.
- **All formulas wrapped in `IFERROR`** for clean empty states.

## Editing / extending

- Add expense rows in **Expense Log** — the `#` and `Month` columns auto-fill via `ARRAYFORMULA`.
- Adjust budget split in **Reference** cells `G1:G3` (defaults: 50 / 30 / 20).
- Change months by editing **Reference** column I, or expanding the list to 2026+ and updating the dropdown range in `04-validation.json`.
