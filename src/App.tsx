import * as React from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";

import SalesDashboard from "./pages/SalesDashboard";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import TeamSettings from "./pages/TeamSettings";
import Workflows from "./pages/Workflows";
import ClientAssets from "./pages/ClientAssets";
import Schedule from "./pages/Schedule";
import OnboardingForm from "./pages/OnboardingForm";
import NotFound from "./pages/NotFound";
import FunnelList from "./pages/FunnelList";
import FunnelEditor from "./pages/FunnelEditor";
import PublicFunnel from "./pages/PublicFunnel";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { EditorShell } from "./builder_v2/EditorShell";
import { RuntimePage } from "./builder_v2/runtime";
// Flow-canvas builder (new version)
import FlowCanvasIndex from "./flow-canvas/pages/Index";
// Dev-only funnel test route (dynamically imported so it is not included in production builds)
let DevFunnelTest: React.LazyExoticComponent<any> | null = null;
if (import.meta.env.DEV) {
  DevFunnelTest = React.lazy(() => import("./pages/__dev/FunnelTest"));
}

// Check if we're on a custom domain (for serving funnels at root)
function isCustomDomain(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  // Not a custom domain if it's localhost, preview, or Lovable domains
  return !hostname.includes('localhost') && 
         !hostname.includes('.app') && 
         !hostname.includes('.lovable.') &&
         !hostname.includes('lovableproject.com') &&
         !hostname.includes('127.0.0.1');
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
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* 🔓 TEMP DEV ROUTE — must stay outside auth */}
            <Route path="/builder-v2" element={<EditorShell />} />
            <Route path="/flow-canvas" element={<FlowCanvasIndex />} />
            
            {/* Funnel Editor - Full screen, no team layout */}
            <Route path="/team/:teamId/funnels/:funnelId/edit" element={<FunnelEditor />} />

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
              (isCustomDomain() || hasInjectedFunnelData()) 
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
              <Route path="crm" element={<SalesDashboard />} />
              <Route path="funnels" element={<FunnelList />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="chat" element={<TeamChatPage />} />
              <Route path="apps" element={<AppsPortal />} />
              <Route path="profile" element={<PersonalSettings />} />
              <Route path="workflows" element={<Workflows />} />
              <Route path="settings" element={<TeamSettings />} />
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
        </BrowserRouter>
        
      </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
