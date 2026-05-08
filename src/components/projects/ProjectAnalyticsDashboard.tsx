import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectMetrics, ProjectMetricsFilters } from "@/hooks/useProjectMetrics";
import { useTeams } from "@/hooks/useTeams";
import { useCurrentSpace } from "@/contexts/SpaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SleekChart } from "@/components/ui/SleekChart";
import {
  FolderKanban, CheckCircle2, Clock, Layers, AlertTriangle, Target, X,
} from "lucide-react";

const COLORS = {
  done: "hsl(142 76% 36%)",
  info: "hsl(199 89% 48%)",
  warning: "hsl(38 92% 50%)",
};

type Props = {
  filters?: ProjectMetricsFilters;
  onFiltersChange?: (f: ProjectMetricsFilters) => void;
  /** Called when a metric card is clicked. Receives the filter to push to Tasks. */
  onDrillDown?: (drill: { status?: string; projectId?: string }) => void;
};

export function ProjectAnalyticsDashboard({ filters: extFilters, onFiltersChange, onDrillDown }: Props = {}) {
  const navigate = useNavigate();
  const { currentSpace } = useCurrentSpace();
  const [localFilters, setLocalFilters] = React.useState<ProjectMetricsFilters>({});
  const filters = extFilters ?? localFilters;
  const setFilters = (f: ProjectMetricsFilters) => {
    if (onFiltersChange) onFiltersChange(f);
    else setLocalFilters(f);
  };

  const { metrics, goals, projects, teamMembers, isLoading } = useProjectMetrics(filters);
  const { teams } = useTeams();

  const goalProjects = useMemo(() => {
    if (!filters.goalId) return projects;
    return projects.filter(p => (p as any).goal_id === filters.goalId);
  }, [filters.goalId, projects]);

  const drill = (params: { status?: string; projectId?: string }) => {
    if (onDrillDown) return onDrillDown(params);
    const sp = new URLSearchParams();
    sp.set("tab", "tasks");
    if (filters.goalId) sp.set("goal", filters.goalId);
    if (params.projectId || filters.projectId) sp.set("project", (params.projectId || filters.projectId)!);
    if (filters.assigneeId) sp.set("assignee", filters.assigneeId);
    if (params.status) sp.set("status", params.status);
    navigate(`/plan?${sp.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
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

  const hasAnyFilter = !!(filters.goalId || filters.projectId || filters.assigneeId);
  const isEmpty = metrics.totalProjects === 0 && metrics.totalTasks === 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header + filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Plan Analytics</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              Real-time view of your goals, projects and tasks{currentSpace ? ` in ${currentSpace.name}` : ""}.
            </p>
          </div>
          {hasAnyFilter && (
            <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
              <X className="h-3.5 w-3.5 mr-1" /> Clear filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Select value={filters.goalId || "all"} onValueChange={(v) => setFilters({ ...filters, goalId: v === "all" ? null : v, projectId: null })}>
            <SelectTrigger><SelectValue placeholder="All goals" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All goals</SelectItem>
              {goals.map(g => <SelectItem key={g.id} value={g.id}>🎯 {g.title}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.projectId || "all"} onValueChange={(v) => setFilters({ ...filters, projectId: v === "all" ? null : v })}>
            <SelectTrigger><SelectValue placeholder="All projects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {goalProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.assigneeId || "all"} onValueChange={(v) => setFilters({ ...filters, assigneeId: v === "all" ? null : v })}>
            <SelectTrigger><SelectValue placeholder="All people" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All people</SelectItem>
              {teamMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isEmpty ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No projects or tasks match these filters yet. Try clearing filters or create a new goal/project to get started.
        </Card>
      ) : (
        <>
          {/* Clickable Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            <MetricCard icon={<FolderKanban className="h-5 w-5" />} label="Projects" value={metrics.totalProjects}
              badge={`${metrics.projectsBreakdown.active} active`} onClick={() => drill({})} />
            <MetricCard icon={<Layers className="h-5 w-5" />} label="Open Tasks" value={metrics.todoTasks + metrics.inProgressTasks}
              badge={`${metrics.totalTasks} total`} onClick={() => drill({ status: "open" })} />
            <MetricCard icon={<Clock className="h-5 w-5" />} label="In Progress" value={metrics.inProgressTasks}
              onClick={() => drill({ status: "in_progress" })} />
            <MetricCard icon={<CheckCircle2 className="h-5 w-5" />} label="Completed" value={metrics.completedTasks}
              badge={`${metrics.overallCompletion}%`} badgeVariant="success" onClick={() => drill({ status: "done" })} />
            <MetricCard icon={<AlertTriangle className="h-5 w-5" />} label="Overdue" value={metrics.overdueTasks}
              badgeVariant={metrics.overdueTasks > 0 ? "warning" : "secondary"}
              onClick={() => drill({ status: "overdue" })} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2">
              <SleekChart
                kind="line"
                data={metrics.progressOverTime}
                xKey="month"
                series={[
                  { key: "tasksTarget", label: "Created", hsl: "199 89% 48%" },
                  { key: "tasksCompleted", label: "Completed", hsl: "142 76% 36%" },
                ]}
                title="Tasks Created vs Completed"
                subtitle="Last 6 months (real data)"
                compactHeight={140}
                expandedHeight={360}
              />
            </div>

            {projectStatusData.length > 0 && (
              <SleekChart
                kind="pie"
                data={projectStatusData}
                xKey="name"
                series={[{ key: "value", label: "Projects" }]}
                title="Project Status"
                subtitle="Status breakdown"
                compactHeight={140}
              />
            )}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <SummaryStat label="Goals" value={goals.length} icon={<Target className="h-4 w-4" />} />
            <SummaryStat label="Teams" value={teams.length} />
            <SummaryStat label="People" value={teamMembers.length} />
            <SummaryStat label="Avg Completion" value={`${metrics.overallCompletion}%`} accent={metrics.overallCompletion >= 70 ? "success" : metrics.overallCompletion >= 40 ? "info" : "warning"} />
          </div>

          {/* Status by Project (clickable bars) */}
          {metrics.statusByProject.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm md:text-base">Tasks by Project</CardTitle>
              </CardHeader>
              <CardContent>
                <SleekChart
                  kind="bar"
                  data={metrics.statusByProject}
                  xKey="project"
                  stacked
                  series={[
                    { key: "todo", label: "Todo", hsl: "215 16% 47%" },
                    { key: "inProgress", label: "In Progress", hsl: "199 89% 48%" },
                    { key: "done", label: "Done", hsl: "142 76% 36%" },
                  ]}
                  title=""
                  subtitle=""
                  compactHeight={200}
                  expandedHeight={380}
                />
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {metrics.statusByProject.map(p => (
                    <button
                      key={p.projectId}
                      onClick={() => drill({ projectId: p.projectId })}
                      className="text-left text-xs px-2.5 py-1.5 rounded hover:bg-muted/60 flex items-center justify-between"
                    >
                      <span className="truncate font-medium">{p.project}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {p.done}/{p.todo + p.inProgress + p.done}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon, label, value, badge, badgeVariant = "secondary", onClick,
}: {
  icon: React.ReactNode; label: string; value: number | string;
  badge?: string; badgeVariant?: "secondary" | "success" | "warning";
  onClick?: () => void;
}) {
  const Wrapper: any = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`text-left w-full ${onClick ? "transition hover:shadow-md hover:border-primary/40 cursor-pointer" : ""}`}
    >
      <Card className="border-border/50 h-full">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-start justify-between">
            <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg text-primary">{icon}</div>
            {badge && (
              <Badge
                variant="secondary"
                className={`text-[10px] md:text-xs ${
                  badgeVariant === "success" ? "bg-success/10 text-success border-0" :
                  badgeVariant === "warning" ? "bg-amber-500/10 text-amber-600 border-0" : ""
                }`}
              >{badge}</Badge>
            )}
          </div>
          <div className="mt-2 md:mt-3">
            <div className="text-lg md:text-2xl font-bold">{value}</div>
            <div className="text-xs md:text-sm text-muted-foreground">{label}</div>
          </div>
        </CardContent>
      </Card>
    </Wrapper>
  );
}

function SummaryStat({ label, value, icon, accent }: { label: string; value: number | string; icon?: React.ReactNode; accent?: "success" | "info" | "warning" }) {
  const color = accent === "success" ? COLORS.done : accent === "warning" ? COLORS.warning : accent === "info" ? COLORS.info : undefined;
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 md:p-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg md:text-xl font-semibold" style={color ? { color } : undefined}>{value}</div>
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardContent>
    </Card>
  );
}
