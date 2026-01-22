import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, ExternalLink, Check, Clock } from "lucide-react";
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

export default function PaymentsPortal() {
  const { teamId } = useParams<{ teamId: string }>();
  const [stripeDialogOpen, setStripeDialogOpen] = useState(false);
  const [stripeConnecting, setStripeConnecting] = useState(false);

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

  // Listen for OAuth completion messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'STRIPE_CONNECTED') {
        if (event.data.success) {
          toast.success("Stripe connected successfully!");
          refetchStripe();
        } else {
          toast.error(event.data.error || "Failed to connect Stripe");
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refetchStripe]);

  // Check if returning from OAuth redirect (not popup)
  useEffect(() => {
    const pendingTeamId = sessionStorage.getItem('stripe_oauth_pending');
    if (pendingTeamId && pendingTeamId === teamId) {
      sessionStorage.removeItem('stripe_oauth_pending');
      refetchStripe().then(() => {
        toast.info("Checking Stripe connection status...");
      });
    }
  }, [teamId, refetchStripe]);

  const handleStripeConnect = async () => {
    if (!teamId) return;
    
    setStripeConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/team/${teamId}/payments`;
      
      const { data, error } = await supabase.functions.invoke("stripe-oauth-start", {
        body: { teamId, redirectUri },
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Store pending state for when we return
        sessionStorage.setItem('stripe_oauth_pending', teamId);
        
        // Calculate centered popup position
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        // Open popup with proper features
        const popup = window.open(
          data.authUrl,
          'stripe-connect',
          `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes`
        );
        
        // Immediately check if popup was blocked
        if (!popup || popup.closed) {
          // Popup was blocked - try opening via window.top to escape iframe
          toast.info("Opening Stripe in a new tab...");
          if (window.top) {
            window.top.location.href = data.authUrl;
          } else {
            window.open(data.authUrl, '_blank');
          }
          setStripeConnecting(false);
          return;
        }
        
        // Popup opened successfully - poll for close
        const pollTimer = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(pollTimer);
              setStripeConnecting(false);
              sessionStorage.removeItem('stripe_oauth_pending');
              refetchStripe();
              toast.success("Checking connection status...");
            }
          } catch (e) {
            // Cross-origin error means popup is still open on Stripe domain
          }
        }, 500);
        
        // Failsafe: stop polling after 10 minutes
        setTimeout(() => {
          clearInterval(pollTimer);
          setStripeConnecting(false);
        }, 10 * 60 * 1000);
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
