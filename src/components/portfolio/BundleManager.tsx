import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Layers, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { StrategyAnalytics } from "./StrategyAnalytics";

export function BundleManager({ riskBand }: { riskBand?: string }) {
  const [bundles, setBundles] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, any[]>>({});
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "" });
  const [analyticsFor, setAnalyticsFor] = useState<string | null>(null);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: b }, { data: s }, { data: it }] = await Promise.all([
      supabase.from("strategy_bundles").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("trading_strategies").select("*").eq("user_id", user.id).order("name"),
      supabase.from("strategy_bundle_items").select("*, strategy:trading_strategies(name)").eq("user_id", user.id),
    ]);
    setBundles(b || []);
    setStrategies(s || []);
    const grouped: Record<string, any[]> = {};
    (it || []).forEach((row: any) => {
      grouped[row.bundle_id] = grouped[row.bundle_id] || [];
      grouped[row.bundle_id].push(row);
    });
    setItems(grouped);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.name) return toast.error("Name required");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("strategy_bundles").insert({
      user_id: user.id, name: draft.name, description: draft.description, target_risk_band: riskBand || null,
    });
    if (error) return toast.error(error.message);
    setDraft({ name: "", description: "" });
    setCreating(false);
    load();
  };

  const addItem = async (bundleId: string, strategyId: string, weight: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("strategy_bundle_items").insert({
      user_id: user.id, bundle_id: bundleId, strategy_id: strategyId, weight_pct: weight,
    });
    if (error) return toast.error(error.message);
    load();
  };

  const removeItem = async (id: string) => {
    await supabase.from("strategy_bundle_items").delete().eq("id", id);
    load();
  };

  const removeBundle = async (id: string) => {
    if (!confirm("Delete bundle?")) return;
    await supabase.from("strategy_bundles").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Layers className="h-5 w-5 text-primary" /> Strategy Bundles</CardTitle>
              <CardDescription>Combine strategies with weights — your personal structured product.</CardDescription>
            </div>
            <Button size="sm" onClick={() => setCreating(!creating)}><Plus className="h-4 w-4 mr-1" />New</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {creating && (
            <div className="rounded-md border p-3 space-y-2 bg-muted/30">
              <div className="space-y-1"><Label>Bundle name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Balanced Momentum" /></div>
              <div className="space-y-1"><Label>Description</Label><Input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
              <Button onClick={create} className="w-full">Create bundle</Button>
            </div>
          )}

          {bundles.length === 0 && !creating && <p className="text-sm text-muted-foreground">No bundles yet.</p>}

          {bundles.map((b) => {
            const totalWeight = (items[b.id] || []).reduce((s, i) => s + Number(i.weight_pct || 0), 0);
            return (
              <div key={b.id} className="rounded-md border p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{b.name}</span>
                      {b.target_risk_band && <Badge variant="secondary" className="text-xs">{b.target_risk_band}</Badge>}
                      <Badge variant={totalWeight === 100 ? "default" : "outline"} className="text-xs">{totalWeight}% allocated</Badge>
                    </div>
                    {b.description && <p className="text-xs text-muted-foreground">{b.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setAnalyticsFor(analyticsFor === b.id ? null : b.id)}>
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeBundle(b.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>

                <div className="space-y-1">
                  {(items[b.id] || []).map((it) => (
                    <div key={it.id} className="flex items-center justify-between text-sm rounded border px-2 py-1.5">
                      <span>{it.strategy?.name || "—"}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs tabular-nums">{it.weight_pct}%</span>
                        <Button size="sm" variant="ghost" onClick={() => removeItem(it.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>

                <AddItemForm strategies={strategies.filter((s) => !(items[b.id] || []).some((i) => i.strategy_id === s.id))} onAdd={(sid, w) => addItem(b.id, sid, w)} />

                {analyticsFor === b.id && <StrategyAnalytics bundleId={b.id} label={b.name} />}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function AddItemForm({ strategies, onAdd }: { strategies: any[]; onAdd: (sid: string, weight: number) => void }) {
  const [sid, setSid] = useState("");
  const [w, setW] = useState(10);
  if (strategies.length === 0) return <p className="text-xs text-muted-foreground">All strategies added.</p>;
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 space-y-1">
        <Label className="text-xs">Strategy</Label>
        <select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={sid} onChange={(e) => setSid(e.target.value)}>
          <option value="">Pick…</option>
          {strategies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="w-24 space-y-1">
        <Label className="text-xs">Weight %</Label>
        <Input type="number" value={w} onChange={(e) => setW(Number(e.target.value))} />
      </div>
      <Button size="sm" disabled={!sid} onClick={() => { onAdd(sid, w); setSid(""); setW(10); }}>Add</Button>
    </div>
  );
}
