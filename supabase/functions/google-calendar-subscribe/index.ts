import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { calendars } = body as {
      calendars: Array<{
        google_calendar_id: string;
        summary?: string;
        backgroundColor?: string;
        foregroundColor?: string;
        primary?: boolean;
        enabled: boolean;
      }>;
    };

    if (!Array.isArray(calendars)) {
      return new Response(JSON.stringify({ error: "calendars[] required" }), { status: 400, headers: corsHeaders });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    for (const c of calendars) {
      await admin.from("google_calendar_subscriptions").upsert({
        user_id: user.id,
        google_calendar_id: c.google_calendar_id,
        summary: c.summary ?? null,
        background_color: c.backgroundColor ?? null,
        foreground_color: c.foregroundColor ?? null,
        is_primary: !!c.primary,
        enabled: c.enabled,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,google_calendar_id" });

      // If disabled, also remove existing events from that calendar
      if (!c.enabled) {
        await admin.from("calendar_events")
          .delete()
          .eq("user_id", user.id)
          .eq("google_calendar_id", c.google_calendar_id);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
