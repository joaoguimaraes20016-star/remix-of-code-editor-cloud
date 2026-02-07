import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface CreateSubscriptionConfig {
  customerEmail?: string;
  priceId?: string;
  trialDays?: number;
}

interface CreateSubscriptionFormProps {
  config: CreateSubscriptionConfig;
  onChange: (config: CreateSubscriptionConfig) => void;
}

export function CreateSubscriptionForm({ config, onChange }: CreateSubscriptionFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customerEmail">Customer Email</Label>
        <Input
          id="customerEmail"
          placeholder="{{lead.email}}"
          value={config.customerEmail || ""}
          onChange={(e) => onChange({ ...config, customerEmail: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Leave blank to use the contact's email. Supports {"{{variables}}"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priceId">Stripe Price ID</Label>
        <Input
          id="priceId"
          placeholder="price_1234..."
          value={config.priceId || ""}
          onChange={(e) => onChange({ ...config, priceId: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Find this in your Stripe Dashboard under Products &rarr; Prices
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="trialDays">Trial Period (days)</Label>
        <Input
          id="trialDays"
          type="number"
          placeholder="0 (no trial)"
          value={config.trialDays || ""}
          onChange={(e) => onChange({ ...config, trialDays: Number(e.target.value) || undefined })}
        />
        <p className="text-xs text-muted-foreground">Set to 0 or leave blank for no trial</p>
      </div>
    </div>
  );
}
