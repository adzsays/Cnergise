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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const url = new URL(req.url);
    const requestedOrigin = (url.searchParams.get("origin") || "").replace(/\/$/, "");

    // Allowlist of permitted origins to prevent open-redirects
    const ALLOWED_ORIGINS = new Set([
      "https://cnergise.com",
      "https://www.cnergise.com",
      "https://cnergise.lovable.app",
      "https://id-preview--173356b8-2140-42ad-ba57-ca70a8c1df7c.lovable.app",
    ]);
    const isLovablePreview = /^https:\/\/[a-z0-9-]+\.lovable\.app$/i.test(requestedOrigin);
    const isLocalhost = /^http:\/\/localhost(:\d+)?$/i.test(requestedOrigin);
    const originOk = ALLOWED_ORIGINS.has(requestedOrigin) || isLovablePreview || isLocalhost;
    const safeOrigin = originOk ? requestedOrigin : "https://cnergise.lovable.app";
    const callbackUrl = `${safeOrigin}/calendar?gcal_callback=1`;

    const payload = { uid: user.id, cb: callbackUrl, ts: Date.now() };
    const payloadB64 = btoa(JSON.stringify(payload));
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
    const state = `${payloadB64}.${sigB64}`;

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

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return new Response(JSON.stringify({ url: authUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
