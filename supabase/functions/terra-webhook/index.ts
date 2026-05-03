// Terra webhook receiver
// Public endpoint — Terra signs payloads with TERRA_SIGNING_SECRET (HMAC SHA256)
// Docs: https://docs.tryterra.co/reference/webhook-signing
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, terra-signature",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyTerraSignature(header: string | null, body: string, secret: string): Promise<boolean> {
  if (!header) return false;
  // Header format: "t=<timestamp>,v1=<signature>"
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    }),
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  const expected = await hmacHex(secret, `${t}.${body}`);
  return timingSafeEqual(expected, v1);
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function pickDate(d: any): string | null {
  const raw = d?.metadata?.start_time || d?.metadata?.end_time || d?.metadata?.summary_date || d?.timestamp;
  if (!raw) return null;
  return new Date(raw).toISOString().slice(0, 10);
}

async function upsertDailyRow(userId: string, provider: string, daily: any) {
  const date = pickDate(daily);
  if (!date) return;
  const row = {
    user_id: userId,
    source: "terra",
    provider,
    metric_date: date,
    steps: daily?.distance_data?.steps ?? daily?.steps ?? null,
    distance_meters: daily?.distance_data?.distance_meters ?? null,
    calories_burned: daily?.calories_data?.total_burned_calories ?? null,
    active_minutes: daily?.active_durations_data?.activity_seconds
      ? Math.round(daily.active_durations_data.activity_seconds / 60)
      : null,
    resting_heart_rate: daily?.heart_rate_data?.summary?.resting_hr_bpm ?? null,
    avg_heart_rate: daily?.heart_rate_data?.summary?.avg_hr_bpm ?? null,
    max_heart_rate: daily?.heart_rate_data?.summary?.max_hr_bpm ?? null,
    raw: daily,
  };
  await supabase
    .from("health_metrics")
    .upsert(row, { onConflict: "user_id,source,provider,metric_date" });
}

async function upsertSleepRow(userId: string, provider: string, sleep: any) {
  const date = pickDate(sleep);
  if (!date) return;
  const minutes = sleep?.sleep_durations_data?.asleep?.duration_asleep_state_seconds
    ? Math.round(sleep.sleep_durations_data.asleep.duration_asleep_state_seconds / 60)
    : null;
  await supabase.from("health_metrics").upsert(
    {
      user_id: userId,
      source: "terra",
      provider,
      metric_date: date,
      sleep_minutes: minutes,
      sleep_quality: sleep?.sleep_durations_data?.sleep_efficiency ?? null,
      raw: { sleep },
    },
    { onConflict: "user_id,source,provider,metric_date" },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const body = await req.text();
  const signingSecret = Deno.env.get("TERRA_SIGNING_SECRET");
  if (!signingSecret) {
    console.error("terra-webhook: TERRA_SIGNING_SECRET not configured — refusing request");
    return new Response(JSON.stringify({ error: "Webhook not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const ok = await verifyTerraSignature(req.headers.get("terra-signature"), body, signingSecret);
  if (!ok) {
    console.warn("terra-webhook: invalid signature");
    return new Response(JSON.stringify({ error: "invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: "bad json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("terra-webhook type:", payload?.type, "user:", payload?.user?.user_id);

  try {
    const type = payload?.type;
    const terraUserId = payload?.user?.user_id;
    const provider = (payload?.user?.provider || "unknown").toLowerCase();
    const referenceId = payload?.user?.reference_id;

    // Resolve our internal user via terra_connections
    let userId: string | null = null;
    if (terraUserId) {
      const { data } = await supabase
        .from("terra_connections")
        .select("user_id")
        .eq("terra_user_id", terraUserId)
        .maybeSingle();
      userId = data?.user_id ?? null;
    }
    if (!userId && referenceId) {
      const { data } = await supabase
        .from("terra_connections")
        .select("user_id")
        .eq("reference_id", referenceId)
        .maybeSingle();
      userId = data?.user_id ?? null;
    }

    // Handle auth event: user just connected — link terra_user_id
    if (type === "auth" && referenceId && terraUserId) {
      await supabase
        .from("terra_connections")
        .update({
          terra_user_id: terraUserId,
          provider,
          status: "active",
          last_webhook_at: new Date().toISOString(),
        })
        .eq("reference_id", referenceId);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!userId) {
      console.warn("terra-webhook: no matching user for", terraUserId, referenceId);
      return new Response(JSON.stringify({ ok: true, skipped: "no user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "daily" && Array.isArray(payload.data)) {
      for (const d of payload.data) await upsertDailyRow(userId, provider, d);
    } else if (type === "sleep" && Array.isArray(payload.data)) {
      for (const s of payload.data) await upsertSleepRow(userId, provider, s);
    } else if (type === "activity" && Array.isArray(payload.data)) {
      for (const a of payload.data) await upsertDailyRow(userId, provider, a);
    } else if (type === "body" && Array.isArray(payload.data)) {
      for (const b of payload.data) {
        const date = pickDate(b);
        if (!date) continue;
        await supabase.from("health_metrics").upsert(
          {
            user_id: userId,
            source: "terra",
            provider,
            metric_date: date,
            weight_kg: b?.measurements_data?.measurements?.[0]?.weight_kg ?? null,
            raw: { body: b },
          },
          { onConflict: "user_id,source,provider,metric_date" },
        );
      }
    }

    await supabase
      .from("terra_connections")
      .update({ last_webhook_at: new Date().toISOString(), last_sync_at: new Date().toISOString() })
      .eq("user_id", userId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("terra-webhook error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
