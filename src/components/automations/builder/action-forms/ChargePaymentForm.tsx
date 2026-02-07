import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ChargePaymentConfig {
  customerEmail?: string;
  amount?: number;
  currency?: string;
  description?: string;
  paymentMethod?: "card_on_file" | "prompt";
  sendReceipt?: boolean;
}

interface ChargePaymentFormProps {
  config: ChargePaymentConfig;
  onChange: (config: ChargePaymentConfig) => void;
}

export function ChargePaymentForm({ config, onChange }: ChargePaymentFormProps) {
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
        <Label htmlFor="amount">Amount</Label>
        <div className="flex gap-2">
          <Select
            value={config.currency || "USD"}
            onValueChange={(value) => onChange({ ...config, currency: value })}
          >
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="CAD">CAD</SelectItem>
            </SelectContent>
          </Select>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={config.amount || ""}
            onChange={(e) => onChange({ ...config, amount: Number(e.target.value) })}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="What is this charge for?"
          value={config.description || ""}
          onChange={(e) => onChange({ ...config, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Payment Method</Label>
        <Select
          value={config.paymentMethod || "card_on_file"}
          onValueChange={(value: "card_on_file" | "prompt") => onChange({ ...config, paymentMethod: value })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="card_on_file">Card on File</SelectItem>
            <SelectItem value="prompt">Send Payment Link</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {config.paymentMethod === "prompt"
            ? "A payment link will be sent to the contact"
            : "Charge the card already on file for this contact"}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 p-3">
        <div>
          <Label htmlFor="receipt-toggle" className="cursor-pointer">Send Receipt</Label>
          <p className="text-xs text-muted-foreground">Email a receipt after successful charge</p>
        </div>
        <Switch
          id="receipt-toggle"
          checked={config.sendReceipt !== false}
          onCheckedChange={(checked) => onChange({ ...config, sendReceipt: checked })}
        />
      </div>
    </div>
  );
}
