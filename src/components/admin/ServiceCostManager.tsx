import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserCurrency } from "@/hooks/useUserCurrency";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, DollarSign, Activity, Settings } from "lucide-react";

type Period = "7d" | "30d" | "90d" | "365d";

const PERIOD_DAYS: Record<Period, number> = { "7d": 7, "30d": 30, "90d": 90, "365d": 365 };

export const ServiceCostManager = () => {
  const { format } = useUserCurrency();
  const qc = useQueryClient();
  const [period, setPeriod] = useState<Period>("30d");

  const sinceISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - PERIOD_DAYS[period]);
    return d.toISOString();
  }, [period]);

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["service-usage-events", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_usage_events" as any)
        .select("service, operation, units, total_cost, currency, function_name, created_at")
        .gte("created_at", sinceISO)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: pricing = [] } = useQuery({
    queryKey: ["service-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_pricing" as any)
        .select("*")
        .order("service")
        .order("operation");
      if (error) throw error;
      return data ?? [];
    },
  });

  const totals = useMemo(() => {
    const byService = new Map<string, { service: string; cost: number; calls: number; units: number }>();
    let grand = 0;
    for (const e of events as any[]) {
      const cur = byService.get(e.service) || { service: e.service, cost: 0, calls: 0, units: 0 };
      cur.cost += Number(e.total_cost) || 0;
      cur.calls += 1;
      cur.units += Number(e.units) || 0;
      byService.set(e.service, cur);
      grand += Number(e.total_cost) || 0;
    }
    return { rows: Array.from(byService.values()).sort((a, b) => b.cost - a.cost), grand };
  }, [events]);

  const byOperation = useMemo(() => {
    const m = new Map<string, { service: string; operation: string; cost: number; calls: number }>();
    for (const e of events as any[]) {
      const k = `${e.service}::${e.operation}`;
      const cur = m.get(k) || { service: e.service, operation: e.operation, cost: 0, calls: 0 };
      cur.cost += Number(e.total_cost) || 0;
      cur.calls += 1;
      m.set(k, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.cost - a.cost);
  }, [events]);

  const upsertPrice = useMutation({
    mutationFn: async (row: any) => {
      const payload = {
        service: row.service.trim(),
        operation: (row.operation || "default").trim(),
        unit: row.unit || "call",
        unit_cost: Number(row.unit_cost) || 0,
        currency: row.currency || "GBP",
        notes: row.notes || null,
        is_active: row.is_active ?? true,
      };
      if (row.id) {
        const { error } = await supabase.from("service_pricing" as any).update(payload).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("service_pricing" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-pricing"] });
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const deletePrice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_pricing" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-pricing"] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" /> Service costs
        </CardTitle>
        <CardDescription>
          Track per-service API and infrastructure costs. Pricing rules drive auto-calculated totals from instrumented edge functions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview"><Activity className="h-4 w-4 mr-1" />Overview</TabsTrigger>
            <TabsTrigger value="events">Recent calls</TabsTrigger>
            <TabsTrigger value="pricing"><Settings className="h-4 w-4 mr-1" />Pricing rules</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold">{format(totals.grand)}</div>
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="365d">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingEvents ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>
                ) : totals.rows.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No usage recorded yet for this period.</TableCell></TableRow>
                ) : (
                  totals.rows.map((r) => (
                    <TableRow key={r.service}>
                      <TableCell className="font-medium">{r.service}</TableCell>
                      <TableCell className="text-right">{r.calls.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{r.units.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right">{format(r.cost)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {byOperation.length > 0 && (
              <div className="pt-4">
                <div className="text-sm font-medium mb-2">By operation</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead className="text-right">Calls</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byOperation.map((r) => (
                      <TableRow key={`${r.service}-${r.operation}`}>
                        <TableCell>{r.service}</TableCell>
                        <TableCell className="text-muted-foreground">{r.operation}</TableCell>
                        <TableCell className="text-right">{r.calls}</TableCell>
                        <TableCell className="text-right">{format(r.cost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Function</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(events as any[]).slice(0, 100).map((e, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</TableCell>
                    <TableCell>{e.service}</TableCell>
                    <TableCell className="text-muted-foreground">{e.operation}</TableCell>
                    <TableCell className="text-muted-foreground">{e.function_name || "—"}</TableCell>
                    <TableCell className="text-right">{Number(e.units).toLocaleString(undefined, { maximumFractionDigits: 3 })}</TableCell>
                    <TableCell className="text-right">{format(Number(e.total_cost))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4 mt-4">
            <PricingEditor pricing={pricing as any[]} onSave={(r) => upsertPrice.mutate(r)} onDelete={(id) => deletePrice.mutate(id)} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const PricingEditor = ({ pricing, onSave, onDelete }: { pricing: any[]; onSave: (r: any) => void; onDelete: (id: string) => void }) => {
  const [draft, setDraft] = useState({ service: "", operation: "default", unit: "call", unit_cost: 0, currency: "GBP", notes: "", is_active: true });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end p-3 border rounded-md">
        <div className="md:col-span-2">
          <Label className="text-xs">Service</Label>
          <Input value={draft.service} onChange={(e) => setDraft({ ...draft, service: e.target.value })} placeholder="e.g. lovable-ai" />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">Operation</Label>
          <Input value={draft.operation} onChange={(e) => setDraft({ ...draft, operation: e.target.value })} placeholder="e.g. google/gemini-2.5-flash" />
        </div>
        <div>
          <Label className="text-xs">Unit</Label>
          <Input value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} placeholder="call / 1k_tokens" />
        </div>
        <div>
          <Label className="text-xs">Unit cost</Label>
          <Input type="number" step="0.00000001" value={draft.unit_cost} onChange={(e) => setDraft({ ...draft, unit_cost: Number(e.target.value) })} />
        </div>
        <Button onClick={() => { onSave(draft); setDraft({ ...draft, service: "", operation: "default", unit_cost: 0 }); }}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Operation</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Cost / unit</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Active</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pricing.map((p) => (
            <PriceRow key={p.id} row={p} onSave={onSave} onDelete={() => onDelete(p.id)} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const PriceRow = ({ row, onSave, onDelete }: { row: any; onSave: (r: any) => void; onDelete: () => void }) => {
  const [edit, setEdit] = useState(row);
  useEffect(() => setEdit(row), [row]);
  const dirty = JSON.stringify(edit) !== JSON.stringify(row);
  return (
    <TableRow>
      <TableCell><Input value={edit.service} onChange={(e) => setEdit({ ...edit, service: e.target.value })} /></TableCell>
      <TableCell><Input value={edit.operation} onChange={(e) => setEdit({ ...edit, operation: e.target.value })} /></TableCell>
      <TableCell><Input value={edit.unit} onChange={(e) => setEdit({ ...edit, unit: e.target.value })} className="w-28" /></TableCell>
      <TableCell className="text-right"><Input type="number" step="0.00000001" value={edit.unit_cost} onChange={(e) => setEdit({ ...edit, unit_cost: Number(e.target.value) })} className="text-right" /></TableCell>
      <TableCell><Input value={edit.currency} onChange={(e) => setEdit({ ...edit, currency: e.target.value })} className="w-20" /></TableCell>
      <TableCell><Switch checked={edit.is_active} onCheckedChange={(v) => setEdit({ ...edit, is_active: v })} /></TableCell>
      <TableCell className="text-right space-x-1">
        {dirty && <Button size="sm" onClick={() => onSave(edit)}>Save</Button>}
        <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </TableCell>
    </TableRow>
  );
};
