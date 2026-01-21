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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Copy, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface DnsRecord {
  type: string;
  host: string;
  value: string;
  verified?: boolean;
  priority?: number;
}

interface SendingDomain {
  id: string;
  domain: string;
  subdomain: string | null;
  full_domain: string;
  status: "pending" | "verifying" | "verified" | "failed";
  dns_records: DnsRecord[];
  verification_error: string | null;
  verified_at: string | null;
}

interface DomainDnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: SendingDomain;
  teamId: string;
  onVerify: () => void;
}

export const DomainDnsDialog = forwardRef<HTMLDivElement, DomainDnsDialogProps>(
  function DomainDnsDialog({ 
  open, 
  onOpenChange, 
  domain,
  teamId,
  onVerify 
}: DomainDnsDialogProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const verifyDomain = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("verify-email-domain", {
        body: { domainId: domain.id, teamId },
      });

      if (error) throw error;
      if (!data?.success && data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      if (data.verified) {
        toast.success("Domain verified successfully!");
      } else {
        toast.info("DNS records not yet propagated. Please try again in a few minutes.");
      }
      onVerify();
    },
    onError: (error: Error) => {
      toast.error("Verification failed: " + error.message);
    },
  });

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const getRecordTypeLabel = (type: string) => {
    switch (type.toUpperCase()) {
      case "TXT":
        return "TXT Record";
      case "CNAME":
        return "CNAME Record";
      case "MX":
        return "MX Record";
      default:
        return type;
    }
  };

  const getStatusIcon = (verified?: boolean) => {
    if (verified) {
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    }
    return <Clock className="h-4 w-4 text-amber-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            DNS Configuration
            <Badge variant="outline" className="font-mono text-xs">
              {domain.full_domain}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Add these DNS records to your domain provider to verify ownership
          </DialogDescription>
        </DialogHeader>

        {domain.status === "verified" ? (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="font-medium text-emerald-500">Domain Verified</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              You can now send emails from @{domain.full_domain}
            </p>
          </div>
        ) : domain.status === "failed" ? (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="font-medium text-red-500">Verification Failed</span>
            </div>
            {domain.verification_error && (
              <p className="text-sm text-muted-foreground mt-1">
                {domain.verification_error}
              </p>
            )}
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <h4 className="font-medium text-sm mb-2">How to add DNS records:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Log in to your domain registrar (GoDaddy, Cloudflare, Namecheap, etc.)</li>
              <li>Navigate to DNS settings for {domain.domain}</li>
              <li>Add each record below (copy the values exactly)</li>
              <li>Wait 5-10 minutes for propagation</li>
              <li>Click "Verify Domain" below</li>
            </ol>
          </div>

          <Separator />

          <div className="space-y-4">
            {domain.dns_records && domain.dns_records.length > 0 ? (
              domain.dns_records.map((record, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{getRecordTypeLabel(record.type)}</Badge>
                      {getStatusIcon(record.verified)}
                    </div>
                    {record.priority !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        Priority: {record.priority}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-[80px_1fr_40px] items-center gap-2">
                      <span className="text-xs text-muted-foreground">Host:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate">
                        {record.host}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(record.host, index * 2)}
                      >
                        {copiedIndex === index * 2 ? (
                          <CheckCircle className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-[80px_1fr_40px] items-start gap-2">
                      <span className="text-xs text-muted-foreground pt-1">Value:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                        {record.value}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(record.value, index * 2 + 1)}
                      >
                        {copiedIndex === index * 2 + 1 ? (
                          <CheckCircle className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>DNS records are being generated...</p>
                <p className="text-sm mt-1">Please refresh or try again.</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => window.open("https://mxtoolbox.com/DNSLookup.aspx", "_blank")}
            className="w-full sm:w-auto"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Check DNS Propagation
          </Button>
          <Button
            onClick={() => verifyDomain.mutate()}
            disabled={verifyDomain.isPending || domain.status === "verified"}
            className="w-full sm:w-auto"
          >
            {verifyDomain.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Verify Domain
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
