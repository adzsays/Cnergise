
import React, { useState } from "react";
import { CustomCard } from "@/components/ui/CustomCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, MoreHorizontal } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
  priority: "low" | "medium" | "high";
}

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export function TaskSection() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Complete project proposal",
      completed: false,
      dueDate: "2023-08-21",
      priority: "high",
    },
    {
      id: "2",
      title: "Review marketing materials",
      completed: false,
      dueDate: "2023-08-22",
      priority: "medium",
    },
    {
      id: "3",
      title: "Update team documentation",
      completed: true,
      dueDate: "2023-08-18",
      priority: "low",
    },
    {
      id: "4",
      title: "Prepare for client meeting",
      completed: false,
      dueDate: "2023-08-19",
      priority: "high",
    },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleToggleComplete = (taskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim() === "") return;
    
    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTaskTitle,
      completed: false,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      priority: "medium",
    };
    
    setTasks([newTask, ...tasks]);
    setNewTaskTitle("");
  };

  return (
    <CustomCard
      title="Tasks"
      description="Manage your tasks and priorities"
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
        <Button onClick={handleAddTask}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "flex items-start gap-2 p-3 rounded-lg border",
              task.completed ? "bg-muted/50" : "bg-card"
            )}
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => handleToggleComplete(task.id)}
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
                <CalendarIcon className="h-3 w-3 mr-1" />
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
        ))}
      </div>
    </CustomCard>
  );
}
