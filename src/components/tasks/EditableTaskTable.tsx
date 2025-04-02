
import React, { useState, useEffect, useRef } from "react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Undo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import type { 
  Task, 
  Project, 
  Feature, 
  Team, 
  Person, 
  TaskStatus, 
  TaskPriority, 
  StageType,
  FunctionType 
} from "./ProjectTaskManager";

interface EditableTaskTableProps {
  tasks: Task[];
  projects: Project[];
  features: Feature[];
  teams: Team[];
  people: Person[];
  onUpdateTask: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

interface EditHistory {
  taskId: string;
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

export function EditableTaskTable({
  tasks,
  projects,
  features,
  teams,
  people,
  onUpdateTask,
  onDeleteTask
}: EditableTaskTableProps) {
  const [editableCell, setEditableCell] = useState<{id: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editHistory, setEditHistory] = useState<EditHistory[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Set up keyboard event listener for Ctrl+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undoLastEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editHistory]);

  // Focus input when editing cell
  useEffect(() => {
    if (editableCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editableCell]);

  const handleCellClick = (taskId: string, field: string, currentValue: any) => {
    setEditableCell({ id: taskId, field });
    setEditValue(currentValue !== undefined && currentValue !== null ? String(currentValue) : "");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleSelectChange = (value: string, taskId: string, field: string) => {
    saveEdit(taskId, field, value);
  };

  const handleBlur = () => {
    if (editableCell) {
      saveEdit(editableCell.id, editableCell.field, editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editableCell) {
        saveEdit(editableCell.id, editableCell.field, editValue);
      }
    } else if (e.key === 'Escape') {
      setEditableCell(null);
    }
  };

  const saveEdit = (taskId: string, field: string, value: any) => {
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    // Get the old value for history
    const oldValue = task[field as keyof Task];
    
    // Don't update if value hasn't changed
    if (value === oldValue) {
      setEditableCell(null);
      return;
    }
    
    // Save to edit history
    setEditHistory(prev => [
      ...prev, 
      { 
        taskId, 
        field, 
        oldValue, 
        newValue: value, 
        timestamp: Date.now() 
      }
    ]);

    // Update the task
    const updatedTask = { ...task, [field]: value };
    
    // If marking as completed, set completed date
    if (field === 'status' && value === 'completed' && !task.completedDate) {
      updatedTask.completedDate = new Date().toISOString();
    } else if (field === 'status' && value !== 'completed') {
      // Remove completed date if changing from completed to another status
      updatedTask.completedDate = undefined;
    }
    
    onUpdateTask(updatedTask);
    setEditableCell(null);
    
    toast({
      title: "Task updated",
      description: `Updated ${field} for task: ${task.title}`,
    });
  };

  const undoLastEdit = () => {
    if (editHistory.length === 0) return;
    
    // Get the last edit
    const lastEdit = editHistory[editHistory.length - 1];
    
    // Find the task that was edited
    const task = tasks.find(t => t.id === lastEdit.taskId);
    
    if (!task) return;
    
    // Revert the field to its previous value
    const updatedTask = { ...task, [lastEdit.field]: lastEdit.oldValue };
    onUpdateTask(updatedTask);
    
    // Remove the last edit from history
    setEditHistory(prev => prev.slice(0, prev.length - 1));
    
    toast({
      title: "Change undone",
      description: `Reverted ${lastEdit.field} for task: ${task.title}`,
    });
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown";
  };

  const getFeatureName = (featureId?: string) => {
    if (!featureId) return "N/A";
    const feature = features.find(f => f.id === featureId);
    return feature?.name || "Unknown";
  };

  const getTeamName = (teamId?: string) => {
    if (!teamId) return "N/A";
    const team = teams.find(t => t.id === teamId);
    return team?.name || "Unknown";
  };

  const getPersonName = (personId?: string) => {
    if (!personId) return "Unassigned";
    const person = people.find(p => p.id === personId);
    return person?.name || "Unknown";
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch(priority) {
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "urgent": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      default: return "";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Editable Task Table</h2>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={undoLastEdit}
          disabled={editHistory.length === 0}
        >
          <Undo className="h-4 w-4" />
          Undo Last Edit (Ctrl+Z)
        </Button>
      </div>
      
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="min-w-[1200px]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead>Task Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Track</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Person</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Completed on</TableHead>
                <TableHead>% Complete</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map(task => (
                <TableRow key={task.id}>
                  <TableCell 
                    onClick={() => handleCellClick(task.id, 'title', task.title)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    {editableCell?.id === task.id && editableCell?.field === 'title' ? (
                      <Input
                        ref={inputRef}
                        value={editValue}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className="h-8 text-sm"
                      />
                    ) : (
                      task.title
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Select
                      value={task.projectId}
                      onValueChange={(value) => handleSelectChange(value, task.id, 'projectId')}
                    >
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder={getProjectName(task.projectId)} />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell>
                    <Select
                      value={task.stage}
                      onValueChange={(value) => handleSelectChange(value, task.id, 'stage')}
                    >
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder={task.stage} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="requirements">Requirements</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="testing">Testing</SelectItem>
                        <SelectItem value="release">Release</SelectItem>
                        <SelectItem value="go-live">Go-Live</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell>
                    <Select
                      value={task.status}
                      onValueChange={(value) => handleSelectChange(value as TaskStatus, task.id, 'status')}
                    >
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder={task.status} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell>
                    <Select
                      value={task.priority}
                      onValueChange={(value) => handleSelectChange(value as TaskPriority, task.id, 'priority')}
                    >
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs whitespace-nowrap",
                              getPriorityColor(task.priority)
                            )}
                          >
                            {task.priority}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell 
                    onClick={() => handleCellClick(task.id, 'description', task.description)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    {editableCell?.id === task.id && editableCell?.field === 'description' ? (
                      <Input
                        ref={inputRef}
                        value={editValue}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <div className="truncate max-w-[120px]">
                        {task.description || "N/A"}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Select
                      value={task.featureId || ""}
                      onValueChange={(value) => handleSelectChange(value, task.id, 'featureId')}
                    >
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder={getFeatureName(task.featureId)} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {features.filter(f => f.projectId === task.projectId).map(feature => (
                          <SelectItem key={feature.id} value={feature.id}>
                            {feature.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell>
                    <Select
                      value={task.functionType || ""}
                      onValueChange={(value) => handleSelectChange(value as FunctionType, task.id, 'functionType')}
                    >
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder={task.functionType || "N/A"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="frontend">Frontend</SelectItem>
                        <SelectItem value="backend">Backend</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="qa">QA</SelectItem>
                        <SelectItem value="devops">DevOps</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell>
                    <Select
                      value={task.teamId || ""}
                      onValueChange={(value) => handleSelectChange(value, task.id, 'teamId')}
                    >
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder={getTeamName(task.teamId)} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell>
                    <Select
                      value={task.assigneeId || ""}
                      onValueChange={(value) => handleSelectChange(value, task.id, 'assigneeId')}
                    >
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder={getPersonName(task.assigneeId)} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {people.map(person => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell className="text-xs text-muted-foreground">
                    No comments
                  </TableCell>
                  
                  <TableCell 
                    onClick={() => handleCellClick(task.id, 'startDate', task.startDate)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    {editableCell?.id === task.id && editableCell?.field === 'startDate' ? (
                      <Input
                        ref={inputRef}
                        type="date"
                        value={editValue ? new Date(editValue).toISOString().split('T')[0] : ""}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className="h-8 text-xs"
                      />
                    ) : (
                      formatDate(task.startDate)
                    )}
                  </TableCell>
                  
                  <TableCell 
                    onClick={() => handleCellClick(task.id, 'dueDate', task.dueDate)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    {editableCell?.id === task.id && editableCell?.field === 'dueDate' ? (
                      <Input
                        ref={inputRef}
                        type="date"
                        value={editValue ? new Date(editValue).toISOString().split('T')[0] : ""}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className="h-8 text-xs"
                      />
                    ) : (
                      formatDate(task.dueDate)
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {formatDate(task.completedDate)}
                  </TableCell>
                  
                  <TableCell 
                    onClick={() => handleCellClick(task.id, 'completionPercentage', task.completionPercentage)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    {editableCell?.id === task.id && editableCell?.field === 'completionPercentage' ? (
                      <div className="flex items-center gap-1">
                        <Input
                          ref={inputRef}
                          type="number"
                          min="0"
                          max="100"
                          value={editValue}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          onKeyDown={handleKeyDown}
                          className="h-8 text-xs w-16"
                        />
                        <span className="text-xs">%</span>
                      </div>
                    ) : (
                      `${task.completionPercentage}%`
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onDeleteTask(task.id)}>
                          Delete Task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}
