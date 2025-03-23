import React, { useState } from "react";
import { CustomCard } from "@/components/ui/CustomCard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusIcon, Filter, ChevronDown, Pencil, Trash } from "lucide-react";
import { NewTaskDialog, FunctionType, StageType } from "./NewTaskDialog";
import { NewFeatureDialog } from "./NewFeatureDialog";
import { NewProjectDialog } from "./NewProjectDialog";
import { TaskList } from "./TaskList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

// Type definitions
export type TaskStatus = "todo" | "in-progress" | "blocked" | "completed";
export type CurrencyType = "USD" | "EUR" | "GBP" | "JPY" | "INR" | "CNY";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee: string;
  assigneeId?: string;
  teamId?: string;
  dueDate?: string;
  startDate?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: TaskStatus;
  projectId: string;
  featureId?: string;
  functionType?: FunctionType;
  stage: StageType;
  createdAt: string;
  subtasks: Subtask[];
  completionPercentage: number;
  completedDate?: string;
  monetaryImpact?: {
    amount: number;
    currency: CurrencyType;
  };
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  projectId: string;
  monetaryImpact?: {
    amount: number;
    currency: CurrencyType;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color?: string;
  createdAt?: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface Person {
  id: string;
  name: string;
  teamId: string;
}

// Sample data
const initialProjects: Project[] = [
  { 
    id: "p1", 
    name: "Website Redesign", 
    description: "Redesign the company website to improve user experience and conversion rates.",
    color: "#4f46e5",
  },
  { 
    id: "p2", 
    name: "Mobile App", 
    description: "Develop a mobile app for iOS and Android platforms.",
    color: "#10b981",
  },
  { 
    id: "p3", 
    name: "Marketing Campaign", 
    description: "Plan and execute a multi-channel marketing campaign for Q2.",
    color: "#f97316",
  }
];

const initialFeatures: Feature[] = [
  { 
    id: "f1", 
    name: "Homepage", 
    description: "Redesign the homepage with new branding and improved call-to-actions.", 
    projectId: "p1" 
  },
  { 
    id: "f2", 
    name: "Blog Section", 
    description: "Create a new blog section with categories and search functionality.", 
    projectId: "p1" 
  },
  { 
    id: "f3", 
    name: "Authentication", 
    description: "Implement user authentication and account management.", 
    projectId: "p2" 
  },
  { 
    id: "f4", 
    name: "Dashboard", 
    description: "Create a user dashboard with activity summary and quick actions.", 
    projectId: "p2" 
  },
  { 
    id: "f5", 
    name: "Social Media", 
    description: "Plan and schedule content for social media platforms.", 
    projectId: "p3" 
  }
];

const initialTeams: Team[] = [
  { id: "team1", name: "Engineering" },
  { id: "team2", name: "Design" },
  { id: "team3", name: "Product" },
  { id: "team4", name: "Marketing" },
];

const initialPeople: Person[] = [
  { id: "p1", name: "Alex", teamId: "team1" },
  { id: "p2", name: "Taylor", teamId: "team1" },
  { id: "p3", name: "Morgan", teamId: "team2" },
  { id: "p4", name: "Riley", teamId: "team2" },
  { id: "p5", name: "Jordan", teamId: "team3" },
  { id: "p6", name: "Casey", teamId: "team4" },
];

const initialTasks: Task[] = [
  { 
    id: "t1", 
    title: "Design Homepage Mockup", 
    description: "Create high-fidelity mockups for the homepage redesign.", 
    assignee: "Alex", 
    dueDate: "2023-07-15", 
    priority: "high", 
    status: "completed", 
    projectId: "p1", 
    featureId: "f1",
    subtasks: [
      { id: "st1", title: "Research competitor websites", completed: true },
      { id: "st2", title: "Create wireframes", completed: true },
      { id: "st3", title: "Design high-fidelity mockup", completed: true }
    ],
    completionPercentage: 100,
    completedDate: "2023-07-10"
  },
  { 
    id: "t2", 
    title: "Implement Homepage HTML/CSS", 
    description: "Convert the approved homepage design into responsive HTML and CSS.", 
    assignee: "Taylor", 
    dueDate: "2023-07-20", 
    priority: "medium", 
    status: "in-progress", 
    projectId: "p1", 
    featureId: "f1",
    subtasks: [
      { id: "st4", title: "Set up project structure", completed: true },
      { id: "st5", title: "Implement header and navigation", completed: true },
      { id: "st6", title: "Implement main sections", completed: false },
      { id: "st7", title: "Implement footer", completed: false },
      { id: "st8", title: "Test responsiveness", completed: false }
    ],
    completionPercentage: 40
  },
  { 
    id: "t3", 
    title: "Blog Layout Design", 
    description: "Design the layout for the blog pages including list and detail views.", 
    assignee: "Morgan", 
    dueDate: "2023-07-25", 
    priority: "low", 
    status: "todo", 
    projectId: "p1", 
    featureId: "f2",
    subtasks: [
      { id: "st9", title: "Research blog layout best practices", completed: false },
      { id: "st10", title: "Create wireframes", completed: false },
      { id: "st11", title: "Design mockups", completed: false }
    ],
    completionPercentage: 0
  },
  { 
    id: "t4", 
    title: "Login Screen Development", 
    description: "Develop the login and registration screens for the mobile app.", 
    assignee: "Riley", 
    dueDate: "2023-07-18", 
    priority: "high", 
    status: "blocked", 
    projectId: "p2", 
    featureId: "f3",
    subtasks: [
      { id: "st12", title: "Design login screen", completed: true },
      { id: "st13", title: "Implement login functionality", completed: false },
      { id: "st14", title: "Implement registration functionality", completed: false },
      { id: "st15", title: "Add password recovery", completed: false }
    ],
    completionPercentage: 25
  }
];

const ProjectTaskManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
  const [teams] = useState<Team[]>(initialTeams);
  const [people] = useState<Person[]>(initialPeople);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [newFeatureDialogOpen, setNewFeatureDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedFeature, setSelectedFeature] = useState<string>("all");
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  // Handlers for adding new projects, features, and tasks
  const handleAddProject = (project: Project) => {
    setProjects([...projects, project]);
    toast({
      title: "Project created",
      description: `${project.name} has been created successfully.`,
    });
  };

  const handleAddFeature = (feature: Feature) => {
    setFeatures([...features, feature]);
    toast({
      title: "Feature created",
      description: `${feature.name} has been created successfully.`,
    });
  };

  const handleAddTask = (task: Task) => {
    if (isEditingTask) {
      setTasks(tasks.map(t => t.id === task.id ? task : t));
      setIsEditingTask(false);
      setCurrentTask(null);
      toast({
        title: "Task updated",
        description: `${task.title} has been updated successfully.`,
      });
    } else {
      setTasks([...tasks, task]);
      toast({
        title: "Task created",
        description: `${task.title} has been created successfully.`,
      });
    }
  };

  // Filter tasks based on selected project and feature
  const filteredTasks = tasks.filter(task => {
    const matchesProject = selectedProject === "all" || task.projectId === selectedProject;
    const matchesFeature = selectedFeature === "all" || task.featureId === selectedFeature;
    return matchesProject && matchesFeature;
  });

  // Get available features for the selected project
  const availableFeatures = selectedProject === "all"
    ? features
    : features.filter(feature => feature.projectId === selectedProject);

  // Handler for task status updates
  const handleTaskStatusChange = (taskId: string, status: TaskStatus) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        // If status is being set to completed, set completion percentage to 100 and add completed date
        // If status is changing from completed to another status, adjust completion percentage if needed
        const completionPercentage = status === "completed" ? 100 : task.completionPercentage;
        const completedDate = status === "completed" 
          ? new Date().toISOString().split('T')[0] 
          : (task.status === "completed" && status !== "completed" ? undefined : task.completedDate);
        
        return {
          ...task, 
          status,
          completionPercentage,
          completedDate
        };
      }
      return task;
    }));
  };

  // Handler for deleting tasks
  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast({
      title: "Task deleted",
      description: "The task has been deleted successfully.",
    });
  };

  // Handler for updating subtask completion status
  const handleSubtaskToggle = (taskId: string, subtaskId: string, completed: boolean) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.map(subtask => 
          subtask.id === subtaskId ? { ...subtask, completed } : subtask
        );
        
        const totalSubtasks = updatedSubtasks.length;
        const completedSubtasks = updatedSubtasks.filter(st => st.completed).length;
        
        // Calculate new completion percentage based on subtasks
        const newCompletionPercentage = totalSubtasks > 0 
          ? Math.round((completedSubtasks / totalSubtasks) * 100) 
          : task.completionPercentage;
        
        // Check if newCompletionPercentage is 100 to set status to completed
        const newStatus = newCompletionPercentage === 100 ? 'completed' as TaskStatus : task.status;
        
        return {
          ...task,
          subtasks: updatedSubtasks,
          completionPercentage: newCompletionPercentage,
          completedDate: newCompletionPercentage === 100 ? new Date().toISOString().split('T')[0] : task.completedDate,
          status: newStatus
        };
      }
      return task;
    }));
  };

  // Handler for editing tasks
  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setIsEditingTask(true);
    setNewTaskDialogOpen(true);
  };

  // Handler for updating task completion percentage
  const handleUpdateTaskCompletion = (taskId: string, percentage: number) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        // Update completion date if task is now complete (or clear it if going from complete to incomplete)
        const completedDate = percentage === 100 
            ? new Date().toISOString().split('T')[0] 
            : (percentage < 100 && task.completionPercentage === 100 ? undefined : task.completedDate);
          
        let status: TaskStatus = task.status;
        if (percentage === 100) {
            status = 'completed';
        } else if (task.status === 'completed' && percentage < 100) {
            status = 'in-progress';
        }
          
        return { 
          ...task, 
          completionPercentage: percentage,
          completedDate,
          status
        };
      }
      return task;
    }));
  };

  return (
    <CustomCard className="min-h-[85vh]">
      <div className="flex flex-col h-full">
        {/* Header with project filter and action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">Task Management</h2>
            
            <div className="flex gap-2">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={selectedFeature} 
                onValueChange={setSelectedFeature}
                disabled={selectedProject === "all"}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Features" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Features</SelectItem>
                  {availableFeatures.map((feature) => (
                    <SelectItem key={feature.id} value={feature.id}>{feature.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setNewProjectDialogOpen(true)}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              New Project
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setNewFeatureDialogOpen(true)}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              New Feature
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => {
                setIsEditingTask(false);
                setCurrentTask(null);
                setNewTaskDialogOpen(true);
              }}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              New Task
            </Button>
          </div>
        </div>
        
        {/* Main content area with task list */}
        <div className="flex-1 p-4 overflow-auto">
          <TaskList 
            tasks={filteredTasks} 
            projects={projects}
            features={features}
            teams={teams}
            people={people}
            onStatusChange={handleTaskStatusChange}
            onDelete={handleDeleteTask}
            onEdit={handleEditTask}
            onSubtaskToggle={handleSubtaskToggle}
            onUpdateCompletion={handleUpdateTaskCompletion}
          />
        </div>
      </div>
      
      {/* Dialogs for creating new items */}
      <NewTaskDialog 
        open={newTaskDialogOpen} 
        onOpenChange={setNewTaskDialogOpen} 
        projects={projects}
        features={features}
        teams={teams}
        people={people}
        onCreateTask={handleAddTask}
        selectedProject={null}
        selectedFeature={null}
      />
      
      <NewFeatureDialog 
        open={newFeatureDialogOpen} 
        onOpenChange={setNewFeatureDialogOpen} 
        projects={projects}
        onCreateFeature={handleAddFeature}
      />
      
      <NewProjectDialog 
        open={newProjectDialogOpen} 
        onOpenChange={setNewProjectDialogOpen} 
        onCreateProject={handleAddProject}
      />
    </CustomCard>
  );
};

export default ProjectTaskManager;
