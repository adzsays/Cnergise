
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp } from "lucide-react";

export function ProjectsSection() {
  // Mock project data with tasks, costs, and potential
  const projectsData = [
    {
      id: 1,
      name: "Website Redesign",
      progress: 65,
      tasks: 12,
      completedTasks: 8,
      cost: "$6,500",
      potential: "$15,000",
      priority: "high",
    },
    {
      id: 2,
      name: "Mobile App Development",
      progress: 30,
      tasks: 18,
      completedTasks: 5,
      cost: "$12,000",
      potential: "$45,000",
      priority: "medium",
    },
    {
      id: 3,
      name: "Marketing Campaign",
      progress: 80,
      tasks: 8,
      completedTasks: 6,
      cost: "$4,200",
      potential: "$9,500",
      priority: "low",
    },
  ];

  const priorityColors = {
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Tasks</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Potential</TableHead>
            <TableHead>Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projectsData.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={project.progress} className="h-2 w-20" />
                  <span className="text-xs">{project.progress}%</span>
                </div>
              </TableCell>
              <TableCell>{project.completedTasks}/{project.tasks}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  {project.cost}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-accent" />
                  {project.potential}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs whitespace-nowrap",
                    priorityColors[project.priority as keyof typeof priorityColors]
                  )}
                >
                  {project.priority}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
