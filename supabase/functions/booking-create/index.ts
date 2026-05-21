// Public: create a booking. Validates slot availability, creates Google Calendar
// event (with Meet link if applicable), persists row, returns confirmation tokens.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import { computeSlots, getValidAccessToken, type AvailabilityRule, type DateOverride, type BusyInterval } from "../_shared/booking-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  handle: z.string().min(1).max(48),
  slug: z.string().min(1).max(64),
  start_time: z.string().min(10), // ISO
  invitee_name: z.string().trim().min(1).max(120),
  invitee_email: z.string().email().max(255),
  invitee_notes: z.string().max(2000).optional().nullable(),
  timezone: z.string().max(64).optional().nullable(),
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const body = parsed.data;
    const handle = body.handle.trim().toLowerCase();
    const slug = body.slug.trim().toLowerCase();

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Rate limit: cap bookings per invitee email per hour to prevent calendar invite spam
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentByEmail } = await admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("invitee_email", body.invitee_email)
      .gte("created_at", oneHourAgo);
    if ((recentByEmail ?? 0) >= 5) {
      return json({ error: "rate_limited" }, 429);
    }

    const { data: hostRows } = await admin.rpc("find_user_by_handle", { _handle: handle });
    const host = hostRows?.[0];
    if (!host) return json({ error: "host not found" }, 404);

    const { data: et } = await admin
      .from("booking_event_types")
      .select("*")
      .eq("user_id", host.id)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!et) return json({ error: "event type not found" }, 404);

    const startMs = new Date(body.start_time).getTime();
    if (Number.isNaN(startMs)) return json({ error: "invalid start_time" }, 400);
    const endMs = startMs + et.duration_minutes * 60_000;

    // Re-validate slot
    const fromISO = new Date(startMs - 86_400_000).toISOString().slice(0, 10);
    const toISO = new Date(startMs + 86_400_000).toISOString().slice(0, 10);

    const [{ data: rules }, { data: overrides }, { data: calEvents }, { data: existing }] = await Promise.all([
      admin.from("booking_availability_rules").select("day_of_week, start_time, end_time").eq("event_type_id", et.id),
      admin.from("booking_date_overrides").select("date, is_unavailable, start_time, end_time").eq("event_type_id", et.id),
      admin.from("calendar_events").select("start_time, end_time").eq("user_id", host.id).is("deleted_at", null)
        .gte("start_time", new Date(startMs - 86_400_000).toISOString())
        .lte("start_time", new Date(endMs + 86_400_000).toISOString()),
      admin.from("bookings").select("start_time, end_time").eq("host_user_id", host.id).eq("status", "confirmed")
        .gte("start_time", new Date(startMs - 86_400_000).toISOString())
        .lte("start_time", new Date(endMs + 86_400_000).toISOString()),
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
      fromISO,
      toISO,
    });
    if (!slots.includes(new Date(startMs).toISOString())) {
      return json({ error: "slot no longer available" }, 409);
    }

    // Create Google Calendar event (best-effort)
    let googleEventId: string | null = null;
    let googleCalendarId: string | null = null;
    let meetLink: string | null = null;
    let locationSnapshot = et.location_details ?? null;
    try {
      const tok = await getValidAccessToken(admin, host.id);
      if (tok) {
        googleCalendarId = tok.calendarId;
        const eventPayload: any = {
          summary: `${et.title} with ${body.invitee_name}`,
          description: [
            body.invitee_notes ? `Notes:\n${body.invitee_notes}` : null,
            body.answers && Object.keys(body.answers).length
              ? "Answers:\n" + Object.entries(body.answers).map(([k, v]) => `- ${k}: ${v}`).join("\n")
              : null,
          ].filter(Boolean).join("\n\n") || et.description || "",
          start: { dateTime: new Date(startMs).toISOString(), timeZone: et.timezone },
          end: { dateTime: new Date(endMs).toISOString(), timeZone: et.timezone },
          attendees: [{ email: body.invitee_email, displayName: body.invitee_name }],
        };
        if (et.location_type === "in_person" && et.location_details) {
          eventPayload.location = et.location_details;
        } else if (et.location_type === "phone" && et.location_details) {
          eventPayload.location = `Phone: ${et.location_details}`;
        } else if (et.location_type === "custom" && et.location_details) {
          eventPayload.location = et.location_details;
        }
        const params = new URLSearchParams();
        if (et.location_type === "google_meet") {
          eventPayload.conferenceData = {
            createRequest: {
              requestId: crypto.randomUUID(),
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          };
          params.set("conferenceDataVersion", "1");
        }
        params.set("sendUpdates", "all");
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(tok.calendarId)}/events?${params}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${tok.accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify(eventPayload),
          },
        );
        const ev = await res.json();
        if (res.ok) {
          googleEventId = ev.id;
          meetLink = ev.hangoutLink || ev.conferenceData?.entryPoints?.find((p: any) => p.entryPointType === "video")?.uri || null;
          if (meetLink && et.location_type === "google_meet") locationSnapshot = meetLink;
        }
      }
    } catch (_e) {
      // Continue with booking even if Google fails
    }

    const { data: inserted, error } = await admin.from("bookings").insert({
      event_type_id: et.id,
      host_user_id: host.id,
      invitee_name: body.invitee_name,
      invitee_email: body.invitee_email,
      invitee_notes: body.invitee_notes ?? null,
      start_time: new Date(startMs).toISOString(),
      end_time: new Date(endMs).toISOString(),
      timezone: body.timezone ?? null,
      google_event_id: googleEventId,
      google_calendar_id: googleCalendarId,
      meet_link: meetLink,
      location_snapshot: locationSnapshot,
      answers: body.answers ?? {},
    }).select("id, cancel_token, reschedule_token, start_time, end_time, meet_link, location_snapshot").single();
    if (error) return json({ error: "could not save booking", detail: error.message }, 500);

    return json({ booking: inserted });
  } catch (e) {
    return json({ error: "internal", detail: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
