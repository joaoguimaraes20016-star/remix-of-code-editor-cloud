import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SendInvoiceConfig {
  customerEmail?: string;
  amount: number;
  description?: string;
  daysUntilDue?: number;
  currency?: string;
}

interface SendInvoiceFormProps {
  config: SendInvoiceConfig;
  onChange: (config: SendInvoiceConfig) => void;
}

export function SendInvoiceForm({ config, onChange }: SendInvoiceFormProps) {
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
              <SelectItem value="AUD">AUD</SelectItem>
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
          placeholder="e.g., Consultation Fee, Monthly Service"
          value={config.description || ""}
          onChange={(e) => onChange({ ...config, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Due In</Label>
        <Select
          value={String(config.daysUntilDue || 7)}
          onValueChange={(value) => onChange({ ...config, daysUntilDue: Number(value) })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Due Immediately</SelectItem>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="60">60 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
