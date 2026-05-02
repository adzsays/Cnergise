import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { importHealthFile, type ImportResult } from "@/lib/health/importers";

export type ImporterProvider = "samsung_health" | "apple_health" | "generic_csv";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  provider: ImporterProvider;
}

const PROVIDER_META: Record<ImporterProvider, {
  title: string;
  accept: string;
  steps: string[];
  fileHint: string;
}> = {
  samsung_health: {
    title: "Import Samsung Health",
    accept: ".zip,.csv",
    fileHint: "Upload the .zip from Samsung Health",
    steps: [
      "Open Samsung Health on your phone",
      "Tap ⋮ → Settings → Download personal data",
      "Wait for the notification, then save the ZIP",
      "Upload it below",
    ],
  },
  apple_health: {
    title: "Import Apple Health",
    accept: ".zip,.xml",
    fileHint: "Upload export.zip from the iPhone Health app",
    steps: [
      "Open the Health app on iPhone",
      "Tap your profile picture (top-right)",
      "Scroll down → Export All Health Data",
      "Save the ZIP and upload it below (large files may take a minute)",
    ],
  },
  generic_csv: {
    title: "Import CSV",
    accept: ".csv",
    fileHint: "Upload a CSV with a 'date' column and metric columns",
    steps: [
      "Required: 'date' column (YYYY-MM-DD)",
      "Optional columns: steps, distance_meters, calories, avg_heart_rate, resting_heart_rate, sleep_minutes, weight_kg",
      "One row per day",
    ],
  },
};

export function HealthImportDialog({ open, onOpenChange, provider }: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [summary, setSummary] = useState<ImportResult | null>(null);
  const qc = useQueryClient();
  const meta = PROVIDER_META[provider];

  const handleFile = async (file: File) => {
    setBusy(true);
    setProgress(0);
    setStatus("");
    setSummary(null);
    try {
      const res = await importHealthFile(file, provider, (p, s) => {
        setProgress(p);
        setStatus(s);
      });
      setSummary(res);
      toast.success(`Imported ${res.days} days from ${meta.title.replace("Import ", "")}`);
      qc.invalidateQueries({ queryKey: ["health-metrics"] });
      qc.invalidateQueries({ queryKey: ["health-sources"] });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Import failed");
      setStatus("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>{meta.fileHint}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
            <p className="font-medium">How to get the file</p>
            <ol className="list-decimal pl-5 space-y-0.5 text-muted-foreground">
              {meta.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>

          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer hover:bg-muted/40 transition-colors">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm">Click to choose a {meta.accept} file</span>
            <input
              type="file"
              accept={meta.accept}
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.currentTarget.value = "";
              }}
            />
          </label>

          {busy && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">{status}</p>
            </div>
          )}

          {summary && (
            <div className="rounded-md border border-green-500/30 bg-green-500/5 p-3 text-sm flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Imported {summary.days} days</p>
                <p className="text-muted-foreground">Metrics: {summary.metrics.join(", ") || "none"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Re-uploading the same export later will refresh these days, not duplicate them.
                </p>
              </div>
            </div>
          )}

          {!summary && !busy && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs flex items-start gap-2 text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
              <span>
                Files are parsed in your browser; only daily aggregates are uploaded to your account.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
