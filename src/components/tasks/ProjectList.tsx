
import React from "react";
import { Button } from "@/components/ui/button";
import { type Project } from "./ProjectTaskManager";
import { FolderOpen, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface ProjectListProps {
  projects: Project[];
  selectedProject: string | null;
  onSelectProject: (projectId: string) => void;
}

export function ProjectList({ projects, selectedProject, onSelectProject }: ProjectListProps) {
  return (
    <div className="space-y-2">
      {projects.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          No projects yet. Create your first project!
        </div>
      ) : (
        projects.map((project) => (
          <div
            key={project.id}
            className={cn(
              "flex items-start justify-between p-3 rounded-md transition-colors",
              selectedProject === project.id
                ? "bg-accent text-accent-foreground"
                : "hover:bg-muted"
            )}
          >
            <Button
              variant="ghost"
              className="flex items-center justify-start p-0 h-auto w-full text-left"
              onClick={() => onSelectProject(project.id)}
            >
              <div 
                className="h-3 w-3 rounded-full mr-3 flex-shrink-0" 
                style={{ backgroundColor: project.color }}
              />
              <div className="truncate">
                <div className="font-medium">{project.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {project.description}
                </div>
              </div>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit Project</DropdownMenuItem>
                <DropdownMenuItem>Archive Project</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))
      )}
    </div>
  );
}
