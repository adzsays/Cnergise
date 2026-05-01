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

function buildBody(event: any, opts: { addMeet?: boolean } = {}) {
  const body: any = {
    summary: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
  };
  if (event.all_day) {
    body.start = { date: event.start_time.slice(0, 10) };
    body.end = { date: event.end_time.slice(0, 10) };
  } else {
    body.start = { dateTime: event.start_time };
    body.end = { dateTime: event.end_time };
  }
  if (opts.addMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: `meet-${event.id ?? crypto.randomUUID()}-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }
  return body;
}

function extractMeetLink(data: any): string | null {
  if (data?.hangoutLink) return data.hangoutLink;
  const ep = data?.conferenceData?.entryPoints?.find?.((e: any) => e.entryPointType === "video");
  return ep?.uri ?? null;
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

    const { action, event } = await req.json();
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const conn = await getValidToken(admin, user.id);
    const calId = conn.primary_calendar_id || "primary";
    const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`;

    if (action === "create") {
      const addMeet = !!event.add_meet;
      const url = addMeet ? `${base}?conferenceDataVersion=1` : base;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${conn.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(event, { addMeet })),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      const meetLink = extractMeetLink(data);
      await admin.from("calendar_events").update({
        google_event_id: data.id, google_calendar_id: calId, etag: data.etag,
        sync_source: "synced", last_synced_at: new Date().toISOString(),
        ...(meetLink ? { meeting_url: meetLink } : {}),
      }).eq("id", event.id).eq("user_id", user.id);
      return new Response(JSON.stringify({ ok: true, id: data.id, meeting_url: meetLink }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update") {
      if (!event.google_event_id) throw new Error("No google_event_id");
      const addMeet = !!event.add_meet && !event.meeting_url;
      const url = `${base}/${event.google_event_id}${addMeet ? "?conferenceDataVersion=1" : ""}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${conn.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(event, { addMeet })),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      const meetLink = extractMeetLink(data);
      await admin.from("calendar_events").update({
        etag: data.etag, last_synced_at: new Date().toISOString(),
        ...(meetLink ? { meeting_url: meetLink } : {}),
      }).eq("id", event.id).eq("user_id", user.id);
      return new Response(JSON.stringify({ ok: true, meeting_url: meetLink }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "delete") {
      if (!event.google_event_id) return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await fetch(`${base}/${event.google_event_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${conn.access_token}` },
      });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "delete") {
      if (!event.google_event_id) return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await fetch(`${base}/${event.google_event_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${conn.access_token}` },
      });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
