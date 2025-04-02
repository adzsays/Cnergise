
import React, { useState } from "react";
import ProjectTaskManager, { Project, Feature, Task } from "@/components/tasks/ProjectTaskManager";
import { EditableTaskTable } from "@/components/tasks/EditableTaskTable";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { FolderPlus, PlusCircle, Tag, FileUp } from "lucide-react";
import { NewProjectDialog } from "@/components/tasks/NewProjectDialog";
import { NewFeatureDialog } from "@/components/tasks/NewFeatureDialog";
import { TaskUploadDialog } from "@/components/tasks/TaskUploadDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const TaskManagement = () => {
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewFeatureDialog, setShowNewFeatureDialog] = useState(false);
  const [showTaskUploadDialog, setShowTaskUploadDialog] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();

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

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    toast({
      title: "Task deleted",
      description: "The task has been deleted successfully",
    });
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
          <Tabs defaultValue="card-view" className="space-y-6">
            <TabsList>
              <TabsTrigger value="card-view">Card View</TabsTrigger>
              <TabsTrigger value="table-view">Table View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="card-view">
              <ProjectTaskManager 
                initialProjects={projects}
                initialFeatures={features}
                initialTasks={tasks}
                onCreateProject={handleCreateProject}
                onCreateFeature={handleCreateFeature}
                onTasksImported={handleTasksImported}
              />
            </TabsContent>
            
            <TabsContent value="table-view">
              <EditableTaskTable 
                tasks={tasks}
                projects={projects}
                features={features}
                teams={[
                  { id: "team-1", name: "Engineering" },
                  { id: "team-2", name: "Design" },
                  { id: "team-3", name: "Product" },
                  { id: "team-4", name: "Marketing" },
                ]}
                people={[
                  { id: "person-1", name: "Alice Johnson", teamId: "team-1" },
                  { id: "person-2", name: "Bob Smith", teamId: "team-1" },
                  { id: "person-3", name: "Carol Williams", teamId: "team-2" },
                  { id: "person-4", name: "Dave Brown", teamId: "team-2" },
                  { id: "person-5", name: "Eve Davis", teamId: "team-3" },
                  { id: "person-6", name: "Frank Miller", teamId: "team-3" },
                  { id: "person-7", name: "Grace Wilson", teamId: "team-4" },
                  { id: "person-8", name: "Hank Moore", teamId: "team-4" },
                ]}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
            </TabsContent>
          </Tabs>
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
