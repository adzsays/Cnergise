import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { syncAllForUser } from "../_shared/google-calendar-sync-core.ts";

// Receives Google Calendar push notifications. Public endpoint, but we
// verify x-goog-channel-token (HMAC of channel_id) to confirm the request
// came from Google using a channel we registered. On valid push, immediately
// runs sync for the owning user so changes appear in seconds.
Deno.serve(async (req) => {
  try {
    const channelId = req.headers.get("x-goog-channel-id");
    const channelToken = req.headers.get("x-goog-channel-token");
    const resourceState = req.headers.get("x-goog-resource-state");
    if (!channelId || !channelToken) return new Response("ok", { status: 200 });

    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    let sigBytes: Uint8Array;
    try {
      sigBytes = Uint8Array.from(atob(channelToken), (c) => c.charCodeAt(0));
    } catch {
      return new Response("ok", { status: 200 });
    }
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(channelId));
    if (!valid) return new Response("ok", { status: 200 });

    if (resourceState === "sync") return new Response("ok", { status: 200 });
    if (resourceState && !["exists", "update", "change"].includes(resourceState)) {
      return new Response("ok", { status: 200 });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: channel } = await admin.from("google_calendar_channels").select("user_id").eq("channel_id", channelId).maybeSingle();
    if (!channel) return new Response("ok", { status: 200 });

    // Fire-and-forget — Google requires fast 200 response.
    syncAllForUser(admin, channel.user_id).catch((e) => console.error("webhook sync error", e));

    return new Response("ok", { status: 200 });
  } catch (_e) {
    return new Response("ok", { status: 200 });
  }
});
