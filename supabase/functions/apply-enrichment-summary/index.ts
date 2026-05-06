// Persists user-approved enrichment proposals.
// Creates any new cashflow lines, applies mappings to txns, and saves rules.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const normalize = (s: string | null | undefined) =>
  (s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

type ProposalIn = {
  txn_id: string;
  cashflow_id: string | null;
  new_cashflow?: { type: "income" | "expense"; category: string; subcategory: string; cost_centre: string | null };
  rule?: { match_type: string; match_value: string };
  source: string;
  confidence: number;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const proposals: ProposalIn[] = body?.proposals || [];
    const createRules: boolean = body?.createRules !== false;
    if (proposals.length === 0) {
      return new Response(JSON.stringify({ ok: true, applied: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create new cashflow lines (deduped by type+category+subcategory)
    const newKeyToId = new Map<string, string>();
    const uniqueNew: any[] = [];
    for (const p of proposals) {
      if (!p.new_cashflow || p.cashflow_id) continue;
      const k = `${p.new_cashflow.type}::${p.new_cashflow.category}::${p.new_cashflow.subcategory}`;
      if (newKeyToId.has(k)) continue;
      newKeyToId.set(k, ""); // placeholder
      uniqueNew.push({ k, body: p.new_cashflow });
    }

    for (const u of uniqueNew) {
      const { data: inserted, error } = await supabase
        .from("financial_transactions")
        .insert({
          user_id: user.id,
          date: Date.now(),
          category: u.body.category,
          subcategory: u.body.subcategory,
          amount: 0,
          percentage: 0,
          daily: 0,
          monthly: 0,
          group_name: "Personal",
          type: u.body.type,
          cost_centre: u.body.cost_centre,
          frequency: "monthly",
        })
        .select("id")
        .single();
      if (error) {
        console.error("create cashflow line failed", error);
        continue;
      }
      newKeyToId.set(u.k, inserted.id);
    }

    // 2. Resolve final cashflow_id for each proposal & apply
    let applied = 0;
    let rulesCreated = 0;

    for (const p of proposals) {
      let cfId = p.cashflow_id;
      if (!cfId && p.new_cashflow) {
        const k = `${p.new_cashflow.type}::${p.new_cashflow.category}::${p.new_cashflow.subcategory}`;
        cfId = newKeyToId.get(k) || null;
      }
      if (!cfId) continue;

      const { error: upErr } = await supabase
        .from("actual_expenses")
        .update({
          mapped_cashflow_id: cfId,
          mapping_source: p.source === "transfer" || p.source === "keyword" ? "rule" : "ai",
          mapping_confidence: p.confidence,
          cost_centre: p.new_cashflow?.cost_centre ?? null,
        })
        .eq("id", p.txn_id)
        .eq("user_id", user.id);
      if (upErr) continue;
      applied++;

      // Save a rule when a pattern is provided
      if (createRules && p.rule?.match_value) {
        const mv = normalize(p.rule.match_value);
        if (!mv) continue;
        // upsert-ish: skip if same rule already exists for this user
        const { data: existing } = await supabase
          .from("cashflow_mapping_rules")
          .select("id")
          .eq("user_id", user.id)
          .eq("match_type", p.rule.match_type)
          .eq("match_value", mv)
          .eq("cashflow_id", cfId)
          .maybeSingle();
        if (existing) continue;
        const { error: rErr } = await supabase
          .from("cashflow_mapping_rules")
          .insert({
            user_id: user.id,
            match_type: p.rule.match_type,
            match_value: mv,
            cashflow_id: cfId,
            cost_centre: p.new_cashflow?.cost_centre ?? null,
            priority: 150,
          });
        if (!rErr) rulesCreated++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, applied, rules_created: rulesCreated, new_cashflow_lines: uniqueNew.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("apply-enrichment-summary error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
