-- Phase 1 perf cleanup: drop duplicate indexes on hot tables (small storage + write-perf win).
DROP INDEX IF EXISTS public.idx_actual_exp_user_posted;          -- dup of idx_actual_expenses_user_date
DROP INDEX IF EXISTS public.idx_cal_user_start;                  -- dup of idx_calendar_events_user_start
DROP INDEX IF EXISTS public.idx_health_user_date;                -- dup of idx_health_metrics_user_date
DROP INDEX IF EXISTS public.idx_financial_transactions_user_id;  -- redundant (covered by idx_fin_tx_user_date)
DROP INDEX IF EXISTS public.idx_financial_accounts_user_id;      -- redundant (covered by idx_fin_acc_user_group)
DROP INDEX IF EXISTS public.idx_financial_transactions_space_id; -- dup of partial idx_fin_tx_space
DROP INDEX IF EXISTS public.idx_financial_accounts_space_id;     -- dup of partial idx_fin_acc_space
DROP INDEX IF EXISTS public.idx_calendar_events_space_id;        -- redundant (space_id rarely filtered alone)