
import React, { useState } from "react";
import { CustomCard } from "@/components/ui/CustomCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  MoreHorizontal, 
  ChevronDown,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Briefcase,
  Clock
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
  priority: "low" | "medium" | "high";
}

interface Project {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  cost: string;
  potential: string;
  expanded?: boolean;
}

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export function TaskSection() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "p1",
      name: "Website Redesign",
      description: "Complete overhaul of company website",
      cost: "$6,500",
      potential: "$15,000",
      expanded: true,
      tasks: [
        {
          id: "t1",
          title: "Finalize wireframes",
          completed: false,
          dueDate: "2023-08-21",
          priority: "high",
        },
        {
          id: "t2",
          title: "Create style guide",
          completed: true,
          dueDate: "2023-08-18",
          priority: "medium",
        },
      ],
    },
    {
      id: "p2",
      name: "Mobile App Development",
      description: "iOS and Android app for client",
      cost: "$12,000",
      potential: "$45,000",
      expanded: false,
      tasks: [
        {
          id: "t3",
          title: "Review API documentation",
          completed: false,
          dueDate: "2023-08-22",
          priority: "medium",
        },
        {
          id: "t4",
          title: "Setup development environment",
          completed: true,
          dueDate: "2023-08-17",
          priority: "low",
        },
      ],
    },
    {
      id: "p3",
      name: "Marketing Campaign",
      description: "Q3 digital marketing initiative",
      cost: "$4,200",
      potential: "$9,500",
      expanded: false,
      tasks: [
        {
          id: "t5",
          title: "Create social media assets",
          completed: false,
          dueDate: "2023-08-25",
          priority: "medium",
        },
      ],
    },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("p1");

  const handleToggleComplete = (projectId: string, taskId: string) => {
    setProjects(
      projects.map((project) => {
        if (project.id === projectId) {
          return {
            ...project,
            tasks: project.tasks.map((task) =>
              task.id === taskId ? { ...task, completed: !task.completed } : task
            ),
          };
        }
        return project;
      })
    );
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim() === "") return;
    
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    if (!selectedProject) return;
    
    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTaskTitle,
      completed: false,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      priority: "medium",
    };
    
    setProjects(
      projects.map((project) =>
        project.id === selectedProjectId
          ? { ...project, tasks: [newTask, ...project.tasks], expanded: true }
          : project
      )
    );
    setNewTaskTitle("");
  };

  const toggleProjectExpanded = (projectId: string) => {
    setProjects(
      projects.map((project) =>
        project.id === projectId
          ? { ...project, expanded: !project.expanded }
          : project
      )
    );
  };

  const getCompletedTasksCount = (tasks: Task[]) => {
    return tasks.filter(task => task.completed).length;
  };

  return (
    <CustomCard
      title="Project Tasks"
      description="Manage your projects and their associated tasks"
      className="h-full"
    >
      <div className="flex mb-4 gap-2">
        <Input
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddTask();
          }}
          className="flex-1"
        />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                {projects.find(p => p.id === selectedProjectId)?.name || "Select Project"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {projects.map(project => (
                <DropdownMenuItem key={project.id} onClick={() => setSelectedProjectId(project.id)}>
                  {project.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAddTask}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {projects.map((project) => (
          <Collapsible 
            key={project.id} 
            open={project.expanded} 
            onOpenChange={() => toggleProjectExpanded(project.id)}
            className="border rounded-lg overflow-hidden"
          >
            <div className="bg-muted/30 p-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {project.expanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{project.name}</span>
                    <p className="text-xs text-muted-foreground">{project.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{project.cost}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="h-3.5 w-3.5 text-accent" />
                    <span>{project.potential}</span>
                  </div>
                  <div className="px-2 py-0.5 bg-primary/10 rounded text-xs">
                    {getCompletedTasksCount(project.tasks)}/{project.tasks.length} tasks
                  </div>
                </div>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent>
              <div className="p-3 space-y-2">
                {project.tasks.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No tasks for this project yet
                  </div>
                ) : (
                  project.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-start gap-2 p-3 rounded-lg border",
                        task.completed ? "bg-muted/50" : "bg-card"
                      )}
                    >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleComplete(project.id, task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "font-medium",
                              task.completed && "line-through text-muted-foreground"
                            )}
                          >
                            {task.title}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "ml-auto text-xs whitespace-nowrap",
                              priorityColors[task.priority]
                            )}
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Set Priority</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </CustomCard>
  );
}
