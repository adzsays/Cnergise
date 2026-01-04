import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UnifiedMetadata {
  id: string;
  user_id: string;
  space_id: string | null;
  source_type: string;
  source_id: string;
  source_table: string;
  title: string;
  description: string | null;
  keywords: string[] | null;
  participants: string[] | null;
  amount: number | null;
  date_occurred: string | null;
  ai_summary: string | null;
  is_notification: boolean;
  notification_priority: string;
  notification_read: boolean;
  notification_read_at: string | null;
  external_url: string | null;
  app_type: string | null;
  created_at: string;
  updated_at: string;
}

export function useUnifiedMetadata(sourceType?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: metadata, isLoading, refetch } = useQuery({
    queryKey: ['unified-metadata', sourceType],
    queryFn: async () => {
      let query = supabase
        .from('unified_metadata')
        .select('*')
        .order('date_occurred', { ascending: false });

      if (sourceType) {
        query = query.eq('source_type', sourceType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UnifiedMetadata[];
    },
  });

  const { data: notifications, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_metadata')
        .select('*')
        .eq('is_notification', true)
        .eq('notification_read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as UnifiedMetadata[];
    },
  });

  const addMetadata = useMutation({
    mutationFn: async (item: Omit<UnifiedMetadata, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('unified_metadata')
        .insert({ ...item, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-metadata'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('unified_metadata')
        .update({ 
          notification_read: true,
          notification_read_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('unified_metadata')
        .update({ 
          notification_read: true,
          notification_read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_notification', true)
        .eq('notification_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "All notifications marked as read",
      });
    },
  });

  return {
    metadata,
    notifications,
    isLoading,
    addMetadata,
    markAsRead,
    markAllAsRead,
    refetch,
    refetchNotifications,
  };
}
