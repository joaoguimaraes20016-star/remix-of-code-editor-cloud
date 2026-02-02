import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Globe, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2,
  Info,
  Loader2,
  Clock,
  Sparkles,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DomainRecord {
  id: string;
  domain: string;
  status: string;
  verified_at: string | null;
  ssl_provisioned: boolean | null;
}

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => Promise<boolean>;
  onDomainChange?: (domainId: string | null) => void;
  pageSlug: string;
  pageTitle: string;
  funnelId?: string | null;
  teamId?: string | null;
  currentDomainId?: string | null;
  isPublishing?: boolean;
  funnelStatus?: string;
}

const VPS_IP = '143.198.103.189';

export function PublishModal({
  isOpen,
  onClose,
  onPublish,
  onDomainChange,
  pageSlug,
  pageTitle,
  funnelId,
  teamId,
  currentDomainId,
  isPublishing = false,
  funnelStatus = 'draft',
}: PublishModalProps) {
  const queryClient = useQueryClient();
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [copiedDNS, setCopiedDNS] = useState(false);
  const [justPublished, setJustPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [showDNSInstructions, setShowDNSInstructions] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Get the base URL from window origin
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : '';
  
  const slugUrl = `${baseUrl}/f/${pageSlug}`;
  
  // Fetch connected domain
  const { data: linkedDomain, isLoading: domainLoading } = useQuery({
    queryKey: ['publish-modal-domain', currentDomainId],
    queryFn: async () => {
      if (!currentDomainId) return null;
      const { data, error } = await supabase
        .from('funnel_domains')
        .select('id, domain, status, verified_at, ssl_provisioned')
        .eq('id', currentDomainId)
        .single();
      if (error) return null;
      return data as DomainRecord;
    },
    enabled: !!currentDomainId && isOpen,
  });

  const isPublished = funnelStatus === 'published';
  const domainUrl = linkedDomain ? `https://${linkedDomain.domain}` : null;
  const isDomainActive = linkedDomain?.status === 'verified' && linkedDomain?.ssl_provisioned;

  // Add domain mutation
  const addDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      if (!teamId) throw new Error('No team ID');
      const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
      const { data, error } = await supabase
        .from('funnel_domains')
        .insert({
          team_id: teamId,
          domain: cleanDomain,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data as DomainRecord;
    },
    onSuccess: async (data) => {
      setNewDomainInput('');
      setShowAddDomain(false);
      queryClient.invalidateQueries({ queryKey: ['funnel-domains', teamId] });
      queryClient.invalidateQueries({ queryKey: ['publish-modal-domain', currentDomainId] });
      
      // Auto-link to current funnel
      if (funnelId) {
        const { error } = await supabase
          .from('funnels')
          .update({ domain_id: data.id })
          .eq('id', funnelId);
        if (!error) {
          onDomainChange?.(data.id);
          queryClient.invalidateQueries({ queryKey: ['funnel-meta', funnelId] });
        }
      }
      
      setShowDNSInstructions(true);
      toast.success('Domain added! Configure your DNS settings below.');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('This domain is already registered');
      } else {
        toast.error('Failed to add domain');
      }
    },
  });

  // Unlink domain mutation
  const unlinkDomainMutation = useMutation({
    mutationFn: async () => {
      if (!funnelId) throw new Error('No funnel ID');
      const { error } = await supabase
        .from('funnels')
        .update({ domain_id: null })
        .eq('id', funnelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-domains', teamId] });
      queryClient.invalidateQueries({ queryKey: ['publish-modal-domain', currentDomainId] });
      queryClient.invalidateQueries({ queryKey: ['funnel-meta', funnelId] });
      onDomainChange?.(null);
      toast.success('Domain removed');
    },
    onError: () => {
      toast.error('Failed to remove domain');
    },
  });

  // Verify domain
  const handleVerifyDomain = async () => {
    if (!linkedDomain) return;
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-domain', {
        body: { domainId: linkedDomain.id, domain: linkedDomain.domain }
      });
      
      queryClient.invalidateQueries({ queryKey: ['funnel-domains', teamId] });
      queryClient.invalidateQueries({ queryKey: ['publish-modal-domain', currentDomainId] });
      
      if (error) throw error;
      
      if (data?.status === 'verified') {
        toast.success('Domain verified! Your funnel is now live.');
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

  const handleCopySlug = () => {
    navigator.clipboard.writeText(slugUrl);
    setCopiedSlug(true);
    toast.success('URL copied!');
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  const handleCopyDNS = () => {
    const dnsText = `Type: A | Name: @ | Value: ${VPS_IP}\nType: A | Name: www | Value: ${VPS_IP}`;
    navigator.clipboard.writeText(dnsText);
    setCopiedDNS(true);
    toast.success('DNS records copied to clipboard');
    setTimeout(() => setCopiedDNS(false), 2000);
  };

  const handlePublish = async () => {
    setPublishing(true);
    const success = await onPublish();
    setPublishing(false);
    if (success) {
      setJustPublished(true);
      setTimeout(() => {
        setJustPublished(false);
        onClose();
      }, 2000);
    }
  };

  const handleOpenInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  // Get status badge config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'verified':
        return { label: 'Active', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 };
      case 'partial':
        return { label: 'Partial', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: AlertCircle };
      case 'pending':
      default:
        return { label: 'Pending DNS', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Clock };
    }
  };

  const isCurrentlyPublishing = isPublishing || publishing;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              Publish your app
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {/* Published URL Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="published-url" className="text-sm font-medium">
                Published URL
              </Label>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1 p-2.5 bg-muted border border-border rounded-lg">
              <span className="text-sm text-muted-foreground font-mono shrink-0">
                {baseUrl}/f/
              </span>
              <Input
                id="published-url"
                readOnly
                value={pageSlug}
                className="flex-1 border-0 bg-transparent font-mono text-sm px-0"
              />
              <Button
                onClick={handleCopySlug}
                size="icon"
                variant="ghost"
                className="shrink-0 h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                {copiedSlug ? (
                  <Check className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
            {isPublished && (
              <button
                onClick={() => handleOpenInNewTab(slugUrl)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View live
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Domain Section */}
          <div className="space-y-3">
            {!linkedDomain && !domainLoading && (
              <>
                {!showAddDomain ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDomain(true)}
                    className="w-full justify-start"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Add custom domain
                  </Button>
                ) : (
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Custom Domain</Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowAddDomain(false);
                          setNewDomainInput('');
                        }}
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newDomainInput}
                        onChange={(e) => setNewDomainInput(e.target.value)}
                        placeholder="yourdomain.com"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newDomainInput.trim()) {
                            addDomainMutation.mutate(newDomainInput.trim());
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          if (newDomainInput.trim()) {
                            addDomainMutation.mutate(newDomainInput.trim());
                          }
                        }}
                        disabled={!newDomainInput.trim() || addDomainMutation.isPending}
                      >
                        {addDomainMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Add'
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter your domain without http:// or https://
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Domain Pending */}
            {linkedDomain && !isDomainActive && (
              <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="font-medium">{linkedDomain.domain}</span>
                    <Badge variant="outline" className={cn('text-xs', getStatusConfig(linkedDomain.status).color)}>
                      {React.createElement(getStatusConfig(linkedDomain.status).icon, { className: 'h-3 w-3 mr-1' })}
                      {getStatusConfig(linkedDomain.status).label}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unlinkDomainMutation.mutate()}
                    disabled={unlinkDomainMutation.isPending}
                    className="text-xs"
                  >
                    Remove
                  </Button>
                </div>

                {/* DNS Instructions */}
                <div className="space-y-2">
                  <button
                    onClick={() => setShowDNSInstructions(!showDNSInstructions)}
                    className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>DNS Configuration</span>
                    {showDNSInstructions ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  
                  {showDNSInstructions && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Add these A records to your DNS provider:
                      </p>
                      <div className="bg-background rounded-md p-3 space-y-2 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type: A | Name: @</span>
                          <span>{VPS_IP}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type: A | Name: www</span>
                          <span>{VPS_IP}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCopyDNS}
                          className="flex-1"
                        >
                          {copiedDNS ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copy DNS Records
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleVerifyDomain}
                          disabled={isVerifying}
                        >
                          {isVerifying ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Verify
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Domain Active */}
            {isDomainActive && (
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="font-medium">{linkedDomain.domain}</span>
                    <Badge variant="outline" className={cn('text-xs', getStatusConfig(linkedDomain.status).color)}>
                      {React.createElement(getStatusConfig(linkedDomain.status).icon, { className: 'h-3 w-3 mr-1' })}
                      {getStatusConfig(linkedDomain.status).label}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      SSL active
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unlinkDomainMutation.mutate()}
                    disabled={unlinkDomainMutation.isPending}
                    className="text-xs"
                  >
                    Remove
                  </Button>
                </div>
                {isPublished && (
                  <button
                    onClick={() => handleOpenInNewTab(domainUrl!)}
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                  >
                    View live on custom domain
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Publishing Info */}
          {isDomainActive && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Note:</strong> Publishing will make your funnel available at both{' '}
                <span className="font-mono text-xs">{slugUrl}</span> and{' '}
                <span className="font-mono text-xs">{domainUrl}</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className="flex items-center gap-3 p-4 border-t border-border bg-muted/30">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 min-w-0"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isCurrentlyPublishing}
            className="flex-1 min-w-0"
          >
            {isCurrentlyPublishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : justPublished ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Published!
              </>
            ) : (
              'Publish'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
