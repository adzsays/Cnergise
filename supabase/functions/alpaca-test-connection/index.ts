import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertSafeExternalUrl } from "../_shared/network-security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (b: any, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: conn } = await supabase
      .from("alpaca_connections_decrypted").select("*").eq("user_id", user.id).maybeSingle();

    if (!conn || !conn.api_key_id || !conn.api_secret) {
      return json({ ok: false, error: "Missing API key or secret" });
    }

    const baseUrl = conn.base_url || (conn.environment === "live"
      ? "https://api.alpaca.markets"
      : "https://paper-api.alpaca.markets");
    const safeBaseUrl = assertSafeExternalUrl(baseUrl);

    const res = await fetch(`${safeBaseUrl}/v2/account`, {
      headers: {
        "APCA-API-KEY-ID": conn.api_key_id,
        "APCA-API-SECRET-KEY": conn.api_secret,
      },
    });

    const body = await res.text();
    if (!res.ok) {
      console.error("alpaca-test-connection upstream error", res.status, body);
      await supabase.from("alpaca_connections").update({
        status: "error", last_error: `External service error (${res.status})`,
      }).eq("user_id", user.id);
      return json({ ok: false, error: "External service error" });
    }

    const acct = JSON.parse(body);
    await supabase.from("alpaca_connections").update({
      status: "connected", last_error: null, account_id: acct.account_number || acct.id || null,
    } as any).eq("user_id", user.id);

    return json({
      ok: true, authenticated: true,
      account: { id: acct.id, number: acct.account_number, status: acct.status, currency: acct.currency, equity: acct.equity, buying_power: acct.buying_power },
    });
  } catch (e) {
    console.error("alpaca-test-connection error", e);
    return json({ ok: false, error: "Internal server error" }, 500);
  }
});
