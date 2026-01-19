import React, { useState, useMemo } from 'react';
import { 
  Globe, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2,
  Link2,
  Settings,
  Loader2,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
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
  onPublish: () => void;
  onOpenSettings: () => void;
  pageSlug: string;
  pageTitle: string;
  funnelId?: string;
  teamId?: string;
  currentDomainId?: string | null;
  isPublishing?: boolean;
  funnelStatus?: string;
  lastPublishedAt?: number | null;
  hasUnpublishedChanges?: boolean;
}

// Format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

export const PublishModal: React.FC<PublishModalProps> = ({
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
  hasUnpublishedChanges = false,
}) => {
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [justPublished, setJustPublished] = useState(false);
  
  // Get the base URL from window origin
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://code-hug-hub.lovable.app';
  
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

  // Determine the primary URL (custom domain if active, otherwise slug)
  const primaryUrl = isDomainActive ? domainUrl : slugUrl;
  const secondaryUrl = isDomainActive ? slugUrl : null;

  const handleCopySlug = () => {
    navigator.clipboard.writeText(slugUrl);
    setCopiedSlug(true);
    toast.success('URL copied!');
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  const handleCopyDomain = () => {
    if (domainUrl) {
      navigator.clipboard.writeText(domainUrl);
      setCopiedDomain(true);
      toast.success('Domain URL copied!');
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  };

  const handleCopyPrimary = () => {
    if (isDomainActive) {
      handleCopyDomain();
    } else {
      handleCopySlug();
    }
  };

  const handlePublish = () => {
    onPublish();
    setJustPublished(true);
    // Reset after animation
    setTimeout(() => setJustPublished(false), 3000);
  };

  const handleOpenInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const handleManageDomain = () => {
    onClose();
    onOpenSettings();
  };

  const displayTitle = pageTitle?.trim() || 'Funnel';

  // Status configuration
  const statusConfig = useMemo(() => {
    if (!isPublished) {
      return {
        icon: AlertCircle,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        label: 'Unpublished',
        description: 'Your funnel is not live yet',
      };
    }
    if (hasUnpublishedChanges) {
      return {
        icon: Clock,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        label: 'Has Changes',
        description: 'You have unpublished changes',
      };
    }
    return {
      icon: CheckCircle2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      label: 'Live',
      description: lastPublishedAt ? `Last published ${formatRelativeTime(lastPublishedAt)}` : 'Your funnel is live',
    };
  }, [isPublished, hasUnpublishedChanges, lastPublishedAt]);

  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-builder-surface border-builder-border sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header with status */}
        <div className="p-6 pb-4">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold text-builder-text flex items-center gap-2">
              {isPublished ? 'Update' : 'Publish'} {displayTitle}
            </DialogTitle>
          </DialogHeader>
          
          {/* Status Card */}
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-lg border",
            statusConfig.bgColor,
            statusConfig.borderColor
          )}>
            <div className={cn("p-2 rounded-full", statusConfig.bgColor)}>
              <StatusIcon className={cn("w-5 h-5", statusConfig.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("font-semibold", statusConfig.color)}>
                  {statusConfig.label}
                </span>
                {isPublished && !hasUnpublishedChanges && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                    ✓ Up to date
                  </span>
                )}
              </div>
              <p className="text-sm text-builder-text-muted truncate">
                {statusConfig.description}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Primary URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-builder-text-muted uppercase tracking-wider">
                {isDomainActive ? 'Custom Domain' : 'Funnel URL'}
              </label>
              {isPublished && (
                <button
                  onClick={() => handleOpenInNewTab(primaryUrl!)}
                  className="text-xs text-builder-accent hover:underline flex items-center gap-1"
                >
                  View live
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 p-2.5 bg-builder-bg border border-builder-border rounded-lg group hover:border-builder-accent/50 transition-colors">
              {isDomainActive ? (
                <Globe className="w-4 h-4 text-builder-accent shrink-0 ml-1" />
              ) : (
                <Link2 className="w-4 h-4 text-builder-text-muted shrink-0 ml-1" />
              )}
              <input
                readOnly
                value={primaryUrl || ''}
                className="flex-1 text-sm text-builder-text bg-transparent border-none outline-none font-mono truncate px-2"
              />
              <Button
                onClick={handleCopyPrimary}
                size="icon"
                variant="ghost"
                className="shrink-0 h-7 w-7 text-builder-text-muted hover:text-primary hover:bg-primary/10"
              >
                {(isDomainActive ? copiedDomain : copiedSlug) ? (
                  <Check className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* Secondary URL (slug when domain is active) */}
          {isDomainActive && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-builder-text-muted uppercase tracking-wider">
                Backup URL
              </label>
              <div className="flex items-center gap-1 p-2 bg-builder-bg/50 border border-builder-border/50 rounded-md">
                <Link2 className="w-3.5 h-3.5 text-builder-text-muted shrink-0 ml-1" />
                <span className="flex-1 text-xs text-builder-text-muted font-mono truncate px-2">
                  {slugUrl}
                </span>
              <Button
                  onClick={handleCopySlug}
                  size="icon"
                  variant="ghost"
                  className="shrink-0 h-6 w-6 text-builder-text-muted hover:text-primary hover:bg-primary/10"
                >
                  {copiedSlug ? (
                    <Check className="w-3 h-3 text-primary" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Domain Setup (when no domain connected) */}
          {!linkedDomain && !domainLoading && (
            <button
              onClick={handleManageDomain}
              className="flex items-center gap-3 p-4 w-full bg-builder-bg/30 border border-dashed border-builder-border rounded-lg hover:border-builder-accent/50 hover:bg-builder-surface-hover transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-builder-accent/20 to-builder-accent/5 flex items-center justify-center shrink-0 group-hover:from-builder-accent/30 group-hover:to-builder-accent/10 transition-colors">
                <Globe className="w-5 h-5 text-builder-accent" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-builder-text group-hover:text-builder-accent transition-colors">
                  Connect Custom Domain
                </p>
                <p className="text-xs text-builder-text-muted">
                  Use your own domain like yourbrand.com
                </p>
              </div>
              <Settings className="w-4 h-4 text-builder-text-muted group-hover:text-builder-accent transition-colors shrink-0" />
            </button>
          )}

          {/* Domain pending verification */}
          {linkedDomain && !isDomainActive && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-amber-500 mb-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Domain verification pending</span>
              </div>
              <p className="text-xs text-amber-500/80 pl-6">
                {linkedDomain.domain} is being verified. This usually takes a few minutes.
              </p>
              <button
                onClick={handleManageDomain}
                className="text-xs text-amber-500 hover:underline mt-2 pl-6"
              >
                Check status →
              </button>
            </div>
          )}

          {/* Domain active indicator */}
          {isDomainActive && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-primary">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Domain verified & SSL active</span>
              </div>
              <button
                onClick={handleManageDomain}
                className="text-builder-text-muted hover:text-primary transition-colors"
              >
                Manage →
              </button>
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className="flex items-center gap-3 p-4 border-t border-builder-border bg-builder-bg/30">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 min-w-0 border-builder-border text-builder-text hover:bg-builder-surface-hover"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex-1 min-w-0 text-white transition-all bg-primary hover:bg-primary/90"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isPublished ? 'Updating...' : 'Publishing...'}
              </>
            ) : justPublished ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Published!
              </>
            ) : isPublished ? (
              hasUnpublishedChanges ? 'Update' : 'Republish'
            ) : (
              'Publish'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
