// Public: fetch event type info by host handle + slug.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const handle = (url.searchParams.get("handle") || "").trim().toLowerCase();
    const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();
    if (!handle) return json({ error: "handle required" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: hostRows } = await admin.rpc("find_user_by_handle", { _handle: handle });
    const host = hostRows?.[0];
    if (!host) return json({ error: "not found" }, 404);

    let etQuery = admin.from("booking_event_types")
      .select("id, slug, title, description, duration_minutes, location_type, location_details, color, timezone, buffer_before_minutes, buffer_after_minutes, min_notice_minutes, max_advance_days")
      .eq("user_id", host.id)
      .eq("is_active", true);

    if (slug) {
      const { data: et } = await etQuery.eq("slug", slug).maybeSingle();
      if (!et) return json({ error: "event type not found" }, 404);
      const { data: questions } = await admin
        .from("booking_questions")
        .select("id, label, question_type, options, required, sort_order")
        .eq("event_type_id", et.id)
        .order("sort_order");
      return json({ host: { handle: host.handle, name: host.name, avatar_url: host.avatar_url }, eventType: et, questions: questions ?? [] });
    } else {
      const { data: types } = await etQuery.order("created_at");
      return json({ host: { handle: host.handle, name: host.name, avatar_url: host.avatar_url }, eventTypes: types ?? [] });
    }
  } catch (e) {
    return json({ error: "internal", detail: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
