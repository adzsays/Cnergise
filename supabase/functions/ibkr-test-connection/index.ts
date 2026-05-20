import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertSafeExternalUrl } from "../_shared/network-security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: conn } = await supabase
      .from("ibkr_connections_decrypted").select("*").eq("user_id", user.id).maybeSingle();

    if (!conn?.gateway_url) {
      return json({ ok: false, stage: "config", error: "Gateway URL not set. Save it first." });
    }

    const base = assertSafeExternalUrl(conn.gateway_url);

    // 1) Auth status — public, light endpoint on Client Portal Gateway
    const authStatusUrl = `${base}/iserver/auth/status`;
    let res: Response;
    try {
      res = await fetch(authStatusUrl, {
        method: "POST",
        headers: {
          ...(conn.api_token ? { Authorization: `Bearer ${conn.api_token}` } : {}),
          Accept: "application/json",
        },
      });
    } catch (e) {
      console.error("ibkr-test-connection network error", e);
      await supabase.from("ibkr_connections").update({ status: "error", last_error: "network_unreachable" }).eq("user_id", user.id);
      return json({ ok: false, stage: "network", error: "Cannot reach gateway. Check the tunnel is running and HTTPS cert is valid." });
    }


    const text = await res.text();
    let body: any = null; try { body = JSON.parse(text); } catch { /* keep text */ }

    if (!res.ok) {
      console.error("ibkr-test-connection upstream error", res.status, text);
      await supabase.from("ibkr_connections").update({
        status: "error",
        last_error: `External service error (${res.status})`,
      }).eq("user_id", user.id);
      return json({ ok: false, stage: "http", status: res.status, error: "External service error" });
    }

    const authenticated = !!(body?.authenticated);
    const connected = !!(body?.connected);

    await supabase.from("ibkr_connections").update({
      status: authenticated ? "connected" : "needs_login",
      last_error: authenticated ? null : "Gateway reachable but not logged in. Open the gateway URL in a browser and complete IBKR login.",
    }).eq("user_id", user.id);

    return json({
      ok: true,
      reachable: true,
      authenticated,
      connected,
      message: authenticated
        ? "Gateway reachable and authenticated."
        : "Gateway reachable but you need to log in via the gateway URL in your browser first.",
    });
  } catch (e) {
    console.error("ibkr-test-connection error", e);
    return json({ ok: false, stage: "exception", error: "Internal server error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
