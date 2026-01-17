import React, { useState } from 'react';
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
  Trash2
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

interface FunnelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    // Theme
    theme?: 'light' | 'dark';
    primary_color?: string;
    font_family?: string;
    page_background?: { type: 'solid' | 'gradient' | 'image' | 'pattern'; color?: string };
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
}

type SettingsSection = 
  | 'overview' 
  | 'colors' 
  | 'branding' 
  | 'social' 
  | 'progress' 
  | 'popup' 
  | 'tracking' 
  | 'integrations';

const sidebarItems: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Settings },
  { id: 'colors', label: 'Colors & Style', icon: Palette },
  { id: 'branding', label: 'Branding', icon: ImageIcon },
  { id: 'social', label: 'Social Preview', icon: Share2 },
  { id: 'progress', label: 'Progress Bar', icon: BarChart3 },
  { id: 'popup', label: 'Pop-Up Gate', icon: Bell },
  { id: 'tracking', label: 'Tracking', icon: BarChart3 },
  { id: 'integrations', label: 'Integrations', icon: Webhook },
];

const presetColors = [
  { name: 'Cyan', value: '#00d4ff' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Yellow', value: '#eab308' },
];

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'DM Sans', label: 'DM Sans' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Space Grotesk', label: 'Space Grotesk' },
];

export const FunnelSettingsModal: React.FC<FunnelSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  pageSlug = '',
  onUpdateSettings,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('overview');
  const [imagePickerTarget, setImagePickerTarget] = useState<'logo' | 'favicon' | 'social' | null>(null);
  const [webhookTestStatus, setWebhookTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});

  const handleTestWebhook = async (url: string, type: string) => {
    if (!url) {
      toast.error('Please enter a webhook URL first');
      return;
    }
    
    setWebhookTestStatus(prev => ({ ...prev, [type]: 'testing' }));
    
    try {
      // Simulate webhook test
      await new Promise(resolve => setTimeout(resolve, 1500));
      setWebhookTestStatus(prev => ({ ...prev, [type]: 'success' }));
      toast.success('Webhook test successful!');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setWebhookTestStatus(prev => ({ ...prev, [type]: 'idle' }));
      }, 3000);
    } catch {
      setWebhookTestStatus(prev => ({ ...prev, [type]: 'error' }));
      toast.error('Webhook test failed');
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
