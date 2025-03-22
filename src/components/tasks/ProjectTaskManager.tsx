
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

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  status: "todo" | "in-progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  createdAt: string;
  assignee?: string;
  subtasks: Subtask[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
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

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "task1",
      title: "Finalize homepage wireframes",
      description: "Complete all wireframes for the homepage redesign",
      projectId: "website",
      status: "in-progress",
      priority: "high",
      dueDate: "2023-08-25",
      createdAt: "2023-08-15T10:00:00Z",
      assignee: "John Doe",
      subtasks: [
        { id: "sub1", title: "Create mobile version", completed: true },
        { id: "sub2", title: "Review with stakeholders", completed: false },
        { id: "sub3", title: "Finalize design system", completed: false }
      ]
    },
    {
      id: "task2",
      title: "Setup API endpoints",
      description: "Create and document all required API endpoints",
      projectId: "mobile",
      status: "todo",
      priority: "medium",
      dueDate: "2023-09-05",
      createdAt: "2023-08-18T14:30:00Z",
      subtasks: []
    },
    {
      id: "task3",
      title: "Create social media content calendar",
      projectId: "marketing",
      status: "todo",
      priority: "medium",
      dueDate: "2023-08-30",
      createdAt: "2023-08-20T09:15:00Z",
      subtasks: [
        { id: "sub4", title: "Draft posts for Instagram", completed: false },
        { id: "sub5", title: "Create graphics", completed: false }
      ]
    }
  ]);

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: task.subtasks.map(subtask => 
            subtask.id === subtaskId 
              ? { ...subtask, completed: !subtask.completed } 
              : subtask
          )
        };
      }
      return task;
    }));
  };

  const handleUpdateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status } : task
    ));
  };

  const filteredTasks = tasks.filter(task => {
    const matchesProject = selectedProject ? task.projectId === selectedProject : true;
    const matchesStatus = statusFilter ? task.status === statusFilter : true;
    const matchesPriority = priorityFilter ? task.priority === priorityFilter : true;
    const matchesSearch = searchQuery 
      ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    return matchesProject && matchesStatus && matchesPriority && matchesSearch;
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
              value={statusFilter || ""}
              onValueChange={val => setStatusFilter(val || null)}
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
              value={priorityFilter || ""}
              onValueChange={val => setPriorityFilter(val || null)}
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
            
            <Button onClick={() => setShowNewTaskDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
          
          <TaskList 
            tasks={filteredTasks} 
            projects={projects}
            onToggleSubtask={handleToggleSubtask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
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
        selectedProject={selectedProject}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
}
