import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIKTOK_EVENT_TYPES = [
  { value: "CompletePayment", label: "Complete Payment" },
  { value: "SubmitForm", label: "Submit Form" },
  { value: "Contact", label: "Contact" },
  { value: "Subscribe", label: "Subscribe" },
  { value: "CompleteRegistration", label: "Complete Registration" },
  { value: "PlaceAnOrder", label: "Place an Order" },
  { value: "AddToCart", label: "Add to Cart" },
  { value: "ViewContent", label: "View Content" },
  { value: "InitiateCheckout", label: "Initiate Checkout" },
  { value: "AddPaymentInfo", label: "Add Payment Info" },
  { value: "Download", label: "Download" },
  { value: "Search", label: "Search" },
  { value: "ClickButton", label: "Click Button" },
] as const;

interface TikTokEventConfig {
  event_type: string;
  pixel_code: string;
  properties?: Record<string, any>;
}

interface TikTokEventFormProps {
  config: TikTokEventConfig;
  onChange: (config: TikTokEventConfig) => void;
}

export function TikTokEventForm({ config, onChange }: TikTokEventFormProps) {
  return (
    <div className="space-y-4">
      {/* Event Type */}
      <div className="space-y-2">
        <Label>Event Type</Label>
        <Select
          value={config.event_type || ""}
          onValueChange={(value) => onChange({ ...config, event_type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select event type..." />
          </SelectTrigger>
          <SelectContent>
            {TIKTOK_EVENT_TYPES.map((event) => (
              <SelectItem key={event.value} value={event.value}>
                {event.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-white/40">
          The conversion event type to send to TikTok
        </p>
      </div>

      {/* Pixel Code */}
      <div className="space-y-2">
        <Label>Pixel Code</Label>
        <Input
          placeholder="ABCDEFGHIJ1234567890"
          value={config.pixel_code || ""}
          onChange={(e) => onChange({ ...config, pixel_code: e.target.value })}
        />
        <p className="text-xs text-white/40">
          Your TikTok pixel ID (found in TikTok Ads Manager &gt; Events)
        </p>
      </div>

      {/* Conversion Value (optional) */}
      <div className="space-y-2">
        <Label>Conversion Value (optional)</Label>
        <Input
          type="number"
          placeholder="0.00"
          value={config.properties?.value ?? ""}
          onChange={(e) =>
            onChange({
              ...config,
              properties: {
                ...config.properties,
                value: e.target.value ? parseFloat(e.target.value) : undefined,
                currency: config.properties?.currency || "USD",
              },
            })
          }
        />
        <p className="text-xs text-white/40">
          Optional monetary value of the conversion event
        </p>
      </div>

      {/* Currency (shown if value is set) */}
      {config.properties?.value !== undefined && (
        <div className="space-y-2">
          <Label>Currency</Label>
          <Input
            placeholder="USD"
            value={config.properties?.currency || "USD"}
            onChange={(e) =>
              onChange({
                ...config,
                properties: {
                  ...config.properties,
                  currency: e.target.value,
                },
              })
            }
          />
        </div>
      )}

      {/* Content ID (optional) */}
      <div className="space-y-2">
        <Label>Content ID (optional)</Label>
        <Input
          placeholder="product_123"
          value={config.properties?.content_id ?? ""}
          onChange={(e) =>
            onChange({
              ...config,
              properties: {
                ...config.properties,
                content_id: e.target.value || undefined,
              },
            })
          }
        />
        <p className="text-xs text-white/40">
          Optional product or content identifier
        </p>
      </div>
    </div>
  );
}
