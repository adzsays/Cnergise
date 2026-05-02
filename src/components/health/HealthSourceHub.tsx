import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Upload, RefreshCw, CheckCircle2, Smartphone, Apple, FileSpreadsheet, Activity, Watch, Circle, Heart, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HealthImportDialog, type ImporterProvider } from "./HealthImportDialog";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type ProviderDef = {
  key: string;
  name: string;
  mode: "upload" | "oauth" | "soon";
  importerProvider?: ImporterProvider;
  Icon: React.ComponentType<{ className?: string }>;
  tint: string;
  hint: string;
};

const PROVIDERS: ProviderDef[] = [
  { key: "samsung_health", name: "Samsung Health", mode: "upload", importerProvider: "samsung_health",
    Icon: Smartphone, tint: "text-blue-500", hint: "Upload ZIP from Samsung Health export" },
  { key: "apple_health", name: "Apple Health", mode: "upload", importerProvider: "apple_health",
    Icon: Apple, tint: "text-foreground", hint: "Upload export.zip from iPhone Health" },
  { key: "generic_csv", name: "CSV", mode: "upload", importerProvider: "generic_csv",
    Icon: FileSpreadsheet, tint: "text-emerald-500", hint: "Any CSV with a date column" },
  { key: "fitbit", name: "Fitbit", mode: "soon", Icon: Activity, tint: "text-cyan-500", hint: "Coming soon" },
  { key: "garmin", name: "Garmin", mode: "soon", Icon: Watch, tint: "text-sky-600", hint: "Coming soon" },
  { key: "oura", name: "Oura", mode: "soon", Icon: Circle, tint: "text-muted-foreground", hint: "Coming soon" },
  { key: "whoop", name: "Whoop", mode: "soon", Icon: Heart, tint: "text-rose-500", hint: "Coming soon" },
  { key: "withings", name: "Withings", mode: "soon", Icon: Scale, tint: "text-indigo-500", hint: "Coming soon" },
];

export function HealthSourceHub() {
  const [openProvider, setOpenProvider] = useState<ImporterProvider | null>(null);

  const { data: sources = [] } = useQuery({
    queryKey: ["health-sources"],
    queryFn: async () => {
      const { data } = await supabase
        .from("health_metrics")
        .select("provider,metric_date,updated_at")
        .order("updated_at", { ascending: false })
        .limit(1000);
      const map = new Map<string, { lastUpdated: string; daysCount: number; latestDate: string }>();
      for (const row of data ?? []) {
        const key = (row as any).provider ?? "unknown";
        const cur = map.get(key);
        if (!cur) {
          map.set(key, {
            lastUpdated: (row as any).updated_at,
            daysCount: 1,
            latestDate: (row as any).metric_date,
          });
        } else {
          cur.daysCount++;
          if ((row as any).metric_date > cur.latestDate) cur.latestDate = (row as any).metric_date;
        }
      }
      return Array.from(map.entries()).map(([provider, v]) => ({ provider, ...v }));
    },
  });

  const sourceMap = new Map(sources.map((s) => [s.provider, s]));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Health data sources</CardTitle>
          <CardDescription>
            Connect a source to populate your dashboard. Re-uploading the same export will refresh
            existing days — not duplicate them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PROVIDERS.map((p) => {
              const s = sourceMap.get(p.key);
              const connected = !!s;
              return (
                <div key={p.key} className="rounded-lg border p-3 flex flex-col gap-2 bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                    </div>
                    {p.mode === "soon" && (
                      <Badge variant="outline" className="shrink-0 text-xs">Soon</Badge>
                    )}
                    {connected && (
                      <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" /> Synced
                      </Badge>
                    )}
                  </div>

                  {connected && s && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {s.daysCount} days · updated {formatDistanceToNow(new Date(s.lastUpdated), { addSuffix: true })}
                      </span>
                    </div>
                  )}

                  <div className="mt-auto pt-1">
                    {p.mode === "upload" && p.importerProvider && (
                      <Button
                        size="sm"
                        variant={connected ? "outline" : "default"}
                        className="w-full gap-1.5"
                        onClick={() => setOpenProvider(p.importerProvider!)}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {connected ? "Update data" : "Upload"}
                      </Button>
                    )}
                    {p.mode === "soon" && (
                      <Button size="sm" variant="ghost" className="w-full gap-1.5 text-muted-foreground" disabled>
                        <ExternalLink className="h-3.5 w-3.5" /> Coming soon
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {openProvider && (
        <HealthImportDialog
          open={!!openProvider}
          onOpenChange={(v) => { if (!v) setOpenProvider(null); }}
          provider={openProvider}
        />
      )}
    </>
  );
}
