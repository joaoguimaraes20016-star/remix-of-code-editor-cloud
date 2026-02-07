import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { TemplateVariablePicker } from "../TemplateVariablePicker";
import { useRef } from "react";

interface MakeCallConfig {
  script?: string;
  whisperMessage?: string;
  recordCall?: boolean;
  callerId?: string;
}

interface MakeCallFormProps {
  config: MakeCallConfig;
  onChange: (config: MakeCallConfig) => void;
}

export function MakeCallForm({ config, onChange }: MakeCallFormProps) {
  const scriptRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertVariable = (variable: string) => {
    if (scriptRef.current) {
      const el = scriptRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const current = config.script || "";
      const newValue = current.substring(0, start) + variable + current.substring(end);
      onChange({ ...config, script: newValue });
      setTimeout(() => { el.focus(); el.setSelectionRange(start + variable.length, start + variable.length); }, 0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="callerId">Caller ID (optional)</Label>
        <Input
          id="callerId"
          placeholder="+1 (555) 000-0000"
          value={config.callerId || ""}
          onChange={(e) => onChange({ ...config, callerId: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Phone number shown to the recipient</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="script">Call Script</Label>
          <TemplateVariablePicker onInsert={handleInsertVariable} triggerLabel="Insert Variable" />
        </div>
        <Textarea
          ref={scriptRef}
          id="script"
          placeholder="Hi {{lead.first_name}}, this is {{team.name}} calling about..."
          value={config.script || ""}
          onChange={(e) => onChange({ ...config, script: e.target.value })}
          rows={4}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">Script displayed to the agent during the call</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="whisper">Whisper Message (optional)</Label>
        <Input
          id="whisper"
          placeholder="Incoming lead from campaign X"
          value={config.whisperMessage || ""}
          onChange={(e) => onChange({ ...config, whisperMessage: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Played to the agent before connecting</p>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 p-3">
        <div>
          <Label htmlFor="record-toggle" className="cursor-pointer">Record Call</Label>
          <p className="text-xs text-muted-foreground">Save a recording of this call</p>
        </div>
        <Switch
          id="record-toggle"
          checked={config.recordCall || false}
          onCheckedChange={(checked) => onChange({ ...config, recordCall: checked })}
        />
      </div>
    </div>
  );
}
