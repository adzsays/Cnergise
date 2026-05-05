import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logServiceUsage } from "../_shared/cost-tracking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Demo positions used when demo_mode = true OR no token is set.
const DEMO_POSITIONS = [
  { symbol: "AAPL", asset_class: "STK", quantity: 50, avg_cost: 165.20, market_price: 189.25, currency: "USD" },
  { symbol: "MSFT", asset_class: "STK", quantity: 25, avg_cost: 380.10, market_price: 415.60, currency: "USD" },
  { symbol: "NVDA", asset_class: "STK", quantity: 12, avg_cost: 720.00, market_price: 875.30, currency: "USD" },
  { symbol: "GOOGL", asset_class: "STK", quantity: 30, avg_cost: 160.00, market_price: 175.80, currency: "USD" },
  { symbol: "TSLA", asset_class: "STK", quantity: 20, avg_cost: 260.00, market_price: 248.90, currency: "USD" },
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
      .from("ibkr_connections")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    let positions = DEMO_POSITIONS;
    let source = "demo";

    if (conn && !conn.demo_mode && conn.gateway_url) {
      try {
        // IBKR Client Portal Gateway — auth is via session cookie established by browser login.
        // Token is only used if user is on institutional OAuth 1.0a.
        const url = `${conn.gateway_url.replace(/\/$/, "")}/portfolio/${conn.account_id || ""}/positions/0`;
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            ...(conn.api_token ? { Authorization: `Bearer ${conn.api_token}` } : {}),
          },
        });
        if (res.ok) {
          const raw = await res.json();
          positions = (Array.isArray(raw) ? raw : []).map((p: any) => ({
            symbol: p.contractDesc || p.ticker || p.symbol,
            asset_class: p.assetClass || "STK",
            quantity: Number(p.position || 0),
            avg_cost: Number(p.avgCost || p.avgPrice || 0),
            market_price: Number(p.mktPrice || 0),
            currency: p.currency || "USD",
          }));
          source = "ibkr";
        } else {
          await supabase.from("ibkr_connections").update({
            status: "error",
            last_error: `IBKR ${res.status}: ${await res.text()}`,
          }).eq("user_id", user.id);
        }
      } catch (e) {
        await supabase.from("ibkr_connections").update({
          status: "error",
          last_error: (e as Error).message,
        }).eq("user_id", user.id);
      }
    }

    // Upsert positions
    const rows = positions.map((p) => ({
      user_id: user.id,
      broker: "ibkr",
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

    await supabase.from("ibkr_connections").upsert({
      user_id: user.id,
      status: source === "ibkr" ? "connected" : (conn?.status || "disconnected"),
      last_synced_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    logServiceUsage({ service: "edge-function", operation: "invocation", units: 1, function_name: "ibkr-sync-portfolio", user_id: user.id });

    return new Response(JSON.stringify({ source, count: rows.length, positions: rows }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
