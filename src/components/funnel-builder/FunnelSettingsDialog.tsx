import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Zap, Link2, TestTube, CheckCircle, AlertCircle, Search, Image } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Funnel, FunnelSettings } from '@/pages/FunnelEditor';

interface FunnelSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funnel: Funnel;
  onSave: () => void;
}

export function FunnelSettingsDialog({ open, onOpenChange, funnel, onSave }: FunnelSettingsDialogProps) {
  const [settings, setSettings] = useState<FunnelSettings>(funnel.settings);
  const [slug, setSlug] = useState(funnel.slug);
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState(funnel.zapier_webhook_url || '');
  const [customWebhooks, setCustomWebhooks] = useState<string[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [webhookResults, setWebhookResults] = useState<Record<string, 'success' | 'error'>>({});

  useEffect(() => {
    setSettings(funnel.settings);
    setSlug(funnel.slug);
    setZapierWebhookUrl(funnel.zapier_webhook_url || '');
    // Parse webhook_urls from funnel
    const urls = Array.isArray(funnel.webhook_urls) ? funnel.webhook_urls : [];
    setCustomWebhooks(urls.filter(u => typeof u === 'string'));
    setWebhookResults({});
  }, [funnel]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('funnels')
        .update({ 
          settings: JSON.parse(JSON.stringify(settings)), 
          slug,
          zapier_webhook_url: zapierWebhookUrl || null,
          webhook_urls: customWebhooks.length > 0 ? customWebhooks : null,
        })
        .eq('id', funnel.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Settings saved' });
      onSave();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate key')) {
        toast({ title: 'URL slug already exists', variant: 'destructive' });
      } else {
        toast({ title: 'Failed to save settings', description: error.message, variant: 'destructive' });
      }
    },
  });

  const updateSetting = (key: keyof FunnelSettings, value: string | null) => {
    setSettings({ ...settings, [key]: value });
  };

  const addCustomWebhook = () => {
    if (!newWebhookUrl) return;
    try {
      new URL(newWebhookUrl); // Validate URL
      setCustomWebhooks([...customWebhooks, newWebhookUrl]);
      setNewWebhookUrl('');
    } catch {
      toast({ title: 'Invalid URL', variant: 'destructive' });
    }
  };

  const removeCustomWebhook = (index: number) => {
    setCustomWebhooks(customWebhooks.filter((_, i) => i !== index));
  };

  const testWebhook = async (url: string, type: string) => {
    if (!url) return;
    
    setTestingWebhook(type);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          test: true,
          funnel_id: funnel.id,
          funnel_name: funnel.name,
          timestamp: new Date().toISOString(),
          message: 'Test webhook from funnel settings',
        }),
      });
      
      setWebhookResults({ ...webhookResults, [type]: 'success' });
      toast({ title: 'Test sent', description: 'Check your webhook endpoint for the test payload' });
    } catch (error) {
      setWebhookResults({ ...webhookResults, [type]: 'error' });
      toast({ title: 'Test failed', description: 'Could not reach the webhook URL', variant: 'destructive' });
    } finally {
      setTestingWebhook(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Funnel Settings</DialogTitle>
          <DialogDescription>
            Configure your funnel appearance and integrations
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">/f/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={settings.logo_url || ''}
                onChange={(e) => updateSetting('logo_url', e.target.value || null)}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => updateSetting('primary_color', e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={settings.primary_color}
                    onChange={(e) => updateSetting('primary_color', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.background_color}
                    onChange={(e) => updateSetting('background_color', e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={settings.background_color}
                    onChange={(e) => updateSetting('background_color', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Default Button Text</Label>
              <Input
                value={settings.button_text}
                onChange={(e) => updateSetting('button_text', e.target.value)}
                placeholder="Continue"
              />
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Favicon URL</Label>
              <Input
                value={settings.favicon_url || ''}
                onChange={(e) => updateSetting('favicon_url', e.target.value || null)}
                placeholder="https://yourdomain.com/favicon.png"
              />
              {settings.favicon_url && (
                <div className="flex items-center gap-2 mt-2">
                  <img 
                    src={settings.favicon_url} 
                    alt="Favicon preview" 
                    className="w-6 h-6 object-contain rounded"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <span className="text-xs text-muted-foreground">Favicon preview</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Custom favicon for your funnel. Required for custom domains.
              </p>
            </div>

            <div className="space-y-2">
              <Label>SEO Title</Label>
              <Input
                value={settings.seo_title || ''}
                onChange={(e) => updateSetting('seo_title', e.target.value || null)}
                placeholder="Your Funnel Title | Brand Name"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                {(settings.seo_title || '').length}/60 characters. Shows in browser tabs and search results.
              </p>
            </div>

            <div className="space-y-2">
              <Label>SEO Description</Label>
              <Textarea
                value={settings.seo_description || ''}
                onChange={(e) => updateSetting('seo_description', e.target.value || null)}
                placeholder="A compelling description of your funnel that appears in search results..."
                maxLength={160}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {(settings.seo_description || '').length}/160 characters. Appears in search engine results.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Social Share Image (OG Image)</Label>
              <Input
                value={settings.seo_image || ''}
                onChange={(e) => updateSetting('seo_image', e.target.value || null)}
                placeholder="https://yourdomain.com/og-image.png"
              />
              {settings.seo_image && (
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <img 
                    src={settings.seo_image} 
                    alt="OG Image preview" 
                    className="w-full max-h-40 object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Image shown when sharing on social media. Recommended: 1200x630px.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6 py-4">
            {/* Meta Pixel */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-blue-600/10 flex items-center justify-center">
                  <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div>
                  <Label className="text-base">Meta Pixel (Facebook)</Label>
                  <p className="text-xs text-muted-foreground">Track conversions and retarget visitors</p>
                </div>
              </div>
              <Input
                value={settings.meta_pixel_id || ''}
                onChange={(e) => updateSetting('meta_pixel_id', e.target.value || null)}
                placeholder="123456789012345"
              />
              <p className="text-xs text-muted-foreground">
                Find your Pixel ID in Meta Events Manager → Data Sources → Your Pixel
              </p>
            </div>

            {/* Google Analytics */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-yellow-500/10 flex items-center justify-center">
                  <svg className="h-4 w-4 text-yellow-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.84 2.998v17.958a3.035 3.035 0 01-3.035 3.035h-.068a3.035 3.035 0 01-3.035-3.035V2.998a3.035 3.035 0 013.035-3.035h.068a3.035 3.035 0 013.035 3.035zM14.67 10.142v10.814a3.035 3.035 0 01-3.035 3.035h-.068a3.035 3.035 0 01-3.035-3.035V10.142a3.035 3.035 0 013.035-3.035h.068a3.035 3.035 0 013.035 3.035zM3.101 20.957a3.035 3.035 0 100-6.07 3.035 3.035 0 000 6.07z"/>
                  </svg>
                </div>
                <div>
                  <Label className="text-base">Google Analytics 4</Label>
                  <p className="text-xs text-muted-foreground">Track visitors and funnel performance</p>
                </div>
              </div>
              <Input
                value={settings.google_analytics_id || ''}
                onChange={(e) => updateSetting('google_analytics_id', e.target.value || null)}
                placeholder="G-XXXXXXXXXX"
              />
              <p className="text-xs text-muted-foreground">
                Find your Measurement ID in GA4 → Admin → Data Streams → Your Stream
              </p>
            </div>

            {/* Google Ads */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center">
                  <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.2 8.5l4.5 7.6c.6 1 1.4 1.6 2.4 1.9l-3.3 5.6c-1.2-.1-2.4-.7-3.2-1.8L.3 16.1c-1-1.7-.4-3.8 1.3-4.8l1.6-2.8zm7.6 13.1l3.3-5.6c.7-.3 1.4-.9 1.8-1.6l4.3-7.4-4.8-2.8L11.1 12c-.4.7-.6 1.5-.5 2.3l-.6 1c-.1.2-.2.4-.3.5l-4.3 7.6 5.4-1.8zm5.4-9.3l4.3-7.4c1-1.7 3.2-2.3 4.9-1.3.8.5 1.4 1.2 1.6 2.1.2.9.1 1.8-.4 2.6l-4.3 7.4-6.1-3.4z"/>
                  </svg>
                </div>
                <div>
                  <Label className="text-base">Google Ads Conversion</Label>
                  <p className="text-xs text-muted-foreground">Track ad conversions (optional)</p>
                </div>
              </div>
              <Input
                value={settings.google_ads_id || ''}
                onChange={(e) => updateSetting('google_ads_id', e.target.value || null)}
                placeholder="AW-XXXXXXXXX"
              />
            </div>

            {/* TikTok Pixel */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-pink-500/10 flex items-center justify-center">
                  <svg className="h-4 w-4 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </div>
                <div>
                  <Label className="text-base">TikTok Pixel</Label>
                  <p className="text-xs text-muted-foreground">Track TikTok ad conversions (optional)</p>
                </div>
              </div>
              <Input
                value={settings.tiktok_pixel_id || ''}
                onChange={(e) => updateSetting('tiktok_pixel_id', e.target.value || null)}
                placeholder="XXXXXXXXXXXXXXXXX"
              />
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Pixels fire automatically: PageView on load, Lead when contact info is captured, and CompleteRegistration on thank you page.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6 py-4">
            {/* GHL Webhook */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center">
                  <Link2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <Label className="text-base">GoHighLevel (GHL)</Label>
                  <p className="text-xs text-muted-foreground">Send leads directly to GHL</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={settings.ghl_webhook_url || ''}
                  onChange={(e) => updateSetting('ghl_webhook_url', e.target.value || null)}
                  placeholder="https://services.leadconnectorhq.com/hooks/..."
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testWebhook(settings.ghl_webhook_url || '', 'ghl')}
                  disabled={!settings.ghl_webhook_url || testingWebhook === 'ghl'}
                >
                  {testingWebhook === 'ghl' ? (
                    <span className="animate-spin">⏳</span>
                  ) : webhookResults['ghl'] === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : webhookResults['ghl'] === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Zapier Webhook */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <Label className="text-base">Zapier</Label>
                  <p className="text-xs text-muted-foreground">Connect to thousands of apps via Zapier</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={zapierWebhookUrl}
                  onChange={(e) => setZapierWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testWebhook(zapierWebhookUrl, 'zapier')}
                  disabled={!zapierWebhookUrl || testingWebhook === 'zapier'}
                >
                  {testingWebhook === 'zapier' ? (
                    <span className="animate-spin">⏳</span>
                  ) : webhookResults['zapier'] === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : webhookResults['zapier'] === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Custom Webhooks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
                    <Link2 className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <Label className="text-base">Custom Webhooks</Label>
                    <p className="text-xs text-muted-foreground">Send leads to any webhook endpoint</p>
                  </div>
                </div>
                {customWebhooks.length > 0 && (
                  <Badge variant="secondary">{customWebhooks.length}</Badge>
                )}
              </div>

              {/* Existing webhooks */}
              {customWebhooks.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={url}
                    onChange={(e) => {
                      const updated = [...customWebhooks];
                      updated[index] = e.target.value;
                      setCustomWebhooks(updated);
                    }}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testWebhook(url, `custom-${index}`)}
                    disabled={testingWebhook === `custom-${index}`}
                  >
                    {testingWebhook === `custom-${index}` ? (
                      <span className="animate-spin">⏳</span>
                    ) : webhookResults[`custom-${index}`] === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : webhookResults[`custom-${index}`] === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCustomWebhook(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Add new webhook */}
              <div className="flex items-center gap-2">
                <Input
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://your-webhook-endpoint.com/..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && addCustomWebhook()}
                />
                <Button size="sm" variant="outline" onClick={addCustomWebhook} disabled={!newWebhookUrl}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Webhooks receive lead data including name, email, phone, answers, and Calendly booking info when a user completes the funnel.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
