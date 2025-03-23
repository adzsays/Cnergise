import React, { useState } from "react";
import { CustomCard } from "@/components/ui/CustomCard";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProjectList } from "@/components/tasks/ProjectList";
import { TaskList } from "@/components/tasks/TaskList";
import { NewProjectDialog } from "@/components/tasks/NewProjectDialog";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
}

export interface Feature {
  id: string;
  name: string;
  description?: string;
  projectId: string;
}

export type FunctionType = "backend" | "frontend" | "design" | "qa" | "devops" | "business" | "other";
export type StageType = "requirements" | "development" | "testing" | "release" | "go-live";
export type CurrencyType = "USD" | "EUR" | "GBP" | "JPY" | "INR" | "CNY";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  taskNo: string;
  title: string;
  description?: string;
  featureId?: string;
  functionType?: FunctionType;
  stage: StageType;
  projectId: string;
  teamId?: string;
  assignee?: string;
  status: "todo" | "in-progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";
  monetaryImpact?: {
    amount: number;
    currency: CurrencyType;
  };
  latestComments?: string;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  completionPercentage: number;
  createdAt: string;
  subtasks: Subtask[];
  dependencyIds?: string[];
}

export interface Team {
  id: string;
  name: string;
  members: string[];
}

interface ProjectTaskManagerProps {
  showNewProjectDialog?: boolean;
  onOpenProjectDialog?: (open: boolean) => void;
}

export function ProjectTaskManager({ 
  showNewProjectDialog: externalShowNewProjectDialog, 
  onOpenProjectDialog
}: ProjectTaskManagerProps) {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "website",
      name: "Website Redesign",
      description: "Complete overhaul of company website",
      color: "#4f46e5",
      createdAt: "2023-05-15T10:00:00Z",
    },
    {
      id: "mobile",
      name: "Mobile App Development",
      description: "iOS and Android app for client",
      color: "#0ea5e9",
      createdAt: "2023-06-01T14:30:00Z", 
    },
    {
      id: "marketing",
      name: "Marketing Campaign",
      description: "Q3 digital marketing initiative",
      color: "#f97316",
      createdAt: "2023-07-10T09:15:00Z",
    }
  ]);

  const [features, setFeatures] = useState<Feature[]>([
    {
      id: "feature1",
      name: "User Authentication",
      projectId: "website",
      description: "Login and registration functionality"
    },
    {
      id: "feature2",
      name: "Responsive Design",
      projectId: "website",
      description: "Mobile-friendly layout"
    },
    {
      id: "feature3",
      name: "API Integration",
      projectId: "mobile",
      description: "Connect to backend services"
    },
    {
      id: "feature4",
      name: "Social Media Campaign",
      projectId: "marketing",
      description: "Instagram and Facebook ads"
    }
  ]);

  const [teams, setTeams] = useState<Team[]>([
    {
      id: "team1",
      name: "Frontend Team",
      members: ["John Doe", "Jane Smith"]
    },
    {
      id: "team2",
      name: "Backend Team",
      members: ["Alice Johnson", "Bob Brown"]
    },
    {
      id: "team3",
      name: "Design Team",
      members: ["Charlie Davis", "Diana Evans"]
    }
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "task1",
      taskNo: "T001",
      title: "Finalize homepage wireframes",
      description: "Complete all wireframes for the homepage redesign",
      featureId: "feature2",
      functionType: "design",
      stage: "development",
      projectId: "website",
      teamId: "team3",
      assignee: "John Doe",
      status: "in-progress",
      priority: "high",
      monetaryImpact: {
        amount: 5000,
        currency: "USD"
      },
      latestComments: "Added responsive layouts for mobile devices",
      startDate: "2023-08-15",
      dueDate: "2023-08-25",
      completionPercentage: 60,
      createdAt: "2023-08-15T10:00:00Z",
      subtasks: [
        { id: "sub1", title: "Create mobile version", completed: true },
        { id: "sub2", title: "Review with stakeholders", completed: false },
        { id: "sub3", title: "Finalize design system", completed: false }
      ],
      dependencyIds: []
    },
    {
      id: "task2",
      taskNo: "T002",
      title: "Setup API endpoints",
      description: "Create and document all required API endpoints",
      featureId: "feature3",
      functionType: "backend",
      stage: "development",
      projectId: "mobile",
      teamId: "team2",
      assignee: "Alice Johnson",
      status: "todo",
      priority: "medium",
      monetaryImpact: {
        amount: 3000,
        currency: "EUR"
      },
      latestComments: "Defined endpoint specifications",
      startDate: "2023-08-18", 
      dueDate: "2023-09-05",
      completionPercentage: 20,
      createdAt: "2023-08-18T14:30:00Z",
      subtasks: []
    },
    {
      id: "task3",
      taskNo: "T003",
      title: "Create social media content calendar",
      description: "Plan content for Q3 campaign",
      featureId: "feature4",
      functionType: "business",
      stage: "requirements",
      projectId: "marketing",
      teamId: "team1",
      status: "todo",
      priority: "medium",
      monetaryImpact: {
        amount: 7500,
        currency: "USD"
      },
      latestComments: "First draft of content themes ready for review",
      startDate: "2023-08-20",
      dueDate: "2023-08-30",
      completionPercentage: 15,
      createdAt: "2023-08-20T09:15:00Z",
      subtasks: [
        { id: "sub4", title: "Draft posts for Instagram", completed: false },
        { id: "sub5", title: "Create graphics", completed: false }
      ],
      dependencyIds: ["task1"]
    }
  ]);

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [functionFilter, setFunctionFilter] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [baseCurrency, setBaseCurrency] = useState<CurrencyType>("USD");
  const [editingCompletion, setEditingCompletion] = useState<{ taskId: string, value: string } | null>(null);

  const isShowingNewProjectDialog = externalShowNewProjectDialog !== undefined ? 
    externalShowNewProjectDialog : showNewProjectDialog;

  const handleOpenProjectDialog = (open: boolean) => {
    if (onOpenProjectDialog) {
      onOpenProjectDialog(open);
    } else {
      setShowNewProjectDialog(open);
    }
  };

  const handleCreateProject = (newProject: Project) => {
    setProjects([...projects, newProject]);
    handleOpenProjectDialog(false);
  };

  const handleCreateTask = (newTask: Task) => {
    setTasks([...tasks, newTask]);
    setShowNewTaskDialog(false);
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId === selectedProject ? null : projectId);
    setSelectedFeature(null);
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.map(subtask => 
          subtask.id === subtaskId 
            ? { ...subtask, completed: !subtask.completed } 
            : subtask
        );
        
        const completedSubtasks = updatedSubtasks.filter(s => s.completed).length;
        const totalSubtasks = updatedSubtasks.length;
        const newCompletionPercentage = totalSubtasks > 0 
          ? Math.round((completedSubtasks / totalSubtasks) * 100) 
          : task.completionPercentage;
        
        return {
          ...task,
          subtasks: updatedSubtasks,
          completionPercentage: newCompletionPercentage,
          completedDate: newCompletionPercentage === 100 ? new Date().toISOString().split('T')[0] : task.completedDate
        };
      }
      return task;
    }));
  };

  const handleUpdateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const completedDate = status === 'completed' 
          ? new Date().toISOString().split('T')[0] 
          : (status !== 'completed' && task.status === 'completed' ? undefined : task.completedDate);
        
        const completionPercentage = status === 'completed' ? 100 : task.completionPercentage;
        
        return { 
          ...task, 
          status, 
          completedDate,
          completionPercentage
        };
      }
      return task;
    }));
  };

  const handleUpdateTaskCompletion = (taskId: string, percentage: number) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          const completedDate = percentage === 100 
            ? new Date().toISOString().split('T')[0] 
            : (percentage < 100 && task.completionPercentage === 100 ? undefined : task.completedDate);
          
          const status: Task['status'] = percentage === 100 ? 'completed' : task.status;
          
          return { 
            ...task, 
            completionPercentage: percentage,
            completedDate,
            status
          };
        }
        return task;
      })
    );
  };

  const handleCompletionBlur = () => {
    if (editingCompletion) {
      const { taskId, value } = editingCompletion;
      const percentage = Math.min(100, Math.max(0, parseInt(value) || 0));
      onUpdateTaskCompletion(taskId, percentage);
      setEditingCompletion(null);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesProject = selectedProject ? task.projectId === selectedProject : true;
    const matchesFeature = selectedFeature ? task.featureId === selectedFeature : true;
    const matchesStatus = statusFilter && statusFilter !== "all" ? task.status === statusFilter : true;
    const matchesPriority = priorityFilter && priorityFilter !== "all" ? task.priority === priorityFilter : true;
    const matchesStage = stageFilter && stageFilter !== "all" ? task.stage === stageFilter : true;
    const matchesFunction = functionFilter && functionFilter !== "all" ? task.functionType === functionFilter : true;
    const matchesTeam = teamFilter && teamFilter !== "all" ? task.teamId === teamFilter : true;
    const matchesSearch = searchQuery 
      ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.taskNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    return matchesProject && matchesFeature && matchesStatus && matchesPriority && 
           matchesStage && matchesFunction && matchesTeam && matchesSearch;
  });

  return (
    <div className="grid grid-cols-4 gap-6">
      <div className="col-span-1">
        <CustomCard 
          title="Projects" 
          description="Manage your projects" 
          className="h-full"
        >
          <div className="mb-4 flex items-center gap-2">
            <Button 
              onClick={() => handleOpenProjectDialog(true)}
              className="w-full"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
          
          <ProjectList 
            projects={projects} 
            selectedProject={selectedProject}
            onSelectProject={handleSelectProject}
          />
          
          {selectedProject && (
            <div className="mt-4">
              <h3 className="font-medium text-sm mb-2">Features</h3>
              <div className="space-y-2">
                {features
                  .filter(feature => feature.projectId === selectedProject)
                  .map(feature => (
                    <div 
                      key={feature.id}
                      onClick={() => setSelectedFeature(feature.id === selectedFeature ? null : feature.id)}
                      className={`px-3 py-2 rounded-md cursor-pointer text-sm ${
                        feature.id === selectedFeature 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted"
                      }`}
                    >
                      {feature.name}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CustomCard>
      </div>
      
      <div className="col-span-3">
        <CustomCard 
          title={
            selectedProject 
              ? `Tasks: ${projects.find(p => p.id === selectedProject)?.name}` 
              : "All Tasks"
          }
          description="Manage and organize your tasks"
          className="h-full"
          titleExtra={
            <div className="flex items-center gap-2">
              <Select
                value={baseCurrency}
                onValueChange={(val) => setBaseCurrency(val as CurrencyType)}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="CNY">CNY (¥)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        >
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search tasks..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <Select
              value={statusFilter || "all"}
              onValueChange={val => setStatusFilter(val !== "all" ? val : null)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={priorityFilter || "all"}
              onValueChange={val => setPriorityFilter(val !== "all" ? val : null)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={stageFilter || "all"}
              onValueChange={val => setStageFilter(val !== "all" ? val : null)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="requirements">Requirements</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="release">Release</SelectItem>
                <SelectItem value="go-live">Go-Live</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={() => setShowNewTaskDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
          
          <TaskList 
            tasks={filteredTasks} 
            projects={projects}
            features={features}
            teams={teams}
            baseCurrency={baseCurrency}
            onToggleSubtask={handleToggleSubtask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onUpdateTaskCompletion={handleUpdateTaskCompletion}
          />
        </CustomCard>
      </div>
      
      {!onOpenProjectDialog && (
        <NewProjectDialog 
          open={showNewProjectDialog}
          onOpenChange={setShowNewProjectDialog}
          onCreateProject={handleCreateProject}
        />
      )}
      
      <NewTaskDialog 
        open={showNewTaskDialog}
        onOpenChange={setShowNewTaskDialog}
        projects={projects}
        features={features}
        teams={teams}
        selectedProject={selectedProject}
        selectedFeature={selectedFeature}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
}
