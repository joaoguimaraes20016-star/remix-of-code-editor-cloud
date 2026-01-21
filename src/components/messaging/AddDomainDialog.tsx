import { useState, forwardRef } from "react";
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
import { Loader2, Globe, Info, Copy, Check, ExternalLink, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DnsRecord {
  type: string;
  host: string;
  value: string;
  verified?: boolean;
  priority?: number;
}

interface CreatedDomain {
  id: string;
  domain: string;
  full_domain: string;
  status: string;
  dns_records: DnsRecord[];
}

interface AddDomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onSuccess: () => void;
}

type Step = "entry" | "dns";

export const AddDomainDialog = forwardRef<HTMLDivElement, AddDomainDialogProps>(
  function AddDomainDialog({ open, onOpenChange, teamId, onSuccess }, ref) {
  const [step, setStep] = useState<Step>("entry");
  const [domain, setDomain] = useState("");
  const [useSubdomain, setUseSubdomain] = useState(true);
  const [subdomain, setSubdomain] = useState("mail");
  const [createdDomain, setCreatedDomain] = useState<CreatedDomain | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const addDomain = useMutation({
    mutationFn: async () => {
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
      toast.success("Domain added! Configure the DNS records below.");
      setCreatedDomain({
        id: data.domainId,
        domain: domain.toLowerCase().trim(),
        full_domain: data.fullDomain || (useSubdomain && subdomain ? `${subdomain}.${domain}` : domain),
        status: "pending",
        dns_records: data.dnsRecords || [],
      });
      setStep("dns");
      onSuccess(); // Refresh the domains list
    },
    onError: (error: Error) => {
      toast.error("Failed to add domain: " + error.message);
    },
  });

  const verifyDomain = useMutation({
    mutationFn: async () => {
      if (!createdDomain) throw new Error("No domain to verify");
      
      const { data, error } = await supabase.functions.invoke("verify-email-domain", {
        body: { domainId: createdDomain.id, teamId },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.verified) {
        toast.success("Domain verified successfully!");
        handleClose();
      } else {
        toast.info("DNS records not propagated yet. Please wait a few minutes and try again.");
        // Update the DNS records with verification status
        if (data.dnsRecords) {
          setCreatedDomain(prev => prev ? { ...prev, dns_records: data.dnsRecords } : null);
        }
      }
      onSuccess(); // Refresh to show updated status
    },
    onError: (error: Error) => {
      toast.error("Verification failed: " + error.message);
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

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setStep("entry");
      setDomain("");
      setSubdomain("mail");
      setUseSubdomain(true);
      setCreatedDomain(null);
      setCopiedField(null);
    }, 200);
  };

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const fullDomain = useSubdomain && subdomain 
    ? `${subdomain}.${domain}` 
    : domain;

  const getRecordTypeLabel = (type: string) => {
    switch (type.toUpperCase()) {
      case "TXT": return "TXT (Verification)";
      case "CNAME": return "CNAME";
      case "MX": return "MX (Mail)";
      default: return type;
    }
  };

  const getStatusIcon = (verified?: boolean) => {
    if (verified === true) {
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    }
    if (verified === false) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "transition-all duration-200",
        step === "dns" ? "sm:max-w-2xl" : "sm:max-w-md"
      )}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className={cn(
              "px-2 py-0.5 rounded-full",
              step === "entry" ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              1
            </span>
            <span className="w-8 h-px bg-border" />
            <span className={cn(
              "px-2 py-0.5 rounded-full",
              step === "dns" ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              2
            </span>
          </div>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {step === "entry" ? "Add Sending Domain" : "Configure DNS Records"}
          </DialogTitle>
          <DialogDescription>
            {step === "entry" 
              ? "Configure a custom domain to send emails from your own branded address"
              : `Add these DNS records to ${createdDomain?.full_domain} to verify ownership`
            }
          </DialogDescription>
        </DialogHeader>

        {step === "entry" ? (
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
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addDomain.isPending || !domain.trim()}>
                {addDomain.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Domain
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Instructions */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
              <h4 className="font-medium text-sm">How to add DNS records:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)</li>
                <li>Navigate to DNS settings for <span className="font-mono text-foreground">{createdDomain?.domain}</span></li>
                <li>Add each DNS record below exactly as shown</li>
                <li>Wait 5-10 minutes for propagation</li>
                <li>Click "Verify Domain" to confirm</li>
              </ol>
            </div>

            {/* DNS Records */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {createdDomain?.dns_records.map((record, index) => (
                <div 
                  key={index} 
                  className="p-3 rounded-lg border border-border bg-card space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted">
                        {getRecordTypeLabel(record.type)}
                      </span>
                      {record.priority !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          Priority: {record.priority}
                        </span>
                      )}
                    </div>
                    {getStatusIcon(record.verified)}
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-12 shrink-0">Host:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">
                        {record.host}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 shrink-0"
                        onClick={() => copyToClipboard(record.host, `host-${index}`)}
                      >
                        {copiedField === `host-${index}` ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground w-12 shrink-0 pt-1">Value:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 break-all">
                        {record.value}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 shrink-0"
                        onClick={() => copyToClipboard(record.value, `value-${index}`)}
                      >
                        {copiedField === `value-${index}` ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                asChild
              >
                <a 
                  href="https://www.whatsmydns.net/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Check DNS Propagation
                </a>
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 sm:flex-none"
                >
                  Close
                </Button>
                <Button 
                  type="button"
                  onClick={() => verifyDomain.mutate()}
                  disabled={verifyDomain.isPending}
                  className="flex-1 sm:flex-none"
                >
                  {verifyDomain.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify Domain
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
