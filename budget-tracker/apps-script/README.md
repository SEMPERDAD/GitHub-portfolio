# 50/30/20 Budget Tracker — Google Apps Script build

The same spreadsheet the `gws` CLI produces, built via Apps Script instead. No Cloud Console, no OAuth client, no CLI, no `client_secret.json` — just a Google account and a browser.

## Setup (~5 minutes of clicking)

1. Go to <https://script.google.com> → **New project**.
2. Delete the default `function myFunction() { … }` stub in `Code.gs`.
3. Copy the contents of [`Code.gs`](./Code.gs) from this repo and paste it in.
4. In the left sidebar, click **Services** (the `+` next to it). Find **Google Sheets API** in the list and click **Add**. The identifier stays as `Sheets`.
5. Save the project (⌘/Ctrl-S). Name it whatever you like — "Budget Tracker Builder" works.
6. At the top of the editor, make sure the function selector shows **`buildBudgetTracker`**, then click **Run** ▶.
7. A permissions popup appears: **Review permissions** → pick your Google account → **Advanced** → **Go to (project name) (unsafe)** → **Allow**. Google flags user-authored scripts as "unsafe" — this is normal since you're the developer of your own script.
8. The script runs (~10–20 seconds). Open the **Execution log** (bottom of the editor) to see the spreadsheet URL. Click it.

That's it. You get a fully built 6-tab dashboard identical to the `gws` build.

## What gets built

Same as the `gws` version — see [`../README.md`](../README.md) for the tab-by-tab breakdown.

- **Dashboard** — month selector, KPI banner, bar chart, donut chart, per-bucket tables
- **Expense Log** — 44 seeded transactions across Jan–Mar 2025
- **Income Log** — 8 seeded income entries
- **Debt Tracker** — 4 seeded debts with NPER-based payoff dates and progress bars
- **Sinking Funds** — 5 seeded goals with status indicators
- **Reference** *(hidden)* — dropdown lists and 50/30/20 ratio targets

## Re-running

Each run of `buildBudgetTracker` creates a **brand-new spreadsheet** in your Drive. Nothing is edited or deleted. If you want to start over, just run again and use the new URL.

## Troubleshooting

- **`ReferenceError: Sheets is not defined`** — the Sheets Advanced Service isn't enabled. Redo step 4.
- **`Authorization is required`** — click **Review permissions** in the yellow banner and complete the flow (step 7).
- **Script timeout** — Apps Script caps free-tier executions at 6 minutes. This build finishes in well under that; if it times out, run again on a lighter Google Workspace load.
- **Missing charts / conditional formatting** — check the Execution log for a partial batch. Re-running produces a clean new spreadsheet.

## How this differs from the `gws` build

| | `gws` CLI | Apps Script |
|---|---|---|
| Setup | brew install, OAuth client in Cloud Console, `gws auth login` | Enable Sheets service in editor, one Allow click |
| Runs from | Your terminal | script.google.com in the browser |
| Auth | OAuth desktop-app flow | Standard Google account grant |
| Payloads | 7 JSON files fed to `gws sheets spreadsheets batchUpdate` | Same 7 payloads inlined in `Code.gs` and fed to `Sheets.Spreadsheets.batchUpdate` |
| Output | Same spreadsheet, same design, same data |

Both paths issue the exact same Sheets API v4 requests — only the transport differs.
