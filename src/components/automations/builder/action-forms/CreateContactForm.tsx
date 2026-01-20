import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface CreateContactConfig {
  nameField?: string;
  emailField?: string;
  phoneField?: string;
  source?: string;
  tags?: string;
  useContextData?: boolean;
}

interface CreateContactFormProps {
  config: CreateContactConfig;
  onChange: (config: CreateContactConfig) => void;
}

export function CreateContactForm({ config, onChange }: CreateContactFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Use Context Data</Label>
          <p className="text-xs text-muted-foreground">
            Automatically use lead data from trigger
          </p>
        </div>
        <Switch
          checked={config.useContextData ?? true}
          onCheckedChange={(checked) => onChange({ ...config, useContextData: checked })}
        />
      </div>

      {!config.useContextData && (
        <>
          <div className="space-y-2">
            <Label htmlFor="nameField">Name Field</Label>
            <Input
              id="nameField"
              placeholder="{{lead.name}}"
              value={config.nameField || ""}
              onChange={(e) => onChange({ ...config, nameField: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailField">Email Field</Label>
            <Input
              id="emailField"
              placeholder="{{lead.email}}"
              value={config.emailField || ""}
              onChange={(e) => onChange({ ...config, emailField: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneField">Phone Field</Label>
            <Input
              id="phoneField"
              placeholder="{{lead.phone}}"
              value={config.phoneField || ""}
              onChange={(e) => onChange({ ...config, phoneField: e.target.value })}
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="source">Source</Label>
        <Input
          id="source"
          placeholder="e.g., automation, funnel"
          value={config.source || ""}
          onChange={(e) => onChange({ ...config, source: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Initial Tags (comma-separated)</Label>
        <Input
          id="tags"
          placeholder="e.g., new-contact, automation-created"
          value={config.tags || ""}
          onChange={(e) => onChange({ ...config, tags: e.target.value })}
        />
      </div>
    </div>
  );
}
