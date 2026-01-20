import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tag, X } from "lucide-react";

interface RemoveTagConfig {
  tag: string;
}

interface RemoveTagFormProps {
  config: RemoveTagConfig;
  onChange: (config: RemoveTagConfig) => void;
}

export function RemoveTagForm({ config, onChange }: RemoveTagFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tag">Tag Name</Label>
        <Input
          id="tag"
          placeholder="e.g., hot-lead, follow-up"
          value={config.tag || ""}
          onChange={(e) => onChange({ tag: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          This tag will be removed from the lead's profile
        </p>
      </div>

      {config.tag && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Preview:</span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-sm line-through">
            <Tag className="h-3 w-3" />
            {config.tag}
            <X className="h-3 w-3" />
          </span>
        </div>
      )}
    </div>
  );
}
