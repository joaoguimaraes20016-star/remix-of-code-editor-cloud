import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TemplateVariablePicker } from "../TemplateVariablePicker";
import { useRef } from "react";

interface SendEmailConfig {
  subject: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
}

interface SendEmailFormProps {
  config: SendEmailConfig;
  onChange: (config: SendEmailConfig) => void;
}

export function SendEmailForm({ config, onChange }: SendEmailFormProps) {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  const handleInsertVariable = (variable: string, field: "body" | "subject") => {
    if (field === "body" && bodyRef.current) {
      const el = bodyRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const current = config.body || "";
      const newValue = current.substring(0, start) + variable + current.substring(end);
      onChange({ ...config, body: newValue });
      setTimeout(() => { el.focus(); el.setSelectionRange(start + variable.length, start + variable.length); }, 0);
    } else if (field === "subject" && subjectRef.current) {
      const el = subjectRef.current;
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const current = config.subject || "";
      const newValue = current.substring(0, start) + variable + current.substring(end);
      onChange({ ...config, subject: newValue });
      setTimeout(() => { el.focus(); el.setSelectionRange(start + variable.length, start + variable.length); }, 0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fromName">From Name</Label>
        <Input
          id="fromName"
          placeholder="Your Company"
          value={config.fromName || ""}
          onChange={(e) => onChange({ ...config, fromName: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fromEmail">From Email (optional)</Label>
        <Input
          id="fromEmail"
          type="email"
          placeholder="noreply@yourcompany.com"
          value={config.fromEmail || ""}
          onChange={(e) => onChange({ ...config, fromEmail: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="replyTo">Reply-To (optional)</Label>
        <Input
          id="replyTo"
          type="email"
          placeholder="replies@yourcompany.com"
          value={config.replyTo || ""}
          onChange={(e) => onChange({ ...config, replyTo: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="subject">Subject</Label>
          <TemplateVariablePicker onInsert={(v) => handleInsertVariable(v, "subject")} triggerLabel="Insert" />
        </div>
        <Input
          ref={subjectRef}
          id="subject"
          placeholder="Hey {{lead.first_name}}, check this out!"
          value={config.subject || ""}
          onChange={(e) => onChange({ ...config, subject: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="body">Email Body</Label>
          <TemplateVariablePicker onInsert={(v) => handleInsertVariable(v, "body")} triggerLabel="Insert Variable" />
        </div>
        <Textarea
          ref={bodyRef}
          id="body"
          placeholder="Dear {{lead.first_name}},&#10;&#10;Thank you for your interest..."
          value={config.body || ""}
          onChange={(e) => onChange({ ...config, body: e.target.value })}
          rows={6}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">Use {"{{variable}}"} syntax for dynamic content</p>
      </div>
    </div>
  );
}
