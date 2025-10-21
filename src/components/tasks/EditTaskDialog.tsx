import React, { useState, useEffect } from "react";
import { Task } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTask: (updates: Partial<Task> & { id: string }) => void;
  task: Task | null;
  projects: Array<{ id: string; name: string }>;
  teams: Array<{ id: string; name: string }>;
  teamMembers: Array<{ id: string; name: string; team_id: string | null }>;
}

export function EditTaskDialog({ 
  open, 
  onOpenChange, 
  onUpdateTask, 
  task,
  projects,
  teams,
  teamMembers,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [teamId, setTeamId] = useState<string>("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [status, setStatus] = useState<Task["status"]>("todo");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setProjectId(task.project_id || "");
      setTeamId(task.team_id || "");
      setAssignedTo(task.assigned_to || "");
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.due_date ? task.due_date.split('T')[0] : "");
    }
  }, [task]);

  const filteredTeamMembers = teamId 
    ? teamMembers.filter(member => member.team_id === teamId)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task || !title.trim()) return;
    
    onUpdateTask({
      id: task.id,
      title: title.trim(),
      description: description.trim() || null,
      project_id: projectId || null,
      team_id: teamId || null,
      assigned_to: assignedTo || null,
      status,
      priority,
      due_date: dueDate || null,
    });
    
    onOpenChange(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task information.
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
              <Label htmlFor="task-description">Description</Label>
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
                <Label htmlFor="project-select">Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger id="project-select">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="team-select">Team</Label>
                <Select value={teamId} onValueChange={(value) => {
                  setTeamId(value);
                  setAssignedTo(""); // Reset assignee when team changes
                }}>
                  <SelectTrigger id="team-select">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assignee-select">Assign To</Label>
                <Select 
                  value={assignedTo} 
                  onValueChange={setAssignedTo}
                  disabled={!teamId}
                >
                  <SelectTrigger id="assignee-select">
                    <SelectValue placeholder={teamId ? "Select a person" : "Select team first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {filteredTeamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status-select">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as Task["status"])}>
                  <SelectTrigger id="status-select">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority-select">Priority</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as Task["priority"])}>
                  <SelectTrigger id="priority-select">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Update Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
