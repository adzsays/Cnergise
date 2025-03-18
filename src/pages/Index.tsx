
import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { TaskSection } from "@/components/TaskSection";
import { CalendarSection } from "@/components/CalendarSection";
import { FinanceSection } from "@/components/FinanceSection";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-2xl font-bold gradient-heading">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "tasks" && "Task Management"}
              {activeTab === "calendar" && "Calendar"}
              {activeTab === "finances" && "Financial Overview"}
            </h1>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                Upgrade Plan
              </Button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-taskfinity-blue to-taskfinity-purple"></div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Tabs 
            defaultValue="dashboard" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="mb-6"
          >
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="finances">Finances</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="mt-6">
              <Dashboard />
            </TabsContent>
            
            <TabsContent value="tasks" className="mt-6">
              <div className="max-w-3xl mx-auto">
                <TaskSection />
              </div>
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-6">
              <div className="max-w-4xl mx-auto">
                <CalendarSection />
              </div>
            </TabsContent>
            
            <TabsContent value="finances" className="mt-6">
              <div className="max-w-4xl mx-auto">
                <FinanceSection />
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <VoiceAssistant />
    </div>
  );
};

export default Index;
