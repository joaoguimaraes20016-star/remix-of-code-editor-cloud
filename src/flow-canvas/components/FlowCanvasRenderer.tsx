/**
 * FlowCanvasRenderer - Public runtime for flow-canvas funnels
 * 
 * This component renders published flow-canvas funnels with:
 * - Typeform-style step transitions (one question at a time)
 * - Form data collection and CRM integration
 * - Button action handling (next-step, submit, redirect)
 * - Pixel event firing
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUnifiedLeadSubmit, createUnifiedPayload } from '@/flow-canvas/shared/hooks/useUnifiedLeadSubmit';
import { sanitizeNavigationUrl } from '@/flow-canvas/shared/hooks/normalizeSubmitPayload';
import { ChevronUp, ChevronDown, Loader2, Play, User, Layout, ArrowRight, Sparkles, Search, Calendar, FileText, Rocket, Video } from 'lucide-react';
import { generateStateStylesCSS } from './RuntimeElementRenderer';
import { ScrollTransformWrapper } from './ScrollTransformWrapper';
import { 
  getPageBackgroundStyles, 
  getOverlayStyles, 
  getVideoBackgroundUrl, 
  isDirectVideoUrl,
  type PageBackground 
} from './runtime/backgroundUtils';
// Import CanvasRenderer for pixel-perfect rendering parity with editor
import { CanvasRenderer } from '@/flow-canvas/builder/components/CanvasRenderer';
import { FlowContainerProvider } from '@/flow-canvas/builder/contexts/FlowContainerContext';
import type { Step, Page, SelectionState } from '@/flow-canvas/types/infostack';

// Import consolidated utilities from CanvasUtilities (Phase 4: utility consolidation)
import { CanvasUtilities } from '@/flow-canvas/builder/components/renderers/CanvasUtilities';
import { gradientToCSS as importedGradientToCSS, type GradientValue } from '@/flow-canvas/builder/components/modals';
const { shiftHue } = CanvasUtilities;

// Local type-safe wrapper for gradientToCSS that handles loose types from props
function gradientToCSS(gradient: { type?: string; angle?: number; stops?: Array<{ color: string; position: number }> }): string {
  // Coerce to proper GradientValue type
  const safeGradient: GradientValue = {
    type: (gradient.type === 'radial' ? 'radial' : 'linear') as 'linear' | 'radial',
    angle: gradient.angle ?? 135,
    stops: gradient.stops || [{ color: '#8B5CF6', position: 0 }, { color: '#EC4899', position: 100 }],
  };
  return importedGradientToCSS(safeGradient);
}

// Types
interface FlowCanvasBlock {
  id: string;
  type: string;
  label: string;
  elements: FlowCanvasElement[];
  props: Record<string, unknown>;
  styles?: Record<string, string>;
}

// Responsive style overrides type (matching infostack.ts)
interface ResponsiveStyleOverrides {
  [key: string]: unknown;
}

interface FlowCanvasElement {
  id: string;
  type: string;
  content?: string;
  props: Record<string, unknown>;
  styles?: Record<string, string>;
  responsive?: {
    desktop?: ResponsiveStyleOverrides;
    tablet?: ResponsiveStyleOverrides;
    mobile?: ResponsiveStyleOverrides;
  };
  animation?: {
    scrollTransform?: {
      enabled: boolean;
      property: 'opacity' | 'scale' | 'translateY' | 'translateX' | 'rotate';
      startValue: number;
      endValue: number;
    };
    [key: string]: unknown;
  };
}

// Hook to detect current device mode based on viewport width
function useRuntimeDeviceMode(): 'desktop' | 'tablet' | 'mobile' {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>(() => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceMode('mobile');
      else if (width < 1024) setDeviceMode('tablet');
      else setDeviceMode('desktop');
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceMode;
}

interface FlowCanvasStep {
  id: string;
  name: string;
  frames: Array<{
    id: string;
    stacks: Array<{
      id: string;
      blocks: FlowCanvasBlock[];
    }>;
  }>;
  settings?: Record<string, unknown>;
  /** Step type from editor (e.g., 'form', 'info', 'calendar') */
  type?: string;
  /** Step intent from editor */
  intent?: 'capture' | 'navigate' | 'info' | 'schedule';
}

// ============ STEP INTENT DETECTION ============
// Determines the correct intent based on step content/settings

type StepIntentType = 'capture' | 'schedule' | 'navigate' | 'info';

function detectStepIntent(step: FlowCanvasStep): StepIntentType {
  // 1. Use explicit intent from step settings if available
  if (step.intent) {
    return step.intent === 'schedule' ? 'schedule' : step.intent;
  }
  
  // 2. Check step type if set
  const stepType = step.type?.toLowerCase() || (step.settings?.stepType as string)?.toLowerCase();
  if (stepType === 'calendar' || stepType === 'schedule' || stepType === 'booking') {
    return 'schedule';
  }
  
  // 3. Analyze blocks to detect content type
  const allBlocks = step.frames?.flatMap(f => f.stacks?.flatMap(s => s.blocks || []) || []) || [];
  const allElements = allBlocks.flatMap(b => b.elements || []);
  
  // Check for calendar/scheduling blocks
  const hasCalendarBlock = allBlocks.some(b => {
    const blockType = b.type?.toLowerCase() || '';
    return blockType.includes('calendar') || 
           blockType.includes('calendly') || 
           blockType.includes('schedule') ||
           blockType.includes('booking');
  });
  
  // Check for calendar/embed elements
  const hasCalendarElement = allElements.some(e => {
    const elemType = e.type?.toLowerCase() || '';
    const embedUrl = (e.props?.url as string || e.props?.embedUrl as string || '').toLowerCase();
    return elemType.includes('calendly') || 
           elemType.includes('calendar') ||
           embedUrl.includes('calendly.com') ||
           embedUrl.includes('cal.com');
  });
  
  if (hasCalendarBlock || hasCalendarElement) {
    return 'schedule';
  }
  
  // Check for capture/form elements
  const captureElementTypes = ['input', 'email', 'phone', 'name', 'textarea', 'form-field', 'opt-in', 'capture'];
  const hasCaptureElements = allElements.some(e => {
    const elemType = e.type?.toLowerCase() || '';
    return captureElementTypes.some(t => elemType.includes(t));
  });
  
  const hasCaptureBlock = allBlocks.some(b => {
    const blockType = b.type?.toLowerCase() || '';
    return blockType.includes('capture') || 
           blockType.includes('optin') || 
           blockType.includes('opt-in') ||
           blockType.includes('form');
  });
  
  if (hasCaptureElements || hasCaptureBlock) {
    return 'capture';
  }
  
  // Check for quiz/question elements (also capture)
  const hasQuizElements = allElements.some(e => {
    const elemType = e.type?.toLowerCase() || '';
    return elemType.includes('radio') || 
           elemType.includes('checkbox') || 
           elemType.includes('choice') ||
           elemType.includes('quiz');
  });
  
  if (hasQuizElements) {
    return 'capture';
  }
  
  // Default to 'navigate' (info-only step, just progresses)
  return 'navigate';
}

function detectStepType(step: FlowCanvasStep): string {
  // Use explicit type if available
  if (step.type) {
    return step.type;
  }
  
  const stepTypeFromSettings = step.settings?.stepType as string;
  if (stepTypeFromSettings) {
    return stepTypeFromSettings;
  }
  
  // Derive from intent
  const intent = detectStepIntent(step);
  switch (intent) {
    case 'schedule':
      return 'calendar';
    case 'capture':
      return 'form';
    case 'navigate':
    case 'info':
    default:
      return 'content';
  }
}

interface FlowCanvasPage {
  id: string;
  name: string;
  steps: FlowCanvasStep[];
  settings?: {
    theme?: 'light' | 'dark';
    primary_color?: string;
    font_family?: string;
    page_background?: PageBackground;
  };
}

interface FunnelSettings {
  primary_color?: string;
  background_color?: string;
  meta_pixel_id?: string;
  google_analytics_id?: string;
  tiktok_pixel_id?: string;
  popup_optin_enabled?: boolean;
}

interface FlowCanvasRendererProps {
  funnelId: string;
  teamId?: string;
  page: FlowCanvasPage | Record<string, any>;
  settings?: FunnelSettings;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

// Animation variants
const stepVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] as const } },
};

// Device width classes matching editor CanvasRenderer exactly
const deviceWidths: Record<'desktop' | 'tablet' | 'mobile', string> = {
  desktop: 'max-w-5xl',
  tablet: 'max-w-2xl',
  mobile: 'max-w-sm',
};

// Theme context for runtime (matching editor's ThemeContext)
interface RuntimeThemeContextValue {
  isDarkTheme: boolean;
  primaryColor: string;
}

const RuntimeThemeContext = React.createContext<RuntimeThemeContextValue>({
  isDarkTheme: false,
  primaryColor: '#8B5CF6',
});

// Shadow preset to CSS mapping (matches CanvasRenderer)
const shadowPresetCSS: Record<string, string> = {
  'none': 'none',
  'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};

// Helper to resolve all element styles with responsive overrides
function resolveElementStyles(element: FlowCanvasElement, deviceMode: 'desktop' | 'tablet' | 'mobile' = 'desktop'): React.CSSProperties {
  const base: React.CSSProperties = {};
  const s = element.styles;
  const p = element.props;
  
  // Dimensions
  if (s?.width) base.width = s.width;
  if (s?.height) base.height = s.height;
  if (s?.maxWidth) base.maxWidth = s.maxWidth;
  if (s?.minHeight) base.minHeight = s.minHeight;
  if (s?.minWidth) base.minWidth = s.minWidth;
  if (s?.maxHeight) base.maxHeight = s.maxHeight;
  
  // Spacing - padding
  if (s?.padding) base.padding = s.padding;
  if (s?.paddingTop) base.paddingTop = s.paddingTop;
  if (s?.paddingRight) base.paddingRight = s.paddingRight;
  if (s?.paddingBottom) base.paddingBottom = s.paddingBottom;
  if (s?.paddingLeft) base.paddingLeft = s.paddingLeft;
  
  // Spacing - margin
  if (s?.margin) base.margin = s.margin;
  if (s?.marginTop) base.marginTop = s.marginTop;
  if (s?.marginRight) base.marginRight = s.marginRight;
  if (s?.marginBottom) base.marginBottom = s.marginBottom;
  if (s?.marginLeft) base.marginLeft = s.marginLeft;
  
  // Alignment
  if (s?.alignSelf) base.alignSelf = s.alignSelf as React.CSSProperties['alignSelf'];
  
  // Position styles
  if (s?.position) base.position = s.position as React.CSSProperties['position'];
  if (s?.top) base.top = s.top;
  if (s?.right) base.right = s.right;
  if (s?.bottom) base.bottom = s.bottom;
  if (s?.left) base.left = s.left;
  
  // Flexbox styles (for container elements)
  if (s?.display) base.display = s.display as React.CSSProperties['display'];
  if (s?.flexDirection) base.flexDirection = s.flexDirection as React.CSSProperties['flexDirection'];
  if (s?.flexWrap) base.flexWrap = s.flexWrap as React.CSSProperties['flexWrap'];
  if (s?.justifyContent) base.justifyContent = s.justifyContent as React.CSSProperties['justifyContent'];
  if (s?.alignItems) base.alignItems = s.alignItems as React.CSSProperties['alignItems'];
  if (s?.gap) base.gap = s.gap;
  if (s?.flexGrow) base.flexGrow = Number(s.flexGrow);
  if (s?.flexShrink) base.flexShrink = Number(s.flexShrink);
  
  // CSS Grid styles
  if (s?.gridTemplateColumns) base.gridTemplateColumns = s.gridTemplateColumns;
  if (s?.gridTemplateRows) base.gridTemplateRows = s.gridTemplateRows as string;
  if (s?.columnGap) base.columnGap = s.columnGap;
  if (s?.rowGap) base.rowGap = s.rowGap;
  if (s?.justifyItems) base.justifyItems = s.justifyItems as React.CSSProperties['justifyItems'];
  
  // Appearance
  if (s?.opacity) {
    const opacityVal = typeof s.opacity === 'string' ? parseInt(s.opacity) / 100 : s.opacity;
    base.opacity = opacityVal;
  }
  if (s?.backgroundColor) base.backgroundColor = s.backgroundColor;
  if (s?.borderRadius) base.borderRadius = s.borderRadius;
  if (s?.borderWidth) base.borderWidth = s.borderWidth;
  if (s?.borderStyle) base.borderStyle = s.borderStyle as React.CSSProperties['borderStyle'];
  if (s?.borderColor) base.borderColor = s.borderColor;
  
  // Transform
  if (s?.rotate) {
    const rotateVal = typeof s.rotate === 'string' ? parseInt(s.rotate) : s.rotate;
    if (rotateVal && rotateVal !== 0) base.transform = `rotate(${rotateVal}deg)`;
  }
  
  // Z-index
  if (s?.zIndex && s.zIndex !== 'auto') base.zIndex = Number(s.zIndex);
  
  // NEW: Apply CSS filters (blur, brightness, contrast, saturation, hue-rotate, grayscale, sepia, invert)
  const blur = (p?.blur as number) ?? 0;
  const brightness = (p?.brightness as number) ?? 100;
  const contrast = (p?.contrast as number) ?? 100;
  const saturation = (p?.saturation as number) ?? 100;
  const hueRotate = (p?.hueRotate as number) ?? 0;
  const grayscale = (p?.grayscale as number) ?? 0;
  const sepia = (p?.sepia as number) ?? 0;
  const invert = (p?.invert as number) ?? 0;
  
  const filters: string[] = [];
  if (blur > 0) filters.push(`blur(${blur}px)`);
  if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
  if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
  if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
  if (hueRotate !== 0) filters.push(`hue-rotate(${hueRotate}deg)`);
  if (grayscale > 0) filters.push(`grayscale(${grayscale}%)`);
  if (sepia > 0) filters.push(`sepia(${sepia}%)`);
  if (invert > 0) filters.push(`invert(${invert}%)`);
  if (filters.length > 0) base.filter = filters.join(' ');
  
  // NEW: Apply blend mode
  const blendMode = s?.mixBlendMode as string;
  if (blendMode && blendMode !== 'normal') {
    base.mixBlendMode = blendMode as React.CSSProperties['mixBlendMode'];
  }
  
  // NEW: Apply shadow preset or custom layers
  const shadowPreset = p?.shadowPreset as string;
  const shadowLayers = p?.shadowLayers as Array<{ x: number; y: number; blur: number; spread: number; color: string; inset?: boolean }>;
  
  if (shadowLayers && shadowLayers.length > 0) {
    // Use custom shadow layers
    base.boxShadow = shadowLayers
      .map(layer => {
        const inset = layer.inset ? 'inset ' : '';
        return `${inset}${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px ${layer.color}`;
      })
      .join(', ');
  } else if (shadowPreset && shadowPreset !== 'none' && shadowPreset !== 'custom' && shadowPresetCSS[shadowPreset]) {
    base.boxShadow = shadowPresetCSS[shadowPreset];
  }
  
  // Apply responsive overrides based on deviceMode
  if (deviceMode !== 'desktop' && element.responsive?.[deviceMode]) {
    const o = element.responsive[deviceMode];
    // Apply all overrides dynamically
    if (o?.width) base.width = o.width as string;
    if (o?.height) base.height = o.height as string;
    if (o?.padding) base.padding = o.padding as string;
    if (o?.paddingTop) base.paddingTop = o.paddingTop as string;
    if (o?.paddingBottom) base.paddingBottom = o.paddingBottom as string;
    if (o?.paddingLeft) base.paddingLeft = o.paddingLeft as string;
    if (o?.paddingRight) base.paddingRight = o.paddingRight as string;
    if (o?.margin) base.margin = o.margin as string;
    if (o?.marginTop) base.marginTop = o.marginTop as string;
    if (o?.marginBottom) base.marginBottom = o.marginBottom as string;
    if (o?.marginLeft) base.marginLeft = o.marginLeft as string;
    if (o?.marginRight) base.marginRight = o.marginRight as string;
    if (o?.display) base.display = o.display as React.CSSProperties['display'];
    if (o?.flexDirection) base.flexDirection = o.flexDirection as React.CSSProperties['flexDirection'];
    if (o?.gap) base.gap = o.gap as string;
    if (o?.fontSize) base.fontSize = o.fontSize as string;
    if (o?.textAlign) base.textAlign = o.textAlign as React.CSSProperties['textAlign'];
    if (o?.opacity !== undefined) base.opacity = o.opacity as number;
    if (o?.backgroundColor) base.backgroundColor = o.backgroundColor as string;
  }
  
  return base;
}

// Element renderers - accept deviceMode for responsive styles
function renderHeading(element: FlowCanvasElement, deviceMode: 'desktop' | 'tablet' | 'mobile' = 'desktop') {
  const level = (element.props.level as number) || 2;
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const sizeClasses: Record<number, string> = {
    1: 'text-3xl md:text-4xl font-bold',
    2: 'text-2xl md:text-3xl font-semibold',
    3: 'text-xl md:text-2xl font-medium',
    4: 'text-lg font-medium',
  };
  
  // Get state styles and typography
  const stateStyles = element.props?.stateStyles as Record<string, unknown> | undefined;
  const stateStylesCSS = stateStyles ? generateStateStylesCSS(element.id, stateStyles as any) : '';
  const stateClassName = stateStyles ? `runtime-state-${element.id.replace(/[^a-zA-Z0-9]/g, '')}` : '';
  
  // Check for text gradient
  const textFillType = (element.props?.textFillType as string) || 'solid';
  const textGradient = element.props?.textGradient as { type?: string; angle?: number; stops?: Array<{ color: string; position: number }> };
  const hasGradient = textFillType === 'gradient' && textGradient?.stops?.length >= 2;
  
  // Merge layout styles with typography - now uses deviceMode
  const layoutStyles = resolveElementStyles(element, deviceMode);
  const typographyStyle: React.CSSProperties = {
    ...layoutStyles,
    color: hasGradient ? undefined : (element.props?.textColor as string || element.styles?.color),
    fontSize: element.props?.fontSize as string || element.styles?.fontSize,
    fontWeight: element.props?.fontWeight as string || element.styles?.fontWeight,
    letterSpacing: element.props?.letterSpacing as string || element.styles?.letterSpacing,
    lineHeight: element.props?.lineHeight as string || element.styles?.lineHeight,
    textTransform: (element.props?.textTransform || element.styles?.textTransform) as React.CSSProperties['textTransform'],
    textAlign: (element.props?.textAlign || element.styles?.textAlign) as React.CSSProperties['textAlign'],
    // Apply gradient styles if enabled
    ...(hasGradient ? {
      background: gradientToCSS(textGradient),
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      display: 'inline',
    } : {}),
  };
  
  return (
    <React.Fragment key={element.id}>
      {stateStylesCSS && <style>{stateStylesCSS}</style>}
      <Tag 
        className={cn('text-foreground', sizeClasses[level] || sizeClasses[2], stateClassName)}
        style={typographyStyle}
      >
        {element.content}
      </Tag>
    </React.Fragment>
  );
}

function renderText(element: FlowCanvasElement, deviceMode: 'desktop' | 'tablet' | 'mobile' = 'desktop') {
  const variant = element.props.variant as string;
  const baseClasses = 'text-muted-foreground';
  const variantClasses: Record<string, string> = {
    subtext: 'text-sm opacity-80',
    label: 'text-sm font-medium text-foreground',
    caption: 'text-xs italic',
    quote: 'text-lg italic border-l-2 border-primary pl-4',
  };
  
  // Get state styles and typography
  const stateStyles = element.props?.stateStyles as Record<string, unknown> | undefined;
  const stateStylesCSS = stateStyles ? generateStateStylesCSS(element.id, stateStyles as any) : '';
  const stateClassName = stateStyles ? `runtime-state-${element.id.replace(/[^a-zA-Z0-9]/g, '')}` : '';
  
  // Check for text gradient
  const textFillType = (element.props?.textFillType as string) || 'solid';
  const textGradient = element.props?.textGradient as { type?: string; angle?: number; stops?: Array<{ color: string; position: number }> };
  const hasGradient = textFillType === 'gradient' && textGradient?.stops?.length >= 2;
  
  // Merge layout styles with typography - now uses deviceMode
  const layoutStyles = resolveElementStyles(element, deviceMode);
  const typographyStyle: React.CSSProperties = {
    ...layoutStyles,
    color: hasGradient ? undefined : (element.props?.textColor as string || element.styles?.color),
    fontSize: element.props?.fontSize as string || element.styles?.fontSize,
    fontWeight: element.props?.fontWeight as string || element.styles?.fontWeight,
    letterSpacing: element.props?.letterSpacing as string || element.styles?.letterSpacing,
    lineHeight: element.props?.lineHeight as string || element.styles?.lineHeight,
    textTransform: (element.props?.textTransform || element.styles?.textTransform) as React.CSSProperties['textTransform'],
    textAlign: (element.props?.textAlign || element.styles?.textAlign) as React.CSSProperties['textAlign'],
    // Apply gradient styles if enabled
    ...(hasGradient ? {
      background: gradientToCSS(textGradient),
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      display: 'inline',
    } : {}),
  };
  
  return (
    <React.Fragment key={element.id}>
      {stateStylesCSS && <style>{stateStylesCSS}</style>}
      <p
        className={cn(baseClasses, variantClasses[variant] || '', stateClassName)}
        style={typographyStyle}
      >
        {element.content}
      </p>
    </React.Fragment>
  );
}

interface InputRendererProps {
  element: FlowCanvasElement;
  value: string;
  onChange: (value: string) => void;
}

function InputRenderer({ element, value, onChange }: InputRendererProps) {
  const inputType = (element.props.type as string) || 'text';
  const placeholder = (element.props.placeholder as string) || '';
  const required = element.props.required as boolean;
  const icon = element.props.icon as string;
  // NEW: Apply min/max length validation
  const minLength = element.props.minLength as number | undefined;
  const maxLength = element.props.maxLength as number | undefined;
  
  return (
    <div key={element.id} className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon === 'mail' && <span>📧</span>}
          {icon === 'phone' && <span>📱</span>}
          {icon === 'user' && <span>👤</span>}
        </div>
      )}
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        className={cn(
          'w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'placeholder:text-muted-foreground transition-all',
          icon && 'pl-10'
        )}
      />
    </div>
  );
}

interface RadioRendererProps {
  element: FlowCanvasElement;
  selectedValue: string;
  onSelect: (value: string) => void;
}

function RadioRenderer({ element, selectedValue, onSelect }: RadioRendererProps) {
  const value = (element.props.value as string) || '';
  const name = (element.props.name as string) || 'radio';
  const isSelected = selectedValue === value;
  
  return (
    <button
      key={element.id}
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        'w-full text-left px-4 py-3 rounded-lg border transition-all',
        isSelected
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-border bg-background text-foreground hover:border-primary/50'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center',
          isSelected ? 'border-primary' : 'border-muted-foreground'
        )}>
          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
        </div>
        <span>{element.content}</span>
      </div>
    </button>
  );
}

interface CheckboxRendererProps {
  element: FlowCanvasElement;
  checked: boolean;
  onToggle: (value: string, checked: boolean) => void;
}

function CheckboxRenderer({ element, checked, onToggle }: CheckboxRendererProps) {
  const value = (element.props.value as string) || '';
  
  return (
    <button
      key={element.id}
      type="button"
      onClick={() => onToggle(value, !checked)}
      className={cn(
        'w-full text-left px-4 py-3 rounded-lg border transition-all',
        checked
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-border bg-background text-foreground hover:border-primary/50'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-5 h-5 rounded-md border-2 flex items-center justify-center',
          checked ? 'border-primary bg-primary' : 'border-muted-foreground'
        )}>
          {checked && <span className="text-white text-xs">✓</span>}
        </div>
        <span>{element.content}</span>
      </div>
    </button>
  );
}

interface ButtonRendererProps {
  element: FlowCanvasElement;
  onClick: () => void;
  isSubmitting: boolean;
}

function ButtonRenderer({ element, onClick, isSubmitting }: ButtonRendererProps) {
  const variant = (element.props.variant as string) || 'primary';
  const size = (element.props.size as string) || 'md';
  
  const sizeClasses: Record<string, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  // Generate state styles CSS for hover/active effects
  const stateStyles = element.props?.stateStyles as Record<string, unknown> | undefined;
  const stateStylesCSS = useMemo(() => {
    if (!stateStyles) return '';
    return generateStateStylesCSS(element.id, stateStyles as any);
  }, [element.id, stateStyles]);
  
  const stateClassName = stateStyles ? `runtime-state-${element.id.replace(/[^a-zA-Z0-9]/g, '')}` : '';
  
  // BUG FIX #8: Get custom styles from element - check all possible locations
  const fillType = element.props?.fillType as string;
  const gradient = element.props?.gradient as { type: string; angle: number; stops: Array<{ color: string; position: number }> } | undefined;
  
  // Resolve background: gradient takes priority, then backgroundColor from styles or props
  const customBackground = fillType === 'gradient' && gradient 
    ? undefined  // Will use background (gradient) instead
    : (element.styles?.backgroundColor || element.props?.backgroundColor as string);
  
  // Generate gradient CSS if applicable
  const gradientBackground = fillType === 'gradient' && gradient
    ? (gradient.type === 'radial'
        ? `radial-gradient(circle, ${gradient.stops.sort((a, b) => a.position - b.position).map(s => `${s.color} ${s.position}%`).join(', ')})`
        : `linear-gradient(${gradient.angle}deg, ${gradient.stops.sort((a, b) => a.position - b.position).map(s => `${s.color} ${s.position}%`).join(', ')})`)
    : undefined;
  
  const customTextColor = element.props?.textColor as string;
  const customBorderRadius = element.styles?.borderRadius;
  const isOutlineMode = fillType === 'outline';
  
  return (
    <>
      {stateStylesCSS && <style>{stateStylesCSS}</style>}
      <button
        key={element.id}
        type="button"
        onClick={onClick}
        disabled={isSubmitting}
        className={cn(
          'w-full rounded-lg font-semibold transition-all',
          !customBackground && !gradientBackground && !isOutlineMode && 'bg-primary',
          !customTextColor && 'text-primary-foreground',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses[size],
          stateClassName
        )}
        style={{
          backgroundColor: isOutlineMode ? 'transparent' : customBackground,
          background: gradientBackground,
          color: customTextColor,
          borderRadius: customBorderRadius,
          touchAction: 'manipulation', // Eliminate 300ms mobile tap delay
          // Handle outline mode border - respect user's border settings
          ...(isOutlineMode ? {
            borderWidth: element.styles?.borderWidth || '2px',
            borderStyle: 'solid',
            borderColor: element.styles?.borderColor || 'currentColor',
          } : {}),
        }}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </span>
        ) : (
          element.content
        )}
      </button>
    </>
  );
}

// Main component
export function FlowCanvasRenderer({
  funnelId,
  teamId,
  page,
  settings,
  utmSource,
  utmMedium,
  utmCampaign,
}: FlowCanvasRendererProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [isComplete, setIsComplete] = useState(false);
  const deviceMode = useRuntimeDeviceMode();

  // Unified lead submission hook
  const { submit, saveDraft: saveDraftHook, leadId, isSubmitting } = useUnifiedLeadSubmit({
    funnelId,
    teamId,
    utmSource,
    utmMedium,
    utmCampaign,
    onLeadSaved: (id, mode) => {
      console.log(`[FlowCanvasRenderer] Lead saved via unified hook: ${id}, mode=${mode}`);
    },
  });

  const steps = page.steps || [];
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const totalSteps = steps.length;

  // Resolve page settings and theme
  const pageSettings = (page as FlowCanvasPage).settings;
  const primaryColor = pageSettings?.primary_color || settings?.primary_color || '#8B5CF6';
  const fontFamily = pageSettings?.font_family || 'Inter';
  const pageBackground = pageSettings?.page_background;
  
  // Compute isDarkTheme based on background luminance (matching editor logic)
  const isDarkTheme = useMemo(() => {
    // Helper to calculate luminance from hex color
    const calcLuminance = (color: string | undefined): number | null => {
      if (!color || !color.startsWith('#') || color.length < 7) return null;
      const r = parseInt(color.slice(1, 3), 16) / 255;
      const g = parseInt(color.slice(3, 5), 16) / 255;
      const b = parseInt(color.slice(5, 7), 16) / 255;
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    
    // Check step background first, then page background
    const stepBg = (currentStep?.settings as any)?.background;
    const bgSource = (stepBg && (stepBg.type || stepBg.color)) ? stepBg : pageBackground;
    
    if (bgSource?.type === 'solid' && bgSource.color) {
      const lum = calcLuminance(bgSource.color);
      if (lum !== null) return lum < 0.5;
    }
    if (bgSource?.type === 'gradient' && bgSource.gradient?.stops?.length >= 2) {
      const luminances = bgSource.gradient.stops
        .map((s: { color: string }) => calcLuminance(s.color))
        .filter((l: number | null): l is number => l !== null);
      if (luminances.length > 0) {
        const avgLuminance = luminances.reduce((a: number, b: number) => a + b, 0) / luminances.length;
        return avgLuminance < 0.5;
      }
    }
    
    // Fall back to theme setting
    if (pageSettings?.theme === 'dark') return true;
    if (pageSettings?.theme === 'light') return false;
    return false;
  }, [currentStep?.settings, pageBackground, pageSettings?.theme]);
  
  // Resolve background: step.background takes precedence over page.settings.page_background
  const effectiveBackground = useMemo(() => {
    const stepBg = (currentStep?.settings as any)?.background as PageBackground | undefined;
    if (stepBg && (stepBg.type || stepBg.color)) return stepBg;
    return pageBackground;
  }, [currentStep?.settings, pageBackground]);
  
  // Generate background styles using shared utility (exact parity with editor)
  const backgroundStyles = useMemo(() => 
    getPageBackgroundStyles(effectiveBackground, isDarkTheme),
    [effectiveBackground, isDarkTheme]
  );
  
  // Overlay styles for backgrounds
  const overlayStyles = useMemo(() => 
    getOverlayStyles(effectiveBackground),
    [effectiveBackground]
  );
  
  // Video background handling
  const videoBackgroundUrl = useMemo(() => {
    if (effectiveBackground?.type === 'video' && effectiveBackground.video) {
      return getVideoBackgroundUrl(effectiveBackground.video);
    }
    return null;
  }, [effectiveBackground]);
  
  const isDirectVideo = useMemo(() => {
    if (effectiveBackground?.type === 'video' && effectiveBackground.video) {
      return isDirectVideoUrl(effectiveBackground.video);
    }
    return false;
  }, [effectiveBackground]);

  // Get all blocks from current step
  const currentBlocks = useMemo(() => {
    if (!currentStep) return [];
    return currentStep.frames.flatMap(frame => 
      frame.stacks.flatMap(stack => stack.blocks)
    );
  }, [currentStep]);

  // Handle input changes
  const handleInputChange = useCallback((fieldKey: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }));
  }, []);

  // Handle radio selection
  const handleRadioSelect = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Handle checkbox toggle
  const handleCheckboxToggle = useCallback((name: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentValues = (prev[name] as string[]) || [];
      if (checked) {
        return { ...prev, [name]: [...currentValues, value] };
      } else {
        return { ...prev, [name]: currentValues.filter(v => v !== value) };
      }
    });
  }, []);

  // Submit lead using unified hook - wraps for local API compatibility
  const submitLead = useCallback(async (options?: { 
    stepId?: string; 
    stepType?: string; 
    submitMode?: 'draft' | 'submit';
    // FIXED: Accept explicit form data to avoid stale closure state
    explicitFormData?: Record<string, any>;
  }): Promise<boolean> => {
    const mode = options?.submitMode || 'submit';
    const step = steps[currentStepIndex];
    
    // FIXED: Use explicit data if provided, otherwise fall back to state
    const dataToSubmit = options?.explicitFormData || formData;
    
    // Detect real intent and type from step content
    const detectedIntent = step ? detectStepIntent(step as FlowCanvasStep) : 'capture';
    const detectedType = step ? detectStepType(step as FlowCanvasStep) : 'content';
    
    // Build payload using the unified helper with accurate intent
    const payload = createUnifiedPayload(
      dataToSubmit as Record<string, any>,
      {
        funnelId,
        teamId,
        stepId: options?.stepId || step?.id,
        stepIds: [options?.stepId || step?.id].filter(Boolean) as string[],
        stepType: options?.stepType || detectedType,
        stepIntent: detectedIntent,
        lastStepIndex: currentStepIndex,
      }
    );
    
    const result = mode === 'submit' 
      ? await submit(payload)
      : await saveDraftHook(payload);
    
    return !result.error;
  }, [formData, funnelId, teamId, currentStepIndex, steps, submit, saveDraftHook]);

  // Save draft on step navigation (for drop-off tracking)
  const saveDraft = useCallback(async () => {
    const step = steps[currentStepIndex];
    const detectedIntent = step ? detectStepIntent(step as FlowCanvasStep) : 'capture';
    const detectedType = step ? detectStepType(step as FlowCanvasStep) : 'content';
    
    const payload = createUnifiedPayload(
      formData as Record<string, any>,
      {
        funnelId,
        teamId,
        stepId: step?.id,
        stepIds: [step?.id].filter(Boolean) as string[],
        stepType: detectedType,
        stepIntent: detectedIntent,
        lastStepIndex: currentStepIndex,
      }
    );
    
    await saveDraftHook(payload);
  }, [formData, funnelId, teamId, currentStepIndex, steps, saveDraftHook]);

  // Handle button click
  const handleButtonClick = useCallback(async (element: FlowCanvasElement) => {
    // Support both unified buttonAction object (new) and legacy individual props (old)
    const buttonAction = element.props.buttonAction as { type?: string; value?: string; openNewTab?: boolean } | undefined;
    const action = buttonAction?.type || (element.props.action as string) || 'next-step';
    const actionValue = buttonAction?.value;
    const openNewTab = buttonAction?.openNewTab;
    // Legacy fallbacks
    const redirectUrl = actionValue || (element.props.redirectUrl as string);
    const targetStepId = actionValue || (element.props.targetStepId as string);

    switch (action) {
      case 'next-step':
        // Save draft before moving to track progress
        saveDraft();
        
        if (!isLastStep) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          // Last step - submit and show complete
          const success = await submitLead({ submitMode: 'submit' });
          if (success) {
            setIsComplete(true);
          }
        }
        break;
        
      case 'submit':
        const success = await submitLead({ submitMode: 'submit' });
        if (success) {
          if (redirectUrl) {
            window.location.href = redirectUrl;
          } else {
            setIsComplete(true);
          }
        }
        break;
        
      case 'url':
      case 'redirect':
        if (redirectUrl) {
          // FIXED: Validate URL scheme to prevent XSS via javascript: or data: URLs
          const safeUrl = sanitizeNavigationUrl(redirectUrl);
          if (safeUrl) {
            if (openNewTab) {
              window.open(safeUrl, '_blank', 'noopener,noreferrer');
            } else {
              window.location.href = safeUrl;
            }
          }
        }
        break;
        
      case 'go-to-step':
        if (targetStepId) {
          const stepIndex = steps.findIndex(s => s.id === targetStepId);
          if (stepIndex !== -1) {
            // FIXED: Save draft before navigation
            saveDraft();
            setCurrentStepIndex(stepIndex);
          }
        }
        break;

      case 'scroll':
        if (actionValue) {
          document.querySelector(actionValue)?.scrollIntoView({ behavior: 'smooth' });
        }
        break;

      case 'phone':
        if (actionValue) {
          // FIXED: Sanitize tel: URLs
          const telUrl = `tel:${actionValue.replace(/[^\d+]/g, '')}`;
          window.location.href = telUrl;
        }
        break;

      case 'email':
        if (actionValue) {
          // FIXED: Sanitize mailto: URLs (basic XSS prevention)
          const emailUrl = `mailto:${encodeURIComponent(actionValue)}`;
          window.location.href = emailUrl;
        }
        break;

      case 'download':
        if (actionValue) {
          // FIXED: Validate download URL scheme
          const safeDownloadUrl = sanitizeNavigationUrl(actionValue);
          if (safeDownloadUrl) {
            window.open(safeDownloadUrl, '_blank', 'noopener,noreferrer');
          }
        }
        break;
        
      default:
        if (!isLastStep) {
          setCurrentStepIndex(prev => prev + 1);
        }
    }
  }, [isLastStep, steps, submitLead]);

  // Render element
  const renderElement = useCallback((element: FlowCanvasElement, block: FlowCanvasBlock) => {
    switch (element.type) {
      case 'heading':
        return renderHeading(element, deviceMode);
        
      case 'text':
        return renderText(element, deviceMode);
        
      case 'input':
        // FIXED: Preserve explicit fieldKey - only apply heuristics when no explicit key is set
        const explicitFieldKey = element.props.fieldKey as string | undefined;
        let fieldKey = explicitFieldKey || element.id;
        
        // Only apply identity heuristics if no explicit fieldKey was provided
        if (!explicitFieldKey) {
          const placeholder = ((element.props.placeholder as string) || '').toLowerCase();
          const inputType = ((element.props.type as string) || 'text').toLowerCase();
          
          // Auto-detect identity fields by placeholder or input type
          if (inputType === 'email' || placeholder.includes('email')) {
            fieldKey = 'email';
          } else if (inputType === 'tel' || placeholder.includes('phone') || placeholder.includes('mobile')) {
            fieldKey = 'phone';
          } else if ((placeholder.includes('name') && !placeholder.includes('company') && !placeholder.includes('business')) || 
                     placeholder.includes('full name') || placeholder.includes('your name')) {
            fieldKey = 'name';
          }
        }
        
        return (
          <InputRenderer
            key={element.id}
            element={element}
            value={(formData[fieldKey] as string) || ''}
            onChange={(value) => handleInputChange(fieldKey, value)}
          />
        );
        
      case 'radio':
        // FIXED: Use element ID as fallback to prevent collision between multiple radio groups
        const radioName = (element.props.name as string) || `radio_${element.id}`;
        return (
          <RadioRenderer
            key={element.id}
            element={element}
            selectedValue={(formData[radioName] as string) || ''}
            onSelect={(value) => handleRadioSelect(radioName, value)}
          />
        );
        
      case 'checkbox':
        // FIXED: Use element ID as fallback to prevent collision between multiple checkbox groups
        const checkboxName = (element.props.name as string) || `checkbox_${element.id}`;
        const checkboxValue = (element.props.value as string) || '';
        const checkedValues = (formData[checkboxName] as string[]) || [];
        return (
          <CheckboxRenderer
            key={element.id}
            element={element}
            checked={checkedValues.includes(checkboxValue)}
            onToggle={(value, checked) => handleCheckboxToggle(checkboxName, value, checked)}
          />
        );
        
      case 'button':
        return (
          <ButtonRenderer
            key={element.id}
            element={element}
            onClick={() => handleButtonClick(element)}
            isSubmitting={isSubmitting}
          />
        );
        
      case 'image':
        const src = element.props.src as string;
        const alt = (element.props.alt as string) || 'Image';
        return src ? (
          <img key={element.id} src={src} alt={alt} className="w-full rounded-lg" />
        ) : null;

      case 'video':
        const videoUrl = ((element.props?.videoSettings as { url?: string })?.url) || (element.props?.src as string);
        if (!videoUrl) return null;
        const embedUrl = videoUrl.includes('youtube') 
          ? videoUrl.replace('watch?v=', 'embed/')
          : videoUrl.includes('vimeo') 
            ? `https://player.vimeo.com/video/${videoUrl.split('/').pop()}`
            : videoUrl;
        return (
          <div key={element.id} className="aspect-video w-full rounded-lg overflow-hidden">
            <iframe src={embedUrl} className="w-full h-full" allow="autoplay; fullscreen" />
          </div>
        );

      case 'divider':
        return <hr key={element.id} className="border-t border-border my-4" style={element.styles} />;

      case 'spacer':
        return <div key={element.id} style={{ height: element.styles?.height || '48px' }} />;

      case 'icon': {
        const iconName = element.content || 'Star';
        const iconSize = element.styles?.fontSize || '24px';
        const iconColor = (element.props?.color as string) || '#6b7280';
        const iconFillType = (element.props?.fillType as string) || 'solid';
        const iconGradient = element.props?.gradient as { type?: string; angle?: number; stops?: Array<{ color: string; position: number }> };
        
        // Dynamic icon resolution
        const iconComponents: Record<string, React.ComponentType<{ style?: React.CSSProperties; className?: string }>> = {
          'Star': Sparkles, 'Sparkles': Sparkles, 'sparkles': Sparkles,
          'Rocket': Rocket, 'rocket': Rocket,
          'Search': Search, 'search': Search,
          'Calendar': Calendar, 'calendar': Calendar,
          'FileText': FileText, 'fileText': FileText,
          'Play': Play, 'play': Play,
          'User': User, 'user': User,
          'Video': Video, 'video': Video,
          'Layout': Layout, 'layout': Layout,
          'ArrowRight': ArrowRight, 'arrowRight': ArrowRight,
        };
        const IconComp = iconComponents[iconName] || Sparkles;
        
        const isGradientIcon = iconFillType === 'gradient' && iconGradient;
        
        // For gradient icons, use inline SVG gradient (background-clip doesn't work on SVGs)
        if (isGradientIcon) {
          const gradientId = `icon-gradient-${element.id}`;
          const gradientAngle = iconGradient.angle || 135;
          const stops = iconGradient.stops || [];
          
          // Calculate gradient direction based on angle
          const angleRad = (gradientAngle - 90) * (Math.PI / 180);
          const x1 = 50 - Math.cos(angleRad) * 50;
          const y1 = 50 - Math.sin(angleRad) * 50;
          const x2 = 50 + Math.cos(angleRad) * 50;
          const y2 = 50 + Math.sin(angleRad) * 50;
          
          return (
            <div key={element.id} className="flex items-center justify-center p-2">
              <svg 
                width={iconSize} 
                height={iconSize} 
                viewBox="0 0 24 24"
                style={{ display: 'block' }}
              >
                <defs>
                  <linearGradient 
                    id={gradientId} 
                    x1={`${x1}%`} 
                    y1={`${y1}%`} 
                    x2={`${x2}%`} 
                    y2={`${y2}%`}
                  >
                    {stops.map((stop, i) => (
                      <stop 
                        key={i} 
                        offset={`${stop.position}%`} 
                        stopColor={stop.color} 
                      />
                    ))}
                  </linearGradient>
                </defs>
                <IconComp 
                  style={{ 
                    width: 24, 
                    height: 24,
                    fill: `url(#${gradientId})`,
                    stroke: `url(#${gradientId})`,
                  }} 
                />
              </svg>
            </div>
          );
        }
        
        return (
          <div key={element.id} className="flex items-center justify-center p-2">
            <IconComp style={{ width: iconSize, height: iconSize, color: iconColor }} />
          </div>
        );
      }

      // Premium Elements
      case 'gradient-text': {
        const gradientProps = (element.props?.gradient as { type?: string; angle?: number; stops?: Array<{ color: string; position: number }> }) || {};
        const gradientFontSize = (element.props?.fontSize as string) || '4xl';
        const gradientFontWeight = (element.props?.fontWeight as string) || 'bold';
        const gradientTextAlign = (element.props?.textAlign as string) || 'left';
        
        const fontSizeMap: Record<string, string> = {
          'xl': '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem', 
          '5xl': '3rem', '6xl': '3.75rem', '7xl': '4.5rem'
        };
        const fontWeightMap: Record<string, number> = {
          normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800
        };
        
        return (
          <div key={element.id} style={{ textAlign: gradientTextAlign as 'left' | 'center' | 'right', width: '100%' }}>
            <span 
              className="bg-clip-text text-transparent"
              style={{ 
                backgroundImage: gradientToCSS(gradientProps),
                fontSize: fontSizeMap[gradientFontSize] || '2.25rem',
                fontWeight: fontWeightMap[gradientFontWeight] || 700,
              }}
            >
              {element.content || 'Gradient Text'}
            </span>
          </div>
        );
      }

      case 'stat-number': {
        // Strip HTML to ensure clean display (prevents leakage from InlineTextEditor)
        const stripHtml = (s: string) => s ? s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() : '';
        const suffix = stripHtml((element.props?.suffix as string) || '+');
        const statLabel = stripHtml((element.props?.label as string) || '');
        
        // Color/gradient settings
        const numberColorType = (element.props?.numberColorType as string) || 'solid';
        const numberColor = (element.props?.numberColor as string);
        const numberGradient = element.props?.numberGradient as { type?: string; angle?: number; stops?: Array<{ color: string; position: number }> } | undefined;
        
        const suffixColorType = (element.props?.suffixColorType as string) || 'solid';
        const suffixColor = (element.props?.suffixColor as string) || (page as FlowCanvasPage).settings?.primary_color || '#8B5CF6';
        const suffixGradient = element.props?.suffixGradient as { type?: string; angle?: number; stops?: Array<{ color: string; position: number }> } | undefined;
        
        const labelColorType = (element.props?.labelColorType as string) || 'solid';
        const labelColor = (element.props?.labelColor as string);
        const labelGradient = element.props?.labelGradient as { type?: string; angle?: number; stops?: Array<{ color: string; position: number }> } | undefined;
        
        const statSize = (element.props?.size as string) || 'xl';
        const statFontWeight = (element.props?.fontWeight as string) || 'bold';
        
        const statSizeMap: Record<string, string> = {
          'lg': '1.875rem', 'xl': '3rem', '2xl': '3.75rem', '3xl': '4.5rem'
        };
        const statWeightMap: Record<string, number> = {
          normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800
        };
        
        // Helper function for text gradient styles
        const getTextStyle = (colorType: string, solidColor: string | undefined, gradient?: { type?: string; angle?: number; stops?: Array<{ color: string; position: number }> }): React.CSSProperties => {
          if (colorType === 'gradient' && gradient) {
            return {
              // Use backgroundImage (NOT background) so we don't reset background-clip back to initial
              backgroundImage: gradientToCSS(gradient),
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
              display: 'inline',
            } as React.CSSProperties;
          }
          return solidColor ? { color: solidColor } : {};
        };
        
        const numberStyle = getTextStyle(numberColorType, numberColor, numberGradient);
        const suffixStyle = getTextStyle(suffixColorType, suffixColor, suffixGradient);
        const labelStyle = getTextStyle(labelColorType, labelColor, labelGradient);
        
        return (
          <div key={element.id} className="text-center">
            <div 
              className="tracking-tight inline-flex items-baseline"
              style={{ 
                fontSize: statSizeMap[statSize] || '3rem',
                fontWeight: statWeightMap[statFontWeight] || 700,
              }}
            >
              <span style={{ ...numberStyle, display: 'inline' }}>{stripHtml(element.content || '0')}</span>
              <span style={{ ...suffixStyle, display: 'inline' }}>{suffix}</span>
            </div>
            {statLabel && (
              <div className="text-xs uppercase tracking-wider mt-2 opacity-70">
                <span style={{ ...labelStyle, display: 'inline-block' }}>{statLabel}</span>
              </div>
            )}
          </div>
        );
      }

      case 'avatar-group':
        const avatarCount = (element.props?.count as number) || 3;
        const avatarSize = (element.props?.size as string) || 'md';
        const avatarAlignment = (element.props?.alignment as string) || 'flex-start';
        const avatarColorMode = (element.props?.colorMode as string) || 'gradient';
        const avatarOverlap = (element.props?.overlap as number) || 12;
        const avatarBaseColor = (element.props?.gradientFrom as string) || '#8B5CF6';
        const avatarEndColor = (element.props?.gradientTo as string) || shiftHue(avatarBaseColor, 40);
        const avatarSolidColor = (element.props?.solidColor as string) || avatarBaseColor;
        const variedColors = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
        
        // Rating display mode (Perspective-style)
        const showRating = element.props?.showRating as boolean;
        const ratingValue = (element.props?.rating as number) || 4.8;
        const ratingCountVal = (element.props?.ratingCount as number) || 148;
        const ratingSource = (element.props?.ratingSource as string) || 'reviews';
        
        const avatarSizeMap: Record<string, { wrapper: string; icon: string }> = {
          xs: { wrapper: 'w-6 h-6', icon: 'w-3 h-3' },
          sm: { wrapper: 'w-8 h-8', icon: 'w-4 h-4' },
          md: { wrapper: 'w-10 h-10', icon: 'w-5 h-5' },
          lg: { wrapper: 'w-12 h-12', icon: 'w-6 h-6' },
          xl: { wrapper: 'w-14 h-14', icon: 'w-7 h-7' },
        };
        const currentAvatarSize = avatarSizeMap[avatarSize] || avatarSizeMap.md;
        return (
          <div key={element.id} className={cn("flex items-center gap-3", showRating && "flex-col")} style={{ justifyContent: showRating ? 'center' : avatarAlignment }}>
            {/* Avatar stack */}
            <div style={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: showRating ? 'center' : undefined }}>
              {Array.from({ length: avatarCount }).map((_, i) => {
                let bg: string;
                if (avatarColorMode === 'solid') bg = avatarSolidColor;
                else if (avatarColorMode === 'varied') bg = variedColors[i % variedColors.length];
                else bg = `linear-gradient(${135 + i * 15}deg, ${avatarBaseColor}, ${avatarEndColor})`;
                return (
                  <div 
                    key={i}
                    className={cn(currentAvatarSize.wrapper, 'rounded-full flex items-center justify-center border-2 border-background')}
                    style={{ background: bg, marginLeft: i > 0 ? `-${avatarOverlap}px` : 0 }}
                  >
                    <User className={cn(currentAvatarSize.icon, 'text-white')} />
                  </div>
                );
              })}
            </div>
            
            {/* Rating display (Perspective-style) */}
            {showRating && (
              <div className="flex flex-col items-center gap-1">
                {/* Stars */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star} 
                      className="w-4 h-4" 
                      viewBox="0 0 20 20" 
                      fill={star <= Math.round(ratingValue) ? '#FACC15' : '#E5E7EB'}
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {/* Rating text */}
                <span className="text-sm text-muted-foreground">
                  {ratingValue} from {ratingCountVal} {ratingSource}
                </span>
              </div>
            )}
          </div>
        );

      case 'ticker': {
        const tickerItems = (element.props?.items as string[]) || ['Item 1', 'Item 2', 'Item 3'];
        const tickerSep = (element.props?.separator as string) || '  •  ';
        const tickerSpeed = (element.props?.speed as number) || 30;
        const tickerTextColor = (element.props?.textColor as string);
        const tickerSepColor = (element.props?.separatorColor as string) || tickerTextColor;
        const tickerBgColor = (element.props?.backgroundColor as string);
        const tickerFontSize = (element.props?.fontSize as string) || 'sm';
        const tickerFontWeight = (element.props?.fontWeight as string) || 'medium';
        const tickerLetterSpacing = (element.props?.letterSpacing as number) ?? 0.05;
        const tickerDirection = (element.props?.direction as string) || 'left';
        const tickerTextFillType = (element.props?.textFillType as string) || 'solid';
        const tickerTextGradient = element.props?.textGradient as { type?: string; angle?: number; stops?: Array<{ color: string; position: number }> };
        const tickerPauseOnHover = element.props?.pauseOnHover !== false; // Default true
        const tickerFontSizeMap: Record<string, string> = { xs: '10px', sm: '12px', md: '14px', lg: '16px', xl: '18px' };
        const tickerFontWeightMap: Record<string, number> = { normal: 400, medium: 500, semibold: 600, bold: 700 };
        
        const tickerTextStyle: React.CSSProperties = tickerTextFillType === 'gradient' && tickerTextGradient ? {
          background: gradientToCSS(tickerTextGradient),
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          display: 'inline',
        } : { color: tickerTextColor || undefined };
        
        // State for pause on hover
        const [isPaused, setIsPaused] = React.useState(false);
        
        return (
          <div 
            key={element.id} 
            className="ticker-container w-full py-3"
            style={{ 
              '--ticker-speed': `${tickerSpeed}s`,
              '--ticker-direction': tickerDirection === 'right' ? 'reverse' : 'normal',
              backgroundColor: tickerBgColor || undefined,
            } as React.CSSProperties}
            onMouseEnter={() => tickerPauseOnHover && setIsPaused(true)}
            onMouseLeave={() => tickerPauseOnHover && setIsPaused(false)}
          >
            <div 
              className="ticker-content"
              style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
            >
              {[...tickerItems, ...tickerItems].map((item, i) => (
                <span 
                  key={i} 
                  className="uppercase tracking-wider"
                  style={{ 
                    ...tickerTextStyle,
                    fontSize: tickerFontSizeMap[tickerFontSize] || '12px',
                    fontWeight: tickerFontWeightMap[tickerFontWeight] || 500,
                    letterSpacing: `${tickerLetterSpacing}em`,
                  }}
                >
                  {item}<span style={{ color: tickerSepColor || undefined }}>{tickerSep}</span>
                </span>
              ))}
            </div>
          </div>
        );
      }

      case 'badge':
        const badgeVariant = (element.props?.variant as string) || 'primary';
        const badgeIcon = element.props?.icon as string;
        const badgeAlignment = (element.props?.alignment as string) || 'flex-start';
        const badgeBgType = (element.props?.bgType as string) || 'solid';
        const badgeBgColor = (element.props?.bgColor as string) || '#8B5CF6';
        const badgeBgGradient = element.props?.bgGradient as { type: string; angle: number; stops: Array<{ color: string; position: number }> } | undefined;
        const badgeTextColor = (element.props?.textColor as string) || '#ffffff';
        const badgeBorderColor = (element.props?.borderColor as string);
        const badgeClasses: Record<string, string> = {
          primary: 'bg-purple-500/20 text-purple-400',
          success: 'bg-green-500/20 text-green-400',
          warning: 'bg-amber-500/20 text-amber-400',
          premium: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black'
        };
        const useCustomBadgeColors = badgeVariant === 'custom';
        
        // Build badge background style with gradient support
        // Apply border color for ALL variants if specified
        const badgeBackgroundStyle: React.CSSProperties = {
          ...(useCustomBadgeColors ? (badgeBgType === 'gradient' && badgeBgGradient 
            ? { background: `${badgeBgGradient.type === 'radial' ? 'radial-gradient(circle' : `linear-gradient(${badgeBgGradient.angle}deg`}, ${badgeBgGradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})` }
            : { backgroundColor: badgeBgColor }) : {}),
          ...(useCustomBadgeColors ? { color: badgeTextColor } : {}),
          // Apply border color for ANY variant if specified
          ...(badgeBorderColor ? { 
            borderColor: badgeBorderColor,
            borderWidth: '1px',
            borderStyle: 'solid',
          } : {}),
        };
        
        return (
          <div key={element.id} style={{ display: 'flex', justifyContent: badgeAlignment }}>
            <span 
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5',
                !useCustomBadgeColors && (badgeClasses[badgeVariant] || badgeClasses.primary)
              )}
              style={badgeBackgroundStyle}
            >
              {badgeIcon && (() => {
                // Dynamic icon resolution - import more icons as needed
                const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
                  'Sparkles': Sparkles, 'sparkles': Sparkles,
                  'Rocket': Rocket, 'rocket': Rocket,
                  'Star': Sparkles, 'star': Sparkles, // Use Sparkles as Star fallback
                  'Search': Search, 'search': Search,
                  'Calendar': Calendar, 'calendar': Calendar,
                  'FileText': FileText, 'fileText': FileText,
                  'Play': Play, 'play': Play,
                  'User': User, 'user': User,
                  'Video': Video, 'video': Video,
                  'Layout': Layout, 'layout': Layout,
                  'ArrowRight': ArrowRight, 'arrowRight': ArrowRight,
                };
                const IconComp = iconComponents[badgeIcon] || Sparkles;
                return <IconComp className="w-3 h-3" />;
              })()}
              {element.content || 'BADGE'}
            </span>
          </div>
        );

      case 'process-step':
        const stepNum = (element.props?.step as number) || 1;
        const stepIcon = element.props?.icon as string;
        const stepShape = (element.props?.shape as string) || 'rounded-square';
        const stepSize = (element.props?.size as string) || 'md';
        const stepAccentColor = (element.props?.accentColor as string) || (page as FlowCanvasPage).settings?.primary_color || '#8B5CF6';
        const stepTextColor = (element.props?.color as string);
        const stepNumberColor = (element.props?.numberColor as string) || '#ffffff';
        const stepMutedColor = (element.props?.mutedColor as string);
        const stepTitle = (element.props?.title as string) || element.content || 'Step Title';
        const stepDescription = (element.props?.description as string);
        const stepAlignment = (element.props?.alignment as string) || 'center';
        const showConnector = element.props?.showConnector !== false; // Default to true
        const connectorStyle = (element.props?.connectorStyle as string) || 'solid';
        const accentType = (element.props?.accentType as string) || 'solid';
        const accentGradient = element.props?.accentGradient as { type?: string; angle?: number; stops?: Array<{ color: string; position: number }> };
        const stepBadgeBackground = accentType === 'gradient' && accentGradient 
          ? gradientToCSS(accentGradient)
          : `linear-gradient(135deg, ${stepAccentColor}, ${stepAccentColor}80)`;
        
        const stepSizeMap: Record<string, { wrapper: string; icon: string; text: string }> = {
          sm: { wrapper: 'w-10 h-10', icon: 'w-4 h-4', text: 'text-sm' },
          md: { wrapper: 'w-14 h-14', icon: 'w-6 h-6', text: 'text-lg' },
          lg: { wrapper: 'w-16 h-16', icon: 'w-7 h-7', text: 'text-xl' },
          xl: { wrapper: 'w-20 h-20', icon: 'w-8 h-8', text: 'text-2xl' },
        };
        const stepShapeMap: Record<string, string> = {
          circle: 'rounded-full',
          'rounded-square': 'rounded-2xl',
          square: 'rounded-lg',
          hexagon: 'clip-path-hexagon',
          badge: 'clip-path-badge',
        };
        const currentStepSize = stepSizeMap[stepSize] || stepSizeMap.md;
        
        // Dynamic icon resolution - maps any icon name from ButtonIconPicker
        const getIconForStep = (iconName: string | undefined): React.ReactNode => {
          if (!iconName || iconName === 'number') return null;
          
          // Map of common icon names to components (subset for runtime)
          const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
            'Layout': Layout, 'Search': Search, 'ArrowRight': ArrowRight, 
            'Rocket': Rocket, 'Calendar': Calendar, 'FileText': FileText,
            'Sparkles': Sparkles, 'Play': Play, 'User': User, 'Video': Video,
            // Lowercase versions for compatibility
            'layout': Layout, 'search': Search, 'arrowRight': ArrowRight,
            'rocket': Rocket, 'calendar': Calendar, 'fileText': FileText,
            'sparkles': Sparkles, 'play': Play, 'user': User, 'video': Video,
            // Legacy names
            'map': Layout, 'share-2': ArrowRight,
          };
          
          const IconComp = iconComponents[iconName] || Sparkles;
          return <IconComp className={cn(currentStepSize.icon)} />;
        };
        
        return (
          <div 
            key={element.id} 
            className="process-step-item relative"
            style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: stepAlignment === 'center' ? 'center' : stepAlignment === 'flex-end' ? 'flex-end' : 'flex-start',
              textAlign: stepAlignment === 'center' ? 'center' : stepAlignment === 'flex-end' ? 'right' : 'left'
            }}
          >
            <div 
              className={cn(
                currentStepSize.wrapper,
                stepShapeMap[stepShape] || 'rounded-2xl',
                'flex items-center justify-center'
              )}
              style={{ background: stepBadgeBackground }}
            >
              {stepIcon && stepIcon !== 'number' ? (
                <span style={{ color: stepNumberColor }}>{getIconForStep(stepIcon)}</span>
              ) : (
                <span className={cn(currentStepSize.text, 'font-bold')} style={{ color: stepNumberColor }}>{stepNum}</span>
              )}
            </div>
            <span 
              className="text-sm font-semibold uppercase tracking-wider mt-2 block"
              style={{ color: stepTextColor || undefined }}
            >
              {stepTitle}
            </span>
            {stepDescription && (
              <p 
                className="text-sm mt-1"
                style={{ color: stepMutedColor || undefined }}
              >
                {stepDescription}
              </p>
            )}
            {showConnector && (
              connectorStyle === 'arrow' ? (
                <div className="absolute top-1/2 -right-6 flex items-center -translate-y-1/2">
                  <div className="w-4 h-0.5" style={{ backgroundColor: stepAccentColor }} />
                  <svg width="8" height="12" viewBox="0 0 8 12" className="-ml-1" style={{ color: stepAccentColor }}>
                    <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ) : (
                <div 
                  className="absolute top-1/2 -right-6 w-6 -translate-y-1/2"
                  style={{
                    height: connectorStyle === 'solid' ? '2px' : undefined,
                    backgroundColor: connectorStyle === 'solid' ? stepAccentColor : undefined,
                    borderTopWidth: connectorStyle !== 'solid' ? '2px' : undefined,
                    borderTopStyle: connectorStyle === 'dotted' ? 'dotted' : connectorStyle === 'dashed' ? 'dashed' : undefined,
                    borderTopColor: connectorStyle !== 'solid' ? stepAccentColor : undefined,
                  }}
                />
              )
            )}
          </div>
        );

      // NOTE: 'video-thumbnail' is deprecated - use 'video' with displayMode: 'thumbnail'
      // All video-thumbnail elements are now handled by the unified 'video' case above

      case 'underline-text':
        const underlineFrom = (element.props?.underlineFrom as string) || (page as FlowCanvasPage).settings?.primary_color || '#8B5CF6';
        // Theme-aware: shift hue instead of hardcoded pink
        const underlineTo = (element.props?.underlineTo as string) || shiftHue(underlineFrom, 40);
        const underlineTextAlign = (element.props?.textAlign as string) || 'left';
        const underlineHeight = (element.props?.underlineHeight as number) || 4;
        const underlineOffset = (element.props?.underlineOffset as number) || 2;
        return (
          <div key={element.id} style={{ textAlign: underlineTextAlign as 'left' | 'center' | 'right' }}>
            <span className="relative inline-block text-2xl font-bold" style={{ paddingBottom: `${underlineOffset + underlineHeight}px` }}>
              {element.content || 'Underlined Text'}
              <span 
                className="absolute left-0 right-0 rounded-full"
                style={{ 
                  background: `linear-gradient(90deg, ${underlineFrom}, ${underlineTo})`,
                  height: `${underlineHeight}px`,
                  bottom: `${underlineOffset}px`
                }}
              />
            </span>
          </div>
        );
        
      // FUNCTIONAL ELEMENT TYPES
      case 'countdown': {
        const CountdownTimer = React.lazy(() => import('../builder/components/elements/CountdownTimer'));
        const endDate = (element.props?.endDate as string) || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const countdownStyle = (element.props?.style as 'boxes' | 'inline' | 'minimal' | 'flip') || 'boxes';
        
        return (
          <React.Suspense key={element.id} fallback={<div className="animate-pulse h-20 bg-muted rounded-xl" />}>
            <CountdownTimer
              endDate={endDate}
              style={countdownStyle}
              expiredAction={(element.props?.expiredAction as 'hide' | 'show-message' | 'redirect') || 'show-message'}
              expiredMessage={element.props?.expiredMessage as string}
              expiredRedirectUrl={element.props?.expiredRedirectUrl as string}
              showLabels={element.props?.showLabels !== false}
              showDays={element.props?.showDays !== false}
              showSeconds={element.props?.showSeconds !== false}
              boxSize={(element.props?.boxSize as 'sm' | 'md' | 'lg' | 'xl') || 'md'}
              loopMode={element.props?.loopMode as boolean}
              speedMultiplier={(element.props?.speedMultiplier as number) || 1}
              animateDigits={element.props?.animateDigits as boolean}
              urgencyPulse={element.props?.urgencyPulse as boolean}
              customLabels={element.props?.customLabels as { days?: string; hours?: string; minutes?: string; seconds?: string }}
              colors={{
                background: (element.props?.colors as { background?: string })?.background || element.props?.backgroundColor as string,
                text: (element.props?.colors as { text?: string })?.text || element.props?.color as string,
                label: (element.props?.colors as { label?: string })?.label || element.props?.labelColor as string,
              }}
              onExpire={() => {
                // Could trigger next step or custom action
                if (element.props?.expiredAction === 'redirect' && element.props?.expiredRedirectUrl) {
                  window.location.href = element.props.expiredRedirectUrl as string;
                }
              }}
            />
          </React.Suspense>
        );
      }

      case 'loader': {
        const LoaderAnimation = React.lazy(() => import('../builder/components/elements/LoaderAnimation'));
        const animationType = (element.props?.animationType as 'spinner' | 'progress' | 'dots' | 'pulse' | 'analyzing') || 'analyzing';
        const duration = (element.props?.duration as number) || 3000;
        const autoAdvance = element.props?.autoAdvance !== false;
        
        return (
          <React.Suspense key={element.id} fallback={<div className="animate-pulse h-32 bg-muted rounded-xl" />}>
            <LoaderAnimation
              text={element.content || 'Analyzing your results...'}
              subText={element.props?.subText as string}
              animationType={animationType}
              duration={duration}
              autoAdvance={autoAdvance}
              showProgress={element.props?.showProgress !== false}
              size={(element.props?.size as 'sm' | 'md' | 'lg') || 'md'}
              showPercentage={element.props?.showPercentage !== false}
              easing={(element.props?.easing as 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out') || 'ease-out'}
              customSteps={element.props?.customSteps as string[] | undefined}
              completeText={(element.props?.completeText as string) || 'Complete!'}
              colors={{
                primary: (element.props?.colors as { primary?: string })?.primary || element.props?.primaryColor as string || (page as FlowCanvasPage).settings?.primary_color,
                text: (element.props?.colors as { text?: string })?.text || element.props?.color as string,
              }}
              onComplete={() => {
                // Auto-advance to next step when loader completes
                if (autoAdvance) {
                  handleButtonClick({ type: 'button', id: 'loader-complete', props: { action: 'next-step' } } as FlowCanvasElement);
                }
              }}
            />
          </React.Suspense>
        );
      }

      case 'carousel': {
        const ImageCarousel = React.lazy(() => import('../builder/components/elements/ImageCarousel'));
        const slides = (element.props?.slides as Array<{ id: string; src: string; alt?: string }>) || [];
        
        return (
          <React.Suspense key={element.id} fallback={<div className="animate-pulse aspect-video bg-muted rounded-xl" />}>
            <ImageCarousel
              slides={slides}
              autoplay={element.props?.autoplay as boolean || false}
              autoplayInterval={element.props?.autoplayInterval as number || 4000}
              navigationStyle={(element.props?.navigationStyle as 'arrows' | 'dots' | 'both' | 'none') || 'both'}
              loop={element.props?.loop !== false}
              aspectRatio={(element.props?.aspectRatio as '16:9' | '4:3' | '1:1') || '16:9'}
              borderRadius={parseInt(element.styles?.borderRadius as string || '12')}
            />
          </React.Suspense>
        );
      }

      case 'logo-marquee': {
        const LogoMarquee = React.lazy(() => import('../builder/components/elements/LogoMarquee'));
        const logos = (element.props?.logos as Array<{ id: string; src: string; alt?: string }>) || [];
        
        return (
          <React.Suspense key={element.id} fallback={<div className="animate-pulse h-16 bg-muted rounded-xl" />}>
            <LogoMarquee
              logos={logos}
              animated={element.props?.animated !== false}
              speed={element.props?.speed as number || 30}
              direction={(element.props?.direction as 'left' | 'right') || 'left'}
              pauseOnHover={element.props?.pauseOnHover !== false}
              grayscale={element.props?.grayscale !== false}
              logoHeight={element.props?.logoHeight as number || 40}
              gap={element.props?.gap as number || 48}
              showTextFallback={element.props?.showTextFallback === true}
              hoverEffect={(element.props?.hoverEffect as 'none' | 'color' | 'scale' | 'both') || 'color'}
            />
          </React.Suspense>
        );
      }

      case 'map-embed': {
        const MapEmbed = React.lazy(() => import('../builder/components/elements/MapEmbed'));
        
        return (
          <React.Suspense key={element.id} fallback={<div className="animate-pulse h-64 bg-muted rounded-xl" />}>
            <MapEmbed
              address={element.props?.address as string || ''}
              zoom={element.props?.zoom as number || 15}
              mapType={(element.props?.mapType as 'roadmap' | 'satellite') || 'roadmap'}
              height={parseInt(element.styles?.height as string || '300', 10)}
              borderRadius={parseInt(element.styles?.borderRadius as string || '12')}
            />
          </React.Suspense>
        );
      }

      case 'html-embed': {
        const HTMLEmbed = React.lazy(() => import('../builder/components/elements/HTMLEmbed'));
        
        return (
          <React.Suspense key={element.id} fallback={<div className="animate-pulse h-48 bg-muted rounded-xl" />}>
            <HTMLEmbed
              code={element.props?.code as string || ''}
              height={parseInt(element.styles?.height as string || '300', 10)}
              borderRadius={parseInt(element.styles?.borderRadius as string || '12')}
              allowScripts={element.props?.allowScripts as boolean || false}
            />
          </React.Suspense>
        );
      }

      case 'trustpilot': {
        const TrustpilotWidget = React.lazy(() => import('../builder/components/elements/TrustpilotWidget'));
        
        return (
          <React.Suspense key={element.id} fallback={<div className="animate-pulse h-24 bg-muted rounded-xl" />}>
            <TrustpilotWidget
              rating={element.props?.rating as number || 4.5}
              reviewCount={element.props?.reviewCount as number || 1234}
              businessName={element.props?.businessName as string}
              layout={(element.props?.layout as 'horizontal' | 'vertical' | 'compact') || 'horizontal'}
              showLogo={element.props?.showLogo !== false}
              showReviewCount={element.props?.showReviewCount !== false}
              linkUrl={element.props?.linkUrl as string}
            />
          </React.Suspense>
        );
      }

      // Missing element types - basic fallback renderers
      case 'select': {
        const selectName = (element.props.name as string) || element.id;
        const options = (element.props.options as Array<{ label: string; value: string }>) || [];
        return (
          <select
            key={element.id}
            className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground"
            value={(formData[selectName] as string) || ''}
            onChange={(e) => handleInputChange(selectName, e.target.value)}
          >
            <option value="">{(element.props.placeholder as string) || 'Select an option'}</option>
            {options.map((opt, i) => (
              <option key={i} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      }

      case 'link': {
        const href = (element.props.href as string) || '#';
        return (
          <a
            key={element.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80 transition-colors"
            style={resolveElementStyles(element, deviceMode)}
          >
            {element.content || 'Link'}
          </a>
        );
      }

      case 'icon-text': {
        const iconTextColor = (element.props?.textColor as string) || 'currentColor';
        return (
          <div key={element.id} className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: iconTextColor }} />
            <span style={{ color: iconTextColor }}>{element.content || 'Icon text'}</span>
          </div>
        );
      }

      case 'single-choice':
      case 'multiple-choice': {
        const choiceName = (element.props.name as string) || element.id;
        const choices = (element.props.options as Array<{ label: string; value: string }>) || [];
        const isMultiple = element.type === 'multiple-choice';
        return (
          <div key={element.id} className="space-y-2">
            {choices.map((choice, i) => (
              <button
                key={i}
                type="button"
                onClick={() => isMultiple 
                  ? handleCheckboxToggle(choiceName, choice.value, !((formData[choiceName] as string[]) || []).includes(choice.value))
                  : handleRadioSelect(choiceName, choice.value)
                }
                className={cn(
                  'w-full p-3 rounded-lg border text-left transition-all',
                  (isMultiple ? ((formData[choiceName] as string[]) || []).includes(choice.value) : formData[choiceName] === choice.value)
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-muted text-muted-foreground hover:border-primary/50'
                )}
              >
                {choice.label}
              </button>
            ))}
          </div>
        );
      }
        
      default:
        return null;
    }
  }, [formData, handleInputChange, handleRadioSelect, handleCheckboxToggle, handleButtonClick, isSubmitting]);

  // Progress indicator
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100;

  // ============================================================================
  // CanvasRenderer Integration for Pixel-Perfect Parity
  // ============================================================================
  
  // Empty selection state for read-only mode (no selection in runtime)
  const noSelection: SelectionState = useMemo(() => ({ 
    type: null, 
    id: null, 
    path: [] 
  }), []);
  
  // Convert FlowCanvas step format to CanvasRenderer's Step type
  const runtimeStep: Step | null = useMemo(() => {
    if (!currentStep) return null;
    
    return {
      id: currentStep.id,
      name: currentStep.name,
      step_type: 'content' as const,
      step_intent: 'capture' as const,
      submit_mode: 'next' as const,
      frames: currentStep.frames.map(frame => ({
        id: frame.id,
        label: (frame as any).label || 'Frame',
        stacks: frame.stacks.map(stack => ({
          id: stack.id,
          label: (stack as any).label || 'Stack',
          direction: 'vertical' as const,
          blocks: stack.blocks.map(block => ({
            id: block.id,
            type: block.type as any,
            label: block.label,
            elements: block.elements.map(el => ({
              id: el.id,
              type: el.type as any,
              content: el.content,
              props: el.props,
              styles: el.styles,
              responsive: el.responsive,
              animation: el.animation,
            })),
            props: block.props,
            styles: block.styles,
          })),
          props: (stack as any).props || {},
          styles: (stack as any).styles,
        })),
        props: (frame as any).props || {},
        styles: (frame as any).styles,
        layout: (frame as any).layout,
        paddingVertical: (frame as any).paddingVertical,
        paddingHorizontal: (frame as any).paddingHorizontal,
        blockGap: (frame as any).blockGap,
        maxWidth: (frame as any).maxWidth,
        background: (frame as any).background,
        backgroundColor: (frame as any).backgroundColor,
        backgroundGradient: (frame as any).backgroundGradient,
        backgroundImage: (frame as any).backgroundImage,
        glass: (frame as any).glass,
      })),
      background: (currentStep.settings as any)?.background,
      settings: {
        maxWidth: currentStep.settings?.maxWidth,
        minHeight: currentStep.settings?.minHeight,
        verticalAlign: currentStep.settings?.verticalAlign,
      },
    };
  }, [currentStep]);
  
  // Page settings for CanvasRenderer (matches editor's pageSettings prop)
  const canvasPageSettings = useMemo(() => ({
    theme: pageSettings?.theme,
    font_family: fontFamily,
    primary_color: primaryColor,
    page_background: pageBackground,
  }), [pageSettings?.theme, fontFamily, primaryColor, pageBackground]);
  
  // Form submission handler for CanvasRenderer's FlowContainerProvider
  const handleFormSubmit = useCallback(async (values: Record<string, string>) => {
    // FIXED: Build merged data synchronously BEFORE state update to avoid stale closure
    const mergedData = { ...formData, ...values };
    
    // Update state for UI (this is async, but we don't depend on it for submission)
    setFormData(prev => ({ ...prev, ...values }));
    
    // FIXED: Pass merged data explicitly to avoid stale state issue
    const success = await submitLead({ 
      submitMode: 'submit',
      explicitFormData: mergedData 
    });
    if (success) {
      setIsComplete(true);
    }
  }, [formData, submitLead]);

  // Complete state - full-bleed background
  if (isComplete) {
    return (
      <RuntimeThemeContext.Provider value={{ isDarkTheme, primaryColor }}>
        <div 
          className={cn("flowcanvas-runtime min-h-screen relative overflow-x-hidden", isDarkTheme && 'dark')}
          style={{ 
            fontFamily: fontFamily, 
            '--primary-color': primaryColor,
            ...backgroundStyles 
          } as React.CSSProperties}
        >
          {/* Video background - full bleed */}
          {videoBackgroundUrl && (
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
              {isDirectVideo ? (
                <video src={videoBackgroundUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <iframe src={videoBackgroundUrl} className="absolute inset-0 w-full h-full scale-150" allow="autoplay; fullscreen" frameBorder={0} />
              )}
            </div>
          )}
          {overlayStyles && <div className="fixed inset-0 z-[1] pointer-events-none" style={overlayStyles} />}
          
          {/* Constrained content */}
          <div className={cn('mx-auto px-8 pb-8 pt-4 relative z-10 min-h-screen flex items-center justify-center', deviceWidths[deviceMode])}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md p-8"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h1 className={cn("text-2xl font-bold mb-2", isDarkTheme ? 'text-white' : 'text-gray-900')}>You're All Set!</h1>
              <p className={cn(isDarkTheme ? 'text-white/70' : 'text-gray-600')}>
                We've received your application. Check your inbox for next steps.
              </p>
            </motion.div>
          </div>
        </div>
      </RuntimeThemeContext.Provider>
    );
  }

  // No steps - full-bleed background
  if (steps.length === 0) {
    return (
      <RuntimeThemeContext.Provider value={{ isDarkTheme, primaryColor }}>
        <div 
          className={cn("flowcanvas-runtime min-h-screen relative overflow-x-hidden", isDarkTheme && 'dark')}
          style={{ 
            fontFamily: fontFamily, 
            '--primary-color': primaryColor,
            ...backgroundStyles 
          } as React.CSSProperties}
        >
          {overlayStyles && <div className="fixed inset-0 z-[1] pointer-events-none" style={overlayStyles} />}
          <div className={cn('mx-auto px-8 pb-8 pt-4 relative z-10 min-h-screen flex items-center justify-center', deviceWidths[deviceMode])}>
            <p className={cn(isDarkTheme ? 'text-white/70' : 'text-gray-500')}>No content available</p>
          </div>
        </div>
      </RuntimeThemeContext.Provider>
    );
  }

  return (
    <RuntimeThemeContext.Provider value={{ isDarkTheme, primaryColor }}>
      <div 
        className={cn("flowcanvas-runtime min-h-screen relative overflow-x-hidden", isDarkTheme && 'dark')}
        style={{ 
          fontFamily: fontFamily,
          '--primary-color': primaryColor,
          ...backgroundStyles,
        } as React.CSSProperties}
      >
        {/* Video background - FULL BLEED */}
        {videoBackgroundUrl && (
          <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {isDirectVideo ? (
              <video
                src={videoBackgroundUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <iframe
                src={videoBackgroundUrl}
                className="absolute inset-0 w-full h-full scale-150"
                allow="autoplay; fullscreen"
                frameBorder={0}
              />
            )}
          </div>
        )}
        
        {/* Background overlay - FULL BLEED */}
        {overlayStyles && (
          <div className="fixed inset-0 z-[1] pointer-events-none" style={overlayStyles} />
        )}

        {/* Progress bar - fixed to top */}
        {totalSteps > 1 && (
          <div className="fixed top-0 left-0 right-0 h-1 bg-muted/50 z-50">
            <motion.div
              className="h-full"
              style={{ backgroundColor: primaryColor }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Navigation arrows - fixed to viewport */}
        {/* FIXED: Save draft on arrow navigation for drop-off tracking */}
        {totalSteps > 1 && (
          <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40">
            <button
              onClick={() => {
                // FIXED: Save draft before navigation to track progress
                saveDraft();
                setCurrentStepIndex(prev => Math.max(0, prev - 1));
              }}
              disabled={currentStepIndex === 0}
              className={cn(
                'p-2 rounded-full transition-all',
                currentStepIndex === 0
                  ? 'text-muted-foreground/30 cursor-not-allowed'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                // FIXED: Save draft before navigation to track progress
                saveDraft();
                setCurrentStepIndex(prev => Math.min(totalSteps - 1, prev + 1));
              }}
              disabled={currentStepIndex === totalSteps - 1}
              className={cn(
                'p-2 rounded-full transition-all',
                currentStepIndex === totalSteps - 1
                  ? 'text-muted-foreground/30 cursor-not-allowed'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step content - uses CanvasRenderer in readOnly mode for pixel-perfect parity.
            CanvasRenderer provides its own mx-auto + deviceWidths constraint internally.
            We do NOT wrap it in another constrained container to avoid double-nesting. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep?.id || currentStepIndex}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full min-h-screen relative z-10"
          >
            <FlowContainerProvider
              initialSteps={steps.map(s => ({ id: s.id, name: s.name }))}
              initialStepId={currentStep?.id}
              isPreviewMode={true}
              onStepChange={(stepId, index) => setCurrentStepIndex(index)}
              onSubmit={async (values) => {
                // Handle form submission - isSubmitting is now managed by the unified hook
                await handleFormSubmit(values as Record<string, string>);
              }}
            >
              <CanvasRenderer
                step={runtimeStep}
                selection={noSelection}
                onSelect={() => {}}
                deviceMode={deviceMode}
                readOnly={true}
                pageSettings={canvasPageSettings as any}
              />
            </FlowContainerProvider>
          </motion.div>
        </AnimatePresence>

        {/* Step counter - fixed to bottom */}
        {totalSteps > 1 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground z-40">
            {currentStepIndex + 1} / {totalSteps}
          </div>
        )}
      </div>
    </RuntimeThemeContext.Provider>
  );
}

export default FlowCanvasRenderer;
