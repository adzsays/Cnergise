import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkOnboarded = async (userId: string) => {
      const { data } = await supabase
        .from("user_agreements")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      return !!data;
    };

    const handle = async (session: any) => {
      if (!session) {
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
        navigate("/login");
        return;
      }
      // Authenticated — verify onboarded
      const onboarded = await checkOnboarded(session.user.id);
      if (!mounted) return;
      setIsAuthenticated(true);
      setIsLoading(false);
      if (!onboarded && location.pathname !== "/onboarding") {
        navigate("/onboarding", { replace: true });
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => handle(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      // Defer Supabase calls to avoid deadlock
      setTimeout(() => handle(session), 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
};
