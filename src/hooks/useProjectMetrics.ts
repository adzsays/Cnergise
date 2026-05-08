import { useMemo } from "react";
import { useProjects } from "./useProjects";
import { useTasks } from "./useTasks";
import { useGoals } from "./useGoals";
import { useTeamMembers } from "./useTeams";

export type ProjectMetricsFilters = {
  goalId?: string | null;
  projectId?: string | null;
  assigneeId?: string | null; // team_member id
};

export type ProjectMetrics = {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  overdueTasks: number;
  overallCompletion: number;
  projectsBreakdown: { active: number; completed: number; onHold: number; archived: number };
  progressOverTime: { month: string; tasksTarget: number; tasksCompleted: number; completionRate: number }[];
  statusByProject: { project: string; projectId: string; todo: number; inProgress: number; done: number }[];
  teamStats: { totalTeams: number; totalSpaces: number };
};

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function useProjectMetrics(filters: ProjectMetricsFilters = {}) {
  const { projects, isLoading: projectsLoading } = useProjects();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { goals = [] } = useGoals();
  const { teamMembers = [] } = useTeamMembers();

  const metrics = useMemo<ProjectMetrics>(() => {
    // Apply filters
    let filteredProjects = projects;
    if (filters.goalId) {
      filteredProjects = filteredProjects.filter(p => (p as any).goal_id === filters.goalId);
    }
    if (filters.projectId) {
      filteredProjects = filteredProjects.filter(p => p.id === filters.projectId);
    }
    const projectIds = new Set(filteredProjects.map(p => p.id));

    let filteredTasks = tasks;
    if (filters.goalId || filters.projectId) {
      filteredTasks = filteredTasks.filter(t => t.project_id && projectIds.has(t.project_id));
    }
    if (filters.assigneeId) {
      filteredTasks = filteredTasks.filter(t => t.assigned_to === filters.assigneeId);
    }

    const totalProjects = filteredProjects.length;
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === "done").length;
    const inProgressTasks = filteredTasks.filter(t => t.status === "in_progress").length;
    const todoTasks = filteredTasks.filter(t => t.status === "todo").length;
    const today = new Date(); today.setHours(0,0,0,0);
    const overdueTasks = filteredTasks.filter(t => t.due_date && t.status !== "done" && new Date(t.due_date) < today).length;
    const overallCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const projectsBreakdown = {
      active: filteredProjects.filter(p => p.status === "active").length,
      completed: filteredProjects.filter(p => p.status === "completed").length,
      onHold: filteredProjects.filter(p => p.status === "on-hold").length,
      archived: filteredProjects.filter(p => p.status === "archived").length,
    };

    // Real progress-over-time: bucket tasks by created_at month (last 6 months) and count completed (updated_at when status=done)
    const now = new Date();
    const buckets: { key: string; month: string; created: number; completed: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTH_LABELS[d.getMonth()], created: 0, completed: 0 });
    }
    const bucketIdx = (date: Date) => {
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      return buckets.findIndex(b => b.key === key);
    };
    filteredTasks.forEach(t => {
      const c = new Date(t.created_at);
      const ci = bucketIdx(c);
      if (ci >= 0) buckets[ci].created++;
      if (t.status === "done") {
        const u = new Date(t.updated_at);
        const ui = bucketIdx(u);
        if (ui >= 0) buckets[ui].completed++;
      }
    });
    const progressOverTime = buckets.map(b => ({
      month: b.month,
      tasksTarget: b.created,
      tasksCompleted: b.completed,
      completionRate: b.created > 0 ? Math.round((b.completed / b.created) * 100) : 0,
    }));

    const statusByProject = filteredProjects.slice(0, 10).map(project => {
      const pTasks = filteredTasks.filter(t => t.project_id === project.id);
      return {
        project: project.name.length > 14 ? project.name.substring(0, 14) + "…" : project.name,
        projectId: project.id,
        todo: pTasks.filter(t => t.status === "todo").length,
        inProgress: pTasks.filter(t => t.status === "in_progress").length,
        done: pTasks.filter(t => t.status === "done").length,
      };
    }).filter(p => p.todo + p.inProgress + p.done > 0);

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      overallCompletion,
      projectsBreakdown,
      progressOverTime,
      statusByProject,
      teamStats: {
        totalTeams: 0, // populated by hook caller if needed
        totalSpaces: 0,
      },
    };
  }, [projects, tasks, filters.goalId, filters.projectId, filters.assigneeId]);

  return {
    metrics,
    goals,
    projects,
    teamMembers,
    isLoading: projectsLoading || tasksLoading,
  };
}
