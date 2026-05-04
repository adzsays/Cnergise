// Cron-triggered: scans `reminders` table and delivers via in-app, web push, native push, email.
// Auto-generates reminders for upcoming tasks/events/payments based on user prefs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";
import { sendFcm } from "../_shared/fcm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUB = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIV = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUB = Deno.env.get("VAPID_SUBJECT") || "mailto:noreply@cnergise.com";

webpush.setVapidDetails(VAPID_SUB, VAPID_PUB, VAPID_PRIV);

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function generateReminders() {
  // Pull all users with prefs
  const { data: prefs } = await admin.from("notification_preferences").select("*");
  if (!prefs) return;

  const now = new Date();
  const horizon = new Date(now.getTime() + 1000 * 60 * 60 * 48); // next 48h

  for (const p of prefs) {
    // Tasks
    const { data: tasks } = await admin
      .from("tasks")
      .select("id,title,due_date")
      .eq("user_id", p.user_id)
      .neq("status", "done")
      .not("due_date", "is", null)
      .gte("due_date", now.toISOString())
      .lte("due_date", horizon.toISOString());
    for (const t of tasks ?? []) {
      const remindAt = new Date(new Date(t.due_date).getTime() - p.task_lead_minutes * 60000);
      if (remindAt < now) continue;
      await upsertReminder(p.user_id, "task", t.id, "tasks", `Task due: ${t.title}`, null, remindAt, p);
    }

    // Calendar events
    const { data: events } = await admin
      .from("calendar_events")
      .select("id,title,start_time,location")
      .eq("user_id", p.user_id)
      .is("deleted_at", null)
      .gte("start_time", now.toISOString())
      .lte("start_time", horizon.toISOString());
    for (const e of events ?? []) {
      const remindAt = new Date(new Date(e.start_time).getTime() - p.event_lead_minutes * 60000);
      if (remindAt < now) continue;
      await upsertReminder(p.user_id, "event", e.id, "calendar_events", `Upcoming: ${e.title}`, e.location, remindAt, p);
    }

    // Recurring transactions / payments due
    const { data: txns } = await admin
      .from("financial_transactions")
      .select("id,description,amount,date")
      .eq("user_id", p.user_id)
      .gte("date", now.toISOString().slice(0, 10))
      .lte("date", horizon.toISOString().slice(0, 10));
    for (const tx of txns ?? []) {
      const remindAt = new Date(new Date(tx.date).getTime() - p.payment_lead_minutes * 60000);
      if (remindAt < now) continue;
      await upsertReminder(
        p.user_id, "payment", tx.id, "financial_transactions",
        `Payment due: ${tx.description}`, `Amount: ${tx.amount}`, remindAt, p
      );
    }
  }
}

async function upsertReminder(
  userId: string, sourceType: string, sourceId: string, sourceTable: string,
  title: string, description: string | null, remindAt: Date, prefs: any,
) {
  // Skip if a reminder for this source already exists
  const { data: existing } = await admin
    .from("reminders")
    .select("id")
    .eq("user_id", userId)
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .maybeSingle();
  if (existing) return;

  const channels: string[] = [];
  if (prefs.in_app_enabled) channels.push("in_app");
  if (prefs.web_push_enabled) channels.push("web_push");
  if (prefs.native_push_enabled) channels.push("native_push");
  if (prefs.email_enabled) channels.push("email");

  await admin.from("reminders").insert({
    user_id: userId, source_type: sourceType, source_id: sourceId, source_table: sourceTable,
    title, description, remind_at: remindAt.toISOString(), channels,
  });
}

async function dispatchDue() {
  const { data: due } = await admin
    .from("reminders")
    .select("*")
    .is("sent_at", null)
    .lte("remind_at", new Date().toISOString())
    .limit(200);
  if (!due?.length) return { dispatched: 0 };

  let dispatched = 0;
  for (const r of due) {
    const status: any = {};

    // 1. In-app via unified_metadata notification
    if (r.channels.includes("in_app")) {
      const { error } = await admin.from("unified_metadata").insert({
        user_id: r.user_id,
        source_type: r.source_type,
        source_id: r.source_id,
        source_table: r.source_table,
        title: r.title,
        description: r.description,
        is_notification: true,
        notification_priority: "high",
        notification_read: false,
        date_occurred: r.remind_at,
      });
      status.in_app = error ? `err:${error.message}` : "ok";
    }

    // 2. Web push
    if (r.channels.includes("web_push")) {
      const { data: subs } = await admin
        .from("web_push_subscriptions")
        .select("*")
        .eq("user_id", r.user_id);
      let okCount = 0;
      for (const s of subs ?? []) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ title: r.title, body: r.description ?? "", url: r.external_url ?? "/" }),
          );
          okCount++;
        } catch (e: any) {
          if (e.statusCode === 404 || e.statusCode === 410) {
            await admin.from("web_push_subscriptions").delete().eq("id", s.id);
          }
        }
      }
      status.web_push = `${okCount}/${subs?.length ?? 0}`;
    }

    // 3. Native push (FCM HTTP v1)
    if (r.channels.includes("native_push")) {
      const { data: tokens } = await admin
        .from("device_push_tokens")
        .select("*")
        .eq("user_id", r.user_id);
      let okCount = 0;
      for (const t of tokens ?? []) {
        try {
          const res = await sendFcm(t.token, {
            title: r.title,
            body: r.description ?? "",
            data: {
              source_type: r.source_type ?? "",
              source_id: r.source_id ?? "",
              url: r.external_url ?? "/",
            },
          });
          if (res.ok) okCount++;
          else if (res.shouldRemoveToken) {
            await admin.from("device_push_tokens").delete().eq("id", t.id);
          }
        } catch (e) {
          console.error("FCM send error", e);
        }
      }
      status.native_push = `${okCount}/${tokens?.length ?? 0}`;
    }

    // 4. Email — enqueue via send-transactional-email
    if (r.channels.includes("email")) {
      try {
        const { data: profile } = await admin
          .from("profiles")
          .select("email,name")
          .eq("id", r.user_id)
          .maybeSingle();
        const { data: authUser } = await admin.auth.admin.getUserById(r.user_id);
        const to = profile?.email ?? authUser?.user?.email;
        if (to) {
          const resp = await fetch(
            `${SUPABASE_URL}/functions/v1/send-transactional-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SERVICE_KEY}`,
              },
              body: JSON.stringify({
                to,
                template: "reminder",
                purpose: "transactional",
                idempotency_key: `reminder:${r.id}`,
                variables: {
                  recipient_name: profile?.name ?? "there",
                  title: r.title,
                  description: r.description ?? "",
                  remind_at: r.remind_at,
                  source_type: r.source_type,
                  url: r.external_url ?? "",
                },
              }),
            },
          );
          status.email = resp.ok ? "queued" : `err:${resp.status}`;
        } else {
          status.email = "no_address";
        }
      } catch (e: any) {
        status.email = `err:${e.message}`;
      }
    }

    await admin.from("reminders").update({
      sent_at: new Date().toISOString(),
      delivery_status: status,
    }).eq("id", r.id);
    dispatched++;
  }
  return { dispatched };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    await generateReminders();
    const result = await dispatchDue();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
