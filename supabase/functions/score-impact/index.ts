import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InputItem {
  source: string;
  external_id?: string;
  author?: string;
  author_handle?: string;
  preview: string;
  full_content?: string;
  url?: string;
  message_at?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const items: InputItem[] = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return new Response(JSON.stringify({ scored: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (items.length > 50) {
      return new Response(JSON.stringify({ error: "Max 50 items per request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: filters } = await supabase
      .from("impact_filters")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const keywords = filters?.keywords ?? [];
    const handles = filters?.handles ?? [];
    const people = filters?.people ?? [];
    const brands = filters?.brands ?? [];
    const minScore = filters?.min_score ?? 60;
    const actionOnly = filters?.action_required_only ?? false;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an AI inbox triage agent. Score each social/messaging item 0-100 for "direct impact" on the user.
User's interest profile:
- Keywords: ${keywords.join(", ") || "(none)"}
- Handles/usernames: ${handles.join(", ") || "(none)"}
- People who matter: ${people.join(", ") || "(none)"}
- Brands: ${brands.join(", ") || "(none)"}

Scoring rubric:
- 90-100: Directly mentions/addresses the user, their handle, or brand AND requires action.
- 70-89: Strong relevance — matches keyword/person, or asks user a question.
- 40-69: Tangentially relevant — interesting but not addressed to user.
- 0-39: Noise (broadcasts, FYI, marketing).

Mark action_required=true if it expects a reply, decision, payment, RSVP, or has a deadline.
Bucket urgency: "now" (score>=85 or action_required with deadline today), "today" (score>=70), "later" (rest).
Provide a 1-sentence reason and list which filters matched (from keywords/handles/people/brands).`;

    const userPrompt = `Score these ${items.length} items:\n${
      items
        .map(
          (it, i) =>
            `[${i}] source=${it.source} from=${it.author ?? "?"} (${it.author_handle ?? ""})\n${
              it.preview.slice(0, 500)
            }`,
        )
        .join("\n\n")
    }`;

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "report_scores",
              description: "Return impact scores for all items in order.",
              parameters: {
                type: "object",
                properties: {
                  scores: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        index: { type: "number" },
                        score: { type: "number" },
                        urgency: { type: "string", enum: ["now", "today", "later"] },
                        action_required: { type: "boolean" },
                        reason: { type: "string" },
                        matched_filters: { type: "array", items: { type: "string" } },
                      },
                      required: ["index", "score", "urgency", "action_required", "reason", "matched_filters"],
                    },
                  },
                },
                required: ["scores"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "report_scores" } },
        }),
      },
    );

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit, try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { scores: [] };
    const scores: any[] = args.scores ?? [];

    const rows = scores
      .filter((s) => s.score >= minScore && (!actionOnly || s.action_required))
      .map((s) => {
        const item = items[s.index];
        if (!item) return null;
        return {
          user_id: userId,
          source: item.source,
          external_id: item.external_id ?? null,
          author: item.author ?? null,
          author_handle: item.author_handle ?? null,
          preview: item.preview.slice(0, 500),
          full_content: item.full_content ?? null,
          url: item.url ?? null,
          score: Math.max(0, Math.min(100, Math.round(s.score))),
          urgency: s.urgency,
          action_required: !!s.action_required,
          reason: s.reason?.slice(0, 280) ?? null,
          matched_filters: s.matched_filters ?? [],
          message_at: item.message_at ?? new Date().toISOString(),
        };
      })
      .filter(Boolean);

    if (rows.length > 0) {
      const { error: insErr } = await supabase
        .from("impact_messages")
        .upsert(rows, { onConflict: "user_id,source,external_id", ignoreDuplicates: false });
      if (insErr) console.error("upsert error", insErr);
    }

    return new Response(JSON.stringify({ scored: rows.length, total: scores.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("score-impact error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
