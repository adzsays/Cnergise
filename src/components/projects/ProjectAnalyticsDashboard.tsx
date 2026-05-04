import React, { useState } from "react";
import { useProjectMetrics } from "@/hooks/useProjectMetrics";
import { useProjects } from "@/hooks/useProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SleekChart } from "@/components/ui/SleekChart";
import { 
  FolderKanban, 
  Users, 
  CheckCircle2, 
  Clock,
  Target,
  TrendingUp,
  Layers
} from "lucide-react";

const COLORS = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(142 76% 36%)",
  info: "hsl(199 89% 48%)",
  muted: "hsl(var(--muted-foreground))",
  todo: "hsl(var(--muted-foreground))",
  inProgress: "hsl(199 89% 48%)",
  done: "hsl(142 76% 36%)",
};

const PIE_COLORS = ["hsl(199 89% 48%)", "hsl(142 76% 36%)", "hsl(45 93% 47%)", "hsl(var(--muted-foreground))"];

export function ProjectAnalyticsDashboard() {
  const { metrics, isLoading } = useProjectMetrics();
  const { projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const projectStatusData = [
    { name: "Active", value: metrics.projectsBreakdown.active },
    { name: "Completed", value: metrics.projectsBreakdown.completed },
    { name: "On Hold", value: metrics.projectsBreakdown.onHold },
    { name: "Archived", value: metrics.projectsBreakdown.archived },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with project selector */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Project Analytics</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Track progress and performance across your projects</p>
        </div>
        <div className="flex items-center">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          icon={<FolderKanban className="h-5 w-5" />}
          label="Total Projects"
          value={metrics.totalProjects}
          badge={`${metrics.projectsBreakdown.active} active`}
        />
        <MetricCard 
          icon={<Layers className="h-5 w-5" />}
          label="Total Tasks"
          value={metrics.totalTasks}
          badge={`${metrics.todoTasks} pending`}
        />
        <MetricCard 
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Completed"
          value={metrics.completedTasks}
          badge={`${metrics.overallCompletion}%`}
          badgeVariant="success"
        />
        <MetricCard 
          icon={<Clock className="h-5 w-5" />}
          label="In Progress"
          value={metrics.inProgressTasks}
          badge="active"
        />
      </div>

      {/* Progress Chart & Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Progress Over Time */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2 px-3 md:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-sm md:text-base font-medium">Progress Over Time</CardTitle>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: COLORS.info }} />
                  <span className="text-muted-foreground">Target</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: COLORS.done }} />
                  <span className="text-muted-foreground">Completed</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[300px]">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={metrics.progressOverTime} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 10 }} 
                      stroke="hsl(var(--muted-foreground))"
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      stroke="hsl(var(--muted-foreground))"
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "11px"
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tasksTarget" 
                      stroke={COLORS.info}
                      strokeWidth={2}
                      dot={false}
                      name="Tasks Target"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tasksCompleted" 
                      stroke={COLORS.done}
                      strokeWidth={2}
                      dot={false}
                      name="Tasks Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Status Pie */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 px-3 md:px-6">
            <CardTitle className="text-sm md:text-base font-medium">Project Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center px-2 md:px-6">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {projectStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "11px"
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {projectStatusData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1 text-xs">
                  <div 
                    className="h-2 w-2 rounded-full" 
                    style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="font-medium">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Gauges & Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        <GaugeCard 
          title="% Complete" 
          value={metrics.overallCompletion} 
          subtitle="Overall Progress"
        />
        <GaugeCard 
          title="% Target" 
          value={Math.min(metrics.overallCompletion + 15, 100)} 
          subtitle="vs Target"
        />
        <Card className="border-border/50 col-span-2 md:col-span-1">
          <CardHeader className="pb-2 px-3 md:px-6">
            <CardTitle className="text-sm md:text-base font-medium">Summary</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="grid grid-cols-4 md:grid-cols-2 gap-2 md:gap-4">
              <div className="text-center p-2 md:p-3 bg-muted/30 rounded-lg">
                <div className="text-lg md:text-2xl font-bold">{metrics.totalProjects}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">Projects</div>
              </div>
              <div className="text-center p-2 md:p-3 bg-muted/30 rounded-lg">
                <div className="text-lg md:text-2xl font-bold">{metrics.teamStats.totalTeams}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">Teams</div>
              </div>
              <div className="text-center p-2 md:p-3 bg-muted/30 rounded-lg">
                <div className="text-lg md:text-2xl font-bold">{metrics.totalTasks}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">Tasks</div>
              </div>
              <div className="text-center p-2 md:p-3 bg-muted/30 rounded-lg">
                <div className="text-lg md:text-2xl font-bold">{metrics.teamStats.totalSpaces}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">Spaces</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status by Project Bar Chart */}
      <Card className="border-border/50">
        <CardHeader className="pb-2 px-3 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-sm md:text-base font-medium">Task Status by Project</CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full" style={{ background: COLORS.todo }} />
                <span className="text-muted-foreground">Todo</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full" style={{ background: COLORS.inProgress }} />
                <span className="text-muted-foreground">In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full" style={{ background: COLORS.done }} />
                <span className="text-muted-foreground">Done</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 md:px-6">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[300px]">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={metrics.statusByProject} layout="horizontal" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="project" 
                    tick={{ fontSize: 9 }} 
                    stroke="hsl(var(--muted-foreground))"
                    axisLine={false}
                    tickLine={false}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }} 
                    stroke="hsl(var(--muted-foreground))"
                    axisLine={false}
                    tickLine={false}
                    width={25}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "11px"
                    }} 
                  />
                  <Bar dataKey="todo" stackId="a" fill={COLORS.todo} name="Todo" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="inProgress" stackId="a" fill={COLORS.inProgress} name="In Progress" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="done" stackId="a" fill={COLORS.done} name="Done" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  icon, 
  label, 
  value, 
  badge,
  badgeVariant = "secondary"
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number | string;
  badge?: string;
  badgeVariant?: "secondary" | "success";
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start justify-between">
          <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
          {badge && (
            <Badge 
              variant="secondary" 
              className={`text-[10px] md:text-xs ${badgeVariant === "success" ? "bg-success/10 text-success border-0" : ""}`}
            >
              {badge}
            </Badge>
          )}
        </div>
        <div className="mt-2 md:mt-3">
          <div className="text-lg md:text-2xl font-bold">{value}</div>
          <div className="text-xs md:text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Gauge Card Component
function GaugeCard({ 
  title, 
  value, 
  subtitle 
}: { 
  title: string; 
  value: number; 
  subtitle: string;
}) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 md:p-6 flex flex-col items-center">
        <div className="text-xs md:text-sm font-medium text-muted-foreground mb-1 md:mb-2">{title}</div>
        <div className="relative scale-75 md:scale-100">
          <svg width="120" height="80" viewBox="0 0 120 80">
            <path
              d="M 10 70 A 50 50 0 0 1 110 70"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 10 70 A 50 50 0 0 1 110 70"
              fill="none"
              stroke={value >= 70 ? COLORS.done : value >= 40 ? COLORS.info : COLORS.warning}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(value / 100) * 157} 157`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pt-4">
            <span className="text-lg md:text-2xl font-bold">{value}%</span>
          </div>
        </div>
        <div className="text-[10px] md:text-xs text-muted-foreground mt-0 md:mt-1">{subtitle}</div>
      </CardContent>
    </Card>
  );
}
