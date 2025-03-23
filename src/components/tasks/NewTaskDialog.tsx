
import React, { useState, useEffect } from "react";
import { 
  type Task, 
  type Project, 
  type Feature,
} from "./ProjectTaskManager";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define missing types
export type FunctionType = "frontend" | "backend" | "design" | "qa" | "devops" | "business" | "other";
export type StageType = "requirements" | "development" | "testing" | "release" | "go-live";
export type Team = {
  id: string;
  name: string;
};
export type Person = {
  id: string;
  name: string;
  teamId: string;
};
// Add missing Subtask type
export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
};

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (task: Task) => void;
  projects: Project[];
  features: Feature[];
  teams?: Team[];
  people?: Person[];
  selectedProject?: string;
  selectedFeature?: string;
  task?: Task;
}

export function NewTaskDialog({ 
  open, 
  onOpenChange, 
  onCreateTask, 
  projects = [],
  features = [],
  teams = [],
  people = [],
  selectedProject,
  selectedFeature,
  task
}: NewTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(selectedProject || "");
  const [featureId, setFeatureId] = useState(selectedFeature || "");
  const [functionType, setFunctionType] = useState<FunctionType>("frontend");
  const [stage, setStage] = useState<StageType>("requirements");
  const [teamId, setTeamId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [status, setStatus] = useState<Task["status"]>("todo");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [dueDate, setDueDate] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [createdAt, setCreatedAt] = useState("");
  const [completedDate, setCompletedDate] = useState<string | undefined>(undefined);
  
  // Set form values when editing an existing task
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setProjectId(task.projectId);
      setFeatureId(task.featureId || "");
      setFunctionType(task.functionType || "frontend");
      setStage(task.stage);
      setTeamId(task.teamId || "");
      setAssigneeId(task.assigneeId || "");
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate || "");
      setStartDate(task.startDate || new Date().toISOString().split('T')[0]);
      setIsEditing(true);
      setTaskId(task.id);
      setCompletionPercentage(task.completionPercentage);
      setSubtasks(task.subtasks);
      setCreatedAt(task.createdAt);
      setCompletedDate(task.completedDate);
    } else {
      // Reset form for new task
      setTitle("");
      setDescription("");
      setProjectId(selectedProject || "");
      setFeatureId(selectedFeature || "");
      setFunctionType("frontend");
      setStage("requirements");
      setTeamId("");
      setAssigneeId("");
      setStatus("todo");
      setPriority("medium");
      setDueDate("");
      setStartDate(new Date().toISOString().split('T')[0]);
      setIsEditing(false);
      setTaskId("");
      setCompletionPercentage(0);
      setSubtasks([]);
      setCreatedAt("");
      setCompletedDate(undefined);
    }
  }, [task, open, selectedProject, selectedFeature]);
  
  // Filter features based on selected project (safely)
  const projectFeatures = projectId 
    ? features.filter(feature => feature.projectId === projectId) 
    : [];
  
  // Filter team members based on selected team (safely)
  const teamMembers = teamId 
    ? people.filter(person => person.teamId === teamId) 
    : [];
  
  // Reset or set feature when project changes
  useEffect(() => {
    if (projectId && features.length > 0) {
      // If current feature doesn't belong to selected project, reset it
      const featureBelongsToProject = features.some(
        f => f.id === featureId && f.projectId === projectId
      );
      
      if (!featureBelongsToProject) {
        // Find first feature for this project, if any
        const firstFeature = features.find(f => f.projectId === projectId);
        setFeatureId(firstFeature ? firstFeature.id : "");
      }
    } else {
      setFeatureId("");
    }
  }, [projectId, features, featureId]);
  
  // When team changes, reset assignee if they're not on the team
  useEffect(() => {
    if (teamId && assigneeId && people.length > 0) {
      const assigneeBelongsToTeam = people.some(
        p => p.id === assigneeId && p.teamId === teamId
      );
      
      if (!assigneeBelongsToTeam) {
        setAssigneeId("");
      }
    }
  }, [teamId, assigneeId, people]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !projectId) return;
    
    // Get name of assignee if ID is set
    const assigneePerson = people.find(p => p.id === assigneeId);
    const assigneeName = assigneePerson ? assigneePerson.name : "";
    
    const taskToSave: Task = {
      id: isEditing ? taskId : `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      featureId: featureId || undefined,
      functionType: functionType,
      stage: stage,
      projectId: projectId,
      teamId: teamId || undefined,
      assigneeId: assigneeId || undefined,
      assignee: assigneeName,
      status: status,
      priority: priority,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      completionPercentage: isEditing ? completionPercentage : 0,
      createdAt: isEditing ? createdAt : new Date().toISOString(),
      subtasks: isEditing ? subtasks : [],
      completedDate: completedDate,
    };
    
    onCreateTask(taskToSave);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Task" : "Create a New Task"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update the task information." 
                : "Add a new task to your project."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
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
                <Select
                  value={projectId}
                  onValueChange={setProjectId}
                  disabled={!!selectedProject || isEditing}
                >
                  <SelectTrigger id="project-select">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feature-select">Feature</Label>
                <Select
                  value={featureId}
                  onValueChange={setFeatureId}
                  disabled={!!selectedFeature || !projectId || projectFeatures.length === 0}
                >
                  <SelectTrigger id="feature-select">
                    <SelectValue placeholder={
                      projectId && projectFeatures.length === 0 
                        ? "No features available" 
                        : "Select a feature"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {projectFeatures.map((feature) => (
                      <SelectItem key={feature.id} value={feature.id}>
                        {feature.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="team-select">Team</Label>
                <Select
                  value={teamId}
                  onValueChange={setTeamId}
                >
                  <SelectTrigger id="team-select">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
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
                  value={assigneeId}
                  onValueChange={setAssigneeId}
                  disabled={!teamId}
                >
                  <SelectTrigger id="assignee-select">
                    <SelectValue placeholder={
                      teamId && teamMembers.length === 0 
                        ? "No team members" 
                        : "Select a person"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="function-select">Function</Label>
                <Select
                  value={functionType}
                  onValueChange={(value) => setFunctionType(value as FunctionType)}
                >
                  <SelectTrigger id="function-select">
                    <SelectValue placeholder="Select function" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frontend">Frontend</SelectItem>
                    <SelectItem value="backend">Backend</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="qa">QA</SelectItem>
                    <SelectItem value="devops">DevOps</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stage-select">Stage</Label>
                <Select
                  value={stage}
                  onValueChange={(value) => setStage(value as StageType)}
                >
                  <SelectTrigger id="stage-select">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requirements">Requirements</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="release">Release</SelectItem>
                    <SelectItem value="go-live">Go-Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status-select">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as Task["status"])}
                >
                  <SelectTrigger id="status-select">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority-select">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value as Task["priority"])}
                >
                  <SelectTrigger id="priority-select">
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
              
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
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
            <Button type="submit" disabled={!title.trim() || !projectId}>
              {isEditing ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
