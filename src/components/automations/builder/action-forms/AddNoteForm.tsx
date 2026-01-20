import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddNoteConfig {
  entity: 'lead' | 'deal' | 'contact';
  content: string;
}

interface AddNoteFormProps {
  config: AddNoteConfig;
  onChange: (config: AddNoteConfig) => void;
}

export function AddNoteForm({ config, onChange }: AddNoteFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Add Note To</Label>
        <Select
          value={config.entity || "lead"}
          onValueChange={(value) => onChange({ ...config, entity: value as AddNoteConfig['entity'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="deal">Deal</SelectItem>
            <SelectItem value="contact">Contact</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Note Content</Label>
        <Textarea
          id="content"
          placeholder="Enter note content...&#10;Use {{lead.name}} for dynamic values"
          value={config.content || ""}
          onChange={(e) => onChange({ ...config, content: e.target.value })}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Supports variables like {"{{lead.name}}"}, {"{{appointment.date}}"}
        </p>
      </div>
    </div>
  );
}
