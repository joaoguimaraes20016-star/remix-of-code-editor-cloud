import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormatNumberConfig {
  input: string;
  format: string;
  currency: string;
  decimals: number;
  outputVariable: string;
}

interface FormatNumberFormProps {
  config: FormatNumberConfig;
  onChange: (config: FormatNumberConfig) => void;
}

export function FormatNumberForm({ config, onChange }: FormatNumberFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="input">Input Number</Label>
        <Input
          id="input"
          placeholder="e.g., {{deal.value}} or 1234.56"
          value={config.input || ""}
          onChange={(e) => onChange({ ...config, input: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Format</Label>
        <Select
          value={config.format || "decimal"}
          onValueChange={(v) => onChange({ ...config, format: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="decimal">Decimal (1,234.56)</SelectItem>
            <SelectItem value="currency">Currency ($1,234.56)</SelectItem>
            <SelectItem value="percent">Percent (12.34%)</SelectItem>
            <SelectItem value="compact">Compact (1.2K)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.format === "currency" && (
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            placeholder="USD"
            value={config.currency || "USD"}
            onChange={(e) => onChange({ ...config, currency: e.target.value })}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="decimals">Decimal Places</Label>
        <Input
          id="decimals"
          type="number"
          min={0}
          max={10}
          value={config.decimals ?? 2}
          onChange={(e) => onChange({ ...config, decimals: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="outputVariable">Save As Variable</Label>
        <Input
          id="outputVariable"
          placeholder="formattedNumber"
          value={config.outputVariable || "formattedNumber"}
          onChange={(e) => onChange({ ...config, outputVariable: e.target.value })}
        />
      </div>
    </div>
  );
}
