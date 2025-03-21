
import React, { useState, Suspense } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { TaskSection } from "@/components/TaskSection";
import { CalendarSection } from "@/components/CalendarSection";
import { FinanceSection } from "@/components/FinanceSection";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsSidebar } from "@/components/StatsSidebar";

// Properly type the ErrorBoundary props
type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback: React.ReactNode;
};

// Properly type the ErrorBoundary state
type ErrorBoundaryState = {
  hasError: boolean;
};

// Error boundary class component with proper TypeScript typing
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showStats, setShowStats] = useState(false);

  // Simple error fallback component to catch errors in child components
  const ErrorFallback = () => (
    <div className="p-6 border border-red-300 rounded-md bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200">
      <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
      <p>There was an error loading this component. We're working on fixing it.</p>
    </div>
  );

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
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowStats(!showStats)}
              >
                {showStats ? "Hide Stats" : "Show Stats"}
              </Button>
              <Button variant="outline" size="sm">
                Upgrade Plan
              </Button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-taskfinity-blue to-taskfinity-purple"></div>
            </div>
          </div>
        </header>

        <main className="p-6 flex">
          <div className={`${showStats ? 'w-3/4 pr-4' : 'w-full'}`}>
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
                <Suspense fallback={<div>Loading dashboard...</div>}>
                  <ErrorBoundary fallback={<ErrorFallback />}>
                    <Dashboard />
                  </ErrorBoundary>
                </Suspense>
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
          </div>
          
          {showStats && (
            <div className="w-1/4 pl-4">
              <StatsSidebar />
            </div>
          )}
        </main>
      </div>

      <VoiceAssistant />
    </div>
  );
};

export default Index;
