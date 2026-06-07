# Verify Inputs/Balances math + add Excel exports

## Part 1 — Calculation audit (read-only review)

I traced the core math in `src/contexts/FinancialDataContext.tsx` and the two views. Findings:

**Correct:**
- Balance sheet totals (`balanceSheet` memo, lines 293–363): assets = banks + pensions + investments + home + car; liability balances are stored positive in DB and flipped negative in `toSource`, so `totalLiabilities = |sum(liabilities)|` is right.
- `availableCash` correctly limited to bank-classified accounts; pension/investment excluded.
- `availableCredit = Σ max(0, credit_limit − |balance|)` is correct for credit cards/overdrafts with a limit set.
- Account-delta on transaction add/edit (lines 386–420) flips sign correctly for liability accounts (expense on a liability reduces debt).
- Loan/mortgage projection in the transactions memo correctly splits payments into Interest (Operating expense) + Principal (Financing liability paydown) via `projectAmortization`.
- Per-transaction 12-month projections honour `start_date` / `end_date` bounds (lines 200–214).

**Issues found (will fix in this pass, scoped to math + the two exports):**
1. **Credit-card paydown missing from Financing** (same root cause as the prior MBNA bug): the credit-card branch only emits a synthetic `cc-interest-*` Operating expense, never a `cc-principal-*` Financing line. So when a user pays down a card, the principal portion is invisible to the dashboard's Financing bucket and to any export grouped by cash-flow section. Fix: mirror the loan logic — derive monthly principal as `max(0, scheduledPayment − accruedInterest)` (where `scheduledPayment` is the manual MBNA payment row if present, else `a.monthly_payment`), and emit a second synthetic row with `type:'liability'`, `cash_flow_section:'financing'`, inheriting cost centre. Hide the manual payment row to avoid double-count.
2. **Liability-on-liability income edge case**: `applyAccountDelta` handles `income`/`expense` types but the transactions memo also generates synthetic `type:'liability'` rows. These should not feed `applyAccountDelta` (they don't — they're synthetic and unsaved), but the docstring is misleading. Will add a one-line comment to clarify; no logic change.
3. **`availableCredit` ignores overdraft limits when `credit_limit` is null on an Overdraft row.** Will leave as-is — requires UI to capture overdraft limit, which is out of scope for this request. Flag only.

## Part 2 — Excel exports

`xlsx` (SheetJS) is already in `package.json`. Two new buttons, two separate workbooks.

### A. "Export Inputs" button (in `InlineTransactionsTable` toolbar)
Generates `cnergise-cash-flow-inputs-YYYY-MM-DD.xlsx` with three sheets:

1. **Cash Flow Items** — every row in `transactions` (real + synthetic loan/card splits), columns:
   `Type | Cash Flow Section | Category | Subcategory | Cost Centre | Group | Frequency | Date (day) | Start Date | End Date | Amount | Monthly | Daily | Annualised | M1…M12 (using monthLabels)`
2. **Monthly Summary** — pivot grouped by `Cash Flow Section → Type` with M1…M12 + Total.
3. **Cost Centre Summary** — pivot grouped by `Cost Centre → Type` with Monthly + Annualised.

All numeric cells written as numbers (not strings) with GBP number format `"£#,##0.00;(£#,##0.00);-"`; column widths auto-sized.

### B. "Export Balances" button (in `BalancesView` toolbar, next to Import)
Generates `cnergise-balances-YYYY-MM-DD.xlsx` with three sheets:

1. **Assets** — every asset account: `Name | Category | Bucket (Bank/Pension/Investment) | Group | Currency | Balance | Cost Centre | Account Code | Opening Balance | Opening Date` + a trailing row for Home & Car physical assets.
2. **Liabilities** — every liability: `Name | Category | Group | Currency | Balance (positive) | Credit Limit | Available Credit | APR % | Monthly Payment | Term (mo) | Loan Start | Payment Day | Cost Centre`.
3. **Summary** — Total Assets, Total Liabilities, Net Worth, Available Cash, Available Credit (matching `balanceSheetSummary`), so the user can sanity-check the audited totals in one place.

### Implementation details
- New helper `src/lib/finance/exportFinance.ts` with two functions: `exportCashFlowInputs(transactions, monthLabels)` and `exportBalances(balanceSheet, balanceSheetSummary)`. Keeps view files clean and testable.
- Buttons use existing `<Button variant="outline" size="sm">` with `Download` lucide icon, placed next to the existing Import button in each view.
- File save via `XLSX.writeFile(wb, filename)` (already how `ImportDialog` reads — same dep).

## Files touched
- `src/contexts/FinancialDataContext.tsx` — credit-card principal synthetic line + cost-centre inheritance (Part 1 fix #1).
- `src/lib/finance/exportFinance.ts` — new export helpers.
- `src/components/finances/InlineTransactionsTable.tsx` — add "Export Inputs" button.
- `src/components/finances/BalancesView.tsx` — add "Export Balances" button.

## Verification after build
1. Set MBNA balance + APR + manual monthly payment, cost centre = "Aditya". Open Smart Dashboard → confirm Financing tile now shows the principal outflow.
2. Click "Export Inputs" on the Inputs tab — open the file, confirm all rows present (including new credit-card principal line), monthly totals match the dashboard.
3. Click "Export Balances" on the Balances tab — confirm Assets sheet sum + Liabilities sheet sum match the on-screen Net Worth.
