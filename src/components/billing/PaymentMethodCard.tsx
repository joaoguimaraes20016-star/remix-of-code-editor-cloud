import React, { useState } from "react";
import { CreditCard, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddCardModal } from "./AddCardModal";

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

export const PaymentMethodCard = React.forwardRef<HTMLDivElement, PaymentMethodCardProps>(
  function PaymentMethodCard({ teamId, billing, onUpdate }, ref) {
    const [showAddCardModal, setShowAddCardModal] = useState(false);

    const hasPaymentMethod = !!billing?.stripe_payment_method_id;

    const formatCardBrand = (brand: string | null) => {
      if (!brand) return "Card";
      return brand.charAt(0).toUpperCase() + brand.slice(1);
    };

    const handleSuccess = () => {
      onUpdate();
    };

    if (hasPaymentMethod) {
      return (
        <>
          <div ref={ref} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-6 text-white shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            {/* Glossy glass overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            
            {/* Background decoration */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/15 backdrop-blur-sm" />
            <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/10" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white/90 drop-shadow-sm">Payment Method</span>
                <div className="p-2 rounded-lg bg-white/25 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                  <CreditCard className="h-5 w-5 text-white drop-shadow-sm" />
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-2xl font-bold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                  {formatCardBrand(billing.payment_method_brand)}
                </div>
                <p className="text-lg text-white/90 font-mono mt-1 drop-shadow-sm">
                  •••• •••• •••• {billing.payment_method_last4}
                </p>
              </div>
              
              <Button 
                onClick={() => setShowAddCardModal(true)}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Update Card
              </Button>
            </div>
          </div>

          <AddCardModal
            open={showAddCardModal}
            onOpenChange={setShowAddCardModal}
            teamId={teamId}
            onSuccess={handleSuccess}
          />
        </>
      );
    }

    return (
      <>
        <div ref={ref} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-6 text-white shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-slate-600">
          {/* Glossy glass overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          
          {/* Background decoration */}
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 backdrop-blur-sm" />
          <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-white/70 drop-shadow-sm">Payment Method</span>
              <div className="p-2 rounded-lg bg-white/15 backdrop-blur-sm">
                <CreditCard className="h-5 w-5 text-white/60" />
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-xl font-medium text-white/80">
                No card on file
              </div>
              <p className="text-sm text-white/50 mt-1">
                Add a card to deposit funds
              </p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => setShowAddCardModal(true)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Card
              </Button>
              <Button
                onClick={onUpdate}
                variant="ghost"
                size="sm"
                className="w-full text-white/60 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh Status
              </Button>
            </div>
          </div>
        </div>

        <AddCardModal
          open={showAddCardModal}
          onOpenChange={setShowAddCardModal}
          teamId={teamId}
          onSuccess={handleSuccess}
        />
      </>
    );
  }
);
