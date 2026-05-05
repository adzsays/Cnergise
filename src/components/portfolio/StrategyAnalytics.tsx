import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { SleekChart } from "@/components/ui/SleekChart";

export function StrategyAnalytics({ strategyId, bundleId, label }: { strategyId?: string; bundleId?: string; label: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const run = async () => {
    setLoading(true);
    const { data: res, error } = await supabase.functions.invoke("strategy-analytics", {
      body: { strategy_id: strategyId, bundle_id: bundleId },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if ((res as any)?.error) return toast.error((res as any).error);
    setData(res);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-5 w-5 text-primary" /> Analytics</CardTitle>
            <CardDescription>Backtest + live tracking for {label}, benchmarked vs SPX/BTC.</CardDescription>
          </div>
          <Button size="sm" onClick={run} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run analysis"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data && <p className="text-sm text-muted-foreground">Click Run analysis to compute returns, Sharpe, drawdown, win rate, and equity curve.</p>}
        {data?.metrics && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                ["Cum. return", `${data.metrics.cumulative_return_pct?.toFixed(1)}%`],
                ["Benchmark", `${data.metrics.benchmark_return_pct?.toFixed(1)}%`],
                ["Sharpe", data.metrics.sharpe_ratio?.toFixed(2)],
                ["Max DD", `${data.metrics.max_drawdown_pct?.toFixed(1)}%`],
                ["Win rate", `${data.metrics.win_rate_pct?.toFixed(1)}%`],
                ["Volatility", `${data.metrics.volatility_pct?.toFixed(1)}%`],
                ["Trades", data.metrics.trades_count],
                ["Exposure", `${data.metrics.exposure_pct?.toFixed(1) ?? "—"}%`],
              ].map(([k, v]) => (
                <div key={String(k)} className="rounded border p-2">
                  <div className="text-muted-foreground">{k}</div>
                  <div className="font-medium tabular-nums">{v ?? "—"}</div>
                </div>
              ))}
            </div>
            {data.equity_curve?.length > 0 && (
              <SleekChart
                kind="line"
                data={data.equity_curve}
                xKey="month"
                series={[
                  { key: "strategy", label: "Strategy", color: "primary" },
                  { key: "benchmark", label: "Benchmark", hsl: "152 58% 48%" },
                ]}
                title="Equity curve"
                subtitle="Cumulative % return"
                valueFormatter={(v) => `${v}%`}
                compactHeight={140}
                expandedHeight={340}
              />
            )}
            {data.summary && <p className="text-sm text-muted-foreground whitespace-pre-line">{data.summary}</p>}
            {data.risk_assessment && <div className="rounded-md border bg-muted/40 p-3 text-xs"><span className="font-medium">Risk note:</span> {data.risk_assessment}</div>}
            {data.recommendations?.length > 0 && (
              <ul className="text-xs list-disc pl-5 space-y-1">
                {data.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
