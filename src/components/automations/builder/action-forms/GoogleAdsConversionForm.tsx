import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TemplateVariablePicker } from "../TemplateVariablePicker";
import { useRef } from "react";

interface GoogleAdsConversionConfig {
  conversion_action: string;
  gclid?: string;
  conversion_value?: number;
  currency_code?: string;
}

interface GoogleAdsConversionFormProps {
  config: GoogleAdsConversionConfig;
  onChange: (config: GoogleAdsConversionConfig) => void;
}

export function GoogleAdsConversionForm({ config, onChange }: GoogleAdsConversionFormProps) {
  const gclidRef = useRef<HTMLInputElement>(null);

  const handleInsertVariable = (variable: string) => {
    const input = gclidRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentValue = config.gclid || "";
    const newValue =
      currentValue.substring(0, start) +
      `{{${variable}}}` +
      currentValue.substring(end);

    onChange({ ...config, gclid: newValue });

    setTimeout(() => {
      input.focus();
      const newPos = start + variable.length + 4;
      input.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Conversion Action */}
      <div className="space-y-2">
        <Label>Conversion Action</Label>
        <Input
          placeholder="customers/1234567890/conversionActions/9876543210"
          value={config.conversion_action || ""}
          onChange={(e) => onChange({ ...config, conversion_action: e.target.value })}
        />
        <p className="text-xs text-white/40">
          The full resource name of the conversion action from Google Ads
        </p>
      </div>

      {/* GCLID */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Google Click ID (GCLID)</Label>
          <TemplateVariablePicker onInsert={handleInsertVariable} />
        </div>
        <Input
          ref={gclidRef}
          placeholder="{{lead.gclid}} or paste a specific GCLID"
          value={config.gclid || ""}
          onChange={(e) => onChange({ ...config, gclid: e.target.value })}
        />
        <p className="text-xs text-white/40">
          The click identifier from the original Google Ads click. Use template variables to pull from contact data.
        </p>
      </div>

      {/* Conversion Value */}
      <div className="space-y-2">
        <Label>Conversion Value (optional)</Label>
        <Input
          type="number"
          placeholder="99.99"
          value={config.conversion_value ?? ""}
          onChange={(e) =>
            onChange({
              ...config,
              conversion_value: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
        />
        <p className="text-xs text-white/40">
          The monetary value of this conversion
        </p>
      </div>

      {/* Currency Code */}
      {config.conversion_value !== undefined && (
        <div className="space-y-2">
          <Label>Currency Code</Label>
          <Input
            placeholder="USD"
            value={config.currency_code || "USD"}
            onChange={(e) => onChange({ ...config, currency_code: e.target.value })}
          />
          <p className="text-xs text-white/40">
            ISO 4217 currency code (e.g., USD, EUR, GBP)
          </p>
        </div>
      )}
    </div>
  );
}
