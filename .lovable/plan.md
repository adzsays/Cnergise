# Cash Flow: Investing & Financing Sections + Mortgage / Credit Card Mechanics

## Goal
Restructure the 12-Month Projections so cash flow follows the standard accounting statement: three sections (Operating, Investing, Financing) each with their own subtotal, then a Net Change row, then the rolling cash balance. Mortgages auto-split into interest (Operating expense) + principal (Financing outflow). Credit-card payments are Financing outflows that reduce the card balance; if the statement is not paid in full by the due date, interest accrues automatically as an Operating expense.

## Section assignment rules

| Section | What goes there |
|---|---|
| Operating | All current income/expense items (salary, rent, utilities, groceries, subscriptions, mortgage **interest**, credit-card **accrued interest**) |
| Investing | Recurring contributions to investment/pension accounts, one-off asset purchases/sales (stocks, crypto, property) |
| Financing | Mortgage/loan **principal** repayments, credit-card payments (principal portion), new borrowings (inflow) |

## Database changes

Migration adds a single column to `financial_transactions`:

- `cash_flow_section text not null default 'operating'` with a check constraint allowing `'operating' | 'investing' | 'financing'`.
- Backfill: existing rows stay `'operating'`. Any row whose `category` already references an investment/pension account (matched via `financial_accounts.category ilike '%investment%|%pension%|%crypto%|%broker%'`) is moved to `'investing'`.

No other schema change — mortgage rate schedule + credit card account already exist.

## Synthetic projections (in `FinancialDataContext.tsx`)

Replace the current single synthetic loan line with **two lines per loan** derived from the existing `projectAmortization` output:

1. `loan-interest-<id>` — type `expense`, `cash_flow_section = 'operating'`, category `Loan Interest`, monthly = sum of `m.interest` over the 12-month window.
2. `loan-principal-<id>` — type `expense`, `cash_flow_section = 'financing'`, category `Loan Principal`, monthly = sum of `m.principal`. This line is also what reduces the linked liability balance month-over-month in projections.

For credit cards (any `financial_accounts` row with category matching `%credit%` and `credit_limit` set):

- If the user has entered a manual recurring "Card Payment" transaction (linked to the card), it is auto-classified `financing`. Its principal effect already reduces the card balance via existing `applyAccountDelta`.
- New synthetic line `cc-interest-<id>` (Operating expense): for each future month, if the projected balance on the `payment_day` is > 0 **and** no full-balance payment is scheduled by that day, accrue `balance × APR / 12`. APR comes from `interest_rate` on the account (defaults to 0 → no accrual).

The amortization util `projectAmortization` already returns `{interest, principal, payment, index}` per month — we just sum each component instead of `payment`.

## Context API additions

- `addTransaction` and `updateTransactionCategory` accept an optional `cash_flow_section`. When omitted, the section is inferred from the linked account: investment/pension → `investing`, liability → `financing`, else `operating`.
- New helper `getSectionForTransaction(t)` exported for UI use.

## UI changes (`src/components/finances/TableView.tsx`)

- Group transactions by `cash_flow_section` first, then by category within each section.
- Render three collapsible section blocks in fixed order: **Operating Activities**, **Investing Activities**, **Financing Activities**. Each section header row shows that section's monthly subtotal across all 12 columns.
- Add a bold **Net Change in Cash** row (Operating + Investing + Financing) before the existing Rolling Cash Flow card.
- The "Add Item" dialog gets a new **Section** select (Operating / Investing / Financing) defaulting to Operating but auto-switching when an investment or liability account is picked as the linked account.
- Expand/Collapse All applies to section headers and category headers together.

## Files to change

```text
supabase/migrations/<new>          -- add cash_flow_section column + backfill
src/contexts/FinancialDataContext.tsx
  - extend FinancialTransaction interface with cash_flow_section
  - update addTransaction / updateTransactionCategory signatures
  - replace single loan synthetic with interest + principal split
  - add credit-card interest-accrual synthetic
src/components/finances/TableView.tsx
  - restructure grouping & rendering into three sections
  - add Net Change row
  - add Section selector in Add dialog
src/lib/validations.ts
  - allow cash_flow_section in transactionSchema
```

## Out of scope (call out, do not build)

- Editing the per-month amortization schedule by hand (it stays auto-derived from rate schedule).
- Credit-card minimum-payment auto-generation — user still creates the payment transaction; we only accrue interest if no full payment is made.
- Reordering historical Trial Balance / Balance Sheet views — those remain accounting-side and unaffected.
