import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logServiceUsage } from "../_shared/cost-tracking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, action } = await req.json();
    
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call Gemini via Lovable AI Gateway with tool calling
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
            content: `You are Cnergise, a helpful AI voice assistant for life management. Analyze the user's voice command and extract structured data.
The current date and time is ${new Date().toISOString()}.
You can help users:
- Create tasks with priorities and due dates
- Schedule calendar events
- Draft emails
- Set goals with categories (health, finance, career, personal, education)
- Log financial transactions

Always respond with a brief, friendly confirmation of what you're doing. If you're unsure about details, make reasonable assumptions based on context.`,
          },
          {
            role: "user",
            content: transcript,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_task",
              description: "Create a new task or to-do item",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "The task title" },
                  description: { type: "string", description: "Additional details about the task" },
                  priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority level" },
                  due_date: { type: "string", format: "date-time", description: "When the task is due" },
                },
                required: ["title"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "create_calendar_event",
              description: "Create a new calendar event or meeting",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Event title" },
                  description: { type: "string", description: "Event details" },
                  start_time: { type: "string", format: "date-time", description: "Event start time" },
                  end_time: { type: "string", format: "date-time", description: "Event end time" },
                  location: { type: "string", description: "Event location" },
                },
                required: ["title", "start_time", "end_time"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "create_email",
              description: "Create a draft email",
              parameters: {
                type: "object",
                properties: {
                  subject: { type: "string", description: "Email subject line" },
                  body: { type: "string", description: "Email body content" },
                  to_email: { type: "string", description: "Recipient email address" },
                },
                required: ["subject", "body", "to_email"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "create_goal",
              description: "Create a new personal goal",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Goal title" },
                  description: { type: "string", description: "Goal details" },
                  category: { type: "string", enum: ["health", "finance", "career", "personal", "education"], description: "Goal category" },
                  deadline: { type: "string", format: "date-time", description: "Target completion date" },
                },
                required: ["title", "category"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "general_response",
              description: "Provide a general helpful response when no specific action is needed",
              parameters: {
                type: "object",
                properties: {
                  message: { type: "string", description: "The helpful response message" },
                },
                required: ["message"],
              },
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const toolCalls = aiResponse.choices?.[0]?.message?.tool_calls;
    const assistantMessage = aiResponse.choices?.[0]?.message?.content || "";
    logServiceUsage({ service: "lovable-ai", operation: "google/gemini-3-flash-preview", units: Number(aiResponse?.usage?.total_tokens ?? 0) / 1000, function_name: "voice-assistant", metadata: { usage: aiResponse?.usage } });

    let actionResult = null;

    // Execute the tool call
    if (toolCalls && toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      if (functionName === "create_task") {
        const { data, error } = await supabase.from("tasks").insert({
          user_id: user.id,
          title: args.title,
          description: args.description,
          priority: args.priority || "medium",
          due_date: args.due_date,
        }).select().single();

        if (error) throw error;
        actionResult = { type: "task", data };
      } else if (functionName === "create_calendar_event") {
        const { data, error } = await supabase.from("calendar_events").insert({
          user_id: user.id,
          title: args.title,
          description: args.description,
          start_time: args.start_time,
          end_time: args.end_time,
          location: args.location,
        }).select().single();

        if (error) throw error;
        actionResult = { type: "calendar_event", data };
      } else if (functionName === "create_email") {
        const { data, error } = await supabase.from("emails").insert({
          user_id: user.id,
          subject: args.subject,
          body: args.body,
          to_email: args.to_email,
          status: "draft",
        }).select().single();

        if (error) throw error;
        actionResult = { type: "email", data };
      } else if (functionName === "create_goal") {
        const { data, error } = await supabase.from("goals").insert({
          user_id: user.id,
          title: args.title,
          description: args.description,
          category: args.category,
          deadline: args.deadline,
          status: "active",
          progress: 0,
        }).select().single();

        if (error) throw error;
        actionResult = { type: "goal", data };
      } else if (functionName === "general_response") {
        // No database action needed, just return the message
        actionResult = { type: "general", message: args.message };
      }
    }

    return new Response(
      JSON.stringify({
        response: assistantMessage,
        action: actionResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
