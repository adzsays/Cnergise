import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, reg) {
      if (!reg) return;
      // Immediate check on startup
      reg.update().catch(() => {});
      // Poll every 5 minutes while app is open
      setInterval(() => reg.update().catch(() => {}), 5 * 60 * 1000);
      // Re-check whenever the app regains focus or becomes visible
      const check = () => reg.update().catch(() => {});
      window.addEventListener("focus", check);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    toast("A new version of Cnergise is available", {
      duration: Infinity,
      action: (
        <Button
          size="sm"
          onClick={() => {
            setNeedRefresh(false);
            updateServiceWorker(true);
          }}
        >
          Update
        </Button>
      ),
    });
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}
