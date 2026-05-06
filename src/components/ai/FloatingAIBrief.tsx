import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIBriefCard } from "./AIBriefCard";

type Scope = "today" | "finance" | "plan" | "health";

/**
 * Floating, dismissible AI brief suggestion bubble.
 * Sits bottom-left so it doesn't collide with the voice assistant (bottom-right).
 * Collapsed by default — only opens when user taps it. No auto AI calls.
 */
export function FloatingAIBrief({ scope, title }: { scope: Scope; title?: string }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <div className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-4 md:left-6 z-40 pointer-events-none">
      {open ? (
        <div className="pointer-events-auto w-[min(92vw,360px)] shadow-2xl rounded-lg relative">
          <Button
            size="icon"
            variant="ghost"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-sm z-10"
            onClick={() => setOpen(false)}
            aria-label="Collapse AI brief"
          >
            <X className="h-3 w-3" />
          </Button>
          <AIBriefCard scope={scope} title={title} />
        </div>
      ) : (
        <div className="pointer-events-auto flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-10 rounded-full shadow-lg bg-background/95 backdrop-blur gap-2 pl-3 pr-4"
            onClick={() => setOpen(true)}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">AI suggestion</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full opacity-60 hover:opacity-100"
            onClick={() => setHidden(true)}
            aria-label="Hide"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
