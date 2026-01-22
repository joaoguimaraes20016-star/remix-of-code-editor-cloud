import React, { useState } from "react";
import { Wallet, Plus } from "lucide-react";
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

export const WalletCard = React.forwardRef<HTMLDivElement, WalletCardProps>(
  function WalletCard({ teamId, billing, onUpdate }, ref) {
    const [showAddFunds, setShowAddFunds] = useState(false);

    const balanceDollars = (billing?.wallet_balance_cents || 0) / 100;
    const hasPaymentMethod = !!billing?.stripe_payment_method_id;

    return (
      <>
        <div ref={ref} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white shadow-lg">
          {/* Background decoration */}
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-white/80">Wallet Balance</span>
              <Wallet className="h-5 w-5 text-white/60" />
            </div>
            
            <div className="mb-4">
              <div className="text-4xl font-bold tracking-tight">
                ${balanceDollars.toFixed(2)}
              </div>
              <p className="text-sm text-white/70 mt-1">
                {billing?.auto_recharge_enabled 
                  ? `Auto-recharge at $${(billing.auto_recharge_threshold_cents / 100).toFixed(2)}`
                  : "Auto-recharge disabled"
                }
              </p>
            </div>
            
            <Button 
              onClick={() => setShowAddFunds(true)}
              disabled={!hasPaymentMethod}
              className="w-full bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Funds
            </Button>
            
            {!hasPaymentMethod && (
              <p className="text-xs text-white/60 mt-3 text-center">
                Add a payment method first
              </p>
            )}
          </div>
        </div>

        <AddFundsModal
          open={showAddFunds}
          onOpenChange={setShowAddFunds}
          teamId={teamId}
          onSuccess={onUpdate}
        />
      </>
    );
  }
);
