import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarInset, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
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
import { VoiceAssistant } from "@/components/VoiceAssistant";

const TaskManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showTaskUploadDialog, setShowTaskUploadDialog] = useState(false);
  const { deleteAllTasks } = useTasks();
  const tabParam = searchParams.get("tab") || "dashboard";

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
      <div className="flex min-h-[100dvh] w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
        <AppSidebar />
        <SidebarRail />
        
        <SidebarInset>
          <div className="flex h-full flex-col">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-14 md:h-16 items-center justify-between px-3 md:px-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <SidebarTrigger className="md:hidden h-8 w-8" />
                  <h1 className="text-lg md:text-2xl font-bold gradient-heading">
                    Task Management
                  </h1>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowTaskUploadDialog(true)}
                    className="hidden md:flex items-center gap-1"
                  >
                    <FileUp className="h-4 w-4" />
                    Import Tasks
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setShowTaskUploadDialog(true)}
                    className="md:hidden h-8 w-8"
                  >
                    <FileUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleDeleteAllTasks}
                    className="hidden md:flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete All Tasks
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={handleDeleteAllTasks}
                    className="md:hidden h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="hidden md:flex items-center gap-1"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    className="md:hidden h-8 w-8"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                  <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-gradient-to-r from-taskfinity-blue to-taskfinity-purple"></div>
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-auto p-3 md:p-6">
              <Tabs defaultValue="dashboard" className="space-y-4 md:space-y-6">
                <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
                  <TabsList className="bg-muted/50 p-1 inline-flex min-w-max">
                    <TabsTrigger value="dashboard" className="text-xs md:text-sm px-2 md:px-3 data-[state=active]:bg-background">Dashboard</TabsTrigger>
                    <TabsTrigger value="tasks" className="text-xs md:text-sm px-2 md:px-3 data-[state=active]:bg-background">Tasks</TabsTrigger>
                    <TabsTrigger value="projects" className="text-xs md:text-sm px-2 md:px-3 data-[state=active]:bg-background">Projects</TabsTrigger>
                    <TabsTrigger value="spaces" className="text-xs md:text-sm px-2 md:px-3 data-[state=active]:bg-background">Spaces</TabsTrigger>
                    <TabsTrigger value="teams" className="text-xs md:text-sm px-2 md:px-3 data-[state=active]:bg-background">Teams</TabsTrigger>
                  </TabsList>
                </div>
                
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
        <VoiceAssistant />
      </div>
    </SidebarProvider>
  );
};

export default TaskManagement;
