import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, HeartPulse } from "lucide-react";
import { toast } from "sonner";

const VITAL_TYPES = [
  { value: "bp_systolic", label: "BP systolic", unit: "mmHg" },
  { value: "bp_diastolic", label: "BP diastolic", unit: "mmHg" },
  { value: "glucose", label: "Glucose", unit: "mg/dL" },
  { value: "cholesterol_total", label: "Cholesterol total", unit: "mg/dL" },
  { value: "cholesterol_ldl", label: "LDL", unit: "mg/dL" },
  { value: "cholesterol_hdl", label: "HDL", unit: "mg/dL" },
  { value: "triglycerides", label: "Triglycerides", unit: "mg/dL" },
  { value: "resting_hr", label: "Resting HR", unit: "bpm" },
  { value: "hrv", label: "HRV", unit: "ms" },
  { value: "spo2", label: "SpO2", unit: "%" },
  { value: "body_temp", label: "Body temp", unit: "°C" },
  { value: "body_fat_pct", label: "Body fat", unit: "%" },
  { value: "muscle_mass_kg", label: "Muscle mass", unit: "kg" },
  { value: "waist_cm", label: "Waist", unit: "cm" },
];

export function VitalsView() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ vital_type: "bp_systolic", value: "", unit: "mmHg", notes: "" });

  const { data: vitals = [] } = useQuery({
    queryKey: ["vitals-all"],
    queryFn: async () => {
      const { data } = await supabase.from("health_vitals").select("*").order("recorded_at", { ascending: false }).limit(100);
      return data || [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("health_vitals").insert({
        user_id: user.id,
        vital_type: form.vital_type as any,
        value: Number(form.value),
        unit: form.unit,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vital recorded");
      setForm({ ...form, value: "", notes: "" });
      qc.invalidateQueries({ queryKey: ["vitals-all"] });
      qc.invalidateQueries({ queryKey: ["health-vitals-recent"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("health_vitals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vitals-all"] });
      qc.invalidateQueries({ queryKey: ["health-vitals-recent"] });
    },
  });

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="font-semibold flex items-center gap-1.5 mb-3"><HeartPulse className="h-4 w-4" />Log a vital</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2"><Label>Type</Label>
            <Select value={form.vital_type} onValueChange={(v) => { const m = VITAL_TYPES.find((x) => x.value === v); setForm({ ...form, vital_type: v, unit: m?.unit || "" }); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VITAL_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Value</Label><Input type="number" step="0.1" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
          <div><Label>Unit</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          <div className="col-span-full"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Fasting, after exercise…" /></div>
        </div>
        <div className="flex justify-end mt-3"><Button size="sm" onClick={() => add.mutate()} disabled={!form.value || add.isPending}><Plus className="h-4 w-4 mr-1" />Save</Button></div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Recent readings</h3>
        {vitals.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No vitals recorded yet</p> : (
          <div className="space-y-2">
            {vitals.map((v: any) => {
              const meta = VITAL_TYPES.find((t) => t.value === v.vital_type);
              return (
                <div key={v.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{meta?.label || v.vital_type} <span className="text-base tabular-nums ml-2">{v.value} <span className="text-xs text-muted-foreground">{v.unit}</span></span></p>
                    <p className="text-xs text-muted-foreground">{new Date(v.recorded_at).toLocaleString("en-GB")} {v.notes && `· ${v.notes}`}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
