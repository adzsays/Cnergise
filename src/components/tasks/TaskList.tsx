import React, { useState, useMemo, useRef } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useTeams, useTeamMembers } from "@/hooks/useTeams";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { EditTaskDialog } from "./EditTaskDialog";
import { TaskUploadDialog } from "./TaskUploadDialog";
import { toast } from "sonner";

type SortKey =
  | "title"
  | "project"
  | "status"
  | "priority"
  | "team"
  | "assignee"
  | "start_date"
  | "end_date"
  | "due_date"
  | "completion_percent";

type SortDir = "asc" | "desc";

const STATUS_OPTIONS: Task["status"][] = ["todo", "in_progress", "done"];
const PRIORITY_OPTIONS: Task["priority"][] = ["low", "medium", "high"];

export function TaskList() {
  const { tasks, isLoading, updateTask, deleteTask } = useTasks();
  const { projects } = useProjects();
  const { teams } = useTeams();
  const { teamMembers } = useTeamMembers();

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [draftValue, setDraftValue] = useState<string>("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const projectMap = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects]
  );
  const teamMap = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.id, t.name])),
    [teams]
  );
  const memberMap = useMemo(
    () => Object.fromEntries(teamMembers.map((m) => [m.id, m.name])),
    [teamMembers]
  );

  const getStatusLabel = (status: string) =>
    status === "todo"
      ? "To Do"
      : status === "in_progress"
      ? "In Progress"
      : status === "done"
      ? "Done"
      : status;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    }
  };

  const formatDate = (d?: string | null) =>
    !d ? "" : new Date(d).toLocaleDateString();

  const sortedTasks = useMemo(() => {
    const arr = [...tasks];
    const dir = sortDir === "asc" ? 1 : -1;
    const keyFn = (t: Task): string | number => {
      switch (sortKey) {
        case "title":
          return t.title?.toLowerCase() ?? "";
        case "project":
          return (projectMap[t.project_id ?? ""] ?? "").toLowerCase();
        case "team":
          return (teamMap[t.team_id ?? ""] ?? "").toLowerCase();
        case "assignee":
          return (memberMap[t.assigned_to ?? ""] ?? "").toLowerCase();
        case "status":
          return t.status;
        case "priority":
          return ["low", "medium", "high"].indexOf(t.priority);
        case "start_date":
          return t.start_date ? new Date(t.start_date).getTime() : 0;
        case "end_date":
          return t.end_date ? new Date(t.end_date).getTime() : 0;
        case "due_date":
          return t.due_date ? new Date(t.due_date).getTime() : 0;
        case "completion_percent":
          return t.completion_percent ?? 0;
      }
    };
    arr.sort((a, b) => {
      const av = keyFn(a);
      const bv = keyFn(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return arr;
  }, [tasks, sortKey, sortDir, projectMap, teamMap, memberMap]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? (
      <ArrowUpDown className="h-3 w-3 opacity-50" />
    ) : sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );

  const SortableHead = ({
    label,
    k,
    width,
  }: {
    label: string;
    k: SortKey;
    width?: string;
  }) => (
    <TableHead className={cn("select-none", width)}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="flex items-center gap-1 font-medium hover:text-foreground"
      >
        {label}
        <SortIcon k={k} />
      </button>
    </TableHead>
  );

  const startEdit = (id: string, field: string, current: any) => {
    setEditingCell({ id, field });
    setDraftValue(current == null ? "" : String(current));
  };

  const commitEdit = (task: Task, field: string, value: any) => {
    setEditingCell(null);
    const current = (task as any)[field];
    if (value === current) return;
    updateTask.mutate({ id: task.id, [field]: value } as any);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowEditDialog(true);
  };

  const handleDelete = (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask.mutate(taskId);
    }
  };

  const exportCsv = () => {
    if (!tasks.length) {
      toast.info("No tasks to export");
      return;
    }
    const headers = [
      "title",
      "description",
      "project",
      "status",
      "priority",
      "team",
      "assigned_to",
      "start_date",
      "end_date",
      "due_date",
      "completion_percent",
    ];
    const escape = (v: any) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = sortedTasks.map((t) =>
      [
        t.title,
        t.description ?? "",
        projectMap[t.project_id ?? ""] ?? "",
        t.status,
        t.priority,
        teamMap[t.team_id ?? ""] ?? "",
        memberMap[t.assigned_to ?? ""] ?? "",
        t.start_date ?? "",
        t.end_date ?? "",
        t.due_date ?? "",
        t.completion_percent ?? 0,
      ]
        .map(escape)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `tasks_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${sortedTasks.length} tasks`);
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading tasks...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {tasks.length} task{tasks.length === 1 ? "" : "s"}
          {sortKey && (
            <span className="ml-2">
              · sorted by <span className="font-medium">{sortKey.replace("_", " ")}</span>{" "}
              ({sortDir})
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          No tasks found. Create a new task or import tasks to get started!
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="min-w-[1500px]">
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <SortableHead label="Task" k="title" width="w-[240px]" />
                    <SortableHead label="Project" k="project" width="w-[150px]" />
                    <SortableHead label="Status" k="status" width="w-[130px]" />
                    <SortableHead label="Priority" k="priority" width="w-[110px]" />
                    <SortableHead label="Team" k="team" width="w-[130px]" />
                    <SortableHead label="Assignee" k="assignee" width="w-[140px]" />
                    <SortableHead label="Start" k="start_date" width="w-[130px]" />
                    <SortableHead label="End" k="end_date" width="w-[130px]" />
                    <SortableHead label="Due" k="due_date" width="w-[130px]" />
                    <SortableHead label="% Complete" k="completion_percent" width="w-[160px]" />
                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTasks.map((task) => {
                    const isEditing = (field: string) =>
                      editingCell?.id === task.id && editingCell?.field === field;
                    const pct = task.completion_percent ?? 0;

                    return (
                      <TableRow key={task.id} className="hover:bg-muted/30">
                        {/* Title */}
                        <TableCell
                          className="py-2 text-sm cursor-text"
                          onClick={() => !isEditing("title") && startEdit(task.id, "title", task.title)}
                        >
                          {isEditing("title") ? (
                            <Input
                              autoFocus
                              value={draftValue}
                              onChange={(e) => setDraftValue(e.target.value)}
                              onBlur={() => commitEdit(task, "title", draftValue.trim() || task.title)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  commitEdit(task, "title", draftValue.trim() || task.title);
                                if (e.key === "Escape") setEditingCell(null);
                              }}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="font-medium">{task.title}</span>
                          )}
                        </TableCell>

                        {/* Project */}
                        <TableCell className="py-2 text-xs">
                          <Select
                            value={task.project_id ?? "__none__"}
                            onValueChange={(v) =>
                              commitEdit(task, "project_id", v === "__none__" ? null : v)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs border-transparent hover:border-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">No Project</SelectItem>
                              {projects.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-2 text-xs">
                          <Select
                            value={task.status}
                            onValueChange={(v) => commitEdit(task, "status", v)}
                          >
                            <SelectTrigger className="h-8 text-xs border-transparent hover:border-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {getStatusLabel(s)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Priority */}
                        <TableCell className="py-2 text-xs">
                          <Select
                            value={task.priority}
                            onValueChange={(v) => commitEdit(task, "priority", v)}
                          >
                            <SelectTrigger className="h-8 text-xs border-transparent hover:border-input">
                              <SelectValue asChild>
                                <Badge
                                  variant="outline"
                                  className={cn("text-xs", getPriorityColor(task.priority))}
                                >
                                  {task.priority}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {PRIORITY_OPTIONS.map((p) => (
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Team */}
                        <TableCell className="py-2 text-xs">
                          <Select
                            value={task.team_id ?? "__none__"}
                            onValueChange={(v) => {
                              commitEdit(task, "team_id", v === "__none__" ? null : v);
                              if (v === "__none__")
                                updateTask.mutate({ id: task.id, assigned_to: null } as any);
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs border-transparent hover:border-input">
                              <SelectValue placeholder="No Team" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">No Team</SelectItem>
                              {teams.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Assignee */}
                        <TableCell className="py-2 text-xs">
                          <Select
                            value={task.assigned_to ?? "__none__"}
                            onValueChange={(v) =>
                              commitEdit(task, "assigned_to", v === "__none__" ? null : v)
                            }
                            disabled={!task.team_id}
                          >
                            <SelectTrigger className="h-8 text-xs border-transparent hover:border-input">
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Unassigned</SelectItem>
                              {teamMembers
                                .filter((m) => m.team_id === task.team_id)
                                .map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Start date */}
                        <TableCell className="py-2 text-xs">
                          <Input
                            type="date"
                            value={task.start_date ? task.start_date.split("T")[0] : ""}
                            onChange={(e) =>
                              commitEdit(task, "start_date", e.target.value || null)
                            }
                            className="h-8 text-xs border-transparent hover:border-input"
                          />
                        </TableCell>

                        {/* End date */}
                        <TableCell className="py-2 text-xs">
                          <Input
                            type="date"
                            value={task.end_date ? task.end_date.split("T")[0] : ""}
                            onChange={(e) =>
                              commitEdit(task, "end_date", e.target.value || null)
                            }
                            className="h-8 text-xs border-transparent hover:border-input"
                          />
                        </TableCell>

                        {/* Due date */}
                        <TableCell className="py-2 text-xs">
                          <Input
                            type="date"
                            value={task.due_date ? task.due_date.split("T")[0] : ""}
                            onChange={(e) =>
                              commitEdit(task, "due_date", e.target.value || null)
                            }
                            className="h-8 text-xs border-transparent hover:border-input"
                          />
                        </TableCell>

                        {/* % Complete */}
                        <TableCell
                          className="py-2 text-xs cursor-text"
                          onClick={() =>
                            !isEditing("completion_percent") &&
                            startEdit(task.id, "completion_percent", pct)
                          }
                        >
                          {isEditing("completion_percent") ? (
                            <Input
                              autoFocus
                              type="number"
                              min={0}
                              max={100}
                              value={draftValue}
                              onChange={(e) => setDraftValue(e.target.value)}
                              onBlur={() => {
                                const n = Math.max(
                                  0,
                                  Math.min(100, parseInt(draftValue || "0", 10) || 0)
                                );
                                commitEdit(task, "completion_percent", n);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const n = Math.max(
                                    0,
                                    Math.min(100, parseInt(draftValue || "0", 10) || 0)
                                  );
                                  commitEdit(task, "completion_percent", n);
                                }
                                if (e.key === "Escape") setEditingCell(null);
                              }}
                              className="h-8 text-xs w-20"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Progress value={pct} className="h-1.5 flex-1" />
                              <span className="text-xs font-medium tabular-nums w-9 text-right">
                                {pct}%
                              </span>
                            </div>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-2 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(task)}
                              title="Open in dialog"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => handleEdit(task)}>
                                  Open in dialog
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => handleDelete(task.id)}
                                  className="text-destructive"
                                >
                                  Delete Task
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      )}

      <EditTaskDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdateTask={(u) => updateTask.mutate(u)}
        task={editingTask}
        projects={projects}
        teams={teams}
        teamMembers={teamMembers}
      />
      <TaskUploadDialog open={showImport} onOpenChange={setShowImport} />
    </div>
  );
}
