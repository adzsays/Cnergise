
-- ============ FEATURE CATALOG ============
CREATE TABLE public.app_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'standard', -- 'core' | 'standard' | 'regulated'
  route TEXT,
  icon TEXT,
  is_core BOOLEAN NOT NULL DEFAULT false,
  is_regulated BOOLEAN NOT NULL DEFAULT false,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  disclaimer TEXT,
  compliance_notes TEXT,
  current_terms_version TEXT NOT NULL DEFAULT '1.0.0',
  terms_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view features"
  ON public.app_features FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can insert features"
  ON public.app_features FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update features"
  ON public.app_features FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete features"
  ON public.app_features FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_app_features_updated_at
  BEFORE UPDATE ON public.app_features
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER SUBSCRIPTIONS ============
CREATE TABLE public.user_feature_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval', -- pending_approval | active | suspended | revoked
  accepted_terms_version TEXT,
  accepted_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature_key)
);

CREATE INDEX idx_user_feature_subs_user ON public.user_feature_subscriptions(user_id);
CREATE INDEX idx_user_feature_subs_status ON public.user_feature_subscriptions(status);

ALTER TABLE public.user_feature_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their subscriptions"
  ON public.user_feature_subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create their subscriptions"
  ON public.user_feature_subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their subscriptions"
  ON public.user_feature_subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete subscriptions"
  ON public.user_feature_subscriptions FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_user_feature_subs_updated_at
  BEFORE UPDATE ON public.user_feature_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CONSENT AUDIT LOG (append-only) ============
CREATE TABLE public.consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature_key TEXT,
  action TEXT NOT NULL, -- 'feature_enabled' | 'feature_disabled' | 'terms_accepted' | 'agreement_signed' | 'admin_approved' | 'admin_rejected' | 'admin_revoked'
  terms_version TEXT,
  ip_address TEXT,
  user_agent TEXT,
  signature_hash TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consent_log_user ON public.consent_audit_log(user_id, created_at DESC);
CREATE INDEX idx_consent_log_feature ON public.consent_audit_log(feature_key);

ALTER TABLE public.consent_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own consent log"
  ON public.consent_audit_log FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert their own consent records"
  ON public.consent_audit_log FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- No update/delete policies = immutable

-- ============ APPROVAL QUEUE ============
CREATE TABLE public.feature_approval_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  user_notes TEXT,
  reviewer_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_approval_queue_status ON public.feature_approval_queue(status, created_at DESC);
CREATE INDEX idx_approval_queue_user ON public.feature_approval_queue(user_id);

ALTER TABLE public.feature_approval_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own approval requests"
  ON public.feature_approval_queue FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create their own approval requests"
  ON public.feature_approval_queue FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update approval requests"
  ON public.feature_approval_queue FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_approval_queue_updated_at
  BEFORE UPDATE ON public.feature_approval_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER AGREEMENTS ============
CREATE TABLE public.user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agreement_version TEXT NOT NULL DEFAULT '1.0.0',
  signature_hash TEXT NOT NULL,
  selected_features TEXT[] NOT NULL DEFAULT '{}',
  pdf_url TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_agreements_user ON public.user_agreements(user_id, signed_at DESC);

ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own agreements"
  ON public.user_agreements FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create their own agreements"
  ON public.user_agreements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Append-only: no update/delete

-- ============ STORAGE BUCKET FOR AGREEMENTS ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('agreements', 'agreements', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users view their own agreement files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'agreements' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Users upload their own agreement files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'agreements' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============ HELPER FUNCTION: check feature access ============
CREATE OR REPLACE FUNCTION public.has_feature_access(_user_id UUID, _feature_key TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_features f
    WHERE f.key = _feature_key AND f.is_core = true
  )
  OR EXISTS (
    SELECT 1 FROM public.user_feature_subscriptions s
    WHERE s.user_id = _user_id AND s.feature_key = _feature_key AND s.status = 'active'
  );
$$;

-- ============ SEED FEATURE CATALOG ============
INSERT INTO public.app_features (key, name, description, category, route, icon, is_core, is_regulated, requires_approval, disclaimer, sort_order) VALUES
('tasks', 'Smart Task Management', 'Organize tasks, projects and features.', 'core', '/tasks', 'CheckSquare', true, false, false, NULL, 10),
('goals', 'Goal Tracking', 'Set and track personal and professional goals.', 'core', '/goals', 'Target', true, false, false, NULL, 20),
('calendar', 'Calendar', 'Manage events and schedule.', 'core', '/calendar', 'CalendarDays', true, false, false, NULL, 30),
('projects', 'Projects', 'Project analytics and management.', 'core', '/projects', 'FolderKanban', true, false, false, NULL, 40),
('mail', 'Mail Integration', 'Connect Gmail / Outlook to send and receive email from inside Cnergise.', 'standard', '/mail', 'Mail', false, false, false, 'By enabling Mail you grant Cnergise access to read and send emails on your behalf via OAuth. Your credentials are stored encrypted; you can revoke at any time. Cnergise is not liable for delivery failures from third-party providers.', 50),
('chat', 'Team Chat', 'Slack-like channels and direct messaging.', 'standard', '/chat', 'MessageSquare', false, false, false, 'Messages are stored in our backend and visible only to channel members. Do not share regulated data (PHI, payment cards) in chat.', 60),
('contacts', 'Contacts', 'Manage personal and business contacts.', 'standard', '/contacts', 'Users', false, false, false, 'You are responsible for ensuring you have lawful basis (e.g. consent under GDPR) to store the personal data of any contact you add.', 70),
('teams', 'Teams', 'Create teams and assign tasks.', 'standard', '/teams', 'Users', false, false, false, NULL, 80),
('learning', 'Learning Management', 'Track courses and certifications, sync with Coursera.', 'standard', '/learning', 'GraduationCap', false, false, false, 'Course progress data may be synced from third-party providers (e.g. Coursera) under their respective terms of service.', 90),
('social', 'Social Media & News', 'Aggregate social platform feeds and financial news.', 'standard', '/social', 'Share2', false, false, false, 'News and market data shown is for informational purposes only and is not financial advice.', 100),
('finance', 'Personal Finance', 'Cash flow, budgets, accounting, credit score and bank sync.', 'regulated', '/finances', 'Wallet', false, true, true, 'IMPORTANT: Cnergise is NOT a regulated financial adviser, accountant, or bank. The Finance module is a personal record-keeping tool only. Information shown does NOT constitute financial, tax, accounting, or investment advice. Bank-account sync via Open Banking providers (Finexer) is read-only and subject to FCA/PSD2 regulations. You agree to consult a qualified professional before making financial decisions. By enabling this feature you consent to processing of your financial data and acknowledge these limitations.', 110),
('portfolio', 'Investment Portfolio', 'Track stocks, crypto, commodities; integrate with brokers (e.g. IBKR).', 'regulated', '/portfolio', 'Briefcase', false, true, true, 'IMPORTANT: Cnergise is NOT authorised to provide investment advice or to execute trades. The Portfolio module is for personal tracking only. Market data and any trade-entry tools are for record-keeping; orders shown are simulated unless you connect a regulated broker, in which case the broker''s terms govern. Investments can lose value. Past performance is not indicative of future results. You confirm you understand the risks and that no content here is a personal recommendation. By enabling this feature you accept these risks and acknowledge data is provided "as is".', 120),
('health', 'Health & Wellness', 'Track health metrics, symptoms and wellness goals.', 'regulated', '/health', 'Activity', false, true, true, 'IMPORTANT: Cnergise is NOT a medical device, healthcare provider, or substitute for professional medical advice, diagnosis, or treatment. Health data you enter is sensitive personal data ("special category" under UK GDPR / Article 9 GDPR). By enabling this feature you give your explicit consent for Cnergise to store and process this data solely to provide the Health module to you. Always seek the advice of a qualified medical professional regarding any medical condition. Never disregard professional medical advice because of information from this app. In an emergency call your local emergency services.', 130);
