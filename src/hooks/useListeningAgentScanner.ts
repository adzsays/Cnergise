import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "cnergise_listening_agent_last_scan";
const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Periodically invokes the listening-agent-scan edge function while the user
 * is signed in. Honors the last-scan timestamp persisted in localStorage so we
 * don't double-scan after a tab reload.
 */
export function useListeningAgentScanner() {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const scan = async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user || cancelled) return;
        const last = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
        if (Date.now() - last < INTERVAL_MS) return;
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        await supabase.functions.invoke("listening-agent-scan", { body: {} });
      } catch (e) {
        // silent
        console.warn("listening-agent-scan invoke failed", e);
      }
    };

    // initial run shortly after login
    const t0 = window.setTimeout(scan, 4000);
    timerRef.current = window.setInterval(scan, INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(t0);
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);
}

export default useListeningAgentScanner;
