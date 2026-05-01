import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Activity, DollarSign, Heart, TrendingUp } from "lucide-react";
import { format, subDays, startOfWeek } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = [
  "hsl(152,58%,48%)",
  "hsl(38,92%,50%)",
  "hsl(220,70%,55%)",
  "hsl(350,65%,55%)",
  "hsl(270,60%,55%)",
];

type Entry = {
  type: string;
  title: string;
  amount: number | null;
  unit: string | null;
  entry_date: string;
};

export default function EchoStats({
  entries, formatCurrency,
}: { entries: Entry[]; formatCurrency: (n: number) => string }) {
  const today = new Date().toISOString().split("T")[0];
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const stats = useMemo(() => {
    const todayEntries = entries.filter((e) => e.entry_date === today);
    const weekEntries = entries.filter((e) => e.entry_date >= weekStart);
    const monthStart = format(subDays(new Date(), 30), "yyyy-MM-dd");

    const isSpend = (e: Entry) => e.type === "spending" || e.type === "finance";
    const weekSpending = weekEntries.filter(isSpend).reduce((s, e) => s + (e.amount || 0), 0);
    const monthSpending = entries
      .filter((e) => isSpend(e) && e.entry_date >= monthStart)
      .reduce((s, e) => s + (e.amount || 0), 0);

    const spendingByDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const total = entries.filter((e) => isSpend(e) && e.entry_date === d).reduce((s, e) => s + (e.amount || 0), 0);
      spendingByDay.push({ date: format(subDays(new Date(), i), "EEE"), amount: total });
    }

    const healthTypes = ["exercise", "fitness", "health", "wellness"];
    const healthEntries = entries.filter((e) => healthTypes.includes(e.type));
    const weekHealthCount = weekEntries.filter((e) => healthTypes.includes(e.type)).length;
    const healthByDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      healthByDay.push({
        date: format(subDays(new Date(), i), "EEE"),
        count: healthEntries.filter((e) => e.entry_date === d).length,
      });
    }

    const typeDist: Record<string, number> = {};
    entries.filter((e) => e.entry_date >= monthStart).forEach((e) => {
      typeDist[e.type] = (typeDist[e.type] || 0) + 1;
    });
    const typeDistArr = Object.entries(typeDist)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    return {
      todayCount: todayEntries.length,
      weekCount: weekEntries.length,
      weekSpending,
      monthSpending,
      spendingByDay,
      healthByDay,
      weekHealthCount,
      typeDistArr,
    };
  }, [entries, today, weekStart]);

  const chartConfig = {
    amount: { label: "Spent", color: "hsl(38,92%,50%)" },
    count: { label: "Activities", color: "hsl(152,58%,48%)" },
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <QuickStat Icon={Activity} label="Today" value={stats.todayCount} sub={`${stats.weekCount} this week`} color="text-primary" />
        <QuickStat Icon={DollarSign} label="Week Spend" value={formatCurrency(stats.weekSpending)} sub={`${formatCurrency(stats.monthSpending)} / 30d`} color="text-amber-500" />
        <QuickStat Icon={Heart} label="Health" value={stats.weekHealthCount} sub="activities this week" color="text-rose-500" />
        <QuickStat Icon={TrendingUp} label="Total" value={entries.length} sub="logged entries" color="text-blue-500" />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-sm">Spending — Last 7 Days</h3>
        </div>
        {stats.spendingByDay.some((d) => d.amount > 0) ? (
          <ChartContainer config={chartConfig} className="h-40 w-full">
            <BarChart data={stats.spendingByDay}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="amount" fill="hsl(38,92%,50%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-6">No spending data yet</p>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-rose-500" />
          <h3 className="font-semibold text-sm">Health & Exercise — Last 7 Days</h3>
        </div>
        {stats.healthByDay.some((d) => d.count > 0) ? (
          <ChartContainer config={chartConfig} className="h-40 w-full">
            <LineChart data={stats.healthByDay}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="count" stroke="hsl(152,58%,48%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ChartContainer>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-6">No health entries yet</p>
        )}
      </Card>

      {stats.typeDistArr.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Activity Breakdown (30d)</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 flex-shrink-0">
              <PieChart width={112} height={112}>
                <Pie data={stats.typeDistArr} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={20} outerRadius={45}>
                  {stats.typeDistArr.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </div>
            <div className="flex-1 space-y-2">
              {stats.typeDistArr.map((item, i) => (
                <div key={item.type} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="capitalize">{item.type}</span>
                  </div>
                  <span className="font-mono text-muted-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function QuickStat({
  Icon, label, value, sub, color,
}: { Icon: any; label: string; value: string | number; sub: string; color: string }) {
  return (
    <Card className="p-3 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </Card>
  );
}
