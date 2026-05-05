import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logServiceUsage } from "../_shared/cost-tracking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_POSITIONS = [
  { symbol: "AAPL", asset_class: "STK", quantity: 10, avg_cost: 165.20, market_price: 189.25, currency: "USD" },
  { symbol: "MSFT", asset_class: "STK", quantity: 5, avg_cost: 380.10, market_price: 415.60, currency: "USD" },
  { symbol: "NVDA", asset_class: "STK", quantity: 3, avg_cost: 720.00, market_price: 875.30, currency: "USD" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: conn } = await supabase
      .from("alpaca_connections").select("*").eq("user_id", user.id).maybeSingle();

    let positions = DEMO_POSITIONS;
    let source = "demo";

    if (conn && !conn.demo_mode && conn.api_key_id && conn.api_secret) {
      const baseUrl = conn.base_url || (conn.environment === "live"
        ? "https://api.alpaca.markets"
        : "https://paper-api.alpaca.markets");
      try {
        const res = await fetch(`${baseUrl}/v2/positions`, {
          headers: {
            "APCA-API-KEY-ID": conn.api_key_id,
            "APCA-API-SECRET-KEY": conn.api_secret,
          },
        });
        if (res.ok) {
          const raw = await res.json();
          positions = (Array.isArray(raw) ? raw : []).map((p: any) => ({
            symbol: p.symbol,
            asset_class: (p.asset_class || "us_equity").toUpperCase().includes("CRYPTO") ? "CRYPTO" : "STK",
            quantity: Number(p.qty || 0),
            avg_cost: Number(p.avg_entry_price || 0),
            market_price: Number(p.current_price || p.market_price || 0),
            currency: "USD",
          }));
          source = "alpaca";
        } else {
          const body = await res.text();
          await supabase.from("alpaca_connections").update({
            status: "error", last_error: `Alpaca ${res.status}: ${body.slice(0, 300)}`,
          }).eq("user_id", user.id);
        }
      } catch (e) {
        await supabase.from("alpaca_connections").update({
          status: "error", last_error: (e as Error).message,
        }).eq("user_id", user.id);
      }
    }

    const rows = positions.map((p) => ({
      user_id: user.id,
      broker: "alpaca",
      account_id: conn?.account_id || null,
      symbol: p.symbol,
      asset_class: p.asset_class,
      quantity: p.quantity,
      avg_cost: p.avg_cost,
      market_price: p.market_price,
      market_value: p.quantity * p.market_price,
      unrealized_pnl: (p.market_price - p.avg_cost) * p.quantity,
      currency: p.currency,
      synced_at: new Date().toISOString(),
    }));

    if (rows.length) {
      await supabase.from("broker_positions").upsert(rows, { onConflict: "user_id,broker,account_id,symbol" });
    }

    await supabase.from("alpaca_connections").update({
      status: source === "alpaca" ? "connected" : (conn?.status || "disconnected"),
      last_synced_at: new Date().toISOString(),
    }).eq("user_id", user.id);

    logServiceUsage({ service: "edge-function", operation: "invocation", units: 1, function_name: "alpaca-sync-portfolio", user_id: user.id });

    return new Response(JSON.stringify({ source, count: rows.length, positions: rows }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
