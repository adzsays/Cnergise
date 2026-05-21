// Public: cancel a booking by cancel_token. Deletes the Google Calendar event too.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import { getValidAccessToken } from "../_shared/booking-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  token: z.string().min(10).max(128),
  reason: z.string().max(1000).optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { token, reason } = parsed.data;
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: booking } = await admin.from("bookings").select("*").eq("cancel_token", token).maybeSingle();
    if (!booking) return json({ error: "not found" }, 404);
    if (booking.status === "cancelled") return json({ ok: true, already: true });

    if (booking.google_event_id && booking.google_calendar_id) {
      try {
        const tok = await getValidAccessToken(admin, booking.host_user_id);
        if (tok) {
          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(booking.google_calendar_id)}/events/${encodeURIComponent(booking.google_event_id)}?sendUpdates=all`,
            { method: "DELETE", headers: { Authorization: `Bearer ${tok.accessToken}` } },
          );
        }
      } catch (_e) { /* swallow */ }
    }

    await admin.from("bookings").update({
      status: "cancelled",
      cancellation_reason: reason ?? null,
    }).eq("id", booking.id);
    return json({ ok: true });
  } catch (e) {
    console.error("booking-cancel error", e);
    return json({ error: "internal" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
