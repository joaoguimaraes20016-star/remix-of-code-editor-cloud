import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateVariablePicker } from "../TemplateVariablePicker";
import { useRef } from "react";

const META_EVENT_TYPES = [
  { value: "Purchase", label: "Purchase" },
  { value: "Lead", label: "Lead" },
  { value: "CompleteRegistration", label: "Complete Registration" },
  { value: "AddToCart", label: "Add to Cart" },
  { value: "InitiateCheckout", label: "Initiate Checkout" },
  { value: "AddPaymentInfo", label: "Add Payment Info" },
  { value: "ViewContent", label: "View Content" },
  { value: "Search", label: "Search" },
  { value: "Subscribe", label: "Subscribe" },
  { value: "StartTrial", label: "Start Trial" },
] as const;

const ACTION_SOURCES = [
  { value: "website", label: "Website" },
  { value: "email", label: "Email" },
  { value: "app", label: "App" },
  { value: "phone_call", label: "Phone Call" },
  { value: "chat", label: "Chat" },
  { value: "physical_store", label: "Physical Store" },
  { value: "system_generated", label: "System Generated" },
  { value: "other", label: "Other" },
] as const;

interface MetaConversionConfig {
  pixel_id: string;
  event_name: string;
  event_time?: number;
  event_id?: string;
  event_source_url?: string;
  action_source?: string;
  user_data?: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    external_id?: string;
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_name?: string;
    content_category?: string;
    content_ids?: string;
    num_items?: number;
    order_id?: string;
  };
}

interface MetaConversionFormProps {
  config: MetaConversionConfig;
  onChange: (config: MetaConversionConfig) => void;
}

export function MetaConversionForm({ config, onChange }: MetaConversionFormProps) {
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const externalIdRef = useRef<HTMLInputElement>(null);
  const contentIdsRef = useRef<HTMLInputElement>(null);
  const orderIdRef = useRef<HTMLInputElement>(null);
  const contentNameRef = useRef<HTMLInputElement>(null);
  const contentCategoryRef = useRef<HTMLInputElement>(null);
  const eventSourceUrlRef = useRef<HTMLInputElement>(null);

  const handleInsertVariable = (variable: string, ref: React.RefObject<HTMLInputElement>) => {
    const input = ref.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentValue = input.value || "";
    const newValue =
      currentValue.substring(0, start) +
      `{{${variable}}}` +
      currentValue.substring(end);

    // Update the appropriate field based on ref
    if (ref === emailRef) {
      onChange({
        ...config,
        user_data: { ...config.user_data, email: newValue },
      });
    } else if (ref === phoneRef) {
      onChange({
        ...config,
        user_data: { ...config.user_data, phone: newValue },
      });
    } else if (ref === firstNameRef) {
      onChange({
        ...config,
        user_data: { ...config.user_data, first_name: newValue },
      });
    } else if (ref === lastNameRef) {
      onChange({
        ...config,
        user_data: { ...config.user_data, last_name: newValue },
      });
    } else if (ref === externalIdRef) {
      onChange({
        ...config,
        user_data: { ...config.user_data, external_id: newValue },
      });
    } else if (ref === contentIdsRef) {
      onChange({
        ...config,
        custom_data: { ...config.custom_data, content_ids: newValue },
      });
    } else if (ref === orderIdRef) {
      onChange({
        ...config,
        custom_data: { ...config.custom_data, order_id: newValue },
      });
    } else if (ref === contentNameRef) {
      onChange({
        ...config,
        custom_data: { ...config.custom_data, content_name: newValue },
      });
    } else if (ref === contentCategoryRef) {
      onChange({
        ...config,
        custom_data: { ...config.custom_data, content_category: newValue },
      });
    } else if (ref === eventSourceUrlRef) {
      onChange({
        ...config,
        event_source_url: newValue,
      });
    }

    setTimeout(() => {
      input.focus();
      const newPos = start + variable.length + 4;
      input.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Pixel ID */}
      <div className="space-y-2">
        <Label>Facebook Pixel ID</Label>
        <Input
          placeholder="123456789012345"
          value={config.pixel_id || ""}
          onChange={(e) => onChange({ ...config, pixel_id: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Your Facebook Pixel ID (found in Facebook Events Manager)
        </p>
      </div>

      {/* Event Name */}
      <div className="space-y-2">
        <Label>Event Name</Label>
        <Select
          value={config.event_name || ""}
          onValueChange={(value) => onChange({ ...config, event_name: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select event type..." />
          </SelectTrigger>
          <SelectContent>
            {META_EVENT_TYPES.map((event) => (
              <SelectItem key={event.value} value={event.value}>
                {event.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          The conversion event type to send to Facebook
        </p>
      </div>

      {/* Action Source */}
      <div className="space-y-2">
        <Label>Action Source</Label>
        <Select
          value={config.action_source || "website"}
          onValueChange={(value) => onChange({ ...config, action_source: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select action source..." />
          </SelectTrigger>
          <SelectContent>
            {ACTION_SOURCES.map((source) => (
              <SelectItem key={source.value} value={source.value}>
                {source.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Where the conversion event occurred
        </p>
      </div>

      {/* Event Source URL */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Event Source URL (optional)</Label>
          <TemplateVariablePicker onInsert={(v) => handleInsertVariable(v, eventSourceUrlRef)} />
        </div>
        <Input
          ref={eventSourceUrlRef}
          placeholder="{{lead.source_url}} or https://example.com/page"
          value={config.event_source_url || ""}
          onChange={(e) => onChange({ ...config, event_source_url: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          The URL where the event occurred. Use template variables to pull from contact data.
        </p>
      </div>

      {/* User Data Section */}
      <div className="space-y-3 border-t border-border pt-4">
        <Label className="text-sm font-semibold">User Data (optional)</Label>
        <p className="text-xs text-muted-foreground">
          User information for matching. Leave empty to use contact data automatically.
        </p>

        {/* Email */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Email</Label>
            <TemplateVariablePicker onInsert={(v) => handleInsertVariable(v, emailRef)} />
          </div>
          <Input
            ref={emailRef}
            type="email"
            placeholder="{{lead.email}}"
            value={config.user_data?.email || ""}
            onChange={(e) =>
              onChange({
                ...config,
                user_data: { ...config.user_data, email: e.target.value },
              })
            }
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Phone</Label>
            <TemplateVariablePicker onInsert={(v) => handleInsertVariable(v, phoneRef)} />
          </div>
          <Input
            ref={phoneRef}
            placeholder="{{lead.phone}}"
            value={config.user_data?.phone || ""}
            onChange={(e) =>
              onChange({
                ...config,
                user_data: { ...config.user_data, phone: e.target.value },
              })
            }
          />
        </div>

        {/* First Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">First Name</Label>
            <TemplateVariablePicker onInsert={(v) => handleInsertVariable(v, firstNameRef)} />
          </div>
          <Input
            ref={firstNameRef}
            placeholder="{{lead.first_name}}"
            value={config.user_data?.first_name || ""}
            onChange={(e) =>
              onChange({
                ...config,
                user_data: { ...config.user_data, first_name: e.target.value },
              })
            }
          />
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Last Name</Label>
            <TemplateVariablePicker onInsert={(v) => handleInsertVariable(v, lastNameRef)} />
          </div>
          <Input
            ref={lastNameRef}
            placeholder="{{lead.last_name}}"
            value={config.user_data?.last_name || ""}
            onChange={(e) =>
              onChange({
                ...config,
                user_data: { ...config.user_data, last_name: e.target.value },
              })
            }
          />
        </div>

        {/* External ID */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">External ID</Label>
            <TemplateVariablePicker onInsert={(v) => handleInsertVariable(v, externalIdRef)} />
          </div>
          <Input
            ref={externalIdRef}
            placeholder="{{lead.id}}"
            value={config.user_data?.external_id || ""}
            onChange={(e) =>
              onChange({
                ...config,
                user_data: { ...config.user_data, external_id: e.target.value },
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Hashed user ID for deduplication
          </p>
        </div>
      </div>

      {/* Custom Data Section */}
      <div className="space-y-3 border-t border-border pt-4">
        <Label className="text-sm font-semibold">Custom Data (optional)</Label>

        {/* Conversion Value */}
        <div className="space-y-2">
          <Label className="text-xs">Conversion Value</Label>
          <Input
            type="number"
            placeholder="99.99"
            value={config.custom_data?.value ?? ""}
            onChange={(e) =>
              onChange({
                ...config,
                custom_data: {
                  ...config.custom_data,
                  value: e.target.value ? parseFloat(e.target.value) : undefined,
                  currency: config.custom_data?.currency || "USD",
                },
              })
            }
          />
        </div>

        {/* Currency */}
        {config.custom_data?.value !== undefined && (
          <div className="space-y-2">
            <Label className="text-xs">Currency</Label>
            <Input
              placeholder="USD"
              value={config.custom_data?.currency || "USD"}
              onChange={(e) =>
                onChange({
                  ...config,
                  custom_data: {
                    ...config.custom_data,
                    currency: e.target.value,
                  },
                })
              }
            />
          </div>
        )}

        {/* Content Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Content Name</Label>
            <TemplateVariablePicker onInsert={(v) => handleInsertVariable(v, contentNameRef)} />
          </div>
          <Input
            ref={contentNameRef}
            placeholder="{{product.name}}"
            value={config.custom_data?.content_name || ""}
            onChange={(e) =>
              onChange({
                ...config,
                custom_data: {
                  ...config.custom_data,
                  content_name: e.target.value || undefined,
                },
              })
            }
          />
        </div>

        {/* Content Category */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Content Category</Label>
            <TemplateVariablePicker onInsert={(v) => handleInsertVariable(v, contentCategoryRef)} />
          </div>
          <Input
            ref={contentCategoryRef}
            placeholder="Electronics"
            value={config.custom_data?.content_category || ""}
            onChange={(e) =>
              onChange({
                ...config,
                custom_data: {
                  ...config.custom_data,
                  content_category: e.target.value || undefined,
                },
              })
            }
          />
        </div>

        {/* Content IDs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Content IDs (comma-separated)</Label>
            <TemplateVariablePicker onInsert={(v) => handleInsertVariable(v, contentIdsRef)} />
          </div>
          <Input
            ref={contentIdsRef}
            placeholder="{{product.id}} or product_123,product_456"
            value={config.custom_data?.content_ids || ""}
            onChange={(e) =>
              onChange({
                ...config,
                custom_data: {
                  ...config.custom_data,
                  content_ids: e.target.value || undefined,
                },
              })
            }
          />
        </div>

        {/* Number of Items */}
        <div className="space-y-2">
          <Label className="text-xs">Number of Items</Label>
          <Input
            type="number"
            placeholder="1"
            value={config.custom_data?.num_items ?? ""}
            onChange={(e) =>
              onChange({
                ...config,
                custom_data: {
                  ...config.custom_data,
                  num_items: e.target.value ? parseInt(e.target.value) : undefined,
                },
              })
            }
          />
        </div>

        {/* Order ID */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Order ID</Label>
            <TemplateVariablePicker onInsert={(v) => handleInsertVariable(v, orderIdRef)} />
          </div>
          <Input
            ref={orderIdRef}
            placeholder="{{order.id}}"
            value={config.custom_data?.order_id || ""}
            onChange={(e) =>
              onChange({
                ...config,
                custom_data: {
                  ...config.custom_data,
                  order_id: e.target.value || undefined,
                },
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
