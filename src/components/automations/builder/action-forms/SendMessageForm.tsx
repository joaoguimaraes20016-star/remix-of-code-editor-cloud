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

interface SendMessageConfig {
  channel: "sms" | "email" | "voice" | "in_app";
  template: string;
  subject?: string;
}

interface SendMessageFormProps {
  config: SendMessageConfig;
  onChange: (config: SendMessageConfig) => void;
}

export function SendMessageForm({ config, onChange }: SendMessageFormProps) {
  const templateRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  const handleInsertVariable = (variable: string, field: "template" | "subject") => {
    if (field === "template" && templateRef.current) {
      const textarea = templateRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue =
        config.template.substring(0, start) +
        variable +
        config.template.substring(end);
      onChange({ ...config, template: newValue });
      // Reset cursor position after state update
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else if (field === "subject" && subjectRef.current && config.subject !== undefined) {
      const input = subjectRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentSubject = config.subject || "";
      const newValue =
        currentSubject.substring(0, start) +
        variable +
        currentSubject.substring(end);
      onChange({ ...config, subject: newValue });
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Channel</Label>
        <Select
          value={config.channel}
          onValueChange={(value: SendMessageConfig["channel"]) =>
            onChange({ ...config, channel: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="voice">Voice Call</SelectItem>
            <SelectItem value="in_app">In-App</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.channel === "email" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="subject">Subject</Label>
            <TemplateVariablePicker
              onInsert={(v) => handleInsertVariable(v, "subject")}
              triggerLabel="Insert"
            />
          </div>
          <Input
            ref={subjectRef}
            id="subject"
            placeholder="Email subject line..."
            value={config.subject || ""}
            onChange={(e) => onChange({ ...config, subject: e.target.value })}
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="template">Message</Label>
          <TemplateVariablePicker
            onInsert={(v) => handleInsertVariable(v, "template")}
            triggerLabel="Insert Variable"
          />
        </div>
        <Textarea
          ref={templateRef}
          id="template"
          placeholder={
            config.channel === "sms"
              ? "Hey {{lead.first_name}}, your appointment is confirmed!"
              : config.channel === "email"
              ? "Dear {{lead.first_name}},\n\nThank you for booking..."
              : "Enter your message..."
          }
          value={config.template}
          onChange={(e) => onChange({ ...config, template: e.target.value })}
          rows={4}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Use {"{{variable}}"} syntax for dynamic content
        </p>
      </div>
    </div>
  );
}
