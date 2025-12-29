import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SystemSetting = {
  id: string;
  key: string;
  value: string | null;
  created_at: string;
  updated_at: string;
};

export function useSystemSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      
      if (error) throw error;
      return data as SystemSetting[];
    },
  });

  const upsertSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      // Try to update first
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('system_settings')
          .update({ value })
          .eq('key', key)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('system_settings')
          .insert({ key, value })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({ title: "Setting saved successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error saving setting", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const getSetting = (key: string): string | null => {
    return settings?.find(s => s.key === key)?.value ?? null;
  };

  return {
    settings,
    isLoading,
    upsertSetting,
    getSetting,
  };
}
