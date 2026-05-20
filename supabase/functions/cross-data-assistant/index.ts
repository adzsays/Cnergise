// Cross-data AI assistant: chat with tool-calling over the user's own data.
// Uses Lovable AI (gemini-3-flash-preview) — cheap & fast.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { logServiceUsage } from "../_shared/cost-tracking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const MODEL = "google/gemini-3-flash-preview";

const SYSTEM_PROMPT = `You are Cnergise, the user's personal cross-data assistant.
You can answer questions that span tasks, projects, goals, calendar events, finance transactions, accounts, and health metrics — all belonging to the signed-in user.
- Use the provided tools to fetch fresh data. Do NOT invent figures.
- Prefer 1–2 tool calls; combine context before answering.
- Reply concisely (≤6 sentences) with concrete numbers, dates, names.
- Currency: GBP unless data says otherwise.
- If data is missing, say so plainly.`;

const tools = [
  {
    type: "function",
    function: {
      name: "query_tasks",
      description: "Fetch user's tasks. Filter by status/priority/due window.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["todo", "in_progress", "done", "any"] },
          priority: { type: "string", enum: ["low", "medium", "high", "any"] },
          due_within_days: { type: "number", description: "Only tasks due in next N days" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_projects",
      description: "Fetch user's projects with progress.",
      parameters: { type: "object", properties: { limit: { type: "number" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "query_goals",
      description: "Fetch user's goals.",
      parameters: { type: "object", properties: { limit: { type: "number" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "query_calendar",
      description: "Fetch upcoming or past calendar events.",
      parameters: {
        type: "object",
        properties: {
          days_ahead: { type: "number", description: "Look ahead N days from now (default 7)" },
          days_behind: { type: "number", description: "Look back N days (default 0)" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_transactions",
      description: "Fetch finance transactions, optionally filtered by category or date range.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string" },
          since_days: { type: "number", description: "Last N days (default 30)" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_accounts",
      description: "Fetch user's finance accounts and balances.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "query_health",
      description: "Fetch recent health metrics (steps, sleep, etc).",
      parameters: {
        type: "object",
        properties: {
          since_days: { type: "number", description: "Last N days (default 7)" },
          metric: { type: "string", description: "Optional metric name filter" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "summarize_finance",
      description: "Aggregate income, expenses, net for a period.",
      parameters: {
        type: "object",
        properties: { since_days: { type: "number", description: "Default 30" } },
      },
    },
  },
];

async function runTool(name: string, args: any, admin: any, userId: string) {
  const limit = Math.min(args?.limit ?? 25, 100);
  switch (name) {
    case "query_tasks": {
      let q = admin.from("tasks").select("id,title,status,priority,due_date,project_id").eq("user_id", userId);
      if (args?.status && args.status !== "any") q = q.eq("status", args.status);
      if (args?.priority && args.priority !== "any") q = q.eq("priority", args.priority);
      if (args?.due_within_days) {
        const end = new Date(Date.now() + args.due_within_days * 86400000).toISOString();
        q = q.lte("due_date", end).gte("due_date", new Date().toISOString());
      }
      const { data } = await q.limit(limit);
      return data ?? [];
    }
    case "query_projects": {
      const { data } = await admin.from("projects").select("id,name,status,progress,due_date").eq("user_id", userId).limit(limit);
      return data ?? [];
    }
    case "query_goals": {
      const { data } = await admin.from("goals").select("id,title,status,target_date,progress").eq("user_id", userId).limit(limit);
      return data ?? [];
    }
    case "query_calendar": {
      const ahead = args?.days_ahead ?? 7;
      const behind = args?.days_behind ?? 0;
      const start = new Date(Date.now() - behind * 86400000).toISOString();
      const end = new Date(Date.now() + ahead * 86400000).toISOString();
      const { data } = await admin.from("calendar_events")
        .select("id,title,start_time,end_time,location")
        .eq("user_id", userId).gte("start_time", start).lte("start_time", end)
        .order("start_time").limit(limit);
      return data ?? [];
    }
    case "query_transactions": {
      const since = new Date(Date.now() - (args?.since_days ?? 30) * 86400000).toISOString().slice(0, 10);
      let q = admin.from("transactions")
        .select("id,date,amount,description,category,type")
        .eq("user_id", userId).gte("date", since).order("date", { ascending: false });
      if (args?.category) q = q.ilike("category", `%${args.category}%`);
      const { data } = await q.limit(limit);
      return data ?? [];
    }
    case "query_accounts": {
      const { data } = await admin.from("accounts").select("id,name,type,balance,currency").eq("user_id", userId);
      return data ?? [];
    }
    case "query_health": {
      const since = new Date(Date.now() - (args?.since_days ?? 7) * 86400000).toISOString().slice(0, 10);
      let q = admin.from("health_metrics")
        .select("metric_date,metric_name,value,unit").eq("user_id", userId)
        .gte("metric_date", since).order("metric_date", { ascending: false });
      if (args?.metric) q = q.ilike("metric_name", `%${args.metric}%`);
      const { data } = await q.limit(limit);
      return data ?? [];
    }
    case "summarize_finance": {
      const since = new Date(Date.now() - (args?.since_days ?? 30) * 86400000).toISOString().slice(0, 10);
      const { data } = await admin.from("transactions").select("amount,type").eq("user_id", userId).gte("date", since);
      let income = 0, expense = 0;
      for (const t of data ?? []) {
        const amt = Number(t.amount) || 0;
        if (t.type === "income" || amt > 0) income += Math.abs(amt);
        else expense += Math.abs(amt);
      }
      return { since_days: args?.since_days ?? 30, income, expense, net: income - expense, count: data?.length ?? 0 };
    }
  }
  return { error: `unknown tool ${name}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const started = Date.now();
  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { messages: rawMessages = [] } = await req.json();
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Sanitize: only allow user/assistant roles, strip extra fields, enforce limits
    const safeMessages = (Array.isArray(rawMessages) ? rawMessages : [])
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20)
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));

    const convo: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...safeMessages,
    ];

    let finalText = "";
    let toolsUsed: string[] = [];
    for (let step = 0; step < 4; step++) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages: convo, tools, tool_choice: "auto" }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please retry shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI gateway ${resp.status}: ${t.slice(0, 200)}`);
      }
      const data = await resp.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) break;
      const calls = msg.tool_calls;
      if (calls?.length) {
        convo.push(msg);
        for (const c of calls) {
          const args = JSON.parse(c.function.arguments || "{}");
          toolsUsed.push(c.function.name);
          const result = await runTool(c.function.name, args, admin, user.id);
          convo.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(result).slice(0, 8000) });
        }
        continue;
      }
      finalText = msg.content || "";
      break;
    }

    await logServiceUsage({
      service: "lovable-ai",
      operation: MODEL,
      function_name: "cross-data-assistant",
      user_id: user.id,
      metadata: { tools: toolsUsed, duration_ms: Date.now() - started },
    }).catch(() => {});

    return new Response(JSON.stringify({ reply: finalText, tools_used: toolsUsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cross-data-assistant error", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
