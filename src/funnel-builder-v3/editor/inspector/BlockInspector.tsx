import React from 'react';
import { Block } from '@/funnel-builder-v3/types/funnel';
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
} from './InspectorUI';
import { allButtonPresets, allHeadingPresets } from '@/funnel-builder-v3/lib/niche-presets';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MediaPicker } from '@/funnel-builder-v3/editor/MediaPicker';
import { 
  Type, Image, Star, Play, Calendar, Users, Quote,
  AlignLeft, AlignCenter, AlignRight,
  Square, Circle, Minus, Plus, Trash2, GripVertical,
  Clock, Mail, Phone, ListChecks, ChevronDown
} from 'lucide-react';
import { v4 as uuid } from 'uuid';

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
}

// ========== HEADING PRESETS (Enhanced with niche options) ==========
const headingPresets = [
  {
    id: 'hero',
    name: 'Hero',
    preview: <div className="font-bold text-[10px] leading-none">HERO</div>,
    config: { level: 1, styles: { fontSize: 48, fontWeight: 800, textAlign: 'center' } }
  },
  {
    id: 'section',
    name: 'Section',
    preview: <div className="font-semibold text-[9px] leading-none">Section</div>,
    config: { level: 2, styles: { fontSize: 32, fontWeight: 700, textAlign: 'left' } }
  },
  {
    id: 'subtitle',
    name: 'Subtitle',
    preview: <div className="text-[8px] text-muted-foreground leading-none">subtitle</div>,
    config: { level: 3, styles: { fontSize: 20, fontWeight: 400, color: '#6b7280' } }
  },
  {
    id: 'profit',
    name: 'Profit',
    preview: <div className="text-[10px] font-bold leading-none" style={{ color: '#ffd700' }}>$$$</div>,
    config: { level: 1, styles: { fontSize: 48, fontWeight: 800, color: '#ffd700', textAlign: 'center' } }
  },
  {
    id: 'stats',
    name: 'Stats',
    preview: <div className="text-[10px] font-black leading-none" style={{ color: '#10b981' }}>89%</div>,
    config: { level: 2, styles: { fontSize: 56, fontWeight: 900, color: '#10b981', textAlign: 'center' } }
  },
  {
    id: 'authority',
    name: 'Authority',
    preview: <div className="text-[9px] font-bold leading-none" style={{ color: '#6366f1' }}>Pro</div>,
    config: { level: 1, styles: { fontSize: 48, fontWeight: 700, color: '#6366f1', textAlign: 'center' } }
  },
];

// ========== HEADING INSPECTOR ==========
export function HeadingInspector({ block, onContentChange }: BlockInspectorProps) {
  const content = block.content as any;
  const styles = content.styles || {};

  const handlePresetApply = (config: Record<string, any>) => {
    onContentChange({ 
      level: config.level,
      styles: { ...styles, ...config.styles } 
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
          onChange={(v) => onContentChange({ level: parseInt(v) })}
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
          max={72}
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
export function TextInspector({ block, onContentChange }: BlockInspectorProps) {
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
    config: { variant: 'primary', backgroundColor: '#6366f1', size: 'lg' }
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
    config: { variant: 'outline', size: 'lg' }
  },
];

// ========== BUTTON INSPECTOR ==========
export function ButtonInspector({ block, onContentChange }: BlockInspectorProps) {
  const content = block.content as any;

  const buttonColors = [
    '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
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
            { value: 'url', label: 'URL' },
            { value: 'scroll', label: 'Scroll' },
            { value: 'submit', label: 'Submit' },
          ]}
        />
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
          onChange={(v) => onContentChange({ variant: v })}
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

      <ToggleSwitchRow
        label="Full Width"
        checked={content.fullWidth || false}
        onChange={(v) => onContentChange({ fullWidth: v })}
      />

      <InspectorSection title="Background">
        <GradientColorPicker
          solidColor={content.backgroundColor || '#6366f1'}
          gradient={content.backgroundGradient || ''}
          onSolidChange={(v) => onContentChange({ backgroundColor: v, backgroundGradient: '' })}
          onGradientChange={(v) => onContentChange({ backgroundGradient: v })}
          colorPresets={buttonColors}
        />
      </InspectorSection>

      <InspectorSection title="Text Color">
        <GradientColorPicker
          solidColor={content.color || '#ffffff'}
          gradient={content.textGradient || ''}
          onSolidChange={(v) => onContentChange({ color: v, textGradient: '' })}
          onGradientChange={(v) => onContentChange({ textGradient: v })}
          colorPresets={textColors}
        />
      </InspectorSection>

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
    preview: <div className="w-6 h-4 bg-muted-foreground/30 rounded" />,
    config: { borderRadius: 12, aspectRatio: 'auto' }
  },
  {
    id: 'circle',
    name: 'Circle',
    preview: <div className="w-5 h-5 bg-muted-foreground/30 rounded-full" />,
    config: { borderRadius: 999, aspectRatio: '1:1' }
  },
  {
    id: 'card',
    name: 'Card',
    preview: <div className="w-6 h-4 bg-muted-foreground/30 rounded shadow-sm" />,
    config: { borderRadius: 16, aspectRatio: '16:9' }
  },
];

// ========== IMAGE INSPECTOR ==========
export function ImageInspector({ block, onContentChange }: BlockInspectorProps) {
  const content = block.content as any;

  const handlePresetApply = (config: Record<string, any>) => {
    onContentChange({ ...config });
  };

  return (
    <div className="space-y-4">
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

      <InspectorSection title="Alt Text">
        <Input
          value={content.alt || ''}
          onChange={(e) => onContentChange({ alt: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Image description"
        />
      </InspectorSection>

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

      <InspectorSection title="Corner Radius">
        <VisualSlider
          icon={<Circle className="h-4 w-4" />}
          value={content.borderRadius || 0}
          onChange={(v) => onContentChange({ borderRadius: v })}
          min={0}
          max={32}
          unit="px"
        />
      </InspectorSection>
    </div>
  );
}

// ========== VIDEO INSPECTOR ==========
export function VideoInspector({ block, onContentChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <InspectorSection title="Video Type">
        <LabeledToggleRow
          value={content.type || 'youtube'}
          onChange={(v) => onContentChange({ type: v })}
          options={[
            { value: 'youtube', label: 'YouTube' },
            { value: 'vimeo', label: 'Vimeo' },
            { value: 'hosted', label: 'Hosted' },
          ]}
        />
      </InspectorSection>

      <MediaPicker
        value={content.src || ''}
        onChange={(url) => onContentChange({ src: url })}
        type="video"
        label="Video"
        placeholder={content.type === 'hosted' ? 'https://example.com/video.mp4' : 'https://youtube.com/watch?v=...'}
      />

      <ToggleSwitchRow
        label="Autoplay"
        checked={content.autoplay || false}
        onChange={(v) => onContentChange({ autoplay: v })}
      />

      {content.type === 'hosted' && (
        <ToggleSwitchRow
          label="Show Controls"
          checked={content.controls !== false}
          onChange={(v) => onContentChange({ controls: v })}
        />
      )}

      {content.type !== 'hosted' && (
        <div className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded">
          Player controls are managed by {content.type === 'youtube' ? 'YouTube' : 'Vimeo'}
        </div>
      )}
    </div>
  );
}

// ========== TESTIMONIAL INSPECTOR ==========
export function TestimonialInspector({ block, onContentChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <InspectorSection title="Quote">
        <Textarea
          value={content.quote}
          onChange={(e) => onContentChange({ quote: e.target.value })}
          className="min-h-[80px] bg-muted border-0 resize-none"
          placeholder="Customer testimonial..."
        />
      </InspectorSection>

      <InspectorSection title="Rating">
        <VisualSlider
          icon={<Star className="h-4 w-4" />}
          value={content.rating || 5}
          onChange={(v) => onContentChange({ rating: v })}
          min={1}
          max={5}
          step={1}
        />
      </InspectorSection>

      <Separator />

      <InspectorSection title="Author Name">
        <Input
          value={content.authorName}
          onChange={(e) => onContentChange({ authorName: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="John Doe"
        />
      </InspectorSection>

      <InspectorSection title="Author Title">
        <Input
          value={content.authorTitle || ''}
          onChange={(e) => onContentChange({ authorTitle: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="CEO at Company"
        />
      </InspectorSection>

      <MediaPicker
        value={content.authorImage || ''}
        onChange={(url) => onContentChange({ authorImage: url })}
        type="image"
        label="Author Image"
      />

      <Separator />

      {/* Card Style */}
      <InspectorSection title="Card Style">
        <LabeledToggleRow
          value={content.cardStyle || 'outline'}
          onChange={(v) => onContentChange({ cardStyle: v })}
          options={[
            { value: 'outline', label: 'Outline' },
            { value: 'filled', label: 'Filled' },
          ]}
        />
      </InspectorSection>

      {/* Quote Color/Gradient */}
      <InspectorSection title="Quote Color">
        <GradientColorPicker
          solidColor={content.quoteColor || ''}
          gradient={content.quoteStyles?.textGradient || ''}
          onSolidChange={(v) => onContentChange({ quoteColor: v, quoteStyles: { ...(content.quoteStyles || {}), textGradient: '' } })}
          onGradientChange={(v) => onContentChange({ quoteStyles: { ...(content.quoteStyles || {}), textGradient: v } })}
        />
      </InspectorSection>

      {/* Author Color */}
      <InspectorSection title="Author Color">
        <ColorSwatchPicker
          value={content.authorColor || ''}
          onChange={(v) => onContentChange({ authorColor: v })}
        />
      </InspectorSection>
    </div>
  );
}

// ========== COUNTDOWN INSPECTOR ==========
export function CountdownInspector({ block, onContentChange }: BlockInspectorProps) {
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
    </div>
  );
}

// ========== DIVIDER INSPECTOR ==========
export function DividerInspector({ block, onContentChange }: BlockInspectorProps) {
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
    </div>
  );
}

// ========== SPACER INSPECTOR ==========
export function SpacerInspector({ block, onContentChange }: BlockInspectorProps) {
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
export function EmailCaptureInspector({ block, onContentChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <InspectorSection title="Placeholder">
        <Input
          value={content.placeholder}
          onChange={(e) => onContentChange({ placeholder: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Enter your email"
        />
      </InspectorSection>

      <InspectorSection title="Button Text">
        <Input
          value={content.buttonText}
          onChange={(e) => onContentChange({ buttonText: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Subscribe"
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

      <InspectorSection title="Button Color">
        <GradientColorPicker
          solidColor={content.buttonColor || '#6366f1'}
          gradient={content.buttonGradient || ''}
          onSolidChange={(v) => onContentChange({ buttonColor: v, buttonGradient: '' })}
          onGradientChange={(v) => onContentChange({ buttonGradient: v })}
        />
      </InspectorSection>
    </div>
  );
}

// ========== PHONE CAPTURE INSPECTOR ==========
export function PhoneCaptureInspector({ block, onContentChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <InspectorSection title="Placeholder">
        <Input
          value={content.placeholder}
          onChange={(e) => onContentChange({ placeholder: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Enter your phone"
        />
      </InspectorSection>

      <InspectorSection title="Button Text">
        <Input
          value={content.buttonText}
          onChange={(e) => onContentChange({ buttonText: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Call me"
        />
      </InspectorSection>

      <InspectorSection title="Default Country">
        <Input
          value={content.defaultCountry || '+1'}
          onChange={(e) => onContentChange({ defaultCountry: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="+1"
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
    </div>
  );
}

// ========== CALENDAR INSPECTOR ==========
export function CalendarInspector({ block, onContentChange }: BlockInspectorProps) {
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
    </div>
  );
}

// ========== QUIZ INSPECTOR ==========
export function QuizInspector({ block, onContentChange, funnel }: BlockInspectorProps & { funnel?: any }) {
  const content = block.content as any;
  const options = content.options || [];
  const steps = funnel?.steps || [];

  const addOption = () => {
    onContentChange({
      options: [...options, { id: uuid(), text: 'New option' }]
    });
  };

  const updateOption = (index: number, updates: Partial<{ text: string; nextStepId: string }>) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    onContentChange({ options: newOptions });
  };

  const removeOption = (index: number) => {
    onContentChange({ options: options.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <InspectorSection title="Question">
        <Textarea
          value={content.question}
          onChange={(e) => onContentChange({ question: e.target.value })}
          className="min-h-[60px] bg-muted border-0 resize-none"
          placeholder="What's your question?"
        />
      </InspectorSection>

      <ToggleSwitchRow
        label="Multi-select"
        checked={content.multiSelect || false}
        onChange={(v) => onContentChange({ multiSelect: v })}
      />

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
              {!content.multiSelect && steps.length > 1 && (
                <div className="flex items-center gap-2 ml-7">
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  <select
                    value={opt.nextStepId || ''}
                    onChange={(e) => updateOption(i, { nextStepId: e.target.value || undefined })}
                    className="flex-1 h-7 px-2 text-xs bg-background rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Go to next step (default)</option>
                    {steps.map((step: any) => (
                      <option key={step.id} value={step.id}>
                        → {step.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
    </div>
  );
}

// ========== ACCORDION INSPECTOR ==========
export function AccordionInspector({ block, onContentChange }: BlockInspectorProps) {
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
    </div>
  );
}

// ========== SOCIAL PROOF INSPECTOR ==========
export function SocialProofInspector({ block, onContentChange }: BlockInspectorProps) {
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
      <div className="flex items-center justify-between">
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
                className="h-7 w-16 bg-background border-0 text-sm font-medium"
                placeholder="23"
              />
              <Input
                value={item.suffix || ''}
                onChange={(e) => updateItem(i, { suffix: e.target.value })}
                className="h-7 w-12 bg-background border-0 text-sm text-center"
                placeholder="+"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(i)}
                className="h-6 w-6 ml-auto text-muted-foreground hover:text-destructive shrink-0"
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
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Layout</span>
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

      {/* Values Section - Grouped */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Values</span>
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

      {/* Labels Section - Grouped */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Labels</span>
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
    </div>
  );
}

// ========== LOGO BAR INSPECTOR ==========
export function LogoBarInspector({ block, onContentChange }: BlockInspectorProps) {
  const content = block.content as any;
  const logos = content.logos || [];

  const addLogo = () => {
    onContentChange({
      logos: [...logos, { id: uuid(), src: '', alt: 'Company logo' }]
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
          label="Marquee Scroll"
          checked={content.animated || false}
          onChange={(v) => onContentChange({ animated: v })}
        />
      </InspectorSection>

      {content.animated && (
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
        <Button variant="outline" size="sm" onClick={addLogo} className="h-7">
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
    </div>
  );
}

// ========== FORM INSPECTOR ==========
export function FormInspector({ block, onContentChange }: BlockInspectorProps) {
  const content = block.content as any;
  const fields = content.fields || [];

  const addField = () => {
    onContentChange({
      fields: [...fields, { id: uuid(), type: 'text', label: 'New field', placeholder: '' }]
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

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'textarea', label: 'Textarea' },
  ];

  const buttonColors = [
    '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#000000', '#ffffff',
  ];

  return (
    <div className="space-y-4">
      <InspectorSection title="Submit Button Text">
        <Input
          value={content.submitText || 'Submit'}
          onChange={(e) => onContentChange({ submitText: e.target.value })}
          className="h-9 bg-muted border-0"
        />
      </InspectorSection>

      <InspectorSection title="Submit Button Color">
        <GradientColorPicker
          solidColor={content.submitButtonColor || '#6366f1'}
          gradient={content.submitButtonGradient || ''}
          onSolidChange={(v) => onContentChange({ submitButtonColor: v, submitButtonGradient: '' })}
          onGradientChange={(v) => onContentChange({ submitButtonGradient: v })}
        />
      </InspectorSection>

      <InspectorSection title="On Submit">
        <LabeledToggleRow
          value={content.submitAction || 'next-step'}
          onChange={(v) => onContentChange({ submitAction: v })}
          options={[
            { value: 'next-step', label: 'Next Step' },
            { value: 'webhook', label: 'Webhook' },
          ]}
        />
      </InspectorSection>

      {content.submitAction === 'webhook' && (
        <InspectorSection title="Webhook URL">
          <Input
            value={content.webhookUrl || ''}
            onChange={(e) => onContentChange({ webhookUrl: e.target.value })}
            className="h-9 bg-muted border-0"
            placeholder="https://..."
          />
        </InspectorSection>
      )}

      <Separator />

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
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== REVIEWS INSPECTOR ==========
export function ReviewsInspector({ block, onContentChange }: BlockInspectorProps) {
  const content = block.content as any;
  const reviews = content.reviews || [];

  const addReview = () => {
    onContentChange({
      reviews: [...reviews, { id: uuid(), text: 'New review', author: 'Customer', rating: 5 }]
    });
  };

  const updateReview = (index: number, updates: any) => {
    const newReviews = [...reviews];
    newReviews[index] = { ...newReviews[index], ...updates };
    onContentChange({ reviews: newReviews });
  };

  const removeReview = (index: number) => {
    onContentChange({ reviews: reviews.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Reviews</span>
        <Button variant="outline" size="sm" onClick={addReview} className="h-7">
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-3">
        {reviews.map((review: any, i: number) => (
          <div key={review.id} className="bg-muted rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Review {i + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeReview(i)}
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <Textarea
              value={review.text}
              onChange={(e) => updateReview(i, { text: e.target.value })}
              className="min-h-[60px] text-sm bg-background border-0 resize-none"
              placeholder="Review text"
            />
            <Input
              value={review.author}
              onChange={(e) => updateReview(i, { author: e.target.value })}
              className="h-8 bg-background border-0"
              placeholder="Author"
            />
            <InspectorSection title="Rating">
              <VisualSlider
                icon={<Star className="h-4 w-4" />}
                value={review.rating || 5}
                onChange={(v) => updateReview(i, { rating: v })}
                min={0.5}
                max={5}
                step={0.5}
              />
            </InspectorSection>
            <Input
              value={review.avatar || ''}
              onChange={(e) => updateReview(i, { avatar: e.target.value })}
              className="h-8 bg-background border-0"
              placeholder="Avatar URL (optional)"
            />
          </div>
        ))}
      </div>

      <Separator />

      {/* Show Avatars Toggle */}
      <ToggleSwitchRow
        label="Show Avatars"
        checked={content.showAvatars !== false}
        onChange={(v) => onContentChange({ showAvatars: v })}
      />

      {/* Card Style */}
      <InspectorSection title="Card Style">
        <LabeledToggleRow
          value={content.cardStyle || 'outline'}
          onChange={(v) => onContentChange({ cardStyle: v })}
          options={[
            { value: 'outline', label: 'Outline' },
            { value: 'filled', label: 'Filled' },
          ]}
        />
      </InspectorSection>

      {/* Review Text Color */}
      <InspectorSection title="Review Text Color">
        <ColorSwatchPicker
          value={content.reviewTextColor || ''}
          onChange={(v) => onContentChange({ reviewTextColor: v })}
        />
      </InspectorSection>

      {/* Author Color */}
      <InspectorSection title="Author Color">
        <ColorSwatchPicker
          value={content.authorColor || ''}
          onChange={(v) => onContentChange({ authorColor: v })}
        />
      </InspectorSection>

      {/* Star Color */}
      <InspectorSection title="Star Color">
        <ColorSwatchPicker
          value={content.starColor || '#facc15'}
          onChange={(v) => onContentChange({ starColor: v })}
        />
      </InspectorSection>
    </div>
  );
}

// ========== COLUMNS INSPECTOR ==========
export function ColumnsInspector({ block, onContentChange }: BlockInspectorProps) {
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
export function CardInspector({ block, onContentChange, onStyleChange }: BlockInspectorProps) {
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
    </div>
  );
}

// ========== LIST INSPECTOR ==========
export function ListInspector({ block, onContentChange }: BlockInspectorProps) {
  const content = block.content as any;
  const items = content.items || [];

  const addItem = () => {
    onContentChange({
      items: [...items, { id: uuid(), text: 'New item' }]
    });
  };

  const updateItem = (index: number, text: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], text };
    onContentChange({ items: newItems });
  };

  const removeItem = (index: number) => {
    onContentChange({ items: items.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <InspectorSection title="Style">
        <LabeledToggleRow
          value={content.style || 'bullet'}
          onChange={(v) => onContentChange({ style: v })}
          options={[
            { value: 'bullet', label: 'Bullet' },
            { value: 'numbered', label: 'Numbered' },
            { value: 'check', label: 'Check' },
          ]}
        />
      </InspectorSection>

      <Separator />

      <InspectorSection title="Items">
        <div className="space-y-2">
          {items.map((item: any, i: number) => (
            <div key={item.id} className="flex gap-2 items-center">
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                {i + 1}
              </div>
              <Input
                value={item.text}
                onChange={(e) => updateItem(i, e.target.value)}
                className="h-8 flex-1 bg-muted border-0"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(i)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addItem} className="w-full mt-2">
          <Plus className="h-3 w-3 mr-1" /> Add Item
        </Button>
      </InspectorSection>

      <Separator />

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

      <InspectorSection title="Icon Color">
        <ColorSwatchPicker
          value={content.iconColor || ''}
          onChange={(v) => onContentChange({ iconColor: v })}
        />
      </InspectorSection>

      <InspectorSection title="Text Color">
        <ColorSwatchPicker
          value={content.textColor || ''}
          onChange={(v) => onContentChange({ textColor: v })}
        />
      </InspectorSection>
    </div>
  );
}

// ========== SLIDER INSPECTOR ==========
export function SliderInspector({ block, onContentChange }: BlockInspectorProps) {
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
    </div>
  );
}

// ========== GRAPHIC INSPECTOR ==========
export function GraphicInspector({ block, onContentChange }: BlockInspectorProps) {
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
export function WebinarInspector({ block, onContentChange }: BlockInspectorProps) {
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
    </div>
  );
}

// ========== LOADER INSPECTOR ==========
export function LoaderInspector({ block, onContentChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <InspectorSection title="Progress">
        <VisualSlider
          value={content.progress || 0}
          onChange={(v) => onContentChange({ progress: v })}
          min={0}
          max={100}
          unit="%"
        />
      </InspectorSection>

      <ToggleSwitchRow
        label="Show Percentage"
        checked={content.showPercentage !== false}
        onChange={(v) => onContentChange({ showPercentage: v })}
      />

      <InspectorSection title="Label">
        <Input
          value={content.label || ''}
          onChange={(e) => onContentChange({ label: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Loading your results..."
        />
      </InspectorSection>

      <Separator />

      <InspectorSection title="Progress Color">
        <ColorSwatchPicker
          value={content.color || '#6366f1'}
          onChange={(v) => onContentChange({ color: v })}
        />
      </InspectorSection>

      <InspectorSection title="Track Color">
        <ColorSwatchPicker
          value={content.trackColor || ''}
          onChange={(v) => onContentChange({ trackColor: v })}
        />
      </InspectorSection>
    </div>
  );
}

// ========== EMBED INSPECTOR ==========
export function EmbedInspector({ block, onContentChange }: BlockInspectorProps) {
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
    </div>
  );
}

// ========== IMAGE QUIZ INSPECTOR ==========
export function ImageQuizInspector({ block, onContentChange, funnel }: BlockInspectorProps & { funnel?: any }) {
  const content = block.content as any;
  const options = content.options || [];
  const steps = funnel?.steps || [];

  const addOption = () => {
    onContentChange({
      options: [...options, { id: uuid(), image: 'https://placehold.co/200x200', text: 'Option' }]
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
      <InspectorSection title="Question">
        <Textarea
          value={content.question || ''}
          onChange={(e) => onContentChange({ question: e.target.value })}
          className="min-h-[60px] bg-muted border-0 resize-none"
          placeholder="What's your question?"
        />
      </InspectorSection>

      <Separator />

      <InspectorSection title="Image Options">
        <div className="space-y-3">
          {options.map((opt: any, i: number) => (
            <div key={opt.id} className="bg-muted rounded-lg p-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {opt.image && (
                    <div className="w-10 h-10 rounded bg-background overflow-hidden">
                      <img src={opt.image} alt={opt.text} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">Option {i + 1}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(i)}
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <MediaPicker
                value={opt.image || ''}
                onChange={(url) => updateOption(i, { image: url })}
                type="image"
                label=""
              />
              <Input
                value={opt.text}
                onChange={(e) => updateOption(i, { text: e.target.value })}
                className="h-8 bg-background border-0"
                placeholder="Label"
              />
              {steps.length > 1 && (
                <div className="flex items-center gap-2 mt-1">
                  <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  <select
                    value={opt.nextStepId || ''}
                    onChange={(e) => updateOption(i, { nextStepId: e.target.value || undefined })}
                    className="flex-1 h-7 px-2 text-xs bg-background rounded border border-border"
                  >
                    <option value="">Go to next step (default)</option>
                    {steps.map((step: any) => (
                      <option key={step.id} value={step.id}>
                        → {step.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
    </div>
  );
}

// ========== VIDEO QUESTION INSPECTOR ==========
export function VideoQuestionInspector({ block, onContentChange, funnel }: BlockInspectorProps & { funnel?: any }) {
  const content = block.content as any;
  const options = content.options || [];
  const steps = funnel?.steps || [];

  const addOption = () => {
    onContentChange({
      options: [...options, { id: uuid(), text: 'New option' }]
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

      <InspectorSection title="Question">
        <Textarea
          value={content.question || ''}
          onChange={(e) => onContentChange({ question: e.target.value })}
          className="min-h-[60px] bg-muted border-0 resize-none"
          placeholder="What's your question?"
        />
      </InspectorSection>

      <InspectorSection title="Options">
        <div className="space-y-2">
          {options.map((opt: any, i: number) => (
            <div key={opt.id} className="space-y-1">
              <div className="flex gap-2 items-center">
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  {i + 1}
                </div>
                <Input
                  value={opt.text}
                  onChange={(e) => updateOption(i, { text: e.target.value })}
                  className="h-8 flex-1 bg-muted border-0"
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
              {steps.length > 1 && (
                <div className="flex items-center gap-2 ml-7">
                  <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  <select
                    value={opt.nextStepId || ''}
                    onChange={(e) => updateOption(i, { nextStepId: e.target.value || undefined })}
                    className="flex-1 h-7 px-2 text-xs bg-background rounded border border-border"
                  >
                    <option value="">Go to next step (default)</option>
                    {steps.map((step: any) => (
                      <option key={step.id} value={step.id}>
                        → {step.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
    </div>
  );
}

// ========== UPLOAD INSPECTOR ==========
export function UploadInspector({ block, onContentChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
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
    </div>
  );
}

// ========== MESSAGE INSPECTOR ==========
export function MessageInspector({ block, onContentChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
      <InspectorSection title="Label">
        <Input
          value={content.label || ''}
          onChange={(e) => onContentChange({ label: e.target.value })}
          className="h-9 bg-muted border-0"
          placeholder="Your message"
        />
      </InspectorSection>

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
    </div>
  );
}

// ========== DATE PICKER INSPECTOR ==========
export function DatePickerInspector({ block, onContentChange }: BlockInspectorProps) {
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
    </div>
  );
}

// ========== DROPDOWN INSPECTOR ==========
export function DropdownInspector({ block, onContentChange }: BlockInspectorProps) {
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
export function PaymentInspector({ block, onContentChange }: BlockInspectorProps) {
  const content = block.content as any;

  return (
    <div className="space-y-4">
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
    </div>
  );
}
