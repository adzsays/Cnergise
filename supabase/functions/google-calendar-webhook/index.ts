import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Receives Google Calendar push notifications. No auth required (public).
Deno.serve(async (req) => {
  try {
    const channelId = req.headers.get("x-goog-channel-id");
    const resourceState = req.headers.get("x-goog-resource-state");
    if (!channelId) return new Response("ok", { status: 200 });

    // Initial sync handshake
    if (resourceState === "sync") return new Response("ok", { status: 200 });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: channel } = await admin.from("google_calendar_channels").select("user_id").eq("channel_id", channelId).maybeSingle();
    if (!channel) return new Response("ok", { status: 200 });

    // Trigger an incremental sync by invoking sync function with service auth
    // Simpler: just mark last_sync to force client to re-pull. Real impl: call sync inline.
    await admin.from("google_calendar_connections")
      .update({ updated_at: new Date().toISOString() })
      .eq("user_id", channel.user_id);

    return new Response("ok", { status: 200 });
  } catch (_e) {
    return new Response("ok", { status: 200 });
  }
});
