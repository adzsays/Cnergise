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

    let accountId: string | null = null;
    try {
      const body = await req.json();
      accountId = body?.account_id ?? null;
    } catch (_e) {
      // no body — disconnect all
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let connQuery = admin.from("google_calendar_connections_decrypted").select("*").eq("user_id", user.id);
    if (accountId) connQuery = connQuery.eq("id", accountId);
    const { data: connections } = await connQuery;

    for (const conn of connections ?? []) {
      // Stop watch channels for this account
      const { data: channels } = await admin
        .from("google_calendar_channels")
        .select("*")
        .eq("user_id", user.id)
        .or(`account_id.eq.${conn.id},account_id.is.null`);

      if (conn.access_token) {
        for (const ch of channels ?? []) {
          await fetch("https://www.googleapis.com/calendar/v3/channels/stop", {
            method: "POST",
            headers: { Authorization: `Bearer ${conn.access_token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ id: ch.channel_id, resourceId: ch.resource_id }),
          }).catch(() => {});
        }
        await fetch(`https://oauth2.googleapis.com/revoke?token=${conn.access_token}`, { method: "POST" }).catch(() => {});
      }

      // Get calendar IDs for this account so we can clean up events
      const { data: subs } = await admin
        .from("google_calendar_subscriptions")
        .select("google_calendar_id")
        .eq("account_id", conn.id);

      const calIds = (subs ?? []).map((s: any) => s.google_calendar_id);
      if (calIds.length > 0) {
        await admin.from("calendar_events")
          .delete()
          .eq("user_id", user.id)
          .in("google_calendar_id", calIds);
      }

      await admin.from("google_calendar_subscriptions").delete().eq("account_id", conn.id);
      await admin.from("google_calendar_channels").delete().eq("account_id", conn.id);
      await admin.from("google_calendar_connections").delete().eq("id", conn.id);
    }

    return new Response(JSON.stringify({ ok: true, disconnected: connections?.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
