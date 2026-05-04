// Public visitor chat endpoint with AI response and human handoff support.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are the friendly AI assistant for Cnergise — an AI-powered personal life OS that unifies finance, health, calendar, tasks, goals, learning, portfolio, and communications, then synthesises them with AI to suggest the next best action.

Be concise (2-4 sentences max), warm, and helpful. If a visitor asks something you can't confidently answer (pricing details, custom enterprise setup, partnership, account-specific issues), tell them you'll loop in a human and that they can leave their email so the team can follow up. Do NOT make up pricing, timelines, or features that aren't obviously generic.

Key facts you can mention:
- Cnergise is invite-only right now
- Bank sync via Open Banking, Google Calendar, Gmail/Outlook, Samsung/Apple Health, IBKR portfolio, and more
- Voice capture (Echo) turns spoken thoughts into structured tasks/goals/events
- AI generates a daily personalised brief and asks intelligent follow-up questions to learn the user
- PWA + native iOS/Android wrappers
- Default currency GBP

Keep replies short. Use markdown sparingly.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const action = body.action as string;

    if (action === "start") {
      const session_token = crypto.randomUUID();
      const { data, error } = await sb
        .from("visitor_chat_sessions")
        .insert({
          session_token,
          visitor_name: body.name ?? null,
          visitor_email: body.email ?? null,
          page_url: body.page_url ?? null,
          user_agent: req.headers.get("user-agent") ?? null,
        })
        .select("id, session_token, status")
        .single();
      if (error) throw error;
      // greet
      await sb.from("visitor_chat_messages").insert({
        session_id: data.id,
        role: "assistant",
        content: "Hi 👋 I'm Cnergise's AI assistant. Ask me anything — pricing, features, integrations. I'll loop in a human if I can't help.",
      });
      return json({ session_id: data.id, session_token: data.session_token, status: data.status });
    }

    if (action === "history") {
      const token = body.session_token as string;
      const { data: sess } = await sb
        .from("visitor_chat_sessions")
        .select("id, status")
        .eq("session_token", token)
        .maybeSingle();
      if (!sess) return json({ error: "session not found" }, 404);
      const { data: msgs } = await sb
        .from("visitor_chat_messages")
        .select("id, role, content, created_at")
        .eq("session_id", sess.id)
        .order("created_at");
      return json({ session_id: sess.id, status: sess.status, messages: msgs ?? [] });
    }

    if (action === "send") {
      const token = body.session_token as string;
      const content = String(body.content ?? "").slice(0, 4000);
      if (!token || !content.trim()) return json({ error: "missing fields" }, 400);

      const { data: sess } = await sb
        .from("visitor_chat_sessions")
        .select("id, status, visitor_email")
        .eq("session_token", token)
        .maybeSingle();
      if (!sess) return json({ error: "session not found" }, 404);

      // optionally update email
      if (body.email && !sess.visitor_email) {
        await sb.from("visitor_chat_sessions").update({ visitor_email: body.email }).eq("id", sess.id);
      }

      await sb.from("visitor_chat_messages").insert({
        session_id: sess.id,
        role: "visitor",
        content,
      });
      await sb
        .from("visitor_chat_sessions")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", sess.id);

      // If a human has taken over, do not respond with AI
      if (sess.status === "human") {
        return json({ ok: true, ai_replied: false });
      }

      // build conversation context
      const { data: history } = await sb
        .from("visitor_chat_messages")
        .select("role, content")
        .eq("session_id", sess.id)
        .order("created_at")
        .limit(30);

      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(history ?? []).map((m: any) => ({
          role: m.role === "visitor" ? "user" : m.role === "admin" ? "assistant" : m.role,
          content: m.content,
        })),
      ];

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages,
        }),
      });

      if (!aiResp.ok) {
        const txt = await aiResp.text();
        console.error("AI gateway error", aiResp.status, txt);
        const fallback = "I'm having trouble right now. Leave your email and a human will reach out shortly.";
        await sb.from("visitor_chat_messages").insert({
          session_id: sess.id,
          role: "assistant",
          content: fallback,
        });
        return json({ ok: true, ai_replied: true, content: fallback });
      }

      const ai = await aiResp.json();
      const reply = ai?.choices?.[0]?.message?.content ?? "Thanks — let me check on that.";
      await sb.from("visitor_chat_messages").insert({
        session_id: sess.id,
        role: "assistant",
        content: reply,
      });
      return json({ ok: true, ai_replied: true, content: reply });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error("visitor-chat error", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
