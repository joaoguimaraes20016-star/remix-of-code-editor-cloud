import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface WaitUntilConfig {
  waitType: 'specific_date' | 'field_date';
  specificDate?: string;
  specificTime?: string;
  dateField?: string;
  offsetDays?: number;
  offsetDirection?: 'before' | 'after';
}

interface WaitUntilFormProps {
  config: WaitUntilConfig;
  onChange: (config: WaitUntilConfig) => void;
}

export function WaitUntilForm({ config, onChange }: WaitUntilFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Wait Until</Label>
        <RadioGroup
          value={config.waitType || 'specific_date'}
          onValueChange={(value) => onChange({ ...config, waitType: value as WaitUntilConfig['waitType'] })}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="specific_date" id="specific_date" />
            <Label htmlFor="specific_date" className="font-normal cursor-pointer">
              Specific date & time
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="field_date" id="field_date" />
            <Label htmlFor="field_date" className="font-normal cursor-pointer">
              Based on a date field
            </Label>
          </div>
        </RadioGroup>
      </div>

      {config.waitType === 'specific_date' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="specificDate">Date</Label>
            <Input
              id="specificDate"
              type="date"
              value={config.specificDate || ""}
              onChange={(e) => onChange({ ...config, specificDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specificTime">Time</Label>
            <Input
              id="specificTime"
              type="time"
              value={config.specificTime || "09:00"}
              onChange={(e) => onChange({ ...config, specificTime: e.target.value })}
            />
          </div>
        </div>
      )}

      {config.waitType === 'field_date' && (
        <>
          <div className="space-y-2">
            <Label>Date Field</Label>
            <Select
              value={config.dateField || ""}
              onValueChange={(value) => onChange({ ...config, dateField: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appointment.start_at">Appointment Date</SelectItem>
                <SelectItem value="lead.created_at">Lead Created Date</SelectItem>
                <SelectItem value="deal.close_date">Deal Close Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="offsetDays">Offset (days)</Label>
              <Input
                id="offsetDays"
                type="number"
                min="0"
                placeholder="0"
                value={config.offsetDays || ""}
                onChange={(e) => onChange({ ...config, offsetDays: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select
                value={config.offsetDirection || "before"}
                onValueChange={(value) => onChange({ ...config, offsetDirection: value as 'before' | 'after' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">Before</SelectItem>
                  <SelectItem value="after">After</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
