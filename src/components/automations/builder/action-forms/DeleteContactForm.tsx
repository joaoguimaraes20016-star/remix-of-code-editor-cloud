import { AlertTriangle } from "lucide-react";

interface DeleteContactConfig {
  confirm?: boolean;
}

interface DeleteContactFormProps {
  config: DeleteContactConfig;
  onChange: (config: DeleteContactConfig) => void;
}

export function DeleteContactForm({ config, onChange }: DeleteContactFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-400">Destructive Action</p>
          <p className="text-xs text-muted-foreground mt-1">
            This will permanently delete the contact from your CRM. This action cannot be undone.
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        The contact currently in context (the trigger contact) will be removed.
      </p>
    </div>
  );
}
