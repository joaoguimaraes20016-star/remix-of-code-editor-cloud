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
  lastPublishedAt?: string | null;
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
  lastPublishedAt,
}: PublishModalProps) {
  const queryClient = useQueryClient();
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [justPublished, setJustPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [localPublishedState, setLocalPublishedState] = useState<{
    isPublished: boolean;
    lastPublishedAt: string | null;
    domainId: string | null;
  } | null>(null);
  
  // Get the base URL from window origin
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : '';
  
  const slugUrl = `${baseUrl}/f/${pageSlug}`;
  
  // Use props directly - parent query (useFunnelPersistence) is the source of truth
  // But also track local state to persist published status and domain ID even if query refetches with stale data
  const effectiveDomainId = localPublishedState?.domainId ?? currentDomainId;
  const isPublished = localPublishedState?.isPublished ?? (funnelStatus === 'published');
  const lastPublished = localPublishedState?.lastPublishedAt ?? lastPublishedAt;
  
  // Update local state when props change (but only if they indicate published status or have a domain)
  // This ensures we persist published status and domain ID even if query refetches with stale data
  useEffect(() => {
    if (funnelStatus === 'published' && lastPublishedAt) {
      setLocalPublishedState((prev) => ({
        isPublished: true,
        lastPublishedAt: lastPublishedAt,
        domainId: currentDomainId ?? prev?.domainId ?? null,
      }));
    } else if (currentDomainId) {
      // Also update domain ID if it's provided, even if not published
      setLocalPublishedState((prev) => ({
        isPublished: prev?.isPublished ?? (funnelStatus === 'published'),
        lastPublishedAt: prev?.lastPublishedAt ?? lastPublishedAt,
        domainId: currentDomainId,
      }));
    }
  }, [funnelStatus, lastPublishedAt, currentDomainId]);

  // Reset/update local state when modal opens to ensure fresh data
  // This handles the case where domain was linked while modal was closed
  useEffect(() => {
    if (isOpen) {
      // When modal opens, sync local state with current props
      // This ensures we always show the latest domain and published status
      setLocalPublishedState({
        isPublished: funnelStatus === 'published',
        lastPublishedAt: lastPublishedAt,
        domainId: currentDomainId,
      });
      
      // Invalidate domain query to ensure fresh data when modal opens
      if (currentDomainId) {
        queryClient.invalidateQueries({
          queryKey: ['publish-modal-domain', currentDomainId],
          refetchType: 'active'
        });
      }
    }
  }, [isOpen, currentDomainId, funnelStatus, lastPublishedAt, queryClient]);
  
  // Fetch connected domain using effectiveDomainId with placeholderData to prevent flicker
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
    placeholderData: (previousData) => previousData, // Keep previous data during refetch to prevent flicker
  });

  const domainUrl = linkedDomain ? `https://${linkedDomain.domain}` : null;
  const isDomainActive = linkedDomain?.status === 'verified' && linkedDomain?.ssl_provisioned;
  
  // Format timestamp for display
  const formattedPublishDate = lastPublished 
    ? new Date(lastPublished).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

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
      const now = new Date().toISOString();
      // Set local published state to persist even if query refetches with stale data
      // Preserve domain ID so domain query stays enabled
      setLocalPublishedState((prev) => ({
        isPublished: true,
        lastPublishedAt: now,
        domainId: currentDomainId ?? prev?.domainId ?? null,
      }));
      setJustPublished(true);
      // Optimistic update is handled by useFunnelPersistence.publish
      // Show success state for 3 seconds, then switch to "Update" button
      // Don't auto-close - let user see the updated state
      setTimeout(() => {
        setJustPublished(false);
      }, 3000);
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
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-foreground">
                {isPublished ? 'Update your app' : 'Publish your app'}
              </DialogTitle>
              {isPublished && (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
            </div>
            {isPublished && formattedPublishDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Last published {formattedPublishDate}
              </p>
            )}
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
          </div>

          {/* Published Status Section - Show when live */}
          {isPublished && (
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Your funnel is live!
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenInNewTab(slugUrl)}
                    className="text-xs"
                  >
                    View live
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                  {isDomainActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenInNewTab(domainUrl!)}
                      className="text-xs"
                    >
                      View on custom domain
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Domain Status Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Custom Domain</Label>
            </div>

            {domainLoading ? (
              <div className="p-4 bg-muted/50 rounded-lg border border-border animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted-foreground/20 rounded" />
                  <div className="h-4 w-32 bg-muted-foreground/20 rounded" />
                </div>
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
              </div>
            )}
          </div>

          {/* Publishing Info */}
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Note:</strong>{' '}
              {isPublished 
                ? 'Updating will push your changes live at' 
                : 'Publishing will make your funnel live at'}{' '}
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
                {isPublished ? 'Updating...' : 'Publishing...'}
              </>
            ) : justPublished ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {isPublished ? 'Updated!' : 'Published!'}
              </>
            ) : (
              isPublished ? 'Update' : 'Publish'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
