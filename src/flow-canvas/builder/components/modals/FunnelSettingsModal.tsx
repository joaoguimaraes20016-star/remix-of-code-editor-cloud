import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Palette, 
  Image as ImageIcon, 
  Share2, 
  BarChart3, 
  Bell, 
  Webhook, 
  X,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  Check,
  AlertCircle,
  Upload,
  Trash2,
  History,
  RotateCcw,
  Globe,
  RefreshCw,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  Link2
} from 'lucide-react';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ImagePickerModal } from './ImagePickerModal';
import { toast } from 'sonner';

// Version history entry type
interface VersionHistoryEntry {
  snapshot: unknown;
  timestamp: number;
  name?: string;
}

interface FunnelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    // Theme
    theme?: 'light' | 'dark';
    primary_color?: string;
    font_family?: string;
    page_background?: { type: 'solid' | 'gradient' | 'image' | 'pattern' | 'video'; color?: string; video?: string };
    // Branding
    logo_url?: string;
    favicon_url?: string;
    // SEO
    seo_title?: string;
    seo_description?: string;
    seo_image?: string;
    // Progress
    show_progress_bar?: boolean;
    // Pop-Up Gate
    popup_optin_enabled?: boolean;
    popup_optin_headline?: string;
    popup_optin_subtext?: string;
    popup_optin_fields?: ('name' | 'email' | 'phone')[];
    popup_optin_require_name?: boolean;
    popup_optin_require_phone?: boolean;
    popup_optin_button_text?: string;
    // Tracking
    meta_pixel_id?: string;
    google_analytics_id?: string;
    google_ads_id?: string;
    tiktok_pixel_id?: string;
    // Integrations
    ghl_webhook_url?: string;
    zapier_webhook_url?: string;
    webhook_urls?: string[];
    // Misc
    button_text?: string;
    privacy_policy_url?: string;
  };
  pageSlug?: string;
  onUpdateSettings: (key: string, value: any) => void;
  // Version history props
  versionHistory?: VersionHistoryEntry[];
  onRestoreVersion?: (snapshot: unknown) => void;
  // Domain management props
  funnelId?: string;
  teamId?: string;
  currentDomainId?: string | null;
  onDomainChange?: (domainId: string | null) => void;
}

// Domain record type
interface DomainRecord {
  id: string;
  domain: string;
  status: string;
  ssl_provisioned: boolean | null;
  verified_at: string | null;
  created_at: string;
}

type SettingsSection = 
  | 'overview' 
  | 'domain'
  | 'colors' 
  | 'branding' 
  | 'social' 
  | 'progress' 
  | 'popup' 
  | 'tracking' 
  | 'integrations'
  | 'history';

const sidebarItems: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Settings },
  { id: 'domain', label: 'Custom Domain', icon: Globe },
  { id: 'colors', label: 'Colors & Style', icon: Palette },
  { id: 'branding', label: 'Branding', icon: ImageIcon },
  { id: 'social', label: 'Social Preview', icon: Share2 },
  { id: 'progress', label: 'Progress Bar', icon: BarChart3 },
  { id: 'popup', label: 'Pop-Up Gate', icon: Bell },
  { id: 'tracking', label: 'Tracking', icon: BarChart3 },
  { id: 'integrations', label: 'Integrations', icon: Webhook },
  { id: 'history', label: 'Version History', icon: History },
];

// Import unified presets from single source of truth
import { 
  accentColorPresets as presetColors,
  settingsFontFamilies as fontOptions 
} from '../../utils/presets';

export const FunnelSettingsModal: React.FC<FunnelSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  pageSlug = '',
  onUpdateSettings,
  versionHistory = [],
  onRestoreVersion,
  funnelId,
  teamId,
  currentDomainId,
  onDomainChange,
}) => {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SettingsSection>('overview');
  const [imagePickerTarget, setImagePickerTarget] = useState<'logo' | 'favicon' | 'social' | null>(null);
  const [webhookTestStatus, setWebhookTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  
  // Domain management state
  const [newDomainInput, setNewDomainInput] = useState('');
  const [selectedExistingDomain, setSelectedExistingDomain] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedDNS, setCopiedDNS] = useState(false);

  // Fetch team's domains
  const { data: domains = [], isLoading: domainsLoading } = useQuery({
    queryKey: ['funnel-domains', teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const { data, error } = await supabase
        .from('funnel_domains')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DomainRecord[];
    },
    enabled: !!teamId && activeSection === 'domain',
  });

  // Get currently linked domain
  const linkedDomain = useMemo(() => 
    domains.find(d => d.id === currentDomainId), 
    [domains, currentDomainId]
  );

  // Available domains (verified, not linked to another funnel)
  const availableDomains = useMemo(() => 
    domains.filter(d => d.id !== currentDomainId),
    [domains, currentDomainId]
  );

  // Link domain to funnel mutation
  const linkDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      if (!funnelId) throw new Error('No funnel ID');
      const { error } = await supabase
        .from('funnels')
        .update({ domain_id: domainId })
        .eq('id', funnelId);
      if (error) throw error;
    },
    onSuccess: (_, domainId) => {
      queryClient.invalidateQueries({ queryKey: ['funnel-domains', teamId] });
      queryClient.invalidateQueries({ queryKey: ['funnel-editor', funnelId] });
      onDomainChange?.(domainId);
      toast.success('Domain linked successfully!');
    },
    onError: () => {
      toast.error('Failed to link domain');
    },
  });

  // Unlink domain from funnel mutation
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
      queryClient.invalidateQueries({ queryKey: ['funnel-editor', funnelId] });
      onDomainChange?.(null);
      toast.success('Domain unlinked');
    },
    onError: () => {
      toast.error('Failed to unlink domain');
    },
  });

  // Add new domain mutation
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
    onSuccess: (data) => {
      setNewDomainInput('');
      queryClient.invalidateQueries({ queryKey: ['funnel-domains', teamId] });
      // Auto-link to current funnel
      linkDomainMutation.mutate(data.id);
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

  // Verify domain
  const handleVerifyDomain = async (domain: DomainRecord) => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-domain', {
        body: { domainId: domain.id, domain: domain.domain }
      });
      
      queryClient.invalidateQueries({ queryKey: ['funnel-domains', teamId] });
      
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

  // Copy DNS instructions
  const handleCopyDNS = () => {
    const dnsText = `Type: A | Name: @ | Value: 143.198.103.189\nType: A | Name: www | Value: 143.198.103.189`;
    navigator.clipboard.writeText(dnsText);
    setCopiedDNS(true);
    toast.success('DNS records copied to clipboard');
    setTimeout(() => setCopiedDNS(false), 2000);
  };

  // Get status badge config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'verified':
        return { label: 'Verified', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 };
      case 'partial':
        return { label: 'Partial', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: AlertCircle };
      case 'pending':
      default:
        return { label: 'Pending DNS', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Clock };
    }
  };

  const handleRestoreVersion = async (entry: VersionHistoryEntry, index: number) => {
    if (!onRestoreVersion) return;
    setRestoringVersion(index);
    try {
      await onRestoreVersion(entry.snapshot);
      toast.success('Version restored successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to restore version');
    } finally {
      setRestoringVersion(null);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleTestWebhook = async (url: string, type: string) => {
    if (!url) {
      toast.error('Please enter a webhook URL first');
      return;
    }
    
    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }
    
    setWebhookTestStatus(prev => ({ ...prev, [type]: 'testing' }));
    
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors', // Allow cross-origin requests to external webhooks
        body: JSON.stringify({
          test: true,
          type,
          source: 'stackit',
          timestamp: new Date().toISOString(),
          message: 'This is a test webhook from Infostack',
        }),
      });
      
      // With no-cors mode, we can't check response.ok, so assume success if no error thrown
      setWebhookTestStatus(prev => ({ ...prev, [type]: 'success' }));
      toast.success('Webhook test sent!', {
        description: 'The test payload was sent to your webhook endpoint.',
      });
      
      // Reset after 3 seconds
      setTimeout(() => {
        setWebhookTestStatus(prev => ({ ...prev, [type]: 'idle' }));
      }, 3000);
    } catch (error) {
      setWebhookTestStatus(prev => ({ ...prev, [type]: 'error' }));
      toast.error('Webhook test failed', {
        description: error instanceof Error ? error.message : 'Could not reach the webhook URL',
      });
      
      // Reset after 3 seconds
      setTimeout(() => {
        setWebhookTestStatus(prev => ({ ...prev, [type]: 'idle' }));
      }, 3000);
    }
  };

  const handleImageSelect = (url: string) => {
    if (imagePickerTarget === 'logo') {
      onUpdateSettings('logo_url', url);
    } else if (imagePickerTarget === 'favicon') {
      onUpdateSettings('favicon_url', url);
    } else if (imagePickerTarget === 'social') {
      onUpdateSettings('seo_image', url);
    }
    setImagePickerTarget(null);
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-builder-text mb-1">Overview</h3>
              <p className="text-sm text-builder-text-muted">General funnel settings</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-builder-text">URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-builder-text-muted text-sm">/f/</span>
                  <Input
                    value={pageSlug}
                    disabled
                    className="builder-input flex-1 font-mono text-sm"
                    placeholder="my-funnel"
                  />
                </div>
                <p className="text-xs text-builder-text-muted">
                  The URL slug is set when creating the funnel
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-builder-text">Default Button Text</Label>
                <Input
                  value={settings.button_text || 'Continue'}
                  onChange={(e) => onUpdateSettings('button_text', e.target.value)}
                  className="builder-input"
                  placeholder="Continue"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-builder-text">Privacy Policy URL</Label>
                <Input
                  value={settings.privacy_policy_url || ''}
                  onChange={(e) => onUpdateSettings('privacy_policy_url', e.target.value)}
                  className="builder-input"
                  placeholder="https://example.com/privacy"
                />
              </div>
            </div>
          </div>
        );

      case 'domain':
        const statusConfig = linkedDomain ? getStatusConfig(linkedDomain.status) : null;
        const StatusIcon = statusConfig?.icon || Clock;
        
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-builder-text mb-1">Custom Domain</h3>
              <p className="text-sm text-builder-text-muted">
                Connect your own domain to this funnel
              </p>
            </div>
            
            {!funnelId || !teamId ? (
              <div className="p-4 rounded-lg border border-builder-border bg-builder-bg">
                <p className="text-sm text-builder-text-muted">
                  Save the funnel first to manage custom domains.
                </p>
              </div>
            ) : linkedDomain ? (
              /* Currently Linked Domain Display */
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-builder-border bg-builder-surface">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-builder-accent/10 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-builder-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-builder-text">{linkedDomain.domain}</p>
                        <Badge variant="outline" className={cn('mt-1', statusConfig?.color)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig?.label}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unlinkDomainMutation.mutate()}
                      disabled={unlinkDomainMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {linkedDomain.status === 'verified' ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-emerald-600">
                        Your funnel is live at <a 
                          href={`https://${linkedDomain.domain}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium underline"
                        >
                          {linkedDomain.domain}
                        </a>
                      </span>
                      <ExternalLink className="h-3 w-3 text-emerald-500 ml-auto" />
                    </div>
                  ) : (
                    /* DNS Setup Instructions */
                    <div className="mt-4 space-y-4">
                      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-600">DNS Configuration Required</p>
                            <p className="text-xs text-amber-600/80 mt-1">
                              Add the following DNS records at your domain registrar to verify ownership.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-builder-text text-sm">DNS Records</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyDNS}
                            className="h-7 text-xs"
                          >
                            {copiedDNS ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="bg-builder-bg p-3 rounded-lg border border-builder-border font-mono text-xs space-y-1.5">
                          <div className="flex gap-4">
                            <span className="text-builder-text-muted w-12">Type:</span>
                            <span className="text-builder-text">A</span>
                            <span className="text-builder-text-muted ml-4">Name:</span>
                            <span className="text-builder-text">@</span>
                            <span className="text-builder-text-muted ml-4">Value:</span>
                            <span className="text-builder-accent">143.198.103.189</span>
                          </div>
                          <div className="flex gap-4">
                            <span className="text-builder-text-muted w-12">Type:</span>
                            <span className="text-builder-text">A</span>
                            <span className="text-builder-text-muted ml-4">Name:</span>
                            <span className="text-builder-text">www</span>
                            <span className="text-builder-text-muted ml-4">Value:</span>
                            <span className="text-builder-accent">143.198.103.189</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleVerifyDomain(linkedDomain)}
                        disabled={isVerifying}
                        className="w-full"
                      >
                        {isVerifying ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Checking DNS...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Verify DNS Configuration
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* No Domain Linked - Show Connect Options */
              <div className="space-y-6">
                {/* Connect Existing Domain */}
                {availableDomains.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-builder-text">Link Existing Domain</Label>
                    <p className="text-xs text-builder-text-muted">
                      Select from your team's existing domains
                    </p>
                    <div className="flex gap-2">
                      <Select 
                        value={selectedExistingDomain} 
                        onValueChange={setSelectedExistingDomain}
                      >
                        <SelectTrigger className="builder-input flex-1">
                          <SelectValue placeholder="Select a domain..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          {availableDomains.map(d => (
                            <SelectItem key={d.id} value={d.id}>
                              <div className="flex items-center gap-2">
                                <span>{d.domain}</span>
                                {d.status === 'verified' && (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => {
                          if (selectedExistingDomain) {
                            linkDomainMutation.mutate(selectedExistingDomain);
                            setSelectedExistingDomain('');
                          }
                        }}
                        disabled={!selectedExistingDomain || linkDomainMutation.isPending}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        Link
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Divider if both options exist */}
                {availableDomains.length > 0 && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-builder-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-builder-surface px-2 text-builder-text-muted">Or</span>
                    </div>
                  </div>
                )}
                
                {/* Add New Domain */}
                <div className="space-y-3">
                  <Label className="text-builder-text">Add New Domain</Label>
                  <p className="text-xs text-builder-text-muted">
                    Enter your custom domain to connect it to this funnel
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={newDomainInput}
                      onChange={(e) => setNewDomainInput(e.target.value)}
                      placeholder="yourdomain.com"
                      className="builder-input flex-1"
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
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* DNS Instructions Preview */}
                <div className="p-4 rounded-lg border border-builder-border bg-builder-bg">
                  <h4 className="font-medium text-builder-text mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-builder-text-muted" />
                    DNS Setup Preview
                  </h4>
                  <p className="text-xs text-builder-text-muted mb-3">
                    After adding a domain, you'll need to configure these DNS records at your registrar:
                  </p>
                  <div className="bg-builder-surface p-3 rounded font-mono text-xs space-y-1">
                    <p className="text-builder-text-muted">A Record: @ → 143.198.103.189</p>
                    <p className="text-builder-text-muted">A Record: www → 143.198.103.189</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'colors':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-builder-text mb-1">Colors & Style</h3>
              <p className="text-sm text-builder-text-muted">Customize the look and feel</p>
            </div>
            
            <div className="space-y-6">
              {/* Button & Accent Color */}
              <div className="space-y-3">
                <div>
                  <Label className="text-builder-text">Button & Accent Color</Label>
                  <p className="text-xs text-builder-text-muted mt-1">
                    Used for primary buttons and interactive elements
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => onUpdateSettings('primary_color', color.value)}
                      className={cn(
                        'w-10 h-10 rounded-lg border-2 transition-all',
                        settings.primary_color === color.value
                          ? 'border-builder-text scale-110 ring-2 ring-builder-accent/30'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg border border-builder-border" 
                    style={{ backgroundColor: settings.primary_color || '#00d4ff' }}
                  />
                  <Input
                    value={settings.primary_color || '#00d4ff'}
                    onChange={(e) => onUpdateSettings('primary_color', e.target.value)}
                    className="builder-input flex-1 font-mono text-sm"
                    placeholder="#00d4ff"
                  />
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-3">
                <div>
                  <Label className="text-builder-text">Font Family</Label>
                  <p className="text-xs text-builder-text-muted mt-1">
                    Global typography for your funnel
                  </p>
                </div>
                <Select
                  value={settings.font_family || 'Inter'}
                  onValueChange={(value) => onUpdateSettings('font_family', value)}
                >
                  <SelectTrigger className="builder-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {fontOptions.map((font) => (
                      <SelectItem 
                        key={font.value} 
                        value={font.value}
                        style={{ fontFamily: font.value }}
                      >
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div 
                  className="p-4 bg-builder-bg rounded-lg text-center"
                  style={{ fontFamily: settings.font_family || 'Inter' }}
                >
                  <p className="text-lg font-semibold text-builder-text">The quick brown fox</p>
                  <p className="text-sm text-builder-text-muted">jumps over the lazy dog</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'branding':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-builder-text mb-1">Branding</h3>
              <p className="text-sm text-builder-text-muted">Logo and favicon settings</p>
            </div>
            
            <div className="space-y-4">
              {/* Logo */}
              <div className="space-y-3">
                <Label className="text-builder-text">Logo</Label>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-lg border-2 border-dashed border-builder-border flex items-center justify-center bg-builder-bg overflow-hidden"
                  >
                    {settings.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-builder-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImagePickerTarget('logo')}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                    {settings.logo_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateSettings('logo_url', '')}
                        className="w-full text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-3">
                <Label className="text-builder-text">Favicon</Label>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-lg border-2 border-dashed border-builder-border flex items-center justify-center bg-builder-bg overflow-hidden"
                  >
                    {settings.favicon_url ? (
                      <img src={settings.favicon_url} alt="Favicon" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-builder-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImagePickerTarget('favicon')}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Favicon
                    </Button>
                    {settings.favicon_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateSettings('favicon_url', '')}
                        className="w-full text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-builder-text-muted">
                  Recommended size: 32x32 or 64x64 pixels
                </p>
              </div>
            </div>
          </div>
        );

      case 'social':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-builder-text mb-1">Social Preview</h3>
              <p className="text-sm text-builder-text-muted">How your funnel appears when shared</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-builder-text">SEO Title</Label>
                <Input
                  value={settings.seo_title || ''}
                  onChange={(e) => onUpdateSettings('seo_title', e.target.value)}
                  className="builder-input"
                  placeholder="My Awesome Funnel"
                  maxLength={60}
                />
                <p className="text-xs text-builder-text-muted">
                  {(settings.seo_title?.length || 0)}/60 characters
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-builder-text">SEO Description</Label>
                <Textarea
                  value={settings.seo_description || ''}
                  onChange={(e) => onUpdateSettings('seo_description', e.target.value)}
                  className="builder-input min-h-[80px]"
                  placeholder="A brief description of your funnel..."
                  maxLength={160}
                />
                <p className="text-xs text-builder-text-muted">
                  {(settings.seo_description?.length || 0)}/160 characters
                </p>
              </div>
              
              <div className="space-y-3">
                <Label className="text-builder-text">Share Image</Label>
                <div 
                  className="aspect-[1200/630] rounded-lg border-2 border-dashed border-builder-border flex items-center justify-center bg-builder-bg overflow-hidden cursor-pointer hover:border-builder-accent/50 transition-colors"
                  onClick={() => setImagePickerTarget('social')}
                >
                  {settings.seo_image ? (
                    <img src={settings.seo_image} alt="Share preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-8 h-8 text-builder-text-muted mx-auto mb-2" />
                      <p className="text-sm text-builder-text-muted">Click to upload</p>
                      <p className="text-xs text-builder-text-muted">1200 x 630 recommended</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="space-y-2">
                <Label className="text-builder-text">Preview</Label>
                <div className="rounded-lg border border-builder-border overflow-hidden bg-white">
                  <div className="aspect-[1200/630] bg-gray-100 flex items-center justify-center">
                    {settings.seo_image ? (
                      <img src={settings.seo_image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-gray-400 text-sm">No image</div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">yoursite.com</p>
                    <p className="font-semibold text-gray-900 text-sm line-clamp-1">
                      {settings.seo_title || 'Your Funnel Title'}
                    </p>
                    <p className="text-gray-600 text-xs line-clamp-2 mt-1">
                      {settings.seo_description || 'Your funnel description will appear here...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'progress':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-builder-text mb-1">Progress Bar</h3>
              <p className="text-sm text-builder-text-muted">Show progress indicator to visitors</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-builder-text">Show Progress Bar</Label>
                  <p className="text-xs text-builder-text-muted mt-1">
                    Display completion progress at the top
                  </p>
                </div>
                <Switch
                  checked={settings.show_progress_bar ?? true}
                  onCheckedChange={(checked) => onUpdateSettings('show_progress_bar', checked)}
                />
              </div>

              {/* Visual Preview Cards */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => onUpdateSettings('show_progress_bar', true)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-left',
                    settings.show_progress_bar !== false
                      ? 'border-builder-accent bg-builder-accent/5'
                      : 'border-builder-border hover:border-builder-accent/50'
                  )}
                >
                  <div className="mb-3">
                    <div className="h-1 bg-builder-border rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-builder-accent rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-builder-accent" />
                    <span className="text-sm font-medium text-builder-text">Visible</span>
                  </div>
                </button>
                
                <button
                  onClick={() => onUpdateSettings('show_progress_bar', false)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-left',
                    settings.show_progress_bar === false
                      ? 'border-builder-accent bg-builder-accent/5'
                      : 'border-builder-border hover:border-builder-accent/50'
                  )}
                >
                  <div className="mb-3">
                    <div className="h-1 bg-builder-border/30 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-builder-text-muted" />
                    <span className="text-sm font-medium text-builder-text">Hidden</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case 'popup':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-builder-text mb-1">Pop-Up Gate</h3>
              <p className="text-sm text-builder-text-muted">Collect info before showing content</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-builder-text">Enable Pop-Up Gate</Label>
                  <p className="text-xs text-builder-text-muted mt-1">
                    Show opt-in form before funnel starts
                  </p>
                </div>
                <Switch
                  checked={settings.popup_optin_enabled ?? false}
                  onCheckedChange={(checked) => onUpdateSettings('popup_optin_enabled', checked)}
                />
              </div>

              {settings.popup_optin_enabled && (
                <>
                  <div className="space-y-2">
                    <Label className="text-builder-text">Headline</Label>
                    <Input
                      value={settings.popup_optin_headline || ''}
                      onChange={(e) => onUpdateSettings('popup_optin_headline', e.target.value)}
                      className="builder-input"
                      placeholder="Before we begin..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-builder-text">Subtext</Label>
                    <Textarea
                      value={settings.popup_optin_subtext || ''}
                      onChange={(e) => onUpdateSettings('popup_optin_subtext', e.target.value)}
                      className="builder-input min-h-[60px]"
                      placeholder="Enter your details to continue"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-builder-text">Fields to Collect</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-builder-bg">
                        <span className="text-sm text-builder-text">Email</span>
                        <span className="text-xs text-builder-text-muted bg-builder-accent/20 px-2 py-0.5 rounded">Required</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-builder-bg">
                        <span className="text-sm text-builder-text">Name</span>
                        <Switch
                          checked={settings.popup_optin_require_name ?? false}
                          onCheckedChange={(checked) => onUpdateSettings('popup_optin_require_name', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-builder-bg">
                        <span className="text-sm text-builder-text">Phone</span>
                        <Switch
                          checked={settings.popup_optin_require_phone ?? false}
                          onCheckedChange={(checked) => onUpdateSettings('popup_optin_require_phone', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-builder-text">Button Text</Label>
                    <Input
                      value={settings.popup_optin_button_text || ''}
                      onChange={(e) => onUpdateSettings('popup_optin_button_text', e.target.value)}
                      className="builder-input"
                      placeholder="Get Started"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'tracking':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-builder-text mb-1">Tracking Pixels</h3>
              <p className="text-sm text-builder-text-muted">Connect your analytics and ad platforms</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-builder-text">Meta Pixel ID</Label>
                <Input
                  value={settings.meta_pixel_id || ''}
                  onChange={(e) => onUpdateSettings('meta_pixel_id', e.target.value)}
                  className="builder-input font-mono"
                  placeholder="123456789012345"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-builder-text">Google Analytics ID</Label>
                <Input
                  value={settings.google_analytics_id || ''}
                  onChange={(e) => onUpdateSettings('google_analytics_id', e.target.value)}
                  className="builder-input font-mono"
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-builder-text">Google Ads Conversion ID</Label>
                <Input
                  value={settings.google_ads_id || ''}
                  onChange={(e) => onUpdateSettings('google_ads_id', e.target.value)}
                  className="builder-input font-mono"
                  placeholder="AW-XXXXXXXXXX"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-builder-text">TikTok Pixel ID</Label>
                <Input
                  value={settings.tiktok_pixel_id || ''}
                  onChange={(e) => onUpdateSettings('tiktok_pixel_id', e.target.value)}
                  className="builder-input font-mono"
                  placeholder="XXXXXXXXXX"
                />
              </div>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-builder-text mb-1">Integrations</h3>
              <p className="text-sm text-builder-text-muted">Connect webhooks and external services</p>
            </div>
            
            <div className="space-y-4">
              {/* GHL Webhook */}
              <div className="space-y-2">
                <Label className="text-builder-text">GoHighLevel Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.ghl_webhook_url || ''}
                    onChange={(e) => onUpdateSettings('ghl_webhook_url', e.target.value)}
                    className="builder-input flex-1 font-mono text-sm"
                    placeholder="https://services.leadconnectorhq.com/hooks/..."
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestWebhook(settings.ghl_webhook_url || '', 'ghl')}
                    disabled={webhookTestStatus.ghl === 'testing'}
                  >
                    {webhookTestStatus.ghl === 'testing' ? (
                      <span className="animate-pulse">Testing...</span>
                    ) : webhookTestStatus.ghl === 'success' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : webhookTestStatus.ghl === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Zapier Webhook */}
              <div className="space-y-2">
                <Label className="text-builder-text">Zapier Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.zapier_webhook_url || ''}
                    onChange={(e) => onUpdateSettings('zapier_webhook_url', e.target.value)}
                    className="builder-input flex-1 font-mono text-sm"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestWebhook(settings.zapier_webhook_url || '', 'zapier')}
                    disabled={webhookTestStatus.zapier === 'testing'}
                  >
                    {webhookTestStatus.zapier === 'testing' ? (
                      <span className="animate-pulse">Testing...</span>
                    ) : webhookTestStatus.zapier === 'success' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : webhookTestStatus.zapier === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-builder-border">
                <a 
                  href="https://docs.infostack.io/integrations" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-builder-accent hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  View integration documentation
                </a>
              </div>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-builder-text mb-1">Version History</h3>
              <p className="text-sm text-builder-text-muted">Restore previous published versions of your funnel</p>
            </div>
            
            {versionHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-builder-surface-hover flex items-center justify-center mb-4">
                  <History className="w-6 h-6 text-builder-text-muted" />
                </div>
                <p className="text-builder-text-muted text-sm">No previous versions yet</p>
                <p className="text-builder-text-dim text-xs mt-1">
                  Previous versions will appear here after you publish updates
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {versionHistory.map((entry, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-builder-border bg-builder-bg hover:bg-builder-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-builder-surface-hover flex items-center justify-center">
                        <History className="w-5 h-5 text-builder-text-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-builder-text">
                          {entry.name || `Version ${versionHistory.length - index}`}
                        </p>
                        <p className="text-xs text-builder-text-muted">
                          {formatTimestamp(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreVersion(entry, index)}
                      disabled={restoringVersion !== null}
                      className="gap-2"
                    >
                      {restoringVersion === index ? (
                        <>
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Restoring...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          Restore
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="pt-4 border-t border-builder-border">
              <p className="text-xs text-builder-text-dim">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                Restoring a version will replace your current draft. The current live version will remain published until you publish again.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogPortal>
          <DialogOverlay className="z-[10000]" />
          <DialogPrimitive.Content
            className="fixed left-[50%] top-[50%] z-[10000] w-full max-w-4xl h-[85vh] translate-x-[-50%] translate-y-[-50%] bg-builder-surface border border-builder-border rounded-lg shadow-lg overflow-hidden"
          >
            {/* Hidden title for accessibility */}
            <DialogPrimitive.Title className="sr-only">
              Funnel Settings
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Configure your funnel settings including colors, branding, tracking, and integrations.
            </DialogPrimitive.Description>
            
            <div className="flex h-full pointer-events-auto">
              {/* Sidebar */}
              <div className="w-56 border-r border-builder-border bg-builder-bg flex flex-col shrink-0 pointer-events-auto">
                <div className="p-4 border-b border-builder-border">
                  <h2 className="text-lg font-semibold text-builder-text flex items-center gap-2">
                    <Settings className="w-5 h-5 text-builder-accent" />
                    Funnel Settings
                  </h2>
                </div>
                
                <nav className="flex-1 overflow-y-auto p-2">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1',
                        activeSection === item.id
                          ? 'bg-builder-accent/10 text-builder-accent'
                          : 'text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-hover'
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight className={cn(
                        'w-4 h-4 transition-transform',
                        activeSection === item.id && 'rotate-90'
                      )} />
                    </button>
                  ))}
                </nav>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col min-w-0 pointer-events-auto">
                {/* Header */}
                <div className="h-14 border-b border-builder-border flex items-center justify-end px-4 shrink-0">
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-hover transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {renderSectionContent()}
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={imagePickerTarget !== null}
        onClose={() => setImagePickerTarget(null)}
        onSelectImage={handleImageSelect}
        currentImage={
          imagePickerTarget === 'logo' ? settings.logo_url :
          imagePickerTarget === 'favicon' ? settings.favicon_url :
          imagePickerTarget === 'social' ? settings.seo_image :
          undefined
        }
      />
    </>
  );
};
