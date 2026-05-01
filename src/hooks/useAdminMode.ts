import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

const STORAGE_KEY = "cnergise.viewAs";

export function useIsAdmin() {
  const { roles, isLoading } = useProfile();
  const isAdmin = !!roles?.some((r: any) => r.role === "admin");
  return { isAdmin, isLoading };
}

/**
 * Lets an admin temporarily "view as user" without losing their admin role.
 * Persisted in localStorage. Non-admins always behave as users.
 */
export function useAdminMode() {
  const { isAdmin, isLoading } = useIsAdmin();
  const [viewAs, setViewAs] = useState<"admin" | "user">(() => {
    if (typeof window === "undefined") return "admin";
    return (localStorage.getItem(STORAGE_KEY) as "admin" | "user") || "admin";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, viewAs);
    }
  }, [viewAs]);

  const effectiveAdmin = isAdmin && viewAs === "admin";

  const toggle = () => setViewAs((v) => (v === "admin" ? "user" : "admin"));

  return { isAdmin, effectiveAdmin, viewAs, setViewAs, toggle, isLoading };
}

export function usePendingApprovalsCount() {
  const { effectiveAdmin } = useAdminMode();
  return useQuery({
    queryKey: ["pending-approvals-count", effectiveAdmin],
    enabled: effectiveAdmin,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("feature_approval_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });
}
