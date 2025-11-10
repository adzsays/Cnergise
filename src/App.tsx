
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import TaskManagement from "./pages/TaskManagement";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Mail from "./pages/Mail";
import Goals from "./pages/Goals";
import Health from "./pages/Health";
import Portfolio from "./pages/Portfolio";
import Finances from "./pages/Finances";
import Profile from "./pages/Profile";
import Users from "./pages/Users";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { AuthGuard } from "./components/AuthGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/tasks" element={<AuthGuard><TaskManagement /></AuthGuard>} />
          <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/calendar" element={<AuthGuard><Calendar /></AuthGuard>} />
          <Route path="/mail" element={<AuthGuard><Mail /></AuthGuard>} />
          <Route path="/finances" element={<AuthGuard><Finances /></AuthGuard>} />
          <Route path="/goals" element={<AuthGuard><Goals /></AuthGuard>} />
          <Route path="/health" element={<AuthGuard><Health /></AuthGuard>} />
          <Route path="/portfolio" element={<AuthGuard><Portfolio /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          <Route path="/users" element={<AuthGuard><Users /></AuthGuard>} />
          <Route path="/admin" element={<AuthGuard><Admin /></AuthGuard>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
