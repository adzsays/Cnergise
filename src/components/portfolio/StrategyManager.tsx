import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Brain, Plus, Sparkles, Loader2, Trash2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { StrategyAnalytics } from "./StrategyAnalytics";

export function StrategyManager() {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [analyticsFor, setAnalyticsFor] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: "", description: "", asset_universe: "",
    ai_prompt: "Identify high-conviction opportunities based on momentum, news catalysts, and risk-adjusted return.",
    max_position_pct: 5, stop_loss_pct: 5, take_profit_pct: 10, auto_execute: false,
  });

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: s }, { data: sig }] = await Promise.all([
      supabase.from("trading_strategies").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("ai_trade_signals").select("*").eq("user_id", user.id).order("generated_at", { ascending: false }).limit(20),
    ]);
    setStrategies(s || []);
    setSignals(sig || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.name) return toast.error("Name required");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = {
      user_id: user.id,
      name: draft.name,
      description: draft.description,
      strategy_type: "ai_signal",
      asset_universe: draft.asset_universe.split(",").map((s) => s.trim()).filter(Boolean),
      ai_prompt: draft.ai_prompt,
      max_position_pct: draft.max_position_pct,
      stop_loss_pct: draft.stop_loss_pct,
      take_profit_pct: draft.take_profit_pct,
      auto_execute: draft.auto_execute,
      status: "active",
    };
    const { error } = await supabase.from("trading_strategies").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Strategy created");
    setCreating(false);
    setDraft({ ...draft, name: "", description: "", asset_universe: "" });
    load();
  };

  const runStrategy = async (s: any) => {
    setRunning(s.id);
    const { data, error } = await supabase.functions.invoke("ai-trading-signals", { body: { strategy_id: s.id } });
    setRunning(null);
    if (error) toast.error(error.message);
    else { toast.success(`Generated ${data?.signals?.length || 0} signals`); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete strategy?")) return;
    await supabase.from("trading_strategies").delete().eq("id", id);
    load();
  };

  const acknowledgeSignal = async (sig: any) => {
    await supabase.from("ai_trade_signals").update({ status: "acknowledged" }).eq("id", sig.id);
    toast.success("Marked as reviewed");
    load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Brain className="h-5 w-5 text-primary" /> AI Strategies</CardTitle>
              <CardDescription>Define strategies; AI generates trade signals you review before execution.</CardDescription>
            </div>
            <Button size="sm" onClick={() => setCreating(!creating)}><Plus className="h-4 w-4 mr-1" />New</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {creating && (
            <div className="rounded-md border p-3 space-y-3 bg-muted/30">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
                <div className="space-y-1"><Label>Asset universe (comma-separated)</Label><Input value={draft.asset_universe} onChange={(e) => setDraft({ ...draft, asset_universe: e.target.value })} placeholder="AAPL, MSFT, NVDA" /></div>
              </div>
              <div className="space-y-1"><Label>Description</Label><Input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
              <div className="space-y-1"><Label>AI Prompt</Label><Textarea rows={3} value={draft.ai_prompt} onChange={(e) => setDraft({ ...draft, ai_prompt: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label className="text-xs">Max position %</Label><Input type="number" value={draft.max_position_pct} onChange={(e) => setDraft({ ...draft, max_position_pct: parseFloat(e.target.value) })} /></div>
                <div className="space-y-1"><Label className="text-xs">Stop-loss %</Label><Input type="number" value={draft.stop_loss_pct} onChange={(e) => setDraft({ ...draft, stop_loss_pct: parseFloat(e.target.value) })} /></div>
                <div className="space-y-1"><Label className="text-xs">Take-profit %</Label><Input type="number" value={draft.take_profit_pct} onChange={(e) => setDraft({ ...draft, take_profit_pct: parseFloat(e.target.value) })} /></div>
              </div>
              <div className="flex items-center justify-between rounded border p-2">
                <Label className="text-xs">Auto-execute approved signals</Label>
                <Switch checked={draft.auto_execute} onCheckedChange={(v) => setDraft({ ...draft, auto_execute: v })} />
              </div>
              <Button onClick={create} className="w-full">Create Strategy</Button>
            </div>
          )}

          {strategies.length === 0 && !creating && <p className="text-sm text-muted-foreground">No strategies yet.</p>}

          {strategies.map((s) => (
            <div key={s.id} className="rounded-md border p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2"><span className="font-medium">{s.name}</span><Badge variant="secondary" className="text-xs">{s.status}</Badge></div>
                <p className="text-xs text-muted-foreground truncate">{s.description || s.ai_prompt}</p>
                {s.last_run_at && <p className="text-[10px] text-muted-foreground mt-1">Last run: {new Date(s.last_run_at).toLocaleString()}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => runStrategy(s)} disabled={running === s.id}>
                  {running === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent AI Signals</CardTitle></CardHeader>
        <CardContent>
          {signals.length === 0 && <p className="text-sm text-muted-foreground">No signals yet — run a strategy.</p>}
          <div className="space-y-2">
            {signals.map((s) => (
              <div key={s.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge className={s.side === "BUY" ? "bg-green-600" : s.side === "SELL" ? "bg-red-600" : ""}>{s.side}</Badge>
                    <span className="font-medium">{s.symbol}</span>
                    <span className="text-xs text-muted-foreground">conviction {Math.round(s.conviction || 0)}%</span>
                    <Badge variant="secondary" className="text-xs">{s.status}</Badge>
                  </div>
                  {s.status === "new" && s.side !== "HOLD" && (
                    <Button size="sm" onClick={() => executeSignal(s)} disabled={executing === s.id}>
                      {executing === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Execute"}
                    </Button>
                  )}
                </div>
                {s.rationale && <p className="text-xs text-muted-foreground mt-2">{s.rationale}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
