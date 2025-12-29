import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type UserIntegration = {
  id: string;
  user_id: string;
  // Messaging
  whatsapp_phone_number_id: string | null;
  whatsapp_access_token: string | null;
  telegram_bot_token: string | null;
  // Broker
  broker_name: string | null;
  broker_api_key: string | null;
  broker_api_secret: string | null;
  broker_account_id: string | null;
  // Email
  email_provider: string | null;
  email_smtp_host: string | null;
  email_smtp_port: number | null;
  email_smtp_user: string | null;
  email_smtp_password: string | null;
  email_imap_host: string | null;
  email_imap_port: number | null;
  email_oauth_token: string | null;
  // Calendar
  calendar_provider: string | null;
  calendar_oauth_token: string | null;
  calendar_refresh_token: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
};

export type IntegrationUpdates = Partial<Omit<UserIntegration, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export function useIntegrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['user-integrations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserIntegration | null;
    },
  });

  const saveIntegrations = useMutation({
    mutationFn: async (updates: IntegrationUpdates) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if record exists
      const { data: existing } = await supabase
        .from('user_integrations')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('user_integrations')
          .update(updates)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('user_integrations')
          .insert({ ...updates, user_id: user.id })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-integrations'] });
      toast({ title: "Integration settings saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    },
  });

  return {
    integrations,
    isLoading,
    saveIntegrations,
  };
}
