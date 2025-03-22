
import React, { useState } from "react";
import { ProjectTaskManager } from "@/components/tasks/ProjectTaskManager";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";
import { NewProjectDialog } from "@/components/tasks/NewProjectDialog";
import { type Project } from "@/components/tasks/ProjectTaskManager";

const TaskManagement = () => {
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const handleCreateProject = (newProject: Project) => {
    setProjects([...projects, newProject]);
    setShowNewProjectDialog(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-2xl font-bold gradient-heading">
              Task Management
            </h1>
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setShowNewProjectDialog(true)}
                className="gap-2"
              >
                <FolderPlus className="h-4 w-4" />
                New Project
              </Button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-taskfinity-blue to-taskfinity-purple"></div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <ProjectTaskManager 
            showNewProjectDialog={showNewProjectDialog}
            onOpenProjectDialog={setShowNewProjectDialog}
          />
        </main>
      </div>

      {/* Create Project Dialog */}
      <NewProjectDialog 
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
};

export default TaskManagement;
