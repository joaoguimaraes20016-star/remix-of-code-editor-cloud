import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Block, CountryCode, FormContent, PhoneCaptureContent } from '@/funnel-builder-v3/types/funnel';
import { blockDefinitions } from '@/funnel-builder-v3/lib/block-definitions';
import { 
  InspectorSection, 
  IconToggleRow, 
  LabeledToggleRow,
  VisualSlider, 
  ColorSwatchPicker,
  InlineColorPicker,
  NumberStepper,
  ToggleSwitchRow,
  TextInputRow,
  TextAlignControls,
  TextStyleControls,
  ImageGridPicker,
  QuickActions,
  PresetPicker,
  NichePresetPicker,
  GradientColorPicker,
  GradientPicker,
  TrackingSection,
} from './InspectorUI';
import { allButtonPresets, allHeadingPresets } from '@/funnel-builder-v3/lib/niche-presets';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MediaPicker } from '@/funnel-builder-v3/editor/MediaPicker';
import { BrandfetchPicker } from '@/funnel-builder-v3/editor/BrandfetchPicker';
import { IconPicker } from '@/funnel-builder-v3/editor/IconPicker';
import { CountryCodeModal } from '@/funnel-builder-v3/editor/components/CountryCodeModal';
import { 
  Type, Image, Star, Play, Calendar, Users, Quote,
  AlignLeft, AlignCenter, AlignRight,
  Square, Circle, Minus, Plus, Trash2, GripVertical,
  Clock, Mail, Phone, ListChecks, ChevronDown, Upload, Check, Info
} from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { generateTrackingId } from '@/funnel-builder-v3/lib/tracking-ids';

// Helper function to strip HTML tags for display in inspector inputs
function stripHtmlTags(html: string): string {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

interface BlockInspectorProps {
  block: Block;
  onContentChange: (updates: any) => void;
  onStyleChange: (updates: any) => void;
  onBlockChange?: (updates: Partial<Block>) => void;
}

// ========== POPUP SETTINGS SECTION (reusable for interactive blocks) ==========
function PopupSettingsSection({ content, onContentChange }: { content: any; onContentChange: (updates: any) => void }) {
  const popupSettings = content.popupSettings || { enabled: false, trigger: 'on-load', delay: 3, required: false };
  
  const updatePopupSettings = (updates: any) => {
    onContentChange({
      popupSettings: { ...popupSettings, ...updates }
    });
  };

  return (
    <>
      <Separator />
      <InspectorSection title="Popup Settings">
        <div className="space-y-3">
          <ToggleSwitchRow
            label="Show as Popup"
            checked={popupSettings.enabled || false}
            onChange={(v) => updatePopupSettings({ enabled: v })}
          />
          
          {popupSettings.enabled && (
            <>
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Trigger</span>
                <LabeledToggleRow
                  value={popupSettings.trigger || 'on-load'}
                  onChange={(v) => updatePopupSettings({ trigger: v })}
                  options={[
                    { value: 'on-load', label: 'On Load' },
                    { value: 'on-delay', label: 'Delay' },
                    { value: 'on-click', label: 'On Click' },
                  ]}
                />
              </div>
              
              {popupSettings.trigger === 'on-delay' && (
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Delay (seconds)</span>
                  <VisualSlider
                    value={popupSettings.delay || 3}
                    onChange={(v) => updatePopupSettings({ delay: v })}
                    min={1}
                    max={30}
                    unit="s"
                  />
                </div>
              )}
              
              <ToggleSwitchRow
                label="Required (must complete)"
                checked={popupSettings.required || false}
                onChange={(v) => updatePopupSettings({ required: v })}
              />
              
              {popupSettings.required && (
                <p className="text-[10px] text-muted-foreground px-1">
                  User cannot close this popup without completing the form.
                </p>
              )}
            </>
          )}
        </div>
      </InspectorSection>
    </>
  );
}

// ========== PRIVACY CONSENT SECTION (reusable for conversion blocks) ==========
function PrivacyConsentSection({ content, onContentChange }: { content: any; onContentChange: (updates: any) => void }) {
  const consent = content.consent || { enabled: false, text: 'I have read and accept the', linkText: 'privacy policy', linkUrl: '#', required: true };
  
  const updateConsent = (updates: any) => {
    onContentChange({
      consent: { ...consent, ...updates }
    });
  };

  return (
    <>
      <Separator />
      <InspectorSection title="Privacy Consent">
        <div className="space-y-3">
          <ToggleSwitchRow
            label="Show Privacy Checkbox"
            checked={consent.enabled}
            onChange={(v) => updateConsent({ enabled: v })}
          />
          
          {consent.enabled && (
            <>
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Consent Text</span>
                <Input
                  value={consent.text}
                  onChange={(e) => updateConsent({ text: e.target.value })}
                  className="h-8 bg-muted border-0"
                  placeholder="I have read and accept the"
                />
              </div>
              
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Link Text</span>
                <Input
                  value={consent.linkText}
                  onChange={(e) => updateConsent({ linkText: e.target.value })}
                  className="h-8 bg-muted border-0"
                  placeholder="privacy policy"
                />
              </div>
              
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Link URL</span>
                <Input
                  value={consent.linkUrl}
                  onChange={(e) => updateConsent({ linkUrl: e.target.value })}
                  className="h-8 bg-muted border-0"
                  placeholder="https://example.com/privacy"
                />
              </div>
              
              <ToggleSwitchRow
                label="Required"
                checked={consent.required}
                onChange={(v) => updateConsent({ required: v })}
              />
            </>
          )}
        </div>
      </InspectorSection>
    </>
  );
}

// ========== HEADING PRESETS (Style-only, don't change layout/level) ==========
const headingPresets = [
  {
    id: 'hero',
    name: 'Hero',
    preview: <div className="font-bold text-[10px] leading-none">HERO</div>,
    config: { styles: { fontWeight: 800, textAlign: 'center' } }
  },
  {
    id: 'section',
    name: 'Section',
    preview: <div className="font-semibold text-[9px] leading-none">Section</div>,
    config: { styles: { fontWeight: 700, textAlign: 'left' } }
  },
  {
    id: 'subtitle',
    name: 'Subtitle',
    preview: <div className="text-[8px] text-muted-foreground leading-none">subtitle</div>,
    config: { styles: { fontWeight: 400, color: '#6b7280' } }
  },
  {
    id: 'profit',
    name: 'Profit',
    preview: <div className="text-[10px] font-bold leading-none" style={{ color: '#ffd700' }}>$$$</div>,
    config: { styles: { fontWeight: 800, color: '#ffd700', textAlign: 'center' } }
  },
  {
    id: 'stats',
    name: 'Stats',
    preview: <div className="text-[10px] font-black leading-none" style={{ color: '#10b981' }}>89%</div>,
    config: { styles: { fontWeight: 900, color: '#10b981', textAlign: 'center' } }
  },
  {
    id: 'authority',
    name: 'Authority',
    preview: <div className="text-[9px] font-bold leading-none" style={{ color: '#6366f1' }}>Pro</div>,
    config: { styles: { fontWeight: 700, color: '#6366f1', textAlign: 'center' } }
  },
];

// Font sizes for each heading level (mobile-friendly)
const headingLevelSizes: Record<number, number> = {
  1: 36,
  2: 28,
  3: 24,
  4: 20,
  5: 18,
  6: 16,
};

// ========== HEADING INSPECTOR ==========
export function HeadingInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;
  const styles = content.styles || {};

  // Quick styles only affect styling, not level/layout
  const handlePresetApply = (config: Record<string, any>) => {
    onContentChange({ 
      styles: { ...styles, ...config.styles } 
    });
  };

  // H1-H6 selector changes both level and font size
  const handleLevelChange = (newLevel: number) => {
    onContentChange({ 
      level: newLevel,
      styles: { ...styles, fontSize: headingLevelSizes[newLevel] }
    });
  };

  return (
    <div className="space-y-4">
      <PresetPicker
        presets={headingPresets}
        currentConfig={{ level: content.level, styles }}
        onApply={handlePresetApply}
      />

      <Separator />

      <InspectorSection title="Text">
        <Input
          value={stripHtmlTags(content.text)}
          onChange={(e) => onContentChange({ text: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Enter heading..."
        />
        <p className="text-[10px] text-muted-foreground">Double-click on canvas to edit inline</p>
      </InspectorSection>

      <InspectorSection title="Size">
        <IconToggleRow
          value={String(content.level)}
          onChange={(v) => handleLevelChange(parseInt(v))}
          options={[
            { value: '1', icon: <span className="text-sm font-bold">H1</span>, label: 'Heading 1' },
            { value: '2', icon: <span className="text-sm font-bold">H2</span>, label: 'Heading 2' },
            { value: '3', icon: <span className="text-sm font-semibold">H3</span>, label: 'Heading 3' },
            { value: '4', icon: <span className="text-xs font-semibold">H4</span>, label: 'Heading 4' },
            { value: '5', icon: <span className="text-xs font-medium">H5</span>, label: 'Heading 5' },
            { value: '6', icon: <span className="text-[10px] font-medium">H6</span>, label: 'Heading 6' },
          ]}
        />
      </InspectorSection>

      <InspectorSection title="Alignment">
        <TextAlignControls
          value={styles.textAlign || 'left'}
          onChange={(v) => onContentChange({ styles: { ...styles, textAlign: v } })}
        />
      </InspectorSection>

      <InspectorSection title="Font Size">
        <VisualSlider
          icon={<Type className="h-4 w-4" />}
          value={styles.fontSize || 32}
          onChange={(v) => onContentChange({ styles: { ...styles, fontSize: v } })}
          min={12}
          max={48}
          unit="px"
        />
      </InspectorSection>

      <InspectorSection title="Weight">
        <IconToggleRow
          value={String(styles.fontWeight || 700)}
          onChange={(v) => onContentChange({ styles: { ...styles, fontWeight: parseInt(v) } })}
          options={[
            { value: '400', icon: <span className="text-xs font-normal">Reg</span>, label: 'Regular' },
            { value: '500', icon: <span className="text-xs font-medium">Med</span>, label: 'Medium' },
            { value: '600', icon: <span className="text-xs font-semibold">Semi</span>, label: 'Semibold' },
            { value: '700', icon: <span className="text-xs font-bold">Bold</span>, label: 'Bold' },
          ]}
        />
      </InspectorSection>

      <InspectorSection title="Color">
        <GradientColorPicker
          solidColor={styles.color || '#000000'}
          gradient={styles.textGradient || ''}
          onSolidChange={(v) => onContentChange({ styles: { ...styles, color: v, textGradient: '' } })}
          onGradientChange={(v) => onContentChange({ styles: { ...styles, textGradient: v } })}
        />
      </InspectorSection>

      <Separator />
      {onBlockChange && (
        <TrackingSection
          trackingId={block.trackingId || ''}
          onChange={(id) => onBlockChange({ trackingId: id })}
        />
      )}
    </div>
  );
}

// ========== TEXT PRESETS ==========
const textPresets = [
  {
    id: 'body',
    name: 'Body',
    preview: <div className="text-[8px] leading-none">Body text</div>,
    config: { styles: { fontSize: 16, fontWeight: 400, color: '#374151' } }
  },
  {
    id: 'lead',
    name: 'Lead',
    preview: <div className="text-[9px] text-muted-foreground leading-none">Lead para</div>,
    config: { styles: { fontSize: 18, fontWeight: 400, color: '#6b7280' } }
  },
  {
    id: 'caption',
    name: 'Caption',
    preview: <div className="text-[7px] uppercase text-muted-foreground leading-none">CAPTION</div>,
    config: { styles: { fontSize: 12, fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase' } }
  },
  {
    id: 'quote',
    name: 'Quote',
    preview: <div className="text-[8px] italic leading-none">"Quote"</div>,
    config: { styles: { fontSize: 20, fontWeight: 400, fontStyle: 'italic', color: '#4b5563' } }
  },
];

// ========== TEXT INSPECTOR ==========
export function TextInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;
  const styles = content.styles || {};

  const handlePresetApply = (config: Record<string, any>) => {
    onContentChange({ styles: { ...styles, ...config.styles } });
  };

  return (
    <div className="space-y-4">
      <PresetPicker
        presets={textPresets}
        currentConfig={{ styles }}
        onApply={handlePresetApply}
      />

      <Separator />

      <InspectorSection title="Text">
        <Textarea
          value={stripHtmlTags(content.text)}
          onChange={(e) => onContentChange({ text: e.target.value })}
          className="min-h-[80px] bg-muted border-0 resize-none"
          placeholder="Enter text..."
        />
      </InspectorSection>

      <InspectorSection title="Alignment">
        <TextAlignControls
          value={styles.textAlign || 'left'}
          onChange={(v) => onContentChange({ styles: { ...styles, textAlign: v } })}
        />
      </InspectorSection>

      <InspectorSection title="Font Size">
        <VisualSlider
          icon={<Type className="h-4 w-4" />}
          value={styles.fontSize || 16}
          onChange={(v) => onContentChange({ styles: { ...styles, fontSize: v } })}
          min={10}
          max={32}
          unit="px"
        />
      </InspectorSection>

      <InspectorSection title="Line Height">
        <VisualSlider
          icon={<span className="text-[10px] font-medium">↕</span>}
          value={styles.lineHeight ?? 1.5}
          onChange={(v) => onContentChange({ styles: { ...styles, lineHeight: v } })}
          min={0.8}
          max={3}
          step={0.1}
          unit=""
        />
      </InspectorSection>

      <InspectorSection title="Letter Spacing">
        <VisualSlider
          icon={<span className="text-[10px] font-medium">↔</span>}
          value={styles.letterSpacing ?? 0}
          onChange={(v) => onContentChange({ styles: { ...styles, letterSpacing: v } })}
          min={-2}
          max={10}
          step={0.5}
          unit="px"
        />
      </InspectorSection>

      <InspectorSection title="Color">
        <GradientColorPicker
          solidColor={styles.color || '#6b7280'}
          gradient={styles.textGradient || ''}
          onSolidChange={(v) => onContentChange({ styles: { ...styles, color: v, textGradient: '' } })}
          onGradientChange={(v) => onContentChange({ styles: { ...styles, textGradient: v } })}
        />
      </InspectorSection>

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== BUTTON PRESETS (Enhanced with niche-specific styles) ==========
// Note: borderRadius is controlled via Style tab, not content
const buttonPresets = [
  {
    id: 'primary',
    name: 'Primary',
    preview: <div className="w-full h-3 bg-primary rounded" />,
    config: { variant: 'primary', backgroundColor: '#3b82f6', size: 'lg' }
  },
  {
    id: 'success',
    name: 'Success',
    preview: <div className="w-full h-3 bg-green-500 rounded" />,
    config: { variant: 'primary', backgroundColor: '#10b981', size: 'lg' }
  },
  {
    id: 'gold',
    name: 'Gold',
    preview: <div className="w-full h-3 rounded" style={{ backgroundColor: '#ffd700' }} />,
    config: { variant: 'primary', backgroundColor: '#ffd700', color: '#000000', size: 'lg' }
  },
  {
    id: 'urgency',
    name: 'Urgency',
    preview: <div className="w-full h-3 bg-red-500 rounded" />,
    config: { variant: 'primary', backgroundColor: '#dc2626', size: 'lg' }
  },
  {
    id: 'agency',
    name: 'Agency',
    preview: <div className="w-full h-3 bg-blue-500 rounded-full" />,
    config: { variant: 'primary', backgroundColor: '#3b82f6', size: 'lg' }
  },
  {
    id: 'premium',
    name: 'Premium',
    preview: <div className="w-full h-3 rounded" style={{ backgroundColor: '#0f172a' }} />,
    config: { variant: 'primary', backgroundColor: '#0f172a', size: 'lg' }
  },
  {
    id: 'warm',
    name: 'Warm',
    preview: <div className="w-full h-3 rounded-xl" style={{ backgroundColor: '#f59e0b' }} />,
    config: { variant: 'primary', backgroundColor: '#f59e0b', color: '#000000', size: 'lg' }
  },
  {
    id: 'outline',
    name: 'Outline',
    preview: <div className="w-full h-3 border-2 border-foreground rounded" />,
    config: { variant: 'outline', size: 'lg', borderColor: '#3b82f6', borderWidth: 2, color: '#3b82f6' }
  },
];

// ========== BUTTON INSPECTOR ==========
export function ButtonInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;

  const buttonColors = [
    '#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#ec4899', '#000000', '#ffffff', '#6b7280'
  ];

  const textColors = [
    '#ffffff', '#000000', '#6b7280', '#f59e0b', '#10b981',
  ];

  const handlePresetApply = (config: Record<string, any>) => {
    onContentChange({ ...config });
  };

  return (
    <div className="space-y-4">
      <PresetPicker
        presets={buttonPresets}
        currentConfig={content}
        onApply={handlePresetApply}
      />

      <Separator />

      <InspectorSection title="Button Text">
        <Input
          value={content.text}
          onChange={(e) => onContentChange({ text: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Click me"
        />
      </InspectorSection>

      <InspectorSection title="Action">
        <LabeledToggleRow
          value={content.action || 'next-step'}
          onChange={(v) => onContentChange({ action: v })}
          options={[
            { value: 'next-step', label: 'Next Step' },
            { value: 'submit', label: 'Submit' },
            { value: 'url', label: 'URL' },
            { value: 'webhook', label: 'Webhook' },
            { value: 'scroll', label: 'Scroll' },
          ]}
        />
        {/* Contextual help text for each action */}
        <div className="mt-2 p-2 bg-muted/50 rounded-lg border border-border/50">
          <div className="flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-[10px] text-muted-foreground space-y-1">
              {content.action === 'next-step' && (
                <div>
                  <p className="font-medium text-foreground mb-0.5">Next Step</p>
                  <p>Navigates to the next step in sequence. If quiz options have custom routing configured, those will be respected. Lead data is saved as draft automatically.</p>
                </div>
              )}
              {content.action === 'submit' && (
                <div>
                  <p className="font-medium text-foreground mb-0.5">Submit</p>
                  <p className="font-semibold text-amber-600 dark:text-amber-500 mb-1">⚠️ Finalizes the lead</p>
                  <p>Finalizes the lead with status "complete", triggers configured webhooks and automations, then navigates to the next step. Use this for final form submissions.</p>
                </div>
              )}
              {content.action === 'url' && (
                <div>
                  <p className="font-medium text-foreground mb-0.5">URL</p>
                  <p>Opens the specified URL in a new tab. Navigation within the funnel continues normally after the link opens.</p>
                </div>
              )}
              {content.action === 'webhook' && (
                <div>
                  <p className="font-medium text-foreground mb-0.5">Webhook</p>
                  <p>Sends form data to the specified webhook URL (e.g., Zapier, Make). Data is sent immediately on button click, then navigation proceeds. Lead is also saved to database separately.</p>
                </div>
              )}
              {content.action === 'scroll' && (
                <div>
                  <p className="font-medium text-foreground mb-0.5">Scroll</p>
                  <p>Smoothly scrolls to the element with the specified ID on the current page. Useful for same-page navigation without changing steps.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </InspectorSection>

      {content.action === 'url' && (
        <InspectorSection title="URL">
          <Input
            value={content.actionValue || ''}
            onChange={(e) => onContentChange({ actionValue: e.target.value })}
            className="h-9 bg-muted border-0"
            placeholder="https://..."
          />
        </InspectorSection>
      )}

      {content.action === 'webhook' && (
        <InspectorSection title="Webhook URL">
          <Input
            value={content.actionValue || ''}
            onChange={(e) => onContentChange({ actionValue: e.target.value })}
            className="h-9 bg-muted border-0"
            placeholder="https://..."
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Send form data to external services (Zapier, Make, etc.)
          </p>
        </InspectorSection>
      )}

      {content.action === 'scroll' && (
        <InspectorSection title="Scroll Target">
          <Input
            value={content.actionValue || ''}
            onChange={(e) => onContentChange({ actionValue: e.target.value })}
            className="h-9 bg-muted border-0"
            placeholder="Element ID or selector"
          />
        </InspectorSection>
      )}

      <Separator />

      <InspectorSection title="Style">
        <IconToggleRow
          value={content.variant || 'primary'}
          onChange={(v) => {
            // Smart color contrast: when switching variants, update text color appropriately
            const updates: Record<string, any> = { variant: v };
            if (v === 'outline' || v === 'ghost') {
              // For outline/ghost, use the border color or a dark color for contrast
              updates.color = content.borderColor || '#3b82f6';
            } else if (v === 'primary') {
              // For filled buttons, use white text by default
              updates.color = '#ffffff';
            }
            onContentChange(updates);
          }}
          options={[
            { value: 'primary', icon: <Square className="h-4 w-4 fill-current" />, label: 'Filled' },
            { value: 'outline', icon: <Square className="h-4 w-4" />, label: 'Outline' },
            { value: 'ghost', icon: <Minus className="h-4 w-4" />, label: 'Ghost' },
          ]}
        />
      </InspectorSection>

      <InspectorSection title="Size">
        <IconToggleRow
          value={content.size || 'md'}
          onChange={(v) => onContentChange({ size: v })}
          options={[
            { value: 'sm', icon: <span className="text-[10px]">S</span>, label: 'Small' },
            { value: 'md', icon: <span className="text-xs">M</span>, label: 'Medium' },
            { value: 'lg', icon: <span className="text-sm">L</span>, label: 'Large' },
          ]}
        />
      </InspectorSection>

      <InspectorSection title="Font Size">
        <VisualSlider
          icon={<Type className="h-3.5 w-3.5" />}
          value={content.fontSize || 16}
          onChange={(v) => onContentChange({ fontSize: v })}
          min={12}
          max={24}
          unit="px"
        />
      </InspectorSection>

      <ToggleSwitchRow
        label="Full Width"
        checked={content.fullWidth || false}
        onChange={(v) => onContentChange({ fullWidth: v })}
      />

      {content.variant !== 'outline' && (
        <InspectorSection title="Background">
          <GradientColorPicker
            solidColor={content.backgroundColor || '#3b82f6'}
            gradient={content.backgroundGradient || ''}
            onSolidChange={(v) => onContentChange({ backgroundColor: v, backgroundGradient: '' })}
            onGradientChange={(v) => onContentChange({ backgroundGradient: v })}
            colorPresets={buttonColors}
          />
        </InspectorSection>
      )}

      {content.variant === 'outline' && (
        <>
          <InspectorSection title="Border Color">
            <ColorSwatchPicker
              value={content.borderColor || '#3b82f6'}
              onChange={(v) => onContentChange({ borderColor: v })}
              presets={buttonColors}
            />
          </InspectorSection>

          <InspectorSection title="Border Thickness">
            <VisualSlider
              icon={<Square className="h-3.5 w-3.5" />}
              value={content.borderWidth || 2}
              onChange={(v) => onContentChange({ borderWidth: v })}
              min={1}
              max={6}
              unit="px"
            />
          </InspectorSection>
        </>
      )}

      <InspectorSection title="Text Color">
        <GradientColorPicker
          solidColor={content.color || '#ffffff'}
          gradient={content.textGradient || ''}
          onSolidChange={(v) => onContentChange({ color: v, textGradient: '' })}
          onGradientChange={(v) => onContentChange({ textGradient: v })}
          colorPresets={textColors}
        />
      </InspectorSection>

      <Separator />
      <TrackingSection
        trackingId={content.trackingId || ''}
        onChange={(id) => onContentChange({ trackingId: id })}
        label="Tracking ID"
      />
    </div>
  );
}

// ========== IMAGE PRESETS ==========
const imagePresets = [
  {
    id: 'sharp',
    name: 'Sharp',
    preview: <div className="w-6 h-4 bg-muted-foreground/30" />,
    config: { borderRadius: 0, aspectRatio: 'auto' }
  },
  {
    id: 'rounded',
    name: 'Rounded',
    preview: <div className="w-6 h-4 bg-muted-foreground/30 rounded-lg" />,
    config: { borderRadius: 24, aspectRatio: 'auto' }
  },
  {
    id: 'circle',
    name: 'Circle',
    preview: <div className="w-5 h-5 bg-muted-foreground/30 rounded-full" />,
    config: { borderRadius: 100, aspectRatio: '1:1' }
  },
  {
    id: 'card',
    name: 'Card',
    preview: <div className="w-6 h-4 bg-muted-foreground/30 rounded-xl shadow-sm" />,
    config: { borderRadius: 32, aspectRatio: '16:9' }
  },
];

// ========== IMAGE INSPECTOR ==========
export function ImageInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;
  const currentRadius = content.borderRadius || 0;

  const handlePresetApply = (config: Record<string, any>) => {
    onContentChange({ ...config });
  };

  return (
    <div className="space-y-3">
      <PresetPicker
        presets={imagePresets}
        currentConfig={content}
        onApply={handlePresetApply}
      />

      <Separator />

      <MediaPicker
        value={content.src || ''}
        onChange={(url) => onContentChange({ src: url })}
        type="image"
        label="Image"
      />

      {/* Corner Radius - Prominent position with visual preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">Corner Radius</span>
          <div 
            className="w-6 h-6 bg-muted-foreground/20 border border-muted-foreground/30"
            style={{ borderRadius: Math.min(currentRadius, 12) }}
          />
        </div>
        <VisualSlider
          icon={<Circle className="h-4 w-4" />}
          value={currentRadius}
          onChange={(v) => onContentChange({ borderRadius: v })}
          min={0}
          max={100}
          unit="px"
        />
      </div>

      {/* Aspect Ratio */}
      <InspectorSection title="Aspect Ratio">
        <IconToggleRow
          value={content.aspectRatio || 'auto'}
          onChange={(v) => onContentChange({ aspectRatio: v })}
          options={[
            { value: 'auto', icon: <span className="text-[10px]">Auto</span>, label: 'Auto' },
            { value: '1:1', icon: <Square className="h-4 w-4" />, label: 'Square' },
            { value: '4:3', icon: <div className="w-4 h-3 border border-current rounded-sm" />, label: '4:3' },
            { value: '16:9', icon: <div className="w-5 h-3 border border-current rounded-sm" />, label: '16:9' },
          ]}
        />
      </InspectorSection>

      {/* Alt Text - Compact with muted background */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">Alt Text</span>
        <Input
          value={content.alt || ''}
          onChange={(e) => onContentChange({ alt: e.target.value })}
          className="h-8 bg-muted/50 border-0 text-xs"
          placeholder="Describe this image for accessibility"
        />
      </div>

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// Auto-detect video type from URL
function detectVideoType(url: string): 'youtube' | 'vimeo' | 'wistia' | 'loom' | 'hosted' {
  if (!url) return 'hosted';
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('vimeo.com')) return 'vimeo';
  if (lowerUrl.includes('wistia')) return 'wistia';
  if (lowerUrl.includes('loom.com')) return 'loom';
  return 'hosted';
}

// Video preview component with native controls
function VideoPreviewWithControls({ src, onRemove }: { src: string; onRemove: () => void }) {
  const [error, setError] = React.useState<string | null>(null);

  // Reset error when src changes
  React.useEffect(() => {
    setError(null);
  }, [src]);

  return (
    <div className="space-y-2">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
              <span className="text-red-500 text-lg">!</span>
            </div>
            <p className="text-xs text-red-400">{error}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Try a different format (MP4, WebM)</p>
          </div>
        ) : (
          <video
            src={src}
            className="w-full h-full object-contain"
            controls
            playsInline
            onError={() => setError('Video format not supported')}
            onLoadedData={() => setError(null)}
          />
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full h-8 text-xs"
        onClick={() => {
          // Revoke blob URL to prevent memory leak
          if (src.startsWith('blob:')) {
            URL.revokeObjectURL(src);
          }
          onRemove();
        }}
      >
        <Trash2 className="h-3 w-3 mr-1.5" />
        Remove Video
      </Button>
    </div>
  );
}

// ========== VIDEO INSPECTOR ==========
export function VideoInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;
  const isUploadedVideo = content.src?.startsWith('data:') || content.src?.startsWith('blob:');
  const [inputMode, setInputMode] = React.useState<'url' | 'upload'>(
    isUploadedVideo ? 'upload' : 'url'
  );
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-detect type when URL changes
  const handleUrlChange = (url: string) => {
    const detectedType = detectVideoType(url);
    onContentChange({ src: url, type: detectedType });
  };

  // Handle file upload - use blob URL for efficient streaming playback
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('video/')) return;
    
    // Show file size in MB
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setUploadProgress(`Processing ${sizeMB}MB...`);
    
    // Use blob URL for efficient playback (much better than base64 data URLs)
    const blobUrl = URL.createObjectURL(file);
    onContentChange({ src: blobUrl, type: 'hosted' });
    setUploadProgress(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Get platform name for display
  const getPlatformName = () => {
    switch (content.type) {
      case 'youtube': return 'YouTube';
      case 'vimeo': return 'Vimeo';
      case 'wistia': return 'Wistia';
      case 'loom': return 'Loom';
      default: return null;
    }
  };

  const platformName = getPlatformName();

  return (
    <div className="space-y-4">
      <InspectorSection title="Video Source">
        <LabeledToggleRow
          value={inputMode}
          onChange={(v) => setInputMode(v as 'url' | 'upload')}
          options={[
            { value: 'url', label: 'URL' },
            { value: 'upload', label: 'Upload' },
          ]}
        />
      </InspectorSection>

      {inputMode === 'url' ? (
        <InspectorSection title="Video URL">
          <Input
            value={isUploadedVideo ? '' : (content.src || '')}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="h-9 bg-muted border-0"
            placeholder="Paste any video link..."
          />
          {platformName && content.src && !isUploadedVideo && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] text-muted-foreground">{platformName} detected</span>
            </div>
          )}
        </InspectorSection>
      ) : (
        <InspectorSection title="Upload Video">
          {isUploadedVideo && content.src ? (
            <VideoPreviewWithControls 
              src={content.src} 
              onRemove={() => onContentChange({ src: '', type: 'hosted' })}
            />
          ) : (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              {uploadProgress ? (
                <div className="space-y-2">
                  <div className="w-6 h-6 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground">{uploadProgress}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Drop video here or click to browse
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    MP4, WebM, MOV (max 50MB recommended)
                  </p>
                </div>
              )}
            </div>
          )}
        </InspectorSection>
      )}

      {/* Show current video preview for URL mode too */}
      {inputMode === 'url' && content.src && content.type === 'hosted' && !isUploadedVideo && (
        <InspectorSection title="Preview">
          <VideoPreviewWithControls 
            src={content.src} 
            onRemove={() => onContentChange({ src: '', type: 'hosted' })}
          />
        </InspectorSection>
      )}

      <InspectorSection title="Aspect Ratio">
        <LabeledToggleRow
          value={content.aspectRatio || '16:9'}
          onChange={(v) => onContentChange({ aspectRatio: v })}
          options={[
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' },
            { value: '4:3', label: '4:3' },
            { value: '1:1', label: '1:1' },
          ]}
        />
      </InspectorSection>

      <Separator />

      <ToggleSwitchRow
        label="Autoplay"
        checked={content.autoplay || false}
        onChange={(v) => onContentChange({ autoplay: v })}
      />

      <ToggleSwitchRow
        label="Muted"
        checked={content.muted || false}
        onChange={(v) => onContentChange({ muted: v })}
      />

      <ToggleSwitchRow
        label="Loop"
        checked={content.loop || false}
        onChange={(v) => onContentChange({ loop: v })}
      />

      {content.type === 'hosted' && (
        <ToggleSwitchRow
          label="Show Controls"
          checked={content.controls !== false}
          onChange={(v) => onContentChange({ controls: v })}
        />
      )}

      <Separator />
      {onBlockChange && (
        <TrackingSection
          trackingId={block.trackingId || ''}
          onChange={(id) => onBlockChange({ trackingId: id })}
        />
      )}
    </div>
  );
}

// ========== COUNTDOWN INSPECTOR ==========
export function CountdownInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;

  const textColors = [
    '#ffffff', '#000000', '#f59e0b', '#10b981', '#ef4444', '#6366f1',
  ];

  return (
    <div className="space-y-4">
      <InspectorSection title="End Date">
        <Input
          type="datetime-local"
          value={content.endDate?.slice(0, 16) || ''}
          onChange={(e) => onContentChange({ endDate: new Date(e.target.value).toISOString() })}
          className="h-9 bg-muted border-0"
        />
      </InspectorSection>

      <ToggleSwitchRow
        label="Show Days"
        checked={content.showDays !== false}
        onChange={(v) => onContentChange({ showDays: v })}
      />

      <InspectorSection title="Expired Text">
        <Input
          value={content.expiredText || 'Offer expired'}
          onChange={(e) => onContentChange({ expiredText: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Offer expired"
        />
      </InspectorSection>

      <Separator />

      <InspectorSection title="Background">
        <GradientColorPicker
          solidColor={content.backgroundColor || '#000000'}
          gradient={content.backgroundGradient || ''}
          onSolidChange={(v) => onContentChange({ backgroundColor: v, backgroundGradient: '' })}
          onGradientChange={(v) => onContentChange({ backgroundGradient: v })}
        />
      </InspectorSection>

      <InspectorSection title="Text Color">
        <GradientColorPicker
          solidColor={content.textColor || '#ffffff'}
          gradient={content.textGradient || ''}
          onSolidChange={(v) => onContentChange({ textColor: v, textGradient: '' })}
          onGradientChange={(v) => onContentChange({ textGradient: v })}
        />
      </InspectorSection>

      <Separator />
      {onBlockChange && (
        <TrackingSection
          trackingId={block.trackingId || ''}
          onChange={(id) => onBlockChange({ trackingId: id })}
        />
      )}
    </div>
  );
}

// ========== DIVIDER INSPECTOR ==========
export function DividerInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <InspectorSection title="Style">
        <IconToggleRow
          value={content.style || 'solid'}
          onChange={(v) => onContentChange({ style: v })}
          options={[
            { value: 'solid', icon: <div className="w-6 border-t-2 border-current" />, label: 'Solid' },
            { value: 'dashed', icon: <div className="w-6 border-t-2 border-dashed border-current" />, label: 'Dashed' },
            { value: 'dotted', icon: <div className="w-6 border-t-2 border-dotted border-current" />, label: 'Dotted' },
          ]}
        />
      </InspectorSection>

      <InspectorSection title="Color">
        <InlineColorPicker
          value={content.color || '#e5e7eb'}
          onChange={(v) => onContentChange({ color: v })}
        />
      </InspectorSection>

      <InspectorSection title="Thickness">
        <VisualSlider
          value={content.thickness || 1}
          onChange={(v) => onContentChange({ thickness: v })}
          min={1}
          max={8}
          unit="px"
        />
      </InspectorSection>

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== SPACER INSPECTOR ==========
export function SpacerInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <InspectorSection title="Height">
        <VisualSlider
          value={content.height || 40}
          onChange={(v) => onContentChange({ height: v })}
          min={8}
          max={200}
          unit="px"
        />
      </InspectorSection>

      <div className="bg-muted rounded-lg p-4 flex items-center justify-center">
        <div 
          className="bg-primary/20 rounded w-full" 
          style={{ height: content.height || 40 }}
        />
      </div>
    </div>
  );
}

// ========== EMAIL CAPTURE INSPECTOR ==========
export function EmailCaptureInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <PrivacyConsentSection content={content} onContentChange={onContentChange} />

      <InspectorSection title="Placeholder">
        <Input
          value={content.placeholder}
          onChange={(e) => onContentChange({ placeholder: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Enter your email"
        />
      </InspectorSection>

      <InspectorSection title="Subtitle">
        <Input
          value={content.subtitle || ''}
          onChange={(e) => onContentChange({ subtitle: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="We respect your privacy"
        />
      </InspectorSection>

      <Separator />

      <p className="text-xs text-muted-foreground px-1">
        Click the submit button on canvas to configure it.
      </p>

      <PopupSettingsSection content={content} onContentChange={onContentChange} />

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== PHONE CAPTURE INSPECTOR ==========
export function PhoneCaptureInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;
  const countryCodes = content.countryCodes || [];
  const [showModal, setShowModal] = React.useState(false);

  const updateCountryCodes = (updates: any[]) => {
    onContentChange({ countryCodes: updates });
  };

  const addCountryCode = (country: any) => {
    const newCountry = {
      id: uuid(),
      ...country,
    };
    updateCountryCodes([...countryCodes, newCountry]);
  };

  const removeCountryCode = (id: string) => {
    const updated = countryCodes.filter((c: any) => c.id !== id);
    updateCountryCodes(updated);
    // If removed country was default, reset default
    if (content.defaultCountryId === id && updated.length > 0) {
      onContentChange({ defaultCountryId: updated[0].id });
    }
  };

  const setAsDefault = (id: string) => {
    onContentChange({ defaultCountryId: id });
  };

  const existingCodes = countryCodes.map((c: any) => c.code);

  return (
    <div className="space-y-4">
      <PrivacyConsentSection content={content} onContentChange={onContentChange} />

      <InspectorSection title="Placeholder">
        <Input
          value={content.placeholder}
          onChange={(e) => onContentChange({ placeholder: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Enter your phone"
        />
      </InspectorSection>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">Country Codes</span>
          <Button variant="outline" size="sm" onClick={() => setShowModal(true)} className="h-7">
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>

        {/* Simplified Country Codes List */}
        {countryCodes.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 px-1">
            No country codes added. Click "Add" to add countries.
          </p>
        ) : (
          <div className="space-y-1">
            {countryCodes.map((country: any) => (
              <div 
                key={country.id} 
                className="group flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
              >
                <span className="text-base shrink-0">{country.flag}</span>
                <span className="text-sm font-medium shrink-0">{country.code}</span>
                
                {content.defaultCountryId === country.id && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                    Default
                  </span>
                )}
                
                <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {content.defaultCountryId !== country.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAsDefault(country.id)}
                      className="h-6 px-2 text-[10px]"
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCountryCode(country.id)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CountryCodeModal
        open={showModal}
        onOpenChange={setShowModal}
        onAdd={addCountryCode}
        existingCodes={existingCodes}
      />

      <Separator />

      <p className="text-xs text-muted-foreground px-1">
        Click the submit button on canvas to configure it.
      </p>

      <PopupSettingsSection content={content} onContentChange={onContentChange} />

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== CALENDAR INSPECTOR ==========
export function CalendarInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <InspectorSection title="Provider">
        <LabeledToggleRow
          value={content.provider || 'native'}
          onChange={(v) => onContentChange({ provider: v })}
          options={[
            { value: 'native', label: 'Native' },
            { value: 'calendly', label: 'Calendly' },
          ]}
        />
      </InspectorSection>

      {content.provider === 'calendly' && (
        <>
          <InspectorSection title="Calendly URL">
            <Input
              value={content.url || ''}
              onChange={(e) => onContentChange({ url: e.target.value })}
              className="h-9 bg-muted border-0"
              placeholder="https://calendly.com/yourname"
            />
          </InspectorSection>

          <InspectorSection title="Embed Height">
            <VisualSlider
              value={content.height || 630}
              onChange={(v) => onContentChange({ height: v })}
              min={400}
              max={800}
              unit="px"
            />
          </InspectorSection>
        </>
      )}

      {(!content.provider || content.provider === 'native') && (
        <>
          <InspectorSection title="Title">
            <Input
              value={content.title || ''}
              onChange={(e) => onContentChange({ title: e.target.value })}
              className="h-9 bg-muted border-0"
              placeholder="Select a date"
            />
          </InspectorSection>

          <InspectorSection title="Button Text">
            <Input
              value={content.buttonText || 'Book Now'}
              onChange={(e) => onContentChange({ buttonText: e.target.value })}
              className="h-9 bg-muted border-0"
              placeholder="Book Now"
            />
          </InspectorSection>

          <InspectorSection title="Accent Color">
            <ColorSwatchPicker
              value={content.accentColor || '#6366f1'}
              onChange={(v) => onContentChange({ accentColor: v })}
            />
          </InspectorSection>
        </>
      )}

      <Separator />
      {onBlockChange && (
        <TrackingSection
          trackingId={block.trackingId || ''}
          onChange={(id) => onBlockChange({ trackingId: id })}
        />
      )}
    </div>
  );
}

// ========== QUIZ INSPECTOR ==========
export function QuizInspector({ block, onContentChange, onBlockChange, funnel }: BlockInspectorProps & { funnel?: any }) {
  const content = block.content as any;
  const options = content.options || [];
  const steps = funnel?.steps || [];

  const addOption = () => {
    onContentChange({
      options: [...options, { id: uuid(), text: 'New option', trackingId: generateTrackingId('option') }]
    });
  };

  const updateOption = (index: number, updates: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    onContentChange({ options: newOptions });
  };

  const removeOption = (index: number) => {
    onContentChange({ options: options.filter((_: any, i: number) => i !== index) });
  };

  // Always show submit button if multi-select is enabled, otherwise respect the toggle
  const shouldShowSubmitButton = content.multiSelect || content.showSubmitButton !== false;

  return (
    <div className="space-y-4">
      {/* Behavior Explanation */}
      <div className="p-2 bg-muted/50 rounded-lg border border-border/50">
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-[10px] text-muted-foreground">
            {shouldShowSubmitButton ? (
              <div>
                <p className="font-medium text-foreground mb-0.5">Submit Button Mode</p>
                <p>Answer options mark selection. Submit button controls navigation and actions.</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-foreground mb-0.5">Direct Answer Mode</p>
                <p>Each answer executes its own action immediately when clicked. Configure actions below.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <InspectorSection title="Question">
        <Textarea
          value={content.question}
          onChange={(e) => onContentChange({ question: e.target.value })}
          className="min-h-[60px] bg-muted border-0 resize-none"
          placeholder="What's your question?"
        />
      </InspectorSection>

      <ToggleSwitchRow
        label="Show Submit Button"
        checked={shouldShowSubmitButton}
        onChange={(v) => {
          // If multi-select is enabled, always keep submit button on
          if (content.multiSelect) {
            onContentChange({ showSubmitButton: true });
          } else {
            onContentChange({ showSubmitButton: v });
          }
        }}
        disabled={content.multiSelect}
      />

      {content.multiSelect && (
        <p className="text-xs text-muted-foreground px-1">
          Submit button is always shown when multi-select is enabled.
        </p>
      )}

      {shouldShowSubmitButton && (
        <p className="text-xs text-muted-foreground px-1">
          Click the submit button on canvas to configure it.
        </p>
      )}

      <Separator />

      <InspectorSection title="Options">
        <div className="space-y-3">
          {options.map((opt: any, i: number) => (
            <div key={opt.id} className="space-y-1.5 p-2 bg-muted/50 rounded-lg">
              <div className="flex gap-2 items-center">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-medium">
                  {i + 1}
                </div>
                <Input
                  value={opt.text}
                  onChange={(e) => updateOption(i, { text: e.target.value })}
                  className="h-8 flex-1 bg-background border-0"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(i)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              {/* Answer Action Configuration - Only show when NO submit button */}
              {!shouldShowSubmitButton && (
                <div className="space-y-1 ml-7 bg-background rounded p-1.5 border border-border/50">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Action:</span>
                    <select
                      value={opt.action || (opt.nextStepId ? 'next-step' : 'next-step')}
                      onChange={(e) => {
                        const action = e.target.value;
                        updateOption(i, { 
                          action: action as 'next-step' | 'url' | 'submit',
                          // Clear actionValue if switching away from next-step
                          actionValue: action === 'next-step' ? (opt.actionValue || opt.nextStepId) : undefined
                        });
                      }}
                      className="flex-1 h-5 px-1 text-[10px] bg-muted rounded border-0"
                    >
                      <option value="next-step">Next Step</option>
                      <option value="url">URL</option>
                      <option value="submit">Submit</option>
                    </select>
                  </div>
                  
                  {/* Action value input (step selector or URL input) */}
                  {(opt.action || (opt.nextStepId ? 'next-step' : 'next-step')) === 'next-step' && steps.length > 1 && (
                    <select
                      value={opt.actionValue || opt.nextStepId || ''}
                      onChange={(e) => updateOption(i, { actionValue: e.target.value, nextStepId: e.target.value })}
                      className="w-full h-5 px-1 text-[10px] bg-background rounded border border-border/50"
                    >
                      <option value="">→ Sequential next</option>
                      {steps.map((step: any) => (
                        <option key={step.id} value={step.id}>→ {step.name}</option>
                      ))}
                    </select>
                  )}
                  
                  {(opt.action || 'next-step') === 'url' && (
                    <Input
                      value={opt.actionValue || ''}
                      onChange={(e) => updateOption(i, { actionValue: e.target.value })}
                      placeholder="https://..."
                      className="h-5 text-[10px] bg-background"
                    />
                  )}
                  
                  {(opt.action || 'next-step') === 'submit' && (
                    <p className="text-[9px] text-amber-600 dark:text-amber-500">
                      Will finalize lead and trigger webhooks
                    </p>
                  )}
                </div>
              )}
              {/* Per-option colors */}
              <div className="flex items-center gap-2 ml-7">
                <span className="text-[10px] text-muted-foreground shrink-0 w-8">BG:</span>
                <input
                  type="color"
                  value={opt.backgroundColor || '#ffffff'}
                  onChange={(e) => updateOption(i, { backgroundColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0"
                />
                <span className="text-[10px] text-muted-foreground shrink-0 w-8 ml-2">Text:</span>
                <input
                  type="color"
                  value={opt.textColor || '#000000'}
                  onChange={(e) => updateOption(i, { textColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0"
                />
                {(opt.backgroundColor || opt.textColor) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1 text-[10px] text-muted-foreground"
                    onClick={() => updateOption(i, { backgroundColor: undefined, textColor: undefined })}
                  >
                    Reset
                  </Button>
                )}
              </div>
              {/* Option tracking ID */}
              <div className="ml-7">
                <Input
                  value={opt.trackingId || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                    updateOption(i, { trackingId: value });
                  }}
                  placeholder="opt_abc123"
                  className="h-7 text-xs font-mono bg-background"
                />
                <p className="text-[9px] text-muted-foreground mt-0.5 px-1">Tracking ID</p>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addOption} className="w-full mt-2">
          <Plus className="h-3 w-3 mr-1" /> Add Option
        </Button>
      </InspectorSection>

      {!content.multiSelect && steps.length > 1 && (
        <p className="text-[10px] text-muted-foreground px-1">
          💡 Configure where each option leads. Leave empty for sequential flow.
        </p>
      )}

      <Separator />

      {/* Option Card Style */}
      <InspectorSection title="Option Style">
        <LabeledToggleRow
          value={content.optionStyle || 'outline'}
          onChange={(v) => onContentChange({ optionStyle: v })}
          options={[
            { value: 'outline', label: 'Outline' },
            { value: 'filled', label: 'Filled' },
          ]}
        />
      </InspectorSection>

      {/* Question Text Color/Gradient */}
      <InspectorSection title="Question Color">
        <GradientColorPicker
          solidColor={content.questionColor || ''}
          gradient={content.questionStyles?.textGradient || ''}
          onSolidChange={(v) => onContentChange({ questionColor: v, questionStyles: { ...(content.questionStyles || {}), textGradient: '' } })}
          onGradientChange={(v) => onContentChange({ questionStyles: { ...(content.questionStyles || {}), textGradient: v } })}
        />
      </InspectorSection>

      {/* Option Text Color */}
      <InspectorSection title="Option Text Color">
        <ColorSwatchPicker
          value={content.optionTextColor || ''}
          onChange={(v) => onContentChange({ optionTextColor: v })}
        />
      </InspectorSection>

      {/* Selected Option Color */}
      <InspectorSection title="Selected Option Color">
        <ColorSwatchPicker
          value={content.selectedOptionColor || ''}
          onChange={(v) => onContentChange({ selectedOptionColor: v })}
        />
      </InspectorSection>

      <PopupSettingsSection content={content} onContentChange={onContentChange} />

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== SUBMIT BUTTON INSPECTOR (Child Element) ==========
// This wraps ButtonInspector to provide a unified button editing experience
const defaultSubmitButton = {
  text: 'Submit',
  variant: 'primary' as const,
  size: 'md' as const,
  action: 'next-step' as const,
  fullWidth: true,
  backgroundColor: '#3b82f6',
  color: '#ffffff',
};

export function SubmitButtonInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;
  const submitButton = content.submitButton || defaultSubmitButton;
  
  // Create a virtual button block from the submitButton content
  const buttonBlock = {
    ...block,
    type: 'button' as const,
    content: submitButton,
  };
  
  // Wrap onContentChange to update the submitButton property
  const handleButtonChange = (updates: Record<string, any>) => {
    onContentChange({
      submitButton: { ...submitButton, ...updates }
    });
  };
  
  // No-op for style changes since submit button styles are embedded in content
  const handleStyleChange = () => {};
  
  return <ButtonInspector block={buttonBlock} onContentChange={handleButtonChange} onStyleChange={handleStyleChange} />;
}

// ========== COUNTRY CODES INSPECTOR (Child Element) ==========
interface CountryCodesInspectorProps {
  funnel: any;
  onFunnelChange: (updates: any) => void;
}

export function CountryCodesInspector({ funnel, onFunnelChange }: CountryCodesInspectorProps) {
  const countryCodes = funnel.countryCodes || [];
  const [showModal, setShowModal] = React.useState(false);

  const updateCountryCodes = (updates: CountryCode[]) => {
    onFunnelChange({ countryCodes: updates });
  };

  const addCountryCode = (country: CountryCode) => {
    const newCountry = {
      id: uuid(),
      ...country,
    };
    updateCountryCodes([...countryCodes, newCountry]);
  };

  const removeCountryCode = (id: string) => {
    const updated = countryCodes.filter((c: any) => c.id !== id);
    updateCountryCodes(updated);
    // If removed country was default, reset default
    if (funnel.defaultCountryId === id && updated.length > 0) {
      onFunnelChange({ defaultCountryId: updated[0].id });
    }
  };

  const setAsDefault = (id: string) => {
    onFunnelChange({ defaultCountryId: id });
  };

  const existingCodes = countryCodes.map((c: any) => c.code);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Country Codes</h3>
        <Button variant="outline" size="sm" onClick={() => setShowModal(true)} className="h-7">
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      <p className="text-xs text-muted-foreground px-1">
        Configure country codes that will be available for all phone inputs in this funnel.
      </p>

      <Separator />

      {/* Simplified Country Codes List */}
      {countryCodes.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2 px-1">
          No country codes added. Click "Add" to add countries.
        </p>
      ) : (
        <div className="space-y-1">
          {countryCodes.map((country: any) => (
            <div 
              key={country.id} 
              className="group flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
            >
              <span className="text-base shrink-0">{country.flag}</span>
              <span className="text-sm font-medium shrink-0">{country.code}</span>
              
              {funnel.defaultCountryId === country.id && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                  Default
                </span>
              )}
              
              <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {funnel.defaultCountryId !== country.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAsDefault(country.id)}
                    className="h-6 px-2 text-[10px]"
                  >
                    Set Default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCountryCode(country.id)}
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CountryCodeModal
        open={showModal}
        onOpenChange={setShowModal}
        onAdd={addCountryCode}
        existingCodes={existingCodes}
      />
    </div>
  );
}

// ========== FORM FIELD INSPECTOR (Child Element for Form Block) ==========
interface FormFieldInspectorProps {
  block: Block;
  fieldId: string;
  onContentChange: (updates: any) => void;
  setSelectedChildElement: (element: string | null) => void;
}

export function FormFieldInspector({ block, fieldId, onContentChange, setSelectedChildElement }: FormFieldInspectorProps) {
  const content = block.content as FormContent;
  const field = content.fields?.find(f => f.id === fieldId);
  
  if (!field) {
    return <div className="text-sm text-muted-foreground">Field not found</div>;
  }

  const updateField = (updates: Partial<typeof field>) => {
    const updatedFields = content.fields?.map(f => 
      f.id === fieldId ? { ...f, ...updates } : f
    ) || [];
    onContentChange({ fields: updatedFields });
  };

  const updateFieldOption = (index: number, value: string) => {
    const options = [...(field.options || [])];
    options[index] = value;
    updateField({ options });
  };

  const addFieldOption = () => {
    const options = [...(field.options || []), 'New option'];
    updateField({ options });
  };

  const removeFieldOption = (index: number) => {
    const options = field.options?.filter((_, i) => i !== index) || [];
    updateField({ options });
  };

  return (
    <div className="space-y-4">
      {/* Field Type Display */}
      <div className="text-xs text-muted-foreground px-1 capitalize">
        Type: {field.type}
      </div>

      <InspectorSection title="Label">
        <Input
          value={field.label || ''}
          onChange={(e) => updateField({ label: e.target.value })}
          placeholder="Field label"
        />
      </InspectorSection>
      
      <InspectorSection title="Placeholder">
        <Input
          value={field.placeholder || ''}
          onChange={(e) => updateField({ placeholder: e.target.value })}
          placeholder="Placeholder text"
        />
      </InspectorSection>
      
      <ToggleSwitchRow
        label="Required"
        checked={field.required || false}
        onChange={(checked) => updateField({ required: checked })}
      />

      {/* Type-specific options */}
      {field.type === 'select' && (
        <>
          <Separator />
          <InspectorSection title="Options">
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateFieldOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFieldOption(index)}
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addFieldOption}
                className="w-full"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Option
              </Button>
            </div>
          </InspectorSection>
        </>
      )}

      {field.type === 'phone' && (
        <>
          <Separator />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedChildElement('country-codes')}
            className="w-full"
          >
            Edit Country Codes
          </Button>
        </>
      )}
    </div>
  );
}

// ========== PHONE INPUT INSPECTOR (Child Element for Phone Capture Block) ==========
interface PhoneInputInspectorProps {
  block: Block;
  onContentChange: (updates: any) => void;
  setSelectedChildElement: (element: string | null) => void;
}

export function PhoneInputInspector({ block, onContentChange, setSelectedChildElement }: PhoneInputInspectorProps) {
  const content = block.content as PhoneCaptureContent;
  
  return (
    <div className="space-y-4">
      <InspectorSection title="Placeholder">
        <Input
          value={content.placeholder || ''}
          onChange={(e) => onContentChange({ placeholder: e.target.value })}
          placeholder="Enter your phone number"
        />
      </InspectorSection>

      <Separator />

      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setSelectedChildElement('country-codes')}
        className="w-full"
      >
        Edit Country Codes
      </Button>
    </div>
  );
}

// ========== ACCORDION INSPECTOR ==========
export function AccordionInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;
  const items = content.items || [];

  const addItem = () => {
    onContentChange({
      items: [...items, { id: uuid(), title: 'New item', content: 'Content here...' }]
    });
  };

  const updateItem = (index: number, updates: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    onContentChange({ items: newItems });
  };

  const removeItem = (index: number) => {
    onContentChange({ items: items.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Items</span>
        <Button variant="outline" size="sm" onClick={addItem} className="h-7">
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item: any, i: number) => (
          <div key={item.id} className="bg-muted rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Item {i + 1}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(i)}
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <Input
              value={item.title}
              onChange={(e) => updateItem(i, { title: e.target.value })}
              className="h-8 bg-background border-0"
              placeholder="Title"
            />
            <Textarea
              value={item.content}
              onChange={(e) => updateItem(i, { content: e.target.value })}
              className="min-h-[50px] text-sm bg-background border-0 resize-none"
              placeholder="Content"
            />
          </div>
        ))}
      </div>

      <Separator />

      {/* Item Style */}
      <InspectorSection title="Item Style">
        <LabeledToggleRow
          value={content.itemStyle || 'outline'}
          onChange={(v) => onContentChange({ itemStyle: v })}
          options={[
            { value: 'outline', label: 'Outline' },
            { value: 'filled', label: 'Filled' },
          ]}
        />
      </InspectorSection>

      {/* Title Color/Gradient */}
      <InspectorSection title="Title Color">
        <GradientColorPicker
          solidColor={content.titleColor || ''}
          gradient={content.titleStyles?.textGradient || ''}
          onSolidChange={(v) => onContentChange({ titleColor: v, titleStyles: { ...(content.titleStyles || {}), textGradient: '' } })}
          onGradientChange={(v) => onContentChange({ titleStyles: { ...(content.titleStyles || {}), textGradient: v } })}
        />
      </InspectorSection>

      {/* Content Color */}
      <InspectorSection title="Content Color">
        <ColorSwatchPicker
          value={content.contentColor || ''}
          onChange={(v) => onContentChange({ contentColor: v })}
        />
      </InspectorSection>

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== SOCIAL PROOF INSPECTOR ==========
export function SocialProofInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;
  const items = content.items || [];

  const addItem = () => {
    onContentChange({
      items: [...items, { id: uuid(), value: 100, label: 'New stat', suffix: '+' }]
    });
  };

  const updateItem = (index: number, updates: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    onContentChange({ items: newItems });
  };

  const removeItem = (index: number) => {
    onContentChange({ items: items.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-3">
      {/* Stats Section - Compact Header */}
      <div className="flex items-center justify-between h-6">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Stats</span>
        <Button variant="ghost" size="sm" onClick={addItem} className="h-6 px-2 text-[11px]">
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      {/* Compact Stat Cards */}
      <div className="space-y-2">
        {items.map((item: any, i: number) => (
          <div key={item.id} className="bg-muted/50 rounded-md p-2 space-y-1.5">
            {/* Row 1: Value + Suffix + Delete */}
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={item.value}
                onChange={(e) => updateItem(i, { value: parseInt(e.target.value) || 0 })}
                className="h-7 w-16 bg-background border-0 text-sm font-medium flex-shrink-0"
                placeholder="23"
              />
              <Input
                value={item.suffix || ''}
                onChange={(e) => updateItem(i, { suffix: e.target.value })}
                className="h-7 w-12 bg-background border-0 text-sm text-center flex-shrink-0"
                placeholder="+"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(i)}
                className="h-6 w-6 ml-auto text-muted-foreground hover:text-destructive flex-shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            {/* Row 2: Label (smaller, subtle) */}
            <Input
              value={item.label}
              onChange={(e) => updateItem(i, { label: e.target.value })}
              className="h-6 bg-transparent border-0 text-[11px] text-muted-foreground px-1 focus:bg-muted"
              placeholder="Label..."
            />
          </div>
        ))}
      </div>

      <Separator className="my-3" />

      {/* Layout Section */}
      <InspectorSection title="Layout">
        <div className="space-y-2">
          <LabeledToggleRow
            value={content.layout || 'horizontal'}
            onChange={(v) => onContentChange({ layout: v })}
            options={[
              { value: 'horizontal', label: 'Horizontal' },
              { value: 'vertical', label: 'Vertical' },
            ]}
          />
          <VisualSlider
            value={content.gap || 32}
            onChange={(v) => onContentChange({ gap: v })}
            min={8}
            max={64}
            unit="px"
          />
        </div>
      </InspectorSection>

      {/* Values Section - Grouped */}
      <InspectorSection title="Value Style">
        <div className="space-y-2">
          <VisualSlider
            icon={<Type className="h-3.5 w-3.5" />}
            value={content.valueFontSize || 30}
            onChange={(v) => onContentChange({ valueFontSize: v })}
            min={16}
            max={72}
            unit="px"
          />
          <GradientColorPicker
            solidColor={content.valueColor || ''}
            gradient={content.valueGradient || ''}
            onSolidChange={(v) => onContentChange({ valueColor: v, valueGradient: '' })}
            onGradientChange={(v) => onContentChange({ valueGradient: v })}
          />
        </div>
      </InspectorSection>

      {/* Labels Section - Grouped */}
      <InspectorSection title="Label Style">
        <div className="space-y-2">
          <VisualSlider
            icon={<Type className="h-3.5 w-3.5" />}
            value={content.labelFontSize || 12}
            onChange={(v) => onContentChange({ labelFontSize: v })}
            min={8}
            max={24}
            unit="px"
          />
          <ColorSwatchPicker
            value={content.labelColor || ''}
            onChange={(v) => onContentChange({ labelColor: v })}
          />
        </div>
      </InspectorSection>

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== LOGO BAR INSPECTOR ==========
export function LogoBarInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;
  const logos = content.logos || [];
  const [showBrandfetchPicker, setShowBrandfetchPicker] = useState(false);

  // Calculate if we should auto-enable marquee
  const validLogos = logos.filter((logo: any) => logo.src);
  const hasEnoughLogosForAutoScroll = validLogos.length >= 4;
  const shouldAnimate = content.animated || hasEnoughLogosForAutoScroll;

  const addLogo = (logoData: { src: string; alt: string }) => {
    onContentChange({
      logos: [...logos, { id: uuid(), src: logoData.src, alt: logoData.alt }]
    });
  };

  const updateLogo = (index: number, updates: any) => {
    const newLogos = [...logos];
    newLogos[index] = { ...newLogos[index], ...updates };
    onContentChange({ logos: newLogos });
  };

  const removeLogo = (index: number) => {
    onContentChange({ logos: logos.filter((_: any, i: number) => i !== index) });
  };

  const titleStyles = content.titleStyles || {};

  const handleTitleStyleChange = (updates: any) => {
    onContentChange({ titleStyles: { ...titleStyles, ...updates } });
  };

  return (
    <>
    <BrandfetchPicker
      isOpen={showBrandfetchPicker}
      onClose={() => setShowBrandfetchPicker(false)}
      onSelect={(logo) => {
        addLogo(logo);
        setShowBrandfetchPicker(false);
      }}
    />
    <div className="space-y-4">
      <InspectorSection title="Section Title">
        <Input
          value={content.title || ''}
          onChange={(e) => onContentChange({ title: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Trusted by leading companies"
        />
      </InspectorSection>

      {/* Title Typography */}
      <InspectorSection title="Title Font Size">
        <VisualSlider
          icon={<Type className="h-3.5 w-3.5" />}
          value={titleStyles.fontSize || 12}
          onChange={(v) => handleTitleStyleChange({ fontSize: v })}
          min={8}
          max={24}
          unit="px"
        />
      </InspectorSection>

      <InspectorSection title="Title Alignment">
        <TextAlignControls
          value={titleStyles.textAlign || 'center'}
          onChange={(v) => handleTitleStyleChange({ textAlign: v })}
        />
      </InspectorSection>

      <InspectorSection title="Title Color">
        <ColorSwatchPicker
          value={titleStyles.color || '#6b7280'}
          onChange={(v) => handleTitleStyleChange({ color: v })}
        />
      </InspectorSection>

      <Separator />

      {/* Animation Controls */}
      <InspectorSection title="Animation">
        <ToggleSwitchRow
          label={hasEnoughLogosForAutoScroll ? "Marquee Scroll (Auto)" : "Marquee Scroll"}
          checked={shouldAnimate}
          onChange={(v) => onContentChange({ animated: v })}
          disabled={hasEnoughLogosForAutoScroll}
        />
      </InspectorSection>

      {shouldAnimate && (
        <>
          <InspectorSection title="Speed">
            <IconToggleRow
              value={content.speed || 'medium'}
              onChange={(v) => onContentChange({ speed: v })}
              options={[
                { value: 'slow', icon: <span className="text-[10px]">Slow</span>, label: '60s loop' },
                { value: 'medium', icon: <span className="text-[10px]">Med</span>, label: '30s loop' },
                { value: 'fast', icon: <span className="text-[10px]">Fast</span>, label: '15s loop' },
              ]}
            />
          </InspectorSection>

          <InspectorSection title="Direction">
            <IconToggleRow
              value={content.direction || 'left'}
              onChange={(v) => onContentChange({ direction: v })}
              options={[
                { value: 'left', icon: <span className="text-[10px]">← Left</span>, label: 'Scroll left' },
                { value: 'right', icon: <span className="text-[10px]">Right →</span>, label: 'Scroll right' },
              ]}
            />
          </InspectorSection>

          <ToggleSwitchRow
            label="Pause on Hover"
            checked={content.pauseOnHover !== false}
            onChange={(v) => onContentChange({ pauseOnHover: v })}
          />
        </>
      )}

      <ToggleSwitchRow
        label="Grayscale Effect"
        checked={content.grayscale !== false}
        onChange={(v) => onContentChange({ grayscale: v })}
      />

      <Separator />

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Logos</span>
        <Button variant="outline" size="sm" onClick={() => setShowBrandfetchPicker(true)} className="h-7">
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-2">
        {logos.map((logo: any, i: number) => (
          <div key={logo.id} className="bg-muted/50 rounded-lg p-2 space-y-2 border border-border/50">
            {/* Header row with title and delete */}
            <div className="flex items-center justify-between">
              <Input
                value={logo.alt}
                onChange={(e) => updateLogo(i, { alt: e.target.value })}
                className="h-6 text-xs bg-transparent border-0 p-0 focus-visible:ring-0 flex-1 font-medium"
                placeholder={`Logo ${i + 1}`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeLogo(i)}
                className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Compact image picker row */}
            <div className="flex items-center gap-2">
              {/* Thumbnail preview */}
              <div 
                className="w-12 h-12 rounded-md bg-background border border-border flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        updateLogo(i, { src: ev.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
              >
                {logo.src ? (
                  <img src={logo.src} alt={logo.alt} className="w-full h-full object-contain p-1" />
                ) : (
                  <Image className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              
              {/* URL input */}
              <Input
                value={logo.src || ''}
                onChange={(e) => updateLogo(i, { src: e.target.value })}
                className="h-8 text-xs bg-background flex-1"
                placeholder="Paste image URL..."
              />
            </div>
          </div>
        ))}
      </div>

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
    </>
  );
}

// ========== FORM INSPECTOR ==========
export function FormInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;
  const fields = content.fields || [];
  const consent = content.consent || { enabled: false, text: 'I have read and accept the', linkText: 'privacy policy', linkUrl: '#', required: true };

  const addField = () => {
    onContentChange({
      fields: [...fields, { id: uuid(), type: 'text', label: 'New field', placeholder: '', trackingId: generateTrackingId('field') }]
    });
  };

  const updateField = (index: number, updates: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onContentChange({ fields: newFields });
  };

  const removeField = (index: number) => {
    onContentChange({ fields: fields.filter((_: any, i: number) => i !== index) });
  };

  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= fields.length) return;
    const newFields = [...fields];
    const [moved] = newFields.splice(from, 1);
    newFields.splice(to, 0, moved);
    onContentChange({ fields: newFields });
  };

  const updateConsent = (updates: any) => {
    onContentChange({ consent: { ...consent, ...updates } });
  };

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'textarea', label: 'Textarea' },
  ];

  const submitButton = content.submitButton || {};
  const buttonAction = submitButton.action || 'next-step';
  const isFinalSubmit = buttonAction === 'submit';

  return (
    <div className="space-y-4">
      {/* Lead Capture Indicator */}
      <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
        <div className="flex items-start gap-2">
          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 space-y-1">
            <p className="text-xs font-medium text-foreground">Lead Capture: Enabled</p>
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              {isFinalSubmit ? (
                <>
                  <p className="font-semibold text-amber-600 dark:text-amber-500">⚠️ Final Submission</p>
                  <p>• Form data will be saved with status "complete"</p>
                  <p>• Configured webhooks will be triggered</p>
                  <p>• Automations will fire</p>
                  <p>• Then navigates to next step</p>
                </>
              ) : (
                <>
                  <p>• Form data will be saved as draft automatically</p>
                  <p>• Lead status: "incomplete" (saved progressively)</p>
                  <p>• Webhooks will NOT trigger until final submit</p>
                  <p>• Navigates to next step after submission</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Form Title */}
      <InspectorSection title="Form Title (Optional)">
        <Input
          value={content.title || ''}
          onChange={(e) => onContentChange({ title: e.target.value })}
          placeholder="e.g., Where can we reach you?"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Leave empty to hide the title
        </p>
      </InspectorSection>
      
      <Separator />

      {/* Privacy Consent Section */}
      <InspectorSection title="Privacy Consent">
        <div className="space-y-3">
          <ToggleSwitchRow
            label="Show Privacy Checkbox"
            checked={consent.enabled}
            onChange={(v) => updateConsent({ enabled: v })}
          />
          
          {consent.enabled && (
            <>
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Consent Text</span>
                <Input
                  value={consent.text}
                  onChange={(e) => updateConsent({ text: e.target.value })}
                  className="h-8 bg-muted border-0"
                  placeholder="I have read and accept the"
                />
              </div>
              
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Link Text</span>
                <Input
                  value={consent.linkText}
                  onChange={(e) => updateConsent({ linkText: e.target.value })}
                  className="h-8 bg-muted border-0"
                  placeholder="privacy policy"
                />
              </div>
              
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Link URL</span>
                <Input
                  value={consent.linkUrl}
                  onChange={(e) => updateConsent({ linkUrl: e.target.value })}
                  className="h-8 bg-muted border-0"
                  placeholder="https://example.com/privacy"
                />
              </div>
              
              <ToggleSwitchRow
                label="Required"
                checked={consent.required}
                onChange={(v) => updateConsent({ required: v })}
              />
            </>
          )}
        </div>
      </InspectorSection>

      <PopupSettingsSection content={content} onContentChange={onContentChange} />

      <Separator />

      {/* Fields Section */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Fields</span>
        <Button variant="outline" size="sm" onClick={addField} className="h-7">
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-3">
        {fields.map((field: any, i: number) => (
          <div key={field.id} className="bg-muted rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveField(i, i - 1)}
                  disabled={i === 0}
                  className="h-6 w-6 text-muted-foreground"
                >
                  <GripVertical className="h-3 w-3" />
                </Button>
                <span className="text-xs text-muted-foreground">Field {i + 1}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeField(i)}
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <LabeledToggleRow
              value={field.type}
              onChange={(v) => updateField(i, { type: v })}
              options={fieldTypes}
            />
            <Input
              value={field.label}
              onChange={(e) => updateField(i, { label: e.target.value })}
              className="h-8 bg-background border-0"
              placeholder="Label"
            />
            <Input
              value={field.placeholder || ''}
              onChange={(e) => updateField(i, { placeholder: e.target.value })}
              className="h-8 bg-background border-0"
              placeholder="Placeholder text"
            />
            <ToggleSwitchRow
              label="Required"
              checked={field.required || false}
              onChange={(v) => updateField(i, { required: v })}
            />
            {/* Field tracking ID */}
            <div>
              <Input
                value={field.trackingId || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                  updateField(i, { trackingId: value });
                }}
                placeholder="fld_abc123"
                className="h-7 text-xs font-mono bg-background"
              />
              <p className="text-[9px] text-muted-foreground mt-0.5 px-1">Tracking ID</p>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      <p className="text-xs text-muted-foreground px-1">
        Click the submit button on canvas to configure it.
      </p>

      <Separator />
      {onBlockChange && (
        <TrackingSection
          trackingId={block.trackingId || ''}
          onChange={(id) => onBlockChange({ trackingId: id })}
        />
      )}
    </div>
  );
}

// Avatar picker component with URL input and upload
function AvatarPicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = React.useState(false);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const blobUrl = URL.createObjectURL(file);
    onChange(blobUrl);
  };

  const hasAvatar = !!value;

  if (showUrlInput) {
    return (
      <div className="space-y-2">
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 bg-background border-0"
          placeholder="Paste image URL..."
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={() => setShowUrlInput(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />
      
      {hasAvatar ? (
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
            <img src={value} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => onChange('')}
          >
            Remove
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 flex-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs flex-1"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3 w-3 mr-1.5" />
            Upload
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setShowUrlInput(true)}
          >
            URL
          </Button>
        </div>
      )}
    </div>
  );
}

// ========== REVIEWS INSPECTOR (Social Proof Badge) ==========
export function ReviewsInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;
  const avatars = content.avatars || [];
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const addAvatar = (url: string) => {
    onContentChange({ avatars: [...avatars, url] });
  };

  const removeAvatar = (index: number) => {
    onContentChange({ avatars: avatars.filter((_: any, i: number) => i !== index) });
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const blobUrl = URL.createObjectURL(file);
    addAvatar(blobUrl);
  };

  return (
    <div className="space-y-4">
      {/* Rating */}
      <InspectorSection title="Rating">
        <VisualSlider
          icon={<Star className="h-4 w-4" />}
          value={content.rating || 4.8}
          onChange={(v) => onContentChange({ rating: v })}
          min={1}
          max={5}
          step={0.1}
        />
      </InspectorSection>

      {/* Review Count */}
      <InspectorSection title="Review Count">
        <Input
          value={content.reviewCount || '200+'}
          onChange={(e) => onContentChange({ reviewCount: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="e.g., 200+"
        />
      </InspectorSection>

      <Separator />

      {/* Avatars */}
      <InspectorSection title="Avatars">
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {avatars.map((avatar: string, i: number) => (
              <div key={i} className="relative group">
                <div className="w-full aspect-square rounded-full overflow-hidden bg-muted border-2 border-background">
                  <img src={avatar} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => removeAvatar(i)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ×
                </button>
                <span className="absolute bottom-0 left-0 bg-black/60 text-white text-[8px] px-1 rounded">{i + 1}</span>
              </div>
            ))}
            {/* Add button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-muted-foreground/50 transition-colors"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <p className="text-[10px] text-muted-foreground">Add up to 5 avatars. They will overlap in the display.</p>
        </div>
      </InspectorSection>

      <Separator />

      {/* Star Color */}
      <InspectorSection title="Star Color">
        <ColorSwatchPicker
          value={content.starColor || '#facc15'}
          onChange={(v) => onContentChange({ starColor: v })}
        />
      </InspectorSection>

      {/* Text Color */}
      <InspectorSection title="Text Color">
        <ColorSwatchPicker
          value={content.textColor || ''}
          onChange={(v) => onContentChange({ textColor: v })}
        />
      </InspectorSection>

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== TESTIMONIAL SLIDER INSPECTOR ==========
export function TestimonialSliderInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;
  const testimonials = content.testimonials || [];
  const fileInputRefs = React.useRef<{ [key: number]: HTMLInputElement | null }>({});

  const addTestimonial = () => {
    onContentChange({
      testimonials: [...testimonials, { 
        id: uuid(), 
        quote: 'This is an amazing product!', 
        authorName: 'John Doe', 
        authorTitle: 'CEO',
        backgroundImage: '' 
      }]
    });
  };

  const updateTestimonial = (index: number, updates: any) => {
    const newTestimonials = [...testimonials];
    newTestimonials[index] = { ...newTestimonials[index], ...updates };
    onContentChange({ testimonials: newTestimonials });
  };

  const removeTestimonial = (index: number) => {
    onContentChange({ testimonials: testimonials.filter((_: any, i: number) => i !== index) });
  };

  const handleImageUpload = (index: number, file: File) => {
    if (!file.type.startsWith('image/')) return;
    const blobUrl = URL.createObjectURL(file);
    updateTestimonial(index, { backgroundImage: blobUrl });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Testimonials</span>
        <Button variant="outline" size="sm" onClick={addTestimonial} className="h-7">
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-3">
        {testimonials.map((testimonial: any, i: number) => (
          <div key={testimonial.id} className="bg-muted rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Testimonial {i + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTestimonial(i)}
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Background Image */}
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Background Image</span>
              {testimonial.backgroundImage ? (
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                  <img 
                    src={testimonial.backgroundImage} 
                    alt="Background" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => updateTestimonial(i, { backgroundImage: '' })}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/80"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRefs.current[i]?.click()}
                  className="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-muted-foreground/50 transition-colors"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload Image</span>
                </button>
              )}
              <input
                ref={(el) => { fileInputRefs.current[i] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(i, file);
                }}
              />
            </div>

            {/* Quote */}
            <Textarea
              value={testimonial.quote}
              onChange={(e) => updateTestimonial(i, { quote: e.target.value })}
              className="min-h-[60px] text-sm bg-background border-0 resize-none"
              placeholder="Quote text"
            />

            {/* Author Name */}
            <Input
              value={testimonial.authorName}
              onChange={(e) => updateTestimonial(i, { authorName: e.target.value })}
              className="h-8 bg-background border-0"
              placeholder="Author name"
            />

            {/* Author Title */}
            <Input
              value={testimonial.authorTitle || ''}
              onChange={(e) => updateTestimonial(i, { authorTitle: e.target.value })}
              className="h-8 bg-background border-0"
              placeholder="Title (e.g., CEO at Company)"
            />
          </div>
        ))}
      </div>

      <Separator />

      {/* Auto Play */}
      <ToggleSwitchRow
        label="Auto Play"
        checked={content.autoPlay || false}
        onChange={(v) => onContentChange({ autoPlay: v })}
      />

      {/* Interval (only show if autoPlay is on) */}
      {content.autoPlay && (
        <InspectorSection title="Slide Interval (seconds)">
          <VisualSlider
            icon={<Clock className="h-4 w-4" />}
            value={content.interval || 5}
            onChange={(v) => onContentChange({ interval: v })}
            min={2}
            max={10}
            step={1}
          />
        </InspectorSection>
      )}

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== COLUMNS INSPECTOR ==========
export function ColumnsInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <InspectorSection title="Number of Columns">
        <IconToggleRow
          value={String(content.columns || 2)}
          onChange={(v) => {
            const newCols = parseInt(v);
            const currentBlocks = content.blocks || [];
            // Extend blocks array if needed
            const newBlocks = [...currentBlocks];
            while (newBlocks.length < newCols) {
              newBlocks.push([]);
            }
            onContentChange({ columns: newCols, blocks: newBlocks.slice(0, newCols) });
          }}
          options={[
            { value: '2', icon: <span className="text-xs font-medium">2</span>, label: '2 Columns' },
            { value: '3', icon: <span className="text-xs font-medium">3</span>, label: '3 Columns' },
            { value: '4', icon: <span className="text-xs font-medium">4</span>, label: '4 Columns' },
          ]}
        />
      </InspectorSection>

      <InspectorSection title="Gap">
        <VisualSlider
          value={content.gap || 16}
          onChange={(v) => onContentChange({ gap: v })}
          min={0}
          max={48}
          unit="px"
        />
      </InspectorSection>

      <div className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded">
        Drag blocks into each column on the canvas to populate them
      </div>
    </div>
  );
}

// ========== CARD INSPECTOR ==========
export function CardInspector({ block, onContentChange, onStyleChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;
  const blockCount = (content.blocks || []).length;

  const shadowOptions = ['none', 'sm', 'md', 'lg', 'xl'];

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded">
        Cards contain {blockCount} nested block{blockCount !== 1 ? 's' : ''}. 
        Drag blocks into the card on the canvas to add content.
      </div>

      <InspectorSection title="Shadow">
        <LabeledToggleRow
          value={block.styles.shadow || 'md'}
          onChange={(v) => onStyleChange({ shadow: v })}
          options={[
            { value: 'none', label: 'None' },
            { value: 'sm', label: 'S' },
            { value: 'md', label: 'M' },
            { value: 'lg', label: 'L' },
          ]}
        />
      </InspectorSection>

      <InspectorSection title="Background">
        <ColorSwatchPicker
          value={block.styles.backgroundColor || 'hsl(var(--card))'}
          onChange={(v) => onStyleChange({ backgroundColor: v })}
        />
      </InspectorSection>

      <InspectorSection title="Corner Radius">
        <VisualSlider
          icon={<Circle className="h-4 w-4" />}
          value={block.styles.borderRadius || 16}
          onChange={(v) => onStyleChange({ borderRadius: v })}
          min={0}
          max={32}
          unit="px"
        />
      </InspectorSection>

      <InspectorSection title="Border Color">
        <ColorSwatchPicker
          value={block.styles.borderColor || 'hsl(var(--border))'}
          onChange={(v) => onStyleChange({ borderColor: v, borderWidth: 1 })}
        />
      </InspectorSection>

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== LIST INSPECTOR ==========
export function ListInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;
  const items = content.items || [];
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const addItem = () => {
    onContentChange({
      items: [...items, { id: uuid(), text: 'New item' }]
    });
  };

  const updateItem = (index: number, updates: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    onContentChange({ items: newItems });
  };

  const updateItemIcon = (index: number, iconData: any) => {
    const newItems = [...items];
    const existingIcon = newItems[index].icon || {};
    newItems[index] = { 
      ...newItems[index], 
      icon: {
        ...existingIcon,
        mode: iconData.iconMode,
        iconName: iconData.iconName,
        emoji: iconData.emoji,
        imageSrc: iconData.imageSrc,
      }
    };
    onContentChange({ items: newItems });
  };

  const updateItemIconSize = (index: number, size: number) => {
    const newItems = [...items];
    const existingIcon = newItems[index].icon || { mode: 'icon', iconName: 'check' };
    newItems[index] = { 
      ...newItems[index], 
      icon: {
        ...existingIcon,
        size,
      }
    };
    onContentChange({ items: newItems });
  };

  const clearItemIcon = (index: number) => {
    const newItems = [...items];
    const { icon, ...rest } = newItems[index];
    newItems[index] = rest;
    onContentChange({ items: newItems });
  };

  const removeItem = (index: number) => {
    onContentChange({ items: items.filter((_: any, i: number) => i !== index) });
    if (editingItemIndex === index) {
      setEditingItemIndex(null);
    }
  };

  // Handle legacy 'check' style - treat as 'icon'
  const normalizedStyle = content.style === 'check' ? 'icon' : (content.style || 'bullet');

  // Get icon preview for an item
  const getItemIconPreview = (item: any) => {
    const icon = item.icon;
    if (!icon) return null;
    
    if (icon.mode === 'emoji') return icon.emoji;
    if (icon.mode === 'image') return '🖼';
    if (icon.mode === 'icon') return '✓';
    return null;
  };

  // Check if item has custom icon
  const hasCustomIcon = (item: any) => !!item.icon;

  return (
    <div className="space-y-4">
      <InspectorSection title="Style">
        <LabeledToggleRow
          value={normalizedStyle}
          onChange={(v) => onContentChange({ style: v })}
          options={[
            { value: 'bullet', label: 'Bullet' },
            { value: 'numbered', label: 'Numbered' },
            { value: 'icon', label: 'Icon' },
          ]}
        />
      </InspectorSection>

      {/* Default Icon Picker - only show when style is 'icon' */}
      {normalizedStyle === 'icon' && (
        <>
          <Separator />
          <InspectorSection title="Default Icon">
            <p className="text-[10px] text-muted-foreground mb-2">Used when item has no custom icon</p>
            <IconPicker
              iconMode={content.defaultIconMode || 'icon'}
              iconName={content.defaultIconName || 'check'}
              emoji={content.defaultEmoji || '✅'}
              imageSrc={content.defaultImageSrc || ''}
              iconColor={content.iconColor}
              onChange={(value) => onContentChange({
                defaultIconMode: value.iconMode,
                defaultIconName: value.iconName,
                defaultEmoji: value.emoji,
                defaultImageSrc: value.imageSrc,
              })}
            />
          </InspectorSection>
        </>
      )}

      <Separator />

      <InspectorSection title="Items">
        <div className="space-y-1.5">
          {items.map((item: any, i: number) => (
            <div key={item.id}>
              <div className="flex gap-1.5 items-center">
                {/* Icon button - only for icon style */}
                {normalizedStyle === 'icon' && (
                  <button
                    onClick={() => setEditingItemIndex(editingItemIndex === i ? null : i)}
                    className={cn(
                      "h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-xs transition-colors border",
                      editingItemIndex === i
                        ? "bg-primary text-primary-foreground border-primary"
                        : hasCustomIcon(item)
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted border-transparent text-muted-foreground hover:border-muted-foreground/30"
                    )}
                    title="Customize icon"
                  >
                    {getItemIconPreview(item) || '✓'}
                  </button>
                )}
                {normalizedStyle !== 'icon' && (
                  <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
                    {i + 1}
                  </div>
                )}
                <Input
                  value={item.text}
                  onChange={(e) => updateItem(i, { text: e.target.value })}
                  className="h-7 flex-1 bg-muted border-0 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(i)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Per-item icon picker - full width, compact mode */}
              {normalizedStyle === 'icon' && editingItemIndex === i && (
                <div className="mt-1.5 p-2 bg-muted/30 rounded-md border border-muted-foreground/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {hasCustomIcon(item) ? 'Custom Icon' : 'Set Custom Icon'}
                    </span>
                    {hasCustomIcon(item) && (
                      <button
                        onClick={() => clearItemIcon(i)}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <IconPicker
                    iconMode={item.icon?.mode || content.defaultIconMode || 'icon'}
                    iconName={item.icon?.iconName || content.defaultIconName || 'check'}
                    emoji={item.icon?.emoji || content.defaultEmoji || '✅'}
                    imageSrc={item.icon?.imageSrc || content.defaultImageSrc || ''}
                    iconColor={content.iconColor}
                    compact={true}
                    onChange={(value) => updateItemIcon(i, value)}
                  />
                  {/* Per-item size control */}
                  <div className="flex items-center gap-2 pt-2 border-t border-muted-foreground/10">
                    <span className="text-[10px] text-muted-foreground shrink-0 w-8">Size</span>
                    <div className="flex-1">
                      <VisualSlider
                        value={item.icon?.size || content.iconSize || 40}
                        onChange={(v) => updateItemIconSize(i, v)}
                        min={20}
                        max={80}
                        unit="px"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addItem} className="w-full mt-2 h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" /> Add Item
        </Button>
      </InspectorSection>

      <Separator />

      {/* Default Icon Size - only show for icon style */}
      {normalizedStyle === 'icon' && (
        <InspectorSection title="Default Icon Size">
          <p className="text-[10px] text-muted-foreground mb-1.5">Applied to items without custom size</p>
          <VisualSlider
            icon={<Circle className="h-3.5 w-3.5" />}
            value={content.iconSize || 40}
            onChange={(v) => onContentChange({ iconSize: v })}
            min={20}
            max={80}
            unit="px"
          />
        </InspectorSection>
      )}

      {/* Icon Background toggle - only show for icon style */}
      {normalizedStyle === 'icon' && (
        <ToggleSwitchRow
          label="Icon Background"
          checked={content.showIconBackground !== false}
          onChange={(v) => onContentChange({ showIconBackground: v })}
        />
      )}

      <InspectorSection title="Font Size">
        <VisualSlider
          icon={<Type className="h-3.5 w-3.5" />}
          value={content.fontSize || 16}
          onChange={(v) => onContentChange({ fontSize: v })}
          min={12}
          max={24}
          unit="px"
        />
      </InspectorSection>

      {/* Icon Color - only show for icon and bullet styles */}
      {(normalizedStyle === 'icon' || normalizedStyle === 'bullet' || normalizedStyle === 'numbered') && (
        <InspectorSection title="Icon Color">
          <ColorSwatchPicker
            value={content.iconColor || '#10b981'}
            onChange={(v) => onContentChange({ iconColor: v })}
            presets={['#10b981', '#6366f1', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#000000']}
          />
        </InspectorSection>
      )}

      <InspectorSection title="Text Color">
        <ColorSwatchPicker
          value={content.textColor || '#000000'}
          onChange={(v) => onContentChange({ textColor: v })}
          presets={['#000000', '#374151', '#6b7280', '#ffffff', '#ef4444', '#10b981', '#3b82f6', '#6366f1']}
        />
      </InspectorSection>

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== SLIDER INSPECTOR ==========
export function SliderInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;
  const images = content.images || [];

  const addImage = () => {
    onContentChange({
      images: [...images, { id: uuid(), src: 'https://placehold.co/400x300', alt: 'Slide' }]
    });
  };

  const updateImage = (index: number, updates: any) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], ...updates };
    onContentChange({ images: newImages });
  };

  const removeImage = (index: number) => {
    onContentChange({ images: images.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <InspectorSection title="Slides">
        <div className="space-y-2">
          {images.map((img: any, i: number) => (
            <div key={img.id} className="bg-muted rounded-lg p-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {img.src && (
                    <div className="w-10 h-10 rounded bg-background overflow-hidden">
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">Slide {i + 1}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeImage(i)}
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <MediaPicker
                value={img.src}
                onChange={(url) => updateImage(i, { src: url })}
                type="image"
                label=""
              />
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addImage} className="w-full mt-2">
          <Plus className="h-3 w-3 mr-1" /> Add Slide
        </Button>
      </InspectorSection>

      <Separator />

      <ToggleSwitchRow
        label="Show Dots"
        checked={content.showDots !== false}
        onChange={(v) => onContentChange({ showDots: v })}
      />

      <ToggleSwitchRow
        label="Show Arrows"
        checked={content.showArrows !== false}
        onChange={(v) => onContentChange({ showArrows: v })}
      />

      <ToggleSwitchRow
        label="Autoplay"
        checked={content.autoplay || false}
        onChange={(v) => onContentChange({ autoplay: v })}
      />

      {content.autoplay && (
        <InspectorSection title="Interval">
          <VisualSlider
            icon={<Clock className="h-4 w-4" />}
            value={content.interval || 5}
            onChange={(v) => onContentChange({ interval: v })}
            min={1}
            max={10}
            unit="s"
          />
        </InspectorSection>
      )}

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== GRAPHIC INSPECTOR ==========
export function GraphicInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <InspectorSection title="Type">
        <LabeledToggleRow
          value={content.type || 'emoji'}
          onChange={(v) => onContentChange({ type: v })}
          options={[
            { value: 'emoji', label: 'Emoji' },
            { value: 'icon', label: 'Icon' },
            { value: 'shape', label: 'Shape' },
          ]}
        />
      </InspectorSection>

      <InspectorSection title="Value">
        <Input
          value={content.value || ''}
          onChange={(e) => onContentChange({ value: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder={content.type === 'emoji' ? '🎯' : 'star'}
        />
      </InspectorSection>

      <InspectorSection title="Size">
        <VisualSlider
          value={content.size || 48}
          onChange={(v) => onContentChange({ size: v })}
          min={16}
          max={128}
          unit="px"
        />
      </InspectorSection>

      {(content.type === 'icon' || content.type === 'shape') && (
        <InspectorSection title="Color">
          <ColorSwatchPicker
            value={content.color || '#6366f1'}
            onChange={(v) => onContentChange({ color: v })}
          />
        </InspectorSection>
      )}
    </div>
  );
}

// ========== WEBINAR INSPECTOR ==========
export function WebinarInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <InspectorSection title="Video Type">
        <LabeledToggleRow
          value={content.videoType || 'youtube'}
          onChange={(v) => onContentChange({ videoType: v })}
          options={[
            { value: 'youtube', label: 'YouTube' },
            { value: 'vimeo', label: 'Vimeo' },
            { value: 'hosted', label: 'Hosted' },
          ]}
        />
      </InspectorSection>

      <MediaPicker
        value={content.videoSrc || ''}
        onChange={(url) => onContentChange({ videoSrc: url })}
        type="video"
        label="Video"
        placeholder={content.videoType === 'hosted' ? 'https://example.com/video.mp4' : 'https://youtube.com/watch?v=...'}
      />

      <Separator />

      <InspectorSection title="Title">
        <Input
          value={content.title || ''}
          onChange={(e) => onContentChange({ title: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Watch this webinar"
        />
      </InspectorSection>

      <InspectorSection title="Title Color">
        <GradientColorPicker
          solidColor={content.titleColor || ''}
          gradient={content.titleGradient || ''}
          onSolidChange={(v) => onContentChange({ titleColor: v, titleGradient: '' })}
          onGradientChange={(v) => onContentChange({ titleGradient: v })}
        />
      </InspectorSection>

      <Separator />

      <InspectorSection title="Button Text">
        <Input
          value={content.buttonText || ''}
          onChange={(e) => onContentChange({ buttonText: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Register Now"
        />
      </InspectorSection>

      <InspectorSection title="Button Color">
        <GradientColorPicker
          solidColor={content.buttonColor || '#6366f1'}
          gradient={content.buttonGradient || ''}
          onSolidChange={(v) => onContentChange({ buttonColor: v, buttonGradient: '' })}
          onGradientChange={(v) => onContentChange({ buttonGradient: v })}
        />
      </InspectorSection>

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== LOADER INSPECTOR ==========
export function LoaderInspector({ block, onContentChange, funnel }: BlockInspectorProps & { funnel?: any }) {
  const content = block.content as any;
  const steps = funnel?.steps || [];
  const action = content.action || { type: 'next-step' };

  const updateAction = (updates: any) => {
    onContentChange({ action: { ...action, ...updates } });
  };

  return (
    <div className="space-y-4">
      {/* Loader Style */}
      <InspectorSection title="Animation Style">
        <div className="grid grid-cols-5 gap-1">
          {[
            { value: 'circular', icon: '◎', label: 'Spin' },
            { value: 'dots', icon: '•••', label: 'Dots' },
            { value: 'bars', icon: '▮▮▮', label: 'Bars' },
            { value: 'progress', icon: '▬', label: 'Bar' },
            { value: 'pulse', icon: '◉', label: 'Pulse' },
          ].map((style) => (
            <button
              key={style.value}
              onClick={() => onContentChange({ loaderStyle: style.value })}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors",
                content.loaderStyle === style.value
                  ? "border-primary bg-primary/10"
                  : "border-transparent bg-muted hover:bg-muted/80"
              )}
            >
              <span className="text-lg">{style.icon}</span>
              <span className="text-[10px]">{style.label}</span>
            </button>
          ))}
        </div>
      </InspectorSection>

      {/* Size */}
      <InspectorSection title="Size">
        <LabeledToggleRow
          value={content.size || 'medium'}
          onChange={(v) => onContentChange({ size: v })}
          options={[
            { value: 'small', label: 'S' },
            { value: 'medium', label: 'M' },
            { value: 'large', label: 'L' },
          ]}
        />
      </InspectorSection>

      <Separator />

      {/* Text */}
      <InspectorSection title="Loading Text">
        <Input
          value={content.text || ''}
          onChange={(e) => onContentChange({ text: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Processing your information..."
        />
      </InspectorSection>

      {/* Subtext */}
      <InspectorSection title="Subtext (optional)">
        <Input
          value={content.subtext || ''}
          onChange={(e) => onContentChange({ subtext: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="This only takes a few seconds"
        />
      </InspectorSection>

      <Separator />

      {/* Duration */}
      <InspectorSection title="Duration">
        <VisualSlider
          icon={<Clock className="h-4 w-4" />}
          value={content.duration || 3}
          onChange={(v) => onContentChange({ duration: v })}
          min={1}
          max={10}
          step={0.5}
          unit="s"
        />
      </InspectorSection>

      <Separator />

      {/* After Loading Action */}
      <InspectorSection title="After Loading">
        <div className="space-y-2">
          {/* Action Type Selection */}
          <div className="space-y-1.5">
            {[
              { value: 'next-step', label: 'Go to next step' },
              { value: 'specific-step', label: 'Go to specific step' },
              { value: 'external-url', label: 'Redirect to URL' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateAction({ type: option.value })}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  action.type === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Conditional inputs based on action type */}
          {action.type === 'specific-step' && steps.length > 0 && (
            <div className="pt-2">
              <select
                value={action.stepId || ''}
                onChange={(e) => updateAction({ stepId: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm"
              >
                <option value="">Select a step...</option>
                {steps.map((step: any) => (
                  <option key={step.id} value={step.id}>
                    {step.name || `Step ${steps.indexOf(step) + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {action.type === 'external-url' && (
            <div className="pt-2">
              <Input
                value={action.url || ''}
                onChange={(e) => updateAction({ url: e.target.value })}
                className="h-9 bg-muted border-0"
                placeholder="https://example.com"
              />
            </div>
          )}
        </div>
      </InspectorSection>

      <Separator />

      {/* Loader Color */}
      <InspectorSection title="Loader Color">
        <ColorSwatchPicker
          value={content.color || '#6366f1'}
          onChange={(v) => onContentChange({ color: v })}
        />
      </InspectorSection>

      {/* Background Color */}
      <InspectorSection title="Background Color">
        <ColorSwatchPicker
          value={content.backgroundColor || ''}
          onChange={(v) => onContentChange({ backgroundColor: v })}
        />
      </InspectorSection>
    </div>
  );
}

// ========== EMBED INSPECTOR ==========
export function EmbedInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <InspectorSection title="Provider">
        <LabeledToggleRow
          value={content.provider || 'html'}
          onChange={(v) => onContentChange({ provider: v })}
          options={[
            { value: 'html', label: 'HTML' },
            { value: 'trustpilot', label: 'Trust' },
            { value: 'googlemaps', label: 'Maps' },
          ]}
        />
      </InspectorSection>

      {content.provider === 'html' ? (
        <InspectorSection title="Embed Code">
          <Textarea
            value={content.embedCode || ''}
            onChange={(e) => onContentChange({ embedCode: e.target.value })}
            className="min-h-[100px] bg-muted border-0 resize-none font-mono text-xs"
            placeholder="<iframe>...</iframe>"
          />
        </InspectorSection>
      ) : (
        <InspectorSection title="Widget URL">
          <Input
            value={content.url || ''}
            onChange={(e) => onContentChange({ url: e.target.value })}
            className="h-9 bg-muted border-0"
            placeholder="https://..."
          />
        </InspectorSection>
      )}

      <InspectorSection title="Height">
        <VisualSlider
          value={content.height || 400}
          onChange={(v) => onContentChange({ height: v })}
          min={200}
          max={800}
          unit="px"
        />
      </InspectorSection>

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== IMAGE QUIZ INSPECTOR ==========
export function ImageQuizInspector({ block, onContentChange, onBlockChange, funnel }: BlockInspectorProps & { funnel?: any }) {
  const content = block.content as any;
  const options = content.options || [];
  const steps = funnel?.steps || [];
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const shouldShowSubmitButton = content.showSubmitButton || content.multiSelect || false;

  const addOption = () => {
    onContentChange({
      options: [...options, { id: uuid(), image: 'https://placehold.co/200x200', text: 'Option', trackingId: generateTrackingId('option') }]
    });
  };

  const updateOption = (index: number, updates: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    // Sync nextStepId with actionValue for backwards compatibility
    if (updates.actionValue && (updates.action === 'next-step' || (!updates.action && newOptions[index].action === 'next-step'))) {
      newOptions[index].nextStepId = updates.actionValue;
    }
    onContentChange({ options: newOptions });
  };

  const removeOption = (index: number) => {
    onContentChange({ options: options.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      {/* Behavior Explanation */}
      <div className="p-2 bg-muted/50 rounded-lg border border-border/50">
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-[10px] text-muted-foreground">
            {shouldShowSubmitButton ? (
              <div>
                <p className="font-medium text-foreground mb-0.5">Submit Button Mode</p>
                <p>Answer options mark selection. Submit button controls navigation and actions.</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-foreground mb-0.5">Direct Answer Mode</p>
                <p>Each answer executes its own action immediately when clicked. Configure actions below.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <InspectorSection title="Question">
        <Textarea
          value={content.question || ''}
          onChange={(e) => onContentChange({ question: e.target.value })}
          className="min-h-[60px] bg-muted border-0 resize-none"
          placeholder="What's your question?"
        />
      </InspectorSection>

      <ToggleSwitchRow
        label="Allow Multiple Selections"
        checked={content.multiSelect || false}
        onChange={(v) => onContentChange({ multiSelect: v })}
      />

      <ToggleSwitchRow
        label="Show Submit Button"
        checked={content.showSubmitButton || content.multiSelect || false}
        onChange={(v) => onContentChange({ showSubmitButton: v })}
      />

      {(content.showSubmitButton || content.multiSelect) && (
        <p className="text-xs text-muted-foreground px-1">
          Click the submit button on canvas to configure it.
        </p>
      )}

      <Separator />

      <InspectorSection title="Image Options">
        <div className="space-y-2">
          {options.map((opt: any, i: number) => (
            <div key={opt.id} className="bg-muted rounded-lg p-2 space-y-1.5">
              {/* Row 1: Thumbnail + Label + Delete */}
              <div className="flex items-center gap-2">
                <div 
                  onClick={() => setEditingOptionIndex(i)}
                  className="w-12 h-12 rounded bg-background border border-border flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {opt.image ? (
                    <img src={opt.image} alt={opt.text} className="w-full h-full object-cover" />
                  ) : (
                    <Image className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <Input
                  value={opt.text}
                  onChange={(e) => updateOption(i, { text: e.target.value })}
                  className="h-7 text-xs bg-background border-0 flex-1"
                  placeholder="Label"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(i)}
                  className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Row 2: Answer Action Configuration - Only show when NO submit button */}
              {!shouldShowSubmitButton && (
                <div className="space-y-1 bg-background rounded p-1.5 border border-border/50">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Action:</span>
                    <select
                      value={opt.action || (opt.nextStepId ? 'next-step' : 'next-step')}
                      onChange={(e) => {
                        const action = e.target.value;
                        updateOption(i, { 
                          action: action as 'next-step' | 'url' | 'submit',
                          // Clear actionValue if switching away from next-step
                          actionValue: action === 'next-step' ? (opt.actionValue || opt.nextStepId) : undefined
                        });
                      }}
                      className="flex-1 h-5 px-1 text-[10px] bg-muted rounded border-0"
                    >
                      <option value="next-step">Next Step</option>
                      <option value="url">URL</option>
                      <option value="submit">Submit</option>
                    </select>
                  </div>
                  
                  {/* Action value input (step selector or URL input) */}
                  {(opt.action || (opt.nextStepId ? 'next-step' : 'next-step')) === 'next-step' && steps.length > 1 && (
                    <select
                      value={opt.actionValue || opt.nextStepId || ''}
                      onChange={(e) => updateOption(i, { actionValue: e.target.value, nextStepId: e.target.value })}
                      className="w-full h-5 px-1 text-[10px] bg-background rounded border border-border/50"
                    >
                      <option value="">→ Sequential next</option>
                      {steps.map((step: any) => (
                        <option key={step.id} value={step.id}>→ {step.name}</option>
                      ))}
                    </select>
                  )}
                  
                  {(opt.action || 'next-step') === 'url' && (
                    <Input
                      value={opt.actionValue || ''}
                      onChange={(e) => updateOption(i, { actionValue: e.target.value })}
                      placeholder="https://..."
                      className="h-5 text-[10px] bg-background"
                    />
                  )}
                  
                  {(opt.action || 'next-step') === 'submit' && (
                    <p className="text-[9px] text-amber-600 dark:text-amber-500">
                      Will finalize lead and trigger webhooks
                    </p>
                  )}
                </div>
              )}

              {/* Row 3: Colors + Tracking ID */}
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={opt.backgroundColor || '#ffffff'}
                  onChange={(e) => updateOption(i, { backgroundColor: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0"
                  title="Background color"
                />
                <input
                  type="color"
                  value={opt.textColor || '#000000'}
                  onChange={(e) => updateOption(i, { textColor: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0"
                  title="Text color"
                />
                <input
                  type="color"
                  value={opt.borderColor || '#e5e7eb'}
                  onChange={(e) => updateOption(i, { borderColor: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0"
                  title="Border color"
                />
                <div className="h-4 w-px bg-border mx-0.5" />
                <Input
                  value={opt.trackingId || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                    updateOption(i, { trackingId: value });
                  }}
                  placeholder="tracking_id"
                  className="h-6 text-[10px] font-mono bg-background flex-1"
                  title="Tracking ID"
                />
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addOption} className="w-full mt-2">
          <Plus className="h-3 w-3 mr-1" /> Add Option
        </Button>
      </InspectorSection>

      {/* MediaPicker Modal */}
      {editingOptionIndex !== null && (
        <Dialog open={editingOptionIndex !== null} onOpenChange={() => setEditingOptionIndex(null)}>
          <DialogContent className="max-w-2xl">
            <MediaPicker
              value={options[editingOptionIndex]?.image || ''}
              onChange={(url) => {
                updateOption(editingOptionIndex, { image: url });
                setEditingOptionIndex(null);
              }}
              type="image"
              label="Option Image"
            />
          </DialogContent>
        </Dialog>
      )}

      <Separator />

      {/* Option Card Style */}
      <InspectorSection title="Option Style">
        <LabeledToggleRow
          value={content.optionStyle || 'outline'}
          onChange={(v) => onContentChange({ optionStyle: v })}
          options={[
            { value: 'outline', label: 'Outline' },
            { value: 'filled', label: 'Filled' },
          ]}
        />
      </InspectorSection>

      {/* Question Text Color/Gradient */}
      <InspectorSection title="Question Color">
        <GradientColorPicker
          solidColor={content.questionColor || ''}
          gradient={content.questionStyles?.textGradient || ''}
          onSolidChange={(v) => onContentChange({ questionColor: v, questionStyles: { ...(content.questionStyles || {}), textGradient: '' } })}
          onGradientChange={(v) => onContentChange({ questionStyles: { ...(content.questionStyles || {}), textGradient: v } })}
        />
      </InspectorSection>

      {/* Option Text Color */}
      <InspectorSection title="Option Text Color">
        <ColorSwatchPicker
          value={content.optionTextColor || ''}
          onChange={(v) => onContentChange({ optionTextColor: v })}
        />
      </InspectorSection>

      {/* Selected Option Color */}
      <InspectorSection title="Selected Option Color">
        <ColorSwatchPicker
          value={content.selectedOptionColor || ''}
          onChange={(v) => onContentChange({ selectedOptionColor: v })}
        />
      </InspectorSection>

      <PopupSettingsSection content={content} onContentChange={onContentChange} />

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== VIDEO QUESTION INSPECTOR ==========
export function VideoQuestionInspector({ block, onContentChange, onBlockChange, funnel }: BlockInspectorProps & { funnel?: any }) {
  const content = block.content as any;
  const options = content.options || [];
  const steps = funnel?.steps || [];
  const shouldShowSubmitButton = content.showSubmitButton || content.multiSelect || false;

  const addOption = () => {
    onContentChange({
      options: [...options, { id: uuid(), text: 'New option', trackingId: generateTrackingId('option') }]
    });
  };

  const updateOption = (index: number, updates: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    // Sync nextStepId with actionValue for backwards compatibility
    if (updates.actionValue && (updates.action === 'next-step' || (!updates.action && newOptions[index].action === 'next-step'))) {
      newOptions[index].nextStepId = updates.actionValue;
    }
    onContentChange({ options: newOptions });
  };

  const removeOption = (index: number) => {
    onContentChange({ options: options.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <InspectorSection title="Video Type">
        <LabeledToggleRow
          value={content.videoType || 'youtube'}
          onChange={(v) => onContentChange({ videoType: v })}
          options={[
            { value: 'youtube', label: 'YouTube' },
            { value: 'vimeo', label: 'Vimeo' },
            { value: 'hosted', label: 'Hosted' },
          ]}
        />
      </InspectorSection>

      <MediaPicker
        value={content.videoSrc || ''}
        onChange={(url) => onContentChange({ videoSrc: url })}
        type="video"
        label="Video"
        placeholder={content.videoType === 'hosted' ? 'https://example.com/video.mp4' : 'https://youtube.com/watch?v=...'}
      />

      <Separator />

      {/* Behavior Explanation */}
      <div className="p-2 bg-muted/50 rounded-lg border border-border/50">
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-[10px] text-muted-foreground">
            {shouldShowSubmitButton ? (
              <div>
                <p className="font-medium text-foreground mb-0.5">Submit Button Mode</p>
                <p>Answer options mark selection. Submit button controls navigation and actions.</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-foreground mb-0.5">Direct Answer Mode</p>
                <p>Each answer executes its own action immediately when clicked. Configure actions below.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <InspectorSection title="Question">
        <Textarea
          value={content.question || ''}
          onChange={(e) => onContentChange({ question: e.target.value })}
          className="min-h-[60px] bg-muted border-0 resize-none"
          placeholder="What's your question?"
        />
      </InspectorSection>

      <ToggleSwitchRow
        label="Allow Multiple Selections"
        checked={content.multiSelect || false}
        onChange={(v) => onContentChange({ multiSelect: v })}
      />

      <ToggleSwitchRow
        label="Show Submit Button"
        checked={content.showSubmitButton || content.multiSelect || false}
        onChange={(v) => onContentChange({ showSubmitButton: v })}
      />

      {(content.showSubmitButton || content.multiSelect) && (
        <p className="text-xs text-muted-foreground px-1">
          Click the submit button on canvas to configure it.
        </p>
      )}

      <InspectorSection title="Options">
        <div className="space-y-2">
          {options.map((opt: any, i: number) => (
            <div key={opt.id} className="space-y-1 p-2 bg-muted/50 rounded-lg">
              <div className="flex gap-2 items-center">
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  {i + 1}
                </div>
                <Input
                  value={opt.text}
                  onChange={(e) => updateOption(i, { text: e.target.value })}
                  className="h-8 flex-1 bg-background border-0"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(i)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              {/* Answer Action Configuration - Only show when NO submit button */}
              {!shouldShowSubmitButton && (
                <div className="space-y-1 ml-7 bg-background rounded p-1.5 border border-border/50">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Action:</span>
                  <select
                    value={opt.action || (opt.nextStepId ? 'next-step' : 'next-step')}
                    onChange={(e) => {
                      const action = e.target.value;
                      updateOption(i, { 
                        action: action as 'next-step' | 'url' | 'submit',
                        // Clear actionValue if switching away from next-step
                        actionValue: action === 'next-step' ? (opt.actionValue || opt.nextStepId) : undefined
                      });
                    }}
                    className="flex-1 h-5 px-1 text-[10px] bg-muted rounded border-0"
                  >
                    <option value="next-step">Next Step</option>
                    <option value="url">URL</option>
                    <option value="submit">Submit</option>
                  </select>
                </div>
                
                {/* Action value input (step selector or URL input) */}
                {(opt.action || (opt.nextStepId ? 'next-step' : 'next-step')) === 'next-step' && steps.length > 1 && (
                  <select
                    value={opt.actionValue || opt.nextStepId || ''}
                    onChange={(e) => updateOption(i, { actionValue: e.target.value, nextStepId: e.target.value })}
                    className="w-full h-5 px-1 text-[10px] bg-background rounded border border-border/50"
                  >
                    <option value="">→ Sequential next</option>
                    {steps.map((step: any) => (
                      <option key={step.id} value={step.id}>→ {step.name}</option>
                    ))}
                  </select>
                )}
                
                {(opt.action || 'next-step') === 'url' && (
                  <Input
                    value={opt.actionValue || ''}
                    onChange={(e) => updateOption(i, { actionValue: e.target.value })}
                    placeholder="https://..."
                    className="h-5 text-[10px] bg-background"
                  />
                )}
                
                {(opt.action || 'next-step') === 'submit' && (
                  <p className="text-[9px] text-amber-600 dark:text-amber-500">
                    Will finalize lead and trigger webhooks
                  </p>
                )}
                </div>
              )}
              {/* Per-option colors */}
              <div className="flex items-center gap-2 ml-7">
                <span className="text-[10px] text-muted-foreground shrink-0 w-8">BG:</span>
                <input
                  type="color"
                  value={opt.backgroundColor || '#ffffff'}
                  onChange={(e) => updateOption(i, { backgroundColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0"
                />
                <span className="text-[10px] text-muted-foreground shrink-0 w-8 ml-2">Text:</span>
                <input
                  type="color"
                  value={opt.textColor || '#000000'}
                  onChange={(e) => updateOption(i, { textColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0"
                />
                {(opt.backgroundColor || opt.textColor) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1 text-[10px] text-muted-foreground"
                    onClick={() => updateOption(i, { backgroundColor: undefined, textColor: undefined })}
                  >
                    Reset
                  </Button>
                )}
              </div>
              {/* Option tracking ID */}
              <div className="ml-7">
                <Input
                  value={opt.trackingId || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                    updateOption(i, { trackingId: value });
                  }}
                  placeholder="opt_abc123"
                  className="h-7 text-xs font-mono bg-background"
                />
                <p className="text-[9px] text-muted-foreground mt-0.5 px-1">Tracking ID</p>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addOption} className="w-full mt-2">
          <Plus className="h-3 w-3 mr-1" /> Add Option
        </Button>
      </InspectorSection>

      <Separator />

      {/* Option Card Style */}
      <InspectorSection title="Option Style">
        <LabeledToggleRow
          value={content.optionStyle || 'outline'}
          onChange={(v) => onContentChange({ optionStyle: v })}
          options={[
            { value: 'outline', label: 'Outline' },
            { value: 'filled', label: 'Filled' },
          ]}
        />
      </InspectorSection>

      {/* Question Text Color/Gradient */}
      <InspectorSection title="Question Color">
        <GradientColorPicker
          solidColor={content.questionColor || ''}
          gradient={content.questionStyles?.textGradient || ''}
          onSolidChange={(v) => onContentChange({ questionColor: v, questionStyles: { ...(content.questionStyles || {}), textGradient: '' } })}
          onGradientChange={(v) => onContentChange({ questionStyles: { ...(content.questionStyles || {}), textGradient: v } })}
        />
      </InspectorSection>

      {/* Option Text Color */}
      <InspectorSection title="Option Text Color">
        <ColorSwatchPicker
          value={content.optionTextColor || ''}
          onChange={(v) => onContentChange({ optionTextColor: v })}
        />
      </InspectorSection>

      {/* Selected Option Color */}
      <InspectorSection title="Selected Option Color">
        <ColorSwatchPicker
          value={content.selectedOptionColor || ''}
          onChange={(v) => onContentChange({ selectedOptionColor: v })}
        />
      </InspectorSection>

      <PopupSettingsSection content={content} onContentChange={onContentChange} />
    </div>
  );
}

// ========== UPLOAD INSPECTOR ==========
export function UploadInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <PrivacyConsentSection content={content} onContentChange={onContentChange} />

      <InspectorSection title="Label">
        <Input
          value={content.label || ''}
          onChange={(e) => onContentChange({ label: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Upload your file"
        />
      </InspectorSection>

      <InspectorSection title="Accepted Types">
        <Input
          value={(content.acceptedTypes || []).join(', ')}
          onChange={(e) => onContentChange({ acceptedTypes: e.target.value.split(',').map((s: string) => s.trim()) })}
          className="h-9 bg-muted border-0"
          placeholder="image/*, .pdf, .doc"
        />
        <p className="text-[10px] text-muted-foreground mt-1">Comma-separated file types</p>
      </InspectorSection>

      <InspectorSection title="Max Size">
        <VisualSlider
          value={content.maxSize || 10}
          onChange={(v) => onContentChange({ maxSize: v })}
          min={1}
          max={50}
          unit="MB"
        />
      </InspectorSection>

      <InspectorSection title="Button Text">
        <Input
          value={content.buttonText || ''}
          onChange={(e) => onContentChange({ buttonText: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Choose File"
        />
      </InspectorSection>

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== MESSAGE INSPECTOR ==========
export function MessageInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <PrivacyConsentSection content={content} onContentChange={onContentChange} />

      <InspectorSection title="Question">
        <Textarea
          value={content.label || ''}
          onChange={(e) => onContentChange({ label: e.target.value })}
          className="min-h-[60px] bg-muted border-0 resize-none"
          placeholder="What would you like to ask?"
        />
      </InspectorSection>

      <InspectorSection title="Question Color">
        <GradientColorPicker
          solidColor={content.questionColor || ''}
          gradient={content.questionStyles?.textGradient || ''}
          onSolidChange={(v) => onContentChange({ questionColor: v, questionStyles: { ...(content.questionStyles || {}), textGradient: '' } })}
          onGradientChange={(v) => onContentChange({ questionStyles: { ...(content.questionStyles || {}), textGradient: v } })}
        />
      </InspectorSection>

      <Separator />

      <InspectorSection title="Placeholder">
        <Input
          value={content.placeholder || ''}
          onChange={(e) => onContentChange({ placeholder: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Type your message..."
        />
      </InspectorSection>

      <InspectorSection title="Min Rows">
        <VisualSlider
          value={content.minRows || 3}
          onChange={(v) => onContentChange({ minRows: v })}
          min={2}
          max={10}
          unit=" rows"
        />
      </InspectorSection>

      <InspectorSection title="Max Length">
        <Input
          type="number"
          value={content.maxLength || ''}
          onChange={(e) => onContentChange({ maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
          className="h-9 bg-muted border-0"
          placeholder="No limit"
        />
      </InspectorSection>

      <Separator />

      <p className="text-xs text-muted-foreground px-1">
        Click the submit button on canvas to configure it.
      </p>

      <PopupSettingsSection content={content} onContentChange={onContentChange} />
    </div>
  );
}

// ========== DATE PICKER INSPECTOR ==========
export function DatePickerInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <InspectorSection title="Label">
        <Input
          value={content.label || ''}
          onChange={(e) => onContentChange({ label: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Select a date"
        />
      </InspectorSection>

      <InspectorSection title="Placeholder">
        <Input
          value={content.placeholder || ''}
          onChange={(e) => onContentChange({ placeholder: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Pick a date..."
        />
      </InspectorSection>

      <InspectorSection title="Min Date">
        <Input
          type="date"
          value={content.minDate || ''}
          onChange={(e) => onContentChange({ minDate: e.target.value })}
          className="h-9 bg-muted border-0"
        />
      </InspectorSection>

      <InspectorSection title="Max Date">
        <Input
          type="date"
          value={content.maxDate || ''}
          onChange={(e) => onContentChange({ maxDate: e.target.value })}
          className="h-9 bg-muted border-0"
        />
      </InspectorSection>

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}

// ========== DROPDOWN INSPECTOR ==========
export function DropdownInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;
  const options = content.options || [];

  const addOption = () => {
    const id = uuid();
    onContentChange({
      options: [...options, { id, value: id, label: 'New option' }]
    });
  };

  const updateOption = (index: number, updates: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    onContentChange({ options: newOptions });
  };

  const removeOption = (index: number) => {
    onContentChange({ options: options.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <InspectorSection title="Label">
        <Input
          value={content.label || ''}
          onChange={(e) => onContentChange({ label: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Select an option"
        />
      </InspectorSection>

      <InspectorSection title="Placeholder">
        <Input
          value={content.placeholder || ''}
          onChange={(e) => onContentChange({ placeholder: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Choose..."
        />
      </InspectorSection>

      <Separator />

      <InspectorSection title="Options">
        <div className="space-y-2">
          {options.map((opt: any, i: number) => (
            <div key={opt.id} className="flex gap-2 items-center">
              <Input
                value={opt.label}
                onChange={(e) => updateOption(i, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="h-8 flex-1 bg-muted border-0"
                placeholder="Option label"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeOption(i)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addOption} className="w-full mt-2">
          <Plus className="h-3 w-3 mr-1" /> Add Option
        </Button>
      </InspectorSection>
    </div>
  );
}

// ========== PAYMENT INSPECTOR ==========
export function PaymentInspector({ block, onContentChange, onBlockChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <PrivacyConsentSection content={content} onContentChange={onContentChange} />

      <InspectorSection title="Amount">
        <Input
          type="number"
          value={content.amount || 0}
          onChange={(e) => onContentChange({ amount: parseFloat(e.target.value) || 0 })}
          className="h-9 bg-muted border-0"
          placeholder="99.00"
        />
      </InspectorSection>

      <InspectorSection title="Currency">
        <LabeledToggleRow
          value={content.currency || 'USD'}
          onChange={(v) => onContentChange({ currency: v })}
          options={[
            { value: 'USD', label: 'USD' },
            { value: 'EUR', label: 'EUR' },
            { value: 'GBP', label: 'GBP' },
          ]}
        />
      </InspectorSection>

      <InspectorSection title="Button Text">
        <Input
          value={content.buttonText || ''}
          onChange={(e) => onContentChange({ buttonText: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Pay Now"
        />
      </InspectorSection>

      <InspectorSection title="Description">
        <Input
          value={content.description || ''}
          onChange={(e) => onContentChange({ description: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="One-time payment"
        />
      </InspectorSection>

      <Separator />

      <InspectorSection title="Stripe Payment Link">
        <Input
          value={content.stripeUrl || ''}
          onChange={(e) => onContentChange({ stripeUrl: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="https://buy.stripe.com/..."
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Create a payment link in your Stripe dashboard
        </p>
      </InspectorSection>

      <Separator />

      <InspectorSection title="Button Color">
        <GradientColorPicker
          solidColor={content.buttonColor || '#6366f1'}
          gradient={content.buttonGradient || ''}
          onSolidChange={(v) => onContentChange({ buttonColor: v, buttonGradient: '' })}
          onGradientChange={(v) => onContentChange({ buttonGradient: v })}
        />
      </InspectorSection>

      <InspectorSection title="Amount Color">
        <ColorSwatchPicker
          value={content.amountColor || ''}
          onChange={(v) => onContentChange({ amountColor: v })}
        />
      </InspectorSection>

      <Separator />
      <TrackingSection
        trackingId={block.trackingId || ''}
        onChange={(id) => {
          if (onBlockChange) {
            onBlockChange({ trackingId: id });
          }
        }}
      />
    </div>
  );
}
