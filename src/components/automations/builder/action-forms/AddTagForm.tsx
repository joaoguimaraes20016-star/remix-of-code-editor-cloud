import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tag } from "lucide-react";

interface AddTagConfig {
  tag: string;
}

interface AddTagFormProps {
  config: AddTagConfig;
  onChange: (config: AddTagConfig) => void;
}

export function AddTagForm({ config, onChange }: AddTagFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tag">Tag Name</Label>
        <Input
          id="tag"
          placeholder="e.g., hot-lead, follow-up, vip"
          value={config.tag || ""}
          onChange={(e) => onChange({ tag: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          This tag will be added to the lead's profile
        </p>
      </div>

      {config.tag && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Preview:</span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-sm">
            <Tag className="h-3 w-3" />
            {config.tag}
          </span>
        </div>
      )}
    </div>
  );
}
