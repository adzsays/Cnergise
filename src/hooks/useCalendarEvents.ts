import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CalendarEvent = {
  id: string;
  account_id?: string | null;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean | null;
  google_calendar_id: string | null;
  google_event_id?: string | null;
  sync_source: string | null;
  meeting_url?: string | null;
  recurrence?: string | null;
};

function expandRecurrences(events: CalendarEvent[], rangeStart?: Date, rangeEnd?: Date): CalendarEvent[] {
  if (!rangeStart || !rangeEnd) return events;
  const out: CalendarEvent[] = [];
  const windowStart = rangeStart.getTime();
  const windowEnd = rangeEnd.getTime();
  const maxOccurrences = 400;
  for (const ev of events) {
    // Google-synced occurrences come pre-expanded (singleEvents=true).
    // Only expand locally-stored recurring events to avoid double-rendering.
    if (!ev.recurrence || ev.google_event_id) {
      out.push(ev);
      continue;
    }
    const freq = ev.recurrence.match(/FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/i)?.[1]?.toUpperCase();
    if (!freq) { out.push(ev); continue; }
    const startMs = new Date(ev.start_time).getTime();
    const endMs = new Date(ev.end_time).getTime();
    const duration = Math.max(0, endMs - startMs);
    const step = (d: Date) => {
      if (freq === "DAILY") d.setDate(d.getDate() + 1);
      else if (freq === "WEEKLY") d.setDate(d.getDate() + 7);
      else if (freq === "MONTHLY") d.setMonth(d.getMonth() + 1);
      else if (freq === "YEARLY") d.setFullYear(d.getFullYear() + 1);
    };
    let cursor = new Date(startMs);
    for (let i = 0; i < maxOccurrences && cursor.getTime() <= windowEnd; i++) {
      const occStart = cursor.getTime();
      if (occStart + duration >= windowStart && occStart <= windowEnd) {
        out.push({
          ...ev,
          id: `${ev.id}::${occStart}`,
          start_time: new Date(occStart).toISOString(),
          end_time: new Date(occStart + duration).toISOString(),
        });
      }
      step(cursor);
    }
  }
  return out;
}

function removeStaleAndDuplicateGoogleEvents(events: CalendarEvent[]): CalendarEvent[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (event.sync_source === "google" && event.google_event_id && !event.account_id) {
      return false;
    }

    const key = event.google_event_id
      ? `google:${event.google_calendar_id ?? "primary"}:${event.google_event_id}`
      : `local:${event.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function useCalendarEvents(rangeStart?: Date, rangeEnd?: Date) {
  const qc = useQueryClient();

  // Realtime: any insert/update/delete on calendar_events refetches the visible window.
  useEffect(() => {
    let userId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;
      channel = supabase
        .channel(`calendar-events-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "calendar_events", filter: `user_id=eq.${userId}` },
          () => qc.invalidateQueries({ queryKey: ["calendar-events"] }),
        )
        .subscribe();
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [qc]);

  return useQuery({
    queryKey: ["calendar-events", rangeStart?.toISOString(), rangeEnd?.toISOString()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as CalendarEvent[];

      // For recurring local events, fetch all (regardless of range) so we can expand
      // occurrences into the viewed range; non-recurring rows are filtered by range.
      const baseSelect = "id, account_id, title, description, location, start_time, end_time, all_day, google_calendar_id, google_event_id, sync_source, meeting_url, recurrence";

      const inRangePromise = (async () => {
        let q = supabase.from("calendar_events").select(baseSelect)
          .eq("user_id", user.id).is("deleted_at", null)
          .or("recurrence.is.null,google_event_id.not.is.null")
          .order("start_time", { ascending: true });
        if (rangeStart) q = q.gte("start_time", rangeStart.toISOString());
        if (rangeEnd) q = q.lte("start_time", rangeEnd.toISOString());
        return q;
      })();
      const recurringPromise = supabase.from("calendar_events").select(baseSelect)
        .eq("user_id", user.id).is("deleted_at", null)
        .not("recurrence", "is", null)
        .is("google_event_id", null);

      const [inRange, recurring] = await Promise.all([inRangePromise, recurringPromise]);
      if (inRange.error) throw inRange.error;
      if (recurring.error) throw recurring.error;
      const combined = [...(inRange.data ?? []), ...(recurring.data ?? [])] as CalendarEvent[];
      return removeStaleAndDuplicateGoogleEvents(expandRecurrences(combined, rangeStart, rangeEnd));
    },
  });
}
