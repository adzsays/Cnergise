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
      // Poll for new SW every 60 minutes
      if (reg) {
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      }
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
