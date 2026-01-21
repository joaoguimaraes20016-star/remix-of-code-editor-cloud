import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateVariablePicker } from "../TemplateVariablePicker";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Phone, Mail } from "lucide-react";

interface SendMessageConfig {
  channel: "sms" | "email" | "voice" | "in_app";
  template: string;
  subject?: string;
  // Email-specific options
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  // Voice-specific options
  useElevenLabsAI?: boolean;
  agentId?: string;
  mode?: "immediate" | "dialer_queue";
}

interface SendMessageFormProps {
  config: SendMessageConfig;
  onChange: (config: SendMessageConfig) => void;
  teamId?: string;
}

export function SendMessageForm({ config, onChange, teamId }: SendMessageFormProps) {
  const templateRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  // Fetch verified sending domains for email
  const { data: sendingDomains } = useQuery({
    queryKey: ["team-sending-domains-verified", teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const { data, error } = await supabase
        .from("team_sending_domains")
        .select("id, full_domain, status")
        .eq("team_id", teamId)
        .eq("status", "verified");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!teamId && config.channel === "email",
  });

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
        <div className="space-y-4 rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4" />
            Email Options
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                placeholder="Your Company Name"
                value={config.fromName || ""}
                onChange={(e) => onChange({ ...config, fromName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Select
                value={config.fromEmail || "default"}
                onValueChange={(value) => onChange({ ...config, fromEmail: value === "default" ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sending address" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">
                    Stackit Default (noreply@send.stackitmail.com)
                  </SelectItem>
                  {sendingDomains?.map((domain) => (
                    <SelectItem key={domain.id} value={domain.full_domain}>
                      @{domain.full_domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {sendingDomains?.length === 0 && "Add a custom domain in Settings → Messaging → Email"}
              </p>
            </div>
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
        </div>
      )}

      {/* Voice-specific options */}
      {config.channel === "voice" && (
        <div className="space-y-4 rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4" />
            Voice Call Options
          </div>

          {/* Call Mode */}
          <div className="space-y-2">
            <Label>Call Mode</Label>
            <Select
              value={config.mode || "immediate"}
              onValueChange={(value: "immediate" | "dialer_queue") =>
                onChange({ ...config, mode: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate Call</SelectItem>
                <SelectItem value="dialer_queue">Add to Power Dialer</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {config.mode === "dialer_queue" 
                ? "Call will be queued for manual dialing" 
                : "Call will be initiated immediately"}
            </p>
          </div>

          {/* ElevenLabs AI Toggle */}
          <div className="flex items-center justify-between rounded-md border border-border/50 bg-background p-3">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-primary" />
              <div>
                <Label htmlFor="elevenlabs-toggle" className="cursor-pointer">
                  Use AI Voice Agent
                </Label>
                <p className="text-xs text-muted-foreground">
                  Connect to ElevenLabs Conversational AI
                </p>
              </div>
            </div>
            <Switch
              id="elevenlabs-toggle"
              checked={config.useElevenLabsAI || false}
              onCheckedChange={(checked) =>
                onChange({ ...config, useElevenLabsAI: checked })
              }
            />
          </div>

          {/* Agent ID Input (shown when AI is enabled) */}
          {config.useElevenLabsAI && (
            <div className="space-y-2">
              <Label htmlFor="agent-id">ElevenLabs Agent ID</Label>
              <Input
                id="agent-id"
                placeholder="Enter your ElevenLabs Agent ID..."
                value={config.agentId || ""}
                onChange={(e) => onChange({ ...config, agentId: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Find this in your ElevenLabs Conversational AI dashboard
              </p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="template">
            {config.channel === "voice" && !config.useElevenLabsAI 
              ? "Call Script" 
              : "Message"}
          </Label>
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
              : config.channel === "voice"
              ? "Hi {{lead.first_name}}, this is a reminder about your upcoming appointment..."
              : "Enter your message..."
          }
          value={config.template}
          onChange={(e) => onChange({ ...config, template: e.target.value })}
          rows={4}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {config.channel === "voice" && config.useElevenLabsAI
            ? "This script will be used as fallback if AI agent is unavailable"
            : "Use {{variable}} syntax for dynamic content"}
        </p>
      </div>
    </div>
  );
}
