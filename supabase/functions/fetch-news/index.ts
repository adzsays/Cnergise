// Fetches news headlines via Lovable AI Gateway (Google Gemini).
// Note: Gemini does not browse the web; the model summarises notable themes
// from its training horizon. For real-time feeds connect a dedicated news API.
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await sb.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { category = "general" } = await req.json().catch(() => ({}));
    const topic = category === "finance"
      ? "Five major ongoing themes in global financial markets and macroeconomics this quarter."
      : "Five high-level themes shaping technology, business and world affairs this quarter.";

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You output structured news briefs. Return ONLY valid JSON: {\"headlines\":[{\"title\":\"...\",\"summary\":\"one sentence\",\"category\":\"tech|business|world|finance\"}]} — no prose, no markdown." },
          { role: "user", content: topic },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Lovable AI error", resp.status, errText);
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up Lovable AI." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway ${resp.status}`);
    }

    const data = await resp.json();
    logServiceUsage({ service: "lovable_ai", operation: "gemini-3-flash", units: 1, function_name: "fetch-news", metadata: { usage: data?.usage } });
    const content: string = data.choices?.[0]?.message?.content ?? "";

    let headlines: any[] = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) headlines = JSON.parse(jsonMatch[0]).headlines || [];
    } catch (e) {
      console.error("Parse failed", e);
    }

    return new Response(JSON.stringify({ headlines, timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("fetch-news error:", error);
    return new Response(JSON.stringify({ error: "Internal server error", headlines: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
