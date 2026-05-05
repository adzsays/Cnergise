import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function bandFromScore(s: number) {
  if (s < 25) return "Conservative";
  if (s < 50) return "Balanced";
  if (s < 75) return "Growth";
  return "Aggressive";
}

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

    // Pull finance signals
    const [{ data: accounts }, { data: txns }, { data: profile }] = await Promise.all([
      supabase.from("financial_accounts").select("balance,category").eq("user_id", user.id),
      supabase.from("transactions").select("type,monthly").eq("user_id", user.id),
      supabase.from("profiles").select("date_of_birth").eq("id", user.id).maybeSingle(),
    ]);

    const netWorth = (accounts || []).reduce((s, a: any) => s + Number(a.balance || 0), 0);
    const liquid = (accounts || []).filter((a: any) => /bank|cash|wallet/i.test(a.category || "")).reduce((s: number, a: any) => s + Number(a.balance || 0), 0);
    const income = (txns || []).filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.monthly || 0), 0);
    const expense = (txns || []).filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.monthly || 0), 0);
    const surplus = income - expense;
    const surplusRatio = income > 0 ? surplus / income : 0;
    const liquidityMonths = expense > 0 ? liquid / expense : (liquid > 0 ? 12 : 0);

    let age: number | null = null;
    if (profile?.date_of_birth) {
      age = Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000));
    }

    // Score 0-100 (higher = more risk capacity)
    let score = 0;
    score += Math.min(25, surplusRatio * 100); // up to 25
    score += Math.min(25, liquidityMonths * 4); // 6 months -> 24
    score += Math.min(25, Math.log10(Math.max(netWorth, 1)) * 5); // wealth
    if (age !== null) score += Math.max(0, Math.min(25, (60 - age) * 0.6)); // youth bonus
    else score += 12;
    score = Math.max(0, Math.min(100, Math.round(score)));
    const band = bandFromScore(score);

    const limits = {
      Conservative: { max_position_pct: 3, max_drawdown_pct: 8, default_stop_loss_pct: 4, default_take_profit_pct: 8, max_leverage: 1, allow_short: false, allow_options: false },
      Balanced:     { max_position_pct: 5, max_drawdown_pct: 12, default_stop_loss_pct: 5, default_take_profit_pct: 10, max_leverage: 1, allow_short: false, allow_options: false },
      Growth:       { max_position_pct: 8, max_drawdown_pct: 18, default_stop_loss_pct: 6, default_take_profit_pct: 14, max_leverage: 1.5, allow_short: false, allow_options: true },
      Aggressive:   { max_position_pct: 12, max_drawdown_pct: 28, default_stop_loss_pct: 8, default_take_profit_pct: 20, max_leverage: 2, allow_short: true, allow_options: true },
    }[band]!;

    const inputs = { netWorth, liquid, income, expense, surplus, surplusRatio, liquidityMonths, age };
    const payload = {
      user_id: user.id,
      risk_band: band,
      risk_score: score,
      assessed_at: new Date().toISOString(),
      assessment_inputs: inputs,
      ...limits,
    };
    await supabase.from("risk_profiles").upsert(payload, { onConflict: "user_id" });

    return new Response(JSON.stringify({ band, score, inputs, limits }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
