-- Create error_logs table for tracking application errors
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  error_message text NOT NULL,
  error_stack text,
  error_context jsonb DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  component text,
  url text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create performance_metrics table for tracking database/API performance
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  operation_type text NOT NULL CHECK (operation_type IN ('query', 'mutation', 'api_call')),
  operation_name text NOT NULL,
  table_name text,
  execution_time_ms integer NOT NULL,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create usage_stats table for tracking database usage and costs
CREATE TABLE public.usage_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  date date NOT NULL DEFAULT CURRENT_DATE,
  operation_type text NOT NULL,
  operation_count integer NOT NULL DEFAULT 1,
  total_time_ms integer NOT NULL DEFAULT 0,
  estimated_cost_units numeric NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, operation_type)
);

-- Enable RLS on all tables
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

-- Error logs policies
CREATE POLICY "Users can view their own error logs" 
ON public.error_logs FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create error logs" 
ON public.error_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all error logs" 
ON public.error_logs FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own error logs" 
ON public.error_logs FOR DELETE 
USING (auth.uid() = user_id);

-- Performance metrics policies
CREATE POLICY "Users can view their own performance metrics" 
ON public.performance_metrics FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create performance metrics" 
ON public.performance_metrics FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all performance metrics" 
ON public.performance_metrics FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Usage stats policies
CREATE POLICY "Users can view their own usage stats" 
ON public.usage_stats FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create usage stats" 
ON public.usage_stats FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own usage stats" 
ON public.usage_stats FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage stats" 
ON public.usage_stats FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for usage_stats updated_at
CREATE TRIGGER update_usage_stats_updated_at
BEFORE UPDATE ON public.usage_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_error_logs_user_created ON public.error_logs(user_id, created_at DESC);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity, created_at DESC);
CREATE INDEX idx_performance_metrics_user_created ON public.performance_metrics(user_id, created_at DESC);
CREATE INDEX idx_performance_metrics_operation ON public.performance_metrics(operation_type, created_at DESC);
CREATE INDEX idx_usage_stats_user_date ON public.usage_stats(user_id, date DESC);