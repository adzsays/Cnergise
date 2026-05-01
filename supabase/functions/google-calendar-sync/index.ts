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

    const calendarId = conn.primary_calendar_id || "primary";
    const params = new URLSearchParams({ singleEvents: "true", maxResults: "250" });
    if (conn.sync_token) params.set("syncToken", conn.sync_token);
    else params.set("timeMin", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());

    let nextSyncToken: string | null = null;
    let pageToken: string | null = null;
    let synced = 0, deleted = 0;

    do {
      if (pageToken) params.set("pageToken", pageToken);
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
        headers: { Authorization: `Bearer ${conn.access_token}` },
      });
      if (res.status === 410) {
        // Sync token invalid, full resync
        await admin.from("google_calendar_connections").update({ sync_token: null }).eq("user_id", user.id);
        return new Response(JSON.stringify({ error: "Sync token expired, retry" }), { status: 410, headers: corsHeaders });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));

      for (const ev of data.items ?? []) {
        if (ev.status === "cancelled") {
          await admin.from("calendar_events")
            .update({ deleted_at: new Date().toISOString() })
            .eq("user_id", user.id).eq("google_event_id", ev.id);
          deleted++;
          continue;
        }
        const startTime = ev.start?.dateTime || ev.start?.date;
        const endTime = ev.end?.dateTime || ev.end?.date;
        if (!startTime || !endTime) continue;
        await admin.from("calendar_events").upsert({
          user_id: user.id,
          title: ev.summary || "(no title)",
          description: ev.description || null,
          location: ev.location || null,
          start_time: startTime,
          end_time: endTime,
          all_day: !!ev.start?.date,
          google_event_id: ev.id,
          google_calendar_id: calendarId,
          etag: ev.etag,
          sync_source: "google",
          last_synced_at: new Date().toISOString(),
          deleted_at: null,
        }, { onConflict: "user_id,google_event_id" });
        synced++;
      }

      pageToken = data.nextPageToken ?? null;
      if (data.nextSyncToken) nextSyncToken = data.nextSyncToken;
    } while (pageToken);

    if (nextSyncToken) {
      await admin.from("google_calendar_connections").update({
        sync_token: nextSyncToken,
        last_sync_at: new Date().toISOString(),
      }).eq("user_id", user.id);
    }

    return new Response(JSON.stringify({ synced, deleted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
