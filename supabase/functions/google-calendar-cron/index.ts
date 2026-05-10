import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { syncAllForUser, renewExpiringChannels } from "../_shared/google-calendar-sync-core.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Cron-triggered. Iterates every connected user, runs sync, renews channels.
// Auth: shared secret in x-cron-secret header (vault: cnergise_cron_secret).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const provided = req.headers.get("x-cron-secret") || "";
    const { data: secretRow } = await admin.rpc("get_cron_secret");
    const expected = (secretRow as string | null) || "";
    if (!expected || provided !== expected) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: corsHeaders });
    }

    const { data: users } = await admin
      .from("google_calendar_connections")
      .select("user_id");
    const uniqueUsers = [...new Set((users ?? []).map((u: any) => u.user_id))];

    let totalSynced = 0, totalDeleted = 0;
    const errors: any[] = [];
    for (const uid of uniqueUsers) {
      try {
        const r = await syncAllForUser(admin, uid);
        totalSynced += r.synced;
        totalDeleted += r.deleted;
        if (r.errors.length) errors.push({ user_id: uid, errors: r.errors });
      } catch (e) {
        errors.push({ user_id: uid, error: String(e) });
      }
    }

    const renewal = await renewExpiringChannels(admin);

    return new Response(JSON.stringify({
      users: uniqueUsers.length,
      synced: totalSynced,
      deleted: totalDeleted,
      renewed: renewal.renewed,
      errors,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
