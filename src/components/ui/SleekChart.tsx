import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SleekChartKind = "area" | "line" | "bar" | "pie";

export type SleekSeries = {
  key: string;
  label: string;
  /** semantic token name, e.g. "primary", "income", "expense", "destructive" */
  color?: string;
  /** raw HSL fallback (e.g. "199 89% 48%") */
  hsl?: string;
};

export interface SleekChartProps {
  kind: SleekChartKind;
  data: any[];
  series: SleekSeries[];
  /** key in data items to use for x-axis / pie label */
  xKey: string;
  title: string;
  subtitle?: string;
  /** big number shown above the sparkline in compact mode */
  kpi?: string | number;
  /** delta % e.g. +12.4 for a colored chip */
  deltaPct?: number;
  /** value formatter for tooltip & axes */
  valueFormatter?: (v: number) => string;
  /** chart height in compact mode (default 96) */
  compactHeight?: number;
  /** chart height in expanded view (default 360) */
  expandedHeight?: number;
  /** if true, show the chart inline at full size and skip the compact card frame */
  inline?: boolean;
  className?: string;
  emptyLabel?: string;
  /** stack bar series in bar charts */
  stacked?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const tokenColor = (s: SleekSeries, fallbackIdx: number) => {
  if (s.hsl) return `hsl(${s.hsl})`;
  if (s.color) return `hsl(var(--${s.color}))`;
  // Fallback palette using chart tokens from the design system
  const palette = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];
  return `hsl(var(--${palette[fallbackIdx % palette.length]}))`;
};

const defaultFormatter = (v: number) =>
  Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`;

/* ------------------------------------------------------------------ */
/*  Tooltip                                                            */
/* ------------------------------------------------------------------ */

const SleekTooltip = ({
  active,
  payload,
  label,
  formatter,
}: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-popover/95 backdrop-blur px-3 py-2 shadow-lg text-xs">
      {label !== undefined && (
        <div className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">
          {label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: p.color || p.fill }}
            />
            <span className="text-foreground/80">{p.name}</span>
            <span className="ml-auto font-semibold tabular-nums">
              {formatter ? formatter(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Inner chart renderer (used in both compact + expanded)             */
/* ------------------------------------------------------------------ */

interface RenderProps extends Pick<SleekChartProps, "data" | "series" | "xKey" | "kind" | "valueFormatter" | "stacked"> {
  compact?: boolean;
}

const ChartBody = ({ kind, data, series, xKey, valueFormatter, compact, stacked }: RenderProps) => {
  const fmt = valueFormatter || defaultFormatter;
  const colors = useMemo(() => series.map((s, i) => tokenColor(s, i)), [series]);

  const axisTick = {
    fontSize: 10,
    fill: "hsl(var(--muted-foreground))",
  };

  if (kind === "pie") {
    const inner = compact ? 22 : 60;
    const outer = compact ? 38 : 95;
    const dataKey = series[0]?.key || "value";
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            innerRadius={inner}
            outerRadius={outer}
            paddingAngle={3}
            stroke="hsl(var(--background))"
            strokeWidth={2}
            isAnimationActive
          >
            {data.map((_, i) => (
              <Cell key={i} fill={tokenColor(series[0], i)} />
            ))}
          </Pie>
          {!compact && (
            <Tooltip
              content={(props) => <SleekTooltip {...props} formatter={fmt} />}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    );
  }

  const sharedAxes = !compact && (
    <>
      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} opacity={0.4} />
      <XAxis
        dataKey={xKey}
        tick={axisTick}
        tickLine={false}
        axisLine={false}
        interval="preserveStartEnd"
        minTickGap={20}
      />
      <YAxis
        tick={axisTick}
        tickLine={false}
        axisLine={false}
        tickFormatter={(v) => fmt(v as number)}
        width={42}
      />
      <Tooltip
        cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
        content={(props) => <SleekTooltip {...props} formatter={fmt} />}
      />
    </>
  );

  if (kind === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: compact ? -25 : -10, bottom: 0 }}>
          {sharedAxes}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={colors[i]}
              radius={stacked ? (i === series.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]) : [6, 6, 0, 0]}
              stackId={stacked ? "a" : undefined}
              isAnimationActive
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (kind === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: compact ? -25 : -10, bottom: 0 }}>
          {sharedAxes}
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={colors[i]}
              strokeWidth={compact ? 2 : 2.5}
              dot={false}
              activeDot={compact ? false : { r: 4, strokeWidth: 0 }}
              isAnimationActive
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // area (default)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: compact ? -25 : -10, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`sleek-grad-${s.key}-${compact ? "c" : "e"}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[i]} stopOpacity={0.45} />
              <stop offset="100%" stopColor={colors[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {sharedAxes}
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={colors[i]}
            strokeWidth={compact ? 2 : 2.5}
            fill={`url(#sleek-grad-${s.key}-${compact ? "c" : "e"})`}
            isAnimationActive
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};

/* ------------------------------------------------------------------ */
/*  Public component                                                   */
/* ------------------------------------------------------------------ */

export function SleekChart(props: SleekChartProps) {
  const {
    kind,
    data,
    series,
    xKey,
    title,
    subtitle,
    kpi,
    deltaPct,
    valueFormatter,
    compactHeight = 96,
    expandedHeight = 360,
    inline,
    className,
    emptyLabel = "No data yet",
    stacked,
  } = props;

  const [open, setOpen] = useState(false);
  const isEmpty = !data || data.length === 0 || (kind === "pie" && data.every((d) => !d[series[0]?.key || "value"]));

  /* Inline mode: just render the chart at expanded size, no card frame */
  if (inline) {
    return (
      <div className={cn("w-full", className)} style={{ height: expandedHeight }}>
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">{emptyLabel}</div>
        ) : (
          <ChartBody kind={kind} data={data} series={series} xKey={xKey} valueFormatter={valueFormatter} stacked={stacked} />
        )}
      </div>
    );
  }

  const deltaUp = (deltaPct ?? 0) >= 0;

  return (
    <Card className={cn("relative overflow-hidden border-border/60", className)}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Expand chart"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl p-0 gap-0">
              <DialogHeader className="p-5 pb-2">
                <DialogTitle className="text-base">{title}</DialogTitle>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
              </DialogHeader>
              <div className="px-2 sm:px-5 pb-5">
                <div style={{ height: expandedHeight }}>
                  {isEmpty ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{emptyLabel}</div>
                  ) : (
                    <ChartBody kind={kind} data={data} series={series} xKey={xKey} valueFormatter={valueFormatter} stacked={stacked} />
                  )}
                </div>
                {series.length > 1 && (
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t mt-3">
                    {series.map((s, i) => (
                      <div key={s.key} className="flex items-center gap-1.5 text-xs">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: tokenColor(s, i) }}
                        />
                        <span className="text-muted-foreground">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {(kpi !== undefined || deltaPct !== undefined) && (
          <div className="flex items-baseline gap-2 mt-2">
            {kpi !== undefined && (
              <span className="text-2xl font-bold tabular-nums tracking-tight">{kpi}</span>
            )}
            {deltaPct !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  deltaUp
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}
              >
                {deltaUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {deltaUp ? "+" : ""}
                {deltaPct.toFixed(1)}%
              </span>
            )}
          </div>
        )}

        <div className="mt-3" style={{ height: compactHeight }}>
          {isEmpty ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">{emptyLabel}</div>
          ) : (
            <ChartBody kind={kind} data={data} series={series} xKey={xKey} valueFormatter={valueFormatter} stacked={stacked} compact />
          )}
        </div>
      </div>
    </Card>
  );
}

export default SleekChart;
