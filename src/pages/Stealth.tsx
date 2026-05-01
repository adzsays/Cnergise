import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Stealth = () => {
  const navigate = useNavigate();
  const [keys, setKeys] = useState("");

  useEffect(() => {
    // If already signed in, go straight to app
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/home");
    });
  }, [navigate]);

  // Hidden access: type "login" anywhere on the page, or press Shift+L
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "L" || e.key === "l")) {
        navigate("/login");
        return;
      }
      const next = (keys + e.key).slice(-5).toLowerCase();
      setKeys(next);
      if (next === "login") navigate("/login");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keys, navigate]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Something is coming
        </h1>
        <p className="text-muted-foreground">
          We're putting the finishing touches on a new experience. Check back soon.
        </p>
        {/* Tiny, near-invisible affordance for the owner */}
        <button
          onClick={() => navigate("/login")}
          aria-label="Sign in"
          className="mt-8 text-[10px] text-muted-foreground/30 hover:text-muted-foreground transition-colors"
        >
          ·
        </button>
      </div>
    </div>
  );
};

export default Stealth;
