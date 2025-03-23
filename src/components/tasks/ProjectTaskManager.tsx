import React, { useState } from "react";
import { CustomCard } from "@/components/ui/CustomCard";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, Search, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TaskList } from "@/components/tasks/TaskList";
import { NewProjectDialog } from "@/components/tasks/NewProjectDialog";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { NewFeatureDialog } from "@/components/tasks/NewFeatureDialog";
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
  priority?: "low" | "medium" | "high" | "urgent";
  monetaryImpact?: {
    amount: number;
    currency: CurrencyType;
  };
}

export type FunctionType = "backend" | "frontend" | "design" | "qa" | "devops" | "business" | "other";
export type StageType = "requirements" | "development" | "testing" | "release" | "go-live";
export type CurrencyType = "USD" | "EUR" | "GBP" | "JPY" | "INR" | "CNY";

export interface Person {
  id: string;
  name: string;
  teamId: string;
  role?: string;
  email?: string;
}

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
  assigneeId?: string;
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
  members: Person[];
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
      description: "Login and registration functionality",
      priority: "high",
      monetaryImpact: {
        amount: 3000,
        currency: "USD"
      }
    },
    {
      id: "feature2",
      name: "Responsive Design",
      projectId: "website",
      description: "Mobile-friendly layout",
      priority: "medium",
      monetaryImpact: {
        amount: 2000,
        currency: "USD"
      }
    },
    {
      id: "feature3",
      name: "API Integration",
      projectId: "mobile",
      description: "Connect to backend services",
      priority: "high",
      monetaryImpact: {
        amount: 5000,
        currency: "USD"
      }
    },
    {
      id: "feature4",
      name: "Social Media Campaign",
      projectId: "marketing",
      description: "Instagram and Facebook ads",
      priority: "medium",
      monetaryImpact: {
        amount: 3500,
        currency: "USD"
      }
    }
  ]);

  const [people, setPeople] = useState<Person[]>([
    { id: "person1", name: "John Doe", teamId: "team1", role: "Frontend Developer", email: "john@example.com" },
    { id: "person2", name: "Jane Smith", teamId: "team1", role: "UI Designer", email: "jane@example.com" },
    { id: "person3", name: "Alice Johnson", teamId: "team2", role: "Backend Developer", email: "alice@example.com" },
    { id: "person4", name: "Bob Brown", teamId: "team2", role: "DevOps Engineer", email: "bob@example.com" },
    { id: "person5", name: "Charlie Davis", teamId: "team3", role: "UX Designer", email: "charlie@example.com" },
    { id: "person6", name: "Diana Evans", teamId: "team3", role: "Graphic Designer", email: "diana@example.com" },
  ]);

  const [teams, setTeams] = useState<Team[]>([
    {
      id: "team1",
      name: "Frontend Team",
      members: people.filter(p => p.teamId === "team1")
    },
    {
      id: "team2",
      name: "Backend Team",
      members: people.filter(p => p.teamId === "team2")
    },
    {
      id: "team3",
      name: "Design Team",
      members: people.filter(p => p.teamId === "team3")
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
      assigneeId: "person5",
      assignee: "Charlie Davis",
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
      assigneeId: "person3",
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
      assigneeId: "person2",
      assignee: "Jane Smith",
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
  const [showNewFeatureDialog, setShowNewFeatureDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [functionFilter, setFunctionFilter] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [personFilter, setPersonFilter] = useState<string | null>(null);
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
    const updatedTask = {
      ...newTask,
      featureId: newTask.featureId || getDefaultFeatureId(newTask.projectId)
    };
    
    if (updatedTask.teamId && !updatedTask.assigneeId) {
      const teamMembers = teams.find(t => t.id === updatedTask.teamId)?.members || [];
      if (teamMembers.length > 0) {
        const firstMember = teamMembers[0];
        updatedTask.assigneeId = firstMember.id;
        updatedTask.assignee = firstMember.name;
      }
    }
    
    setTasks([...tasks, updatedTask]);
    setShowNewTaskDialog(false);
  };

  const handleCreateFeature = (newFeature: Feature) => {
    setFeatures([...features, newFeature]);
    setShowNewFeatureDialog(false);
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
          completedDate: newCompletionPercentage === 100 ? new Date().toISOString().split('T')[0] : task.completedDate,
          status: newCompletionPercentage === 100 ? 'completed' : task.status
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
          
          const status = percentage === 100 
            ? 'completed' as const 
            : task.status;
          
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

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  };

  const handleAssignPerson = (taskId: string, personId: string) => {
    const person = people.find(p => p.id === personId);
    if (!person) return;
    
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            assigneeId: personId,
            assignee: person.name,
            teamId: person.teamId
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
      handleUpdateTaskCompletion(taskId, percentage);
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
    const matchesPerson = personFilter && personFilter !== "all" ? task.assigneeId === personFilter : true;
    const matchesSearch = searchQuery 
      ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.taskNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    return matchesProject && matchesFeature && matchesStatus && matchesPriority && 
           matchesStage && matchesFunction && matchesTeam && matchesPerson && matchesSearch;
  });

  const getDefaultFeatureId = (projectId: string): string => {
    const projectFeatures = features.filter(f => f.projectId === projectId);
    return projectFeatures.length > 0 ? projectFeatures[0].id : "";
  };

  const projectFeatures = selectedProject
    ? features.filter(feature => feature.projectId === selectedProject)
    : features;

  return (
    <div className="w-full">
      <CustomCard 
        title="Tasks" 
        description="Manage and organize your tasks"
        className="h-full"
        titleExtra={
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => handleOpenProjectDialog(true)}
              size="sm"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Project
            </Button>
            <Button onClick={() => setShowNewFeatureDialog(true)} size="sm">
              <Tag className="h-4 w-4 mr-2" />
              New Feature
            </Button>
            <Button onClick={() => setShowNewTaskDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
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
          
          <div className="flex flex-wrap gap-2">
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
              value={functionFilter || "all"}
              onValueChange={val => setFunctionFilter(val !== "all" ? val : null)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Function" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Functions</SelectItem>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="backend">Backend</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="qa">QA</SelectItem>
                <SelectItem value="devops">DevOps</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={teamFilter || "all"}
              onValueChange={val => setTeamFilter(val !== "all" ? val : null)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={personFilter || "all"}
              onValueChange={val => setPersonFilter(val !== "all" ? val : null)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Person" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All People</SelectItem>
                {people.map(person => (
                  <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mb-4 flex flex-wrap gap-2">
          <Select 
            value={selectedProject || "all"} 
            onValueChange={(value) => setSelectedProject(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={selectedFeature || "all"}
            onValueChange={(value) => setSelectedFeature(value === "all" ? null : value)}
            disabled={!selectedProject}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Feature" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Features</SelectItem>
              {projectFeatures.map(feature => (
                <SelectItem key={feature.id} value={feature.id}>{feature.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <TaskList 
          tasks={filteredTasks} 
          projects={projects}
          features={features}
          teams={teams}
          people={people}
          baseCurrency={baseCurrency}
          onToggleSubtask={handleToggleSubtask}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onUpdateTaskCompletion={handleUpdateTaskCompletion}
          onUpdateTask={handleUpdateTask}
          onAssignPerson={handleAssignPerson}
        />
      </CustomCard>
      
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
        people={people}
        selectedProject={selectedProject}
        selectedFeature={selectedFeature}
        onCreateTask={handleCreateTask}
      />
      
      <NewFeatureDialog 
        open={showNewFeatureDialog}
        onOpenChange={setShowNewFeatureDialog}
        onCreateFeature={(newFeature) => {
          setFeatures([...features, newFeature]);
          setShowNewFeatureDialog(false);
        }}
        projects={projects}
      />
    </div>
  );
}
