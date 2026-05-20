import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logServiceUsage } from "../_shared/cost-tracking.ts";

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

    const body = await req.json();
    const { symbol, qty, side, type = "market", time_in_force = "day", limit_price, stop_price } = body || {};
    if (!symbol || !qty || !side) return json({ error: "symbol, qty, side required" }, 400);
    if (!["buy", "sell"].includes(side)) return json({ error: "side must be buy or sell" }, 400);

    const { data: conn } = await supabase
      .from("alpaca_connections").select("*").eq("user_id", user.id).maybeSingle();

    if (!conn || !conn.api_key_id || !conn.api_secret) {
      return json({ error: "Alpaca not configured" }, 400);
    }
    if (conn.demo_mode) {
      return json({ ok: true, source: "demo", order: { id: crypto.randomUUID(), symbol, qty, side, type, status: "simulated" } });
    }

    const baseUrl = conn.base_url || (conn.environment === "live"
      ? "https://api.alpaca.markets"
      : "https://paper-api.alpaca.markets");

    const payload: any = { symbol, qty: String(qty), side, type, time_in_force };
    if (type === "limit" && limit_price) payload.limit_price = String(limit_price);
    if (type === "stop" && stop_price) payload.stop_price = String(stop_price);
    if (type === "stop_limit") {
      payload.stop_price = String(stop_price);
      payload.limit_price = String(limit_price);
    }

    const res = await fetch(`${baseUrl}/v2/orders`, {
      method: "POST",
      headers: {
        "APCA-API-KEY-ID": conn.api_key_id,
        "APCA-API-SECRET-KEY": conn.api_secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!res.ok) return json({ error: `Alpaca ${res.status}: ${text.slice(0, 300)}` }, res.status);

    logServiceUsage({ service: "edge-function", operation: "invocation", units: 1, function_name: "alpaca-place-order", user_id: user.id });

    return json({ ok: true, source: "alpaca", order: JSON.parse(text) });
  } catch (e) {
    return json({ error: "Internal server error" }, 500);
  }
});
