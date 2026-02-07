import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RemoveOpportunityConfig {
  // No config needed - uses context.deal or context.appointment
}

interface RemoveOpportunityFormProps {
  config: RemoveOpportunityConfig;
  onChange: (config: RemoveOpportunityConfig) => void;
}

export function RemoveOpportunityForm({ config, onChange }: RemoveOpportunityFormProps) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This action will permanently delete the opportunity/deal. This cannot be undone.
          The deal will be removed from the system and all associated data will be lost.
        </AlertDescription>
      </Alert>
      <p className="text-sm text-muted-foreground">
        The opportunity will be deleted from the current contact's context. Make sure this is what you want before proceeding.
      </p>
    </div>
  );
}
