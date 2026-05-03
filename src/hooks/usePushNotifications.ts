import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

const VAPID_PUBLIC_KEY = "BEhz_dp4hzCimOOdsMS4N14fh3YcICGt40T8gKi2dd9HqCHGshDK4AWPzf7ROian_b1-LE42T40TWzeGOjRs7Us";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [isNative] = useState(Capacitor.isNativePlatform());

  const enable = useCallback(async () => {
    // Native (Capacitor) push
    if (isNative) {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== "granted") return false;
        await PushNotifications.register();
        PushNotifications.addListener("registration", async (token) => {
          await supabase.functions.invoke("register-push-subscription", {
            body: {
              type: "native",
              token: token.value,
              platform: Capacitor.getPlatform(),
              deviceLabel: navigator.userAgent.slice(0, 80),
            },
          });
        });
        return true;
      } catch (e) { console.error(e); return false; }
    }

    // Web push
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") return false;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const json = sub.toJSON();
    await supabase.functions.invoke("register-push-subscription", {
      body: {
        type: "web",
        endpoint: json.endpoint,
        keys: json.keys,
        userAgent: navigator.userAgent.slice(0, 200),
      },
    });
    return true;
  }, [isNative]);

  return { permission, enable, isNative };
}
