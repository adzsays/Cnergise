
import React, { useState } from "react";
import { ProjectTaskManager } from "@/components/tasks/ProjectTaskManager";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { FolderPlus, PlusCircle, Tag } from "lucide-react";
import { NewProjectDialog } from "@/components/tasks/NewProjectDialog";
import { NewFeatureDialog } from "@/components/tasks/NewFeatureDialog";
import { type Project, type Feature } from "@/components/tasks/ProjectTaskManager";

const TaskManagement = () => {
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewFeatureDialog, setShowNewFeatureDialog] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);

  const handleCreateProject = (newProject: Project) => {
    setProjects([...projects, newProject]);
    setShowNewProjectDialog(false);
  };

  const handleCreateFeature = (newFeature: Feature) => {
    setFeatures([...features, newFeature]);
    setShowNewFeatureDialog(false);
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
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowNewFeatureDialog(true)}
                variant="outline"
                className="gap-1"
                size="sm"
              >
                <Tag className="h-3.5 w-3.5" />
                New Feature
              </Button>
              <Button 
                onClick={() => setShowNewProjectDialog(true)}
                variant="outline"
                className="gap-1"
                size="sm"
              >
                <FolderPlus className="h-3.5 w-3.5" />
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
      
      {/* Create Feature Dialog */}
      <NewFeatureDialog 
        open={showNewFeatureDialog}
        onOpenChange={setShowNewFeatureDialog}
        onCreateFeature={handleCreateFeature}
        projects={projects.length > 0 ? projects : [
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
        ]}
      />
    </div>
  );
};

export default TaskManagement;
