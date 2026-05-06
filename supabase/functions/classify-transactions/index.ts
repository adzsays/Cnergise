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

    const body = await req.json().catch(() => ({}));
    const onlyUnmapped: boolean = body?.onlyUnmapped !== false;

    // 1. Load unmapped bank transactions
    let txnQuery = supabase
      .from("actual_expenses")
      .select("id, posted_on, merchant, description, amount, account_provider, account_name, mapped_cashflow_id")
      .eq("user_id", user.id)
      .order("posted_on", { ascending: false })
      .limit(500);
    if (onlyUnmapped) txnQuery = txnQuery.is("mapped_cashflow_id", null);
    const { data: txns, error: txErr } = await txnQuery;
    if (txErr) throw txErr;
    if (!txns || txns.length === 0) {
      return new Response(JSON.stringify({ matched: 0, ai_classified: 0, total: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Load rules + cash flow lines
    const [{ data: rules }, { data: cashflows }] = await Promise.all([
      supabase.from("cashflow_mapping_rules").select("*").eq("user_id", user.id).order("priority", { ascending: false }),
      supabase
        .from("financial_transactions")
        .select("id, type, subcategory, category, monthly, cost_centre, frequency")
        .eq("user_id", user.id),
    ]);

    const cashflowList = cashflows || [];
    let matched = 0;
    let aiClassified = 0;
    const updates: any[] = [];
    const ruleHits = new Map<string, { count: number }>();

    // 3. Apply rules
    const unmatchedForAi: any[] = [];
    for (const t of txns) {
      const text = normalize(`${t.merchant ?? ""} ${t.description ?? ""}`);
      let hit: any = null;
      for (const r of rules || []) {
        if (r.min_amount != null && Math.abs(Number(t.amount)) < Number(r.min_amount)) continue;
        if (r.max_amount != null && Math.abs(Number(t.amount)) > Number(r.max_amount)) continue;
        const mv = normalize(r.match_value);
        if (!mv) continue;
        const ok =
          r.match_type === "description_exact"
            ? text === mv
            : r.match_type === "merchant"
            ? normalize(t.merchant) === mv
            : text.includes(mv);
        if (ok) { hit = r; break; }
      }
      if (hit) {
        matched++;
        ruleHits.set(hit.id, { count: (ruleHits.get(hit.id)?.count || 0) + 1 });
        updates.push({
          id: t.id,
          mapped_cashflow_id: hit.cashflow_id,
          mapping_source: "rule",
          mapping_confidence: 1.0,
          cost_centre: hit.cost_centre ?? null,
        });
      } else {
        unmatchedForAi.push(t);
      }
    }

    // 4. AI-classify the rest
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (apiKey && unmatchedForAi.length > 0 && cashflowList.length > 0) {
      const candidateLines = cashflowList.map((c: any) => ({
        id: c.id,
        label: `${c.type} • ${c.subcategory || c.category} (${c.cost_centre || "—"})`,
        type: c.type,
        cost_centre: c.cost_centre,
      }));

      // Process in batches of 20 to keep prompts focused
      for (let i = 0; i < unmatchedForAi.length; i += 20) {
        const batch = unmatchedForAi.slice(i, i + 20);
        const prompt = `You map bank transactions to budgeted cash flow lines.

CANDIDATE CASH FLOW LINES (id → label):
${candidateLines.map((c: any) => `${c.id}: ${c.label}`).join("\n")}

TRANSACTIONS to classify:
${batch.map((t: any, idx: number) => `[${idx}] amount=${t.amount} merchant="${t.merchant ?? ""}" desc="${t.description ?? ""}" account="${t.account_name ?? t.account_provider ?? ""}"`).join("\n")}

Pick the BEST cash flow id for each. If none clearly fit, use null. Match income amounts (positive) to income lines and expenses (negative) to expense lines.`;

        try {
          const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: "You are a financial classification engine. Always call the tool." },
                { role: "user", content: prompt },
              ],
              tools: [{
                type: "function",
                function: {
                  name: "classify_batch",
                  description: "Return classification for each transaction by index.",
                  parameters: {
                    type: "object",
                    properties: {
                      results: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            index: { type: "number" },
                            cashflow_id: { type: ["string", "null"] },
                            confidence: { type: "number" },
                          },
                          required: ["index", "cashflow_id", "confidence"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["results"],
                    additionalProperties: false,
                  },
                },
              }],
              tool_choice: { type: "function", function: { name: "classify_batch" } },
            }),
          });
          if (!aiResp.ok) {
            console.error("AI gateway error:", aiResp.status, await aiResp.text());
            continue;
          }
          const data = await aiResp.json();
          const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
          if (!args) continue;
          const parsed = JSON.parse(args);
          for (const r of parsed.results || []) {
            const t = batch[r.index];
            if (!t || !r.cashflow_id) continue;
            const cf = cashflowList.find((c: any) => c.id === r.cashflow_id);
            if (!cf) continue;
            aiClassified++;
            updates.push({
              id: t.id,
              mapped_cashflow_id: cf.id,
              mapping_source: "ai",
              mapping_confidence: Math.min(1, Math.max(0, Number(r.confidence) || 0.5)),
              cost_centre: cf.cost_centre ?? null,
            });
          }
        } catch (e) {
          console.error("AI batch failed:", e);
        }
      }
    }

    // 5. Persist updates
    for (const u of updates) {
      await supabase
        .from("actual_expenses")
        .update({
          mapped_cashflow_id: u.mapped_cashflow_id,
          mapping_source: u.mapping_source,
          mapping_confidence: u.mapping_confidence,
          cost_centre: u.cost_centre,
        })
        .eq("id", u.id)
        .eq("user_id", user.id);
    }

    // 6. Bump rule usage counters
    for (const [ruleId, info] of ruleHits.entries()) {
      const r = (rules || []).find((x: any) => x.id === ruleId);
      const newCount = (r?.times_applied || 0) + info.count;
      await supabase
        .from("cashflow_mapping_rules")
        .update({ times_applied: newCount, last_applied_at: new Date().toISOString() })
        .eq("id", ruleId);
    }

    return new Response(
      JSON.stringify({ total: txns.length, matched, ai_classified: aiClassified }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("classify-transactions error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
