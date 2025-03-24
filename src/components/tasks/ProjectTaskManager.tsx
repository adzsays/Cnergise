import React, { useState } from "react";
import { ProjectList } from "./ProjectList";
import { TaskList } from "./TaskList";
import { NewTaskDialog } from "./NewTaskDialog";
import { Button } from "@/components/ui/button";
import { FolderPlus, PlusCircle, Tag } from "lucide-react";

// Define all types that need to be exported
export type TaskStatus = "todo" | "in-progress" | "blocked" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type FunctionType = "frontend" | "backend" | "design" | "qa" | "devops" | "business" | "other";
export type StageType = "requirements" | "development" | "testing" | "release" | "go-live";
export type CurrencyType = "USD" | "EUR" | "GBP" | "JPY" | "INR" | "CNY";

export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
};

export type Feature = {
  id: string;
  name: string;
  description: string;
  projectId: string;
};

export type Team = {
  id: string;
  name: string;
};

export type Person = {
  id: string;
  name: string;
  teamId: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  featureId?: string;
  functionType?: FunctionType;
  stage: StageType;
  teamId?: string;
  assigneeId?: string;
  assignee?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  dueDate?: string;
  completionPercentage: number;
  createdAt: string;
  completedDate?: string;
  subtasks: Subtask[];
};

interface ProjectTaskManagerProps {
  initialProjects?: Project[];
  initialFeatures?: Feature[];
  initialTasks?: Task[];
  onCreateProject?: (project: Project) => void;
  onCreateFeature?: (feature: Feature) => void;
  onTasksImported?: (tasks: Task[]) => void;
}

const ProjectTaskManager: React.FC<ProjectTaskManagerProps> = ({
  initialProjects = [],
  initialFeatures = [],
  initialTasks = [],
  onCreateProject,
  onCreateFeature,
  onTasksImported
}) => {
  // State for projects and features
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
  
  // State for tasks
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  
  // State for teams and people
  const [teams, setTeams] = useState<Team[]>([
    { id: "team-1", name: "Engineering" },
    { id: "team-2", name: "Design" },
    { id: "team-3", name: "Product" },
    { id: "team-4", name: "Marketing" },
  ]);
  
  const [people, setPeople] = useState<Person[]>([
    { id: "person-1", name: "Alice Johnson", teamId: "team-1" },
    { id: "person-2", name: "Bob Smith", teamId: "team-1" },
    { id: "person-3", name: "Carol Williams", teamId: "team-2" },
    { id: "person-4", name: "Dave Brown", teamId: "team-2" },
    { id: "person-5", name: "Eve Davis", teamId: "team-3" },
    { id: "person-6", name: "Frank Miller", teamId: "team-3" },
    { id: "person-7", name: "Grace Wilson", teamId: "team-4" },
    { id: "person-8", name: "Hank Moore", teamId: "team-4" },
  ]);
  
  // State for UI
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewFeatureDialog, setShowNewFeatureDialog] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  // Handlers
  const handleCreateProject = (project: Project) => {
    setProjects((prev) => [...prev, project]);
    onCreateProject?.(project);
  };
  
  const handleCreateFeature = (feature: Feature) => {
    setFeatures((prev) => [...prev, feature]);
    onCreateFeature?.(feature);
  };
  
  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId);
  };
  
  const handleCreateTask = (task: Task) => {
    if (editingTask) {
      // Update existing task
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === task.id ? task : t))
      );
      setEditingTask(undefined);
    } else {
      // Create new task
      setTasks((prevTasks) => [...prevTasks, task]);
    }
    setShowNewTaskDialog(false);
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowNewTaskDialog(true);
  };
  
  const handleDeleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };
  
  // Handler for toggling subtasks
  const handleSubtaskToggle = (taskId: string, subtaskId: string, completed: boolean) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: task.subtasks.map((subtask) =>
              subtask.id === subtaskId
                ? { ...subtask, completed }
                : subtask
            ),
          };
        }
        return task;
      })
    );
  };
  
  // Handler for updating completion percentage
  const handleUpdateCompletion = (taskId: string, percentage: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            completionPercentage: percentage,
          };
        }
        return task;
      })
    );
  };
  
  // Fixed version of handleTaskStatusChange
  const handleTaskStatusChange = (taskId: string, status: TaskStatus) => {
    setTasks((prevTasks) => 
      prevTasks.map((task) => {
        if (task.id === taskId) {
          const updatedTask = { 
            ...task, 
            status,
            // Set completedDate if status is completed, otherwise remove it
            completedDate: status === "completed" ? new Date().toISOString() : undefined
          };
          return updatedTask;
        }
        return task;
      })
    );
  };
  
  // Get filtered tasks for the selected project
  const filteredTasks = selectedProject
    ? tasks.filter((task) => task.projectId === selectedProject)
    : tasks;
  
  // Get filtered features for the selected project
  const filteredFeatures = selectedProject
    ? features.filter((feature) => feature.projectId === selectedProject)
    : [];
  
  return (
    <div className="grid grid-cols-4 gap-6">
      {/* Projects Sidebar */}
      <div className="col-span-1">
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 px-2"
              onClick={() => setShowNewProjectDialog(true)}
            >
              <FolderPlus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          
          <ProjectList 
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={handleSelectProject}
          />
          
          {selectedProject && (
            <>
              <div className="flex items-center justify-between mt-6 mb-4">
                <h3 className="text-md font-medium">Features</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setShowNewFeatureDialog(true)}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  New
                </Button>
              </div>
              
              <div className="space-y-2">
                {filteredFeatures.length === 0 ? (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    No features yet
                  </div>
                ) : (
                  filteredFeatures.map((feature) => (
                    <div 
                      key={feature.id}
                      className="p-2 rounded-md hover:bg-muted text-sm"
                    >
                      {feature.name}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Main Task Area */}
      <div className="col-span-3">
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {selectedProject
                ? `Tasks: ${projects.find(p => p.id === selectedProject)?.name || "Selected Project"}`
                : "All Tasks"}
            </h2>
            <Button 
              onClick={() => {
                setEditingTask(undefined);
                setShowNewTaskDialog(true);
              }}
              className="h-9"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
          
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
            onUpdateCompletion={handleUpdateCompletion}
          />
        </div>
      </div>
      
      {/* Task Dialog */}
      <NewTaskDialog
        open={showNewTaskDialog}
        onOpenChange={setShowNewTaskDialog}
        onCreateTask={handleCreateTask}
        projects={projects}
        features={features}
        teams={teams}
        people={people}
        selectedProject={selectedProject}
        task={editingTask}
      />
    </div>
  );
};

export default ProjectTaskManager;
