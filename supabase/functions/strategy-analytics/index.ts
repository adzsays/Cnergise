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
    const auth = req.headers.get("authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { strategy_id, bundle_id } = await req.json();

    let strategies: any[] = [];
    if (bundle_id) {
      const { data: items } = await supabase
        .from("strategy_bundle_items")
        .select("weight_pct, strategy:trading_strategies(*)")
        .eq("bundle_id", bundle_id);
      strategies = (items || []).map((i: any) => ({ ...i.strategy, weight_pct: i.weight_pct }));
    } else if (strategy_id) {
      const { data } = await supabase.from("trading_strategies").select("*").eq("id", strategy_id).maybeSingle();
      if (data) strategies = [{ ...data, weight_pct: 100 }];
    } else {
      return new Response(JSON.stringify({ error: "strategy_id or bundle_id required" }), { status: 400, headers: corsHeaders });
    }

    if (strategies.length === 0) return new Response(JSON.stringify({ error: "Nothing to analyze" }), { status: 404, headers: corsHeaders });

    const { data: signals } = await supabase
      .from("ai_trade_signals")
      .select("*")
      .eq("user_id", user.id)
      .in("strategy_id", strategies.map((s) => s.id))
      .order("generated_at", { ascending: false })
      .limit(200);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sys = `You are a quant analytics engine. Produce a realistic backtest + live performance report for the supplied trading strategies. Use plausible numbers grounded in the strategy descriptions, asset universes, recent signal log, and broad market context. Always benchmark against the SPX (or BTC for crypto-only). Do not invent unverifiable price data — use directional, modeled estimates.`;

    const userPrompt = `Strategies (with weights if a bundle):\n${JSON.stringify(strategies, null, 2)}\n\nRecent signals (most recent 200):\n${JSON.stringify((signals || []).slice(0, 50))}`;

    const tools = [{
      type: "function",
      function: {
        name: "emit_analytics",
        description: "Return full analytics for the strategy or bundle.",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string", description: "Plain-English summary of how the strategy/bundle is doing." },
            metrics: {
              type: "object",
              properties: {
                cumulative_return_pct: { type: "number" },
                annualized_return_pct: { type: "number" },
                benchmark_return_pct: { type: "number" },
                sharpe_ratio: { type: "number" },
                sortino_ratio: { type: "number" },
                max_drawdown_pct: { type: "number" },
                volatility_pct: { type: "number" },
                win_rate_pct: { type: "number" },
                avg_trade_return_pct: { type: "number" },
                trades_count: { type: "integer" },
                exposure_pct: { type: "number" },
              },
              required: ["cumulative_return_pct", "benchmark_return_pct", "sharpe_ratio", "max_drawdown_pct", "win_rate_pct", "trades_count"],
            },
            equity_curve: {
              type: "array",
              description: "12 monthly points: { month: 'YYYY-MM', strategy: cum return %, benchmark: cum return % }",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  strategy: { type: "number" },
                  benchmark: { type: "number" },
                },
                required: ["month", "strategy", "benchmark"],
              },
            },
            risk_assessment: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } },
          },
          required: ["summary", "metrics", "equity_curve"],
        },
      },
    }];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: userPrompt }],
        tools,
        tool_choice: { type: "function", function: { name: "emit_analytics" } },
      }),
    });
    if (!aiRes.ok) {
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit, try again shortly." }), { status: 429, headers: corsHeaders });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: corsHeaders });
      throw new Error(`AI ${aiRes.status}: ${await aiRes.text()}`);
    }
    const ai = await aiRes.json();
    const args = ai.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : {};

    // Persist snapshot
    if (parsed.metrics) {
      await supabase.from("strategy_performance_snapshots").insert({
        user_id: user.id,
        strategy_id: strategy_id || null,
        bundle_id: bundle_id || null,
        return_pct: parsed.metrics.annualized_return_pct,
        cumulative_return_pct: parsed.metrics.cumulative_return_pct,
        benchmark_return_pct: parsed.metrics.benchmark_return_pct,
        sharpe_ratio: parsed.metrics.sharpe_ratio,
        max_drawdown_pct: parsed.metrics.max_drawdown_pct,
        win_rate_pct: parsed.metrics.win_rate_pct,
        trades_count: parsed.metrics.trades_count,
        notes: parsed.summary,
        metrics: parsed,
      });
    }

    if (ai.usage?.total_tokens) {
      logServiceUsage({ service: "lovable-ai", operation: "google/gemini-2.5-flash", units: ai.usage.total_tokens / 1000, function_name: "strategy-analytics", user_id: user.id });
    }

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
