// Listening Agent: scans recent emails + social/messaging items for the user,
// scores them with Lovable AI, drafts a suggested reply for top items, and
// stores them in impact_messages so the floating prompt + push can surface them.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CandidateItem {
  source: string;
  external_id?: string;
  author?: string;
  author_handle?: string;
  preview: string;
  url?: string;
  message_at?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Load settings (create defaults if missing)
    let { data: settings } = await supabase
      .from("listening_agent_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!settings) {
      const { data: created } = await supabase
        .from("listening_agent_settings")
        .insert({ user_id: userId })
        .select()
        .single();
      settings = created;
    }

    if (!settings?.enabled) {
      return new Response(JSON.stringify({ skipped: "agent disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional: client may pass items directly, otherwise we pull from existing tables
    const body = await req.json().catch(() => ({}));
    let items: CandidateItem[] = Array.isArray(body.items) ? body.items : [];

    // Pull candidates from the user's recent unified_metadata (cross-app)
    // and limit to last 24h.
    if (items.length === 0) {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const sourceFilter: string[] = [];
      if (settings.source_email) sourceFilter.push("email");
      if (settings.source_messaging) sourceFilter.push("whatsapp", "telegram", "chat");
      if (settings.source_social) sourceFilter.push("twitter", "linkedin", "instagram", "facebook", "news");

      if (sourceFilter.length > 0) {
        const { data: meta } = await supabase
          .from("unified_metadata")
          .select("id, source, title, snippet, url, sender, created_at")
          .eq("user_id", userId)
          .in("source", sourceFilter)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(40);

        items = (meta ?? []).map((m: any) => ({
          source: m.source,
          external_id: m.id,
          author: m.sender ?? null,
          preview: `${m.title ?? ""}\n${m.snippet ?? ""}`.trim().slice(0, 800),
          url: m.url,
          message_at: m.created_at,
        }));
      }
    }

    if (items.length === 0) {
      await supabase
        .from("listening_agent_settings")
        .update({ last_scan_at: new Date().toISOString() })
        .eq("user_id", userId);
      return new Response(JSON.stringify({ scored: 0, total: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Existing user filters (keywords, brands, people, vip handles)
    const { data: filters } = await supabase
      .from("impact_filters")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const keywords = filters?.keywords ?? [];
    const handles = [...(filters?.handles ?? []), ...(settings.vip_handles ?? [])];
    const people = filters?.people ?? [];
    const brands = filters?.brands ?? [];
    const minScore = settings.min_score ?? 75;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const triggerNotes: string[] = [];
    if (settings.trigger_mentions) triggerNotes.push("direct mentions/DMs to the user");
    if (settings.trigger_vip) triggerNotes.push(`messages from VIP senders: ${handles.join(", ") || "(none)"}`);
    if (settings.trigger_action_required) triggerNotes.push("anything that requires a reply, decision, payment, or has a deadline");
    if (settings.trigger_keywords) triggerNotes.push(`keyword/brand/people matches: ${[...keywords, ...brands, ...people].join(", ") || "(none)"}`);

    const systemPrompt = `You are a silent listening agent. You ONLY surface items that match the user's triggers.
Triggers that should fire:
${triggerNotes.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Score each item 0-100 for "should we prompt the user".
Only items >= ${minScore} will be shown. Be strict — broadcasts, marketing, and FYI = low score.
For items >= ${minScore}, also draft a short suggested reply (1-3 sentences, matches the tone of the original).
Bucket urgency: "now" (>=85 + action), "today" (>=75), "later" (rest).`;

    const userPrompt = `Score these ${items.length} items:\n${items
      .map((it, i) => `[${i}] source=${it.source} from=${it.author ?? "?"}\n${it.preview.slice(0, 500)}`)
      .join("\n\n")}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            description: "Return triggered items with score, urgency, reason, and suggested reply.",
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
                      suggested_reply: { type: "string" },
                    },
                    required: ["index", "score", "urgency", "action_required", "reason", "matched_filters", "suggested_reply"],
                  },
                },
              },
              required: ["scores"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_scores" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { scores: [] };
    const scores: any[] = args.scores ?? [];

    const rows = scores
      .filter((s) => s.score >= minScore)
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
          url: item.url ?? null,
          score: Math.max(0, Math.min(100, Math.round(s.score))),
          urgency: s.urgency,
          action_required: !!s.action_required,
          reason: s.reason?.slice(0, 280) ?? null,
          matched_filters: s.matched_filters ?? [],
          suggested_reply: s.suggested_reply?.slice(0, 1000) ?? null,
          message_at: item.message_at ?? new Date().toISOString(),
        };
      })
      .filter(Boolean);

    if (rows.length > 0) {
      await supabase
        .from("impact_messages")
        .upsert(rows, { onConflict: "user_id,source,external_id", ignoreDuplicates: false });
    }

    await supabase
      .from("listening_agent_settings")
      .update({ last_scan_at: new Date().toISOString() })
      .eq("user_id", userId);

    return new Response(JSON.stringify({ scored: rows.length, total: scores.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("listening-agent-scan error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
