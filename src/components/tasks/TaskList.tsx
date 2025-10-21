import React, { useState } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useTeams, useTeamMembers } from "@/hooks/useTeams";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  Clock, 
  MoreHorizontal, 
  ChevronDown, 
  ChevronRight, 
  ArrowRight,
  Users,
  UserRound,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditTaskDialog } from "./EditTaskDialog";

export function TaskList() {
  const { tasks, isLoading, updateTask, deleteTask } = useTasks();
  const { projects } = useProjects();
  const { teams } = useTeams();
  const { teamMembers } = useTeamMembers();
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'todo':
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'in_progress':
        return <ArrowRight className="h-3 w-3 text-blue-500" />;
      case 'done':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'todo': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'done': return 'Done';
      default: return status;
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'low': return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case 'medium': return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case 'high': return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    }
  };
  
  const getProjectName = (projectId?: string | null) => {
    if (!projectId) return "No Project";
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };
  
  const getTeamName = (teamId?: string | null) => {
    if (!teamId) return "No Team";
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : "Unknown Team";
  };
  
  const getMemberName = (memberId?: string | null) => {
    if (!memberId) return "Unassigned";
    const member = teamMembers.find(m => m.id === memberId);
    return member ? member.name : "Unknown Member";
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const handleStatusChange = (taskId: string, status: 'todo' | 'in_progress' | 'done') => {
    updateTask.mutate({ id: taskId, status });
  };

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(taskId);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowEditDialog(true);
  };

  const handleUpdateTask = (updates: Partial<Task> & { id: string }) => {
    updateTask.mutate(updates);
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading tasks...</div>;
  }

  return (
    <div className="space-y-2">
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No tasks found. Create a new task or import tasks from CSV to get started!
        </div>
      ) : (
        <div>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="min-w-[1200px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="w-[250px]">Task Name</TableHead>
                    <TableHead className="w-[150px]">Project</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[100px]">Priority</TableHead>
                    <TableHead className="w-[250px]">Description</TableHead>
                    <TableHead className="w-[120px]">Team</TableHead>
                    <TableHead className="w-[120px]">Assigned To</TableHead>
                    <TableHead className="w-[120px]">Due Date</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <React.Fragment key={task.id}>
                      <TableRow 
                        className={expandedTasks[task.id] ? "border-b-0 cursor-pointer hover:bg-muted/50" : "cursor-pointer hover:bg-muted/50"}
                        onClick={() => handleEdit(task)}
                      >
                        <TableCell className="py-2" onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskExpand(task.id);
                        }}>
                          <div className="flex items-center gap-1">
                            {expandedTasks[task.id] ? (
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 font-medium text-xs">{task.title}</TableCell>
                        <TableCell className="py-2 text-xs">
                          {getProjectName(task.project_id)}
                        </TableCell>
                        <TableCell className="py-2 text-xs">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(task.status)}
                            <span>{getStatusLabel(task.status)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-xs">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs whitespace-nowrap",
                              getPriorityColor(task.priority)
                            )}
                          >
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 text-xs">
                          <div className="truncate max-w-[200px]">
                            {task.description || "No description"}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span>{getTeamName(task.team_id)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-xs">
                          <div className="flex items-center gap-1">
                            <UserRound className="h-3 w-3 text-muted-foreground" />
                            <span>{getMemberName(task.assigned_to)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-xs">
                          {formatDate(task.due_date)}
                        </TableCell>
                        <TableCell className="py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => handleStatusChange(task.id, 'todo')}>
                                Mark as To Do
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleStatusChange(task.id, 'in_progress')}>
                                Mark as In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleStatusChange(task.id, 'done')}>
                                Mark as Done
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => handleEdit(task)}>
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleDelete(task.id)} className="text-destructive">
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      
                      {expandedTasks[task.id] && (
                        <TableRow>
                          <TableCell colSpan={10} className="py-4 px-4 bg-muted/30">
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Description:</span> {task.description || "No description"}
                              </div>
                              <div>
                                <span className="font-medium">Created:</span> {formatDate(task.created_at)}
                              </div>
                              <div>
                                <span className="font-medium">Last Updated:</span> {formatDate(task.updated_at)}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      )}
      
      <EditTaskDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdateTask={handleUpdateTask}
        task={editingTask}
        projects={projects}
        teams={teams}
        teamMembers={teamMembers}
      />
    </div>
  );
}
