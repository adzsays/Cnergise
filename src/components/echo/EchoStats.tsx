import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Activity, DollarSign, Heart, TrendingUp } from "lucide-react";
import { format, subDays, startOfWeek } from "date-fns";
import { SleekChart } from "@/components/ui/SleekChart";

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <QuickStat Icon={Activity} label="Today" value={stats.todayCount} sub={`${stats.weekCount} this week`} color="text-primary" />
        <QuickStat Icon={DollarSign} label="Week Spend" value={formatCurrency(stats.weekSpending)} sub={`${formatCurrency(stats.monthSpending)} / 30d`} color="text-amber-500" />
        <QuickStat Icon={Heart} label="Health" value={stats.weekHealthCount} sub="activities this week" color="text-rose-500" />
        <QuickStat Icon={TrendingUp} label="Total" value={entries.length} sub="logged entries" color="text-blue-500" />
      </div>

      <SleekChart
        kind="bar"
        data={stats.spendingByDay}
        xKey="date"
        series={[{ key: "amount", label: "Spent", hsl: "38 92% 50%" }]}
        title="Spending"
        subtitle="Last 7 days"
        kpi={formatCurrency(stats.weekSpending)}
        valueFormatter={formatCurrency}
        compactHeight={110}
      />

      <SleekChart
        kind="line"
        data={stats.healthByDay}
        xKey="date"
        series={[{ key: "count", label: "Activities", hsl: "152 58% 48%" }]}
        title="Health & Exercise"
        subtitle="Last 7 days"
        kpi={stats.weekHealthCount}
        compactHeight={110}
      />

      {stats.typeDistArr.length > 0 && (
        <SleekChart
          kind="pie"
          data={stats.typeDistArr}
          xKey="type"
          series={[{ key: "count", label: "Entries" }]}
          title="Activity Breakdown"
          subtitle="Last 30 days"
          compactHeight={140}
        />
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
