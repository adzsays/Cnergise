import { useState } from "react";
import JSZip from "jszip";
import Papa from "papaparse";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileArchive, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type Row = {
  metric_date: string;
  steps?: number;
  distance_meters?: number;
  calories_burned?: number;
  active_minutes?: number;
  resting_heart_rate?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  sleep_minutes?: number;
  weight_kg?: number;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

// Samsung Health export CSVs have 2 header rows: row 1 is metadata, row 2 is column names.
// We try to be tolerant of column-name drift across export versions.
function pickCol(headers: string[], candidates: string[]): string | undefined {
  const lower = headers.map((h) => h.toLowerCase());
  for (const c of candidates) {
    const idx = lower.findIndex((h) => h === c.toLowerCase() || h.endsWith("." + c.toLowerCase()));
    if (idx >= 0) return headers[idx];
  }
  return undefined;
}

function toDateStr(v: any): string | null {
  if (!v) return null;
  const s = String(v).trim();
  // Accept "YYYY-MM-DD HH:MM:SS.sss" or ISO or epoch ms
  const d = /^\d+$/.test(s) ? new Date(Number(s)) : new Date(s.replace(" ", "T"));
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function mergeRow(map: Map<string, Row>, date: string, patch: Partial<Row>) {
  const cur = map.get(date) ?? { metric_date: date };
  for (const [k, v] of Object.entries(patch)) {
    if (v == null || (typeof v === "number" && isNaN(v))) continue;
    // For numeric fields, sum (steps/distance/calories/active/sleep) or take latest (heart rate, weight)
    const sumFields = new Set(["steps", "distance_meters", "calories_burned", "active_minutes", "sleep_minutes"]);
    if (sumFields.has(k) && typeof v === "number" && typeof (cur as any)[k] === "number") {
      (cur as any)[k] = (cur as any)[k] + v;
    } else {
      (cur as any)[k] = v;
    }
  }
  map.set(date, cur);
}

async function parseCsv(text: string): Promise<{ headers: string[]; rows: any[] }> {
  // Samsung Health files often have a comment/header on line 1 starting with "com.samsung..."
  // Real header is usually on line 2. Detect this by checking if line 1 has fewer commas than line 2.
  const lines = text.split(/\r?\n/);
  let startIdx = 0;
  if (lines.length > 2) {
    const c1 = (lines[0].match(/,/g) || []).length;
    const c2 = (lines[1].match(/,/g) || []).length;
    if (c2 > c1 + 2) startIdx = 1;
  }
  const csv = lines.slice(startIdx).join("\n");
  return new Promise((resolve) => {
    Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => resolve({ headers: res.meta.fields ?? [], rows: res.data as any[] }),
    });
  });
}

export function SamsungHealthImportDialog({ open, onOpenChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [summary, setSummary] = useState<{ days: number; metrics: string[] } | null>(null);
  const qc = useQueryClient();

  const handleFile = async (file: File) => {
    setBusy(true);
    setProgress(5);
    setStatus("Opening file…");
    setSummary(null);
    const merged = new Map<string, Row>();
    const metricsFound = new Set<string>();

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("You must be signed in.");

      let csvFiles: { name: string; text: string }[] = [];

      if (file.name.toLowerCase().endsWith(".zip")) {
        const zip = await JSZip.loadAsync(file);
        const entries = Object.values(zip.files).filter(
          (f) => !f.dir && f.name.toLowerCase().endsWith(".csv"),
        );
        setStatus(`Found ${entries.length} CSVs in ZIP…`);
        for (const e of entries) {
          const text = await e.async("string");
          csvFiles.push({ name: e.name, text });
        }
      } else if (file.name.toLowerCase().endsWith(".csv")) {
        csvFiles = [{ name: file.name, text: await file.text() }];
      } else {
        throw new Error("Please upload a .zip or .csv from Samsung Health.");
      }

      setProgress(20);
      const total = csvFiles.length || 1;
      let done = 0;

      for (const f of csvFiles) {
        const lower = f.name.toLowerCase();
        // Only parse the files we know how to handle
        const isPedometer = lower.includes("pedometer_day_summary") || lower.includes("step_daily_trend");
        const isHeart = lower.includes("heart_rate");
        const isSleep = lower.includes("sleep") && !lower.includes("sleep_stage");
        const isExercise = lower.includes("exercise");
        const isWeight = lower.includes("weight");

        if (!isPedometer && !isHeart && !isSleep && !isExercise && !isWeight) {
          done++;
          setProgress(20 + Math.round((done / total) * 60));
          continue;
        }

        setStatus(`Parsing ${f.name.split("/").pop()}…`);
        const { headers, rows } = await parseCsv(f.text);

        if (isPedometer) {
          const dayCol = pickCol(headers, ["day_time", "create_time", "start_time", "date"]);
          const stepsCol = pickCol(headers, ["step_count", "count", "steps"]);
          const distCol = pickCol(headers, ["distance"]);
          const calCol = pickCol(headers, ["calorie", "calories"]);
          const activeCol = pickCol(headers, ["active_time", "run_step_count"]);
          for (const r of rows) {
            const date = toDateStr(r[dayCol ?? ""]);
            if (!date) continue;
            mergeRow(merged, date, {
              steps: stepsCol ? Number(r[stepsCol]) : undefined,
              distance_meters: distCol ? Number(r[distCol]) : undefined,
              calories_burned: calCol ? Number(r[calCol]) : undefined,
              active_minutes: activeCol ? Math.round(Number(r[activeCol]) / 60000) : undefined,
            });
          }
          metricsFound.add("steps");
        } else if (isHeart) {
          const dayCol = pickCol(headers, ["start_time", "create_time", "end_time"]);
          const hrCol = pickCol(headers, ["heart_rate", "heart_beat_count", "value"]);
          const minCol = pickCol(headers, ["min", "heart_rate_min"]);
          const maxCol = pickCol(headers, ["max", "heart_rate_max"]);
          // Aggregate per day: avg = mean of values, min/max accordingly
          const perDay = new Map<string, { sum: number; n: number; min: number; max: number }>();
          for (const r of rows) {
            const date = toDateStr(r[dayCol ?? ""]);
            const hr = hrCol ? Number(r[hrCol]) : NaN;
            if (!date || !isFinite(hr)) continue;
            const cur = perDay.get(date) ?? { sum: 0, n: 0, min: Infinity, max: -Infinity };
            cur.sum += hr;
            cur.n += 1;
            cur.min = Math.min(cur.min, minCol ? Number(r[minCol]) || hr : hr);
            cur.max = Math.max(cur.max, maxCol ? Number(r[maxCol]) || hr : hr);
            perDay.set(date, cur);
          }
          for (const [date, v] of perDay) {
            mergeRow(merged, date, {
              avg_heart_rate: Math.round(v.sum / v.n),
              max_heart_rate: isFinite(v.max) ? Math.round(v.max) : undefined,
              resting_heart_rate: isFinite(v.min) ? Math.round(v.min) : undefined,
            });
          }
          metricsFound.add("heart rate");
        } else if (isSleep) {
          const startCol = pickCol(headers, ["start_time", "sleep_start_time"]);
          const endCol = pickCol(headers, ["end_time", "sleep_end_time"]);
          for (const r of rows) {
            const start = r[startCol ?? ""];
            const end = r[endCol ?? ""];
            const date = toDateStr(end || start);
            if (!date) continue;
            const startMs = new Date(String(start).replace(" ", "T")).getTime();
            const endMs = new Date(String(end).replace(" ", "T")).getTime();
            if (!isFinite(startMs) || !isFinite(endMs) || endMs <= startMs) continue;
            mergeRow(merged, date, { sleep_minutes: Math.round((endMs - startMs) / 60000) });
          }
          metricsFound.add("sleep");
        } else if (isExercise) {
          const dayCol = pickCol(headers, ["start_time", "create_time"]);
          const calCol = pickCol(headers, ["calorie", "calories"]);
          const distCol = pickCol(headers, ["distance"]);
          const durCol = pickCol(headers, ["duration"]);
          for (const r of rows) {
            const date = toDateStr(r[dayCol ?? ""]);
            if (!date) continue;
            mergeRow(merged, date, {
              calories_burned: calCol ? Number(r[calCol]) : undefined,
              distance_meters: distCol ? Number(r[distCol]) : undefined,
              active_minutes: durCol ? Math.round(Number(r[durCol]) / 60000) : undefined,
            });
          }
          metricsFound.add("exercise");
        } else if (isWeight) {
          const dayCol = pickCol(headers, ["start_time", "create_time"]);
          const wCol = pickCol(headers, ["weight"]);
          for (const r of rows) {
            const date = toDateStr(r[dayCol ?? ""]);
            const w = wCol ? Number(r[wCol]) : NaN;
            if (!date || !isFinite(w)) continue;
            mergeRow(merged, date, { weight_kg: w });
          }
          metricsFound.add("weight");
        }

        done++;
        setProgress(20 + Math.round((done / total) * 60));
      }

      const rowsToInsert = Array.from(merged.values()).map((r) => ({
        ...r,
        user_id: userId,
        source: "samsung_health",
        provider: "samsung_health",
      }));

      if (rowsToInsert.length === 0) {
        toast.error("No supported Samsung Health data found in the file.");
        setBusy(false);
        return;
      }

      setStatus(`Saving ${rowsToInsert.length} days of data…`);
      // Chunked upsert
      const chunkSize = 500;
      for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
        const chunk = rowsToInsert.slice(i, i + chunkSize);
        const { error } = await supabase
          .from("health_metrics")
          .upsert(chunk, { onConflict: "user_id,source,provider,metric_date" });
        if (error) throw error;
        setProgress(80 + Math.round(((i + chunk.length) / rowsToInsert.length) * 20));
      }

      setProgress(100);
      setStatus("Done");
      setSummary({ days: rowsToInsert.length, metrics: Array.from(metricsFound) });
      toast.success(`Imported ${rowsToInsert.length} days of Samsung Health data`);
      qc.invalidateQueries({ queryKey: ["health-metrics"] });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Import failed");
      setStatus("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5" /> Import Samsung Health
          </DialogTitle>
          <DialogDescription>
            Upload your Samsung Health export (.zip or a single .csv).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
            <p className="font-medium">How to get the file</p>
            <ol className="list-decimal pl-5 space-y-0.5 text-muted-foreground">
              <li>Open <strong>Samsung Health</strong> on your phone</li>
              <li>Tap <strong>⋮ → Settings → Download personal data</strong></li>
              <li>Wait for the email/notification, then save the ZIP</li>
              <li>Upload it below</li>
            </ol>
          </div>

          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer hover:bg-muted/40 transition-colors">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm">Click to choose a .zip or .csv file</span>
            <input
              type="file"
              accept=".zip,.csv"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
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
                <p className="text-muted-foreground">Metrics: {summary.metrics.join(", ")}</p>
              </div>
            </div>
          )}

          {!summary && !busy && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs flex items-start gap-2 text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
              <span>
                Files are parsed in your browser; only daily aggregates (steps, heart rate, sleep,
                exercise, weight) are uploaded to your account.
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
