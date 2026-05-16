## Goals

1. **Finance** — Replace 6-tab nav with a pinned Dashboard + view dropdown. Dashboard becomes the Snoop-style command centre.
2. **Health** — Goal-linked weight loss, food/nutrition logging, full marker set (body comp, activity, sleep, vitals, mood).
3. **Cross-app flow** — Stop siloing. Goals on `/plan` drive Health targets; Health and Finance both surface on `/home`; one transaction = one source of truth (no duplicate UI lists).

---

## 1. Finance refactor

### Navigation
- `src/pages/Finances.tsx`: keep **Dashboard** as the always-visible top section. Below it, a single `Select` ("View: Forecast / Inputs / Transactions / Accounting / Invoices") swaps the secondary view. Persist choice in URL `?view=`.
- Remove the horizontal tab strip.

### Snoop-style Dashboard (`FinanceDashboardView.tsx`)
Add four new modules built from existing `financial_transactions` + `actual_expenses` + `cashflow_lines` (no schema change needed for most):

1. **Cash flow graph (hero)** — 90-day rolling line: balance, income, spend. Reuses `SleekChart`.
2. **Safe-to-spend** — `current balance − upcoming recurring (cashflow_lines until next payday) − scheduled bills`. Big number + breakdown chip row.
3. **Spending by merchant/category** — donut + top-5 merchants this month vs last (group `actual_expenses` by normalised `merchant`/`category`).
4. **Recurring subscriptions** — detect any merchant with ≥3 charges in last 90d at similar amount; list with monthly cost + "next charge" date + cancel-reminder action.
5. **Smart insights strip** — auto-generated nudges (e.g. "Dining +32% vs last month", "Duplicate charge: Amazon £24.99 twice on 12 May"). Pure client-side rules over `actual_expenses`.

### What stays untouched
Inputs (account opening balances), Transactions tab (the sortable split UI from last iteration), Accounting, Invoices — only reachable via the new dropdown.

---

## 2. Health upgrade

### Schema (one migration)
New tables, RLS = owner-only:
- `health_goals` (user_id, goal_type enum: weight_loss/weight_gain/maintain/strength/endurance/custom, target_value, target_unit, target_date, baseline_value, linked_goal_id → goals)
- `nutrition_log` (user_id, logged_at, meal_type, food_name, calories, protein_g, carbs_g, fat_g, water_ml, source)
- `health_vitals` (user_id, recorded_at, vital_type enum: bp_sys/bp_dia/glucose/cholesterol_ldl/hdl/triglycerides/resting_hr/hrv/spo2/body_temp, value, unit, notes)
- `mood_log` (user_id, logged_at, mood_score 1-10, stress_score 1-10, energy_score 1-10, notes)
- Extend `health_metrics` with `weight_kg`, `body_fat_pct`, `muscle_mass_kg` if missing.

### UI (`src/pages/Health.tsx` rebuild)
Pinned **Today** dashboard + view dropdown (Goals / Food / Activity & Sleep / Vitals & Labs / Mood). Today shows:
- Active goal progress ring (e.g. "−2.4 kg / −5 kg")
- Calories in vs out, macro split bar
- Steps, active minutes, sleep last night, resting HR
- Latest BP/glucose if entered in last 7d
- Mood/stress quick check-in

New components: `GoalsCard`, `FoodLogQuickAdd` (search common foods + manual macros), `VitalsLogger`, `MoodCheckin`. Reuse `SleekChart` for trends.

Goal linkage: a `health_goals` row optionally points at a `goals` row on `/plan`, so the same "Lose 5 kg" goal shows progress in both places.

---

## 3. Cross-app seamless flow

### De-duplicate surfaces
- `/home` (Today): widgets read from the **same hooks** as their source pages — no parallel fetches. Add a `useFinanceSummary()` hook (balance, safe-to-spend, top insight) and `useHealthToday()` hook used by both `/home` and the respective pages.
- Remove the old hard-coded `FinanceSection.tsx` mock data; point it at real hooks or delete in favour of the new dashboard widget.

### Contextual links
- Goal card on `/plan` of type "health" → click jumps to `/health?goal=<id>` highlighting that goal.
- Finance insight "Dining +32%" → click jumps to `/finances?view=transactions&category=dining`.
- Health "Calories over budget today" → click jumps to `/finances?view=transactions&category=groceries` (only if a grocery txn ran today). Optional, keep simple.

### Unified metadata
Log new health/finance significant events to `unified_metadata` so the existing notification center + AI search pick them up automatically (e.g. "Recurring subscription detected", "Weight goal milestone hit").

---

## Technical notes

- All charts via `SleekChart` (mobile-first rule).
- Currency formatting via `useUserCurrency` (GBP default).
- Recurring detection is pure client-side over already-fetched `actual_expenses` — no edge function needed v1.
- Safe-to-spend computed from `cashflow_lines` (already fetched in `FinancialDataContext`).
- No changes to auth, RLS templates follow existing pattern (`auth.uid() = user_id`).
- Tab strip removal won't break deep links: keep `?tab=` → `?view=` redirect in `Finances.tsx`.

### Sequence
1. DB migration for Health tables.
2. Finance: nav refactor + Dashboard modules.
3. Health: rebuild page + new components.
4. Cross-app: shared hooks, dedupe `/home`, contextual links.

### Out of scope (this PR)
- Bank-feed-powered subscription auto-cancel (just a reminder).
- Wearable integrations beyond what Health Source Hub already does.
- Refund automation — flag only.