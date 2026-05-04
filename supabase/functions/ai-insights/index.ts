// AI Insights — generates personalized brief + clarifying questions for a user across scopes.
// Pulls from finance, tasks, goals, calendar, health, then asks Lovable AI Gateway via tool-calling.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

type Scope = "today" | "finance" | "plan" | "health";

const SYSTEM_PROMPT = `You are Cnergise, a personal AI strategist that helps the user reach goals across life, finance, health, and work.

Style: brief, direct, decisive. Sound like a sharp Chief of Staff — never generic, never preachy.
Approach:
1. Spot patterns (recurring spend, slipping goals, missed habits).
2. Recommend 1–3 next-best actions tied to a specific entity (task / goal / payment).
3. If you're missing info that would change the recommendation, ask ONE crisp clarifying question. Otherwise leave questions empty.
4. Predict next steps using historical data when present; otherwise reason from first principles.

Always call the emit_brief tool. Never reply in plain text.`;

async function gatherContext(admin: any, userId: string, scope: Scope) {
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 86400_000);
  const in30 = new Date(now.getTime() + 30 * 86400_000);
  const ago30 = new Date(now.getTime() - 30 * 86400_000);
  const ctx: Record<string, unknown> = { now: now.toISOString(), scope };

  if (scope === "today" || scope === "plan") {
    const [tasks, goals, events] = await Promise.all([
      admin.from("tasks").select("id,title,priority,status,due_date").eq("user_id", userId).neq("status", "done").order("due_date", { ascending: true }).limit(15),
      admin.from("goals").select("id,title,progress,status,deadline,category").eq("user_id", userId).eq("status", "active").limit(10),
      admin.from("calendar_events").select("id,title,start_time,location").eq("user_id", userId).is("deleted_at", null).gte("start_time", now.toISOString()).lte("start_time", in7.toISOString()).order("start_time").limit(15),
    ]);
    ctx.tasks = tasks.data ?? [];
    ctx.goals = goals.data ?? [];
    ctx.upcoming_events = events.data ?? [];
  }

  if (scope === "today" || scope === "finance") {
    const [recentTx, upcomingTx, accounts] = await Promise.all([
      admin.from("financial_transactions").select("id,amount,category,subcategory,type,date,frequency").eq("user_id", userId).gte("date", ago30.getTime()).order("date", { ascending: false }).limit(40),
      admin.from("financial_transactions").select("id,amount,category,type,date,frequency").eq("user_id", userId).gte("date", now.getTime()).lte("date", in30.getTime()).order("date").limit(30),
      admin.from("financial_accounts").select("id,name,type,balance,currency,credit_limit").eq("user_id", userId).limit(20),
    ]);
    ctx.recent_transactions = recentTx.data ?? [];
    ctx.upcoming_payments = upcomingTx.data ?? [];
    ctx.accounts = accounts.data ?? [];
  }

  if (scope === "today" || scope === "health") {
    const { data: health } = await admin.from("health_metrics").select("metric_date,steps,sleep_minutes,active_minutes,resting_heart_rate").eq("user_id", userId).gte("metric_date", ago30.toISOString().slice(0, 10)).order("metric_date", { ascending: false }).limit(14);
    ctx.health_recent = health ?? [];
  }

  // Past unanswered AI questions to avoid repeats
  const { data: openQs } = await admin.from("ai_brief_questions").select("question").eq("user_id", userId).is("answered_at", null).order("asked_at", { ascending: false }).limit(5);
  ctx.open_questions = openQs ?? [];

  return ctx;
}

async function callLovableAI(scope: Scope, ctx: Record<string, unknown>) {
  const tools = [
    {
      type: "function",
      function: {
        name: "emit_brief",
        description: "Return the personalized brief for the user.",
        parameters: {
          type: "object",
          properties: {
            headline: { type: "string", description: "1 sentence punchy headline (max 80 chars)" },
            body: { type: "string", description: "2-4 sentence narrative tying patterns to recommendations." },
            actions: {
              type: "array",
              description: "1-3 concrete next-best actions.",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  reason: { type: "string" },
                  related_kind: { type: "string", enum: ["task", "goal", "transaction", "event", "account", "none"] },
                  related_id: { type: "string" },
                },
                required: ["label", "reason"],
                additionalProperties: false,
              },
            },
            clarifying_question: { type: "string", description: "Single question to ask the user. Empty string if none needed." },
            confidence: { type: "number", description: "0..1 confidence in the recommendation" },
          },
          required: ["headline", "body", "actions", "clarifying_question", "confidence"],
          additionalProperties: false,
        },
      },
    },
  ];

  const userMessage = `Scope: ${scope}\n\nContext:\n${JSON.stringify(ctx, null, 2)}\n\nGenerate the brief now via emit_brief.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      tools,
      tool_choice: { type: "function", function: { name: "emit_brief" } },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${text.slice(0, 200)}`);
  }

  const data = await resp.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) throw new Error("No tool call returned");
  return JSON.parse(toolCall.function.arguments);
}

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

    const { scope = "today", force = false } = await req.json().catch(() => ({}));
    if (!["today", "finance", "plan", "health"].includes(scope)) {
      return new Response(JSON.stringify({ error: "invalid scope" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Reuse cached brief if generated today and not forced
    if (!force) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: cached } = await admin
        .from("ai_briefs")
        .select("*")
        .eq("user_id", user.id)
        .eq("scope", scope)
        .eq("generated_for_date", today)
        .is("dismissed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cached) {
        return new Response(JSON.stringify({ brief: cached, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const ctx = await gatherContext(admin, user.id, scope as Scope);
    const result = await callLovableAI(scope as Scope, ctx);

    const { data: brief, error } = await admin.from("ai_briefs").insert({
      user_id: user.id,
      scope,
      headline: result.headline,
      body: result.body,
      actions: result.actions ?? [],
      confidence: result.confidence ?? 0.5,
      model: "google/gemini-2.5-flash",
    }).select().single();
    if (error) throw error;

    if (result.clarifying_question?.trim()) {
      await admin.from("ai_brief_questions").insert({
        user_id: user.id,
        brief_id: brief.id,
        question: result.clarifying_question.trim(),
        context: { scope },
      });
    }

    return new Response(JSON.stringify({ brief, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("ai-insights error", e);
    const msg = String(e?.message || e);
    const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
