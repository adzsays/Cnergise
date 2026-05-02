// Health data importers — Samsung Health ZIP/CSV, Apple Health export.zip, generic CSV.
// All importers produce daily aggregate rows that are upserted into `health_metrics`
// with onConflict on (user_id, source, provider, metric_date) so re-uploading the
// same export NEVER creates duplicates — it just refreshes the same rows.

import JSZip from "jszip";
import Papa from "papaparse";
import { XMLParser } from "fast-xml-parser";
import { supabase } from "@/integrations/supabase/client";

export type DailyRow = {
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

type Provider = "samsung_health" | "apple_health" | "generic_csv";

export type ImportResult = {
  days: number;
  metrics: string[];
  provider: Provider;
};

type ProgressCb = (pct: number, status: string) => void;

const SUM_FIELDS = new Set([
  "steps",
  "distance_meters",
  "calories_burned",
  "active_minutes",
  "sleep_minutes",
]);

function mergeRow(map: Map<string, DailyRow>, date: string, patch: Partial<DailyRow>) {
  const cur = map.get(date) ?? { metric_date: date };
  for (const [k, v] of Object.entries(patch)) {
    if (v == null || (typeof v === "number" && isNaN(v))) continue;
    if (SUM_FIELDS.has(k) && typeof v === "number" && typeof (cur as any)[k] === "number") {
      (cur as any)[k] = (cur as any)[k] + v;
    } else {
      (cur as any)[k] = v;
    }
  }
  map.set(date, cur);
}

function toDateStr(v: any): string | null {
  if (v == null || v === "") return null;
  const s = String(v).trim();
  const d = /^\d+$/.test(s) ? new Date(Number(s)) : new Date(s.replace(" ", "T"));
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function pickCol(headers: string[], candidates: string[]): string | undefined {
  const lower = headers.map((h) => h.toLowerCase());
  for (const c of candidates) {
    const idx = lower.findIndex((h) => h === c.toLowerCase() || h.endsWith("." + c.toLowerCase()));
    if (idx >= 0) return headers[idx];
  }
  return undefined;
}

async function parseCsvText(text: string): Promise<{ headers: string[]; rows: any[] }> {
  // Samsung CSVs often have a metadata header on line 1.
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

// ---------- Samsung Health ----------
async function parseSamsungCsv(name: string, text: string, merged: Map<string, DailyRow>, found: Set<string>) {
  const lower = name.toLowerCase();
  const isPedometer = lower.includes("pedometer_day_summary") || lower.includes("step_daily_trend");
  const isHeart = lower.includes("heart_rate");
  const isSleep = lower.includes("sleep") && !lower.includes("sleep_stage");
  const isExercise = lower.includes("exercise");
  const isWeight = lower.includes("weight");
  if (!isPedometer && !isHeart && !isSleep && !isExercise && !isWeight) return;

  const { headers, rows } = await parseCsvText(text);

  if (isPedometer) {
    const dayCol = pickCol(headers, ["day_time", "create_time", "start_time", "date"]);
    const stepsCol = pickCol(headers, ["step_count", "count", "steps"]);
    const distCol = pickCol(headers, ["distance"]);
    const calCol = pickCol(headers, ["calorie", "calories"]);
    const activeCol = pickCol(headers, ["active_time"]);
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
    found.add("steps");
  } else if (isHeart) {
    const dayCol = pickCol(headers, ["start_time", "create_time", "end_time"]);
    const hrCol = pickCol(headers, ["heart_rate", "heart_beat_count", "value"]);
    const minCol = pickCol(headers, ["min", "heart_rate_min"]);
    const maxCol = pickCol(headers, ["max", "heart_rate_max"]);
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
    found.add("heart rate");
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
    found.add("sleep");
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
    found.add("exercise");
  } else if (isWeight) {
    const dayCol = pickCol(headers, ["start_time", "create_time"]);
    const wCol = pickCol(headers, ["weight"]);
    for (const r of rows) {
      const date = toDateStr(r[dayCol ?? ""]);
      const w = wCol ? Number(r[wCol]) : NaN;
      if (!date || !isFinite(w)) continue;
      mergeRow(merged, date, { weight_kg: w });
    }
    found.add("weight");
  }
}

// ---------- Apple Health ----------
// Apple export ZIP contains apple_health_export/export.xml with <Record type="HKQuantityTypeIdentifier..." />
const APPLE_TYPE_MAP: Record<string, "steps" | "distance" | "calories" | "hr" | "sleep" | "weight"> = {
  HKQuantityTypeIdentifierStepCount: "steps",
  HKQuantityTypeIdentifierDistanceWalkingRunning: "distance",
  HKQuantityTypeIdentifierActiveEnergyBurned: "calories",
  HKQuantityTypeIdentifierHeartRate: "hr",
  HKCategoryTypeIdentifierSleepAnalysis: "sleep",
  HKQuantityTypeIdentifierBodyMass: "weight",
};

async function parseAppleHealthXml(xmlText: string, merged: Map<string, DailyRow>, found: Set<string>, onProgress: ProgressCb) {
  onProgress(40, "Parsing Apple Health XML…");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    isArray: (name) => name === "Record",
  });
  const parsed = parser.parse(xmlText);
  const records: any[] = parsed?.HealthData?.Record ?? [];
  onProgress(60, `Aggregating ${records.length.toLocaleString()} records…`);

  const hrPerDay = new Map<string, { sum: number; n: number; min: number; max: number }>();

  for (const r of records) {
    const kind = APPLE_TYPE_MAP[r.type];
    if (!kind) continue;
    const startDate = r.startDate || r.creationDate;
    const date = toDateStr(startDate);
    if (!date) continue;
    const value = Number(r.value);

    switch (kind) {
      case "steps":
        mergeRow(merged, date, { steps: value });
        found.add("steps");
        break;
      case "distance": {
        const unit = (r.unit || "").toLowerCase();
        const meters = unit === "km" ? value * 1000 : unit === "mi" ? value * 1609.34 : value;
        mergeRow(merged, date, { distance_meters: meters });
        found.add("distance");
        break;
      }
      case "calories":
        mergeRow(merged, date, { calories_burned: value });
        found.add("calories");
        break;
      case "hr": {
        if (!isFinite(value)) break;
        const cur = hrPerDay.get(date) ?? { sum: 0, n: 0, min: Infinity, max: -Infinity };
        cur.sum += value;
        cur.n += 1;
        cur.min = Math.min(cur.min, value);
        cur.max = Math.max(cur.max, value);
        hrPerDay.set(date, cur);
        found.add("heart rate");
        break;
      }
      case "sleep": {
        const startMs = new Date(String(r.startDate).replace(" ", "T")).getTime();
        const endMs = new Date(String(r.endDate).replace(" ", "T")).getTime();
        if (!isFinite(startMs) || !isFinite(endMs) || endMs <= startMs) break;
        // Apple has multiple sleep states (InBed, Asleep…); count all "Asleep*" categories
        if (typeof r.value === "string" && /asleep|core|rem|deep/i.test(r.value)) {
          mergeRow(merged, toDateStr(r.endDate)!, { sleep_minutes: Math.round((endMs - startMs) / 60000) });
          found.add("sleep");
        }
        break;
      }
      case "weight": {
        const unit = (r.unit || "").toLowerCase();
        const kg = unit === "lb" ? value * 0.453592 : value;
        mergeRow(merged, date, { weight_kg: kg });
        found.add("weight");
        break;
      }
    }
  }

  for (const [date, v] of hrPerDay) {
    mergeRow(merged, date, {
      avg_heart_rate: Math.round(v.sum / v.n),
      max_heart_rate: isFinite(v.max) ? Math.round(v.max) : undefined,
      resting_heart_rate: isFinite(v.min) ? Math.round(v.min) : undefined,
    });
  }
}

// ---------- Generic CSV ----------
async function parseGenericCsv(text: string, merged: Map<string, DailyRow>, found: Set<string>) {
  const { headers, rows } = await parseCsvText(text);
  const dateCol = pickCol(headers, ["date", "day", "metric_date", "timestamp"]);
  if (!dateCol) throw new Error("Generic CSV needs a 'date' column.");
  const stepsCol = pickCol(headers, ["steps", "step_count"]);
  const distCol = pickCol(headers, ["distance", "distance_meters", "distance_m"]);
  const calCol = pickCol(headers, ["calories", "calories_burned", "kcal"]);
  const hrCol = pickCol(headers, ["avg_heart_rate", "heart_rate", "hr"]);
  const restCol = pickCol(headers, ["resting_heart_rate", "rhr"]);
  const sleepCol = pickCol(headers, ["sleep_minutes", "sleep_min", "sleep_hours"]);
  const weightCol = pickCol(headers, ["weight_kg", "weight"]);
  for (const r of rows) {
    const date = toDateStr(r[dateCol]);
    if (!date) continue;
    let sleepMin: number | undefined;
    if (sleepCol) {
      const v = Number(r[sleepCol]);
      sleepMin = sleepCol.toLowerCase().includes("hour") ? Math.round(v * 60) : v;
    }
    mergeRow(merged, date, {
      steps: stepsCol ? Number(r[stepsCol]) : undefined,
      distance_meters: distCol ? Number(r[distCol]) : undefined,
      calories_burned: calCol ? Number(r[calCol]) : undefined,
      avg_heart_rate: hrCol ? Number(r[hrCol]) : undefined,
      resting_heart_rate: restCol ? Number(r[restCol]) : undefined,
      sleep_minutes: sleepMin,
      weight_kg: weightCol ? Number(r[weightCol]) : undefined,
    });
  }
  if (stepsCol) found.add("steps");
  if (hrCol) found.add("heart rate");
  if (sleepCol) found.add("sleep");
  if (weightCol) found.add("weight");
}

// ---------- Persist ----------
async function upsertRows(userId: string, provider: Provider, rows: DailyRow[], onProgress: ProgressCb) {
  const records = rows.map((r) => ({
    ...r,
    user_id: userId,
    source: provider,
    provider,
  }));
  const chunkSize = 500;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("health_metrics")
      .upsert(chunk, { onConflict: "user_id,source,provider,metric_date" });
    if (error) throw error;
    onProgress(80 + Math.round(((i + chunk.length) / records.length) * 20), "Saving…");
  }
}

// ---------- Public entry point ----------
export async function importHealthFile(
  file: File,
  forcedProvider: Provider | "auto",
  onProgress: ProgressCb,
): Promise<ImportResult> {
  onProgress(5, "Opening file…");
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("You must be signed in.");

  const merged = new Map<string, DailyRow>();
  const found = new Set<string>();
  const lower = file.name.toLowerCase();
  let provider: Provider;

  if (lower.endsWith(".zip")) {
    onProgress(15, "Reading ZIP…");
    const zip = await JSZip.loadAsync(file);
    const entries = Object.values(zip.files).filter((f) => !f.dir);

    const appleXml = entries.find((e) => /export\.xml$/i.test(e.name));
    if (appleXml || forcedProvider === "apple_health") {
      provider = "apple_health";
      if (!appleXml) throw new Error("This ZIP doesn't contain an Apple Health export.xml.");
      onProgress(25, "Extracting export.xml…");
      const xmlText = await appleXml.async("string");
      await parseAppleHealthXml(xmlText, merged, found, onProgress);
    } else {
      provider = "samsung_health";
      const csvs = entries.filter((e) => e.name.toLowerCase().endsWith(".csv"));
      if (csvs.length === 0) throw new Error("No CSVs found in the ZIP.");
      onProgress(20, `Parsing ${csvs.length} CSVs…`);
      let i = 0;
      for (const e of csvs) {
        const text = await e.async("string");
        await parseSamsungCsv(e.name, text, merged, found);
        i++;
        onProgress(20 + Math.round((i / csvs.length) * 60), `Parsing ${e.name.split("/").pop()}…`);
      }
    }
  } else if (lower.endsWith(".xml")) {
    provider = "apple_health";
    onProgress(20, "Reading XML…");
    const text = await file.text();
    await parseAppleHealthXml(text, merged, found, onProgress);
  } else if (lower.endsWith(".csv")) {
    provider = forcedProvider === "samsung_health" ? "samsung_health" : "generic_csv";
    const text = await file.text();
    if (provider === "samsung_health") {
      await parseSamsungCsv(file.name, text, merged, found);
    } else {
      await parseGenericCsv(text, merged, found);
    }
  } else {
    throw new Error("Unsupported file type. Upload .zip, .xml, or .csv.");
  }

  const rows = Array.from(merged.values());
  if (rows.length === 0) throw new Error("No supported health data found in this file.");

  onProgress(80, `Saving ${rows.length} days…`);
  await upsertRows(userId, provider, rows, onProgress);
  onProgress(100, "Done");

  return { days: rows.length, metrics: Array.from(found), provider };
}
