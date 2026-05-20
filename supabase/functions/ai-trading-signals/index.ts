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

    const { strategy_id } = await req.json();
    const { data: strategy } = await supabase.from("trading_strategies").select("*").eq("id", strategy_id).eq("user_id", user.id).maybeSingle();
    if (!strategy) return new Response(JSON.stringify({ error: "Strategy not found" }), { status: 404, headers: corsHeaders });

    const { data: risk } = await supabase.from("risk_profiles").select("*").eq("user_id", user.id).maybeSingle();
    const { data: positions } = await supabase.from("broker_positions").select("symbol,quantity,market_value,unrealized_pnl").eq("user_id", user.id);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sysPrompt = `You are an investment-research assistant. Generate trade signals for the user's strategy. You DO NOT execute trades. All output is for the user to review. Respect risk limits strictly.

Risk profile: max_position_pct=${risk?.max_position_pct ?? 5}, stop_loss=${risk?.default_stop_loss_pct ?? 5}%, take_profit=${risk?.default_take_profit_pct ?? 10}%, allow_short=${risk?.allow_short ?? false}

Strategy:
Name: ${strategy.name}
Description: ${strategy.description || ""}
Asset universe: ${(strategy.asset_universe || []).join(", ") || "open"}
Strategy prompt: ${strategy.ai_prompt || ""}

Current holdings: ${JSON.stringify(positions || [])}`;

    const tools = [{
      type: "function",
      function: {
        name: "emit_signals",
        description: "Emit trade signals",
        parameters: {
          type: "object",
          properties: {
            signals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  symbol: { type: "string" },
                  side: { type: "string", enum: ["BUY", "SELL", "HOLD"] },
                  conviction: { type: "number", minimum: 0, maximum: 100 },
                  suggested_quantity: { type: "number" },
                  suggested_limit_price: { type: "number" },
                  suggested_stop_loss: { type: "number" },
                  suggested_take_profit: { type: "number" },
                  rationale: { type: "string" },
                },
                required: ["symbol", "side", "conviction", "rationale"],
              },
            },
          },
          required: ["signals"],
        },
      },
    }];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sysPrompt }, { role: "user", content: "Produce 1-5 actionable trade signals for today." }],
        tools,
        tool_choice: { type: "function", function: { name: "emit_signals" } },
      }),
    });
    if (!aiRes.ok) throw new Error(`AI ${aiRes.status}: ${await aiRes.text()}`);
    const ai = await aiRes.json();
    const args = ai.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { signals: [] };

    const inserts = (parsed.signals || []).map((s: any) => ({
      user_id: user.id,
      strategy_id,
      symbol: s.symbol,
      side: s.side,
      conviction: s.conviction,
      suggested_quantity: s.suggested_quantity,
      suggested_limit_price: s.suggested_limit_price,
      suggested_stop_loss: s.suggested_stop_loss,
      suggested_take_profit: s.suggested_take_profit,
      rationale: s.rationale,
      status: "new",
    }));
    let saved: any[] = [];
    if (inserts.length) {
      const { data } = await supabase.from("ai_trade_signals").insert(inserts).select();
      saved = data || [];
    }
    await supabase.from("trading_strategies").update({ last_run_at: new Date().toISOString() }).eq("id", strategy_id);

    if (ai.usage?.total_tokens) {
      logServiceUsage({ service: "lovable-ai", operation: "google/gemini-2.5-flash", units: ai.usage.total_tokens / 1000, function_name: "ai-trading-signals", user_id: user.id });
    }

    return new Response(JSON.stringify({ signals: saved }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-trading-signals error", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
