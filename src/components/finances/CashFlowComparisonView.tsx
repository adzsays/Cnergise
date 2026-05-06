import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserCurrency } from "@/hooks/useUserCurrency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SummaryRow = {
  planned_id: string;
  label: string;
  planned_monthly: number;
  actual_total: number;
  actual_monthly: number;
  variance: number;
  count: number;
};

export function CashFlowComparisonView({ auto = false, embedded = false, defaultMonths = "3" }: { auto?: boolean; embedded?: boolean; defaultMonths?: string } = {}) {
  const { format } = useUserCurrency();
  const [loading, setLoading] = useState(false);
  const [months, setMonths] = useState(defaultMonths);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [ranAt, setRanAt] = useState<Date | null>(null);

  const run = async (silent = false) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("compare-cashflow-actuals", {
        body: { monthsBack: Number(months) },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setSummary((data as any).summary ?? []);
      setInsights((data as any).insights ?? []);
      setRanAt(new Date());
      if (!silent) {
        if (((data as any).summary ?? []).length === 0) {
          toast.info((data as any).message || "Nothing to compare yet — upload bank actuals first.");
        } else {
          toast.success("AI mapping complete");
        }
      }
    } catch (e: any) {
      if (!silent) toast.error(e?.message || "Comparison failed");
    } finally {
      setLoading(false);
    }

  };

  useEffect(() => {
    if (auto) run(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, months]);


  const totals = summary.reduce(
    (acc, r) => {
      acc.planned += r.planned_monthly;
      acc.actual += r.actual_monthly;
      return acc;
    },
    { planned: 0, actual: 0 }
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> AI Cash Flow vs Actuals
            </h3>
            <p className="text-sm text-muted-foreground">
              Auto-map your real bank transactions to your planned cash flow lines and surface variances.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={months} onValueChange={setMonths}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 1 month</SelectItem>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={run} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Run AI comparison
            </Button>
          </div>
        </div>
        {ranAt && (
          <p className="text-xs text-muted-foreground mt-2">Last run: {ranAt.toLocaleString()}</p>
        )}
      </Card>

      {summary.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Planned monthly</div>
              <div className="text-xl font-semibold tabular-nums">{format(totals.planned)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Actual monthly avg</div>
              <div className="text-xl font-semibold tabular-nums">{format(totals.actual)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Net variance</div>
              <div className={`text-xl font-semibold tabular-nums flex items-center gap-1 ${totals.planned - totals.actual < 0 ? "text-destructive" : "text-green-600"}`}>
                {totals.planned - totals.actual < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                {format(totals.planned - totals.actual)}
              </div>
            </Card>
          </div>

          {insights.length > 0 && (
            <Card className="p-4">
              <div className="text-sm font-medium mb-2">AI insights</div>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                {insights.map((i, idx) => <li key={idx}>{i}</li>)}
              </ul>
            </Card>
          )}

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Planned / mo</TableHead>
                    <TableHead className="text-right">Actual / mo</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-right"># Tx</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.map((r, idx) => {
                    const over = r.variance < 0;
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{r.label}</span>
                            {!r.planned_id && <Badge variant="outline" className="text-[10px]">Unmapped</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{format(r.planned_monthly)}</TableCell>
                        <TableCell className="text-right tabular-nums">{format(r.actual_monthly)}</TableCell>
                        <TableCell className={`text-right tabular-nums ${over ? "text-destructive" : "text-green-600"}`}>
                          {format(r.variance)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      {!loading && summary.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Click "Run AI comparison" to auto-map your actual expenses against your planned cash flow.
        </Card>
      )}
    </div>
  );
}
