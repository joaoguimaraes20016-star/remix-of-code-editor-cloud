import React, { useState } from 'react';
import { 
  Settings, 
  Palette,
  Webhook
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { cn } from '@/lib/utils';

interface FunnelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  funnelId?: string | null;
  teamId?: string | null;
  currentDomainId?: string | null;
  onDomainChange?: (domainId: string | null) => void;
}

type SettingsSection = 'general' | 'appearance' | 'advanced';

const sidebarItems: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'advanced', label: 'Advanced', icon: Webhook },
];

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
}: FunnelSettingsModalProps) {
  const { funnel, setFunnel } = useFunnel();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  // Reset to general section when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setActiveSection('general');
    }
  }, [isOpen]);

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
          <div className="flex-1 overflow-y-auto p-6">
            {renderSectionContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
