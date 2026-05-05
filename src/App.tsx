import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import { AuthGuard } from "./components/AuthGuard";
import { AdminGuard } from "./components/AdminGuard";
import { FeatureGate } from "./components/features/FeatureGate";
import ErrorBoundary from "./components/ErrorBoundary";
import { SpaceProvider } from "./contexts/SpaceContext";

// Lazy-load every non-critical route to keep mobile bundle lean.
const Stealth = lazy(() => import("./pages/Stealth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Home = lazy(() => import("./pages/Home"));
const TaskManagement = lazy(() => import("./pages/TaskManagement"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Calendar = lazy(() => import("./pages/Calendar"));

const Health = lazy(() => import("./pages/Health"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Finances = lazy(() => import("./pages/Finances"));
const SocialMedia = lazy(() => import("./pages/SocialMedia"));
const Profile = lazy(() => import("./pages/Profile"));
const Users = lazy(() => import("./pages/Users"));
const Admin = lazy(() => import("./pages/Admin"));
const Teams = lazy(() => import("./pages/Teams"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Chat = lazy(() => import("./pages/Chat"));
const ProjectsAnalytics = lazy(() => import("./pages/ProjectsAnalytics"));
const Plan = lazy(() => import("./pages/Plan"));
const Monitoring = lazy(() => import("./pages/Monitoring"));
const Learning = lazy(() => import("./pages/Learning"));

const Invoices = lazy(() => import("./pages/Invoices"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const AdminInbox = lazy(() => import("./pages/AdminInbox"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="flex min-h-[100dvh] items-center justify-center text-sm text-muted-foreground">
    Loading…
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <SpaceProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Auth />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/install" element={<Install />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />
                <Route path="/home" element={<AuthGuard><Home /></AuthGuard>} />
                <Route path="/plan" element={<AuthGuard><FeatureGate featureKey="tasks"><Plan /></FeatureGate></AuthGuard>} />
                <Route path="/tasks" element={<Navigate to="/plan" replace />} />
                <Route path="/projects" element={<Navigate to="/plan" replace />} />
                <Route path="/goals" element={<Navigate to="/plan" replace />} />
                <Route path="/projects-analytics" element={<AuthGuard><FeatureGate featureKey="projects"><ProjectsAnalytics /></FeatureGate></AuthGuard>} />
                <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
                <Route path="/calendar" element={<AuthGuard><FeatureGate featureKey="calendar"><Calendar /></FeatureGate></AuthGuard>} />
                <Route path="/mail" element={<Navigate to="/social" replace />} />
                <Route path="/finances" element={<AuthGuard><FeatureGate featureKey="finance"><Finances /></FeatureGate></AuthGuard>} />
                <Route path="/social" element={<AuthGuard><FeatureGate featureKey="social"><SocialMedia /></FeatureGate></AuthGuard>} />
                <Route path="/health" element={<AuthGuard><FeatureGate featureKey="health"><Health /></FeatureGate></AuthGuard>} />
                <Route path="/portfolio" element={<AuthGuard><FeatureGate featureKey="portfolio"><Portfolio /></FeatureGate></AuthGuard>} />
                <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
                <Route path="/users" element={<AuthGuard><AdminGuard><Users /></AdminGuard></AuthGuard>} />
                <Route path="/admin" element={<AuthGuard><AdminGuard><Admin /></AdminGuard></AuthGuard>} />
                <Route path="/admin/inbox" element={<AuthGuard><AdminGuard><AdminInbox /></AdminGuard></AuthGuard>} />
                <Route path="/teams" element={<AuthGuard><FeatureGate featureKey="teams"><Teams /></FeatureGate></AuthGuard>} />
                <Route path="/contacts" element={<AuthGuard><FeatureGate featureKey="contacts"><Contacts /></FeatureGate></AuthGuard>} />
                <Route path="/chat" element={<AuthGuard><FeatureGate featureKey="chat"><Chat /></FeatureGate></AuthGuard>} />
                <Route path="/monitoring" element={<AuthGuard><Monitoring /></AuthGuard>} />
                <Route path="/learning" element={<AuthGuard><FeatureGate featureKey="learning"><Learning /></FeatureGate></AuthGuard>} />
                <Route path="/echo" element={<Navigate to="/plan" replace />} />
                <Route path="/invoices" element={<AuthGuard><FeatureGate featureKey="invoicing"><Invoices /></FeatureGate></AuthGuard>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SpaceProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
