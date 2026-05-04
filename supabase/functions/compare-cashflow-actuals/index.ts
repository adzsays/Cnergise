// Compare planned cash-flow transactions to actual expenses using Lovable AI to auto-map them.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SYSTEM = `You map real bank transactions to a user's planned cash-flow budget lines.
Return a mapping for EVERY actual expense to the best-fitting planned line. If no good match exists, set planned_id to "" and propose a short category.
Be deterministic, concise, and prefer matching by merchant/description semantics, not exact strings.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const monthsBack: number = Math.min(Math.max(Number(body.monthsBack ?? 3), 1), 12);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const since = new Date();
    since.setMonth(since.getMonth() - monthsBack);
    const sinceISO = since.toISOString().slice(0, 10);

    const [{ data: planned = [] }, { data: actuals = [] }] = await Promise.all([
      admin
        .from("financial_transactions")
        .select("id,type,category,subcategory,monthly,group_name")
        .eq("user_id", user.id)
        .in("type", ["income", "expense"])
        .limit(200),
      admin
        .from("actual_expenses")
        .select("id,posted_on,merchant,description,amount,category")
        .eq("user_id", user.id)
        .gte("posted_on", sinceISO)
        .order("posted_on", { ascending: false })
        .limit(500),
    ]);

    if (!actuals.length) {
      return new Response(JSON.stringify({ mappings: [], summary: [], message: "No actuals to compare" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const compactPlanned = (planned ?? []).map((p: any) => ({
      id: p.id,
      label: `${p.subcategory} (${p.category})`,
      type: p.type,
      monthly: Number(p.monthly) || 0,
    }));
    const compactActuals = (actuals ?? []).map((a: any) => ({
      id: a.id,
      d: a.posted_on,
      m: a.merchant ?? a.description ?? "",
      amt: Number(a.amount) || 0,
      cat: a.category ?? "",
    }));

    const tools = [{
      type: "function",
      function: {
        name: "emit_mapping",
        description: "Return mapping of every actual to a planned line + monthly summary.",
        parameters: {
          type: "object",
          properties: {
            mappings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  actual_id: { type: "string" },
                  planned_id: { type: "string", description: "Planned transaction id, or empty string if no match." },
                  proposed_category: { type: "string", description: "Suggested category if no planned match." },
                  confidence: { type: "number" },
                },
                required: ["actual_id", "planned_id", "proposed_category", "confidence"],
                additionalProperties: false,
              },
            },
            insights: {
              type: "array",
              description: "1-3 short insights comparing planned vs actual.",
              items: { type: "string" },
            },
          },
          required: ["mappings", "insights"],
          additionalProperties: false,
        },
      },
    }];

    const userMsg = `Planned cash-flow lines:\n${JSON.stringify(compactPlanned)}\n\nActual transactions:\n${JSON.stringify(compactActuals)}\n\nMap every actual to the best planned line.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "emit_mapping" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      const status = aiResp.status === 429 ? 429 : aiResp.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: `AI gateway: ${t.slice(0, 200)}` }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiResp.json();
    const args = aiJson.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No mapping returned");
    const parsed = JSON.parse(args);

    // Build summary by planned line
    const plannedById = new Map(compactPlanned.map((p) => [p.id, p]));
    const actualById = new Map(compactActuals.map((a) => [a.id, a]));
    const summaryMap = new Map<string, { planned_id: string; label: string; planned_monthly: number; actual_total: number; count: number }>();

    for (const m of parsed.mappings ?? []) {
      const a = actualById.get(m.actual_id);
      if (!a) continue;
      const p = plannedById.get(m.planned_id);
      const key = m.planned_id || `unmapped:${m.proposed_category || a.cat || "Other"}`;
      const label = p?.label || `Unmapped · ${m.proposed_category || a.cat || "Other"}`;
      const planned_monthly = p?.monthly ?? 0;
      const cur = summaryMap.get(key) || { planned_id: m.planned_id || "", label, planned_monthly, actual_total: 0, count: 0 };
      cur.actual_total += Math.abs(Number(a.amt) || 0);
      cur.count += 1;
      summaryMap.set(key, cur);
    }

    const summary = Array.from(summaryMap.values())
      .map((s) => ({
        ...s,
        actual_monthly: s.actual_total / monthsBack,
        variance: s.planned_monthly - (s.actual_total / monthsBack),
      }))
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

    return new Response(JSON.stringify({
      mappings: parsed.mappings ?? [],
      summary,
      insights: parsed.insights ?? [],
      months: monthsBack,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("compare-cashflow-actuals error", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
