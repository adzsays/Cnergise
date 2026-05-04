import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logServiceUsage } from "../_shared/cost-tracking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const body = await req.json();
    const { symbol, side, quantity, order_type = "MKT", limit_price, stop_price, strategy_id, signal_id, rationale } = body;
    if (!symbol || !side || !quantity) {
      return new Response(JSON.stringify({ error: "symbol, side, quantity required" }), { status: 400, headers: corsHeaders });
    }

    // Risk pre-check
    const { data: risk } = await supabase.from("risk_profiles").select("*").eq("user_id", user.id).maybeSingle();
    const { data: positions } = await supabase.from("broker_positions").select("market_value").eq("user_id", user.id);
    const portfolio = (positions || []).reduce((s, p: any) => s + Number(p.market_value || 0), 0);
    const orderVal = Number(quantity) * Number(limit_price || stop_price || 0);
    const maxPct = risk?.max_position_pct ?? 5;
    const blockers: string[] = [];
    if (portfolio > 0 && orderVal > 0 && (orderVal / portfolio) * 100 > maxPct) {
      blockers.push(`Order is ${((orderVal / portfolio) * 100).toFixed(1)}% of portfolio (max ${maxPct}%)`);
    }
    if (side === "SELL" && !risk?.allow_short) {
      const { data: pos } = await supabase.from("broker_positions").select("quantity").eq("user_id", user.id).eq("symbol", symbol).maybeSingle();
      if (!pos || Number(pos.quantity) < Number(quantity)) blockers.push("Short selling not allowed; insufficient long position");
    }
    if (blockers.length) {
      return new Response(JSON.stringify({ error: "Risk check failed", blockers }), { status: 400, headers: corsHeaders });
    }

    const { data: conn } = await supabase.from("ibkr_connections").select("*").eq("user_id", user.id).maybeSingle();
    const live = conn && !conn.demo_mode && conn.api_token;

    // Insert order record (simulated unless live)
    const { data: order, error } = await supabase.from("broker_orders").insert({
      user_id: user.id,
      broker: "ibkr",
      account_id: conn?.account_id,
      symbol, side, order_type, quantity,
      limit_price, stop_price,
      status: live ? "submitted" : "filled",
      filled_quantity: live ? 0 : quantity,
      avg_fill_price: live ? null : (limit_price || stop_price || 0),
      strategy_id, signal_id, rationale,
      submitted_at: new Date().toISOString(),
      filled_at: live ? null : new Date().toISOString(),
    }).select().single();
    if (error) throw error;

    if (live) {
      // Real IBKR submission would go here. Left as best-effort placeholder.
      try {
        const url = `${conn.gateway_url.replace(/\/$/, "")}/iserver/account/${conn.account_id}/orders`;
        const res = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${conn.api_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            orders: [{ ticker: symbol, side, quantity, orderType: order_type, price: limit_price, auxPrice: stop_price, tif: "DAY" }],
          }),
        });
        const raw = await res.json().catch(() => ({}));
        await supabase.from("broker_orders").update({
          broker_order_id: raw?.[0]?.order_id || null,
          raw,
          status: res.ok ? "submitted" : "rejected",
        }).eq("id", order.id);
      } catch (e) {
        await supabase.from("broker_orders").update({ status: "rejected", rationale: `${rationale || ""}\nError: ${(e as Error).message}` }).eq("id", order.id);
      }
    }

    logServiceUsage({ service: "edge-function", operation: "invocation", units: 1, function_name: "ibkr-place-order", user_id: user.id });

    return new Response(JSON.stringify({ order, mode: live ? "live" : "demo" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
