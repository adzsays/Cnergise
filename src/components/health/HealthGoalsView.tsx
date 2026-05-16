import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

const GOAL_TYPES = [
  { value: "weight_loss", label: "Weight loss" },
  { value: "weight_gain", label: "Weight gain" },
  { value: "maintain", label: "Maintain" },
  { value: "strength", label: "Strength" },
  { value: "endurance", label: "Endurance" },
  { value: "nutrition", label: "Nutrition" },
  { value: "sleep", label: "Sleep" },
  { value: "custom", label: "Custom" },
];

export function HealthGoalsView() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", goal_type: "weight_loss", baseline_value: "", target_value: "", target_unit: "kg", target_date: "" });

  const { data: goals = [] } = useQuery({
    queryKey: ["health-goals"],
    queryFn: async () => {
      const { data } = await supabase.from("health_goals").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: latestWeight } = useQuery({
    queryKey: ["latest-weight"],
    queryFn: async () => {
      const { data } = await supabase.from("health_metrics").select("weight_kg,metric_date").not("weight_kg", "is", null).order("metric_date", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  const addGoal = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("health_goals").insert({
        user_id: user.id,
        title: form.title,
        goal_type: form.goal_type as any,
        baseline_value: form.baseline_value ? Number(form.baseline_value) : null,
        target_value: form.target_value ? Number(form.target_value) : null,
        target_unit: form.target_unit || null,
        target_date: form.target_date || null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Goal added");
      setAdding(false);
      setForm({ title: "", goal_type: "weight_loss", baseline_value: "", target_value: "", target_unit: "kg", target_date: "" });
      qc.invalidateQueries({ queryKey: ["health-goals"] });
      qc.invalidateQueries({ queryKey: ["active-health-goal"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleGoal = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("health_goals").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["health-goals"] });
      qc.invalidateQueries({ queryKey: ["active-health-goal"] });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("health_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Goal removed");
      qc.invalidateQueries({ queryKey: ["health-goals"] });
      qc.invalidateQueries({ queryKey: ["active-health-goal"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Health goals</h2>
          <p className="text-xs text-muted-foreground">Latest recorded weight: {latestWeight?.weight_kg ?? "—"} kg</p>
        </div>
        <Button size="sm" onClick={() => setAdding((v) => !v)}><Plus className="h-4 w-4 mr-1" />Add goal</Button>
      </div>

      {adding && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Lose 5 kg by summer" /></div>
            <div><Label>Type</Label>
              <Select value={form.goal_type} onValueChange={(v) => setForm({ ...form, goal_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GOAL_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Baseline (current)</Label><Input type="number" value={form.baseline_value} onChange={(e) => setForm({ ...form, baseline_value: e.target.value })} placeholder="80" /></div>
            <div><Label>Target</Label><Input type="number" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} placeholder="75" /></div>
            <div><Label>Unit</Label><Input value={form.target_unit} onChange={(e) => setForm({ ...form, target_unit: e.target.value })} placeholder="kg" /></div>
            <div><Label>Target date</Label><Input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button size="sm" onClick={() => addGoal.mutate()} disabled={!form.title || addGoal.isPending}>Save</Button>
          </div>
        </Card>
      )}

      {goals.length === 0 && !adding && (
        <Card className="p-8 text-center">
          <Target className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No goals yet — add one to start tracking progress</p>
        </Card>
      )}

      <div className="space-y-2">
        {goals.map((g: any) => {
          const baseline = Number(g.baseline_value) || 0;
          const target = Number(g.target_value) || 0;
          const current = latestWeight?.weight_kg ?? baseline;
          let pct = 0, label = "";
          if (g.goal_type === "weight_loss" && baseline > target) {
            pct = Math.max(0, Math.min(100, ((baseline - current) / (baseline - target)) * 100));
            label = `${(baseline - current).toFixed(1)} / ${(baseline - target).toFixed(1)} ${g.target_unit || "kg"} lost`;
          } else if (g.goal_type === "weight_gain" && target > baseline) {
            pct = Math.max(0, Math.min(100, ((current - baseline) / (target - baseline)) * 100));
            label = `${(current - baseline).toFixed(1)} / ${(target - baseline).toFixed(1)} ${g.target_unit || "kg"} gained`;
          }
          return (
            <Card key={g.id} className={`p-4 ${g.is_active ? "border-primary/30" : "opacity-60"}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">{g.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{g.goal_type.replace("_", " ")} {g.target_date && `· by ${new Date(g.target_date).toLocaleDateString("en-GB")}`}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => toggleGoal.mutate({ id: g.id, is_active: !g.is_active })}><Check className={`h-4 w-4 ${g.is_active ? "text-primary" : "text-muted-foreground"}`} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteGoal.mutate(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              {label && (<><Progress value={pct} className="h-2" /><p className="text-xs text-muted-foreground mt-1">{label} · {pct.toFixed(0)}%</p></>)}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
