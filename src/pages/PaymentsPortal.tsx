import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { ProcessorCard } from "@/components/payments/ProcessorCard";
import { StripeConfig } from "@/components/StripeConfig";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface PaymentProcessor {
  id: string;
  name: string;
  description: string;
  gradient: string;
  logo: React.ReactNode;
  status: "available" | "coming_soon";
}

// Stripe Logo SVG
const StripeLogo = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
  </svg>
);

// Whop Logo placeholder
const WhopLogo = () => (
  <span className="text-lg font-bold">W</span>
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
    gradient: "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900",
    logo: <WhopLogo />,
    status: "coming_soon",
  },
  {
    id: "fanbasis",
    name: "Fanbasis",
    description: "Creator subscriptions & tips",
    gradient: "bg-gradient-to-br from-pink-500 via-rose-500 to-red-500",
    logo: <FanbasisLogo />,
    status: "coming_soon",
  },
];

// Loading HTML for the popup placeholder
const POPUP_LOADING_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Connecting to Stripe...</title>
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
    <h2>Connecting to Stripe</h2>
    <p>Please wait...</p>
  </div>
</body>
</html>`;

export default function PaymentsPortal() {
  const { teamId } = useParams<{ teamId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stripeSheetOpen, setStripeSheetOpen] = useState(false);
  const [stripeConnecting, setStripeConnecting] = useState(false);

  // Refs for popup tracking
  const popupRef = useRef<Window | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  // Query Stripe connection status
  const { data: stripeIntegration, refetch: refetchStripe } = useQuery({
    queryKey: ["stripe-integration", teamId],
    queryFn: async () => {
      if (!teamId) return null;
      const { data } = await supabase
        .from("team_integrations")
        .select("*")
        .eq("team_id", teamId)
        .eq("integration_type", "stripe")
        .maybeSingle();
      return data;
    },
    enabled: !!teamId,
  });

  const isStripeConnected = stripeIntegration?.is_connected;
  const stripeConfig = stripeIntegration?.config as Record<string, any> | null;
  const stripeAccountId = stripeConfig?.stripe_account_id;

  const queryClient = useQueryClient();

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
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [teamId, queryClient, refetchStripe]);

  // Fallback: Handle OAuth redirect callback via URL params
  useEffect(() => {
    const stripeConnected = searchParams.get("stripe_connected");
    const stripeError = searchParams.get("stripe_error");

    if (stripeConnected === "success" || stripeError) {
      setSearchParams({}, { replace: true });

      if (stripeConnected === "success") {
        queryClient.invalidateQueries({ queryKey: ["stripe-integration", teamId] });
        refetchStripe();
        toast.success("Stripe connected successfully!");
      } else if (stripeError) {
        toast.error(`Connection failed: ${stripeError}`);
      }
      setStripeConnecting(false);
    }
  }, [searchParams]);

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
    toast.info("Connection cancelled");
  }, []);

  const handleStripeConnect = async () => {
    if (!teamId) return;

    setStripeConnecting(true);

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "about:blank",
      "stripe-connect",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes`
    );

    if (!popup || popup.closed) {
      toast.error("Popup blocked. Please allow popups or use the button below.", {
        action: {
          label: "Open in new tab",
          onClick: () => handleStripeConnectNewTab(),
        },
        duration: 10000,
      });
      setStripeConnecting(false);
      return;
    }

    popupRef.current = popup;
    try {
      popup.document.write(POPUP_LOADING_HTML);
      popup.document.close();
    } catch (e) {
      // Ignore
    }

    try {
      const redirectUri = `${window.location.origin}/team/${teamId}/payments`;

      const { data, error } = await supabase.functions.invoke("stripe-oauth-start", {
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
      console.error("Stripe connect error:", error);
      toast.error("Failed to start Stripe connection");
      try {
        popup.close();
      } catch (e) {}
      popupRef.current = null;
      setStripeConnecting(false);
    }
  };

  const handleStripeConnectNewTab = async () => {
    if (!teamId) return;

    setStripeConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/team/${teamId}/payments`;

      const { data, error } = await supabase.functions.invoke("stripe-oauth-start", {
        body: { teamId, redirectUri },
      });

      if (error) throw error;

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Stripe connect error:", error);
      toast.error("Failed to start Stripe connection");
      setStripeConnecting(false);
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
        handleStripeConnect();
      }
    }
  };

  const getProcessorStatus = (processor: PaymentProcessor): "connected" | "available" | "coming_soon" => {
    if (processor.id === "stripe" && isStripeConnected) {
      return "connected";
    }
    return processor.status;
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
              isConnecting={stripeConnecting && processor.id === "stripe"}
              onConnect={() => handleProcessorClick(processor)}
              onManage={() => handleProcessorClick(processor)}
              onCancel={handleCancelConnect}
              accountInfo={processor.id === "stripe" && isStripeConnected ? stripeAccountId : undefined}
            />
          );
        })}
      </div>

      {/* Stripe Config Sheet */}
      <Sheet open={stripeSheetOpen} onOpenChange={setStripeSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Stripe Integration</SheetTitle>
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
    </div>
  );
}
