-- Hot-path indexes (all IF NOT EXISTS / safe additive)

-- financial_transactions
CREATE INDEX IF NOT EXISTS idx_fin_tx_user_date ON public.financial_transactions (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_fin_tx_space ON public.financial_transactions (space_id) WHERE space_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fin_tx_user_category ON public.financial_transactions (user_id, category);

-- financial_accounts
CREATE INDEX IF NOT EXISTS idx_fin_acc_user_group ON public.financial_accounts (user_id, group_name);
CREATE INDEX IF NOT EXISTS idx_fin_acc_space ON public.financial_accounts (space_id) WHERE space_id IS NOT NULL;

-- actual_expenses
CREATE INDEX IF NOT EXISTS idx_actual_exp_user_posted ON public.actual_expenses (user_id, posted_on DESC);
CREATE INDEX IF NOT EXISTS idx_actual_exp_user_category ON public.actual_expenses (user_id, category);

-- calendar_events
CREATE INDEX IF NOT EXISTS idx_cal_user_start ON public.calendar_events (user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_cal_user_deleted ON public.calendar_events (user_id) WHERE deleted_at IS NULL;

-- echo_entries
CREATE INDEX IF NOT EXISTS idx_echo_user_date ON public.echo_entries (user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_echo_task ON public.echo_entries (task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_echo_project ON public.echo_entries (project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_echo_goal ON public.echo_entries (goal_id) WHERE goal_id IS NOT NULL;

-- goals
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON public.goals (user_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_space ON public.goals (space_id) WHERE space_id IS NOT NULL;

-- direct_messages
CREATE INDEX IF NOT EXISTS idx_dm_recipient_unread ON public.direct_messages (recipient_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dm_pair ON public.direct_messages (sender_id, recipient_id, created_at DESC);

-- impact_messages
CREATE INDEX IF NOT EXISTS idx_impact_user_unread ON public.impact_messages (user_id, is_read, score DESC) WHERE is_archived = false;

-- chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_channel_created ON public.chat_messages (channel_id, created_at DESC);

-- health_metrics
CREATE INDEX IF NOT EXISTS idx_health_user_date ON public.health_metrics (user_id, metric_date DESC);

-- bank_receipts
CREATE INDEX IF NOT EXISTS idx_bank_receipts_user_posted ON public.bank_receipts (user_id, posted_on DESC);
CREATE INDEX IF NOT EXISTS idx_bank_receipts_match ON public.bank_receipts (matched_invoice_id) WHERE matched_invoice_id IS NOT NULL;

-- emails
CREATE INDEX IF NOT EXISTS idx_emails_user_status ON public.emails (user_id, status);

-- contacts
CREATE INDEX IF NOT EXISTS idx_contacts_user ON public.contacts (user_id);

-- ai_search_history
CREATE INDEX IF NOT EXISTS idx_ai_search_user_created ON public.ai_search_history (user_id, created_at DESC);
