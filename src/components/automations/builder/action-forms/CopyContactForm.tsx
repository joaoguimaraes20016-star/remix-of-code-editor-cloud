import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Copy } from "lucide-react";

interface CopyContactConfig {
  newEmail?: string;
  newPhone?: string;
  copyTags?: boolean;
  copyCustomFields?: boolean;
}

interface CopyContactFormProps {
  config: CopyContactConfig;
  onChange: (config: CopyContactConfig) => void;
}

export function CopyContactForm({ config, onChange }: CopyContactFormProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <div className="flex items-start gap-3">
          <Copy className="h-5 w-5 text-purple-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Copy Contact</p>
            <p className="text-xs text-muted-foreground mt-1">
              Creates a duplicate of the current contact in context. The new contact will have a reference to the original via custom fields.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newEmail">New Email (optional)</Label>
        <Input
          id="newEmail"
          placeholder="e.g., newemail@example.com or {{lead.email}}"
          value={config.newEmail || ""}
          onChange={(e) => onChange({ ...config, newEmail: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          If left blank, the copy will have no email to avoid duplicates. Use template variables for dynamic values.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPhone">New Phone (optional)</Label>
        <Input
          id="newPhone"
          placeholder="e.g., +1234567890 or {{lead.phone}}"
          value={config.newPhone || ""}
          onChange={(e) => onChange({ ...config, newPhone: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          If left blank, the copy will have no phone number.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Copy Tags</Label>
          <p className="text-xs text-muted-foreground">Include all tags from the original contact</p>
        </div>
        <Switch
          checked={config.copyTags !== false}
          onCheckedChange={(v) => onChange({ ...config, copyTags: v })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Copy Custom Fields</Label>
          <p className="text-xs text-muted-foreground">Include all custom fields from the original contact</p>
        </div>
        <Switch
          checked={config.copyCustomFields !== false}
          onCheckedChange={(v) => onChange({ ...config, copyCustomFields: v })}
        />
      </div>
    </div>
  );
}
