import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface CancelSubscriptionConfig {
  subscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
}

interface CancelSubscriptionFormProps {
  config: CancelSubscriptionConfig;
  onChange: (config: CancelSubscriptionConfig) => void;
}

export function CancelSubscriptionForm({ config, onChange }: CancelSubscriptionFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subscriptionId">Subscription ID</Label>
        <Input
          id="subscriptionId"
          placeholder="sub_1234... or {{lead.subscription_id}}"
          value={config.subscriptionId || ""}
          onChange={(e) => onChange({ ...config, subscriptionId: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Stripe subscription ID. Supports {"{{variables}}"}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 p-3">
        <div>
          <Label htmlFor="period-end-toggle" className="cursor-pointer">Cancel at Period End</Label>
          <p className="text-xs text-muted-foreground">
            {config.cancelAtPeriodEnd !== false
              ? "Contact retains access until the end of their current billing period"
              : "Subscription will be cancelled and access removed immediately"}
          </p>
        </div>
        <Switch
          id="period-end-toggle"
          checked={config.cancelAtPeriodEnd !== false}
          onCheckedChange={(checked) => onChange({ ...config, cancelAtPeriodEnd: checked })}
        />
      </div>
    </div>
  );
}
