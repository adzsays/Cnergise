import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const normalize = (s: string | null | undefined) =>
  (s || "").toLowerCase().replace(/[^a-z ]+/g, " ").replace(/\s+/g, " ").trim();

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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      transaction_id,
      cashflow_id,
      cost_centre,
      apply_to_similar,
      match_value,
      match_type = "description_contains",
    } = await req.json();

    if (!transaction_id || !cashflow_id) {
      return new Response(JSON.stringify({ error: "transaction_id and cashflow_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Always update the single transaction first
    await supabase
      .from("actual_expenses")
      .update({
        mapped_cashflow_id: cashflow_id,
        mapping_source: "manual",
        mapping_confidence: 1.0,
        cost_centre: cost_centre ?? null,
      })
      .eq("id", transaction_id)
      .eq("user_id", user.id);

    let bulkCount = 0;
    let ruleId: string | null = null;

    if (apply_to_similar && match_value) {
      // Insert/upsert rule
      const { data: rule, error: ruleErr } = await supabase
        .from("cashflow_mapping_rules")
        .insert({
          user_id: user.id,
          match_type,
          match_value: normalize(match_value),
          cashflow_id,
          cost_centre: cost_centre ?? null,
          priority: 200,
        })
        .select()
        .single();
      if (ruleErr) throw ruleErr;
      ruleId = rule.id;

      // Bulk update matching transactions (text search on merchant+description)
      const { data: candidates } = await supabase
        .from("actual_expenses")
        .select("id, merchant, description")
        .eq("user_id", user.id);

      const mv = normalize(match_value);
      const ids = (candidates || [])
        .filter((c: any) => {
          const text = normalize(`${c.merchant ?? ""} ${c.description ?? ""}`);
          if (match_type === "description_exact") return text === mv;
          if (match_type === "merchant") return normalize(c.merchant) === mv;
          return text.includes(mv);
        })
        .map((c: any) => c.id);

      if (ids.length > 0) {
        await supabase
          .from("actual_expenses")
          .update({
            mapped_cashflow_id: cashflow_id,
            mapping_source: "rule",
            mapping_confidence: 1.0,
            cost_centre: cost_centre ?? null,
          })
          .in("id", ids)
          .eq("user_id", user.id);
        bulkCount = ids.length;

        await supabase
          .from("cashflow_mapping_rules")
          .update({ times_applied: bulkCount, last_applied_at: new Date().toISOString() })
          .eq("id", ruleId);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, bulk_count: bulkCount, rule_id: ruleId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("apply-mapping-rule error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
