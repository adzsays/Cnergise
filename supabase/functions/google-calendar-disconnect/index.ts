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

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: conn } = await admin.from("google_calendar_connections").select("access_token").eq("user_id", user.id).maybeSingle();

    // Best-effort: stop all channels + revoke
    const { data: channels } = await admin.from("google_calendar_channels").select("*").eq("user_id", user.id);
    if (conn?.access_token) {
      for (const ch of channels ?? []) {
        await fetch("https://www.googleapis.com/calendar/v3/channels/stop", {
          method: "POST",
          headers: { Authorization: `Bearer ${conn.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ id: ch.channel_id, resourceId: ch.resource_id }),
        }).catch(() => {});
      }
      await fetch(`https://oauth2.googleapis.com/revoke?token=${conn.access_token}`, { method: "POST" }).catch(() => {});
    }

    await admin.from("google_calendar_channels").delete().eq("user_id", user.id);
    await admin.from("google_calendar_connections").delete().eq("user_id", user.id);

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
