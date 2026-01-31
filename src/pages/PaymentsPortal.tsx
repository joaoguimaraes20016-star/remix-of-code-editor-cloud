import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProcessorCard } from "@/components/payments/ProcessorCard";
import { StripeConfig } from "@/components/StripeConfig";
import { WhopConfig } from "@/components/payments/WhopConfig";
import { FanbasisConfig } from "@/components/FanbasisConfig";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import whopLogo from "@/assets/integrations/whop-logo.png";
import { connectFanbasis } from "@/lib/integrations/fanbasis";

interface PaymentProcessor {
  id: string;
  name: string;
  description: string;
  gradient: string;
  logo: React.ReactNode;
  status: "available" | "coming_soon";
  logoStyle?: "default" | "branded";
}

// Stripe Logo SVG
const StripeLogo = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
  </svg>
);

// Whop Logo - official brand mark
const WhopLogo = () => (
  <img src={whopLogo} alt="Whop" className="w-8 h-8" />
);

// Fanbasis Logo placeholder
const FanbasisLogo = () => (
  <span className="text-lg font-bold">F</span>
);

const processors: PaymentProcessor[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Cards, subscriptions & invoices",
    gradient: "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700",
    logo: <StripeLogo />,
    status: "available",
  },
  {
    id: "whop",
    name: "Whop",
    description: "Memberships & digital products",
    gradient: "bg-[#FA4616]",
    logo: <WhopLogo />,
    status: "available",
    logoStyle: "branded",
  },
  {
    id: "fanbasis",
    name: "Fanbasis",
    description: "Creator subscriptions & tips",
    gradient: "bg-gradient-to-br from-pink-500 via-rose-500 to-red-500",
    logo: <FanbasisLogo />,
    status: "available",
  },
];

// Loading HTML for the popup placeholder
const POPUP_LOADING_HTML = (provider: string) => `
<!DOCTYPE html>
<html>
<head>
  <title>Connecting to ${provider}...</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
           display: flex; justify-content: center; align-items: center; 
           height: 100vh; margin: 0; background: #f8fafc; }
    .container { text-align: center; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; 
               border-top-color: #635BFF; border-radius: 50%; 
               animation: spin 1s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { color: #1e293b; margin: 0 0 8px; font-size: 18px; }
    p { color: #64748b; margin: 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>Connecting to ${provider}</h2>
    <p>Please wait...</p>
  </div>
</body>
</html>`;

export default function PaymentsPortal() {
  const { teamId } = useParams<{ teamId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stripeSheetOpen, setStripeSheetOpen] = useState(false);
  const [whopSheetOpen, setWhopSheetOpen] = useState(false);
  const [stripeConnecting, setStripeConnecting] = useState(false);
  const [whopConnecting, setWhopConnecting] = useState(false);
  const [fanbasisConnecting, setFanbasisConnecting] = useState(false);
  const [fanbasisSheetOpen, setFanbasisSheetOpen] = useState(false);

  // Refs for popup tracking
  const popupRef = useRef<Window | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const queryClient = useQueryClient();

  // Query Stripe connection status from secure view (tokens masked)
  const { data: stripeIntegration, refetch: refetchStripe } = useQuery({
    queryKey: ["stripe-integration", teamId],
    queryFn: async () => {
      if (!teamId) return null;
      const { data } = await supabase
        .from("team_integrations_public" as any)
        .select("is_connected, config_safe")
        .eq("team_id", teamId)
        .eq("integration_type", "stripe")
        .maybeSingle();
      return data as unknown as { is_connected: boolean; config_safe: Record<string, any> | null } | null;
    },
    enabled: !!teamId,
  });

  // Query Whop connection status from secure view (tokens masked)
  const { data: whopIntegration, refetch: refetchWhop } = useQuery({
    queryKey: ["whop-integration", teamId],
    queryFn: async () => {
      if (!teamId) return null;
      const { data } = await supabase
        .from("team_integrations_public" as any)
        .select("is_connected, config_safe")
        .eq("team_id", teamId)
        .eq("integration_type", "whop")
        .maybeSingle();
      return data as unknown as { is_connected: boolean; config_safe: Record<string, any> | null } | null;
    },
    enabled: !!teamId,
  });

  // Query Fanbasis connection status from secure view (tokens masked)
  const { data: fanbasisIntegration, refetch: refetchFanbasis } = useQuery({
    queryKey: ["fanbasis-integration", teamId],
    queryFn: async () => {
      if (!teamId) return null;
      const { data } = await supabase
        .from("team_integrations_public" as any)
        .select("is_connected, config_safe")
        .eq("team_id", teamId)
        .eq("integration_type", "fanbasis")
        .maybeSingle();
      return data as unknown as { is_connected: boolean; config_safe: Record<string, any> | null } | null;
    },
    enabled: !!teamId,
  });

  const isStripeConnected = stripeIntegration?.is_connected ?? false;
  const stripeConfig = stripeIntegration?.config_safe;
  const stripeAccountId = stripeConfig?.stripe_account_id;

  const isWhopConnected = whopIntegration?.is_connected ?? false;
  const whopConfig = whopIntegration?.config_safe;
  const whopCompanyId = whopConfig?.company_id || whopConfig?.company_name;

  const isFanbasisConnected = fanbasisIntegration?.is_connected ?? false;
  const fanbasisConfig = fanbasisIntegration?.config_safe;
  const fanbasisCreatorName = fanbasisConfig?.creator_name || fanbasisConfig?.creator_id;

  // Handle postMessage from OAuth popup (primary method)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === "stripe-oauth-success") {
        console.log("[PaymentsPortal] Received stripe-oauth-success message");
        await new Promise((resolve) => setTimeout(resolve, 500));
        await queryClient.invalidateQueries({ queryKey: ["stripe-integration", teamId] });
        await refetchStripe();
        toast.success("Stripe connected successfully!");
        setStripeConnecting(false);
      } else if (event.data?.type === "stripe-oauth-error") {
        console.log("[PaymentsPortal] Received stripe-oauth-error message:", event.data.error);
        toast.error(`Connection failed: ${event.data.error}`);
        setStripeConnecting(false);
      } else if (event.data?.type === "whop-oauth-success") {
        console.log("[PaymentsPortal] Received whop-oauth-success message");
        await new Promise((resolve) => setTimeout(resolve, 500));
        await queryClient.invalidateQueries({ queryKey: ["whop-integration", teamId] });
        await refetchWhop();
        toast.success("Whop connected successfully!");
        setWhopConnecting(false);
      } else if (event.data?.type === "whop-oauth-error") {
        console.log("[PaymentsPortal] Received whop-oauth-error message:", event.data.error);
        toast.error(`Connection failed: ${event.data.error}`);
        setWhopConnecting(false);
      } else if (event.data?.type === "fanbasis-oauth-success") {
        queryClient.invalidateQueries({ queryKey: ["fanbasis-integration", teamId] });
        refetchFanbasis();
        toast.success("Fanbasis connected successfully!");
        setFanbasisConnecting(false);
      } else if (event.data?.type === "fanbasis-oauth-error") {
        toast.error(`Connection failed: ${event.data?.error ?? "Unknown error"}`);
        setFanbasisConnecting(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [teamId, queryClient, refetchStripe, refetchWhop, refetchFanbasis]);

  // Handle OAuth redirect callback via URL params
  useEffect(() => {
    const stripeConnected = searchParams.get("stripe_connected");
    const stripeError = searchParams.get("stripe_error");
    const whopConnected = searchParams.get("whop_connected");
    const whopError = searchParams.get("whop_error");
    const fanbasisConnected = searchParams.get("fanbasis_connected");
    const fanbasisError = searchParams.get("fanbasis_error");

    if (stripeConnected === "success" || stripeError || whopConnected === "success" || whopError || fanbasisConnected === "success" || fanbasisError) {
      setSearchParams({}, { replace: true });

      if (stripeConnected === "success") {
        queryClient.invalidateQueries({ queryKey: ["stripe-integration", teamId] });
        refetchStripe();
        toast.success("Stripe connected successfully!");
        setStripeConnecting(false);
      } else if (stripeError) {
        toast.error(`Connection failed: ${stripeError}`);
        setStripeConnecting(false);
      }

      if (whopConnected === "success") {
        queryClient.invalidateQueries({ queryKey: ["whop-integration", teamId] });
        refetchWhop();
        toast.success("Whop connected successfully!");
        setWhopConnecting(false);
      } else if (whopError) {
        toast.error(`Connection failed: ${whopError}`);
        setWhopConnecting(false);
      }

      if (fanbasisConnected === "success") {
        queryClient.invalidateQueries({ queryKey: ["fanbasis-integration", teamId] });
        refetchFanbasis();
        toast.success("Fanbasis connected successfully!");
        setFanbasisConnecting(false);
      } else if (fanbasisError) {
        toast.error(`Connection failed: ${fanbasisError}`);
        setFanbasisConnecting(false);
      }
    }
  }, [searchParams, teamId, queryClient, refetchStripe, refetchWhop, refetchFanbasis]);

  // Cleanup popup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  const handleCancelConnect = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    try {
      popupRef.current?.close();
    } catch (e) {
      // Ignore cross-origin errors
    }
    popupRef.current = null;
    setStripeConnecting(false);
    setWhopConnecting(false);
    setFanbasisConnecting(false);
    toast.info("Connection cancelled");
  }, []);

  const openFanbasisOAuth = async () => {
    if (!teamId) return;

    setFanbasisConnecting(true);

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // Open popup FIRST (synchronously) to avoid popup blockers
    const popup = window.open(
      "about:blank",
      "fanbasis-oauth",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes`
    );

    if (!popup || popup.closed) {
      toast.error("Popup blocked. Please allow popups and try again.", {
        duration: 10000,
      });
      setFanbasisConnecting(false);
      return;
    }

    popupRef.current = popup;
    try {
      popup.document.write(POPUP_LOADING_HTML("Fanbasis"));
      popup.document.close();
    } catch (e) {
      // Ignore
    }

    try {
      const redirectUri = `${window.location.origin}/team/${teamId}/payments`;

      // Get the current session to ensure we're authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated. Please log in again.");
      }

      const { data, error } = await supabase.functions.invoke("fanbasis-oauth-start", {
        body: { teamId, redirectUri },
      });

      if (error) throw error;

      if (data?.authUrl) {
        popup.location.href = data.authUrl;

        pollTimerRef.current = window.setInterval(() => {
          try {
            if (popup.closed) {
              if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
              }
              popupRef.current = null;
              setFanbasisConnecting(false);
            }
          } catch (e) {
            // Cross-origin error
          }
        }, 500);
      } else {
        popup.close();
        popupRef.current = null;
        throw new Error("No auth URL returned");
      }
    } catch (error) {
      console.error("Fanbasis connect error:", error);
      toast.error("Failed to start Fanbasis connection");
      try {
        popup.close();
      } catch (e) {}
      popupRef.current = null;
      setFanbasisConnecting(false);
    }
  };

  const openOAuthPopup = async (provider: "stripe" | "whop") => {
    if (!teamId) return;

    const setConnecting = provider === "stripe" ? setStripeConnecting : setWhopConnecting;
    const functionName = provider === "stripe" ? "stripe-oauth-start" : "whop-oauth-start";
    const displayName = provider === "stripe" ? "Stripe" : "Whop";

    setConnecting(true);

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "about:blank",
      `${provider}-connect`,
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes`
    );

    if (!popup || popup.closed) {
      toast.error("Popup blocked. Please allow popups and try again.", {
        duration: 10000,
      });
      setConnecting(false);
      return;
    }

    popupRef.current = popup;
    try {
      popup.document.write(POPUP_LOADING_HTML(displayName));
      popup.document.close();
    } catch (e) {
      // Ignore
    }

    try {
      const redirectUri = `${window.location.origin}/team/${teamId}/payments`;

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { teamId, redirectUri },
      });

      if (error) throw error;

      if (data?.authUrl) {
        popup.location.href = data.authUrl;

        pollTimerRef.current = window.setInterval(() => {
          try {
            if (popup.closed) {
              if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
              }
              popupRef.current = null;
            }
          } catch (e) {
            // Cross-origin error
          }
        }, 500);
      } else {
        popup.close();
        popupRef.current = null;
        throw new Error("No auth URL returned");
      }
    } catch (error) {
      console.error(`${displayName} connect error:`, error);
      toast.error(`Failed to start ${displayName} connection`);
      try {
        popup.close();
      } catch (e) {}
      popupRef.current = null;
      setConnecting(false);
    }
  };

  const handleProcessorClick = (processor: PaymentProcessor) => {
    if (processor.status === "coming_soon") {
      toast.info(`${processor.name} integration coming soon!`);
      return;
    }

    if (processor.id === "stripe") {
      if (isStripeConnected) {
        setStripeSheetOpen(true);
      } else {
        openOAuthPopup("stripe");
      }
    } else if (processor.id === "whop") {
      if (isWhopConnected) {
        setWhopSheetOpen(true);
      } else {
        openOAuthPopup("whop");
      }
    } else if (processor.id === "fanbasis") {
      if (isFanbasisConnected) {
        setFanbasisSheetOpen(true);
      } else {
        openFanbasisOAuth();
      }
    }
  };

  const getProcessorStatus = (processor: PaymentProcessor): "connected" | "available" | "coming_soon" => {
    if (processor.id === "stripe" && isStripeConnected) return "connected";
    if (processor.id === "whop" && isWhopConnected) return "connected";
    if (processor.id === "fanbasis" && isFanbasisConnected) return "connected";
    return processor.status;
  };

  const getAccountInfo = (processor: PaymentProcessor): string | undefined => {
    if (processor.id === "stripe" && isStripeConnected) return stripeAccountId;
    if (processor.id === "whop" && isWhopConnected) return whopCompanyId;
    if (processor.id === "fanbasis" && isFanbasisConnected) return fanbasisCreatorName;
    return undefined;
  };

  const isProcessorConnecting = (processor: PaymentProcessor): boolean => {
    if (processor.id === "stripe") return stripeConnecting;
    if (processor.id === "whop") return whopConnecting;
    if (processor.id === "fanbasis") return fanbasisConnecting;
    return false;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payment Processors</h1>
        <p className="text-muted-foreground mt-1">
          Connect your payment accounts to trigger automations and track revenue
        </p>
      </div>

      {/* Processor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {processors.map((processor) => {
          const status = getProcessorStatus(processor);

          return (
            <ProcessorCard
              key={processor.id}
              name={processor.name}
              description={processor.description}
              logo={processor.logo}
              gradient={processor.gradient}
              status={status}
              isConnecting={isProcessorConnecting(processor)}
              onConnect={() => handleProcessorClick(processor)}
              onManage={() => handleProcessorClick(processor)}
              onCancel={handleCancelConnect}
              accountInfo={getAccountInfo(processor)}
              logoStyle={processor.logoStyle}
            />
          );
        })}
      </div>

      {/* Stripe Config Sheet */}
      <Sheet open={stripeSheetOpen} onOpenChange={setStripeSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Stripe Connection</SheetTitle>
          </SheetHeader>
          {teamId && (
            <StripeConfig
              teamId={teamId}
              onUpdate={() => {
                refetchStripe();
                setStripeSheetOpen(false);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Whop Config Sheet */}
      <Sheet open={whopSheetOpen} onOpenChange={setWhopSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Whop Connection</SheetTitle>
          </SheetHeader>
          {teamId && (
            <WhopConfig
              teamId={teamId}
              onUpdate={() => {
                refetchWhop();
                setWhopSheetOpen(false);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Fanbasis Config Sheet */}
      <Sheet open={fanbasisSheetOpen} onOpenChange={setFanbasisSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Fanbasis Connection</SheetTitle>
          </SheetHeader>
          {teamId && (
            <FanbasisConfig
              teamId={teamId}
              onUpdate={() => {
                refetchFanbasis();
                setFanbasisSheetOpen(false);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
