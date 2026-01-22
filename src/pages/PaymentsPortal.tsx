import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, ExternalLink, Check, Clock, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { StripeConfig } from "@/components/StripeConfig";

interface PaymentProcessor {
  id: string;
  name: string;
  description: string;
  logo: string;
  status: "available" | "coming_soon";
}

const processors: PaymentProcessor[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept cards, subscriptions & invoices",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg",
    status: "available",
  },
  {
    id: "whop",
    name: "Whop",
    description: "Membership payments & digital products",
    logo: "https://assets.whop.com/images/logo/whop-logo-white.svg",
    status: "coming_soon",
  },
  {
    id: "fanbasis",
    name: "Fanbasis",
    description: "Creator subscriptions & tips",
    logo: "https://fanbasis.com/favicon.ico",
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
  const [stripeDialogOpen, setStripeDialogOpen] = useState(false);
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

  // Handle OAuth redirect callback (query params from Edge Function redirect)
  useEffect(() => {
    const stripeConnected = searchParams.get("stripe_connected");
    const stripeError = searchParams.get("stripe_error");
    const accountId = searchParams.get("account_id");

    if (stripeConnected === "success") {
      toast.success("Stripe connected successfully!");
      refetchStripe();
      // Clean URL params
      setSearchParams({}, { replace: true });
      setStripeConnecting(false);
    } else if (stripeError) {
      toast.error(`Connection failed: ${stripeError}`);
      // Clean URL params
      setSearchParams({}, { replace: true });
      setStripeConnecting(false);
    }
  }, [searchParams, setSearchParams, refetchStripe]);

  // Cleanup popup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  // Cancel the OAuth flow
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
    
    // Calculate centered popup position
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    // CRITICAL: Open popup SYNCHRONOUSLY before any await to avoid popup blockers
    const popup = window.open(
      'about:blank',
      'stripe-connect',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes`
    );
    
    // Check if popup was blocked
    if (!popup || popup.closed) {
      toast.error("Popup blocked. Please allow popups or use the button below.", {
        action: {
          label: "Open in new tab",
          onClick: () => handleStripeConnectNewTab()
        },
        duration: 10000,
      });
      setStripeConnecting(false);
      return;
    }
    
    // Store popup ref and write loading HTML
    popupRef.current = popup;
    try {
      popup.document.write(POPUP_LOADING_HTML);
      popup.document.close();
    } catch (e) {
      // Ignore if we can't write (shouldn't happen with about:blank)
    }
    
    try {
      const redirectUri = `${window.location.origin}/team/${teamId}/payments`;
      
      const { data, error } = await supabase.functions.invoke("stripe-oauth-start", {
        body: { teamId, redirectUri },
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Navigate the already-open popup to Stripe
        popup.location.href = data.authUrl;
        
        // Poll for popup close - the redirect will happen automatically
        pollTimerRef.current = window.setInterval(() => {
          try {
            if (popup.closed) {
              if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
              }
              popupRef.current = null;
              // The page will be redirected back with query params
              // so we don't need to do anything else here
            }
          } catch (e) {
            // Cross-origin error means popup is still open on Stripe domain
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
  
  // Fallback: open in new tab (for when popups are blocked)
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
        // Open in same window since it will redirect back
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
        setStripeDialogOpen(true);
      } else {
        handleStripeConnect();
      }
    }
  };

  const getProcessorStatus = (processor: PaymentProcessor) => {
    if (processor.id === "stripe" && isStripeConnected) {
      return "connected";
    }
    return processor.status;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Connect Payments</h1>
        <p className="text-muted-foreground mt-1">
          Link your payment processors to trigger automations and track revenue
        </p>
      </div>

      {/* Info box explaining Stripe Connect */}
      {!isStripeConnected && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <h4 className="font-medium text-foreground">Why Connect Your Stripe?</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Link your existing Stripe account to unlock powerful features:
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            <li>• Create payment links and send invoices directly</li>
            <li>• Track revenue and subscriptions in real-time</li>
            <li>• Trigger automations when customers pay</li>
            <li>• Charge saved cards and manage subscriptions</li>
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {processors.map((processor) => {
          const status = getProcessorStatus(processor);
          
          return (
            <Card
              key={processor.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                status === "coming_soon" ? "opacity-60" : ""
              }`}
              onClick={() => handleProcessorClick(processor)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {processor.logo ? (
                        <img
                          src={processor.logo}
                          alt={processor.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <CreditCard className={`h-5 w-5 text-muted-foreground ${processor.logo ? "hidden" : ""}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{processor.name}</h3>
                      <p className="text-sm text-muted-foreground">{processor.description}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {status === "connected" ? (
                    <div className="flex items-center gap-1.5 text-sm text-green-600">
                      <Check className="h-4 w-4" />
                      <span>Connected</span>
                    </div>
                  ) : status === "coming_soon" ? (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Coming Soon</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={stripeConnecting && processor.id === "stripe"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProcessorClick(processor);
                      }}
                    >
                      {stripeConnecting && processor.id === "stripe" ? (
                        "Connecting..."
                      ) : (
                        <>
                          Connect <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  )}
                  
                  {/* Cancel button when connecting */}
                  {stripeConnecting && processor.id === "stripe" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelConnect();
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}

                  {status === "connected" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProcessorClick(processor);
                      }}
                    >
                      Manage
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stripe Config Dialog */}
      <Dialog open={stripeDialogOpen} onOpenChange={setStripeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Stripe Configuration</DialogTitle>
          </DialogHeader>
          {teamId && (
            <StripeConfig
              teamId={teamId}
              onUpdate={() => {
                refetchStripe();
                setStripeDialogOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
