import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";
import { TaskUploadDialog } from "@/components/tasks/TaskUploadDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectsTab } from "@/components/tasks/ProjectsTab";
import { SpacesTab } from "@/components/tasks/SpacesTab";
import { TeamsTab } from "@/components/tasks/TeamsTab";
import { TaskList } from "@/components/tasks/TaskList";

const TaskManagement = () => {
  const [showTaskUploadDialog, setShowTaskUploadDialog] = useState(false);

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
          <Tabs defaultValue="tasks" className="space-y-6">
            <TabsList>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="spaces">Spaces</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks">
              <TaskList />
            </TabsContent>
            
            <TabsContent value="projects">
              <ProjectsTab />
            </TabsContent>
            
            <TabsContent value="spaces">
              <SpacesTab />
            </TabsContent>
            
            <TabsContent value="teams">
              <TeamsTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Task Upload Dialog */}
      <TaskUploadDialog
        open={showTaskUploadDialog}
        onOpenChange={setShowTaskUploadDialog}
      />
    </div>
  );
};

export default TaskManagement;
