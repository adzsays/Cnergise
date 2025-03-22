
import React, { useState } from "react";
import { type Task, type Project } from "./ProjectTaskManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
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
  AlertCircle,
  ArrowRight
} from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onUpdateTaskStatus: (taskId: string, status: Task['status']) => void;
}

export function TaskList({ tasks, projects, onToggleSubtask, onUpdateTaskStatus }: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  
  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };
  
  const getStatusIcon = (status: Task['status']) => {
    switch(status) {
      case 'todo':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'in-progress':
        return <ArrowRight className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getStatusLabel = (status: Task['status']) => {
    switch(status) {
      case 'todo': return 'To Do';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'blocked': return 'Blocked';
      default: return status;
    }
  };
  
  const getPriorityColor = (priority: Task['priority']) => {
    switch(priority) {
      case 'low': return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case 'medium': return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case 'high': return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case 'urgent': return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      default: return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    }
  };
  
  const calculateSubtaskProgress = (subtasks: Task['subtasks']) => {
    if (subtasks.length === 0) return 0;
    const completedCount = subtasks.filter(st => st.completed).length;
    return Math.round((completedCount / subtasks.length) * 100);
  };
  
  const getProjectColor = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.color : "#6b7280";
  };
  
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No tasks found. Create a new task to get started!
        </div>
      ) : (
        tasks.map((task) => (
          <Collapsible
            key={task.id}
            open={expandedTasks[task.id]}
            onOpenChange={() => toggleTaskExpand(task.id)}
            className="border rounded-lg overflow-hidden"
          >
            <div className="p-4 bg-card">
              <div className="flex items-start justify-between gap-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="p-0 h-6 -ml-1">
                    {expandedTasks[task.id] ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-base">{task.title}</h3>
                      <div className="flex items-center mt-1 gap-2">
                        <div 
                          className="h-2 w-2 rounded-full" 
                          style={{ backgroundColor: getProjectColor(task.projectId) }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {getProjectName(task.projectId)}
                        </span>
                        
                        {task.dueDate && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline"
                        className={cn("text-xs", getPriorityColor(task.priority))}
                      >
                        {task.priority}
                      </Badge>
                      
                      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
                        {getStatusIcon(task.status)}
                        <span className="text-xs">{getStatusLabel(task.status)}</span>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Task</DropdownMenuItem>
                          <DropdownMenuItem>Add Subtask</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => onUpdateTaskStatus(task.id, 'todo')}>
                            Mark as To Do
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onUpdateTaskStatus(task.id, 'in-progress')}>
                            Mark as In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onUpdateTaskStatus(task.id, 'completed')}>
                            Mark as Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onUpdateTaskStatus(task.id, 'blocked')}>
                            Mark as Blocked
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Delete Task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {task.subtasks.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          Subtasks: {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {calculateSubtaskProgress(task.subtasks)}%
                        </span>
                      </div>
                      <Progress value={calculateSubtaskProgress(task.subtasks)} className="h-1" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <CollapsibleContent>
              <div className="p-4 pt-0 border-t bg-card/50">
                {task.description && (
                  <div className="mt-3 mb-4 text-sm text-muted-foreground">
                    {task.description}
                  </div>
                )}
                
                {task.subtasks.length > 0 ? (
                  <div className="space-y-2 mt-3">
                    <h4 className="text-sm font-medium">Subtasks</h4>
                    {task.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2">
                        <Checkbox 
                          checked={subtask.completed}
                          onCheckedChange={() => onToggleSubtask(task.id, subtask.id)}
                          id={`subtask-${subtask.id}`}
                        />
                        <label 
                          htmlFor={`subtask-${subtask.id}`}
                          className={cn(
                            "text-sm",
                            subtask.completed && "line-through text-muted-foreground"
                          )}
                        >
                          {subtask.title}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 text-sm text-muted-foreground">
                    No subtasks for this task.
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))
      )}
    </div>
  );
}
