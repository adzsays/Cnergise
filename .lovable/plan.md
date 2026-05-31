## Finance redesign — phased plan

This is a significant restructure. To avoid breaking working flows, I'll ship it in 4 phases. You can approve all or stop after any phase.

---

### Phase 1 — IA + Navigation (UI only, no data risk)

Restructure `src/pages/Finances.tsx` into **5 workspaces**: Home, Transactions, Cash Flow, Accounting, Billing.

- Replace the icon rail with a **horizontal tab strip** (desktop) and **bottom tab bar** (mobile), each with icon + label + badge slot.
- Move existing views under the new tabs (no logic changes yet):
  - **Home** → new `FinanceHomeView` (built in Phase 2)
  - **Transactions** → `ActualExpensesView` (with enrichment banner slot)
  - **Cash Flow** → extract cash-flow sections from `FinanceDashboardView` into `CashFlowView`
  - **Accounting** → `AccountingGroupsView` + Trial Balance + Journal entries
  - **Billing** → existing `InvoicingSection`, customers/services/entities moved into drawers (not tabs)
- Drop the Forecast/legacy `?tab=` redirects already in place.
- Badges wired to placeholder `0`; real counts in Phase 2.

### Phase 2 — Finance Home + summary view

- DB: create `finance_summary_current` as a **view** over `bank_accounts`, `credit_cards`, `holdings`, `financial_transactions`, `invoices`, `transaction_enrichment_queue`. Exposes: total_cash, total_credit_available, total_invested, net_worth, mtd_income, mtd_expenses, net_mtd, overdue_invoices_count/total, unenriched_transactions_count, last_sync_at. RLS via underlying tables; grants to authenticated.
- Build `FinanceHomeView`:
  - Balances strip (cash / credit available / invested / net worth)
  - Net worth 30-day sparkline (reuse `SleekChart`)
  - This-week: expected in / out / net (from recurring + scheduled)
  - Bills & invoices due next 7 days
  - Top 3 `SnoopInsights` inline cards
  - Credit score chip
  - Quick actions row: Add transaction, Import CSV, Create invoice, Sync accounts
- Wire navigation badges to summary view (unenriched count, overdue invoices).

### Phase 3 — Enrichment queue + cost centres in DB

- DB migration:
  - `cost_centres` table (user_id, space_id, name, color) — migrate from localStorage on first load.
  - `transaction_enrichment_queue` table (transaction_id, status, proposal_json, proposed_at, reviewed_at, applied_at) with RLS + grants.
  - Indexes on `financial_transactions(user_id,date)`, `(user_id,cost_centre)`, `(user_id,cash_flow_section)`, `(user_id,category)`, `(user_id,created_at DESC)`; `bookings(user_id,created_at DESC)`; `journal_entries(journal_entry_id)`.
- Update `enrich-transactions` edge function to write proposals into the queue instead of mutating directly.
- Transactions tab: inline review banner ("N transactions need review") with bulk-approve / per-item accept-reject. Accepted proposals auto-create mapping rules (existing `apply-mapping-rule` function).
- `FinancialDataContext` reads cost centres from DB; localStorage becomes a one-time migration source.

### Phase 4 — Budgets, NL queries, daily brief

- DB: `budget_rules` table + `budget_actuals` view joining to `financial_transactions`.
- Replace mock data in `BudgetView` with real budget vs actuals.
- New `finance-daily-brief` edge function: cash position, top category, upcoming dues, anomalies, credit signals → feeds AI brief + optional push/email/WhatsApp/Telegram.
- Extend `cross-data-assistant` with finance-aware prompt that reads `finance_summary_current` for NL queries ("how much did I spend on dining last month?").

---

### Out of scope / kept as-is
- All existing edge functions for booking, Finexer, IBKR, etc.
- `FinanceDashboardView` business-day math (already correct).
- Invoice editor, customer/billing/service managers — only their nav placement changes.

### Risks
- Phase 1 is purely presentational and reversible.
- Phases 2–4 add DB objects (additive, no destructive migrations). Existing components keep working until cut over.

---

**Recommendation:** approve Phase 1 first so you can see the new IA, then I'll proceed phase by phase. Reply with "go" for all phases, or "Phase 1 only" / "skip Phase 4" etc.