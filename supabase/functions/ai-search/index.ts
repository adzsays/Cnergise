import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { logServiceUsage } from "../_shared/cost-tracking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: metadata } = await supabase
      .from("unified_metadata")
      .select("*")
      .eq("user_id", user.id)
      .order("date_occurred", { ascending: false })
      .limit(100);

    const contextSummary = (metadata || [])
      .map((m: any) => `[${m.source_type}] ${m.title}${m.amount ? ` (£${m.amount})` : ""}${m.date_occurred ? ` on ${new Date(m.date_occurred).toLocaleDateString()}` : ""}`)
      .slice(0, 50)
      .join("\n");

    const searchTerms = String(query).toLowerCase().split(" ").filter((t) => t.length > 2);
    const relevantItems = (metadata || []).filter((item: any) => {
      const text = `${item.title} ${item.description || ""} ${(item.keywords || []).join(" ")}`.toLowerCase();
      return searchTerms.some((term) => text.includes(term));
    });

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant for Cnergise, a personal life management app. The user has the following data in their system:

${contextSummary}

Your job is to:
1. Answer questions about their data
2. Find cross-links between events (e.g., meetings related to expenses)
3. Summarize patterns and insights
4. Suggest connections they might have missed

Reference specific items from their data. Be concise and actionable.`,
          },
          { role: "user", content: query },
        ],
      }),
    });

    let aiResponse: string | null = null;
    if (resp.ok) {
      const data = await resp.json();
      logServiceUsage({ service: "lovable_ai", operation: "gemini-3-flash", units: 1, function_name: "ai-search", user_id: user.id, metadata: { usage: data?.usage } });
      aiResponse = data.choices?.[0]?.message?.content ?? null;
    } else {
      console.error("AI gateway error", resp.status, await resp.text());
    }

    await supabase.from("ai_search_history").insert({
      user_id: user.id,
      query,
      results: { ai_response: aiResponse, items_found: relevantItems.length },
      metadata_ids: relevantItems.map((i: any) => i.id),
    });

    return new Response(JSON.stringify({
      success: true,
      ai_response: aiResponse,
      related_items: relevantItems,
      total_context_items: metadata?.length || 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("AI Search error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
