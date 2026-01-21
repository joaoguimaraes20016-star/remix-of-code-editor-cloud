import { useState } from "react";
import { CreditCard, Plus, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

      if (response.data?.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Setup billing error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to setup billing");
    } finally {
      setIsLoading(false);
    }
  };

  const getCardBrandIcon = (brand: string | null) => {
    // Could be expanded with actual card brand icons
    return brand?.charAt(0).toUpperCase() + brand?.slice(1) || "Card";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Payment Method
        </CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {hasPaymentMethod ? (
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-foreground">
                  {getCardBrandIcon(billing.payment_method_brand)}
                </div>
                <div className="text-lg text-muted-foreground">
                  •••• {billing.payment_method_last4}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Card on file
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={handleSetupBilling}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Update Card
            </Button>
          </div>
        ) : (
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xl font-medium text-muted-foreground">
                No card on file
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Add a card to deposit funds and enable auto-recharge
              </p>
            </div>
            <Button 
              onClick={handleSetupBilling}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Card
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
