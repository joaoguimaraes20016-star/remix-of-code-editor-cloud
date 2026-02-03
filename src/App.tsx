import * as React from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import { AppThemeProvider } from "./components/AppThemeProvider";
import { isCustomDomainHost } from "./lib/runtimeEnv";

import SalesDashboard from "./pages/SalesDashboard";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import TeamSettings from "./pages/TeamSettings";
import Workflows from "./pages/Workflows";
import AutomationEditor from "./pages/AutomationEditor";
import ClientAssets from "./pages/ClientAssets";
import Schedule from "./pages/Schedule";
import OnboardingForm from "./pages/OnboardingForm";
import NotFound from "./pages/NotFound";
import FunnelList from "./pages/FunnelList";
import FunnelEditorV3 from "./pages/FunnelEditorV3";
import PublicFunnel from "./pages/PublicFunnel";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Marketing from "./pages/Marketing";
import Billing from "./pages/Billing";
import PaymentsPortal from "./pages/PaymentsPortal";
import Performance from "./pages/Performance";
import { EditorShell } from "./builder_v2/EditorShell";
import { RuntimePage } from "./builder_v2/runtime";
// Flow-canvas builder (new version)
import FlowCanvasIndex from "./flow-canvas/pages/Index";
// Token test harness for visual verification
import TokenTestHarness from "./builder/test/TokenTestHarness";

// Legacy workflow route redirect component
function LegacyWorkflowRedirect() {
  const { teamId, automationId } = useParams();
  const location = useLocation();
  const targetId = automationId || "new";
  return <Navigate to={`/team/${teamId}/workflows/${targetId}/edit${location.search}`} replace />;
}
// Dev-only funnel test route (dynamically imported so it is not included in production builds)
let DevFunnelTest: React.LazyExoticComponent<any> | null = null;
if (import.meta.env.DEV) {
  DevFunnelTest = React.lazy(() => import("./pages/__dev/FunnelTest"));
}

// Check if funnel data was injected by serve-funnel edge function
function hasInjectedFunnelData(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__INFOSTACK_FUNNEL__;
}

import { TeamLayout } from "./layouts/TeamLayout";

import { TeamHubOverview } from "./pages/TeamHubOverview";
import { TeamChatPage } from "./pages/TeamChat";
import AppsPortal from "./pages/AppsPortal";
import PersonalSettings from "./pages/PersonalSettings";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AppThemeProvider>
        <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* 🔓 TEMP DEV ROUTE — must stay outside auth */}
            <Route path="/builder-v2" element={<EditorShell />} />
            <Route path="/flow-canvas" element={<FlowCanvasIndex />} />
            <Route path="/builder/token-test" element={<TokenTestHarness />} />
            
            {/* Funnel Editor - Full screen, no team layout */}
            <Route path="/team/:teamId/funnels/:funnelId/edit" element={<FunnelEditorV3 />} />
            
            {/* Automation Editor - Full screen, no team layout */}
            <Route path="/team/:teamId/workflows/:automationId/edit" element={<AutomationEditor />} />
            {/* Legacy workflow routes - redirect to new structure */}
            <Route path="/team/:teamId/workflows/edit/new" element={<LegacyWorkflowRedirect />} />
            <Route path="/team/:teamId/workflows/edit/:automationId" element={<LegacyWorkflowRedirect />} />

            {/* Public routes - no auth required */}
            <Route path="/onboard/:token" element={<OnboardingForm />} />
            <Route path="/f/:slug" element={<PublicFunnel />} />
            <Route path="/runtime/:documentId" element={<RuntimePage />} />
            <Route path="/legal/privacy" element={<PrivacyPolicy />} />

            {import.meta.env.DEV && DevFunnelTest && (
              <Route
                path="/__dev/funnel-test"
                element={
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <DevFunnelTest />
                  </React.Suspense>
                }
              />
            )}

            {/* Auth routes - but check if we're on custom domain first */}
            <Route path="/" element={
              (isCustomDomainHost() || hasInjectedFunnelData()) 
                ? <PublicFunnel /> 
                : <Auth />
            } />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/confirm" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/client-assets" element={<ClientAssets />} />

            {/* Team routes with sidebar layout */}
            <Route path="/team/:teamId" element={<TeamLayout />}>
              <Route index element={<TeamHubOverview />} />
              <Route path="performance" element={<Performance />} />
              <Route path="dashboard" element={<SalesDashboard defaultTab="dashboard" />} />
              <Route path="pipeline" element={<SalesDashboard defaultTab="appointments" />} />
              <Route path="crm" element={<Navigate to="../dashboard" replace />} />
              <Route path="funnels" element={<FunnelList />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="chat" element={<TeamChatPage />} />
              <Route path="payments" element={<PaymentsPortal />} />
              <Route path="apps" element={<AppsPortal />} />
              <Route path="profile" element={<PersonalSettings />} />
              <Route path="workflows" element={<Workflows />} />
              <Route path="marketing" element={<Marketing />} />
              <Route path="billing" element={<Billing />} />
              {/* Legacy redirect for old messaging route */}
              <Route path="messaging" element={<Navigate to="../marketing" replace />} />
              <Route path="settings" element={<TeamSettings />} />
              <Route path="team-settings" element={<TeamSettings />} />
              {/* Legacy redirect */}
              <Route path="integrations" element={<Navigate to="../apps" replace />} />
            </Route>

            {/* Legacy routes - redirect to new structure */}
            <Route path="/team/:teamId/sales" element={<TeamLayout />}>
              <Route index element={<SalesDashboard />} />
            </Route>
            <Route path="/team/:teamId/assets" element={<Navigate to=".." replace />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        </TooltipProvider>
      </AppThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
