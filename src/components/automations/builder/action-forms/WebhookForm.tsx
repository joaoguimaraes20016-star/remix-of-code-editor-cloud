import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateVariablePicker } from "../TemplateVariablePicker";
import { useRef } from "react";
import { Globe } from "lucide-react";

interface WebhookConfig {
  url: string;
  method: "POST" | "PUT" | "PATCH";
  headers?: Record<string, string>;
  payload?: string;
}

interface WebhookFormProps {
  config: WebhookConfig;
  onChange: (config: WebhookConfig) => void;
}

export function WebhookForm({ config, onChange }: WebhookFormProps) {
  const payloadRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertVariable = (variable: string) => {
    if (payloadRef.current) {
      const textarea = payloadRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentPayload = config.payload || "";
      const newValue =
        currentPayload.substring(0, start) +
        variable +
        currentPayload.substring(end);
      onChange({ ...config, payload: newValue });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const defaultPayload = `{
  "lead": {
    "name": "{{lead.name}}",
    "email": "{{lead.email}}",
    "phone": "{{lead.phone}}"
  },
  "event": "automation_triggered"
}`;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">Webhook URL</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://api.example.com/webhook"
          value={config.url || ""}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>HTTP Method</Label>
        <Select
          value={config.method || "POST"}
          onValueChange={(value: WebhookConfig["method"]) =>
            onChange({ ...config, method: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="payload">JSON Payload</Label>
          <TemplateVariablePicker onInsert={handleInsertVariable} triggerLabel="Insert" />
        </div>
        <Textarea
          ref={payloadRef}
          id="payload"
          placeholder={defaultPayload}
          value={config.payload || ""}
          onChange={(e) => onChange({ ...config, payload: e.target.value })}
          rows={6}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Use {"{{variable}}"} syntax for dynamic values. Must be valid JSON.
        </p>
      </div>

      {config.url && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 text-sm">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {config.method || "POST"} → {config.url}
          </span>
        </div>
      )}
    </div>
  );
}
