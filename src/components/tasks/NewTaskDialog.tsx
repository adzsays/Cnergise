import React, { useState, useEffect } from "react";
import { type Task, type Project } from "./ProjectTaskManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  selectedProject: string | null;
  onCreateTask: (task: Task) => void;
}

export function NewTaskDialog({ 
  open, 
  onOpenChange, 
  projects, 
  selectedProject, 
  onCreateTask 
}: NewTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState<Task["status"]>("todo");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [dueDate, setDueDate] = useState("");
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  
  useEffect(() => {
    if (open) {
      if (selectedProject) {
        setProjectId(selectedProject);
      } else if (projects.length > 0) {
        setProjectId(projects[0].id);
      }
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [open, selectedProject, projects]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !projectId) return;
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      projectId,
      status,
      priority,
      dueDate: dueDate || undefined,
      createdAt: new Date().toISOString(),
      subtasks: [...subtasks],
    };
    
    onCreateTask(newTask);
    
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setDueDate("");
    setSubtasks([]);
    setNewSubtask("");
  };
  
  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    
    setSubtasks([
      ...subtasks,
      {
        id: `subtask-${Date.now()}-${subtasks.length}`,
        title: newSubtask.trim(),
        completed: false,
      },
    ]);
    
    setNewSubtask("");
  };
  
  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };
  
  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your project.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input 
                id="task-title"
                placeholder="Enter task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="task-description">Description (Optional)</Label>
              <Textarea 
                id="task-description"
                placeholder="Enter task description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-project">Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger id="task-project">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center">
                          <div 
                            className="h-2 w-2 rounded-full mr-2" 
                            style={{ backgroundColor: project.color }}
                          />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="task-due-date">Due Date</Label>
                <Input 
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as Task["status"])}>
                  <SelectTrigger id="task-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as Task["priority"])}>
                  <SelectTrigger id="task-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="task-subtasks">Subtasks</Label>
              
              <div className="flex items-center gap-2">
                <Input 
                  id="task-subtasks"
                  placeholder="Add a subtask"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={handleSubtaskKeyDown}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={handleAddSubtask}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {subtasks.length > 0 && (
                <div className="mt-2 space-y-2 border rounded-md p-2">
                  {subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={subtask.completed}
                          onCheckedChange={(checked) => {
                            setSubtasks(
                              subtasks.map((st) =>
                                st.id === subtask.id
                                  ? { ...st, completed: !!checked }
                                  : st
                              )
                            );
                          }}
                        />
                        <span className="text-sm">{subtask.title}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveSubtask(subtask.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
