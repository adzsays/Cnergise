import React, { useState } from "react";
import { type Task, type Project, type Feature, type Team, type CurrencyType } from "./ProjectTaskManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
  Code,
  GitPullRequest,
  Folder,
  FileText,
  Users,
  User,
  Banknote,
  MessageCircle,
  Calendar,
  CalendarCheck,
  Percent,
  Paperclip,
  DollarSign,
  Euro,
  PoundSterling,
  JapaneseYen,
  IndianRupee
} from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  features: Feature[];
  teams: Team[];
  baseCurrency: CurrencyType;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onUpdateTaskStatus: (taskId: string, status: Task['status']) => void;
  onUpdateTaskCompletion: (taskId: string, percentage: number) => void;
}

export function TaskList({ 
  tasks, 
  projects, 
  features,
  teams,
  baseCurrency,
  onToggleSubtask, 
  onUpdateTaskStatus,
  onUpdateTaskCompletion
}: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [editingCompletion, setEditingCompletion] = useState<{taskId: string, value: string} | null>(null);
  
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
  
  const getCurrencySymbol = (currency: CurrencyType) => {
    switch(currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'INR': return '₹';
      case 'CNY': return '¥';
      default: return '$';
    }
  };
  
  const getCurrencyIcon = (currency: CurrencyType) => {
    switch(currency) {
      case 'USD': return <DollarSign className="h-4 w-4" />;
      case 'EUR': return <Euro className="h-4 w-4" />;
      case 'GBP': return <PoundSterling className="h-4 w-4" />;
      case 'JPY': return <JapaneseYen className="h-4 w-4" />;
      case 'INR': return <IndianRupee className="h-4 w-4" />;
      case 'CNY': return <JapaneseYen className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };
  
  const convertCurrency = (amount: number, fromCurrency: CurrencyType, toCurrency: CurrencyType) => {
    const exchangeRates: Record<CurrencyType, number> = {
      'USD': 1,
      'EUR': 0.93,
      'GBP': 0.79,
      'JPY': 149.8,
      'INR': 83.5,
      'CNY': 7.21
    };
    
    if (fromCurrency === toCurrency) return amount;
    
    const inUSD = amount / exchangeRates[fromCurrency];
    return inUSD * exchangeRates[toCurrency];
  };
  
  const formatCurrency = (amount: number, currency: CurrencyType) => {
    return `${getCurrencySymbol(currency)}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };
  
  const handleCompletionChange = (taskId: string, value: string) => {
    setEditingCompletion({ taskId, value });
  };
  
  const handleCompletionBlur = () => {
    if (editingCompletion) {
      const { taskId, value } = editingCompletion;
      const percentage = Math.min(100, Math.max(0, parseInt(value) || 0));
      onUpdateTaskCompletion(taskId, percentage);
      setEditingCompletion(null);
    }
  };

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No tasks found. Create a new task to get started!
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-12 gap-2 mb-2 bg-muted px-3 py-2 rounded-md text-sm font-medium">
            <div className="col-span-1">Task #</div>
            <div className="col-span-2">Task Name</div>
            <div className="col-span-1">Feature</div>
            <div className="col-span-1">Function</div>
            <div className="col-span-1">Stage</div>
            <div className="col-span-1">Project</div>
            <div className="col-span-1">Team</div>
            <div className="col-span-1">Person</div>
            <div className="col-span-1">Priority</div>
            <div className="col-span-1">Impact</div>
            <div className="col-span-1">Completion</div>
          </div>
          
          {tasks.map((task) => (
            <Collapsible
              key={task.id}
              open={expandedTasks[task.id]}
              onOpenChange={() => toggleTaskExpand(task.id)}
              className="border rounded-lg overflow-hidden mb-2"
            >
              <div className="px-3 py-2 bg-card">
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1 flex items-center gap-1">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="p-0 h-6 -ml-1">
                        {expandedTasks[task.id] ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <span className="text-xs font-mono">{task.taskNo}</span>
                  </div>
                  
                  <div className="col-span-2 font-medium text-sm truncate">{task.title}</div>
                  
                  <div className="col-span-1 text-xs">
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{getFeatureName(task.featureId)}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-1 text-xs">
                    <div className="flex items-center gap-1">
                      <Code className="h-3 w-3 text-muted-foreground" />
                      <span>{getFunctionLabel(task.functionType)}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-1 text-xs">
                    <div className="flex items-center gap-1">
                      <GitPullRequest className="h-3 w-3 text-muted-foreground" />
                      <span>{getStageLabel(task.stage)}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-1 text-xs">
                    <div className="flex items-center gap-1">
                      <div 
                        className="h-2 w-2 rounded-full" 
                        style={{ backgroundColor: getProjectColor(task.projectId) }}
                      />
                      <span className="truncate">{getProjectName(task.projectId)}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-1 text-xs">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{getTeamName(task.teamId)}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-1 text-xs">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{task.assignee || 'Unassigned'}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    <Badge 
                      variant="outline"
                      className={cn("text-xs px-1.5 py-0.5", getPriorityColor(task.priority))}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  
                  <div className="col-span-1 text-xs">
                    {task.monetaryImpact ? (
                      <div className="flex items-center gap-1">
                        {getCurrencyIcon(task.monetaryImpact.currency)}
                        <span>
                          {formatCurrency(
                            convertCurrency(task.monetaryImpact.amount, task.monetaryImpact.currency, baseCurrency),
                            baseCurrency
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </div>
                  
                  <div className="col-span-1">
                    {editingCompletion?.taskId === task.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          className="h-6 w-12 text-xs px-1"
                          value={editingCompletion.value}
                          onChange={(e) => handleCompletionChange(task.id, e.target.value)}
                          onBlur={handleCompletionBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCompletionBlur();
                          }}
                          autoFocus
                        />
                        <span className="text-xs">%</span>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-1 cursor-pointer"
                        onClick={() => setEditingCompletion({ 
                          taskId: task.id, 
                          value: task.completionPercentage.toString() 
                        })}
                      >
                        <Progress value={task.completionPercentage} className="h-2 w-12" />
                        <span className="text-xs">{task.completionPercentage}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <CollapsibleContent>
                <div className="p-4 pt-1 border-t bg-card/50">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      {task.description && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                      )}
                      
                      {task.latestComments && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            Latest Comments
                          </h4>
                          <p className="text-sm text-muted-foreground">{task.latestComments}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Start Date
                          </h4>
                          <p className="text-sm">
                            {task.startDate ? new Date(task.startDate).toLocaleDateString() : 'Not set'}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Due Date
                          </h4>
                          <p className="text-sm">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                            <CalendarCheck className="h-3.5 w-3.5" />
                            Completed Date
                          </h4>
                          <p className="text-sm">
                            {task.completedDate ? new Date(task.completedDate).toLocaleDateString() : 'Not completed'}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                            <div className="flex items-center">
                              {getStatusIcon(task.status)}
                              <span className="ml-1">Status</span>
                            </div>
                          </h4>
                          <div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 text-xs">
                                  {getStatusLabel(task.status)}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
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
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      {task.dependencyIds && task.dependencyIds.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                            <Paperclip className="h-3.5 w-3.5" />
                            Dependencies
                          </h4>
                          <div className="space-y-1">
                            {task.dependencyIds.map(depId => {
                              const depTask = tasks.find(t => t.id === depId);
                              return depTask ? (
                                <div key={depId} className="text-sm flex items-center gap-1">
                                  <span className="font-mono text-xs">{depTask.taskNo}</span>
                                  <span className="truncate">{depTask.title}</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      
                      {task.subtasks.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium">Subtasks</h4>
                            <span className="text-xs text-muted-foreground">
                              {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                            </span>
                          </div>
                          <div className="space-y-2">
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
                        </div>
                      )}
                      
                      <div>
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          Edit Task
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
