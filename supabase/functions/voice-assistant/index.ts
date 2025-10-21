import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "",
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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a helpful voice assistant. Analyze the user's voice command and extract structured data.
The current date and time is ${new Date().toISOString()}.
Extract tasks, calendar events, or email information from the user's request.`,
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
              description: "Create a new task",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string", enum: ["low", "medium", "high"] },
                  due_date: { type: "string", format: "date-time" },
                },
                required: ["title"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "create_calendar_event",
              description: "Create a new calendar event",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  start_time: { type: "string", format: "date-time" },
                  end_time: { type: "string", format: "date-time" },
                  location: { type: "string" },
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
                  subject: { type: "string" },
                  body: { type: "string" },
                  to_email: { type: "string" },
                },
                required: ["subject", "body", "to_email"],
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});