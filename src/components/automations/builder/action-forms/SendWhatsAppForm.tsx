import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TemplateVariablePicker } from "../TemplateVariablePicker";
import { useRef } from "react";

interface SendWhatsAppConfig {
  template?: string;
  body: string;
  mediaUrl?: string;
  messageType: "template" | "custom";
}

interface SendWhatsAppFormProps {
  config: SendWhatsAppConfig;
  onChange: (config: SendWhatsAppConfig) => void;
}

export function SendWhatsAppForm({ config, onChange }: SendWhatsAppFormProps) {
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertVariable = (variable: string) => {
    if (messageRef.current) {
      const el = messageRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const current = config.body || "";
      const newValue = current.substring(0, start) + variable + current.substring(end);
      onChange({ ...config, body: newValue });
      setTimeout(() => { el.focus(); el.setSelectionRange(start + variable.length, start + variable.length); }, 0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Message Type</Label>
        <Select
          value={config.messageType || "custom"}
          onValueChange={(value: "template" | "custom") => onChange({ ...config, messageType: value })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Custom Message</SelectItem>
            <SelectItem value="template">WhatsApp Template</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.messageType === "template" && (
        <div className="space-y-2">
          <Label htmlFor="template">Template Name</Label>
          <Input
            id="template"
            placeholder="e.g., appointment_reminder"
            value={config.template || ""}
            onChange={(e) => onChange({ ...config, template: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Must be an approved WhatsApp template</p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="body">Message</Label>
          <TemplateVariablePicker onInsert={handleInsertVariable} triggerLabel="Insert Variable" />
        </div>
        <Textarea
          ref={messageRef}
          id="body"
          placeholder="Hi {{lead.first_name}}, thanks for booking with us!"
          value={config.body || ""}
          onChange={(e) => onChange({ ...config, body: e.target.value })}
          rows={4}
          className="font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mediaUrl">Media URL (optional)</Label>
        <Input
          id="mediaUrl"
          placeholder="https://example.com/image.jpg"
          value={config.mediaUrl || ""}
          onChange={(e) => onChange({ ...config, mediaUrl: e.target.value })}
        />
      </div>
    </div>
  );
}
