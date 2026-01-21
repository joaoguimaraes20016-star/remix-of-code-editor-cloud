import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Globe, Info } from "lucide-react";
import { toast } from "sonner";

interface AddDomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onSuccess: () => void;
}

export function AddDomainDialog({ open, onOpenChange, teamId, onSuccess }: AddDomainDialogProps) {
  const [domain, setDomain] = useState("");
  const [useSubdomain, setUseSubdomain] = useState(true);
  const [subdomain, setSubdomain] = useState("mail");

  const addDomain = useMutation({
    mutationFn: async () => {
      // First, call edge function to provision in Mailgun
      const { data: provisionData, error: provisionError } = await supabase.functions.invoke(
        "add-email-domain",
        {
          body: {
            teamId,
            domain: domain.toLowerCase().trim(),
            subdomain: useSubdomain ? subdomain.toLowerCase().trim() : null,
          },
        }
      );

      if (provisionError) throw provisionError;
      if (!provisionData?.success) throw new Error(provisionData?.error || "Failed to add domain");

      return provisionData;
    },
    onSuccess: (data) => {
      toast.success("Domain added! Configure the DNS records to verify.");
      setDomain("");
      setSubdomain("mail");
      setUseSubdomain(true);
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error("Failed to add domain: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) {
      toast.error("Please enter a domain");
      return;
    }
    addDomain.mutate();
  };

  const fullDomain = useSubdomain && subdomain 
    ? `${subdomain}.${domain}` 
    : domain;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Add Sending Domain
          </DialogTitle>
          <DialogDescription>
            Configure a custom domain to send emails from your own branded address
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Root Domain</Label>
            <Input
              id="domain"
              placeholder="yourcompany.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <Checkbox
              id="useSubdomain"
              checked={useSubdomain}
              onCheckedChange={(checked) => setUseSubdomain(checked as boolean)}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label htmlFor="useSubdomain" className="cursor-pointer font-medium">
                Use a subdomain (recommended)
              </Label>
              <p className="text-xs text-muted-foreground">
                Sending from a subdomain protects your main domain's reputation
              </p>
            </div>
          </div>

          {useSubdomain && (
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="subdomain"
                  placeholder="mail"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  className="font-mono w-24"
                />
                <span className="text-muted-foreground">.</span>
                <span className="font-mono text-muted-foreground">
                  {domain || "yourcompany.com"}
                </span>
              </div>
            </div>
          )}

          {domain && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Emails will send from:</span>
              </div>
              <p className="font-mono text-sm mt-1 text-foreground">
                hello@{fullDomain}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addDomain.isPending || !domain.trim()}>
              {addDomain.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Domain
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
