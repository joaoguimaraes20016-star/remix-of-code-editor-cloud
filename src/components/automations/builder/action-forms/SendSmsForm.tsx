import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TemplateVariablePicker } from "../TemplateVariablePicker";
import { useRef } from "react";

interface SendSmsConfig {
  body: string;
  mediaUrl?: string;
}

interface SendSmsFormProps {
  config: SendSmsConfig;
  onChange: (config: SendSmsConfig) => void;
}

export function SendSmsForm({ config, onChange }: SendSmsFormProps) {
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
        <div className="flex items-center justify-between">
          <Label htmlFor="body">Message</Label>
          <TemplateVariablePicker onInsert={handleInsertVariable} triggerLabel="Insert Variable" />
        </div>
        <Textarea
          ref={messageRef}
          id="body"
          placeholder="Hey {{lead.first_name}}, your appointment is confirmed for tomorrow!"
          value={config.body || ""}
          onChange={(e) => onChange({ ...config, body: e.target.value })}
          rows={4}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {(config.body || "").length}/160 characters
          {(config.body || "").length > 160 && " (will be sent as multiple segments)"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mediaUrl">Media URL (optional)</Label>
        <Input
          id="mediaUrl"
          placeholder="https://example.com/image.jpg"
          value={config.mediaUrl || ""}
          onChange={(e) => onChange({ ...config, mediaUrl: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Attach an image or file (MMS)</p>
      </div>
    </div>
  );
}
