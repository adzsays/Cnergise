
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TaskManagement from "./pages/TaskManagement";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { UnderConstruction } from "./pages/UnderConstruction";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tasks" element={<TaskManagement />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<UnderConstruction title="Calendar" />} />
          <Route path="/mail" element={<UnderConstruction title="Mail" />} />
          <Route path="/finances" element={<UnderConstruction title="Finances" />} />
          <Route path="/goals" element={<UnderConstruction title="Goals" />} />
          <Route path="/health" element={<UnderConstruction title="Health" />} />
          <Route path="/portfolio" element={<UnderConstruction title="Portfolio" />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
