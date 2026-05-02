import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, goals, projects, tasks, mode } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Auto-correct mode
    if (mode === "autocorrect") {
      const acResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "You are a text correction assistant. Fix grammar, spelling, and punctuation in voice-transcribed text. Keep the meaning identical. Output ONLY the corrected text, nothing else.",
            },
            { role: "user", content: text },
          ],
        }),
      });
      if (!acResponse.ok) throw new Error("Auto-correct failed");
      const acData = await acResponse.json();
      const corrected = acData.choices?.[0]?.message?.content?.trim() || text;
      return new Response(JSON.stringify({ corrected }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build plan context (Goals, Projects, Tasks). Echo is the "reality vs plan" check.
    let goalsContext = "";
    if (goals && Array.isArray(goals) && goals.length > 0) {
      goalsContext = "\n\nUser's active GOALS (id | title | category):\n";
      for (const g of goals) goalsContext += `- ${g.id} | ${g.title} | ${g.category}\n`;
    }
    let projectsContext = "";
    if (projects && Array.isArray(projects) && projects.length > 0) {
      projectsContext = "\n\nUser's active PROJECTS (id | name | parent_goal_id):\n";
      for (const p of projects) projectsContext += `- ${p.id} | ${p.name} | ${p.goal_id ?? "-"}\n`;
    }
    let tasksContext = "";
    if (tasks && Array.isArray(tasks) && tasks.length > 0) {
      tasksContext = "\n\nUser's open TASKS (id | title | parent_project_id):\n";
      for (const t of tasks) tasksContext += `- ${t.id} | ${t.title} | ${t.project_id ?? "-"}\n`;
    }
    const linkingGuidance = (goalsContext || projectsContext || tasksContext)
      ? "\n\nLinking rules: When an entry clearly relates to a TASK include task_id (this is the most granular). If it relates to a PROJECT (not a specific task), include project_id. If it only relates to a GOAL, include goal_id. Pick the MOST SPECIFIC match. Omit any field that doesn't clearly match — never guess."
      : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a daily activity classifier and a "reality vs plan" linker. Given a voice or text journal entry, extract one or more entries and classify each.

For each entry return:
- type: short category tag (spending, food, exercise, health, events, career, learning, social, productivity, wellness, etc.)
- title: short title (3-6 words)
- description: brief description
- amount: number if applicable (currency for spending, count/duration for exercise, etc.)
- unit: unit of the amount (£, $, miles, km, minutes, calories, reps)
- goal_id / project_id / task_id: see linking rules below

Be smart about extracting MULTIPLE entries from a single sentence (e.g. "spent £12 on lunch and ran 3 miles" = 2 entries).${goalsContext}${projectsContext}${tasksContext}${linkingGuidance}`,
          },
          { role: "user", content: text },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_entries",
              description: "Classify journal text into structured daily entries",
              parameters: {
                type: "object",
                properties: {
                  entries: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string" },
                        title: { type: "string" },
                        description: { type: "string" },
                        amount: { type: "number" },
                        unit: { type: "string" },
                        goal_id: { type: "string" },
                      },
                      required: ["type", "title", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["entries"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_entries" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI classification failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No classification result from AI");

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("echo-classify-entry error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
