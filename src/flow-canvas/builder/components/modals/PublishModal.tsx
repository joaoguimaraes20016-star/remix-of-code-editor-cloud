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
  Loader2
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
}) => {
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  
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

  const handlePublish = () => {
    onPublish();
    // Don't close - let parent handle success
  };

  const handleOpenInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const handleManageDomain = () => {
    onClose();
    onOpenSettings();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-builder-surface border-builder-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-builder-text flex items-center gap-2">
            <Globe className="w-5 h-5 text-builder-accent" />
            {isPublished ? 'Update' : 'Publish'} "{pageTitle}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Status indicator */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-builder-bg border border-builder-border">
            {isPublished ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-builder-text">
                  Your funnel is <span className="font-medium text-emerald-500">live</span>
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-builder-text">
                  Your funnel is <span className="font-medium text-amber-500">not published</span>
                </span>
              </>
            )}
          </div>

          {/* URLs Section */}
          <div className="space-y-4">
            {/* Slug URL - Always shown */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-builder-text-muted uppercase tracking-wide">
                Funnel URL
              </label>
              <div className="flex items-center gap-2 p-3 bg-builder-bg border border-builder-border rounded-lg">
                <Link2 className="w-4 h-4 text-builder-text-muted shrink-0" />
                <span className="flex-1 text-sm text-builder-text truncate font-mono">
                  {slugUrl}
                </span>
                <Button
                  onClick={handleCopySlug}
                  size="sm"
                  variant="ghost"
                  className="shrink-0 h-8 w-8 p-0 text-builder-text-muted hover:text-builder-text"
                >
                  {copiedSlug ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={() => handleOpenInNewTab(slugUrl)}
                  size="sm"
                  variant="ghost"
                  className="shrink-0 h-8 w-8 p-0 text-builder-text-muted hover:text-builder-text"
                  disabled={!isPublished}
                  title={!isPublished ? 'Publish first to preview' : 'Open in new tab'}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Custom Domain Section */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-builder-text-muted uppercase tracking-wide">
                Custom Domain
              </label>
              
              {domainLoading ? (
                <div className="flex items-center gap-2 p-3 bg-builder-bg border border-builder-border rounded-lg">
                  <Loader2 className="w-4 h-4 text-builder-text-muted animate-spin" />
                  <span className="text-sm text-builder-text-muted">Loading...</span>
                </div>
              ) : linkedDomain ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-builder-bg border border-builder-border rounded-lg">
                    <Globe className="w-4 h-4 text-builder-accent shrink-0" />
                    <span className="flex-1 text-sm text-builder-text truncate font-mono">
                      {domainUrl}
                    </span>
                    {isDomainActive ? (
                      <>
                        <Button
                          onClick={handleCopyDomain}
                          size="sm"
                          variant="ghost"
                          className="shrink-0 h-8 w-8 p-0 text-builder-text-muted hover:text-builder-text"
                        >
                          {copiedDomain ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button
                          onClick={() => handleOpenInNewTab(domainUrl!)}
                          size="sm"
                          variant="ghost"
                          className="shrink-0 h-8 w-8 p-0 text-builder-text-muted hover:text-builder-text"
                          disabled={!isPublished}
                          title={!isPublished ? 'Publish first to preview' : 'Open in new tab'}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-amber-500 font-medium px-2 py-1 bg-amber-500/10 rounded">
                        Pending verification
                      </span>
                    )}
                  </div>
                  
                  {/* Domain status badge */}
                  {isDomainActive && (
                    <div className="flex items-center gap-2 text-xs text-emerald-500">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Domain verified & SSL active</span>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleManageDomain}
                  className="flex items-center gap-3 p-3 w-full bg-builder-bg border border-dashed border-builder-border rounded-lg hover:border-builder-accent/50 hover:bg-builder-surface-hover transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-builder-accent/10 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-builder-accent" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-builder-text group-hover:text-builder-accent transition-colors">
                      Connect Custom Domain
                    </p>
                    <p className="text-xs text-builder-text-muted">
                      Use your own domain like yourbrand.com
                    </p>
                  </div>
                  <Settings className="w-4 h-4 text-builder-text-muted group-hover:text-builder-accent transition-colors" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-builder-border text-builder-text hover:bg-builder-surface-hover"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex-1 bg-builder-accent text-white hover:brightness-110"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isPublished ? 'Updating...' : 'Publishing...'}
                </>
              ) : (
                isPublished ? 'Update' : 'Publish'
              )}
            </Button>
          </div>

          {/* Manage domain link */}
          {linkedDomain && (
            <button
              onClick={handleManageDomain}
              className="w-full text-center text-xs text-builder-text-muted hover:text-builder-accent transition-colors"
            >
              Manage domain settings →
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
