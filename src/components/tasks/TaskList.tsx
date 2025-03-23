import React, { useState } from "react";
import { 
  type Task, 
  type Project, 
  type Feature, 
  type Team, 
  type CurrencyType,
  type Person,
  type TaskStatus
} from "./ProjectTaskManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
  AlertCircle,
  ArrowRight,
  Tag,
  Calendar,
  CalendarCheck,
  Pencil,
  Users,
  UserRound
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  features: Feature[];
  teams: Team[];
  people: Person[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onSubtaskToggle: (taskId: string, subtaskId: string, completed: boolean) => void;
  onUpdateCompletion: (taskId: string, percentage: number) => void;
}

export function TaskList({ 
  tasks, 
  projects, 
  features,
  teams,
  people,
  onStatusChange, 
  onDelete,
  onEdit,
  onSubtaskToggle,
  onUpdateCompletion
}: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [editingCompletion, setEditingCompletion] = useState<{taskId: string, value: string} | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  
  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };
  
  const getStatusIcon = (status: Task['status']) => {
    switch(status) {
      case 'todo':
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'in-progress':
        return <ArrowRight className="h-3 w-3 text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'blocked':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
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
  
  const getStageLabel = (stage: Task['stage']) => {
    switch(stage) {
      case 'requirements': return 'Requirements';
      case 'development': return 'Development';
      case 'testing': return 'Testing';
      case 'release': return 'Release';
      case 'go-live': return 'Go-Live';
      default: return stage;
    }
  };
  
  const getFunctionLabel = (func?: string) => {
    if (!func) return 'N/A';
    switch(func) {
      case 'backend': return 'Backend';
      case 'frontend': return 'Frontend';
      case 'design': return 'Design';
      case 'qa': return 'QA';
      case 'devops': return 'DevOps';
      case 'business': return 'Business';
      default: return 'Other';
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
  
  const getProjectColor = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.color : "#6b7280";
  };
  
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };
  
  const getFeatureName = (featureId?: string) => {
    if (!featureId) return "N/A";
    const feature = features.find(f => f.id === featureId);
    return feature ? feature.name : "Unknown Feature";
  };
  
  const getTeamName = (teamId?: string) => {
    if (!teamId) return "N/A";
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : "Unknown Team";
  };
  
  const getPersonName = (personId?: string) => {
    if (!personId) return "Unassigned";
    const person = people.find(p => p.id === personId);
    return person ? person.name : "Unknown Person";
  };
  
  const getTeamMembers = (teamId?: string) => {
    if (!teamId) return [];
    return people.filter(p => p.teamId === teamId);
  };
  
  const handleCompletionChange = (taskId: string, value: string) => {
    setEditingCompletion({ taskId, value });
  };
  
  const handleCompletionBlur = () => {
    if (editingCompletion) {
      const { taskId, value } = editingCompletion;
      const percentage = Math.min(100, Math.max(0, parseInt(value) || 0));
      onUpdateCompletion(taskId, percentage);
      setEditingCompletion(null);
    }
  };
  
  const handleEditTask = (taskId: string) => {
    setEditingTask(taskId);
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: true
    }));
  };
  
  const handleTaskTitleChange = (taskId: string, newTitle: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      onEdit({
        ...task,
        title: newTitle
      });
    }
  };
  
  const handleTaskAssigneeChange = (taskId: string, personId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const person = people.find(p => p.id === personId);
      onEdit({
        ...task,
        assigneeId: personId,
        assignee: person ? person.name : ""
      });
    }
  };

  return (
    <div className="space-y-2">
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No tasks found. Create a new task to get started!
        </div>
      ) : (
        <div>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead className="w-[60px]">Task ID</TableHead>
                    <TableHead className="w-[180px]">Task Name</TableHead>
                    <TableHead className="w-[100px]">Feature</TableHead>
                    <TableHead className="w-[90px]">Function</TableHead>
                    <TableHead className="w-[90px]">Stage</TableHead>
                    <TableHead className="w-[100px]">Project</TableHead>
                    <TableHead className="w-[90px]">Team</TableHead>
                    <TableHead className="w-[90px]">Person</TableHead>
                    <TableHead className="w-[80px]">% Complete</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <React.Fragment key={task.id}>
                      <TableRow 
                        className={expandedTasks[task.id] ? "border-b-0" : ""}
                        onClick={() => toggleTaskExpand(task.id)}
                      >
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1">
                            {expandedTasks[task.id] ? (
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="text-xs font-mono">{task.id.slice(0, 6)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 font-medium text-xs">{task.title}</TableCell>
                        <TableCell className="py-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Tag className="h-2.5 w-2.5 text-muted-foreground" />
                            <span className="truncate">{getFeatureName(task.featureId)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-xs">
                          {task.functionType ? getFunctionLabel(task.functionType) : "N/A"}
                        </TableCell>
                        <TableCell className="py-2 text-xs">{getStageLabel(task.stage)}</TableCell>
                        <TableCell className="py-2 text-xs">
                          <div className="flex items-center gap-1">
                            <div 
                              className="h-2 w-2 rounded-full" 
                              style={{ backgroundColor: getProjectColor(task.projectId) }}
                            />
                            <span className="truncate">{getProjectName(task.projectId)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span>{task.teamId ? getTeamName(task.teamId) : "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-xs">
                          <div className="flex items-center gap-1">
                            <UserRound className="h-3 w-3 text-muted-foreground" />
                            <span>{task.assigneeId ? getPersonName(task.assigneeId) : "Unassigned"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div 
                            className="flex items-center gap-1 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCompletion({ 
                                taskId: task.id, 
                                value: task.completionPercentage.toString() 
                              });
                            }}
                          >
                            {editingCompletion?.taskId === task.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  className="h-5 w-12 text-xs px-1"
                                  value={editingCompletion.value}
                                  onChange={(e) => handleCompletionChange(task.id, e.target.value)}
                                  onBlur={handleCompletionBlur}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCompletionBlur();
                                  }}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="text-xs">%</span>
                              </div>
                            ) : (
                              <>
                                <Progress 
                                  value={task.completionPercentage} 
                                  className="h-1.5 w-10" 
                                />
                                <span className="text-xs">{task.completionPercentage}%</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => onStatusChange(task.id, 'todo')}>
                                Mark as To Do
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => onStatusChange(task.id, 'in-progress')}>
                                Mark as In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => onStatusChange(task.id, 'completed')}>
                                Mark as Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => onStatusChange(task.id, 'blocked')}>
                                Mark as Blocked
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => onEdit(task)}>
                                <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => onDelete(task.id)}>
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      
                      {expandedTasks[task.id] && (
                        <TableRow>
                          <TableCell colSpan={10} className="py-2 px-4 bg-muted/30">
                            <div className="grid grid-cols-2 gap-4 pt-1 pb-2">
                              <div>
                                {/* Left column of expanded details */}
                                {editingTask === task.id ? (
                                  <div className="mb-3">
                                    <div className="mb-2">
                                      <FormLabel className="text-xs font-medium">Task Title</FormLabel>
                                      <Input 
                                        value={task.title}
                                        className="h-8 text-sm"
                                        onChange={(e) => handleTaskTitleChange(task.id, e.target.value)}
                                      />
                                    </div>
                                    <div className="mb-2">
                                      <FormLabel className="text-xs font-medium">Assignee</FormLabel>
                                      <Select
                                        value={task.assigneeId || ""}
                                        onValueChange={(value) => handleTaskAssigneeChange(task.id, value)}
                                      >
                                        <SelectTrigger className="h-8 text-sm">
                                          <SelectValue placeholder="Assign to..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {people.map(person => (
                                            <SelectItem key={person.id} value={person.id}>
                                              {person.name} ({getTeamName(person.teamId)})
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="mb-2">
                                      <FormLabel className="text-xs font-medium">Completion Percentage</FormLabel>
                                      <div className="flex items-center gap-2">
                                        <Input 
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={task.completionPercentage}
                                          className="h-8 text-sm w-20"
                                          onChange={(e) => {
                                            const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                            onUpdateCompletion(task.id, value);
                                          }}
                                        />
                                        <span className="text-xs">%</span>
                                        <Progress 
                                          value={task.completionPercentage} 
                                          className="h-2 flex-1" 
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {task.description && (
                                      <div className="mb-3">
                                        <h4 className="text-xs font-medium mb-1">Description</h4>
                                        <p className="text-xs text-muted-foreground">{task.description}</p>
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <h4 className="text-xs font-medium mb-1 flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Start Date
                                    </h4>
                                    <p className="text-xs">
                                      {task.startDate ? new Date(task.startDate).toLocaleDateString() : 'Not set'}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <h4 className="text-xs font-medium mb-1 flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Due Date
                                    </h4>
                                    <p className="text-xs">
                                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <h4 className="text-xs font-medium mb-1 flex items-center gap-1">
                                      <CalendarCheck className="h-3 w-3" />
                                      Completed Date
                                    </h4>
                                    <p className="text-xs">
                                      {task.completedDate ? new Date(task.completedDate).toLocaleDateString() : 'Not completed'}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <h4 className="text-xs font-medium mb-1 flex items-center gap-1">
                                      <div className="flex items-center">
                                        {getStatusIcon(task.status)}
                                        <span className="ml-1">Status</span>
                                      </div>
                                    </h4>
                                    <div>
                                      <Button variant="outline" size="sm" className="h-6 text-xs">
                                        {getStatusLabel(task.status)}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                {/* Right column of expanded details */}
                                <div className="mb-3">
                                  <h4 className="text-xs font-medium mb-1">Completion Progress</h4>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Progress value={task.completionPercentage} className="h-2 flex-1" />
                                    <span className="text-xs font-semibold">{task.completionPercentage}%</span>
                                  </div>
                                </div>
                                
                                <div className="mb-3">
                                  <h4 className="text-xs font-medium mb-1 flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    Team
                                  </h4>
                                  <div className="text-xs mb-1">
                                    {task.teamId ? getTeamName(task.teamId) : "No team assigned"}
                                  </div>
                                  
                                  <h4 className="text-xs font-medium mb-1 flex items-center gap-1 mt-2">
                                    <UserRound className="h-3 w-3" />
                                    Assigned To
                                  </h4>
                                  <div className="text-xs">
                                    {task.assigneeId ? getPersonName(task.assigneeId) : "Unassigned"}
                                  </div>
                                </div>
                                
                                {task.subtasks.length > 0 && (
                                  <div className="mb-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <h4 className="text-xs font-medium">Subtasks</h4>
                                      <span className="text-xs text-muted-foreground">
                                        {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                                      </span>
                                    </div>
                                    <div className="space-y-1.5">
                                      {task.subtasks.map((subtask) => (
                                        <div key={subtask.id} className="flex items-center gap-1.5">
                                          <Checkbox 
                                            checked={subtask.completed}
                                            onCheckedChange={() => onSubtaskToggle(task.id, subtask.id, !subtask.completed)}
                                            id={`subtask-${subtask.id}`}
                                            className="h-3 w-3"
                                          />
                                          <label 
                                            htmlFor={`subtask-${subtask.id}`}
                                            className={cn(
                                              "text-xs",
                                              subtask.completed && "line-through text-muted-foreground"
                                            )}
                                          >
                                            {subtask.title}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <div>
                                  {editingTask === task.id ? (
                                    <Button 
                                      variant="default" 
                                      size="sm" 
                                      className="w-full text-xs h-7"
                                      onClick={() => setEditingTask(null)}
                                    >
                                      Save Changes
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full text-xs h-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditTask(task.id);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3 mr-1" />
                                      Edit Task
                                    </Button>
                                  )}
                                </div>
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
    </div>
  );
}
