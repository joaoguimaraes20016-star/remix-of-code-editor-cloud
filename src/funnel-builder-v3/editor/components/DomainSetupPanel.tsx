import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DomainRecord {
  id: string;
  domain: string;
  status: string;
  verified_at: string | null;
  ssl_provisioned: boolean | null;
  dns_a_record_valid?: boolean | null;
  dns_www_valid?: boolean | null;
}

interface DomainSetupPanelProps {
  domain: DomainRecord;
  teamId: string;
  onVerifyComplete?: () => void;
  defaultExpanded?: boolean;
}

const VPS_IP = '143.198.103.189';

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'verified':
    case 'active':
      return {
        label: 'Active',
        color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
        icon: CheckCircle,
        description: 'Domain is live and serving your funnel',
      };
    case 'partial':
      return {
        label: 'Almost There',
        color: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
        icon: AlertCircle,
        description: 'One more record needed',
      };
    case 'pending':
    default:
      return {
        label: 'Add DNS Records',
        color: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
        icon: Clock,
        description: 'Configure your DNS settings',
      };
  }
};

export function DomainSetupPanel({ domain, teamId, onVerifyComplete, defaultExpanded }: DomainSetupPanelProps) {
  const queryClient = useQueryClient();
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedIP, setCopiedIP] = useState(false);
  // Default to expanded if domain is pending or if defaultExpanded is true
  const [expanded, setExpanded] = useState(defaultExpanded ?? (domain.status === 'pending' || domain.status === 'partial'));

  const statusConfig = getStatusConfig(domain.status);
  const StatusIcon = statusConfig.icon;
  const isActive = domain.status === 'verified' || domain.status === 'active';

  const handleCopyIP = () => {
    navigator.clipboard.writeText(VPS_IP);
    setCopiedIP(true);
    toast.success('IP address copied!');
    setTimeout(() => setCopiedIP(false), 2000);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-domain', {
        body: { domainId: domain.id, domain: domain.domain },
      });

      queryClient.invalidateQueries({ queryKey: ['funnel-domains', teamId] });
      queryClient.invalidateQueries({ queryKey: ['publish-modal-domain'] });

      if (error) throw error;

      if (data?.status === 'verified') {
        toast.success('Domain verified! Your funnel is now live.');
        onVerifyComplete?.();
      } else if (data?.status === 'partial') {
        toast.info('Partial DNS configuration detected. Please check all records.');
      } else {
        toast.info('DNS not yet configured. Please check your DNS settings.');
      }
    } catch (err) {
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className={cn('rounded-lg p-4 border', statusConfig.color)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className="h-5 w-5" />
            <div>
              <p className="font-medium">{statusConfig.label}</p>
              <p className="text-sm text-muted-foreground">{statusConfig.description}</p>
            </div>
          </div>
          {!isActive && (
            <Button size="sm" variant="outline" onClick={handleVerify} disabled={isVerifying}>
              {isVerifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Verify
                </>
              )}
            </Button>
          )}
        </div>

        {/* Individual record status */}
        {!isActive && (domain.dns_a_record_valid !== null || domain.dns_www_valid !== null) && (
          <div className="mt-3 pt-3 border-t border-current/10 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm">
              {domain.dns_a_record_valid ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span>@ (root domain)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {domain.dns_www_valid ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span>www subdomain</span>
            </div>
            {domain.ssl_provisioned && (
              <div className="flex items-center gap-2 text-sm col-span-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>SSL Certificate (Auto-provisioned)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expandable DNS Instructions */}
      {!isActive && (
        <div className="space-y-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <span>DNS Configuration Instructions</span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {expanded && (
            <div className="space-y-4 pt-2 border-t border-border">
              {/* Step 1 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                    1
                  </div>
                  <h4 className="font-medium text-sm">Go to your DNS provider</h4>
                </div>
                <p className="text-xs text-muted-foreground ml-8">
                  Log in to where you registered your domain (Cloudflare, GoDaddy, Namecheap, etc.)
                </p>
              </div>

              {/* Step 2 - DNS Records */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                    2
                  </div>
                  <h4 className="font-medium text-sm">Add these 2 A records</h4>
                </div>

                <div className="ml-8 bg-muted rounded-lg overflow-hidden border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted-foreground/10">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-xs">Type</th>
                        <th className="text-left px-4 py-2 font-medium text-xs">Name</th>
                        <th className="text-left px-4 py-2 font-medium text-xs">Value</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Root domain A record */}
                      <tr className="border-t border-border">
                        <td className="px-4 py-2">
                          <Badge variant="outline" className="text-xs">A</Badge>
                        </td>
                        <td className="px-4 py-2 font-mono text-xs">@</td>
                        <td className="px-4 py-2 font-mono text-xs">{VPS_IP}</td>
                        <td className="px-2 py-2">
                          <Button variant="ghost" size="sm" onClick={handleCopyIP} className="h-6 w-6 p-0">
                            {copiedIP ? (
                              <Check className="h-3 w-3 text-primary" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </td>
                      </tr>
                      {/* www subdomain A record */}
                      <tr className="border-t border-border">
                        <td className="px-4 py-2">
                          <Badge variant="outline" className="text-xs">A</Badge>
                        </td>
                        <td className="px-4 py-2 font-mono text-xs">www</td>
                        <td className="px-4 py-2 font-mono text-xs">{VPS_IP}</td>
                        <td className="px-2 py-2">
                          <Button variant="ghost" size="sm" onClick={handleCopyIP} className="h-6 w-6 p-0">
                            {copiedIP ? (
                              <Check className="h-3 w-3 text-primary" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="ml-8 text-xs text-muted-foreground">
                  Both records point to the same IP address. This ensures both {domain.domain} and www.{domain.domain} work correctly.
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                    3
                  </div>
                  <h4 className="font-medium text-sm">Wait for DNS propagation</h4>
                </div>
                <p className="text-xs text-muted-foreground ml-8">
                  DNS changes can take up to 24-48 hours to propagate. We'll automatically check and provision SSL once both records are configured.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
