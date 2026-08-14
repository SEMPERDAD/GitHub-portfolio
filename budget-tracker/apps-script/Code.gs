/**
 * 50/30/20 Budget Tracker — Google Apps Script build.
 *
 * One-time setup:
 *   1. Go to https://script.google.com → New project
 *   2. Paste this file into Code.gs (overwriting the default)
 *   3. Left sidebar → Services (+) → add "Google Sheets API" (identifier: Sheets)
 *   4. Click Run ▶ on buildBudgetTracker — approve the permissions popup
 *   5. Open the "Executions" log to find the spreadsheet URL
 *
 * Re-runs create a fresh spreadsheet each time. Nothing is deleted.
 */

function buildBudgetTracker() {
  const create = Sheets.Spreadsheets.create(CREATE_PAYLOAD);
  const id = create.spreadsheetId;
  const url = create.spreadsheetUrl;
  Logger.log('✓ Spreadsheet created: ' + url);

  Sheets.Spreadsheets.Values.batchUpdate(VALUES_PAYLOAD, id);
  Logger.log('✓ Values, formulas, and seed data written');

  Sheets.Spreadsheets.batchUpdate(FORMAT_PAYLOAD, id);
  Logger.log('✓ Formatting applied');

  Sheets.Spreadsheets.batchUpdate(VALIDATION_PAYLOAD, id);
  Logger.log('✓ Data validation applied');

  Sheets.Spreadsheets.batchUpdate(CONDITIONAL_PAYLOAD, id);
  Logger.log('✓ Conditional formatting applied');

  Sheets.Spreadsheets.batchUpdate(CHARTS_PAYLOAD, id);
  Logger.log('✓ Charts added');

  Sheets.Spreadsheets.batchUpdate(FINALIZE_PAYLOAD, id);
  Logger.log('✓ Reference tab hidden');

  Logger.log('');
  Logger.log('Build complete — open your spreadsheet:');
  Logger.log('  ' + url);
  return url;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1 — Create spreadsheet + 6 sheets
// ─────────────────────────────────────────────────────────────────────────────
const CREATE_PAYLOAD = {
  properties: {
    title: '50/30/20 Budget Tracker',
    locale: 'en_US'
  },
  sheets: [
    { properties: { sheetId: 0, title: 'Dashboard',     gridProperties: { rowCount: 50,  columnCount: 14 } } },
    { properties: { sheetId: 1, title: 'Expense Log',   gridProperties: { rowCount: 200, columnCount: 8, frozenRowCount: 1 } } },
    { properties: { sheetId: 2, title: 'Income Log',    gridProperties: { rowCount: 100, columnCount: 6, frozenRowCount: 1 } } },
    { properties: { sheetId: 3, title: 'Debt Tracker',  gridProperties: { rowCount: 20,  columnCount: 11, frozenRowCount: 1 } } },
    { properties: { sheetId: 4, title: 'Sinking Funds', gridProperties: { rowCount: 30,  columnCount: 9,  frozenRowCount: 1 } } },
    { properties: { sheetId: 5, title: 'Reference',     gridProperties: { rowCount: 20,  columnCount: 10 } } }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 — Values, formulas, and seed data
// ─────────────────────────────────────────────────────────────────────────────
const VALUES_PAYLOAD = {
  valueInputOption: 'USER_ENTERED',
  data: [
    { range: 'Reference!A1:A4', values: [['Bucket'], ['Needs'], ['Wants'], ['Savings & Debt']] },
    { range: 'Reference!B1:B13', values: [
      ['Needs Category'], ['Rent/Mortgage'], ['Utilities'], ['Groceries'], ['Transportation'],
      ['Insurance'], ['Phone'], ['Internet'], ['Medical'], ['Childcare'],
      ['Subscriptions (Essential)'], ['Minimum Debt Payments'], ['Other Needs']
    ]},
    { range: 'Reference!C1:C13', values: [
      ['Wants Category'], ['Dining Out'], ['Entertainment'], ['Shopping'], ['Personal Care'],
      ['Travel'], ['Hobbies'], ['Subscriptions (Non-Essential)'], ['Gifts'], ['Gym Membership'],
      ['Streaming Services'], ['Alcohol/Bars'], ['Other Wants']
    ]},
    { range: 'Reference!D1:D8', values: [
      ['Savings & Debt Category'], ['Emergency Fund'], ['Retirement (401k/IRA)'],
      ['Sinking Fund Contribution'], ['Extra Debt Payment'], ['Investment'],
      ['Savings Account'], ['Other Savings']
    ]},
    { range: 'Reference!F1:G3', values: [
      ['Needs Target %',   0.50],
      ['Wants Target %',   0.30],
      ['Savings Target %', 0.20]
    ]},
    { range: 'Reference!I1:I13', values: [
      ['Month'],
      ['Jan 2025'], ['Feb 2025'], ['Mar 2025'], ['Apr 2025'],
      ['May 2025'], ['Jun 2025'], ['Jul 2025'], ['Aug 2025'],
      ['Sep 2025'], ['Oct 2025'], ['Nov 2025'], ['Dec 2025']
    ]},

    { range: 'Income Log!A1:F1', values: [['#', 'Date', 'Amount', 'Source', 'Month', 'Notes']] },
    { range: 'Income Log!A2', values: [['=ARRAYFORMULA(IF(B2:B="","",ROW(B2:B)-1))']] },
    { range: 'Income Log!E2', values: [['=ARRAYFORMULA(IF(B2:B="","",TEXT(B2:B,"MMM YYYY")))']] },
    { range: 'Income Log!B2:F9', values: [
      ['01/01/2025', 3200.00, 'Paycheck',    '', 'Bi-weekly'],
      ['01/15/2025', 3200.00, 'Paycheck',    '', 'Bi-weekly'],
      ['01/22/2025',  450.00, 'Freelance',   '', 'Logo design project'],
      ['02/01/2025', 3200.00, 'Paycheck',    '', ''],
      ['02/15/2025', 3200.00, 'Paycheck',    '', ''],
      ['03/01/2025', 3200.00, 'Paycheck',    '', ''],
      ['03/15/2025', 3200.00, 'Paycheck',    '', ''],
      ['03/20/2025',  600.00, 'Side Hustle', '', 'Tutoring']
    ]},

    { range: 'Expense Log!A1:H1', values: [['#', 'Date', 'Amount', 'Bucket', 'Category', 'Description', 'Month', 'Paid']] },
    { range: 'Expense Log!A2', values: [['=ARRAYFORMULA(IF(B2:B="","",ROW(B2:B)-1))']] },
    { range: 'Expense Log!G2', values: [['=ARRAYFORMULA(IF(B2:B="","",TEXT(B2:B,"MMM YYYY")))']] },
    { range: 'Expense Log!B2:H45', values: [
      ['01/02/2025', 1450.00, 'Needs', 'Rent/Mortgage',            'Monthly rent',                '', false],
      ['01/03/2025',  120.00, 'Needs', 'Utilities',                'Electric bill',               '', false],
      ['01/05/2025',  380.00, 'Needs', 'Groceries',                'Weekly groceries x2',         '', false],
      ['01/06/2025',   85.00, 'Needs', 'Transportation',           'Gas',                         '', false],
      ['01/10/2025',  140.00, 'Needs', 'Insurance',                'Car insurance',               '', false],
      ['01/12/2025',   45.00, 'Needs', 'Phone',                    'Mobile plan',                 '', false],
      ['01/15/2025',   65.00, 'Needs', 'Internet',                 'Home internet',               '', false],
      ['01/18/2025',   30.00, 'Needs', 'Subscriptions (Essential)','iCloud storage + antivirus',  '', false],
      ['01/04/2025',   95.00, 'Wants', 'Dining Out',               '4 restaurant visits',         '', false],
      ['01/08/2025',   60.00, 'Wants', 'Entertainment',            'Movie + event tickets',       '', false],
      ['01/14/2025',  120.00, 'Wants', 'Shopping',                 'Clothing',                    '', false],
      ['01/19/2025',   45.00, 'Wants', 'Streaming Services',       'Netflix, Hulu, Spotify',      '', false],
      ['01/23/2025',   75.00, 'Wants', 'Personal Care',            'Haircut + products',          '', false],
      ['01/28/2025',   40.00, 'Wants', 'Gym Membership',           'Monthly gym',                 '', false],
      ['01/01/2025',  500.00, 'Savings & Debt', 'Emergency Fund',        'Automatic transfer',    '', false],
      ['01/01/2025',  320.00, 'Savings & Debt', 'Retirement (401k/IRA)', 'Roth IRA contribution', '', false],
      ['01/01/2025',  150.00, 'Savings & Debt', 'Extra Debt Payment',    'Chase Visa extra',      '', false],
      ['02/01/2025', 1450.00, 'Needs', 'Rent/Mortgage',            '',                            '', false],
      ['02/03/2025',  105.00, 'Needs', 'Utilities',                'Lower bill',                  '', false],
      ['02/07/2025',  360.00, 'Needs', 'Groceries',                '',                            '', false],
      ['02/09/2025',   90.00, 'Needs', 'Transportation',           '',                            '', false],
      ['02/10/2025',  140.00, 'Needs', 'Insurance',                '',                            '', false],
      ['02/12/2025',   45.00, 'Needs', 'Phone',                    '',                            '', false],
      ['02/15/2025',   65.00, 'Needs', 'Internet',                 '',                            '', false],
      ['02/14/2025',  180.00, 'Wants', 'Dining Out',               "Valentine's dinner",          '', false],
      ['02/18/2025',   85.00, 'Wants', 'Shopping',                 '',                            '', false],
      ['02/20/2025',   45.00, 'Wants', 'Streaming Services',       '',                            '', false],
      ['02/22/2025',   75.00, 'Wants', 'Personal Care',            '',                            '', false],
      ['02/01/2025',  500.00, 'Savings & Debt', 'Emergency Fund',        '',                      '', false],
      ['02/01/2025',  320.00, 'Savings & Debt', 'Retirement (401k/IRA)', '',                      '', false],
      ['03/01/2025', 1450.00, 'Needs', 'Rent/Mortgage',            '',                            '', false],
      ['03/04/2025',  115.00, 'Needs', 'Utilities',                '',                            '', false],
      ['03/06/2025',  395.00, 'Needs', 'Groceries',                '',                            '', false],
      ['03/08/2025',   95.00, 'Needs', 'Transportation',           '',                            '', false],
      ['03/10/2025',  140.00, 'Needs', 'Insurance',                '',                            '', false],
      ['03/12/2025',   45.00, 'Needs', 'Phone',                    '',                            '', false],
      ['03/15/2025',   65.00, 'Needs', 'Internet',                 '',                            '', false],
      ['03/10/2025',  220.00, 'Wants', 'Dining Out',               "St. Patrick's Day outings",   '', false],
      ['03/15/2025',  195.00, 'Wants', 'Shopping',                 'Spring wardrobe',             '', false],
      ['03/18/2025',  110.00, 'Wants', 'Travel',                   'Weekend trip deposit',        '', false],
      ['03/22/2025',   45.00, 'Wants', 'Streaming Services',       '',                            '', false],
      ['03/25/2025',   80.00, 'Wants', 'Hobbies',                  '',                            '', false],
      ['03/01/2025',  500.00, 'Savings & Debt', 'Emergency Fund',        '',                      '', false],
      ['03/01/2025',  320.00, 'Savings & Debt', 'Retirement (401k/IRA)', '',                      '', false]
    ]},

    { range: 'Debt Tracker!A1:K1', values: [[
      'Creditor', 'Balance', 'Interest Rate', 'Min Payment', 'Extra Payment',
      'Total Monthly', 'Months to Payoff', 'Payoff Date', 'Interest Cost', 'Progress', 'Original Balance'
    ]]},
    { range: 'Debt Tracker!A2:K5', values: [
      ['Chase Visa',   4200.00,  0.2199, 105.00, 150.00,
        '=D2+E2',
        '=IFERROR(ROUND(NPER(C2/12,-F2,B2),0),"∞")',
        '=IFERROR(TEXT(EDATE(TODAY(),G2),"MMM YYYY"),"N/A")',
        '=IFERROR((F2*G2)-B2,0)',
        '=IFERROR(REPT("█",ROUND((1-(B2/K2))*20,0))&REPT("░",20-ROUND((1-(B2/K2))*20,0)),REPT("░",20))',
        5500.00],
      ['Student Loan', 18500.00, 0.0499, 195.00, 50.00,
        '=D3+E3',
        '=IFERROR(ROUND(NPER(C3/12,-F3,B3),0),"∞")',
        '=IFERROR(TEXT(EDATE(TODAY(),G3),"MMM YYYY"),"N/A")',
        '=IFERROR((F3*G3)-B3,0)',
        '=IFERROR(REPT("█",ROUND((1-(B3/K3))*20,0))&REPT("░",20-ROUND((1-(B3/K3))*20,0)),REPT("░",20))',
        22000.00],
      ['Car Loan',     9800.00,  0.0649, 210.00, 0.00,
        '=D4+E4',
        '=IFERROR(ROUND(NPER(C4/12,-F4,B4),0),"∞")',
        '=IFERROR(TEXT(EDATE(TODAY(),G4),"MMM YYYY"),"N/A")',
        '=IFERROR((F4*G4)-B4,0)',
        '=IFERROR(REPT("█",ROUND((1-(B4/K4))*20,0))&REPT("░",20-ROUND((1-(B4/K4))*20,0)),REPT("░",20))',
        12000.00],
      ['Medical Bill', 1100.00,  0.0001, 92.00,  100.00,
        '=D5+E5',
        '=IFERROR(ROUND(NPER(C5/12,-F5,B5),0),"∞")',
        '=IFERROR(TEXT(EDATE(TODAY(),G5),"MMM YYYY"),"N/A")',
        '=IFERROR((F5*G5)-B5,0)',
        '=IFERROR(REPT("█",ROUND((1-(B5/K5))*20,0))&REPT("░",20-ROUND((1-(B5/K5))*20,0)),REPT("░",20))',
        1100.00]
    ]},
    { range: 'Debt Tracker!A7:I7', values: [[
      'TOTALS', '=SUM(B2:B5)', '', '=SUM(D2:D5)', '=SUM(E2:E5)', '=SUM(F2:F5)', '', '', '=SUM(I2:I5)'
    ]]},

    { range: 'Sinking Funds!A1:I1', values: [[
      'Fund Name', 'Target Amount', 'Monthly Contribution', 'Amount Saved',
      '% Complete', 'Months Remaining', 'Target Date', 'Progress Bar', 'Status'
    ]]},
    { range: 'Sinking Funds!A2:I6', values: [
      ['Emergency Fund (6mo)', 12000.00, 500.00, 4500.00,
        '=IFERROR(D2/B2,0)',
        '=IFERROR(CEILING((B2-D2)/C2,1),0)',
        '=IFERROR(TEXT(EDATE(TODAY(),F2),"MMM YYYY"),"Funded!")',
        '=IFERROR(REPT("█",ROUND(E2*20,0))&REPT("░",20-ROUND(E2*20,0)),REPT("░",20))',
        '=IF(E2>=1,"✅ Funded!",IF(E2>=0.75,"🟢 On Track",IF(E2>=0.5,"🟡 Halfway","🔴 Behind")))'],
      ['Vacation', 2500.00, 200.00, 800.00,
        '=IFERROR(D3/B3,0)',
        '=IFERROR(CEILING((B3-D3)/C3,1),0)',
        '=IFERROR(TEXT(EDATE(TODAY(),F3),"MMM YYYY"),"Funded!")',
        '=IFERROR(REPT("█",ROUND(E3*20,0))&REPT("░",20-ROUND(E3*20,0)),REPT("░",20))',
        '=IF(E3>=1,"✅ Funded!",IF(E3>=0.75,"🟢 On Track",IF(E3>=0.5,"🟡 Halfway","🔴 Behind")))'],
      ['Car Maintenance', 1200.00, 100.00, 650.00,
        '=IFERROR(D4/B4,0)',
        '=IFERROR(CEILING((B4-D4)/C4,1),0)',
        '=IFERROR(TEXT(EDATE(TODAY(),F4),"MMM YYYY"),"Funded!")',
        '=IFERROR(REPT("█",ROUND(E4*20,0))&REPT("░",20-ROUND(E4*20,0)),REPT("░",20))',
        '=IF(E4>=1,"✅ Funded!",IF(E4>=0.75,"🟢 On Track",IF(E4>=0.5,"🟡 Halfway","🔴 Behind")))'],
      ['Holiday Gifts', 800.00, 65.00, 130.00,
        '=IFERROR(D5/B5,0)',
        '=IFERROR(CEILING((B5-D5)/C5,1),0)',
        '=IFERROR(TEXT(EDATE(TODAY(),F5),"MMM YYYY"),"Funded!")',
        '=IFERROR(REPT("█",ROUND(E5*20,0))&REPT("░",20-ROUND(E5*20,0)),REPT("░",20))',
        '=IF(E5>=1,"✅ Funded!",IF(E5>=0.75,"🟢 On Track",IF(E5>=0.5,"🟡 Halfway","🔴 Behind")))'],
      ['New Laptop', 1500.00, 125.00, 375.00,
        '=IFERROR(D6/B6,0)',
        '=IFERROR(CEILING((B6-D6)/C6,1),0)',
        '=IFERROR(TEXT(EDATE(TODAY(),F6),"MMM YYYY"),"Funded!")',
        '=IFERROR(REPT("█",ROUND(E6*20,0))&REPT("░",20-ROUND(E6*20,0)),REPT("░",20))',
        '=IF(E6>=1,"✅ Funded!",IF(E6>=0.75,"🟢 On Track",IF(E6>=0.5,"🟡 Halfway","🔴 Behind")))']
    ]},

    { range: 'Dashboard!A1', values: [['50/30/20 BUDGET DASHBOARD']] },
    { range: 'Dashboard!A2:H2', values: [[
      'BUDGET PERIOD',
      'Jan 2025',
      '',
      'NET CURRENCY',
      'USD',
      '',
      'DATE RANGE',
      '=IFERROR(TEXT(DATE(VALUE(RIGHT(B2,4)),MATCH(LEFT(B2,3),{"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"},0),1),"MM/DD/YYYY")&" – "&TEXT(EOMONTH(DATE(VALUE(RIGHT(B2,4)),MATCH(LEFT(B2,3),{"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"},0),1),0),"MM/DD/YYYY"),"")'
    ]]},
    { range: 'Dashboard!A4', values: [['NEEDS']] },
    { range: 'Dashboard!E4', values: [['WANTS']] },
    { range: 'Dashboard!I4', values: [['SAVINGS & DEBT']] },
    { range: 'Dashboard!A5', values: [['=IFERROR(TEXT(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!D:D,"Needs",\'Expense Log\'!G:G,B2),"$#,##0.00"),"$0.00")']] },
    { range: 'Dashboard!E5', values: [['=IFERROR(TEXT(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!D:D,"Wants",\'Expense Log\'!G:G,B2),"$#,##0.00"),"$0.00")']] },
    { range: 'Dashboard!I5', values: [['=IFERROR(TEXT(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!D:D,"Savings & Debt",\'Expense Log\'!G:G,B2),"$#,##0.00"),"$0.00")']] },
    { range: 'Dashboard!A7', values: [['CASH FLOW SUMMARY']] },
    { range: 'Dashboard!G7', values: [['ACTUAL ALLOCATION SUMMARY']] },
    { range: 'Dashboard!A8:B12', values: [
      ['Income',         '=IFERROR(SUMIFS(\'Income Log\'!C:C,\'Income Log\'!E:E,B2),0)'],
      ['Needs',          '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!D:D,"Needs",\'Expense Log\'!G:G,B2),0)'],
      ['Wants',          '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!D:D,"Wants",\'Expense Log\'!G:G,B2),0)'],
      ['Savings & Debt', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!D:D,"Savings & Debt",\'Expense Log\'!G:G,B2),0)'],
      ['Remaining',      '=B8-B9-B10-B11']
    ]},
    { range: 'Dashboard!G8:H10', values: [
      ['Savings & Debt', '=IFERROR(B11/B8,0)'],
      ['Needs',          '=IFERROR(B9/B8,0)'],
      ['Wants',          '=IFERROR(B10/B8,0)']
    ]},
    { range: 'Dashboard!A14', values: [['AMOUNT LEFT TO SPEND']] },
    { range: 'Dashboard!A15', values: [['=TEXT(B12,"$#,##0.00")']] },
    { range: 'Dashboard!E14', values: [['% INCOME SPENT']] },
    { range: 'Dashboard!E15', values: [['=IFERROR(1-(B12/B8),0)']] },
    { range: 'Dashboard!A17', values: [['NEEDS SUMMARY']] },
    { range: 'Dashboard!A18:D18', values: [['Category', 'Expected', 'Actual', 'Progress']] },
    { range: 'Dashboard!A19:D30', values: [
      ['Rent/Mortgage',             '=Reference!$G$1*$B$8*0.40', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,A19,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(C19/B19*10,0),10)),"")'],
      ['Utilities',                 '=Reference!$G$1*$B$8*0.05', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,A20,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(C20/B20*10,0),10)),"")'],
      ['Groceries',                 '=Reference!$G$1*$B$8*0.15', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,A21,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(C21/B21*10,0),10)),"")'],
      ['Transportation',            '=Reference!$G$1*$B$8*0.08', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,A22,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(C22/B22*10,0),10)),"")'],
      ['Insurance',                 '=Reference!$G$1*$B$8*0.07', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,A23,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(C23/B23*10,0),10)),"")'],
      ['Phone',                     '=Reference!$G$1*$B$8*0.03', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,A24,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(C24/B24*10,0),10)),"")'],
      ['Internet',                  '=Reference!$G$1*$B$8*0.04', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,A25,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(C25/B25*10,0),10)),"")'],
      ['Medical',                   '=Reference!$G$1*$B$8*0.05', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,A26,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(C26/B26*10,0),10)),"")'],
      ['Childcare',                 '=Reference!$G$1*$B$8*0.05', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,A27,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(C27/B27*10,0),10)),"")'],
      ['Subscriptions (Essential)', '=Reference!$G$1*$B$8*0.02', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,A28,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(C28/B28*10,0),10)),"")'],
      ['Minimum Debt Payments',     '=Reference!$G$1*$B$8*0.04', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,A29,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(C29/B29*10,0),10)),"")'],
      ['Other Needs',               '=Reference!$G$1*$B$8*0.02', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,A30,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(C30/B30*10,0),10)),"")']
    ]},
    { range: 'Dashboard!F17', values: [['WANTS SUMMARY']] },
    { range: 'Dashboard!F18:I18', values: [['Category', 'Expected', 'Actual', 'Progress']] },
    { range: 'Dashboard!F19:I30', values: [
      ['Dining Out',                    '=Reference!$G$2*$B$8*0.25', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,F19,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(H19/G19*10,0),10)),"")'],
      ['Entertainment',                 '=Reference!$G$2*$B$8*0.10', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,F20,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(H20/G20*10,0),10)),"")'],
      ['Shopping',                      '=Reference!$G$2*$B$8*0.20', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,F21,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(H21/G21*10,0),10)),"")'],
      ['Personal Care',                 '=Reference!$G$2*$B$8*0.08', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,F22,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(H22/G22*10,0),10)),"")'],
      ['Travel',                        '=Reference!$G$2*$B$8*0.10', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,F23,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(H23/G23*10,0),10)),"")'],
      ['Hobbies',                       '=Reference!$G$2*$B$8*0.05', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,F24,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(H24/G24*10,0),10)),"")'],
      ['Subscriptions (Non-Essential)', '=Reference!$G$2*$B$8*0.05', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,F25,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(H25/G25*10,0),10)),"")'],
      ['Gifts',                         '=Reference!$G$2*$B$8*0.03', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,F26,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(H26/G26*10,0),10)),"")'],
      ['Gym Membership',                '=Reference!$G$2*$B$8*0.04', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,F27,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(H27/G27*10,0),10)),"")'],
      ['Streaming Services',            '=Reference!$G$2*$B$8*0.05', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,F28,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(H28/G28*10,0),10)),"")'],
      ['Alcohol/Bars',                  '=Reference!$G$2*$B$8*0.03', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,F29,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(H29/G29*10,0),10)),"")'],
      ['Other Wants',                   '=Reference!$G$2*$B$8*0.02', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,F30,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(H30/G30*10,0),10)),"")']
    ]},
    { range: 'Dashboard!K17', values: [['SAVINGS & DEBT SUMMARY']] },
    { range: 'Dashboard!K18:N18', values: [['Category', 'Expected', 'Actual', 'Progress']] },
    { range: 'Dashboard!K19:N25', values: [
      ['Emergency Fund',            '=Reference!$G$3*$B$8*0.30', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,K19,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(M19/L19*10,0),10)),"")'],
      ['Retirement (401k/IRA)',     '=Reference!$G$3*$B$8*0.30', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,K20,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(M20/L20*10,0),10)),"")'],
      ['Sinking Fund Contribution', '=Reference!$G$3*$B$8*0.10', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,K21,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(M21/L21*10,0),10)),"")'],
      ['Extra Debt Payment',        '=Reference!$G$3*$B$8*0.15', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,K22,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(M22/L22*10,0),10)),"")'],
      ['Investment',                '=Reference!$G$3*$B$8*0.10', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,K23,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(M23/L23*10,0),10)),"")'],
      ['Savings Account',           '=Reference!$G$3*$B$8*0.03', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,K24,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(M24/L24*10,0),10)),"")'],
      ['Other Savings',             '=Reference!$G$3*$B$8*0.02', '=IFERROR(SUMIFS(\'Expense Log\'!C:C,\'Expense Log\'!E:E,K25,\'Expense Log\'!G:G,$B$2),0)', '=IFERROR(REPT("█",MIN(ROUND(M25/L25*10,0),10)),"")']
    ]}
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3 — Formatting (merges, colors, widths, number formats, banding)
// ─────────────────────────────────────────────────────────────────────────────
const FORMAT_PAYLOAD = {
  requests: [
    { mergeCells: { range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 14 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId: 0, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 4 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId: 0, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 4 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId: 0, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 4, endColumnIndex: 8 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId: 0, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 4, endColumnIndex: 8 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId: 0, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 8, endColumnIndex: 12 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId: 0, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 8, endColumnIndex: 12 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId: 0, startRowIndex: 6, endRowIndex: 7, startColumnIndex: 0, endColumnIndex: 5 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId: 0, startRowIndex: 6, endRowIndex: 7, startColumnIndex: 6, endColumnIndex: 12 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId: 0, startRowIndex: 13, endRowIndex: 14, startColumnIndex: 0, endColumnIndex: 4 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId: 0, startRowIndex: 14, endRowIndex: 15, startColumnIndex: 0, endColumnIndex: 4 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId: 0, startRowIndex: 16, endRowIndex: 17, startColumnIndex: 0, endColumnIndex: 4 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId: 0, startRowIndex: 16, endRowIndex: 17, startColumnIndex: 5, endColumnIndex: 9 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId: 0, startRowIndex: 16, endRowIndex: 17, startColumnIndex: 10, endColumnIndex: 14 }, mergeType: 'MERGE_ALL' } },

    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 14 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.051, green: 0.106, blue: 0.165 },
        horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
        textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, fontFamily: 'Arial', fontSize: 16, bold: true }
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)'
    }},
    { updateDimensionProperties: { range: { sheetId: 0, dimension: 'ROWS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 44 }, fields: 'pixelSize' } },

    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 14 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.910, green: 0.957, blue: 0.973 },
        textFormat: { fontFamily: 'Arial', fontSize: 9, bold: true, foregroundColor: { red: 0.329, green: 0.431, blue: 0.478 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,textFormat)'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 1, endColumnIndex: 2 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.910, green: 0.957, blue: 0.973 },
        horizontalAlignment: 'CENTER',
        textFormat: { fontFamily: 'Arial', fontSize: 12, bold: true, foregroundColor: { red: 0.051, green: 0.106, blue: 0.165 } },
        borders: {
          top:    { style: 'SOLID', width: 2, color: { red: 0.0, green: 0.592, blue: 0.655 } },
          bottom: { style: 'SOLID', width: 2, color: { red: 0.0, green: 0.592, blue: 0.655 } },
          left:   { style: 'SOLID', width: 2, color: { red: 0.0, green: 0.592, blue: 0.655 } },
          right:  { style: 'SOLID', width: 2, color: { red: 0.0, green: 0.592, blue: 0.655 } }
        }
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat,borders)'
    }},

    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 4 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.698, green: 0.922, blue: 0.949 },
        horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
        textFormat: { fontFamily: 'Arial', fontSize: 10, bold: true, foregroundColor: { red: 0.051, green: 0.106, blue: 0.165 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 4 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 1, green: 1, blue: 1 },
        horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
        textFormat: { fontFamily: 'Arial', fontSize: 18, bold: true, foregroundColor: { red: 0.051, green: 0.106, blue: 0.165 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 4, endColumnIndex: 8 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.502, green: 0.871, blue: 0.918 },
        horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
        textFormat: { fontFamily: 'Arial', fontSize: 10, bold: true, foregroundColor: { red: 0.051, green: 0.106, blue: 0.165 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 4, endColumnIndex: 8 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 1, green: 1, blue: 1 },
        horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
        textFormat: { fontFamily: 'Arial', fontSize: 18, bold: true, foregroundColor: { red: 0.051, green: 0.106, blue: 0.165 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 8, endColumnIndex: 12 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.0, green: 0.592, blue: 0.655 },
        horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
        textFormat: { fontFamily: 'Arial', fontSize: 10, bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 8, endColumnIndex: 12 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 1, green: 1, blue: 1 },
        horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
        textFormat: { fontFamily: 'Arial', fontSize: 18, bold: true, foregroundColor: { red: 0.0, green: 0.592, blue: 0.655 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)'
    }},
    { updateDimensionProperties: { range: { sheetId: 0, dimension: 'ROWS', startIndex: 3, endIndex: 5 }, properties: { pixelSize: 36 }, fields: 'pixelSize' } },

    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 6, endRowIndex: 7, startColumnIndex: 0, endColumnIndex: 14 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.102, green: 0.184, blue: 0.271 },
        horizontalAlignment: 'LEFT', verticalAlignment: 'MIDDLE',
        padding: { left: 8 },
        textFormat: { fontFamily: 'Arial', fontSize: 10, bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,padding,textFormat)'
    }},

    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 7, endRowIndex: 12, startColumnIndex: 1, endColumnIndex: 2 },
      cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
      fields: 'userEnteredFormat.numberFormat'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 7, endRowIndex: 10, startColumnIndex: 7, endColumnIndex: 8 },
      cell: { userEnteredFormat: { numberFormat: { type: 'PERCENT', pattern: '0%' }, horizontalAlignment: 'RIGHT' } },
      fields: 'userEnteredFormat(numberFormat,horizontalAlignment)'
    }},

    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 13, endRowIndex: 14, startColumnIndex: 0, endColumnIndex: 5 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.910, green: 0.957, blue: 0.973 },
        textFormat: { fontFamily: 'Arial', fontSize: 9, bold: true, foregroundColor: { red: 0.329, green: 0.431, blue: 0.478 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,textFormat)'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 14, endRowIndex: 15, startColumnIndex: 0, endColumnIndex: 4 },
      cell: { userEnteredFormat: {
        horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
        textFormat: { fontFamily: 'Arial', fontSize: 22, bold: true, foregroundColor: { red: 0.0, green: 0.592, blue: 0.655 } }
      }},
      fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment,textFormat)'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 14, endRowIndex: 15, startColumnIndex: 4, endColumnIndex: 5 },
      cell: { userEnteredFormat: {
        numberFormat: { type: 'PERCENT', pattern: '0%' },
        textFormat: { fontFamily: 'Arial', fontSize: 14, bold: true, foregroundColor: { red: 0.051, green: 0.106, blue: 0.165 } }
      }},
      fields: 'userEnteredFormat(numberFormat,textFormat)'
    }},

    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 16, endRowIndex: 17, startColumnIndex: 0, endColumnIndex: 4 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.698, green: 0.922, blue: 0.949 },
        horizontalAlignment: 'CENTER',
        textFormat: { fontFamily: 'Arial', fontSize: 10, bold: true, foregroundColor: { red: 0.051, green: 0.106, blue: 0.165 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 16, endRowIndex: 17, startColumnIndex: 5, endColumnIndex: 9 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.502, green: 0.871, blue: 0.918 },
        horizontalAlignment: 'CENTER',
        textFormat: { fontFamily: 'Arial', fontSize: 10, bold: true, foregroundColor: { red: 0.051, green: 0.106, blue: 0.165 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 16, endRowIndex: 17, startColumnIndex: 10, endColumnIndex: 14 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.0, green: 0.592, blue: 0.655 },
        horizontalAlignment: 'CENTER',
        textFormat: { fontFamily: 'Arial', fontSize: 10, bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 17, endRowIndex: 18, startColumnIndex: 0, endColumnIndex: 14 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.102, green: 0.184, blue: 0.271 },
        textFormat: { fontFamily: 'Arial', fontSize: 9, bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,textFormat)'
    }},

    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 18, endRowIndex: 30, startColumnIndex: 1, endColumnIndex: 3 },
      cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
      fields: 'userEnteredFormat.numberFormat'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 18, endRowIndex: 30, startColumnIndex: 6, endColumnIndex: 8 },
      cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
      fields: 'userEnteredFormat.numberFormat'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 18, endRowIndex: 25, startColumnIndex: 11, endColumnIndex: 13 },
      cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
      fields: 'userEnteredFormat.numberFormat'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 18, endRowIndex: 30, startColumnIndex: 3, endColumnIndex: 4 },
      cell: { userEnteredFormat: { textFormat: { fontFamily: 'Courier New', foregroundColor: { red: 0.0, green: 0.592, blue: 0.655 } } } },
      fields: 'userEnteredFormat.textFormat'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 18, endRowIndex: 30, startColumnIndex: 8, endColumnIndex: 9 },
      cell: { userEnteredFormat: { textFormat: { fontFamily: 'Courier New', foregroundColor: { red: 0.502, green: 0.871, blue: 0.918 } } } },
      fields: 'userEnteredFormat.textFormat'
    }},
    { repeatCell: {
      range: { sheetId: 0, startRowIndex: 18, endRowIndex: 25, startColumnIndex: 13, endColumnIndex: 14 },
      cell: { userEnteredFormat: { textFormat: { fontFamily: 'Courier New', foregroundColor: { red: 0.0, green: 0.592, blue: 0.655 } } } },
      fields: 'userEnteredFormat.textFormat'
    }},

    { updateDimensionProperties: { range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 160 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 1, endIndex: 4 }, properties: { pixelSize: 110 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 }, properties: { pixelSize: 20 },  fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 5, endIndex: 8 }, properties: { pixelSize: 110 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 8, endIndex: 9 }, properties: { pixelSize: 20 },  fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 9, endIndex: 14 }, properties: { pixelSize: 110 }, fields: 'pixelSize' } },

    { repeatCell: {
      range: { sheetId: 1, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 8 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.051, green: 0.106, blue: 0.165 },
        horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
        textFormat: { fontFamily: 'Arial', fontSize: 11, bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)'
    }},
    { repeatCell: {
      range: { sheetId: 1, startRowIndex: 1, endRowIndex: 200, startColumnIndex: 1, endColumnIndex: 2 },
      cell: { userEnteredFormat: { numberFormat: { type: 'DATE', pattern: 'MM/DD/YYYY' } } },
      fields: 'userEnteredFormat.numberFormat'
    }},
    { repeatCell: {
      range: { sheetId: 1, startRowIndex: 1, endRowIndex: 200, startColumnIndex: 2, endColumnIndex: 3 },
      cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
      fields: 'userEnteredFormat.numberFormat'
    }},
    { updateDimensionProperties: { range: { sheetId: 1, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 45 },  fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: 1, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 100 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: 1, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 110 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: 1, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: 1, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 }, properties: { pixelSize: 160 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: 1, dimension: 'COLUMNS', startIndex: 5, endIndex: 6 }, properties: { pixelSize: 220 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: 1, dimension: 'COLUMNS', startIndex: 6, endIndex: 7 }, properties: { pixelSize: 90 },  fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: 1, dimension: 'COLUMNS', startIndex: 7, endIndex: 8 }, properties: { pixelSize: 60 },  fields: 'pixelSize' } },

    { repeatCell: {
      range: { sheetId: 2, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 6 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.051, green: 0.106, blue: 0.165 },
        horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
        textFormat: { fontFamily: 'Arial', fontSize: 11, bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)'
    }},
    { repeatCell: {
      range: { sheetId: 2, startRowIndex: 1, endRowIndex: 100, startColumnIndex: 1, endColumnIndex: 2 },
      cell: { userEnteredFormat: { numberFormat: { type: 'DATE', pattern: 'MM/DD/YYYY' } } },
      fields: 'userEnteredFormat.numberFormat'
    }},
    { repeatCell: {
      range: { sheetId: 2, startRowIndex: 1, endRowIndex: 100, startColumnIndex: 2, endColumnIndex: 3 },
      cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
      fields: 'userEnteredFormat.numberFormat'
    }},

    { repeatCell: {
      range: { sheetId: 3, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 11 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.102, green: 0.184, blue: 0.271 },
        horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
        textFormat: { fontFamily: 'Arial', fontSize: 11, bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)'
    }},
    { repeatCell: {
      range: { sheetId: 3, startRowIndex: 1, endRowIndex: 15, startColumnIndex: 1, endColumnIndex: 2 },
      cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
      fields: 'userEnteredFormat.numberFormat'
    }},
    { repeatCell: {
      range: { sheetId: 3, startRowIndex: 1, endRowIndex: 15, startColumnIndex: 2, endColumnIndex: 3 },
      cell: { userEnteredFormat: { numberFormat: { type: 'PERCENT', pattern: '0.00%' } } },
      fields: 'userEnteredFormat.numberFormat'
    }},
    { repeatCell: {
      range: { sheetId: 3, startRowIndex: 1, endRowIndex: 15, startColumnIndex: 3, endColumnIndex: 6 },
      cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
      fields: 'userEnteredFormat.numberFormat'
    }},
    { repeatCell: {
      range: { sheetId: 3, startRowIndex: 1, endRowIndex: 15, startColumnIndex: 8, endColumnIndex: 9 },
      cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
      fields: 'userEnteredFormat.numberFormat'
    }},
    { repeatCell: {
      range: { sheetId: 3, startRowIndex: 1, endRowIndex: 15, startColumnIndex: 10, endColumnIndex: 11 },
      cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
      fields: 'userEnteredFormat.numberFormat'
    }},
    { repeatCell: {
      range: { sheetId: 3, startRowIndex: 1, endRowIndex: 15, startColumnIndex: 9, endColumnIndex: 10 },
      cell: { userEnteredFormat: { textFormat: { fontFamily: 'Courier New', foregroundColor: { red: 0.0, green: 0.592, blue: 0.655 } } } },
      fields: 'userEnteredFormat.textFormat'
    }},
    { addBanding: { bandedRange: {
      range: { sheetId: 3, startRowIndex: 1, endRowIndex: 15, startColumnIndex: 0, endColumnIndex: 11 },
      rowProperties: {
        firstBandColor:  { red: 0.960, green: 0.941, blue: 0.918 },
        secondBandColor: { red: 1, green: 1, blue: 1 }
      }
    }}},
    { repeatCell: {
      range: { sheetId: 3, startRowIndex: 6, endRowIndex: 7, startColumnIndex: 0, endColumnIndex: 11 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.102, green: 0.184, blue: 0.271 },
        textFormat: { fontFamily: 'Arial', fontSize: 11, bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,textFormat)'
    }},

    { repeatCell: {
      range: { sheetId: 4, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 9 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.0, green: 0.592, blue: 0.655 },
        horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
        textFormat: { fontFamily: 'Arial', fontSize: 11, bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)'
    }},
    { repeatCell: {
      range: { sheetId: 4, startRowIndex: 1, endRowIndex: 20, startColumnIndex: 1, endColumnIndex: 4 },
      cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
      fields: 'userEnteredFormat.numberFormat'
    }},
    { repeatCell: {
      range: { sheetId: 4, startRowIndex: 1, endRowIndex: 20, startColumnIndex: 4, endColumnIndex: 5 },
      cell: { userEnteredFormat: { numberFormat: { type: 'PERCENT', pattern: '0%' } } },
      fields: 'userEnteredFormat.numberFormat'
    }},
    { repeatCell: {
      range: { sheetId: 4, startRowIndex: 1, endRowIndex: 20, startColumnIndex: 7, endColumnIndex: 8 },
      cell: { userEnteredFormat: { textFormat: { fontFamily: 'Courier New', foregroundColor: { red: 0.0, green: 0.592, blue: 0.655 } } } },
      fields: 'userEnteredFormat.textFormat'
    }},
    { addBanding: { bandedRange: {
      range: { sheetId: 4, startRowIndex: 1, endRowIndex: 20, startColumnIndex: 0, endColumnIndex: 9 },
      rowProperties: {
        firstBandColor:  { red: 0.910, green: 0.957, blue: 0.973 },
        secondBandColor: { red: 1, green: 1, blue: 1 }
      }
    }}},

    { repeatCell: {
      range: { sheetId: 5, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 10 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.102, green: 0.184, blue: 0.271 },
        textFormat: { fontFamily: 'Arial', fontSize: 10, bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
      }},
      fields: 'userEnteredFormat(backgroundColor,textFormat)'
    }},
    { repeatCell: {
      range: { sheetId: 5, startRowIndex: 0, endRowIndex: 3, startColumnIndex: 6, endColumnIndex: 7 },
      cell: { userEnteredFormat: { numberFormat: { type: 'PERCENT', pattern: '0%' } } },
      fields: 'userEnteredFormat.numberFormat'
    }},

    { updateSheetProperties: {
      properties: { sheetId: 0, gridProperties: { frozenRowCount: 3 } },
      fields: 'gridProperties.frozenRowCount'
    }}
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 — Data validation (dropdowns, checkboxes, numeric ranges)
// ─────────────────────────────────────────────────────────────────────────────
const VALIDATION_PAYLOAD = {
  requests: [
    { setDataValidation: {
      range: { sheetId: 0, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 1, endColumnIndex: 2 },
      rule: {
        condition: { type: 'ONE_OF_RANGE', values: [{ userEnteredValue: '=Reference!$I$2:$I$13' }] },
        showCustomUi: true, strict: true,
        inputMessage: 'Select the month to view on the dashboard.'
      }
    }},
    { setDataValidation: {
      range: { sheetId: 1, startRowIndex: 1, endRowIndex: 200, startColumnIndex: 3, endColumnIndex: 4 },
      rule: {
        condition: { type: 'ONE_OF_RANGE', values: [{ userEnteredValue: '=Reference!$A$2:$A$4' }] },
        showCustomUi: true, strict: true
      }
    }},
    { setDataValidation: {
      range: { sheetId: 1, startRowIndex: 1, endRowIndex: 200, startColumnIndex: 4, endColumnIndex: 5 },
      rule: {
        condition: { type: 'ONE_OF_RANGE', values: [{ userEnteredValue: '=Reference!$B$2:$D$13' }] },
        showCustomUi: true, strict: false,
        inputMessage: 'Choose a category matching the bucket (Needs=col B, Wants=col C, Savings & Debt=col D).'
      }
    }},
    { setDataValidation: {
      range: { sheetId: 1, startRowIndex: 1, endRowIndex: 200, startColumnIndex: 1, endColumnIndex: 2 },
      rule: { condition: { type: 'DATE_IS_VALID' }, strict: false }
    }},
    { setDataValidation: {
      range: { sheetId: 1, startRowIndex: 1, endRowIndex: 200, startColumnIndex: 2, endColumnIndex: 3 },
      rule: {
        condition: { type: 'NUMBER_GREATER', values: [{ userEnteredValue: '0' }] },
        strict: false, inputMessage: 'Amount must be greater than 0.'
      }
    }},
    { repeatCell: {
      range: { sheetId: 1, startRowIndex: 1, endRowIndex: 200, startColumnIndex: 7, endColumnIndex: 8 },
      cell: { dataValidation: { condition: { type: 'BOOLEAN' } } },
      fields: 'dataValidation'
    }},
    { setDataValidation: {
      range: { sheetId: 2, startRowIndex: 1, endRowIndex: 100, startColumnIndex: 3, endColumnIndex: 4 },
      rule: {
        condition: { type: 'ONE_OF_LIST', values: [
          { userEnteredValue: 'Paycheck' },
          { userEnteredValue: 'Freelance' },
          { userEnteredValue: 'Side Hustle' },
          { userEnteredValue: 'Dividends' },
          { userEnteredValue: 'Rental' },
          { userEnteredValue: 'Other' }
        ]},
        showCustomUi: true, strict: true
      }
    }},
    { setDataValidation: {
      range: { sheetId: 2, startRowIndex: 1, endRowIndex: 100, startColumnIndex: 1, endColumnIndex: 2 },
      rule: { condition: { type: 'DATE_IS_VALID' }, strict: false }
    }},
    { setDataValidation: {
      range: { sheetId: 2, startRowIndex: 1, endRowIndex: 100, startColumnIndex: 2, endColumnIndex: 3 },
      rule: {
        condition: { type: 'NUMBER_GREATER', values: [{ userEnteredValue: '0' }] },
        strict: false
      }
    }},
    { setDataValidation: {
      range: { sheetId: 3, startRowIndex: 1, endRowIndex: 15, startColumnIndex: 1, endColumnIndex: 2 },
      rule: {
        condition: { type: 'NUMBER_GREATER_THAN_EQ', values: [{ userEnteredValue: '0' }] },
        strict: false
      }
    }},
    { setDataValidation: {
      range: { sheetId: 3, startRowIndex: 1, endRowIndex: 15, startColumnIndex: 2, endColumnIndex: 3 },
      rule: {
        condition: { type: 'NUMBER_BETWEEN', values: [
          { userEnteredValue: '0' }, { userEnteredValue: '1' }
        ]},
        strict: false, inputMessage: 'Enter APR as a decimal (e.g. 0.05 for 5%).'
      }
    }},
    { setDataValidation: {
      range: { sheetId: 3, startRowIndex: 1, endRowIndex: 15, startColumnIndex: 3, endColumnIndex: 6 },
      rule: {
        condition: { type: 'NUMBER_GREATER_THAN_EQ', values: [{ userEnteredValue: '0' }] },
        strict: false
      }
    }},
    { setDataValidation: {
      range: { sheetId: 4, startRowIndex: 1, endRowIndex: 20, startColumnIndex: 1, endColumnIndex: 4 },
      rule: {
        condition: { type: 'NUMBER_GREATER_THAN_EQ', values: [{ userEnteredValue: '0' }] },
        strict: false
      }
    }}
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 5 — Conditional formatting
// ─────────────────────────────────────────────────────────────────────────────
const CONDITIONAL_PAYLOAD = {
  requests: [
    { addConditionalFormatRule: { rule: {
      ranges: [{ sheetId: 1, startRowIndex: 1, endRowIndex: 200, startColumnIndex: 0, endColumnIndex: 8 }],
      booleanRule: {
        condition: { type: 'CUSTOM_FORMULA', values: [{ userEnteredValue: '=$H2=TRUE' }] },
        format: { backgroundColor: { red: 0.878, green: 0.969, blue: 0.980 } }
      }
    }, index: 0 }},
    { addConditionalFormatRule: { rule: {
      ranges: [{ sheetId: 0, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 4 }],
      booleanRule: {
        condition: { type: 'CUSTOM_FORMULA', values: [{ userEnteredValue: '=AND($B$8>0,$B$9/$B$8>INDIRECT("Reference!G1")*1.05)' }] },
        format: {
          backgroundColor: { red: 1, green: 0.718, blue: 0.302 },
          textFormat: { bold: true, foregroundColor: { red: 0.051, green: 0.106, blue: 0.165 } }
        }
      }
    }, index: 0 }},
    { addConditionalFormatRule: { rule: {
      ranges: [{ sheetId: 0, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 4, endColumnIndex: 8 }],
      booleanRule: {
        condition: { type: 'CUSTOM_FORMULA', values: [{ userEnteredValue: '=AND($B$8>0,$B$10/$B$8>INDIRECT("Reference!G2")*1.05)' }] },
        format: {
          backgroundColor: { red: 1, green: 0.718, blue: 0.302 },
          textFormat: { bold: true, foregroundColor: { red: 0.051, green: 0.106, blue: 0.165 } }
        }
      }
    }, index: 0 }},
    { addConditionalFormatRule: { rule: {
      ranges: [{ sheetId: 4, startRowIndex: 1, endRowIndex: 20, startColumnIndex: 8, endColumnIndex: 9 }],
      booleanRule: {
        condition: { type: 'TEXT_CONTAINS', values: [{ userEnteredValue: 'Funded' }] },
        format: {
          backgroundColor: { red: 0.698, green: 0.922, blue: 0.949 },
          textFormat: { bold: true }
        }
      }
    }, index: 0 }},
    { addConditionalFormatRule: { rule: {
      ranges: [{ sheetId: 4, startRowIndex: 1, endRowIndex: 20, startColumnIndex: 4, endColumnIndex: 5 }],
      gradientRule: {
        minpoint: { color: { red: 1.0,   green: 0.8,   blue: 0.737 }, type: 'NUMBER', value: '0' },
        midpoint: { color: { red: 0.910, green: 0.957, blue: 0.973 }, type: 'NUMBER', value: '0.5' },
        maxpoint: { color: { red: 0.698, green: 0.922, blue: 0.949 }, type: 'NUMBER', value: '1' }
      }
    }, index: 0 }},
    { addConditionalFormatRule: { rule: {
      ranges: [{ sheetId: 3, startRowIndex: 1, endRowIndex: 15, startColumnIndex: 2, endColumnIndex: 3 }],
      booleanRule: {
        condition: { type: 'NUMBER_GREATER', values: [{ userEnteredValue: '0.15' }] },
        format: {
          backgroundColor: { red: 1, green: 0.718, blue: 0.302 },
          textFormat: { bold: true }
        }
      }
    }, index: 0 }},
    { addConditionalFormatRule: { rule: {
      ranges: [{ sheetId: 3, startRowIndex: 1, endRowIndex: 15, startColumnIndex: 6, endColumnIndex: 7 }],
      booleanRule: {
        condition: { type: 'NUMBER_LESS', values: [{ userEnteredValue: '12' }] },
        format: {
          backgroundColor: { red: 0.698, green: 0.922, blue: 0.949 },
          textFormat: { bold: true }
        }
      }
    }, index: 0 }}
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 6 — Charts (bar + donut)
// ─────────────────────────────────────────────────────────────────────────────
const CHARTS_PAYLOAD = {
  requests: [
    { addChart: { chart: {
      spec: {
        title: '',
        titleTextFormat: { fontFamily: 'Arial', fontSize: 12, bold: true, foregroundColor: { red: 0.051, green: 0.106, blue: 0.165 } },
        basicChart: {
          chartType: 'BAR', legendPosition: 'NO_LEGEND',
          axis: [
            { position: 'BOTTOM_AXIS', title: '' },
            { position: 'LEFT_AXIS',   title: '' }
          ],
          domains: [{ domain: { sourceRange: { sources: [
            { sheetId: 0, startRowIndex: 7, endRowIndex: 12, startColumnIndex: 0, endColumnIndex: 1 }
          ]}}}],
          series: [{
            series: { sourceRange: { sources: [
              { sheetId: 0, startRowIndex: 7, endRowIndex: 12, startColumnIndex: 1, endColumnIndex: 2 }
            ]}},
            targetAxis: 'BOTTOM_AXIS',
            colorStyle: { rgbColor: { red: 0.0, green: 0.592, blue: 0.655 } }
          }],
          headerCount: 0
        },
        backgroundColorStyle: { rgbColor: { red: 1, green: 1, blue: 1 } }
      },
      position: { overlayPosition: {
        anchorCell: { sheetId: 0, rowIndex: 31, columnIndex: 0 },
        offsetXPixels: 0, offsetYPixels: 10, widthPixels: 480, heightPixels: 260
      }}
    }}},
    { addChart: { chart: {
      spec: {
        title: '',
        titleTextFormat: { fontFamily: 'Arial', fontSize: 12, bold: true, foregroundColor: { red: 0.051, green: 0.106, blue: 0.165 } },
        pieChart: {
          legendPosition: 'RIGHT_LEGEND', pieHole: 0.5,
          domain: { sourceRange: { sources: [
            { sheetId: 0, startRowIndex: 7, endRowIndex: 10, startColumnIndex: 6, endColumnIndex: 7 }
          ]}},
          series: { sourceRange: { sources: [
            { sheetId: 0, startRowIndex: 7, endRowIndex: 10, startColumnIndex: 7, endColumnIndex: 8 }
          ]}}
        },
        backgroundColorStyle: { rgbColor: { red: 1, green: 1, blue: 1 } }
      },
      position: { overlayPosition: {
        anchorCell: { sheetId: 0, rowIndex: 31, columnIndex: 6 },
        offsetXPixels: 0, offsetYPixels: 10, widthPixels: 380, heightPixels: 260
      }}
    }}}
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 7 — Finalize (hide Reference tab)
// ─────────────────────────────────────────────────────────────────────────────
const FINALIZE_PAYLOAD = {
  requests: [
    { updateSheetProperties: {
      properties: { sheetId: 5, hidden: true },
      fields: 'hidden'
    }}
  ]
};
