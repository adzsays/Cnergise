import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean | null;
  google_calendar_id: string | null;
  sync_source: string | null;
};

export function useCalendarEvents(rangeStart?: Date, rangeEnd?: Date) {
  return useQuery({
    queryKey: ["calendar-events", rangeStart?.toISOString(), rangeEnd?.toISOString()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as CalendarEvent[];

      let q = supabase
        .from("calendar_events")
        .select("id, title, description, location, start_time, end_time, all_day, google_calendar_id, sync_source")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("start_time", { ascending: true });

      if (rangeStart) q = q.gte("start_time", rangeStart.toISOString());
      if (rangeEnd) q = q.lte("start_time", rangeEnd.toISOString());

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CalendarEvent[];
    },
  });
}
