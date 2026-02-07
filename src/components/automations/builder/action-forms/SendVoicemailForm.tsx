import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TemplateVariablePicker } from "../TemplateVariablePicker";
import { useRef } from "react";

interface SendVoicemailConfig {
  type: "tts" | "audio";
  message?: string;
  audioUrl?: string;
  voice?: string;
}

interface SendVoicemailFormProps {
  config: SendVoicemailConfig;
  onChange: (config: SendVoicemailConfig) => void;
}

export function SendVoicemailForm({ config, onChange }: SendVoicemailFormProps) {
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertVariable = (variable: string) => {
    if (messageRef.current) {
      const el = messageRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const current = config.message || "";
      const newValue = current.substring(0, start) + variable + current.substring(end);
      onChange({ ...config, message: newValue });
      setTimeout(() => { el.focus(); el.setSelectionRange(start + variable.length, start + variable.length); }, 0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Voicemail Type</Label>
        <Select
          value={config.type || "tts"}
          onValueChange={(value: "tts" | "audio") => onChange({ ...config, type: value })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tts">Text-to-Speech</SelectItem>
            <SelectItem value="audio">Pre-recorded Audio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.type === "audio" ? (
        <div className="space-y-2">
          <Label htmlFor="audioUrl">Audio File URL</Label>
          <Input
            id="audioUrl"
            placeholder="https://example.com/voicemail.mp3"
            value={config.audioUrl || ""}
            onChange={(e) => onChange({ ...config, audioUrl: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">MP3 or WAV file, max 60 seconds</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Voice</Label>
            <Select
              value={config.voice || "female"}
              onValueChange={(value) => onChange({ ...config, voice: value })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female (Default)</SelectItem>
                <SelectItem value="male">Male</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Message Script</Label>
              <TemplateVariablePicker onInsert={handleInsertVariable} triggerLabel="Insert Variable" />
            </div>
            <Textarea
              ref={messageRef}
              id="message"
              placeholder="Hi {{lead.first_name}}, this is a message from..."
              value={config.message || ""}
              onChange={(e) => onChange({ ...config, message: e.target.value })}
              rows={4}
              className="font-mono text-sm"
            />
          </div>
        </>
      )}
    </div>
  );
}
