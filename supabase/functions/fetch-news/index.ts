import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logServiceUsage } from "../_shared/cost-tracking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
    }


    const { category = "general" } = await req.json().catch(() => ({}));

    const prompt = category === "finance" 
      ? "Give me 5 of today's most important financial and market news headlines. Be concise - just the headline and a one sentence summary for each."
      : "Give me 5 of today's most important news headlines across technology, business, and world events. Be concise - just the headline and a one sentence summary for each.";

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { 
            role: "system", 
            content: "You are a news aggregator. Return news in JSON format only. Format: {\"headlines\": [{\"title\": \"...\", \"summary\": \"...\", \"category\": \"tech|business|world|finance\"}]}. No markdown, no explanation, just valid JSON." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    logServiceUsage({ service: "perplexity", operation: "sonar", units: 1, function_name: "fetch-news", metadata: { usage: data?.usage } });
    const content = data.choices?.[0]?.message?.content || "";
    
    // Try to parse JSON from the response
    let headlines = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        headlines = parsed.headlines || [];
      }
    } catch (parseError) {
      console.error("Failed to parse JSON, extracting manually:", parseError);
      // Fallback: create headlines from raw text
      const lines = content.split("\n").filter((l: string) => l.trim());
      headlines = lines.slice(0, 5).map((line: string, i: number) => ({
        title: line.replace(/^\d+\.\s*/, "").substring(0, 100),
        summary: "",
        category: "general"
      }));
    }

    return new Response(JSON.stringify({ 
      headlines,
      citations: data.citations || [],
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("fetch-news error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      headlines: []
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
