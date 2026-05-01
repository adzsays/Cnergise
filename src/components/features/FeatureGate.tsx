import { useState } from "react";
import { useAppFeatures, useMySubscriptions, hasActiveAccess } from "@/hooks/useFeatures";
import { EnableFeatureDialog } from "./EnableFeatureDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Clock, AlertTriangle } from "lucide-react";

export function FeatureGate({ featureKey, children }: { featureKey: string; children: React.ReactNode }) {
  const { data: features } = useAppFeatures();
  const { data: subs, isLoading } = useMySubscriptions();
  const [open, setOpen] = useState(false);

  const feature = features?.find((f) => f.key === featureKey);
  if (!feature || isLoading) return <>{children}</>;
  const access = hasActiveAccess(feature, subs);

  if (access.active) return <>{children}</>;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center">
          {access.status === "pending_approval" ? <Clock className="h-7 w-7 text-amber-500" />
            : access.status === "suspended" || access.status === "revoked" ? <AlertTriangle className="h-7 w-7 text-destructive" />
            : <Lock className="h-7 w-7 text-muted-foreground" />}
        </div>
        <div>
          <h2 className="text-xl font-semibold">{feature.name}</h2>
          <p className="text-sm text-muted-foreground mt-2">{feature.description}</p>
        </div>
        {access.status === "pending_approval" ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">Your access request is pending admin approval.</p>
        ) : access.status === "suspended" ? (
          <p className="text-sm text-destructive">This feature has been suspended for your account. Contact an administrator.</p>
        ) : access.status === "revoked" ? (
          <Button onClick={() => setOpen(true)}>Re-enable Feature</Button>
        ) : (
          <Button onClick={() => setOpen(true)}>
            {feature.requires_approval ? "Request Access" : "Enable Feature"}
          </Button>
        )}
        <EnableFeatureDialog feature={feature} open={open} onOpenChange={setOpen} />
      </Card>
    </div>
  );
}
