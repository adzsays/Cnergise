
-- 1. user_roles: restrict SELECT
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins view all roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. error_logs: remove NULL-user_id public access
DROP POLICY IF EXISTS "Users can view their own error logs" ON public.error_logs;
DROP POLICY IF EXISTS "Users can create error logs" ON public.error_logs;
CREATE POLICY "Users view own error logs" ON public.error_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own error logs" ON public.error_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. usage_stats: restrict NULL rows to admins
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='usage_stats') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own usage stats" ON public.usage_stats';
    EXECUTE 'DROP POLICY IF EXISTS "Users view own usage stats" ON public.usage_stats';
    EXECUTE 'CREATE POLICY "Users view own usage stats" ON public.usage_stats FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

-- 4. performance_metrics: restrict NULL rows to admins
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='performance_metrics') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own performance metrics" ON public.performance_metrics';
    EXECUTE 'DROP POLICY IF EXISTS "Users view own performance metrics" ON public.performance_metrics';
    EXECUTE 'CREATE POLICY "Users view own performance metrics" ON public.performance_metrics FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

-- 5. realtime.messages: restrict subscriptions to authenticated users
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can subscribe to realtime" ON realtime.messages;
CREATE POLICY "Authenticated can subscribe to realtime" ON realtime.messages
  FOR SELECT TO authenticated USING (true);
