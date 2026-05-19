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
  const json = await res.json();
  return { ok: res.ok, status: res.status, json };
}

async function ensureValidToken(admin: any, conn: any) {
  if (new Date(conn.token_expires_at).getTime() < Date.now() + 60_000) {
    if (!conn.refresh_token) throw new Error("REAUTH_REQUIRED:no_refresh_token");
    const refreshed = await refreshAccessToken(conn.refresh_token);
    if (!refreshed.ok || !refreshed.json?.access_token) {
      const errCode = refreshed.json?.error || "unknown";
      await admin.from("google_calendar_connections").update({
        last_sync_error: `Token refresh failed: ${errCode} (${refreshed.status})`,
      }).eq("id", conn.id);
      throw new Error(`REAUTH_REQUIRED:${errCode}`);
    }
    const newExpiry = new Date(Date.now() + (refreshed.json.expires_in ?? 3600) * 1000).toISOString();
    await admin.from("google_calendar_connections").update({
      access_token: refreshed.json.access_token,
      token_expires_at: newExpiry,
      last_sync_error: null,
    }).eq("id", conn.id);
    return { ...conn, access_token: refreshed.json.access_token };
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

    const { data: connections } = await admin
      .from("google_calendar_connections")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const { data: subs } = await admin
      .from("google_calendar_subscriptions")
      .select("account_id, google_calendar_id, enabled")
      .eq("user_id", user.id);

    const subMap = new Map<string, boolean>();
    for (const s of subs ?? []) subMap.set(`${s.account_id}::${s.google_calendar_id}`, s.enabled);

    const accounts: any[] = [];

    for (const raw of connections ?? []) {
      try {
        const conn = await ensureValidToken(admin, raw);
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
          enabled: subMap.has(`${conn.id}::${c.id}`) ? subMap.get(`${conn.id}::${c.id}`) : c.primary,
        }));

        accounts.push({
          account_id: conn.id,
          email: conn.google_email,
          last_sync_at: conn.last_sync_at,
          calendars,
        });
      } catch (err) {
        accounts.push({
          account_id: raw.id,
          email: raw.google_email,
          last_sync_at: raw.last_sync_at,
          calendars: [],
          error: String(err),
        });
      }
    }

    return new Response(JSON.stringify({ accounts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
