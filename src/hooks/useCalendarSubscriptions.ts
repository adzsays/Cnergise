import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CalendarSubscription = {
  id: string;
  account_id: string | null;
  google_calendar_id: string;
  summary: string | null;
  background_color: string | null;
  foreground_color: string | null;
  enabled: boolean;
  is_primary: boolean;
};

export type CalendarAccount = {
  id: string;
  google_email: string | null;
  primary_calendar_id: string | null;
};

export function useCalendarSubscriptions() {
  return useQuery({
    queryKey: ["gcal-subscriptions-with-accounts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { subscriptions: [], accounts: [], colorMap: {} as Record<string, string> };

      const [{ data: subs }, { data: accts }] = await Promise.all([
        supabase
          .from("google_calendar_subscriptions")
          .select("id, account_id, google_calendar_id, summary, background_color, foreground_color, enabled, is_primary")
          .eq("user_id", user.id),
        supabase
          .from("google_calendar_connections")
          .select("id, google_email, primary_calendar_id")
          .eq("user_id", user.id),
      ]);

      const subscriptions = (subs ?? []) as CalendarSubscription[];
      const accounts = (accts ?? []) as CalendarAccount[];

      const colorMap: Record<string, string> = {};
      for (const s of subscriptions) {
        if (s.background_color) colorMap[s.google_calendar_id] = s.background_color;
      }

      return { subscriptions, accounts, colorMap };
    },
  });
}
