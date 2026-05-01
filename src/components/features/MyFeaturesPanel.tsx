import { useState } from "react";
import { useAppFeatures, useMySubscriptions, useDisableFeature, hasActiveAccess, type AppFeature } from "@/hooks/useFeatures";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Lock, Check, Clock } from "lucide-react";
import { EnableFeatureDialog } from "./EnableFeatureDialog";

export function MyFeaturesPanel() {
  const { data: features = [] } = useAppFeatures();
  const { data: subs } = useMySubscriptions();
  const disable = useDisableFeature();
  const [active, setActive] = useState<AppFeature | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Features</CardTitle>
          <CardDescription>Enable, disable or request access to modules anytime.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((f) => {
              const access = hasActiveAccess(f, subs);
              return (
                <div key={f.key} className="border rounded-md p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{f.name}</span>
                      {f.is_core && <Badge variant="secondary" className="text-[10px]">Core</Badge>}
                      {f.is_regulated && <Badge className="text-[10px] bg-amber-500 hover:bg-amber-600 gap-1"><ShieldAlert className="h-3 w-3" />Regulated</Badge>}
                      {access.status === "active" && !f.is_core && <Badge variant="outline" className="text-[10px] gap-1"><Check className="h-3 w-3" />Active</Badge>}
                      {access.status === "pending_approval" && <Badge variant="outline" className="text-[10px] gap-1"><Clock className="h-3 w-3" />Pending</Badge>}
                      {access.status === "suspended" && <Badge variant="destructive" className="text-[10px]">Suspended</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                  </div>
                  <div className="shrink-0">
                    {f.is_core ? (
                      <Badge variant="secondary" className="text-[10px]">Always on</Badge>
                    ) : access.status === "active" ? (
                      <Button size="sm" variant="ghost" onClick={() => disable.mutate(f)} disabled={disable.isPending}>
                        Disable
                      </Button>
                    ) : access.status === "pending_approval" ? (
                      <Button size="sm" variant="ghost" disabled>Pending</Button>
                    ) : access.status === "suspended" ? null : (
                      <Button size="sm" onClick={() => setActive(f)}>
                        <Lock className="h-3.5 w-3.5 mr-1" />
                        {f.requires_approval ? "Request" : "Enable"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <EnableFeatureDialog feature={active} open={!!active} onOpenChange={(o) => !o && setActive(null)} />
    </>
  );
}
