import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { FileUp, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TaskUploadDialog } from "@/components/tasks/TaskUploadDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectsTab } from "@/components/tasks/ProjectsTab";
import { SpacesTab } from "@/components/tasks/SpacesTab";
import { TeamsTab } from "@/components/tasks/TeamsTab";
import { TaskList } from "@/components/tasks/TaskList";
import { ProjectAnalyticsDashboard } from "@/components/projects/ProjectAnalyticsDashboard";
import { useTasks } from "@/hooks/useTasks";

const TaskManagement = () => {
  const navigate = useNavigate();
  const [showTaskUploadDialog, setShowTaskUploadDialog] = useState(false);
  const { deleteAllTasks } = useTasks();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error("Failed to sign out");
    }
  };

  const handleDeleteAllTasks = () => {
    if (confirm('Are you sure you want to delete ALL tasks? This action cannot be undone.')) {
      deleteAllTasks.mutate();
    }
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarRail />
        
        <SidebarInset>
          <div className="flex h-full flex-col">
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
                    Import Tasks
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleDeleteAllTasks}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete All Tasks
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="flex items-center gap-1"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-taskfinity-blue to-taskfinity-purple"></div>
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-auto p-6">
              <Tabs defaultValue="dashboard" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                  <TabsTrigger value="dashboard" className="data-[state=active]:bg-background">Dashboard</TabsTrigger>
                  <TabsTrigger value="tasks" className="data-[state=active]:bg-background">Tasks</TabsTrigger>
                  <TabsTrigger value="projects" className="data-[state=active]:bg-background">Projects</TabsTrigger>
                  <TabsTrigger value="spaces" className="data-[state=active]:bg-background">Spaces</TabsTrigger>
                  <TabsTrigger value="teams" className="data-[state=active]:bg-background">Teams</TabsTrigger>
                </TabsList>
                
                <TabsContent value="dashboard">
                  <ProjectAnalyticsDashboard />
                </TabsContent>
                
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
        </SidebarInset>

        {/* Task Upload Dialog */}
        <TaskUploadDialog
          open={showTaskUploadDialog}
          onOpenChange={setShowTaskUploadDialog}
        />
      </div>
    </SidebarProvider>
  );
};

export default TaskManagement;
