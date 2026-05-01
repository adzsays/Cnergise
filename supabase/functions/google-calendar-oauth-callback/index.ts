import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateRaw = url.searchParams.get("state");
    if (!code || !stateRaw) return new Response("Missing code/state", { status: 400 });

    const state = JSON.parse(atob(stateRaw));
    const userId: string = state.uid;
    const cb: string = state.cb;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!,
        client_secret: Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")!,
        redirect_uri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-oauth-callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      return new Response(`Token exchange failed: ${JSON.stringify(tokens)}`, { status: 400 });
    }

    const ui = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }).then((r) => r.json());

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

    // Look up existing connection for this (user, email); preserve refresh_token if Google didn't return a new one
    const { data: existing } = await admin
      .from("google_calendar_connections")
      .select("id, refresh_token")
      .eq("user_id", userId)
      .eq("google_email", ui.email)
      .maybeSingle();

    const refreshToken = tokens.refresh_token || existing?.refresh_token;

    if (existing?.id) {
      await admin.from("google_calendar_connections").update({
        access_token: tokens.access_token,
        refresh_token: refreshToken,
        token_expires_at: expiresAt,
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await admin.from("google_calendar_connections").insert({
        user_id: userId,
        google_email: ui.email,
        access_token: tokens.access_token,
        refresh_token: refreshToken,
        token_expires_at: expiresAt,
        scope: tokens.scope,
      });
    }

    return Response.redirect(`${cb}&status=success`, 302);
  } catch (e) {
    return new Response(`Error: ${String(e)}`, { status: 500 });
  }
});
