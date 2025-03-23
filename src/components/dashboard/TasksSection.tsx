
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Paperclip, User, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TasksSectionProps {
  projectFilter: string;
}

export function TasksSection({ projectFilter }: TasksSectionProps) {
  // Map project IDs to names
  const projectMap: Record<string, string> = {
    "website": "Website Redesign",
    "mobile": "Mobile App Development",
    "marketing": "Marketing Campaign"
  };

  // Mock tasks data
  const allTasksData = [
    {
      id: 1,
      title: "Finalize homepage wireframes",
      projectId: "website",
      project: "Website Redesign",
      dueDate: "Today",
      priority: "high",
      assignee: "John Smith",
      team: "Design Team",
      completionPercentage: 65
    },
    {
      id: 2,
      title: "Review API documentation",
      projectId: "mobile",
      project: "Mobile App Development",
      dueDate: "Tomorrow",
      priority: "medium",
      assignee: "Alice Johnson",
      team: "Backend Team",
      completionPercentage: 30
    },
    {
      id: 3,
      title: "Create social media assets",
      projectId: "marketing",
      project: "Marketing Campaign",
      dueDate: "Aug 25",
      priority: "medium",
      assignee: "Diana Evans",
      team: "Marketing Team",
      completionPercentage: 20
    },
    {
      id: 4,
      title: "Update project timeline",
      projectId: "website",
      project: "Website Redesign",
      dueDate: "Aug 23",
      priority: "high",
      assignee: "Bob Brown",
      team: "Project Management",
      completionPercentage: 80
    },
  ];

  // Filter tasks by project if needed
  const tasksData = projectFilter === "all" 
    ? allTasksData 
    : allTasksData.filter(task => task.projectId === projectFilter);

  const priorityColors = {
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  };

  return (
    <div className="space-y-3">
      {tasksData.length > 0 ? (
        <>
          {tasksData.map((task) => (
            <div
              key={task.id}
              className="p-3 rounded-lg border flex items-start gap-3"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{task.title}</p>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Paperclip className="h-3 w-3 mr-1" />
                  {task.project}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center text-xs text-muted-foreground gap-2">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {task.dueDate}
                    </div>
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {task.assignee}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {task.team}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      priorityColors[task.priority as keyof typeof priorityColors]
                    )}
                  >
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress 
                    value={task.completionPercentage} 
                    className="h-1.5 flex-1" 
                  />
                  <span className="text-xs font-medium">{task.completionPercentage}%</span>
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All Tasks
          </Button>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No tasks found for the selected project.
        </div>
      )}
    </div>
  );
}
