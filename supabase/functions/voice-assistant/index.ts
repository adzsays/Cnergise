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

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
    }

    // Call Perplexity API for voice command processing
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are Cnergise, a helpful AI voice assistant for life management. Analyze the user's voice command and extract structured data.
The current date and time is ${new Date().toISOString()}.

You MUST respond with valid JSON only. No markdown, no explanation. Use this exact format:
{
  "action": "create_task" | "create_calendar_event" | "create_email" | "create_goal" | "general_response",
  "message": "Your friendly confirmation message",
  "data": { ... action-specific data ... }
}

For create_task, data should include: title (required), description, priority (low/medium/high), due_date (ISO datetime)
For create_calendar_event, data should include: title (required), description, start_time (required, ISO datetime), end_time (required, ISO datetime), location
For create_email, data should include: subject (required), body (required), to_email (required)
For create_goal, data should include: title (required), category (required: health/finance/career/personal/education), description, deadline (ISO datetime)
For general_response, data should include: message (the helpful response)

Always make reasonable assumptions based on context. If user says "tomorrow", calculate the actual date.`,
          },
          {
            role: "user",
            content: transcript,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse the JSON response from Perplexity
    let parsedResponse;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
      return new Response(
        JSON.stringify({
          response: "I understood your request but had trouble processing it. Could you try again?",
          action: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action: actionType, message, data } = parsedResponse;
    let actionResult = null;

    // Execute the action
    if (actionType === "create_task" && data) {
      const { data: taskData, error } = await supabase.from("tasks").insert({
        user_id: user.id,
        title: data.title,
        description: data.description,
        priority: data.priority || "medium",
        due_date: data.due_date,
      }).select().single();

      if (error) throw error;
      actionResult = { type: "task", data: taskData };
    } else if (actionType === "create_calendar_event" && data) {
      const { data: eventData, error } = await supabase.from("calendar_events").insert({
        user_id: user.id,
        title: data.title,
        description: data.description,
        start_time: data.start_time,
        end_time: data.end_time,
        location: data.location,
      }).select().single();

      if (error) throw error;
      actionResult = { type: "calendar_event", data: eventData };
    } else if (actionType === "create_email" && data) {
      const { data: emailData, error } = await supabase.from("emails").insert({
        user_id: user.id,
        subject: data.subject,
        body: data.body,
        to_email: data.to_email,
        status: "draft",
      }).select().single();

      if (error) throw error;
      actionResult = { type: "email", data: emailData };
    } else if (actionType === "create_goal" && data) {
      const { data: goalData, error } = await supabase.from("goals").insert({
        user_id: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        deadline: data.deadline,
        status: "active",
        progress: 0,
      }).select().single();

      if (error) throw error;
      actionResult = { type: "goal", data: goalData };
    } else if (actionType === "general_response") {
      actionResult = { type: "general", message: data?.message || message };
    }

    return new Response(
      JSON.stringify({
        response: message,
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
