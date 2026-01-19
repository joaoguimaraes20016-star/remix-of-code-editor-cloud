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

  const displayTitle = pageTitle?.trim() || 'Funnel';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-builder-surface border-builder-border sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-builder-text">
              {isPublished ? 'Update' : 'Publish'} {displayTitle}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          {/* Status indicator */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-builder-bg/50">
            {isPublished ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-sm text-builder-text">
                  Your funnel is <span className="font-medium text-emerald-500">live</span>
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-sm text-builder-text">
                  Your funnel is <span className="font-medium text-amber-500">unpublished</span>
                </span>
              </>
            )}
          </div>

          {/* Slug URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-builder-text-muted uppercase tracking-wider">
              Funnel URL
            </label>
            <div className="flex items-center gap-1 p-2 bg-builder-bg border border-builder-border rounded-md">
              <Link2 className="w-4 h-4 text-builder-text-muted shrink-0 ml-1" />
              <input
                readOnly
                value={slugUrl}
                className="flex-1 text-sm text-builder-text bg-transparent border-none outline-none font-mono truncate px-2"
              />
              <Button
                onClick={handleCopySlug}
                size="icon"
                variant="ghost"
                className="shrink-0 h-7 w-7 text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-hover"
              >
                {copiedSlug ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
              <Button
                onClick={() => handleOpenInNewTab(slugUrl)}
                size="icon"
                variant="ghost"
                className="shrink-0 h-7 w-7 text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-hover"
                disabled={!isPublished}
                title={!isPublished ? 'Publish first to preview' : 'Open in new tab'}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Custom Domain Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-builder-text-muted uppercase tracking-wider">
              Custom Domain
            </label>
            
            {domainLoading ? (
              <div className="flex items-center gap-2 p-3 bg-builder-bg border border-builder-border rounded-md">
                <Loader2 className="w-4 h-4 text-builder-text-muted animate-spin" />
                <span className="text-sm text-builder-text-muted">Loading...</span>
              </div>
            ) : linkedDomain ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 p-2 bg-builder-bg border border-builder-border rounded-md">
                  <Globe className="w-4 h-4 text-builder-accent shrink-0 ml-1" />
                  <input
                    readOnly
                    value={domainUrl || ''}
                    className="flex-1 text-sm text-builder-text bg-transparent border-none outline-none font-mono truncate px-2"
                  />
                  {isDomainActive ? (
                    <>
                      <Button
                        onClick={handleCopyDomain}
                        size="icon"
                        variant="ghost"
                        className="shrink-0 h-7 w-7 text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-hover"
                      >
                        {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        onClick={() => handleOpenInNewTab(domainUrl!)}
                        size="icon"
                        variant="ghost"
                        className="shrink-0 h-7 w-7 text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-hover"
                        disabled={!isPublished}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-amber-500 font-medium px-2 py-0.5 bg-amber-500/10 rounded mr-1">
                      Pending
                    </span>
                  )}
                </div>
                
                {isDomainActive && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-500 pl-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Domain verified & SSL active</span>
                  </div>
                )}
                
                <button
                  onClick={handleManageDomain}
                  className="text-xs text-builder-text-muted hover:text-builder-accent transition-colors pl-1"
                >
                  Manage domain →
                </button>
              </div>
            ) : (
              <button
                onClick={handleManageDomain}
                className="flex items-center gap-3 p-3 w-full bg-builder-bg/50 border border-dashed border-builder-border rounded-md hover:border-builder-accent/50 hover:bg-builder-surface-hover transition-colors group"
              >
                <div className="w-8 h-8 rounded-md bg-builder-accent/10 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-builder-accent" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-builder-text group-hover:text-builder-accent transition-colors">
                    Connect Custom Domain
                  </p>
                  <p className="text-xs text-builder-text-muted truncate">
                    Use your own domain like yourbrand.com
                  </p>
                </div>
                <Settings className="w-4 h-4 text-builder-text-muted group-hover:text-builder-accent transition-colors shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Footer with actions */}
        <div className="flex items-center gap-3 p-4 border-t border-builder-border bg-builder-bg/30">
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
      </DialogContent>
    </Dialog>
  );
};
