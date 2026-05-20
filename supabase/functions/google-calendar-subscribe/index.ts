import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { calendars } = body as {
      calendars: Array<{
        account_id: string;
        google_calendar_id: string;
        summary?: string;
        backgroundColor?: string;
        foregroundColor?: string;
        primary?: boolean;
        enabled: boolean;
      }>;
    };

    if (!Array.isArray(calendars)) {
      return new Response(JSON.stringify({ error: "calendars[] required" }), { status: 400, headers: corsHeaders });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Validate all account_ids belong to this user
    const accountIds = Array.from(new Set(calendars.map((c) => c.account_id)));
    const { data: validAccounts } = await admin
      .from("google_calendar_connections")
      .select("id")
      .eq("user_id", user.id)
      .in("id", accountIds);
    const validIds = new Set((validAccounts ?? []).map((a: any) => a.id));

    for (const c of calendars) {
      if (!validIds.has(c.account_id)) continue;

      // Lookup existing
      const { data: existing } = await admin
        .from("google_calendar_subscriptions")
        .select("id")
        .eq("account_id", c.account_id)
        .eq("google_calendar_id", c.google_calendar_id)
        .maybeSingle();

      const payload = {
        user_id: user.id,
        account_id: c.account_id,
        google_calendar_id: c.google_calendar_id,
        summary: c.summary ?? null,
        background_color: c.backgroundColor ?? null,
        foreground_color: c.foregroundColor ?? null,
        is_primary: !!c.primary,
        enabled: c.enabled,
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        await admin.from("google_calendar_subscriptions").update(payload).eq("id", existing.id);
      } else {
        await admin.from("google_calendar_subscriptions").insert(payload);
      }

      if (!c.enabled) {
        await admin.from("calendar_events")
          .delete()
          .eq("user_id", user.id)
          .eq("google_calendar_id", c.google_calendar_id);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
