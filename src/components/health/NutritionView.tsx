import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Apple } from "lucide-react";
import { toast } from "sonner";

const MEALS = ["breakfast", "lunch", "dinner", "snack", "drink"] as const;

const COMMON_FOODS: { name: string; cal: number; p: number; c: number; f: number }[] = [
  { name: "Egg (1 large)", cal: 78, p: 6, c: 0.6, f: 5 },
  { name: "Banana", cal: 105, p: 1.3, c: 27, f: 0.4 },
  { name: "Chicken breast 100g", cal: 165, p: 31, c: 0, f: 3.6 },
  { name: "Rice cooked 100g", cal: 130, p: 2.7, c: 28, f: 0.3 },
  { name: "Oats 50g", cal: 190, p: 7, c: 33, f: 3.5 },
  { name: "Greek yogurt 150g", cal: 90, p: 15, c: 6, f: 0.7 },
  { name: "Avocado (½)", cal: 160, p: 2, c: 9, f: 15 },
  { name: "Apple", cal: 95, p: 0.5, c: 25, f: 0.3 },
];

export function NutritionView() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ food_name: "", meal_type: "snack", calories: "", protein_g: "", carbs_g: "", fat_g: "", water_ml: "" });

  const { data: entries = [] } = useQuery({
    queryKey: ["nutrition-recent"],
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 7);
      const { data } = await supabase.from("nutrition_log").select("*").gte("logged_at", since.toISOString()).order("logged_at", { ascending: false });
      return data || [];
    },
  });

  const addEntry = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("nutrition_log").insert({
        user_id: user.id,
        food_name: form.food_name || "Unnamed",
        meal_type: form.meal_type as any,
        calories: form.calories ? Number(form.calories) : null,
        protein_g: form.protein_g ? Number(form.protein_g) : null,
        carbs_g: form.carbs_g ? Number(form.carbs_g) : null,
        fat_g: form.fat_g ? Number(form.fat_g) : null,
        water_ml: form.water_ml ? Number(form.water_ml) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Logged");
      setForm({ food_name: "", meal_type: "snack", calories: "", protein_g: "", carbs_g: "", fat_g: "", water_ml: "" });
      qc.invalidateQueries({ queryKey: ["nutrition-recent"] });
      qc.invalidateQueries({ queryKey: ["nutrition-today"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("nutrition_log").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nutrition-recent"] });
      qc.invalidateQueries({ queryKey: ["nutrition-today"] });
    },
  });

  const quickWater = (ml: number) => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase.from("nutrition_log").insert({ user_id: data.user.id, food_name: "Water", meal_type: "drink", water_ml: ml }).then(() => {
        toast.success(`${ml} ml water logged`);
        qc.invalidateQueries({ queryKey: ["nutrition-recent"] });
        qc.invalidateQueries({ queryKey: ["nutrition-today"] });
      });
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="font-semibold flex items-center gap-1.5 mb-3"><Apple className="h-4 w-4" />Quick add</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {COMMON_FOODS.map((f) => (
            <Button key={f.name} variant="outline" size="sm" onClick={() => setForm({ ...form, food_name: f.name, calories: String(f.cal), protein_g: String(f.p), carbs_g: String(f.c), fat_g: String(f.f) })}>
              {f.name} · {f.cal} kcal
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {[250, 500, 750].map((ml) => (
            <Button key={ml} variant="secondary" size="sm" onClick={() => quickWater(ml)}>+{ml} ml water</Button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2"><Label>Food</Label><Input value={form.food_name} onChange={(e) => setForm({ ...form, food_name: e.target.value })} /></div>
          <div><Label>Meal</Label>
            <Select value={form.meal_type} onValueChange={(v) => setForm({ ...form, meal_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MEALS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Calories</Label><Input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} /></div>
          <div><Label>Protein (g)</Label><Input type="number" value={form.protein_g} onChange={(e) => setForm({ ...form, protein_g: e.target.value })} /></div>
          <div><Label>Carbs (g)</Label><Input type="number" value={form.carbs_g} onChange={(e) => setForm({ ...form, carbs_g: e.target.value })} /></div>
          <div><Label>Fat (g)</Label><Input type="number" value={form.fat_g} onChange={(e) => setForm({ ...form, fat_g: e.target.value })} /></div>
          <div><Label>Water (ml)</Label><Input type="number" value={form.water_ml} onChange={(e) => setForm({ ...form, water_ml: e.target.value })} /></div>
        </div>
        <div className="flex justify-end mt-3"><Button size="sm" onClick={() => addEntry.mutate()} disabled={!form.food_name || addEntry.isPending}><Plus className="h-4 w-4 mr-1" />Log</Button></div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Recent entries · 7 days</h3>
        {entries.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No entries yet</p> : (
          <div className="space-y-2">
            {entries.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{e.food_name} <span className="text-xs text-muted-foreground capitalize">· {e.meal_type}</span></p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.logged_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {e.calories ? ` · ${e.calories} kcal` : ""}
                    {e.protein_g ? ` · P${e.protein_g}g` : ""}
                    {e.water_ml ? ` · ${e.water_ml}ml` : ""}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => delEntry.mutate(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
