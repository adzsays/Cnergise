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
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Health data sources</CardTitle>
          <CardDescription className="text-xs">
            Tap a logo to sync or upload. Re-uploads refresh existing days — no duplicates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TooltipProvider delayDuration={200}>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((p) => {
                const s = sourceMap.get(p.key);
                const connected = !!s;
                const disabled = p.mode === "soon";
                const ActionIcon = connected ? RefreshCw : Upload;
                const tooltip = disabled
                  ? `${p.name} — ${p.hint}`
                  : connected && s
                    ? `${p.name} · ${s.daysCount} days · updated ${formatDistanceToNow(new Date(s.lastUpdated), { addSuffix: true })}`
                    : `${p.name} — ${p.hint}`;

                return (
                  <Tooltip key={p.key}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => p.importerProvider && setOpenProvider(p.importerProvider)}
                        className={cn(
                          "group relative h-12 w-12 rounded-lg border bg-card flex items-center justify-center transition-all",
                          disabled
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:border-primary hover:shadow-sm hover:-translate-y-0.5 cursor-pointer",
                          connected && "border-primary/40"
                        )}
                        aria-label={tooltip}
                      >
                        <p.Icon className={cn("h-5 w-5", p.tint)} />
                        {connected && (
                          <CheckCircle2 className="absolute -top-1 -right-1 h-3.5 w-3.5 text-primary bg-background rounded-full" />
                        )}
                        {!disabled && (
                          <span className="absolute inset-0 rounded-lg bg-background/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ActionIcon className="h-4 w-4 text-foreground" />
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {tooltip}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
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
