import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ErrorLog = {
  id: string;
  user_id: string | null;
  error_message: string;
  error_stack: string | null;
  error_context: Record<string, unknown>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  component: string | null;
  url: string | null;
  created_at: string;
};

export type PerformanceMetric = {
  id: string;
  user_id: string | null;
  operation_type: 'query' | 'mutation' | 'api_call';
  operation_name: string;
  table_name: string | null;
  execution_time_ms: number;
  success: boolean;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type UsageStat = {
  id: string;
  user_id: string | null;
  date: string;
  operation_type: string;
  operation_count: number;
  total_time_ms: number;
  estimated_cost_units: number;
  created_at: string;
  updated_at: string;
};

// Cost estimation factors (simplified model)
const COST_FACTORS = {
  query: 0.001,      // per query
  mutation: 0.002,   // per mutation (insert/update/delete)
  api_call: 0.005,   // per API call
};

export function useErrorLogging() {
  const queryClient = useQueryClient();

  const logError = useMutation({
    mutationFn: async (error: {
      error_message: string;
      error_stack?: string;
      error_context?: Record<string, unknown>;
      severity?: 'info' | 'warning' | 'error' | 'critical';
      component?: string;
      url?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error: insertError } = await supabase
        .from('error_logs')
        .insert([{
          user_id: user?.id || null,
          error_message: error.error_message,
          error_stack: error.error_stack || null,
          error_context: JSON.parse(JSON.stringify(error.error_context || {})),
          severity: error.severity || 'error',
          component: error.component || null,
          url: error.url || window.location.href,
        }])
        .select()
        .single();
      
      if (insertError) {
        console.error('Failed to log error:', insertError);
        throw insertError;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
    },
  });

  const { data: errorLogs = [], isLoading: isLoadingErrors } = useQuery({
    queryKey: ['error-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as ErrorLog[];
    },
  });

  const deleteErrorLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('error_logs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
    },
  });

  return {
    logError,
    errorLogs,
    isLoadingErrors,
    deleteErrorLog,
  };
}

export function usePerformanceMonitoring() {
  const queryClient = useQueryClient();

  const trackPerformance = useCallback(async (metric: {
    operation_type: 'query' | 'mutation' | 'api_call';
    operation_name: string;
    table_name?: string;
    execution_time_ms: number;
    success?: boolean;
    error_message?: string;
    metadata?: Record<string, unknown>;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Log performance metric
      await supabase
        .from('performance_metrics')
        .insert([{
          user_id: user?.id || null,
          operation_type: metric.operation_type,
          operation_name: metric.operation_name,
          table_name: metric.table_name || null,
          execution_time_ms: metric.execution_time_ms,
          success: metric.success !== false,
          error_message: metric.error_message || null,
          metadata: JSON.parse(JSON.stringify(metric.metadata || {})),
        }]);

      // Update daily usage stats
      const costUnits = COST_FACTORS[metric.operation_type] || 0;
      
      const { data: existing } = await supabase
        .from('usage_stats')
        .select('*')
        .eq('user_id', user?.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .eq('operation_type', metric.operation_type)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('usage_stats')
          .update({
            operation_count: existing.operation_count + 1,
            total_time_ms: existing.total_time_ms + metric.execution_time_ms,
            estimated_cost_units: Number(existing.estimated_cost_units) + costUnits,
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('usage_stats')
          .insert({
            user_id: user?.id || null,
            date: new Date().toISOString().split('T')[0],
            operation_type: metric.operation_type,
            operation_count: 1,
            total_time_ms: metric.execution_time_ms,
            estimated_cost_units: costUnits,
          });
      }
    } catch (error) {
      console.error('Failed to track performance:', error);
    }
  }, []);

  const { data: performanceMetrics = [], isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as PerformanceMetric[];
    },
  });

  const { data: usageStats = [], isLoading: isLoadingUsage } = useQuery({
    queryKey: ['usage-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usage_stats')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data as UsageStat[];
    },
  });

  return {
    trackPerformance,
    performanceMetrics,
    usageStats,
    isLoadingMetrics,
    isLoadingUsage,
  };
}

// Helper function to wrap async operations with performance tracking
export function withPerformanceTracking<T>(
  trackFn: (metric: Parameters<ReturnType<typeof usePerformanceMonitoring>['trackPerformance']>[0]) => Promise<void>,
  operationType: 'query' | 'mutation' | 'api_call',
  operationName: string,
  tableName?: string
) {
  return async (asyncFn: () => Promise<T>): Promise<T> => {
    const startTime = performance.now();
    let success = true;
    let errorMessage: string | undefined;

    try {
      const result = await asyncFn();
      return result;
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      const executionTime = Math.round(performance.now() - startTime);
      trackFn({
        operation_type: operationType,
        operation_name: operationName,
        table_name: tableName,
        execution_time_ms: executionTime,
        success,
        error_message: errorMessage,
      });
    }
  };
}
