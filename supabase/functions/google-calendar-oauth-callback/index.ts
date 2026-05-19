import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function signState(payload: Record<string, unknown>) {
  const payloadB64 = btoa(JSON.stringify(payload));
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
  return `${payloadB64}.${sigB64}`;
}

async function buildGoogleAuthUrl(userId: string, callbackUrl: string, retryRefresh = false) {
  const state = await signState({ uid: userId, cb: callbackUrl, ts: Date.now(), retryRefresh });
  const params = new URLSearchParams({
    client_id: Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!,
    redirect_uri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-oauth-callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email",
    access_type: "offline",
    prompt: "consent select_account",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateRaw = url.searchParams.get("state");
    if (!code || !stateRaw) return new Response("Missing code/state", { status: 400 });

    const [payloadB64, sigB64] = stateRaw.split(".");
    if (!payloadB64 || !sigB64) return new Response("Invalid state format", { status: 400 });
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const sigBytes = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(payloadB64));
    if (!valid) return new Response("Invalid state signature", { status: 400 });
    const state = JSON.parse(atob(payloadB64));
    if (!state?.ts || Date.now() - state.ts > 10 * 60 * 1000) return new Response("State expired", { status: 400 });
    const userId: string = state.uid;
    const cbRaw: string = state.cb || "";
    // Defence-in-depth: re-validate redirect target against allowlist
    let cbHost = "";
    try { cbHost = new URL(cbRaw).origin; } catch { return new Response("Invalid callback", { status: 400 }); }
    const ALLOWED = new Set([
      "https://cnergise.com",
      "https://www.cnergise.com",
      "https://cnergise.lovable.app",
      "https://id-preview--173356b8-2140-42ad-ba57-ca70a8c1df7c.lovable.app",
    ]);
    const isLovablePreview = /^https:\/\/[a-z0-9-]+\.lovable\.app$/i.test(cbHost);
    const isLocalhost = /^http:\/\/localhost(:\d+)?$/i.test(cbHost);
    if (!ALLOWED.has(cbHost) && !isLovablePreview && !isLocalhost) {
      return new Response("Disallowed redirect", { status: 400 });
    }
    const cb: string = cbRaw;

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
