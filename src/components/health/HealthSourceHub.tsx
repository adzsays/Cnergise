import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Clock, CheckCircle2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HealthImportDialog, type ImporterProvider } from "./HealthImportDialog";
import { formatDistanceToNow } from "date-fns";

type ProviderDef = {
  key: string;
  name: string;
  mode: "upload" | "oauth" | "soon";
  importerProvider?: ImporterProvider;
  description: string;
};

const PROVIDERS: ProviderDef[] = [
  { key: "samsung_health", name: "Samsung Health", mode: "upload", importerProvider: "samsung_health",
    description: "Upload the ZIP from Samsung Health → Settings → Download personal data." },
  { key: "apple_health", name: "Apple Health", mode: "upload", importerProvider: "apple_health",
    description: "Upload export.zip from iPhone Health → Profile → Export All Health Data." },
  { key: "generic_csv", name: "CSV / Spreadsheet", mode: "upload", importerProvider: "generic_csv",
    description: "Any CSV with a date column and metric columns (steps, hr, sleep, etc.)." },
  { key: "fitbit", name: "Fitbit", mode: "soon",
    description: "Auto-sync via Fitbit API. Coming next — needs API keys." },
  { key: "garmin", name: "Garmin Connect", mode: "soon",
    description: "Garmin requires business approval for API access." },
  { key: "oura", name: "Oura Ring", mode: "soon",
    description: "Auto-sync via Oura API. Add personal access token." },
  { key: "whoop", name: "Whoop", mode: "soon",
    description: "Auto-sync via Whoop API." },
  { key: "withings", name: "Withings", mode: "soon",
    description: "Auto-sync via Withings API. Best for weight/body composition." },
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
