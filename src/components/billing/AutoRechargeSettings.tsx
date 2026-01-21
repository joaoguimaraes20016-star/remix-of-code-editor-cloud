import { useState, useEffect } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      // Ensure billing record exists
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Auto-Recharge</CardTitle>
        </div>
        <CardDescription>
          Automatically add funds when your balance drops below a threshold
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-recharge">Enable Auto-Recharge</Label>
            <p className="text-sm text-muted-foreground">
              Never run out of funds during campaigns
            </p>
          </div>
          <Switch
            id="auto-recharge"
            checked={enabled}
            onCheckedChange={(checked) => {
              setEnabled(checked);
              handleChange();
            }}
            disabled={!hasPaymentMethod}
          />
        </div>

        {!hasPaymentMethod && (
          <p className="text-sm text-amber-500">
            Add a payment method to enable auto-recharge
          </p>
        )}

        {enabled && hasPaymentMethod && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="threshold">When balance drops below</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="threshold"
                  type="number"
                  min="1"
                  step="1"
                  value={threshold}
                  onChange={(e) => {
                    setThreshold(e.target.value);
                    handleChange();
                  }}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Add this amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  min="5"
                  step="5"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    handleChange();
                  }}
                  className="pl-7"
                />
              </div>
            </div>
          </div>
        )}

        {hasChanges && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
