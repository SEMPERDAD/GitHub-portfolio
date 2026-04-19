# 50/30/20 Budget Tracker — Claude Code Build Prompt (Cytec Edition)

> **How to use:** Paste everything from the horizontal rule below into Claude Code alongside the `spreadsheet_prompt_generator.md` file. Claude Code will execute the build end-to-end using the `gws` CLI.

---

Build me a **50/30/20 Budget Tracker** in Google Sheets using the `gws` CLI tool. This is a personal finance dashboard styled with a modern navy, teal, and mint professional aesthetic — clean, data-forward, and sharp. It should feel like a premium ops tool, not a generic spreadsheet.

---

## Overview

A complete monthly budget management system built around the 50/30/20 rule (50% Needs, 30% Wants, 20% Savings & Debt). The user sets their monthly income and customizable split ratios, logs all income and expenses, and the Dashboard tab auto-calculates actual vs. expected allocations, shows a cash flow summary bar chart, a donut chart for allocation breakdown, and itemized summaries for each bucket. Additional tabs handle debt payoff tracking (avalanche method) and sinking funds for irregular expenses. A hidden Reference tab stores all dropdown values and lookup data.

---

## Tabs

### Tab 1: Dashboard (sheetId: 0)
The main view. Month selector in B2 drives all formulas. Shows budget period, net income, the three bucket totals (Needs / Wants / Savings & Debt), actual vs. expected allocation summary, cash flow bar chart, donut allocation chart, and a condensed line-item summary for each bucket pulled from the Expense Log.

### Tab 2: Expense Log (sheetId: 1)
The raw data entry tab. Each row is one transaction. User enters date, description, amount, bucket (Needs/Wants/Savings & Debt), and category. All dashboard formulas pull from this tab.

### Tab 3: Income Log (sheetId: 2)
Tracks all income sources by date, source name, and amount. Dashboard pulls total monthly income from here.

### Tab 4: Debt Tracker (sheetId: 3)
Lists each debt with creditor name, balance, interest rate, minimum payment, and extra payment. Calculates payoff date using the avalanche method. Includes a payoff progress bar per debt using REPT.

### Tab 5: Sinking Funds (sheetId: 4)
Tracks irregular savings goals (car insurance, vacation, holiday gifts, etc.) with target amount, monthly contribution, amount saved, and months remaining.

### Tab 6 (Hidden): Reference (sheetId: 5)
Stores all dropdown list values: Bucket options, Needs categories, Wants categories, Savings & Debt categories, Income source types. Also stores the customizable 50/30/20 ratio targets.

---

## Color Palette

| Semantic Role | Hex | Name |
|---------------|-----|------|
| Primary header bg | `#0D1B2A` | Cytec Navy |
| Dark accent / section headers | `#1A2F45` | Deep Navy |
| Needs bucket accent | `#B2EBF2` | Light Sage |
| Wants bucket accent | `#80DEEA` | Medium Mint |
| Savings bucket accent | `#0097A7` | Cytec Teal |
| Input cell background | `#E8F4F8` | Warm Off-White |
| Alternating row A | `#E8F4F8` | Warm White |
| Alternating row B | `#FFFFFF` | White |
| Warning / over budget | `#FFB74D` | Amber |
| Critical / significantly over | `#EF5350` | Alert Red |
| Body text | `#0D1B2A` | Near Black |
| Muted label text | `#546E7A` | Medium Gray |

See the full build specification in `prompt-full.md` (or the original prompt text) for formulas, sample data, charts, validation, and conditional formatting rules.
