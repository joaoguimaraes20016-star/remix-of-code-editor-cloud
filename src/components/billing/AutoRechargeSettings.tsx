import { useState, useEffect } from "react";
import { RefreshCw, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

interface AutoRechargeSettingsProps {
  teamId: string;
  billing: TeamBilling | null;
  onUpdate: () => void;
}

export function AutoRechargeSettings({ teamId, billing, onUpdate }: AutoRechargeSettingsProps) {
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState("5");
  const [amount, setAmount] = useState("20");
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const hasPaymentMethod = !!billing?.stripe_payment_method_id;

  useEffect(() => {
    if (billing) {
      setEnabled(billing.auto_recharge_enabled);
      setThreshold((billing.auto_recharge_threshold_cents / 100).toString());
      setAmount((billing.auto_recharge_amount_cents / 100).toString());
      setHasChanges(false);
    }
  }, [billing]);

  const handleChange = () => {
    setHasChanges(true);
  };

  const handleSave = async () => {
    const thresholdCents = Math.round(parseFloat(threshold) * 100);
    const amountCents = Math.round(parseFloat(amount) * 100);

    if (enabled) {
      if (thresholdCents < 100) {
        toast.error("Threshold must be at least $1.00");
        return;
      }
      if (amountCents < 500) {
        toast.error("Recharge amount must be at least $5.00");
        return;
      }
    }

    setIsLoading(true);
    try {
      const { error: upsertError } = await supabase
        .from("team_billing")
        .upsert({
          team_id: teamId,
          auto_recharge_enabled: enabled,
          auto_recharge_threshold_cents: thresholdCents,
          auto_recharge_amount_cents: amountCents,
        }, { onConflict: "team_id" });

      if (upsertError) throw upsertError;

      toast.success("Auto-recharge settings saved");
      setHasChanges(false);
      onUpdate();
    } catch (error) {
      console.error("Save settings error:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-lg">
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-white/80" />
            <span className="text-sm font-medium text-white/80">Auto-Recharge</span>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) => {
              setEnabled(checked);
              handleChange();
            }}
            disabled={!hasPaymentMethod}
            className="data-[state=checked]:bg-white/30"
          />
        </div>
        
        {!hasPaymentMethod ? (
          <p className="text-sm text-white/60">
            Add a payment method to enable auto-recharge
          </p>
        ) : enabled ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">When below</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 text-sm">$</span>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={threshold}
                    onChange={(e) => {
                      setThreshold(e.target.value);
                      handleChange();
                    }}
                    className="pl-7 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Add amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 text-sm">$</span>
                  <Input
                    type="number"
                    min="5"
                    step="5"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      handleChange();
                    }}
                    className="pl-7 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
              </div>
            </div>
            
            {hasChanges && (
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-white/70">
            Never run out of funds during campaigns
          </p>
        )}
      </div>
    </div>
  );
}
