import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  return res.json();
}

async function getValidToken(admin: any, userId: string) {
  const { data: conn } = await admin.from("google_calendar_connections").select("*").eq("user_id", userId).maybeSingle();
  if (!conn) throw new Error("No Google Calendar connection");
  if (new Date(conn.token_expires_at).getTime() < Date.now() + 60_000) {
    const refreshed = await refreshAccessToken(conn.refresh_token);
    if (!refreshed.access_token) throw new Error("Token refresh failed");
    const newExpiry = new Date(Date.now() + (refreshed.expires_in ?? 3600) * 1000).toISOString();
    await admin.from("google_calendar_connections").update({
      access_token: refreshed.access_token,
      token_expires_at: newExpiry,
    }).eq("user_id", userId);
    return { ...conn, access_token: refreshed.access_token };
  }
  return conn;
}

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
    const conn = await getValidToken(admin, user.id);

    const res = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader", {
      headers: { Authorization: `Bearer ${conn.access_token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));

    const calendars = (data.items ?? []).map((c: any) => ({
      id: c.id,
      summary: c.summary,
      summaryOverride: c.summaryOverride,
      backgroundColor: c.backgroundColor,
      foregroundColor: c.foregroundColor,
      primary: !!c.primary,
      accessRole: c.accessRole,
    }));

    // Get current subscriptions
    const { data: subs } = await admin
      .from("google_calendar_subscriptions")
      .select("google_calendar_id, enabled")
      .eq("user_id", user.id);

    const subMap = new Map((subs ?? []).map((s: any) => [s.google_calendar_id, s.enabled]));

    const merged = calendars.map((c: any) => ({
      ...c,
      enabled: subMap.has(c.id) ? subMap.get(c.id) : c.primary, // default: primary on
      subscribed: subMap.has(c.id),
    }));

    return new Response(JSON.stringify({ calendars: merged }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
