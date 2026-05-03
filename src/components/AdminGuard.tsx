import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useAdminMode";

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/home" replace />;
  return <>{children}</>;
};
