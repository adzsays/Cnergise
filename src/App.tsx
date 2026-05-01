import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Stealth from "./pages/Stealth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Install from "./pages/Install";
import TaskManagement from "./pages/TaskManagement";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Mail from "./pages/Mail";
import Goals from "./pages/Goals";
import Health from "./pages/Health";
import Portfolio from "./pages/Portfolio";
import Finances from "./pages/Finances";
import SocialMedia from "./pages/SocialMedia";
import Profile from "./pages/Profile";
import Users from "./pages/Users";
import Admin from "./pages/Admin";
import Teams from "./pages/Teams";
import Contacts from "./pages/Contacts";
import Chat from "./pages/Chat";
import ProjectsAnalytics from "./pages/ProjectsAnalytics";
import Monitoring from "./pages/Monitoring";
import Learning from "./pages/Learning";
import Echo from "./pages/Echo";
import NotFound from "./pages/NotFound";
import { AuthGuard } from "./components/AuthGuard";
import { FeatureGate } from "./components/features/FeatureGate";
import ErrorBoundary from "./components/ErrorBoundary";
import { SpaceProvider } from "./contexts/SpaceContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <SpaceProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Auth />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/install" element={<Install />} />
              <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />
              <Route path="/home" element={<AuthGuard><Home /></AuthGuard>} />
              <Route path="/tasks" element={<AuthGuard><FeatureGate featureKey="tasks"><TaskManagement /></FeatureGate></AuthGuard>} />
              <Route path="/projects" element={<AuthGuard><FeatureGate featureKey="projects"><ProjectsAnalytics /></FeatureGate></AuthGuard>} />
              <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
              <Route path="/calendar" element={<AuthGuard><FeatureGate featureKey="calendar"><Calendar /></FeatureGate></AuthGuard>} />
              <Route path="/mail" element={<AuthGuard><FeatureGate featureKey="mail"><Mail /></FeatureGate></AuthGuard>} />
              <Route path="/finances" element={<AuthGuard><FeatureGate featureKey="finance"><Finances /></FeatureGate></AuthGuard>} />
              <Route path="/social" element={<AuthGuard><FeatureGate featureKey="social"><SocialMedia /></FeatureGate></AuthGuard>} />
              <Route path="/goals" element={<AuthGuard><FeatureGate featureKey="goals"><Goals /></FeatureGate></AuthGuard>} />
              <Route path="/health" element={<AuthGuard><FeatureGate featureKey="health"><Health /></FeatureGate></AuthGuard>} />
              <Route path="/portfolio" element={<AuthGuard><FeatureGate featureKey="portfolio"><Portfolio /></FeatureGate></AuthGuard>} />
              <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
              <Route path="/users" element={<AuthGuard><Users /></AuthGuard>} />
              <Route path="/admin" element={<AuthGuard><Admin /></AuthGuard>} />
              <Route path="/teams" element={<AuthGuard><FeatureGate featureKey="teams"><Teams /></FeatureGate></AuthGuard>} />
              <Route path="/contacts" element={<AuthGuard><FeatureGate featureKey="contacts"><Contacts /></FeatureGate></AuthGuard>} />
              <Route path="/chat" element={<AuthGuard><FeatureGate featureKey="chat"><Chat /></FeatureGate></AuthGuard>} />
              <Route path="/monitoring" element={<AuthGuard><Monitoring /></AuthGuard>} />
              <Route path="/learning" element={<AuthGuard><FeatureGate featureKey="learning"><Learning /></FeatureGate></AuthGuard>} />
              <Route path="/echo" element={<AuthGuard><FeatureGate featureKey="echo"><Echo /></FeatureGate></AuthGuard>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SpaceProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
