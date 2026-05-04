import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function LiveHoldings() {
  const [rows, setRows] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("broker_positions").select("*").eq("user_id", user.id).order("market_value", { ascending: false });
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);

  const sync = async () => {
    setSyncing(true);
    const { error } = await supabase.functions.invoke("ibkr-sync-portfolio", { body: {} });
    setSyncing(false);
    if (error) toast.error(error.message); else { toast.success("Synced"); load(); }
  };

  const totalValue = rows.reduce((s, r) => s + Number(r.market_value || 0), 0);
  const totalPnl = rows.reduce((s, r) => s + Number(r.unrealized_pnl || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Live Holdings</CardTitle>
          <Button size="sm" variant="outline" onClick={sync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} /> Sync
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded border p-3"><p className="text-xs text-muted-foreground">Market Value</p><p className="text-lg font-semibold tabular-nums">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
          <div className="rounded border p-3"><p className="text-xs text-muted-foreground">Unrealized P&L</p><p className={`text-lg font-semibold tabular-nums ${totalPnl >= 0 ? "text-green-600" : "text-red-600"}`}>${totalPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No positions. Click Sync to load.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Avg Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.symbol}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(r.quantity).toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">${Number(r.avg_cost || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">${Number(r.market_price || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">${Number(r.market_value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                    <TableCell className={`text-right tabular-nums ${Number(r.unrealized_pnl) >= 0 ? "text-green-600" : "text-red-600"}`}>${Number(r.unrealized_pnl || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
