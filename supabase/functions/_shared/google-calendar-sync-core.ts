// Shared Google Calendar sync core. Used by:
//   - google-calendar-sync (interactive, per-user)
//   - google-calendar-cron  (every 5 min, all users)
//   - google-calendar-webhook (push notification fan-out)

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, json };
}

export async function ensureValidToken(admin: any, conn: any) {
  if (new Date(conn.token_expires_at).getTime() < Date.now() + 60_000) {
    if (!conn.refresh_token) throw new Error("REAUTH_REQUIRED:no_refresh_token");
    const r = await refreshAccessToken(conn.refresh_token);
    if (!r.ok || !r.json?.access_token) {
      const errCode = r.json?.error || "unknown";
      await admin.from("google_calendar_connections").update({
        last_sync_error: `Token refresh failed: ${errCode} (${r.status})`,
      }).eq("id", conn.id);
      throw new Error(`REAUTH_REQUIRED:${errCode}`);
    }
    const newExpiry = new Date(Date.now() + (r.json.expires_in ?? 3600) * 1000).toISOString();
    await admin.from("google_calendar_connections").update({
      access_token: r.json.access_token,
      token_expires_at: newExpiry,
      last_sync_error: null,
    }).eq("id", conn.id);
    return { ...conn, access_token: r.json.access_token };
  }
  return conn;
}

async function syncCalendar(admin: any, userId: string, accessToken: string, calendarId: string, syncToken: string | null) {
  const params = new URLSearchParams({ singleEvents: "true", maxResults: "250" });
  if (syncToken) params.set("syncToken", syncToken);
  else {
    params.set("timeMin", new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString());
    params.set("timeMax", new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString());
    params.set("orderBy", "startTime");
  }

  let pageToken: string | null = null;
  let nextSyncToken: string | null = null;
  let synced = 0, deleted = 0, resetSync = false;

  do {
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 410) { resetSync = true; break; }
    const data = await res.json();
    if (!res.ok) throw new Error(`${calendarId}: ${JSON.stringify(data)}`);

    for (const ev of data.items ?? []) {
      if (ev.status === "cancelled") {
        await admin.from("calendar_events")
          .update({ deleted_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("google_calendar_id", calendarId)
          .eq("google_event_id", ev.id);
        deleted++;
        continue;
      }
      const startTime = ev.start?.dateTime || ev.start?.date;
      const endTime = ev.end?.dateTime || ev.end?.date;
      if (!startTime || !endTime) continue;
      const eventPayload = {
        user_id: userId,
        title: ev.summary || "(no title)",
        description: ev.description || null,
        location: ev.location || null,
        start_time: startTime,
        end_time: endTime,
        all_day: !!ev.start?.date,
        google_event_id: ev.id,
        google_calendar_id: calendarId,
        etag: ev.etag,
        sync_source: "google",
        last_synced_at: new Date().toISOString(),
        deleted_at: null,
      };

      const { data: existingEvent } = await admin
        .from("calendar_events")
        .select("id")
        .eq("user_id", userId)
        .eq("google_calendar_id", calendarId)
        .eq("google_event_id", ev.id)
        .maybeSingle();

      const { error: saveError } = existingEvent?.id
        ? await admin.from("calendar_events").update(eventPayload).eq("id", existingEvent.id)
        : await admin.from("calendar_events").insert(eventPayload);
      if (saveError) throw saveError;
      synced++;
    }

    pageToken = data.nextPageToken ?? null;
    if (data.nextSyncToken) nextSyncToken = data.nextSyncToken;
  } while (pageToken);

  return { synced, deleted, nextSyncToken, resetSync };
}

export async function syncAllForUser(admin: any, userId: string) {
  const { data: connections } = await admin
    .from("google_calendar_connections_decrypted")
    .select("*")
    .eq("user_id", userId);

  if (!connections || connections.length === 0) {
    return { synced: 0, deleted: 0, accounts: 0, errors: [] as any[], reauthRequired: [] as string[] };
  }

  let totalSynced = 0, totalDeleted = 0;
  const accountErrors: Array<{ email: string; reauth: boolean; message: string }> = [];

  for (const rawConn of connections) {
    try {
      const conn = await ensureValidToken(admin, rawConn);

      let { data: subs } = await admin
        .from("google_calendar_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("account_id", conn.id)
        .eq("enabled", true);

      if (!subs || subs.length === 0) {
        await admin.from("google_calendar_subscriptions").insert({
          user_id: userId,
          account_id: conn.id,
          google_calendar_id: "primary",
          summary: conn.google_email || "Primary",
          is_primary: true,
          enabled: true,
        });
        subs = [{ google_calendar_id: "primary", sync_token: null, account_id: conn.id }];
      }

      for (const sub of subs) {
        try {
          const { count } = await admin
            .from("calendar_events")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("google_calendar_id", sub.google_calendar_id)
            .is("deleted_at", null);

          const effectiveSyncToken = count && count > 0 ? sub.sync_token : null;
          const result = await syncCalendar(admin, userId, conn.access_token, sub.google_calendar_id, effectiveSyncToken);
          totalSynced += result.synced;
          totalDeleted += result.deleted;

          if (result.resetSync) {
            const retry = await syncCalendar(admin, userId, conn.access_token, sub.google_calendar_id, null);
            totalSynced += retry.synced;
            totalDeleted += retry.deleted;
            if (retry.nextSyncToken) {
              await admin.from("google_calendar_subscriptions")
                .update({ sync_token: retry.nextSyncToken, last_sync_at: new Date().toISOString() })
                .eq("account_id", conn.id)
                .eq("google_calendar_id", sub.google_calendar_id);
            }
          } else if (result.nextSyncToken) {
            await admin.from("google_calendar_subscriptions")
              .update({ sync_token: result.nextSyncToken, last_sync_at: new Date().toISOString() })
              .eq("account_id", conn.id)
              .eq("google_calendar_id", sub.google_calendar_id);
          }
        } catch (err) {
          console.error("Calendar sync error", conn.google_email, sub.google_calendar_id, err);
        }
      }

      await admin.from("google_calendar_connections")
        .update({ last_sync_at: new Date().toISOString(), last_sync_error: null })
        .eq("id", conn.id);
    } catch (err) {
      const msg = String((err as Error)?.message || err);
      const reauth = msg.startsWith("REAUTH_REQUIRED");
      console.error("Account sync error", rawConn.google_email, msg);
      accountErrors.push({ email: rawConn.google_email, reauth, message: msg });
    }
  }

  return {
    synced: totalSynced,
    deleted: totalDeleted,
    accounts: connections.length,
    errors: accountErrors,
    reauthRequired: accountErrors.filter((e) => e.reauth).map((e) => e.email),
  };
}

// Renew watch channels expiring within 24h. Re-registers and removes the old row.
export async function renewExpiringChannels(admin: any) {
  const cutoff = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  const { data: channels } = await admin
    .from("google_calendar_channels")
    .select("*")
    .lt("expiration", cutoff);

  let renewed = 0;
  for (const ch of channels ?? []) {
    try {
      const { data: rawConn } = await admin
        .from("google_calendar_connections")
        .select("*")
        .eq("user_id", ch.user_id)
        .eq("id", ch.account_id)
        .maybeSingle();
      const conn = rawConn ?? (await admin
        .from("google_calendar_connections").select("*").eq("user_id", ch.user_id).maybeSingle()).data;
      if (!conn) continue;
      const valid = await ensureValidToken(admin, conn);

      const channelId = crypto.randomUUID();
      const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-webhook`;
      const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(channelId));
      const channelToken = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));

      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(ch.calendar_id)}/events/watch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${valid.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: channelId, type: "web_hook", address: webhookUrl, token: channelToken }),
      });
      const data = await res.json();
      if (!res.ok) { console.error("renew channel failed", ch.calendar_id, data); continue; }

      await admin.from("google_calendar_channels").insert({
        user_id: ch.user_id,
        account_id: ch.account_id,
        channel_id: channelId,
        resource_id: data.resourceId,
        calendar_id: ch.calendar_id,
        expiration: new Date(parseInt(data.expiration)).toISOString(),
      });
      await admin.from("google_calendar_channels").delete().eq("id", ch.id);
      renewed++;
    } catch (e) {
      console.error("renew error", ch.calendar_id, e);
    }
  }
  return { renewed, candidates: channels?.length ?? 0 };
}
