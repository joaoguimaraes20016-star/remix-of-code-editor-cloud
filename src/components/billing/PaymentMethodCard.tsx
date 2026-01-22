import { useState } from "react";
import { CreditCard, Plus, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TeamBilling {
  id: string;
  team_id: string;
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;
  wallet_balance_cents: number;
  auto_recharge_enabled: boolean;
  auto_recharge_threshold_cents: number;
  auto_recharge_amount_cents: number;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

interface PaymentMethodCardProps {
  teamId: string;
  billing: TeamBilling | null;
  onUpdate: () => void;
}

export function PaymentMethodCard({ teamId, billing, onUpdate }: PaymentMethodCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const hasPaymentMethod = !!billing?.stripe_payment_method_id;

  const handleSetupBilling = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to continue");
        setIsLoading(false);
        return;
      }

      const response = await supabase.functions.invoke("setup-billing", {
        body: {
          teamId,
          returnUrl: window.location.href,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to setup billing");
      }

      const checkoutUrl = response.data?.checkoutUrl;
      if (checkoutUrl) {
        console.log("[Billing] Redirecting to Stripe:", checkoutUrl);
        // Use window.open as primary method for better reliability
        const newWindow = window.open(checkoutUrl, "_blank");
        if (!newWindow) {
          // Fallback to direct redirect if popup blocked
          window.location.href = checkoutUrl;
        }
        setIsLoading(false);
        return;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Setup billing error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to setup billing");
      setIsLoading(false);
    }
  };

  const formatCardBrand = (brand: string | null) => {
    if (!brand) return "Card";
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  if (hasPaymentMethod) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-6 text-white shadow-lg">
        {/* Background decoration */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-white/80">Payment Method</span>
            <CreditCard className="h-5 w-5 text-white/60" />
          </div>
          
          <div className="mb-4">
            <div className="text-2xl font-bold tracking-tight">
              {formatCardBrand(billing.payment_method_brand)}
            </div>
            <p className="text-lg text-white/90 font-mono mt-1">
              •••• •••• •••• {billing.payment_method_last4}
            </p>
          </div>
          
          <Button 
            onClick={handleSetupBilling}
            disabled={isLoading}
            className="w-full bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Update Card
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-6 text-white shadow-lg border border-slate-600">
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5" />
      <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-white/60">Payment Method</span>
          <CreditCard className="h-5 w-5 text-white/40" />
        </div>
        
        <div className="mb-4">
          <div className="text-xl font-medium text-white/80">
            No card on file
          </div>
          <p className="text-sm text-white/50 mt-1">
            Add a card to deposit funds
          </p>
        </div>
        
        <Button 
          onClick={handleSetupBilling}
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white border-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Add Card
        </Button>
      </div>
    </div>
  );
}
