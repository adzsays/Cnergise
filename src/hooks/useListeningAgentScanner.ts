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
    // Auto-scan disabled to avoid unnecessary AI costs.
    // Listening Agent now only runs when explicitly triggered from its settings UI.
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);
}

export default useListeningAgentScanner;
