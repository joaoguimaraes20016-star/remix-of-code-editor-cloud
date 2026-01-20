import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, XCircle } from "lucide-react";

interface CloseDealConfig {
  status: 'won' | 'lost';
  reason?: string;
}

interface CloseDealFormProps {
  config: CloseDealConfig;
  onChange: (config: CloseDealConfig) => void;
}

export function CloseDealForm({ config, onChange }: CloseDealFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Close Status</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...config, status: 'won' })}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
              config.status === 'won' 
                ? 'border-green-500 bg-green-500/10 text-green-400' 
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <Trophy className="h-5 w-5" />
            <span className="font-medium">Won</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...config, status: 'lost' })}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
              config.status === 'lost' 
                ? 'border-red-500 bg-red-500/10 text-red-400' 
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Lost</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">
          {config.status === 'won' ? 'Win Notes (Optional)' : 'Lost Reason (Optional)'}
        </Label>
        <Textarea
          id="reason"
          placeholder={config.status === 'won' 
            ? "Notes about the win..." 
            : "Why was this deal lost?"}
          value={config.reason || ""}
          onChange={(e) => onChange({ ...config, reason: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}
