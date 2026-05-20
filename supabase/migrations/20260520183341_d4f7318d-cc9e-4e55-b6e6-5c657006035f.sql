
-- error_logs: require authenticated, non-null user_id matching auth.uid()
DROP POLICY IF EXISTS "Users create own error logs" ON public.error_logs;
CREATE POLICY "Users create own error logs"
  ON public.error_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- performance_metrics: same hardening
DROP POLICY IF EXISTS "Users can create performance metrics" ON public.performance_metrics;
CREATE POLICY "Users can create performance metrics"
  ON public.performance_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- usage_stats: same hardening
DROP POLICY IF EXISTS "Users can create usage stats" ON public.usage_stats;
CREATE POLICY "Users can create usage stats"
  ON public.usage_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Revoke public-callable SECURITY DEFINER allowlist lookup.
-- The signup trigger runs as table owner so it does not need anon/authenticated EXECUTE.
REVOKE EXECUTE ON FUNCTION public.is_email_allowed(text) FROM anon, authenticated, PUBLIC;
