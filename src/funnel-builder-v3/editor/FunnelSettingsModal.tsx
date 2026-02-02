import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Palette,
  Webhook,
  Globe,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { DomainSetupPanel } from './components/DomainSetupPanel';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FunnelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  funnelId?: string | null;
  teamId?: string | null;
  currentDomainId?: string | null;
  onDomainChange?: (domainId: string | null) => Promise<boolean>;
  defaultSection?: SettingsSection;
}

type SettingsSection = 'general' | 'domain' | 'appearance' | 'advanced';

const sidebarItems: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'domain', label: 'Custom Domain', icon: Globe },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'advanced', label: 'Advanced', icon: Webhook },
];

interface DomainRecord {
  id: string;
  domain: string;
  status: string;
  verified_at: string | null;
  ssl_provisioned: boolean | null;
  dns_a_record_valid?: boolean | null;
  dns_www_valid?: boolean | null;
}

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'Playfair Display', label: 'Playfair Display' },
];

const colorPresets = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
];

export function FunnelSettingsModal({
  isOpen,
  onClose,
  funnelId,
  teamId,
  currentDomainId,
  onDomainChange,
  defaultSection = 'general',
}: FunnelSettingsModalProps) {
  const queryClient = useQueryClient();
  const { funnel, setFunnel } = useFunnel();
  const [activeSection, setActiveSection] = useState<SettingsSection>(defaultSection);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [showDNSSetupDialog, setShowDNSSetupDialog] = useState(false);
  const [domainForSetup, setDomainForSetup] = useState<DomainRecord | null>(null);
  const dnsPanelRef = React.useRef<HTMLDivElement>(null);
  const contentAreaRef = React.useRef<HTMLDivElement>(null);

  // Update section when defaultSection changes (e.g., when opened from publish modal)
  React.useEffect(() => {
    if (isOpen && defaultSection) {
      setActiveSection(defaultSection);
    }
  }, [isOpen, defaultSection]);

  // Reset to default section when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setActiveSection(defaultSection);
      setNewDomainInput('');
      setShowDNSSetupDialog(false);
      setDomainForSetup(null);
    }
  }, [isOpen, defaultSection]);

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
    enabled: !!teamId && activeSection === 'domain' && isOpen,
  });

  // Get currently linked domain
  const linkedDomain = useMemo(() => 
    domains.find(d => d.id === currentDomainId), 
    [domains, currentDomainId]
  );

  // Available domains (not linked to this funnel)
  const availableDomains = useMemo(() => 
    domains.filter(d => d.id !== currentDomainId),
    [domains, currentDomainId]
  );

  // Link domain mutation
  const linkDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      // Remove database update - let parent handle it via onDomainChange
      if (!onDomainChange) throw new Error('No domain change handler');
      const success = await onDomainChange(domainId);
      if (!success) throw new Error('Failed to link domain');
    },
    onSuccess: (_, domainId) => {
      // Parent already invalidates funnel-meta
      // We just need to invalidate our own queries
      queryClient.invalidateQueries({ queryKey: ['funnel-domains', teamId] });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'publish-modal-domain'
      });
      
      // Show DNS setup dialog if we just added this domain
      if (domainForSetup?.id === domainId) {
        setShowDNSSetupDialog(true);
        // Don't show toast - parent already does
      } else {
        // Scroll to DNS panel after linking existing domain
        setTimeout(() => {
          if (dnsPanelRef.current && contentAreaRef.current) {
            const panelTop = dnsPanelRef.current.offsetTop;
            contentAreaRef.current.scrollTo({
              top: panelTop - 20,
              behavior: 'smooth',
            });
          }
        }, 100);
      }
    },
    onError: () => {
      toast.error('Failed to link domain');
    },
  });

  // Unlink domain mutation
  const unlinkDomainMutation = useMutation({
    mutationFn: async () => {
      // Remove database update - let parent handle it via onDomainChange
      if (!onDomainChange) throw new Error('No domain change handler');
      const success = await onDomainChange(null);
      if (!success) throw new Error('Failed to unlink domain');
    },
    onSuccess: () => {
      // Parent already invalidates funnel-meta
      // We just need to invalidate our own queries
      queryClient.invalidateQueries({ queryKey: ['funnel-domains', teamId] });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'publish-modal-domain'
      });
      // Don't show toast - parent already does
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
    onSuccess: async (data) => {
      setNewDomainInput('');
      queryClient.invalidateQueries({ queryKey: ['funnel-domains', teamId] });
      // Auto-link to current funnel
      if (funnelId) {
        // Store domain for setup dialog
        setDomainForSetup(data);
        // Ensure we're on domain tab
        setActiveSection('domain');
        // Link will trigger showing the dialog
        linkDomainMutation.mutate(data.id);
      } else {
        toast.success('Domain added! Link it to a funnel to use it.');
      }
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('This domain is already registered');
      } else {
        toast.error('Failed to add domain');
      }
    },
  });

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

  // Update funnel settings
  const handleUpdateSetting = (key: string, value: any) => {
    setFunnel({
      ...funnel,
      settings: {
        ...funnel.settings,
        [key]: value,
      },
    });
  };

  // Update funnel name
  const handleUpdateName = (name: string) => {
    setFunnel({ ...funnel, name });
  };

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">General Settings</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="funnel-name">Funnel Name</Label>
                  <Input
                    id="funnel-name"
                    value={funnel.name}
                    onChange={(e) => handleUpdateName(e.target.value)}
                    placeholder="My Funnel"
                    className="bg-muted border-0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">/f/</span>
                    <span className="text-sm font-mono">
                      {funnel.name?.toLowerCase().replace(/\s+/g, '-') || 'untitled'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generated from funnel name
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'domain':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Custom Domain</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect a custom domain to serve your funnel on your own URL
              </p>
            </div>

            {domainsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : linkedDomain ? (
              <div className="space-y-4">
                {/* Linked Domain Display */}
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-4">
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
                    >
                      <X className="h-3 w-3 mr-1" />
                      Unlink
                    </Button>
                  </div>

                  {/* DNS Setup Panel */}
                  {teamId && (
                    <DomainSetupPanel
                      domain={linkedDomain}
                      teamId={teamId}
                      defaultExpanded={linkedDomain.status === 'pending' || linkedDomain.status === 'partial'}
                      onVerifyComplete={() => {
                        queryClient.invalidateQueries({ queryKey: ['funnel-domains', teamId] });
                        queryClient.invalidateQueries({ queryKey: ['funnel-meta', funnelId] });
                      }}
                    />
                  )}
                </div>

                {/* Change Domain Option */}
                {availableDomains.length > 0 && (
                  <div className="space-y-2">
                    <Label>Change to another domain</Label>
                    <Select
                      onValueChange={(domainId) => linkDomainMutation.mutate(domainId)}
                    >
                      <SelectTrigger className="bg-muted border-0">
                        <SelectValue placeholder="Select a different domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDomains.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id}>
                            <div className="flex items-center gap-2">
                              <Globe className="h-3 w-3" />
                              {domain.domain}
                              <Badge variant="outline" className={cn('ml-2 text-[10px]', getStatusConfig(domain.status).color)}>
                                {getStatusConfig(domain.status).label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Link Existing Domain */}
                {availableDomains.length > 0 && (
                  <div className="space-y-2">
                    <Label>Link Existing Domain</Label>
                    <Select
                      onValueChange={(domainId) => linkDomainMutation.mutate(domainId)}
                    >
                      <SelectTrigger className="bg-muted border-0">
                        <SelectValue placeholder="Select a domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDomains.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id}>
                            <div className="flex items-center gap-2">
                              <Globe className="h-3 w-3" />
                              {domain.domain}
                              <Badge variant="outline" className={cn('ml-2 text-[10px]', getStatusConfig(domain.status).color)}>
                                {getStatusConfig(domain.status).label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {availableDomains.length > 0 && <Separator />}

                {/* Add New Domain */}
                <div className="space-y-2">
                  <Label>Add New Domain</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newDomainInput}
                      onChange={(e) => setNewDomainInput(e.target.value)}
                      placeholder="yourdomain.com"
                      className="bg-muted border-0"
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
              </div>
            )}
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Appearance</h3>
              <div className="space-y-4">
                {/* Show step indicator */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Step Indicator</Label>
                    <p className="text-xs text-muted-foreground">
                      Display progress dots at the bottom
                    </p>
                  </div>
                  <Switch
                    checked={funnel.settings.showStepIndicator !== false}
                    onCheckedChange={(v) => handleUpdateSetting('showStepIndicator', v)}
                  />
                </div>

                <Separator />

                {/* Primary color */}
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleUpdateSetting('primaryColor', color)}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          funnel.settings.primaryColor === color
                            ? 'border-foreground scale-110'
                            : 'border-transparent hover:scale-105'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <Input
                      type="color"
                      value={funnel.settings.primaryColor || '#3b82f6'}
                      onChange={(e) => handleUpdateSetting('primaryColor', e.target.value)}
                      className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                    />
                  </div>
                </div>

                <Separator />

                {/* Font family */}
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select
                    value={funnel.settings.fontFamily || 'Inter'}
                    onValueChange={(v) => handleUpdateSetting('fontFamily', v)}
                  >
                    <SelectTrigger className="bg-muted border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Advanced Settings</h3>
              <div className="space-y-4">
                {/* Webhook URL */}
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input
                    value={funnel.settings.webhookUrl || ''}
                    onChange={(e) => handleUpdateSetting('webhookUrl', e.target.value)}
                    placeholder="https://hooks.example.com/..."
                    className="bg-muted border-0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Receive form submissions via webhook
                  </p>
                </div>

                <Separator />

                {/* Privacy Policy URL */}
                <div className="space-y-2">
                  <Label>Privacy Policy URL</Label>
                  <Input
                    value={funnel.settings.privacyPolicyUrl || ''}
                    onChange={(e) => handleUpdateSetting('privacyPolicyUrl', e.target.value)}
                    placeholder="https://yoursite.com/privacy"
                    className="bg-muted border-0"
                  />
                </div>

                <Separator />

                {/* Meta Title */}
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input
                    value={funnel.settings.metaTitle || ''}
                    onChange={(e) => handleUpdateSetting('metaTitle', e.target.value)}
                    placeholder="My Amazing Funnel"
                    className="bg-muted border-0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for browser tab and social sharing
                  </p>
                </div>

                {/* Meta Description */}
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Input
                    value={funnel.settings.metaDescription || ''}
                    onChange={(e) => handleUpdateSetting('metaDescription', e.target.value)}
                    placeholder="Describe your funnel..."
                    className="bg-muted border-0"
                  />
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[600px] p-0 gap-0 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-48 border-r border-border bg-muted/30 p-2">
            <DialogHeader className="px-3 py-4">
              <DialogTitle className="text-sm font-semibold">Settings</DialogTitle>
            </DialogHeader>
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors',
                    activeSection === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div ref={contentAreaRef} className="flex-1 overflow-y-auto p-6">
            {renderSectionContent()}
          </div>
        </div>
      </DialogContent>

      {/* DNS Setup Dialog */}
      <Dialog open={showDNSSetupDialog} onOpenChange={setShowDNSSetupDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>DNS Setup for {domainForSetup?.domain}</DialogTitle>
            <DialogDescription>
              Configure these DNS records to activate your custom domain
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {domainForSetup && teamId && (
              <DomainSetupPanel
                domain={domainForSetup}
                teamId={teamId}
                defaultExpanded={true}
                onVerifyComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ['funnel-domains', teamId] });
                  queryClient.invalidateQueries({ queryKey: ['funnel-meta', funnelId] });
                  setShowDNSSetupDialog(false);
                }}
              />
            )}
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowDNSSetupDialog(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
