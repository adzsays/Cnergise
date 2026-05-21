// Public: compute available slots for an event type within a date range.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { computeSlots, type AvailabilityRule, type DateOverride, type BusyInterval } from "../_shared/booking-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const handle = (url.searchParams.get("handle") || "").trim().toLowerCase();
    const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (!handle || !slug || !from || !to) return json({ error: "handle, slug, from, to required" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: hostRows } = await admin.rpc("find_user_by_handle", { _handle: handle });
    const host = hostRows?.[0];
    if (!host) return json({ error: "not found" }, 404);

    const { data: et } = await admin
      .from("booking_event_types")
      .select("*")
      .eq("user_id", host.id)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!et) return json({ error: "event type not found" }, 404);

    const [{ data: rules }, { data: overrides }, { data: calEvents }, { data: existing }] = await Promise.all([
      admin.from("booking_availability_rules").select("day_of_week, start_time, end_time").eq("event_type_id", et.id),
      admin.from("booking_date_overrides").select("date, is_unavailable, start_time, end_time").eq("event_type_id", et.id).gte("date", from).lte("date", to),
      admin.from("calendar_events").select("start_time, end_time").eq("user_id", host.id).is("deleted_at", null)
        .gte("start_time", new Date(from).toISOString())
        .lte("start_time", new Date(new Date(to).getTime() + 86_400_000).toISOString()),
      admin.from("bookings").select("start_time, end_time").eq("host_user_id", host.id).eq("status", "confirmed")
        .gte("start_time", new Date(from).toISOString())
        .lte("start_time", new Date(new Date(to).getTime() + 86_400_000).toISOString()),
    ]);

    const busy: BusyInterval[] = [
      ...((calEvents ?? []).map((e: any) => ({ start: new Date(e.start_time).getTime(), end: new Date(e.end_time).getTime() }))),
      ...((existing ?? []).map((b: any) => ({ start: new Date(b.start_time).getTime(), end: new Date(b.end_time).getTime() }))),
    ];

    const slots = computeSlots({
      eventType: et,
      rules: (rules ?? []) as AvailabilityRule[],
      overrides: (overrides ?? []) as DateOverride[],
      busy,
      fromISO: from,
      toISO: to,
    });
    return json({ slots, duration_minutes: et.duration_minutes, timezone: et.timezone });
  } catch (e) {
    console.error("booking-slots error", e);
    return json({ error: "internal" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
