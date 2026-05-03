import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface NotificationPreferences {
  user_id: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  web_push_enabled: boolean;
  native_push_enabled: boolean;
  default_lead_minutes: number;
  task_lead_minutes: number;
  payment_lead_minutes: number;
  event_lead_minutes: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

const defaults: Omit<NotificationPreferences, "user_id"> = {
  in_app_enabled: true,
  email_enabled: true,
  web_push_enabled: true,
  native_push_enabled: true,
  default_lead_minutes: 15,
  task_lead_minutes: 1440,
  payment_lead_minutes: 1440,
  event_lead_minutes: 15,
  quiet_hours_start: null,
  quiet_hours_end: null,
};

export function useNotificationPreferences() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) return data as NotificationPreferences;
      // create defaults
      const { data: created } = await supabase
        .from("notification_preferences")
        .insert({ user_id: user.id, ...defaults })
        .select()
        .single();
      return created as NotificationPreferences;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<NotificationPreferences>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not authenticated");
      const { error } = await supabase
        .from("notification_preferences")
        .update(patch)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast({ title: "Preferences saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return { ...query, update };
}
