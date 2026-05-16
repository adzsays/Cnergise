import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smile, Trash2 } from "lucide-react";
import { SleekChart } from "@/components/ui/SleekChart";
import { toast } from "sonner";

export function MoodView() {
  const qc = useQueryClient();
  const [mood, setMood] = useState(7);
  const [stress, setStress] = useState(4);
  const [energy, setEnergy] = useState(7);
  const [notes, setNotes] = useState("");

  const { data: entries = [] } = useQuery({
    queryKey: ["mood-recent"],
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data } = await supabase.from("mood_log").select("*").gte("logged_at", since.toISOString()).order("logged_at", { ascending: false });
      return data || [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("mood_log").insert({
        user_id: user.id, mood_score: mood, stress_score: stress, energy_score: energy, notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mood logged");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["mood-recent"] });
      qc.invalidateQueries({ queryKey: ["mood-today"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mood_log").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mood-recent"] });
      qc.invalidateQueries({ queryKey: ["mood-today"] });
    },
  });

  const chartData = [...entries].slice(0, 14).reverse().map((e: any) => ({
    date: new Date(e.logged_at).toLocaleDateString("en", { day: "2-digit", month: "short" }),
    mood: e.mood_score, stress: e.stress_score, energy: e.energy_score,
  }));

  const Slider = ({ label, value, set, color }: { label: string; value: number; set: (n: number) => void; color: string }) => (
    <div>
      <div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-semibold tabular-nums">{value}/10</span></div>
      <input type="range" min={1} max={10} value={value} onChange={(e) => set(Number(e.target.value))} className={`w-full ${color}`} />
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="font-semibold flex items-center gap-1.5 mb-4"><Smile className="h-4 w-4" />How are you feeling?</h2>
        <div className="space-y-4">
          <Slider label="Mood" value={mood} set={setMood} color="accent-yellow-500" />
          <Slider label="Stress" value={stress} set={setStress} color="accent-rose-500" />
          <Slider label="Energy" value={energy} set={setEnergy} color="accent-emerald-500" />
          <div><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional context…" /></div>
          <Button size="sm" onClick={() => add.mutate()} disabled={add.isPending}>Log check-in</Button>
        </div>
      </Card>

      {chartData.length > 1 && (
        <SleekChart
          kind="line"
          data={chartData}
          xKey="date"
          series={[
            { key: "mood", label: "Mood", hsl: "48 96% 53%" },
            { key: "stress", label: "Stress", hsl: "0 84% 60%" },
            { key: "energy", label: "Energy", hsl: "160 84% 39%" },
          ]}
          title="Trend · 14 days"
          valueFormatter={(v) => `${v}`}
          compactHeight={150}
        />
      )}

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Recent check-ins</h3>
        {entries.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No check-ins yet</p> : (
          <div className="space-y-2">
            {entries.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div>
                  <p className="text-xs text-muted-foreground">{new Date(e.logged_at).toLocaleString("en-GB")}</p>
                  <p>Mood {e.mood_score ?? "—"} · Stress {e.stress_score ?? "—"} · Energy {e.energy_score ?? "—"} {e.notes && <span className="text-muted-foreground">· {e.notes}</span>}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => del.mutate(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
