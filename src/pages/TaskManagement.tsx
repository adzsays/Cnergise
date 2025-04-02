
import React, { useState } from "react";
import ProjectTaskManager, { Project, Feature, Task } from "@/components/tasks/ProjectTaskManager";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { FolderPlus, PlusCircle, Tag, FileUp } from "lucide-react";
import { NewProjectDialog } from "@/components/tasks/NewProjectDialog";
import { NewFeatureDialog } from "@/components/tasks/NewFeatureDialog";
import { TaskUploadDialog } from "@/components/tasks/TaskUploadDialog";

const TaskManagement = () => {
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewFeatureDialog, setShowNewFeatureDialog] = useState(false);
  const [showTaskUploadDialog, setShowTaskUploadDialog] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleCreateProject = (newProject: Project) => {
    setProjects([...projects, newProject]);
    setShowNewProjectDialog(false);
  };

  const handleCreateFeature = (newFeature: Feature) => {
    setFeatures([...features, newFeature]);
    setShowNewFeatureDialog(false);
  };

  const handleTasksImported = (importedTasks: Task[]) => {
    setTasks(prevTasks => [...prevTasks, ...importedTasks]);
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
                variant="outline" 
                size="sm" 
                onClick={() => setShowTaskUploadDialog(true)}
                className="flex items-center gap-1"
              >
                <FileUp className="h-4 w-4" />
                Import Tasks (CSV/Excel)
              </Button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-taskfinity-blue to-taskfinity-purple"></div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <ProjectTaskManager 
            initialProjects={projects}
            initialFeatures={features}
            initialTasks={tasks}
            onCreateProject={handleCreateProject}
            onCreateFeature={handleCreateFeature}
            onTasksImported={handleTasksImported}
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
        projects={projects}
      />
      
      {/* Task Upload Dialog */}
      <TaskUploadDialog
        open={showTaskUploadDialog}
        onOpenChange={setShowTaskUploadDialog}
        projects={projects}
        features={features}
        onTasksImported={handleTasksImported}
      />
    </div>
  );
};

export default TaskManagement;
