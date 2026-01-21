import { useState } from "react";
import { Wallet, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddFundsModal } from "./AddFundsModal";

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

interface WalletCardProps {
  teamId: string;
  billing: TeamBilling | null;
  onUpdate: () => void;
}

export function WalletCard({ teamId, billing, onUpdate }: WalletCardProps) {
  const [showAddFunds, setShowAddFunds] = useState(false);

  const balanceDollars = (billing?.wallet_balance_cents || 0) / 100;
  const hasPaymentMethod = !!billing?.stripe_payment_method_id;

  const getBalanceColor = () => {
    if (balanceDollars >= 20) return "text-green-500";
    if (balanceDollars >= 5) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Wallet Balance
          </CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <div className={`text-4xl font-bold ${getBalanceColor()}`}>
                ${balanceDollars.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {billing?.auto_recharge_enabled 
                  ? `Auto-recharge enabled at $${(billing.auto_recharge_threshold_cents / 100).toFixed(2)}`
                  : "Auto-recharge disabled"
                }
              </p>
            </div>
            <Button 
              onClick={() => setShowAddFunds(true)}
              disabled={!hasPaymentMethod}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Funds
            </Button>
          </div>
          {!hasPaymentMethod && (
            <p className="text-xs text-amber-500 mt-3">
              Add a payment method to deposit funds
            </p>
          )}
        </CardContent>
      </Card>

      <AddFundsModal
        open={showAddFunds}
        onOpenChange={setShowAddFunds}
        teamId={teamId}
        onSuccess={onUpdate}
      />
    </>
  );
}
