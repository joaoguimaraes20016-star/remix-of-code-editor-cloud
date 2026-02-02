import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Globe, 
  Copy, 
  Check, 
  ExternalLink, 
  CheckCircle2,
  Info,
  Loader2,
  Clock,
  Sparkles,
  AlertCircle,
  Settings
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
  onOpenSettings?: () => void;
  pageSlug: string;
  pageTitle: string;
  funnelId?: string | null;
  teamId?: string | null;
  currentDomainId?: string | null;
  isPublishing?: boolean;
  funnelStatus?: string;
}

export function PublishModal({
  isOpen,
  onClose,
  onPublish,
  onOpenSettings,
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
  const [justPublished, setJustPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  // Get the base URL from window origin
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : '';
  
  const slugUrl = `${baseUrl}/f/${pageSlug}`;
  
  // Fetch funnel-meta directly when modal opens to ensure fresh domain_id
  const { data: funnelMeta } = useQuery({
    queryKey: ['funnel-meta', funnelId],
    queryFn: async () => {
      if (!funnelId) return null;
      const { data, error } = await supabase
        .from('funnels')
        .select('domain_id')
        .eq('id', funnelId)
        .single();
      if (error) return null;
      return data as { domain_id: string | null };
    },
    enabled: !!funnelId && isOpen,
    staleTime: 0, // Always fetch fresh when modal opens
  });

  // Use query result or fallback to prop for effective domain ID
  const effectiveDomainId = funnelMeta?.domain_id ?? currentDomainId;
  
  // Refetch funnel-meta when modal opens to ensure fresh data
  useEffect(() => {
    if (isOpen && funnelId) {
      queryClient.invalidateQueries({ 
        queryKey: ['funnel-meta', funnelId],
        refetchType: 'active'
      });
    }
  }, [isOpen, funnelId, queryClient]);
  
  // Fetch connected domain using effectiveDomainId
  const { data: linkedDomain, isLoading: domainLoading } = useQuery({
    queryKey: ['publish-modal-domain', effectiveDomainId],
    queryFn: async () => {
      if (!effectiveDomainId) return null;
      const { data, error } = await supabase
        .from('funnel_domains')
        .select('id, domain, status, verified_at, ssl_provisioned')
        .eq('id', effectiveDomainId)
        .single();
      if (error) return null;
      return data as DomainRecord;
    },
    enabled: !!effectiveDomainId && isOpen,
  });

  const isPublished = funnelStatus === 'published';
  const domainUrl = linkedDomain ? `https://${linkedDomain.domain}` : null;
  const isDomainActive = linkedDomain?.status === 'verified' && linkedDomain?.ssl_provisioned;

  const handleCopySlug = () => {
    navigator.clipboard.writeText(slugUrl);
    setCopiedSlug(true);
    toast.success('URL copied!');
    setTimeout(() => setCopiedSlug(false), 2000);
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

  const handleOpenSettings = () => {
    onClose();
    onOpenSettings?.();
  };

  // Get status badge config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'verified':
      case 'active':
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
              <span className="flex-1 text-sm text-foreground font-mono px-2">
                {pageSlug}
              </span>
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

          {/* Domain Status Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Custom Domain</Label>
            </div>

            {domainLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : !linkedDomain ? (
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">No custom domain</span>
                  </div>
                  {onOpenSettings && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenSettings}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Add domain
                    </Button>
                  )}
                </div>
              </div>
            ) : !isDomainActive ? (
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{linkedDomain.domain}</span>
                    <Badge variant="outline" className={cn('text-xs', getStatusConfig(linkedDomain.status).color)}>
                      {React.createElement(getStatusConfig(linkedDomain.status).icon, { className: 'h-3 w-3 mr-1' })}
                      {getStatusConfig(linkedDomain.status).label}
                    </Badge>
                  </div>
                  {onOpenSettings && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenSettings}
                    >
                      Configure
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  DNS configuration required. Click Configure to set up your domain.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{linkedDomain.domain}</span>
                    <Badge variant="outline" className={cn('text-xs', getStatusConfig(linkedDomain.status).color)}>
                      {React.createElement(getStatusConfig(linkedDomain.status).icon, { className: 'h-3 w-3 mr-1' })}
                      {getStatusConfig(linkedDomain.status).label}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      SSL active
                    </span>
                  </div>
                  {onOpenSettings && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenSettings}
                      className="text-xs"
                    >
                      Change
                    </Button>
                  )}
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
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Note:</strong> Publishing will make your funnel live at{' '}
              <span className="font-mono text-xs">{slugUrl}</span>
              {isDomainActive && (
                <>
                  {' '}and{' '}
                  <span className="font-mono text-xs">{domainUrl}</span>
                </>
              )}
            </p>
          </div>
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
