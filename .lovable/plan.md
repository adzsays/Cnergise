## Goal
Enable classification of bank transactions against budgeted cash flow items using a learned rule system, so reconciliation becomes automatic and AI is only invoked for truly new transactions.

## Concept
1. **Account → Cost Centre mapping**: Each bank account has a default cost centre. New transactions imported from that account inherit it.
2. **Transaction → Cash Flow mapping (rules)**: A persistent rules table maps a transaction "fingerprint" (merchant/description pattern + optional amount range + account) to a specific cash flow line.
3. **Classification flow** (per transaction):
   - First check existing rules → instant assignment.
   - If no rule matches and external context helps, call AI (Lovable AI / Gemini) once with transaction details + optional Perplexity web lookup → returns suggested cash flow line + confidence.
   - Store suggestion as `ai_mapped_cashflow_id` with `mapping_source = 'ai' | 'rule' | 'manual'`.
4. **User correction**: User changes the mapping inline on the transaction row. Dialog asks: "Apply to all similar transactions (past + future)?" If yes → upsert rule + bulk update matching rows.
5. **Future imports**: Rule engine runs first; AI only for unmatched residue.

## Database changes
- Add `default_cost_centre` to `financial_accounts` (already partially supported via account.cost_centre).
- Add `mapped_cashflow_id uuid`, `mapping_source text` ('rule'|'ai'|'manual'|null), `mapping_confidence numeric` to `financial_transactions`.
- New table `cashflow_mapping_rules`:
  - `user_id, match_type` ('description_contains'|'description_exact'|'merchant'),
  - `match_value text` (normalized),
  - `account_id uuid` (optional scope),
  - `min_amount numeric` (optional), `max_amount numeric` (optional),
  - `cashflow_id uuid` → `financial_transactions.id` (the budgeted line),
  - `cost_centre text`,
  - `priority int`,
  - `times_applied int`, `last_applied_at timestamptz`.
- Index on `(user_id, match_type, match_value)`.
- RLS: user owns their rules.

## Edge function: `classify-transactions`
Input: array of transaction IDs (or "all unclassified for user").
Steps per txn:
1. Apply rules (SQL lookup, ranked by priority + specificity).
2. For unmatched, batch-call Lovable AI (`google/gemini-3-flash-preview`) with the user's existing cash flow lines as the candidate list + transaction description/amount/merchant. Use tool calling for structured output: `{ cashflow_id, confidence, reasoning }`.
3. Optional Perplexity enrichment for unknown merchants (only when AI confidence < 0.5).
4. Update transactions with mapping fields.

## Frontend changes
- **`InlineTransactionsTable`** (bank transactions view): add column **"Budget Line"** showing the mapped cash flow line as a Select. Badge shows source (Rule/AI/Manual). On change → modal:
  - "Apply to similar transactions?" with preview count.
  - Yes → call edge function `apply-mapping-rule` (creates rule + bulk updates).
  - No → single update, marks `mapping_source='manual'`.
- **`AccountDialog`**: ensure `cost_centre` field is prominent (already exists) — label as "Default Cost Centre" + tooltip "Applied to new transactions from this account".
- **New button "Auto-classify"** on transactions tab → runs `classify-transactions` for all unmapped.
- **Rules manager** (small dialog accessible from transactions toolbar): list rules, edit/delete.
- **`FinanceDashboardView` / `CashFlowComparisonView`**: switch comparison logic to group actuals by `mapped_cashflow_id` instead of fuzzy AI matching at compare-time. Falls back to existing AI compare for unmapped.

## Files to touch
- `supabase/migrations/...` — schema + RLS.
- `supabase/functions/classify-transactions/index.ts` — new.
- `supabase/functions/apply-mapping-rule/index.ts` — new (creates rule, bulk update).
- `src/components/finances/InlineTransactionsTable.tsx` — Budget Line column + bulk dialog.
- `src/components/finances/MappingRulesDialog.tsx` — new manager.
- `src/components/finances/CashFlowComparisonView.tsx` — prefer mapped_cashflow_id.
- `src/contexts/FinancialDataContext.tsx` — expose mapping helpers.

## Notes
- Rule matching is case-insensitive, trimmed, normalized (strip card-suffix digits, dates).
- Cash flow lines are the income/expense rows already in `financial_transactions` where they represent the budget — use existing `frequency`/`monthly` semantics. If you need a separate flag, we'll add `is_budget boolean default true` for budget rows vs imported actuals (actuals will have `mapped_cashflow_id` set, budget rows won't).
