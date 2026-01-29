import React, { useState, useCallback, createContext, useContext, useEffect, useRef, useMemo } from 'react';
import { Step, Frame, Stack, Block, Element, SelectionState, Page, VisibilitySettings, AnimationSettings, ElementStateStyles, DeviceModeType, PageBackground } from '../../types/infostack';
import { cn } from '@/lib/utils';
import { Type, Image, Video, Minus, ArrowRight, Plus, GripVertical, Check, Circle, Play, Eye, Sparkles, Smartphone, MousePointer2, Layout, Menu, Layers, LayoutGrid, User, Mail, Phone } from 'lucide-react';
import { getCaptureInputIcon } from '../utils/stepRenderHelpers';
import { getButtonIconComponent } from './ButtonIconPicker';
import { DeviceMode } from './TopToolbar';
import { BlockActionBar } from './BlockActionBar';
import { SectionActionBar } from './SectionActionBar';
import { UnifiedElementToolbar, UnifiedToolbarStyles } from './UnifiedElementToolbar';
import { AddSectionPopover } from './AddSectionPopover';
import { InlineTextEditor, TextStyles } from './InlineTextEditor';
import { evaluateVisibility } from '../hooks/useScrollAnimation';
import { gradientToCSS, cloneGradient, GradientValue } from './modals';
import { stripHtmlToText } from '../utils/textHelpers';
import { BuilderContextMenu } from './ContextMenu';
import { ApplicationFlowCard } from './ApplicationFlowCard';
import { useFlowContainerSafe, buttonActionToIntent, FlowIntent } from '../contexts/FlowContainerContext';
import { CanvasErrorBoundary } from './inspectors/shared/CanvasErrorBoundary';

// ============================================
// HOISTED LAZY IMPORTS - Module Scope (Prevents flashing)
// These MUST be at module scope, NOT inside render functions
// ============================================
const CountdownTimer = React.lazy(() => import('./elements/CountdownTimer'));
const LoaderAnimation = React.lazy(() => import('./elements/LoaderAnimation'));
const ImageCarousel = React.lazy(() => import('./elements/ImageCarousel'));
const LogoMarquee = React.lazy(() => import('./elements/LogoMarquee'));
const MapEmbed = React.lazy(() => import('./elements/MapEmbed'));
const HTMLEmbed = React.lazy(() => import('./elements/HTMLEmbed'));
const TrustpilotWidget = React.lazy(() => import('./elements/TrustpilotWidget'));
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Multi-selection type
interface MultiSelection {
  type: 'element' | 'block';
  ids: Set<string>;
}

// Import shared utilities from CanvasUtilities (Phase 8: consolidated)
import { CanvasUtilities } from './renderers/CanvasUtilities';
const { getContrastTextColor, lightenHex, shiftHue, isLightColor, extractGradientFirstColor: extractFirstGradientColor } = CanvasUtilities;

// Helper to generate page background styles
const getPageBackgroundStyles = (bg: PageBackground | undefined, isDarkTheme: boolean): React.CSSProperties => {
  // Always return a visible background - never leave blank
  const defaultBg = isDarkTheme ? '#111827' : '#ffffff';
  
  if (!bg || !bg.type) {
    return { backgroundColor: defaultBg };
  }
  
  const styles: React.CSSProperties = {};
  
  switch (bg.type) {
    case 'solid':
      styles.backgroundColor = bg.color || defaultBg;
      break;
    case 'gradient':
      if (bg.gradient && bg.gradient.stops && bg.gradient.stops.length >= 2) {
        styles.background = gradientToCSS(bg.gradient);
      } else {
        // Fallback gradient if none defined
        styles.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }
      break;
    case 'image':
      if (bg.image) {
        styles.backgroundImage = `url(${bg.image})`;
        styles.backgroundSize = 'cover';
        styles.backgroundPosition = 'center';
      } else {
        // Fallback if no image set
        styles.backgroundColor = defaultBg;
      }
      break;
    case 'video':
      // Video backgrounds render as transparent - actual video is a separate element
      styles.backgroundColor = defaultBg;
      break;
    case 'pattern':
      // Pattern background with SVG overlay
      styles.backgroundColor = bg.color || defaultBg;
      if (bg.pattern) {
        const p = bg.pattern;
        const opacity = (p.opacity || 20) / 100;
        const size = p.size || 20;
        let svg = '';
        switch (p.type) {
          case 'dots':
            svg = `<circle cx="${size/2}" cy="${size/2}" r="1.5" fill="${p.color}" fill-opacity="${opacity}"/>`;
            break;
          case 'grid':
            svg = `<path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="${p.color}" stroke-opacity="${opacity}" stroke-width="0.5"/>`;
            break;
          case 'lines':
            svg = `<path d="M 0 ${size} L ${size} 0" stroke="${p.color}" stroke-opacity="${opacity}" stroke-width="0.5"/>`;
            break;
          case 'noise':
            svg = `<path d="M 0 ${size} L ${size} 0 M ${size} ${size} L 0 0" stroke="${p.color}" stroke-opacity="${opacity}" stroke-width="0.5"/>`;
            break;
        }
        const encoded = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${svg}</svg>`);
        styles.backgroundImage = `url("data:image/svg+xml,${encoded}")`;
        styles.backgroundRepeat = 'repeat';
      }
      break;
    default:
      styles.backgroundColor = defaultBg;
  }
  
  return styles;
};

// Helper to get video embed URL from various platforms
const getVideoBackgroundUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&showinfo=0`;
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1&background=1`;
  
  // Direct video URL (mp4, webm)
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) return url;
  
  return null;
};

// Check if URL is a direct video file
const isDirectVideoUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
};

// Helper to get overlay styles
const getOverlayStyles = (bg: PageBackground | undefined): React.CSSProperties | null => {
  if (!bg?.overlay || bg.overlay === 'none') return null;
  
  const opacity = (bg.overlayOpacity || 50) / 100;
  
  switch (bg.overlay) {
    case 'dark':
      return { backgroundColor: `rgba(0, 0, 0, ${opacity})` };
    case 'light':
      return { backgroundColor: `rgba(255, 255, 255, ${opacity})` };
    case 'gradient-dark':
      return { background: `linear-gradient(to bottom, transparent, rgba(0, 0, 0, ${opacity}))` };
    case 'gradient-light':
      return { background: `linear-gradient(to bottom, transparent, rgba(255, 255, 255, ${opacity}))` };
    default:
      return null;
  }
};

// Form state context for preview mode
interface FormStateContextValue {
  values: Record<string, string>;
  checkboxValues: Record<string, Set<string>>; // For multi-select checkboxes
  setValue: (key: string, value: string) => void;
  toggleCheckbox: (groupKey: string, value: string) => void;
  isChecked: (groupKey: string, value: string) => boolean;
  isPreviewMode: boolean;
}

const FormStateContext = createContext<FormStateContextValue>({
  values: {},
  checkboxValues: {},
  setValue: () => {},
  toggleCheckbox: () => {},
  isChecked: () => false,
  isPreviewMode: false,
});

interface CanvasRendererProps {
  step: Step | null;
  selection: SelectionState;
  multiSelection?: MultiSelection | null;
  onSelect: (selection: SelectionState, isShiftHeld?: boolean) => void;
  deviceMode: DeviceMode;
  readOnly?: boolean;
  designMode?: 'select' | 'pan';
  onReorderBlocks?: (stackId: string, fromIndex: number, toIndex: number) => void;
  onReorderElements?: (blockId: string, fromIndex: number, toIndex: number) => void;
  onOpenBlockPalette?: () => void;
  onAddBlock?: (block: Block, position?: { stackId: string; index: number }) => void;
  onAddFrame?: () => void;
  onUpdateElement?: (elementId: string, updates: Partial<Element>) => void;
  onDuplicateElement?: (elementId: string) => void;
  onDeleteElement?: (elementId: string) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onDeleteBlock?: (blockId: string) => void;
  onUpdateBlock?: (blockId: string, updates: Partial<Block>) => void;
  onCopy?: () => void;
  onPaste?: () => void;
  canPaste?: boolean;
  pageSettings?: Page['settings'];
  replayAnimationKey?: number;
  onNextStep?: () => void;
  onGoToStep?: (stepId: string) => void;
  onFormSubmit?: (values: Record<string, string>) => void;
  showGrid?: boolean;
  onOpenAIGenerate?: () => void;
  // Section (frame) management
  onReorderFrames?: (fromIndex: number, toIndex: number) => void;
  onDuplicateFrame?: (frameId: string) => void;
  onDeleteFrame?: (frameId: string) => void;
  onAddFrameAt?: (position: 'above' | 'below', referenceFrameId: string) => void;
  onRenameFrame?: (frameId: string, newName: string) => void;
  // Block picker in left panel
  onOpenBlockPickerInPanel?: (stackId: string) => void;
  // Section picker for adding new sections
  onOpenSectionPicker?: () => void;
  // Application Flow step selection (for canvas step switching)
  selectedApplicationStepId?: string | null;
  // Active Application Flow block ID (for scoped step selection)
  activeApplicationFlowBlockId?: string | null;
  // Element selection within flow steps
  selectedStepElement?: { stepId: string; elementType: 'title' | 'description' | 'button' | 'option' | 'input'; optionIndex?: number } | null;
  onSelectStepElement?: (element: { stepId: string; elementType: 'title' | 'description' | 'button' | 'option' | 'input'; optionIndex?: number } | null) => void;
}

// Button Action type - use shared type
import type { ButtonAction } from '@/flow-canvas/shared/types/buttonAction';

// Theme context for passing dark mode state and primary color down
export interface ThemeContextValue {
  isDarkTheme: boolean;
  primaryColor: string;
}

export const ThemeContext = createContext<ThemeContextValue>({
  isDarkTheme: false,
  primaryColor: '#8B5CF6',
});

const deviceWidths: Record<DeviceMode, string> = {
  desktop: 'max-w-5xl',
  tablet: 'max-w-2xl',
  mobile: 'max-w-sm',
};

// Effect CSS class mapping - comprehensive mapping for all effect IDs
const effectClasses: Record<string, string> = {
  'fade-in': 'animate-fade-in',
  'slide-up': 'animate-slide-up',
  'slide-down': 'animate-slide-down',
  'slide-left': 'animate-slide-left',
  'slide-right': 'animate-slide-right',
  'bounce': 'animate-bounce',
  'bounce-in': 'effect-bounce-in',
  'pulse': 'animate-pulse',
  'scale': 'animate-scale-in',
  'flip': 'animate-flip-in',
  'flip-in': 'effect-flip-in',
  'rotate': 'animate-rotate-in',
  // Attention effects
  'shake': 'effect-shake',
  'wiggle': 'effect-wiggle',
  'glow': 'effect-glow',
  // Icon effects
  'icon-spin': 'effect-spin',
  'icon-pulse': 'effect-pulse',
  'icon-bounce': 'effect-bounce-in',
  'icon-shake': 'effect-shake',
  'icon-wobble': 'effect-wiggle',
  // Text effects - now with proper CSS classes
  'typewriter': 'effect-typewriter',
  'word-fade': 'effect-word-fade',
  'text-blur': 'effect-blur-in',
  'text-glow': 'effect-glow',
  'text-gradient': 'shimmer',
  'blur-in': 'effect-blur-in',
};

// Convert video URL to embed URL with optional settings
const getEmbedUrl = (url: string, platform: string, settings?: { autoplay?: boolean; muted?: boolean; loop?: boolean }): string => {
  const autoplay = settings?.autoplay !== false ? 1 : 0;
  const mute = settings?.muted !== false ? 1 : 0;
  const loop = settings?.loop ? 1 : 0;
  
  if (platform === 'youtube') {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (match) {
      const params = new URLSearchParams({ autoplay: String(autoplay), mute: String(mute), loop: String(loop), playlist: match[1] });
      return `https://www.youtube.com/embed/${match[1]}?${params.toString()}`;
    }
  }
  if (platform === 'vimeo') {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) {
      const params = new URLSearchParams({ autoplay: String(autoplay), muted: String(mute), loop: String(loop), background: '1' });
      return `https://player.vimeo.com/video/${match[1]}?${params.toString()}`;
    }
  }
  if (platform === 'loom') {
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (match) return `https://www.loom.com/embed/${match[1]}`;
  }
  return url;
};

// Sortable Element Renderer with inline editing and hover toolbar
interface SortableElementRendererProps {
  element: Element;
  isSelected: boolean;
  isMultiSelected?: boolean;
  onSelect: (e?: React.MouseEvent) => void;
  onUpdate?: (updates: Partial<Element>) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  canPaste?: boolean;
  readOnly?: boolean;
  replayAnimationKey?: number;
  selectionId?: string | null;
  deviceMode?: DeviceMode;
  onNextStep?: () => void;
  onGoToStep?: (stepId: string) => void;
  onFormSubmit?: (values: Record<string, string>) => void;
}

const SortableElementRenderer = React.forwardRef<HTMLDivElement, SortableElementRendererProps>(({ 
  element, 
  isSelected,
  isMultiSelected = false,
  onSelect,
  onUpdate,
  onDuplicate,
  onDelete,
  onCopy,
  onPaste,
  canPaste = false,
  readOnly = false,
  replayAnimationKey = 0,
  selectionId,
  deviceMode = 'desktop',
  onNextStep,
  onGoToStep,
  onFormSubmit,
}, forwardedRef) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });
  
  // Access form state for conditional visibility and interactive elements
  const { values: formValues, setValue, toggleCheckbox, isChecked, isPreviewMode } = useContext(FormStateContext);
  
  // Access theme context for button colors
  const { isDarkTheme, primaryColor } = useContext(ThemeContext);
  
  // Access FlowContainer for intent-based button actions (SINGLE SOURCE OF TRUTH for step progression)
  const flowContainer = useFlowContainerSafe();
  
  // State for hover/active interactions
  const [currentInteractionState, setCurrentInteractionState] = useState<'base' | 'hover' | 'active'>('base');
  
  // State for tracking inline text editing - hides ElementActionBar when true
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  
  // Animation replay ref for forcing reflow
  const elementRef = React.useRef<HTMLDivElement>(null);
  
  // Wrapper ref for toolbar positioning - combines with dnd-kit's setNodeRef and forwardedRef
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const combinedRef = React.useCallback((node: HTMLDivElement | null) => {
    wrapperRef.current = node;
    setNodeRef(node);
    // Also set forwarded ref if provided
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  }, [setNodeRef, forwardedRef]);
  
  // Import easing map from unified presets
  // Note: We need to use it inline here since this is inside a component
  const easingMapLocal: Record<string, string> = {
    'ease': 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    'linear': 'linear',
    'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
  };
  
  // Build transition CSS from element's base state styles
  const buildTransitionCSS = useCallback((): string => {
    const baseStyles = element.stateStyles?.base;
    const duration = baseStyles?.transitionDuration || '200ms';
    const easing = easingMapLocal[baseStyles?.transitionEasing || 'ease'] || 'ease';
    const delay = baseStyles?.transitionDelay || '0ms';
    
    // Build transition for all commonly animated properties
    const properties = ['transform', 'opacity', 'background-color', 'color', 'border-color', 'box-shadow'];
    return properties.map(prop => `${prop} ${duration} ${easing} ${delay}`).join(', ');
  }, [element.stateStyles?.base?.transitionDuration, element.stateStyles?.base?.transitionEasing, element.stateStyles?.base?.transitionDelay]);
  
  // Style resolver: merges base → stateStyles → responsive overrides
  const resolveElementStyles = useCallback((): React.CSSProperties => {
    const base: React.CSSProperties = {};
    
    // Apply base styles from element.styles
    if (element.styles?.opacity) {
      const opacityVal = typeof element.styles.opacity === 'string' 
        ? parseInt(element.styles.opacity) / 100 
        : element.styles.opacity;
      base.opacity = opacityVal;
    }
    if (element.styles?.backgroundColor) base.backgroundColor = element.styles.backgroundColor;
    if (element.styles?.borderRadius) base.borderRadius = element.styles.borderRadius;
    if (element.styles?.cursor) base.cursor = element.styles.cursor;
    if (element.styles?.display) base.display = element.styles.display;
    if (element.styles?.overflow) base.overflow = element.styles.overflow;
    
    // Apply dimension properties
    if (element.styles?.width) base.width = element.styles.width;
    if (element.styles?.height) base.height = element.styles.height;
    if (element.styles?.maxWidth) base.maxWidth = element.styles.maxWidth;
    if (element.styles?.minHeight) base.minHeight = element.styles.minHeight;
    if (element.styles?.minWidth) base.minWidth = element.styles.minWidth;
    if (element.styles?.maxHeight) base.maxHeight = element.styles.maxHeight;
    
    // Apply spacing/padding properties
    if (element.styles?.padding) base.padding = element.styles.padding;
    if (element.styles?.paddingTop) base.paddingTop = element.styles.paddingTop;
    if (element.styles?.paddingRight) base.paddingRight = element.styles.paddingRight;
    if (element.styles?.paddingBottom) base.paddingBottom = element.styles.paddingBottom;
    if (element.styles?.paddingLeft) base.paddingLeft = element.styles.paddingLeft;
    
    // Apply margin properties
    if (element.styles?.margin) base.margin = element.styles.margin;
    if (element.styles?.marginTop) base.marginTop = element.styles.marginTop;
    if (element.styles?.marginRight) base.marginRight = element.styles.marginRight;
    if (element.styles?.marginBottom) base.marginBottom = element.styles.marginBottom;
    if (element.styles?.marginLeft) base.marginLeft = element.styles.marginLeft;
    
    // Apply alignment
    if (element.styles?.alignSelf) base.alignSelf = element.styles.alignSelf as React.CSSProperties['alignSelf'];
    
    // NEW: Apply position styles
    if (element.styles?.position) base.position = element.styles.position as React.CSSProperties['position'];
    if (element.styles?.top) base.top = element.styles.top;
    if (element.styles?.right) base.right = element.styles.right;
    if (element.styles?.bottom) base.bottom = element.styles.bottom;
    if (element.styles?.left) base.left = element.styles.left;
    
    // NEW: Apply flexbox styles (for container elements)
    if (element.styles?.display) base.display = element.styles.display as React.CSSProperties['display'];
    if (element.styles?.flexDirection) base.flexDirection = element.styles.flexDirection as React.CSSProperties['flexDirection'];
    if (element.styles?.flexWrap) base.flexWrap = element.styles.flexWrap as React.CSSProperties['flexWrap'];
    if (element.styles?.justifyContent) base.justifyContent = element.styles.justifyContent as React.CSSProperties['justifyContent'];
    if (element.styles?.alignItems) base.alignItems = element.styles.alignItems as React.CSSProperties['alignItems'];
    if (element.styles?.gap) base.gap = element.styles.gap;
    if (element.styles?.flexGrow) base.flexGrow = Number(element.styles.flexGrow);
    if (element.styles?.flexShrink) base.flexShrink = Number(element.styles.flexShrink);
    
    // NEW: Apply CSS Grid styles
    if (element.styles?.gridTemplateColumns) base.gridTemplateColumns = element.styles.gridTemplateColumns;
    if (element.styles?.gridTemplateRows) base.gridTemplateRows = element.styles.gridTemplateRows as string;
    if (element.styles?.columnGap) base.columnGap = element.styles.columnGap;
    if (element.styles?.rowGap) base.rowGap = element.styles.rowGap;
    if (element.styles?.justifyItems) base.justifyItems = element.styles.justifyItems as React.CSSProperties['justifyItems'];
    
    // NEW: Apply rotation
    if (element.styles?.rotate) {
      const rotateVal = typeof element.styles.rotate === 'string' 
        ? parseInt(element.styles.rotate) 
        : element.styles.rotate;
      if (rotateVal && rotateVal !== 0) {
        base.transform = `rotate(${rotateVal}deg)`;
      }
    }
    
    // NEW: Apply z-index
    if (element.styles?.zIndex && element.styles.zIndex !== 'auto') {
      base.zIndex = Number(element.styles.zIndex);
    }
    
    // NEW: Apply border styles
    if (element.styles?.borderWidth) base.borderWidth = element.styles.borderWidth;
    if (element.styles?.borderStyle) base.borderStyle = element.styles.borderStyle as React.CSSProperties['borderStyle'];
    if (element.styles?.borderColor) base.borderColor = element.styles.borderColor;
    
    // NEW: Apply CSS filters (blur, brightness, contrast, saturation, hue-rotate, grayscale, sepia, invert)
    const blur = (element.props?.blur as number) ?? 0;
    const brightness = (element.props?.brightness as number) ?? 100;
    const contrast = (element.props?.contrast as number) ?? 100;
    const saturation = (element.props?.saturation as number) ?? 100;
    const hueRotate = (element.props?.hueRotate as number) ?? 0;
    const grayscale = (element.props?.grayscale as number) ?? 0;
    const sepia = (element.props?.sepia as number) ?? 0;
    const invert = (element.props?.invert as number) ?? 0;
    
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
    const blendMode = element.styles?.mixBlendMode as string;
    if (blendMode && blendMode !== 'normal') {
      base.mixBlendMode = blendMode as React.CSSProperties['mixBlendMode'];
    }
    
    // NEW: Apply shadow preset or custom layers
    const shadowPreset = element.props?.shadowPreset as string;
    const shadowLayers = element.props?.shadowLayers as Array<{ x: number; y: number; blur: number; spread: number; color: string; inset?: boolean }>;
    
    if (shadowLayers && shadowLayers.length > 0) {
      // Use custom shadow layers
      base.boxShadow = shadowLayers
        .map(layer => {
          const inset = layer.inset ? 'inset ' : '';
          return `${inset}${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px ${layer.color}`;
        })
        .join(', ');
    } else if (shadowPreset && shadowPreset !== 'none' && shadowPreset !== 'custom') {
      const shadowMap: Record<string, string> = {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      };
      if (shadowMap[shadowPreset]) {
        base.boxShadow = shadowMap[shadowPreset];
      }
    }
    
    // Apply state-based overrides (hover, active)
    if (currentInteractionState !== 'base' && element.stateStyles?.[currentInteractionState]) {
      const stateOverrides = element.stateStyles[currentInteractionState];
      if (stateOverrides?.backgroundColor) base.backgroundColor = stateOverrides.backgroundColor;
      if (stateOverrides?.textColor) base.color = stateOverrides.textColor;
      if (stateOverrides?.borderColor) base.borderColor = stateOverrides.borderColor;
      if (stateOverrides?.borderWidth) base.borderWidth = stateOverrides.borderWidth;
      if (stateOverrides?.opacity) base.opacity = stateOverrides.opacity;
      if (stateOverrides?.transform) base.transform = stateOverrides.transform;
      if (stateOverrides?.scale) base.transform = `scale(${stateOverrides.scale})`;
    }
    
    // Apply responsive overrides based on deviceMode - comprehensive property support
    if (deviceMode !== 'desktop' && element.responsive?.[deviceMode]) {
      const deviceOverrides = element.responsive[deviceMode];
      
      // Colors
      if (deviceOverrides?.backgroundColor) base.backgroundColor = deviceOverrides.backgroundColor;
      if (deviceOverrides?.textColor) base.color = deviceOverrides.textColor;
      if (deviceOverrides?.borderColor) base.borderColor = deviceOverrides.borderColor;
      if (deviceOverrides?.opacity !== undefined) base.opacity = deviceOverrides.opacity;
      
      // Typography
      if (deviceOverrides?.fontSize) {
        const sizeMap: Record<string, string> = { sm: '0.875rem', md: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem' };
        base.fontSize = sizeMap[deviceOverrides.fontSize] || deviceOverrides.fontSize;
      }
      if (deviceOverrides?.lineHeight) base.lineHeight = deviceOverrides.lineHeight;
      if (deviceOverrides?.letterSpacing) {
        const spacingMap: Record<string, string> = { tighter: '-0.05em', tight: '-0.025em', normal: '0', wide: '0.025em', wider: '0.05em' };
        base.letterSpacing = spacingMap[deviceOverrides.letterSpacing] || '0';
      }
      if (deviceOverrides?.textAlign) base.textAlign = deviceOverrides.textAlign as React.CSSProperties['textAlign'];
      if (deviceOverrides?.fontWeight) base.fontWeight = deviceOverrides.fontWeight;
      
      // Sizing
      if (deviceOverrides?.width) base.width = deviceOverrides.width;
      if (deviceOverrides?.height) base.height = deviceOverrides.height;
      if (deviceOverrides?.minWidth) base.minWidth = deviceOverrides.minWidth;
      if (deviceOverrides?.maxWidth) base.maxWidth = deviceOverrides.maxWidth;
      if (deviceOverrides?.minHeight) base.minHeight = deviceOverrides.minHeight;
      if (deviceOverrides?.maxHeight) base.maxHeight = deviceOverrides.maxHeight;
      
      // Spacing - Padding
      if (deviceOverrides?.padding) base.padding = deviceOverrides.padding;
      if (deviceOverrides?.paddingTop) base.paddingTop = deviceOverrides.paddingTop;
      if (deviceOverrides?.paddingBottom) base.paddingBottom = deviceOverrides.paddingBottom;
      if (deviceOverrides?.paddingLeft) base.paddingLeft = deviceOverrides.paddingLeft;
      if (deviceOverrides?.paddingRight) base.paddingRight = deviceOverrides.paddingRight;
      
      // Spacing - Margin
      if (deviceOverrides?.margin) base.margin = deviceOverrides.margin;
      if (deviceOverrides?.marginTop) base.marginTop = deviceOverrides.marginTop;
      if (deviceOverrides?.marginBottom) base.marginBottom = deviceOverrides.marginBottom;
      if (deviceOverrides?.marginLeft) base.marginLeft = deviceOverrides.marginLeft;
      if (deviceOverrides?.marginRight) base.marginRight = deviceOverrides.marginRight;
      
      // Layout - Flexbox
      if (deviceOverrides?.display) base.display = deviceOverrides.display;
      if (deviceOverrides?.flexDirection) base.flexDirection = deviceOverrides.flexDirection as React.CSSProperties['flexDirection'];
      if (deviceOverrides?.flexWrap) base.flexWrap = deviceOverrides.flexWrap as React.CSSProperties['flexWrap'];
      if (deviceOverrides?.justifyContent) base.justifyContent = deviceOverrides.justifyContent;
      if (deviceOverrides?.alignItems) base.alignItems = deviceOverrides.alignItems;
      if (deviceOverrides?.gap) base.gap = deviceOverrides.gap;
      if (deviceOverrides?.flexGrow !== undefined) base.flexGrow = deviceOverrides.flexGrow;
      if (deviceOverrides?.flexShrink !== undefined) base.flexShrink = deviceOverrides.flexShrink;
      
      // Layout - Grid
      if (deviceOverrides?.gridTemplateColumns) base.gridTemplateColumns = deviceOverrides.gridTemplateColumns;
      if (deviceOverrides?.gridTemplateRows) base.gridTemplateRows = deviceOverrides.gridTemplateRows;
      if (deviceOverrides?.columnGap) base.columnGap = deviceOverrides.columnGap;
      if (deviceOverrides?.rowGap) base.rowGap = deviceOverrides.rowGap;
      if (deviceOverrides?.justifyItems) base.justifyItems = deviceOverrides.justifyItems;
      
      // Borders
      if (deviceOverrides?.borderWidth) base.borderWidth = deviceOverrides.borderWidth;
      if (deviceOverrides?.borderRadius) base.borderRadius = deviceOverrides.borderRadius;
      if (deviceOverrides?.borderStyle) base.borderStyle = deviceOverrides.borderStyle;
      
      // Position
      if (deviceOverrides?.position) base.position = deviceOverrides.position as React.CSSProperties['position'];
      if (deviceOverrides?.top) base.top = deviceOverrides.top;
      if (deviceOverrides?.bottom) base.bottom = deviceOverrides.bottom;
      if (deviceOverrides?.left) base.left = deviceOverrides.left;
      if (deviceOverrides?.right) base.right = deviceOverrides.right;
      if (deviceOverrides?.zIndex !== undefined) base.zIndex = deviceOverrides.zIndex;
    }
    
    return base;
  }, [element.styles, element.stateStyles, element.responsive, element.props?.blur, element.props?.brightness, element.props?.shadowPreset, currentInteractionState, deviceMode]);
  
  // Evaluate conditional visibility
  const visibility = element.visibility as VisibilitySettings | undefined;
  if (isPreviewMode && visibility?.conditions && visibility.conditions.length > 0) {
    const isVisible = evaluateVisibility(visibility.conditions, visibility.logic || 'and', formValues);
    if (!isVisible) return null;
  }
  
  // NEW: Responsive visibility - hide on specific device modes
  const hideOnDesktop = element.props?.hideOnDesktop as boolean;
  const hideOnTablet = element.props?.hideOnTablet as boolean;
  const hideOnMobile = element.props?.hideOnMobile as boolean;
  
  if (isPreviewMode) {
    if (deviceMode === 'desktop' && hideOnDesktop) return null;
    if (deviceMode === 'tablet' && hideOnTablet) return null;
    if (deviceMode === 'mobile' && hideOnMobile) return null;
  }

  const resolvedStyles = resolveElementStyles();
  const transitionCSS = buildTransitionCSS();
  const style = {
    transform: CSS.Transform.toString(transform),
    // Use custom transition if element has state styles, otherwise use default
    transition: element.stateStyles ? transitionCSS : (transition || 'transform 200ms ease, opacity 200ms ease'),
    ...resolvedStyles,
  };
  
  // Hover and active handlers for state-based styling
  const stateHandlers = element.stateStyles ? {
    onMouseEnter: () => setCurrentInteractionState('hover'),
    onMouseLeave: () => setCurrentInteractionState('base'),
    onMouseDown: () => setCurrentInteractionState('active'),
    onMouseUp: () => setCurrentInteractionState('hover'),
  } : {};

  // Get effect class - prefer element.animation.effect over legacy element.props.effect
  const animationSettings = element.animation as AnimationSettings | undefined;
  const effectId = animationSettings?.effect || element.props?.effect as string | undefined;
  const effectClass = effectId ? effectClasses[effectId] : '';
  
  // Animation timing styles
  const animationStyle: React.CSSProperties = animationSettings ? {
    animationDelay: `${animationSettings.delay || 0}ms`,
    animationDuration: `${animationSettings.duration || 500}ms`,
    animationTimingFunction: animationSettings.easing || 'ease-out',
  } : {};
  
  // Check for visual indicators
  const hasConditionalLogic = visibility?.conditions && visibility.conditions.length > 0;
  const hasAnimation = !!effectId || !!animationSettings?.effect;
  const hasResponsiveOverrides = element.responsive && (element.responsive.tablet || element.responsive.mobile);
  const hasStateStyles = element.stateStyles && (
    (element.stateStyles.hover && Object.keys(element.stateStyles.hover).length > 0) ||
    (element.stateStyles.active && Object.keys(element.stateStyles.active).length > 0) ||
    (element.stateStyles.disabled && Object.keys(element.stateStyles.disabled).length > 0)
  );
  
  // Replay animation state - re-trigger animation when key changes for this element
  const [animationKey, setAnimationKey] = useState(0);
  useEffect(() => {
    if (replayAnimationKey && replayAnimationKey > 0 && selectionId === element.id) {
      // Force CSS animation restart by removing and re-adding animation
      if (elementRef.current) {
        elementRef.current.style.animation = 'none';
        // Force reflow
        void elementRef.current.offsetHeight;
        elementRef.current.style.animation = '';
      }
      setAnimationKey(prev => prev + 1);
    }
  }, [replayAnimationKey, selectionId, element.id]);

  // Generate unique class name for this element's state styles
  const stateStyleClass = hasStateStyles ? `element-state-${element.id.replace(/[^a-zA-Z0-9]/g, '')}` : '';
  
  // Generate CSS for hover/active/disabled states
  const generateStateStylesCSS = useCallback((): string => {
    if (!element.stateStyles) return '';
    
    const css: string[] = [];
    const cls = stateStyleClass;
    const transitionDuration = element.stateStyles.base?.transitionDuration || '200ms';
    
    // Hover state
    if (element.stateStyles.hover && Object.keys(element.stateStyles.hover).length > 0) {
      const hover = element.stateStyles.hover;
      const hoverStyles: string[] = [];
      if (hover.backgroundColor) hoverStyles.push(`background-color: ${hover.backgroundColor}`);
      if (hover.textColor) hoverStyles.push(`color: ${hover.textColor}`);
      if (hover.borderColor) hoverStyles.push(`border-color: ${hover.borderColor}`);
      if (hover.opacity) hoverStyles.push(`opacity: ${hover.opacity}`);
      if (hover.scale) hoverStyles.push(`transform: scale(${hover.scale})`);
      if (hoverStyles.length > 0) {
        css.push(`.${cls}:hover { ${hoverStyles.join('; ')}; transition: all ${transitionDuration} ease; }`);
      }
    }
    
    // Active state
    if (element.stateStyles.active && Object.keys(element.stateStyles.active).length > 0) {
      const active = element.stateStyles.active;
      const activeStyles: string[] = [];
      if (active.backgroundColor) activeStyles.push(`background-color: ${active.backgroundColor}`);
      if (active.textColor) activeStyles.push(`color: ${active.textColor}`);
      if (active.borderColor) activeStyles.push(`border-color: ${active.borderColor}`);
      if (active.opacity) activeStyles.push(`opacity: ${active.opacity}`);
      if (active.scale) activeStyles.push(`transform: scale(${active.scale})`);
      if (activeStyles.length > 0) {
        css.push(`.${cls}:active { ${activeStyles.join('; ')}; transition: all ${transitionDuration} ease; }`);
      }
    }
    
    // Disabled state
    if (element.stateStyles.disabled && Object.keys(element.stateStyles.disabled).length > 0) {
      const disabled = element.stateStyles.disabled;
      const disabledStyles: string[] = [];
      if (disabled.backgroundColor) disabledStyles.push(`background-color: ${disabled.backgroundColor}`);
      if (disabled.textColor) disabledStyles.push(`color: ${disabled.textColor}`);
      if (disabled.opacity) disabledStyles.push(`opacity: ${disabled.opacity}`);
      if (disabledStyles.length > 0) {
        css.push(`.${cls}[disabled], .${cls}.disabled { ${disabledStyles.join('; ')}; cursor: not-allowed; }`);
      }
    }
    
    return css.join('\n');
  }, [element.stateStyles, stateStyleClass]);

  const baseClasses = cn(
    'rounded-lg relative',
    // Only add editor chrome classes when NOT in readOnly mode
    !readOnly && 'builder-element-selectable builder-click-target group/element',
    stateStyleClass,
    !readOnly && isSelected && 'builder-element-selected',
    !readOnly && isMultiSelected && !isSelected && 'builder-multi-selected',
    isDragging && 'opacity-50 z-50',
    animationKey >= 0 && effectClass // Include key to force re-render
  );
  
  // Inject state styles CSS
  const stateStylesCSS = generateStateStylesCSS();
  
  // ISSUE 5 FIX: Helper to render visual indicator badges with proper container
  const renderIndicatorBadges = () => {
    if (readOnly || (!hasConditionalLogic && !hasAnimation && !hasResponsiveOverrides && !hasStateStyles)) {
      return null;
    }
    return (
      <div className="indicator-badge-container">
        {hasConditionalLogic && (
          <span className="indicator-badge bg-blue-500" title="Has conditional visibility">
            <Eye className="w-2.5 h-2.5 text-white" />
          </span>
        )}
        {hasAnimation && (
          <span className="indicator-badge bg-purple-500" title="Has animation">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </span>
        )}
        {hasResponsiveOverrides && (
          <span className="indicator-badge bg-green-500" title="Has responsive overrides">
            <Smartphone className="w-2.5 h-2.5 text-white" />
          </span>
        )}
        {hasStateStyles && (
          <span className="indicator-badge bg-orange-500" title="Has state-based styles (hover/active)">
            <MousePointer2 className="w-2.5 h-2.5 text-white" />
          </span>
        )}
      </div>
    );
  };
  
  // Button click action handler - EMITS INTENT to FlowContainer (SOLE AUTHORITY)
  // Buttons do NOT know step order, validation, or form state. They ONLY emit intent.
  // If FlowContainer is not present, progression is BLOCKED - no fallbacks.
  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isPreviewMode) {
      // Edit mode: select the element, do NOT emit intent
      onSelect();
      return;
    }
    
    e.preventDefault();
    
    // Preview mode: ALWAYS emit intent to FlowContainer
    // FlowContainer is the SOLE AUTHORITY for progression
    // Intent fires even if disabled - FlowContainer decides what to do
    const action = element.props?.buttonAction as ButtonAction | undefined;
    const intent = buttonActionToIntent(action);
    
    if (intent && flowContainer) {
      // For submit intent, include form values
      if (intent.type === 'submit') {
        flowContainer.emitIntent({ type: 'submit', values: formValues });
      } else {
        flowContainer.emitIntent(intent);
      }
    }
    // If no FlowContainer: intent is dropped (progression blocked)
    // This is intentional - FlowContainer is REQUIRED for progression
  }, [isPreviewMode, element.props?.buttonAction, onSelect, flowContainer, formValues]);

  /**
   * Check if this button should be disabled based on FlowContainer state.
   * This is a READ-ONLY check - button NEVER decides progression.
   * Button ALWAYS emits intent when clicked - FlowContainer rejects if blocked.
   */
  const isButtonDisabled = useMemo(() => {
    // In edit mode, never visually disabled
    if (!isPreviewMode) return false;
    // If no FlowContainer, cannot progress (but don't visually disable)
    if (!flowContainer) return false;
    
    const action = element.props?.buttonAction as ButtonAction | undefined;
    const actionType = action?.type || 'next-step';
    const canProgress = flowContainer.canProgress;
    
    switch (actionType) {
      case 'next-step':
        return !canProgress.next;
      case 'prev-step':
        return !canProgress.prev;
      case 'submit':
        return !canProgress.submit;
      case 'go-to-step':
        return action?.value ? canProgress.goToStep[action.value] === false : false;
      // External actions (url, scroll, phone, email, download) are never disabled
      default:
        return false;
    }
  }, [isPreviewMode, flowContainer, element.props?.buttonAction]);

  /**
   * Get the blocked reason to display near this button.
   * Only shown when there's a recent blocked intent and button is disabled.
   */
  const getButtonBlockedReason = useMemo((): string | null => {
    if (!isPreviewMode || !flowContainer) return null;
    if (!isButtonDisabled) return null;
    return flowContainer.lastBlockedReason || null;
  }, [isPreviewMode, flowContainer, isButtonDisabled]);

  // Handle content + styles from InlineTextEditor
  // Only update properties that are explicitly provided (not undefined)
  const handleContentChange = useCallback((newContent: string, textStyles?: Partial<TextStyles>) => {
    if (textStyles && Object.keys(textStyles).length > 0) {
      // Only update properties that are explicitly provided
      const propsUpdate: Record<string, unknown> = { ...element.props };
      if (textStyles.fontSize !== undefined) propsUpdate.fontSize = textStyles.fontSize;
      if (textStyles.fontWeight !== undefined) propsUpdate.fontWeight = textStyles.fontWeight;
      if (textStyles.fontStyle !== undefined) propsUpdate.fontStyle = textStyles.fontStyle;
      if (textStyles.textDecoration !== undefined) propsUpdate.textDecoration = textStyles.textDecoration;
      if (textStyles.textAlign !== undefined) propsUpdate.textAlign = textStyles.textAlign;
      // Add missing text style properties
      if (textStyles.fontFamily !== undefined) propsUpdate.fontFamily = textStyles.fontFamily;
      if (textStyles.textColor !== undefined) propsUpdate.textColor = textStyles.textColor;
      if (textStyles.textFillType !== undefined) propsUpdate.textFillType = textStyles.textFillType;
      if (textStyles.textGradient !== undefined) propsUpdate.textGradient = cloneGradient(textStyles.textGradient);
      if (textStyles.textShadow !== undefined) propsUpdate.textShadow = textStyles.textShadow;
      
      onUpdate?.({ 
        content: newContent,
        props: propsUpdate
      });
    } else {
      onUpdate?.({ content: newContent });
    }
  }, [onUpdate, element.props]);

  const renderElement = () => {
    // Use theme values from context (accessed in component body above)
    
    // Helper function to get typography styles
    const getTypographyStyles = () => {
      const styles: React.CSSProperties = {};
      
      // Font family (override)
      if (element.props?.fontFamily && element.props.fontFamily !== 'inherit') {
        styles.fontFamily = element.props.fontFamily as string;
      }
      
      // Font size
      const fontSize = element.props?.fontSize as string;
      if (fontSize) {
        const sizeMap: Record<string, string> = { sm: '0.875rem', md: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem', '5xl': '3rem' };
        styles.fontSize = sizeMap[fontSize] || fontSize;
      }
      
      // Font weight
      const fontWeight = element.props?.fontWeight as string;
      if (fontWeight) {
        const weightMap: Record<string, number> = { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700, black: 900 };
        styles.fontWeight = weightMap[fontWeight] || 400;
      }
      
      // Text color - only apply if not using gradient fill
      if (element.props?.textColor && element.props?.textFillType !== 'gradient') {
        styles.color = element.props.textColor as string;
      }
      
      // Text gradient - DO NOT apply here, let InlineTextEditor handle it
      // This prevents gradient from filling the parent container instead of the text
      
      // Text shadow
      const textShadow = element.props?.textShadow as string;
      if (textShadow && textShadow !== 'none') {
        const shadowMap: Record<string, string> = {
          subtle: '0 1px 2px rgba(0, 0, 0, 0.15)',
          medium: '0 2px 4px rgba(0, 0, 0, 0.25)',
          strong: '0 4px 8px rgba(0, 0, 0, 0.4)',
          glow: '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3), 0 0 30px rgba(255, 255, 255, 0.2)',
          neon: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor',
          depth: '0 1px 0 rgba(0, 0, 0, 0.1), 0 2px 0 rgba(0, 0, 0, 0.08), 0 3px 0 rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.15)',
        };
        styles.textShadow = shadowMap[textShadow];
      }
      
      // Text alignment
      if (element.props?.textAlign) {
        styles.textAlign = element.props.textAlign as 'left' | 'center' | 'right';
      }
      
      // Line height - supports both numeric (1.5) and string values
      if (element.props?.lineHeight !== undefined) {
        const lh = element.props.lineHeight;
        styles.lineHeight = typeof lh === 'number' ? lh : lh as string;
      }
      
      // Letter spacing - supports numeric (px), preset strings, or direct values
      const letterSpacing = element.props?.letterSpacing;
      if (letterSpacing !== undefined) {
        if (typeof letterSpacing === 'number') {
          // Numeric value from slider - convert to px
          styles.letterSpacing = `${letterSpacing}px`;
        } else {
          // String value - check presets or use directly
          const spacingMap: Record<string, string> = { tighter: '-0.05em', tight: '-0.025em', normal: '0', wide: '0.025em', wider: '0.05em' };
          styles.letterSpacing = spacingMap[letterSpacing as string] || letterSpacing as string;
        }
      }
      
      // Text transform
      const textTransform = element.props?.textTransform as string;
      if (textTransform && textTransform !== 'none') {
        styles.textTransform = textTransform as 'uppercase' | 'lowercase' | 'capitalize';
      }
      
      // Font style
      if (element.props?.fontStyle === 'italic') {
        styles.fontStyle = 'italic';
      }
      
      // Text decoration
      if (element.props?.textDecoration === 'underline') {
        styles.textDecoration = 'underline';
      }
      
      return styles;
    };
    
    // Helper to get shadow class or style
    const getShadowClass = () => {
      const shadow = element.props?.shadow as string;
      if (!shadow || shadow === 'none') return '';
      const shadowMap: Record<string, string> = {
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
        glow: 'btn-shadow-glow',
        neon: 'btn-shadow-neon'
      };
      return shadowMap[shadow] || '';
    };
    
    // Helper to get button shadow style with custom glow color
    const getButtonShadowStyle = (): React.CSSProperties => {
      const shadow = element.props?.shadow as string;
      const glowColor = element.props?.glowColor as string;
      
      if (!shadow || shadow === 'none') return {};
      
      // Standard shadow presets - explicit CSS values for visual distinction
      const standardShadows: Record<string, string> = {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      };
      
      if (standardShadows[shadow]) {
        return { boxShadow: standardShadows[shadow] };
      }
      
      // Convert hex to rgba helper
      const hexToRgba = (hex: string, alpha: number) => {
        if (!hex || !hex.startsWith('#') || hex.length < 7) return `rgba(139, 92, 246, ${alpha})`;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };
      
      // Custom glow/neon effects
      if (shadow === 'glow') {
        const glowBase = glowColor || element.styles?.backgroundColor as string || '#8b5cf6';
        return {
          boxShadow: `0 0 15px ${hexToRgba(glowBase, 0.5)}, 0 4px 15px -3px rgba(0, 0, 0, 0.2)`
        };
      } else if (shadow === 'neon') {
        const neonBase = glowColor || '#8b5cf6';
        return {
          boxShadow: `0 0 5px ${hexToRgba(neonBase, 0.6)}, 0 0 15px ${hexToRgba(neonBase, 0.4)}, 0 0 30px ${hexToRgba(neonBase, 0.2)}`
        };
      }
      
      return {};
    };
    
    // Helper for hover effects on non-button elements
    const getHoverHandlers = () => {
      const hoverScale = element.props?.hoverScale as string;
      const hoverOpacity = element.props?.hoverOpacity as string;
      const transitionDuration = element.props?.transitionDuration as string || '200';
      
      if (!hoverScale && !hoverOpacity) return {};
      
      return {
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          const target = e.currentTarget;
          target.style.transition = `all ${transitionDuration}ms ease`;
          if (hoverScale && hoverScale !== 'none') target.style.transform = `scale(${hoverScale})`;
          if (hoverOpacity) target.style.opacity = hoverOpacity;
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
          const target = e.currentTarget;
          target.style.transform = 'scale(1)';
          target.style.opacity = '1';
        }
      };
    };
    
    // Get layout styles
    const getLayoutStyles = (): React.CSSProperties => {
      const styles: React.CSSProperties = {};
      
      const width = element.props?.width as string;
      if (width === 'full') styles.width = '100%';
      else if (width === '1/2') styles.width = '50%';
      else if (width === '1/3') styles.width = '33.333%';
      else if (width === '2/3') styles.width = '66.666%';
      
      if (element.styles?.margin) styles.margin = element.styles.margin;
      if (element.styles?.padding) styles.padding = element.styles.padding;
      if (element.styles?.borderWidth) styles.borderWidth = element.styles.borderWidth;
      if (element.styles?.borderColor) styles.borderColor = element.styles.borderColor;
      if (element.styles?.borderWidth && !element.styles?.borderStyle) styles.borderStyle = 'solid';
      
      // Background styles - support solid, gradient, and none
      const fillType = element.props?.fillType as string;
      if (fillType === 'none') {
        // No background
        styles.backgroundColor = 'transparent';
      } else if (fillType === 'gradient' && element.props?.gradient) {
        // Gradient background
        styles.background = gradientToCSS(element.props.gradient as GradientValue);
      } else if (element.styles?.backgroundColor) {
        // Solid background color
        styles.backgroundColor = element.styles.backgroundColor;
      }
      
      // Apply background opacity if set
      const bgOpacity = element.props?.backgroundOpacity as number | undefined;
      if (bgOpacity !== undefined && bgOpacity < 100) {
        styles.opacity = bgOpacity / 100;
      }
      
      return styles;
    };
    
    const typographyStyles = getTypographyStyles();
    const layoutStyles = getLayoutStyles();
    const shadowClass = getShadowClass();
    const hoverHandlers = getHoverHandlers();
    
    switch (element.type) {
      case 'heading':
        const level = (element.props?.level as number) || 1;
        const defaultHeadingClasses = {
          1: 'text-4xl font-bold tracking-tight',
          2: 'text-3xl font-semibold',
          3: 'text-2xl font-semibold',
          4: 'text-xl font-medium',
        }[level] || 'text-xl font-medium';
        
        // Only use default classes if no custom font size is set.
        // IMPORTANT: changing fontWeight alone should NOT remove the default heading size.
        const hasCustomFontSize = !!element.props?.fontSize;
        const hasCustomTypography = hasCustomFontSize;
        
        // Link wrapper props
        const headingLinkUrl = element.props?.linkUrl as string;
        const headingLinkNewTab = element.props?.linkNewTab as boolean;
        const headingLinkUnderline = element.props?.linkUnderline as string || 'hover';
        
        // Layout-only styles for wrapper - NO typography (handled by InlineTextEditor)
        const headingWrapperStyles: React.CSSProperties = {
          textAlign: typographyStyles.textAlign,
        };
        
        // Text Effect styles (underline/highlight) - replaces separate elements
        const headingTextEffect = element.props?.textEffect as 'none' | 'underline' | 'highlight' | undefined;
        const headingTextEffectStyles: React.CSSProperties = {};
        
        if (headingTextEffect === 'underline') {
          const underlineFrom = (element.props?.underlineFrom as string) || '#8B5CF6';
          const underlineTo = (element.props?.underlineTo as string) || '#EC4899';
          headingTextEffectStyles.backgroundImage = `linear-gradient(90deg, ${underlineFrom}, ${underlineTo})`;
          headingTextEffectStyles.backgroundSize = '100% 3px';
          headingTextEffectStyles.backgroundPosition = '0 100%';
          headingTextEffectStyles.backgroundRepeat = 'no-repeat';
          headingTextEffectStyles.paddingBottom = '4px';
          headingTextEffectStyles.display = 'inline';
        } else if (headingTextEffect === 'highlight') {
          const highlightColor = (element.props?.highlightColor as string) || 'rgba(255,255,0,0.3)';
          headingTextEffectStyles.backgroundColor = highlightColor;
          headingTextEffectStyles.padding = '0.1em 0.25em';
          headingTextEffectStyles.borderRadius = '0.15em';
          headingTextEffectStyles.display = 'inline';
        }
        
        const headingContent = (
          <div 
            className={cn(
              !hasCustomTypography && defaultHeadingClasses, 
              'px-3 py-2', 
              !(element.props?.textColor || element.props?.textFillType === 'gradient') && (isDarkTheme ? 'text-white' : 'text-gray-900'),
              headingLinkUrl && headingLinkUnderline === 'always' && 'underline',
              headingLinkUrl && headingLinkUnderline === 'hover' && 'hover:underline',
              headingLinkUrl && 'cursor-pointer'
            )} 
            style={{ ...headingWrapperStyles, ...headingTextEffectStyles }}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            <InlineTextEditor
              value={element.content || ''}
              onChange={handleContentChange}
              elementType="heading"
              placeholder="Add heading..."
              disabled={readOnly}
              onEditingChange={setIsInlineEditing}
              elementId={element.id}
              initialStyles={{
                fontSize: element.props?.fontSize as TextStyles['fontSize'],
                fontWeight: element.props?.fontWeight as TextStyles['fontWeight'],
                fontStyle: element.props?.fontStyle as TextStyles['fontStyle'],
                textDecoration: element.props?.textDecoration as TextStyles['textDecoration'],
                textAlign: element.props?.textAlign as TextStyles['textAlign'],
                fontFamily: element.props?.fontFamily as string,
                textColor: element.props?.textColor as string,
                textFillType: element.props?.textFillType as 'solid' | 'gradient',
                textGradient: element.props?.textGradient as GradientValue | undefined,
                textShadow: element.props?.textShadow as string,
                highlightColor: element.props?.highlightColor as string,
                highlightGradient: element.props?.highlightGradient as GradientValue | undefined,
                highlightUseGradient: element.props?.highlightUseGradient as boolean,
              }}
            />
          </div>
        );
        
        return (
          <div 
            ref={combinedRef}
            data-element-id={element.id}
            style={{ ...style, ...layoutStyles }} 
            className={cn(baseClasses, 'relative', shadowClass)}
            {...hoverHandlers}
            {...stateHandlers}
          >
            {/* Inject state styles CSS */}
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {/* Visual indicator badges */}
            {renderIndicatorBadges()}
            {/* Unified Toolbar - hidden during inline text editing */}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="heading"
                elementLabel={`Heading ${level}`}
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                styles={{
                  fontFamily: element.props?.fontFamily as string,
                  fontSize: element.props?.fontSize as string,
                  fontWeight: element.props?.fontWeight as UnifiedToolbarStyles['fontWeight'],
                  fontStyle: element.props?.fontStyle as UnifiedToolbarStyles['fontStyle'],
                  textDecoration: element.props?.textDecoration as UnifiedToolbarStyles['textDecoration'],
                  textAlign: element.props?.textAlign as 'left' | 'center' | 'right',
                  textColor: element.props?.textColor as string,
                  textOpacity: element.props?.textOpacity as number,
                  textFillType: element.props?.textFillType as 'solid' | 'gradient',
                  textGradient: element.props?.textGradient as GradientValue,
                  textShadow: element.props?.textShadow as string,
                  backgroundColor: element.styles?.backgroundColor as string,
                  backgroundOpacity: element.props?.backgroundOpacity as number,
                  fillType: element.props?.fillType as 'solid' | 'gradient' | 'none',
                  gradient: element.props?.gradient as GradientValue,
                }}
                onStyleChange={(newStyles) => {
                  const propUpdates: Record<string, string | boolean | object | number | undefined> = {};
                  const styleUpdates: Record<string, string | undefined> = {};
                  
                  // Typography and text styling go to props
                  if (newStyles.fontFamily !== undefined) propUpdates.fontFamily = newStyles.fontFamily;
                  if (newStyles.fontSize !== undefined) propUpdates.fontSize = newStyles.fontSize;
                  if (newStyles.fontWeight !== undefined) propUpdates.fontWeight = newStyles.fontWeight;
                  if (newStyles.fontStyle !== undefined) propUpdates.fontStyle = newStyles.fontStyle;
                  if (newStyles.textDecoration !== undefined) propUpdates.textDecoration = newStyles.textDecoration;
                  if (newStyles.textColor !== undefined) propUpdates.textColor = newStyles.textColor;
                  if (newStyles.textFillType !== undefined) propUpdates.textFillType = newStyles.textFillType;
                  if (newStyles.textGradient !== undefined) propUpdates.textGradient = newStyles.textGradient;
                  if (newStyles.textShadow !== undefined) propUpdates.textShadow = newStyles.textShadow;
                  if (newStyles.textOpacity !== undefined) propUpdates.textOpacity = newStyles.textOpacity;
                  
                  // Background styling
                  if (newStyles.backgroundColor !== undefined) styleUpdates.backgroundColor = newStyles.backgroundColor;
                  if (newStyles.fillType !== undefined) propUpdates.fillType = newStyles.fillType;
                  if (newStyles.gradient !== undefined) propUpdates.gradient = newStyles.gradient;
                  if (newStyles.backgroundOpacity !== undefined) propUpdates.backgroundOpacity = newStyles.backgroundOpacity;
                  
                  const updates: Partial<Element> = {};
                  if (Object.keys(propUpdates).length > 0) updates.props = propUpdates;
                  if (Object.keys(styleUpdates).length > 0) updates.styles = styleUpdates as Record<string, string>;
                  if (Object.keys(updates).length > 0) onUpdate?.(updates);
                }}
                onAlignChange={(align) => onUpdate?.({ props: { textAlign: align } })}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                hidden={isInlineEditing}
              />
            )}
            {/* Element drag handle is now integrated into UnifiedElementToolbar */}
            {headingLinkUrl ? (
              <a 
                href={headingLinkUrl} 
                target={headingLinkNewTab ? '_blank' : undefined}
                rel={headingLinkNewTab ? 'noopener noreferrer' : undefined}
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
              >
                {headingContent}
              </a>
            ) : (
              headingContent
            )}
          </div>
        );

      case 'text':
        const textVariant = element.props?.variant as string;
        const isLogo = textVariant === 'logo';
        const isFooterLogo = textVariant === 'footer-logo';
        const isFooterHeading = textVariant === 'footer-heading';
        
        const hasTextTypography = !!element.props?.fontSize;
        
        // Link wrapper props for text
        const textLinkUrl = element.props?.linkUrl as string;
        const textLinkNewTab = element.props?.linkNewTab as boolean;
        const textLinkUnderline = element.props?.linkUnderline as string || 'hover';
        
        // Determine variant-specific styles
        const variantStyles: React.CSSProperties = {};
        let variantClasses = '';
        
        if (isLogo) {
          variantStyles.fontWeight = 'bold';
          variantStyles.fontSize = element.props?.fontSize as string || '18px';
          variantClasses = isDarkTheme ? 'text-white' : 'text-gray-900';
        } else if (isFooterLogo) {
          variantStyles.fontSize = element.props?.fontSize as string || '24px';
          variantStyles.color = element.props?.color as string || '#999';
          variantStyles.letterSpacing = '0.1em';
        } else if (isFooterHeading) {
          variantStyles.fontWeight = element.props?.fontWeight as string || '600';
          variantStyles.fontSize = element.props?.fontSize as string || '14px';
          variantClasses = isDarkTheme ? 'text-white' : 'text-gray-900';
        }
        
        // Layout-only styles for wrapper - NO typography (handled by InlineTextEditor)
        const textWrapperStyles: React.CSSProperties = {
          textAlign: typographyStyles.textAlign,
          ...variantStyles,
        };
        
        // Text Effect styles (underline/highlight) - replaces separate underline-text element
        const textEffect = element.props?.textEffect as 'none' | 'underline' | 'highlight' | undefined;
        const textEffectStyles: React.CSSProperties = {};
        let textEffectClasses = '';
        
        if (textEffect === 'underline') {
          const underlineFrom = (element.props?.underlineFrom as string) || '#8B5CF6';
          const underlineTo = (element.props?.underlineTo as string) || '#EC4899';
          const underlineHeight = (element.props?.underlineHeight as number) || 3;
          const underlineOffset = (element.props?.underlineOffset as number) || 4;
          textEffectStyles.backgroundImage = `linear-gradient(90deg, ${underlineFrom}, ${underlineTo})`;
          textEffectStyles.backgroundSize = `100% ${underlineHeight}px`;
          textEffectStyles.backgroundPosition = `0 calc(100% - ${underlineOffset}px)`;
          textEffectStyles.backgroundRepeat = 'no-repeat';
          textEffectStyles.paddingBottom = `${underlineOffset + underlineHeight}px`;
          textEffectStyles.display = 'inline';
        } else if (textEffect === 'highlight') {
          const highlightColor = (element.props?.highlightColor as string) || 'rgba(255,255,0,0.3)';
          textEffectStyles.backgroundColor = highlightColor;
          textEffectStyles.padding = '0.1em 0.25em';
          textEffectStyles.borderRadius = '0.15em';
          textEffectStyles.display = 'inline';
        }
        
        const textContent = (
          <div 
            className={cn(
              !hasTextTypography && !isLogo && !isFooterLogo && !isFooterHeading && "text-base leading-relaxed", 
              isLogo ? "px-0 py-0" : isFooterLogo ? "px-0 py-0" : isFooterHeading ? "px-0 py-1" : "px-3 py-2", 
              !(element.props?.textColor || element.props?.textFillType === 'gradient') && !variantClasses && (isDarkTheme ? 'text-gray-300' : 'text-gray-600'),
              variantClasses,
              textLinkUrl && textLinkUnderline === 'always' && 'underline',
              textLinkUrl && textLinkUnderline === 'hover' && 'hover:underline',
              textLinkUrl && 'cursor-pointer',
              textEffectClasses
            )} 
            style={{ ...textWrapperStyles, ...textEffectStyles }}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            <InlineTextEditor
              value={element.content || ''}
              onChange={handleContentChange}
              elementType="text"
              placeholder={isLogo ? "Brand®" : isFooterHeading ? "Section" : ""}
              disabled={readOnly}
              onEditingChange={setIsInlineEditing}
              elementId={element.id}
              initialStyles={{
                fontSize: element.props?.fontSize as TextStyles['fontSize'],
                fontWeight: element.props?.fontWeight as TextStyles['fontWeight'],
                fontStyle: element.props?.fontStyle as TextStyles['fontStyle'],
                textDecoration: element.props?.textDecoration as TextStyles['textDecoration'],
                textAlign: element.props?.textAlign as TextStyles['textAlign'],
                fontFamily: element.props?.fontFamily as string,
                textColor: element.props?.textColor as string,
                textFillType: element.props?.textFillType as 'solid' | 'gradient',
                textGradient: element.props?.textGradient as GradientValue | undefined,
                textShadow: element.props?.textShadow as string,
                highlightColor: element.props?.highlightColor as string,
                highlightGradient: element.props?.highlightGradient as GradientValue | undefined,
                highlightUseGradient: element.props?.highlightUseGradient as boolean,
              }}
            />
          </div>
        );
        
        return (
          <div 
            ref={combinedRef}
            data-element-id={element.id}
            style={{ ...style, ...layoutStyles }} 
            className={cn(baseClasses, 'relative', shadowClass)}
            {...hoverHandlers}
            {...stateHandlers}
          >
            {/* Inject state styles CSS */}
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {/* Visual indicator badges */}
            {renderIndicatorBadges()}
            {/* Unified Toolbar - hidden during inline text editing */}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="text"
                elementLabel={isLogo ? 'Logo' : isFooterLogo ? 'Footer Logo' : isFooterHeading ? 'Footer Heading' : 'Text'}
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                styles={{
                  fontFamily: element.props?.fontFamily as string,
                  fontSize: element.props?.fontSize as string,
                  fontWeight: element.props?.fontWeight as UnifiedToolbarStyles['fontWeight'],
                  fontStyle: element.props?.fontStyle as UnifiedToolbarStyles['fontStyle'],
                  textDecoration: element.props?.textDecoration as UnifiedToolbarStyles['textDecoration'],
                  textAlign: element.props?.textAlign as 'left' | 'center' | 'right',
                  textColor: element.props?.textColor as string,
                  textOpacity: element.props?.textOpacity as number,
                  textFillType: element.props?.textFillType as 'solid' | 'gradient',
                  textGradient: element.props?.textGradient as GradientValue,
                  textShadow: element.props?.textShadow as string,
                  backgroundColor: element.styles?.backgroundColor as string,
                  backgroundOpacity: element.props?.backgroundOpacity as number,
                  fillType: element.props?.fillType as 'solid' | 'gradient' | 'none',
                  gradient: element.props?.gradient as GradientValue,
                }}
                onStyleChange={(newStyles) => {
                  const propUpdates: Record<string, string | boolean | object | number | undefined> = {};
                  const styleUpdates: Record<string, string | undefined> = {};
                  
                  // Typography and text styling go to props
                  if (newStyles.fontFamily !== undefined) propUpdates.fontFamily = newStyles.fontFamily;
                  if (newStyles.fontSize !== undefined) propUpdates.fontSize = newStyles.fontSize;
                  if (newStyles.fontWeight !== undefined) propUpdates.fontWeight = newStyles.fontWeight;
                  if (newStyles.fontStyle !== undefined) propUpdates.fontStyle = newStyles.fontStyle;
                  if (newStyles.textDecoration !== undefined) propUpdates.textDecoration = newStyles.textDecoration;
                  if (newStyles.textColor !== undefined) propUpdates.textColor = newStyles.textColor;
                  if (newStyles.textFillType !== undefined) propUpdates.textFillType = newStyles.textFillType;
                  if (newStyles.textGradient !== undefined) propUpdates.textGradient = newStyles.textGradient;
                  if (newStyles.textShadow !== undefined) propUpdates.textShadow = newStyles.textShadow;
                  if (newStyles.textOpacity !== undefined) propUpdates.textOpacity = newStyles.textOpacity;
                  
                  // Background styling
                  if (newStyles.backgroundColor !== undefined) styleUpdates.backgroundColor = newStyles.backgroundColor;
                  if (newStyles.fillType !== undefined) propUpdates.fillType = newStyles.fillType;
                  if (newStyles.gradient !== undefined) propUpdates.gradient = newStyles.gradient;
                  if (newStyles.backgroundOpacity !== undefined) propUpdates.backgroundOpacity = newStyles.backgroundOpacity;
                  
                  const updates: Partial<Element> = {};
                  if (Object.keys(propUpdates).length > 0) updates.props = propUpdates;
                  if (Object.keys(styleUpdates).length > 0) updates.styles = styleUpdates as Record<string, string>;
                  if (Object.keys(updates).length > 0) onUpdate?.(updates);
                }}
                onAlignChange={(align) => onUpdate?.({ props: { textAlign: align } })}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                hidden={isInlineEditing}
              />
            )}
            {/* Element drag handle is now integrated into UnifiedElementToolbar */}
            {textLinkUrl ? (
              <a 
                href={textLinkUrl} 
                target={textLinkNewTab ? '_blank' : undefined}
                rel={textLinkNewTab ? 'noopener noreferrer' : undefined}
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
              >
                {textContent}
              </a>
            ) : (
              textContent
            )}
          </div>
        );

      case 'button':
        const buttonVariant = element.props?.variant as string;
        const isNavPill = buttonVariant === 'nav-pill';
        const isFooterLink = buttonVariant === 'footer-link';
        const isGhostButton = buttonVariant === 'ghost' || buttonVariant === 'link';
        
        const hoverBg = element.props?.hoverBg as string;
        const hoverScale = element.props?.hoverScale as string;
        const transitionDuration = element.props?.transitionDuration as string || '200';
        const buttonSize = element.props?.buttonSize as string || (isNavPill || isFooterLink ? 'sm' : 'md');
        const buttonSizeClasses: Record<string, string> = {
          sm: 'px-4 py-2 text-sm',
          md: 'px-6 py-3 text-base',
          lg: 'px-8 py-4 text-lg',
          xl: 'px-10 py-5 text-xl'
        };
        const buttonFontWeight = element.props?.fontWeight as string || (isNavPill ? 'medium' : isFooterLink ? 'normal' : 'semibold');
        const buttonWeightClass: Record<string, string> = {
          normal: 'font-normal',
          medium: 'font-medium',
          semibold: 'font-semibold',
          bold: 'font-bold'
        };
        
        // Determine button background - gradient takes precedence
        // Phase 4: Buttons default to neutral/outline unless explicitly customized
        // No more forced primaryColor injection - buttons start clean
        const isGradient = element.props?.fillType === 'gradient';
        const elementBg = element.styles?.backgroundColor?.trim();
        const hasExplicitFill = element.props?.fillType === 'solid' || (elementBg && elementBg !== '' && elementBg !== 'transparent');
        
        // Determine button style mode
        const isOutlineMode = element.props?.buttonStyle === 'outline' || (!hasExplicitFill && !isGradient);
        
        // Special styling for nav-pill and footer-link variants
        let buttonBg: string | undefined;
        if (isNavPill) {
          buttonBg = isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
        } else if (isFooterLink || isGhostButton) {
          buttonBg = 'transparent';
        } else if (isGradient) {
          buttonBg = undefined;
        } else if (isOutlineMode) {
          // Phase 4: Default to transparent/outline when no fill customized
          buttonBg = 'transparent';
        } else if (elementBg) {
          // Custom color set by user - keep it
          buttonBg = elementBg;
        } else {
          // Fallback for explicitly solid but no color set - use theme primary
          buttonBg = primaryColor;
        }
        
        // Compute gradient CSS from props.gradient object (not from styles.background)
        const buttonGradientValue = element.props?.gradient as GradientValue | undefined;
        const buttonGradient = isGradient && buttonGradientValue
          ? gradientToCSS(buttonGradientValue)
          : undefined; // No default gradient - user must set one
        
        // Determine wrapper styles for alignment using textAlign
        // Default to center alignment for better UX
        const buttonAlignment = (element.styles?.textAlign as 'left' | 'center' | 'right' | undefined) || 'center';
        // BUG FIX #7: Handle absolute positioning - wrapper adapts based on position mode
        const isAbsolutePosition = element.styles?.position === 'absolute';
        
        // SINGLE SURFACE FIX: Wrapper is for LAYOUT ONLY - strip ALL visual styles
        // Only keep margin/layout properties, NOT background/gradient/border/shadow
        const wrapperStyle: React.CSSProperties = isAbsolutePosition ? {
          // Absolute positioning mode - free movement
          position: 'absolute',
          top: element.styles?.top || undefined,
          left: element.styles?.left || undefined,
          right: element.styles?.right || undefined,
          bottom: element.styles?.bottom || undefined,
          zIndex: element.styles?.zIndex || 10,
          // CRITICAL: Explicitly NO background on wrapper
          backgroundColor: 'transparent',
          background: 'none',
        } : {
          // Normal flow mode - layout properties only
          margin: style.margin,
          marginTop: style.marginTop,
          marginRight: style.marginRight,
          marginBottom: style.marginBottom,
          marginLeft: style.marginLeft,
          // Use flexbox for reliable alignment
          display: 'flex',
          width: isNavPill || isFooterLink ? 'auto' : '100%',
          justifyContent: buttonAlignment === 'center' ? 'center' : 
                          buttonAlignment === 'right' ? 'flex-end' : 'flex-start',
          // CRITICAL: Explicitly NO background on wrapper - button is the ONLY visual surface
          backgroundColor: 'transparent',
          background: 'none',
        };
        
        // ISSUE 4 FIX: Compute effective background for contrast - gradient-aware
        const effectiveBgForContrast = (() => {
          if (isOutlineMode) return isDarkTheme ? '#1f2937' : '#ffffff';
          // For gradients, use the first stop color for contrast calculation
          if (isGradient && buttonGradientValue?.stops?.length) {
            return buttonGradientValue.stops[0].color;
          }
          return buttonBg || primaryColor;
        })();
        
        const buttonShadowStyle = getButtonShadowStyle();
        // Outline buttons get no shadow; filled buttons get shadow
        const defaultShadow = (isNavPill || isFooterLink || isGhostButton || isOutlineMode) 
          ? 'none' 
          : (isDarkTheme ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.2)');

        // UNIFIED WIDTH: fullWidth (boolean) or customWidth (number px)
        // - Full Width = 100%
        // - Custom Width = Npx
        // - Auto Width = fit-content
        const isFullWidth = element.props?.fullWidth === true;
        const customWidth = element.props?.customWidth as number | undefined;
        const buttonWidth = isFullWidth ? '100%' : customWidth ? `${customWidth}px` : 'fit-content';
        
        // ISSUE 4 FIX: Text color with gradient-aware contrast
        const buttonTextColor = (() => {
          // User-specified color always takes precedence
          const userTextColor = element.props?.textColor as string | undefined;
          if (userTextColor) return userTextColor;
          // Special variants
          if (isNavPill) return isDarkTheme ? '#ffffff' : '#1f2937';
          if (isFooterLink) return isDarkTheme ? '#9ca3af' : '#6b7280';
          // Outline mode default
          if (isOutlineMode) return isDarkTheme ? '#ffffff' : '#18181b';
          // Gradient or solid - compute contrast
          return getContrastTextColor(effectiveBgForContrast);
        })();
        
        // Border for outline mode - ISSUE 1 FIX: Allow explicit '0' or '0px' values
        const outlineBorderColor = isDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
        const userBorderWidth = element.styles?.borderWidth as string | undefined;
        const userBorderColor = element.styles?.borderColor as string | undefined;
        const hasExplicitBorderWidth = userBorderWidth !== undefined && userBorderWidth !== '';
        
        // ISSUE 2 FIX: Shadow logic - respect explicit 'none' vs undefined
        const shadowProp = element.props?.shadow as string | undefined;
        const hasExplicitShadow = shadowProp !== undefined; // User has set a value
        const effectiveShadow = hasExplicitShadow
          ? (shadowProp === 'none' ? 'none' : (buttonShadowStyle.boxShadow || 'none'))
          : ((isOutlineMode || isNavPill || isFooterLink || isGhostButton) ? 'none' : defaultShadow);
        
        // SINGLE VISUAL SURFACE RULE:
        // - Outline mode: transparent bg + border, optional shadow if set
        // - Solid/Gradient mode: filled bg, optional border, optional shadow
        const customButtonStyle: React.CSSProperties = {
          backgroundColor: isGradient ? undefined : buttonBg,
          background: buttonGradient,
          color: buttonTextColor,
          // Width is controlled by the button element itself (unified: fullWidth or customWidth)
          width: buttonWidth,
          // ISSUE 2 FIX: Shadows respect explicit 'none' setting
          boxShadow: effectiveShadow,
          // ISSUE 1 FIX: Respect user border settings including explicit '0' or '0px'
          borderWidth: hasExplicitBorderWidth 
            ? userBorderWidth  // User value takes precedence (including '0px')
            : (isOutlineMode ? '2px' : (isNavPill ? '1px' : '0')),
          borderColor: userBorderColor || (isOutlineMode 
            ? outlineBorderColor 
            : (isNavPill ? (isDarkTheme ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)') : 'transparent')),
          borderStyle: (hasExplicitBorderWidth || isOutlineMode || isNavPill) ? 'solid' : 'none',
          borderRadius: isNavPill ? '9999px' : (element.styles?.borderRadius || '12px'),
          transition: `transform ${transitionDuration}ms ease, box-shadow ${transitionDuration}ms ease`,
          // Apply custom dimensions (height only; width is unified above)
          height: element.styles?.height || undefined,
          padding: isNavPill ? '8px 16px' : (isFooterLink ? '4px 0' : element.styles?.padding),
        };
        
        // Only apply size class if no custom padding and not a special variant
        const useSizeClass = !element.styles?.padding && !isNavPill && !isFooterLink;
        
        // SINGLE SURFACE: Wrapper is for layout/selection ONLY - no visual styles
        // The button element is the ONLY visual surface
        const wrapperClasses = cn(
          'relative',
          // Only add editor chrome classes when NOT in readOnly mode
          !readOnly && 'builder-element-selectable builder-click-target group/element',
          // NO rounded-lg, NO background, NO border on wrapper
          stateStyleClass,
          !readOnly && isMultiSelected && !isSelected && 'builder-multi-selected',
          isDragging && 'opacity-50 z-50',
          animationKey >= 0 && effectClass
        );
        
        return (
          <div ref={combinedRef} data-element-id={element.id} style={wrapperStyle} className={wrapperClasses} {...stateHandlers}>
            {/* Inject state styles CSS */}
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {/* Visual indicator badges */}
            {renderIndicatorBadges()}
            {/* Unified Toolbar */}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="button"
                elementLabel={isNavPill ? 'Nav Link' : isFooterLink ? 'Footer Link' : 'Button'}
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                styles={{
                  textAlign: buttonAlignment,
                  backgroundColor: buttonBg || 'transparent',
                  fillType: element.props?.fillType as 'solid' | 'gradient',
                  gradient: element.props?.gradient as GradientValue,
                }}
                onStyleChange={(newStyles) => {
                  const propUpdates: Record<string, unknown> = {};
                  const styleUpdates: Record<string, string> = {};
                  if (newStyles.backgroundColor) {
                    styleUpdates.backgroundColor = newStyles.backgroundColor;
                  }
                  if (newStyles.fillType) {
                    propUpdates.fillType = newStyles.fillType;
                  }
                  if (newStyles.gradient) {
                    propUpdates.gradient = newStyles.gradient;
                  }
                  const updates: Partial<Element> = {};
                  if (Object.keys(propUpdates).length > 0) updates.props = propUpdates;
                  if (Object.keys(styleUpdates).length > 0) updates.styles = styleUpdates;
                  if (Object.keys(updates).length > 0) onUpdate?.(updates);
                }}
                onAlignChange={(align) => onUpdate?.({ styles: { textAlign: align } })}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {/* Element drag handle is now integrated into UnifiedElementToolbar */}
            <style>{(() => {
              const css: string[] = [];
              const cls = `btn-${element.id}`;
              if (isNavPill) {
                css.push(`.${cls}:hover { background-color: ${isDarkTheme ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}; }`);
              } else if (isFooterLink) {
                css.push(`.${cls}:hover { color: ${isDarkTheme ? '#ffffff' : '#1f2937'}; }`);
              } else if (hoverBg && !isGradient) {
                css.push(`.${cls}:hover { background-color: ${hoverBg}; }`);
              }
              if (hoverScale && hoverScale !== 'none') {
                css.push(`.${cls}:hover { transform: scale(${hoverScale}); }`);
              }
              return css.join('\n');
            })()}</style>
            <button
              className={cn(
                `btn-${element.id}`,
                // Only add editor chrome classes when NOT in readOnly mode
                !readOnly && 'builder-element-selectable',
                useSizeClass && buttonSizeClasses[buttonSize],
                buttonWeightClass[buttonFontWeight],
                isNavPill && 'rounded-full',
                isFooterLink && 'text-left',
                // Remove shadow-lg class - shadow is now fully controlled by inline style
                !isNavPill && !isFooterLink && "rounded-xl",
                "inline-flex items-center justify-center gap-2",
                // Only apply shadowClass if not outline mode (prevents class/style conflict)
                !isOutlineMode && shadowClass,
                // Apply selection ring to the actual button element (editor only)
                !readOnly && isSelected && 'builder-element-selected',
                // Disabled state styling - visual feedback from FlowContainer
                isButtonDisabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{
                ...customButtonStyle,
                transition: `transform ${transitionDuration}ms ease, box-shadow ${transitionDuration}ms ease, background-color ${transitionDuration}ms ease`,
              }}
              onClick={handleButtonClick}
              disabled={isButtonDisabled}
              aria-disabled={isButtonDisabled}
            >
              {element.props?.showIcon === true && element.props?.iconPosition === 'left' && renderButtonIcon()}
              <InlineTextEditor
                value={element.content || 'Get started'}
                onChange={handleContentChange}
                elementType="button"
                disabled={readOnly}
                className="text-inherit"
                elementId={element.id}
              />
              {element.props?.showIcon === true && element.props?.iconPosition !== 'left' && renderButtonIcon()}
            </button>
            {/* Blocked reason display - shown when intent was rejected */}
            {getButtonBlockedReason && (
              <p 
                className="text-xs mt-2 text-destructive/80 text-center"
                role="alert"
                aria-live="polite"
              >
                {getButtonBlockedReason}
              </p>
            )}
          </div>
        );
        
        // Helper to render button icon based on iconType prop
        function renderButtonIcon() {
          const iconType = element.props?.iconType as string || 'ArrowRight';
          const iconClass = "w-4 h-4";
          const IconComponent = getButtonIconComponent(iconType);
          return <IconComponent className={iconClass} />;
        }

      case 'input':
        const fieldKey = element.props?.fieldKey as string || element.id;
        const inputValue = isPreviewMode ? (formValues[fieldKey] || '') : '';
        
        // Get icon for input field (Perspective-style)
        const inputIconName = element.props?.icon as string;
        const InputIconComponent = getCaptureInputIcon(inputIconName);
        const hasInputIcon = InputIconComponent !== null;
        
        // Input styling props - Perspective-inspired defaults
        const inputIsGradient = element.props?.fillType === 'gradient';
        const inputBg = inputIsGradient 
          ? undefined 
          : (element.styles?.backgroundColor || (isDarkTheme ? '#1f2937' : '#f9fafb'));
        const inputGradient = inputIsGradient 
          ? (element.styles?.background as string || 'linear-gradient(135deg, #8B5CF6, #D946EF)')
          : undefined;
        const inputTextColor = element.props?.textColor as string || (isDarkTheme ? '#ffffff' : '#1f2937');
        const inputPlaceholderColor = element.props?.placeholderColor as string || (isDarkTheme ? '#6b7280' : '#9ca3af');
        const inputBorderColor = element.styles?.borderColor || (isDarkTheme ? '#374151' : '#e5e7eb');
        const inputBorderRadius = element.styles?.borderRadius || '12px';
        const inputBorderWidth = element.styles?.borderWidth || '1px';
        const inputPadding = hasInputIcon ? '14px 16px 14px 44px' : (element.styles?.padding || '14px 16px');
        const inputWidth = element.styles?.width || '100%';
        const inputMargin = element.styles?.margin || '';
        
        // Determine alignment from margin
        const inputAlign = inputMargin === '0 auto' ? 'center' : 
                          inputMargin === '0 0 0 auto' ? 'right' : 'left';
        
        const inputCustomStyle: React.CSSProperties = {
          backgroundColor: inputGradient ? undefined : inputBg,
          background: inputGradient,
          color: inputTextColor,
          borderColor: inputBorderColor,
          borderWidth: inputBorderWidth,
          borderStyle: 'solid',
          borderRadius: inputBorderRadius,
          padding: inputPadding,
          width: inputWidth,
          margin: inputMargin,
          display: 'block',
        };
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'w-full relative')} {...stateHandlers}>
            {/* Inject state styles CSS */}
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {/* Visual indicator badges */}
            {renderIndicatorBadges()}
            {/* Unified Toolbar */}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="input"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                styles={{
                  textAlign: inputAlign as 'left' | 'center' | 'right',
                  backgroundColor: inputBg as string,
                }}
                onStyleChange={(newStyles) => {
                  if (newStyles.backgroundColor) {
                    onUpdate?.({ styles: { backgroundColor: newStyles.backgroundColor } });
                  }
                }}
                onAlignChange={(align) => {
                  const margin = align === 'center' ? '0 auto' : align === 'right' ? '0 0 0 auto' : '';
                  onUpdate?.({ styles: { margin, display: 'block' } });
                }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {/* Element drag handle is now integrated into UnifiedElementToolbar */}
            <div>
              {/* Dynamic CSS for placeholder, focus, and hover states */}
              <style>{`
                .input-${element.id}::placeholder {
                  color: ${inputPlaceholderColor};
                }
                .input-${element.id}:focus {
                  background-color: ${element.props?.focusBg as string || inputBg || 'transparent'};
                  border-color: ${element.props?.focusBorderColor as string || '#3b82f6'};
                  outline: none;
                  box-shadow: 0 0 0 3px ${(element.props?.focusBorderColor as string || '#3b82f6')}20;
                }
                .input-${element.id}:hover:not(:focus) {
                  background-color: ${element.props?.hoverBg as string || inputBg || 'transparent'};
                }
              `}</style>
              {/* Input with optional icon - Perspective style */}
              <div className="relative">
                {hasInputIcon && InputIconComponent && (
                  <InputIconComponent
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    size={18}
                  />
                )}
                <input
                  type={(element.props?.type as string) || 'text'}
                  placeholder={(element.props?.placeholder as string) || 'Enter text...'}
                  className={cn(`input-${element.id}`, 'w-full')}
                  style={{
                    ...inputCustomStyle,
                    transition: `all ${element.props?.transitionDuration || 200}ms ease`,
                  }}
                  readOnly={!isPreviewMode}
                  value={inputValue}
                  onChange={(e) => {
                    if (isPreviewMode) {
                      setValue(fieldKey, e.target.value);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isPreviewMode) onSelect();
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'checkbox': {
        // Get checkbox group key and value for form state
        const checkboxGroupKey = (element.props?.name as string) || (element.props?.fieldKey as string) || 'checkbox_group';
        const checkboxValue = element.content || element.id;
        const checkboxIsSelected = isChecked(checkboxGroupKey, checkboxValue);
        
        const handleCheckboxClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (isPreviewMode) {
            toggleCheckbox(checkboxGroupKey, checkboxValue);
          } else {
            onSelect();
          }
        };
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'w-full relative')} {...stateHandlers}>
            {/* Inject state styles CSS */}
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {/* Visual indicator badges */}
            {renderIndicatorBadges()}
            {/* Unified Toolbar */}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="checkbox"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {/* Element drag handle is now integrated into UnifiedElementToolbar */}
            <label 
              className={cn(
                "flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-all",
                checkboxIsSelected 
                  ? "border-primary bg-primary/10" 
                  : isDarkTheme 
                    ? "border-gray-700 hover:border-gray-600" 
                    : "border-gray-200 hover:border-gray-300"
              )} 
              onClick={handleCheckboxClick}
            >
              <div className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                checkboxIsSelected 
                  ? "border-primary bg-primary" 
                  : isDarkTheme ? "border-gray-600" : "border-gray-300"
              )}>
                <Check className={cn("w-3 h-3 transition-colors", checkboxIsSelected ? "text-white" : "text-transparent")} />
              </div>
              {isPreviewMode ? (
                <span className={isDarkTheme ? "text-gray-300" : "text-gray-700"}>{element.content || 'Option'}</span>
              ) : (
                <InlineTextEditor
                  value={element.content || 'Option'}
                  onChange={handleContentChange}
                  elementType="text"
                  placeholder="Option label..."
                  disabled={readOnly}
                  className={isDarkTheme ? "text-gray-300" : "text-gray-700"}
                  elementId={element.id}
                />
              )}
            </label>
          </div>
        );
      }

      case 'radio': {
        // Get radio group key and value for form state
        const radioGroupKey = (element.props?.name as string) || (element.props?.fieldKey as string) || 'radio_group';
        const radioValue = element.content || element.id;
        const radioIsSelected = formValues[radioGroupKey] === radioValue;
        
        const handleRadioClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (isPreviewMode) {
            setValue(radioGroupKey, radioValue);
          } else {
            onSelect();
          }
        };
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'w-full relative')} {...stateHandlers}>
            {/* Inject state styles CSS */}
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {/* Visual indicator badges */}
            {renderIndicatorBadges()}
            {/* Unified Toolbar */}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="radio"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {/* Element drag handle is now integrated into UnifiedElementToolbar */}
            <label 
              className={cn(
                "flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-all",
                radioIsSelected 
                  ? "border-primary bg-primary/10" 
                  : isDarkTheme 
                    ? "border-gray-700 hover:border-gray-600" 
                    : "border-gray-200 hover:border-gray-300"
              )} 
              onClick={handleRadioClick}
            >
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                radioIsSelected 
                  ? "border-primary" 
                  : isDarkTheme ? "border-gray-600" : "border-gray-300"
              )}>
                <Circle className={cn(
                  "w-2.5 h-2.5 transition-all",
                  radioIsSelected ? "text-primary fill-primary" : "text-transparent fill-transparent"
                )} />
              </div>
              {isPreviewMode ? (
                <span className={isDarkTheme ? "text-gray-300" : "text-gray-700"}>{element.content || 'Option'}</span>
              ) : (
                <InlineTextEditor
                  value={element.content || 'Option'}
                  onChange={handleContentChange}
                  elementType="text"
                  placeholder="Option label..."
                  disabled={readOnly}
                  className={isDarkTheme ? "text-gray-300" : "text-gray-700"}
                  elementId={element.id}
                />
              )}
            </label>
          </div>
        );
      }

      case 'select':
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'w-full relative')} {...stateHandlers}>
            {/* Inject state styles CSS */}
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {/* Visual indicator badges */}
            {renderIndicatorBadges()}
            {/* Unified Toolbar */}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="select"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {/* Element drag handle is now integrated into UnifiedElementToolbar */}
            <div onClick={(e) => { e.stopPropagation(); onSelect(); }}>
              <select
                className={cn(
                  "w-full px-5 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer",
                  isDarkTheme 
                    ? "border-gray-700 text-white bg-gray-800" 
                    : "border-gray-200 text-gray-900 bg-white"
                )}
                disabled
              >
                <option>{(element.props?.placeholder as string) || 'Select an option...'}</option>
              </select>
            </div>
          </div>
        );

      // ===============================================
      // SOCIAL PROOF - Perspective-style avatars + stars + rating
      // ===============================================
      case 'social-proof': {
        const avatarCount = (element.props?.avatarCount as number) || 4;
        const avatarSize = (element.props?.avatarSize as number) || 48;
        const avatarOverlap = (element.props?.avatarOverlap as number) || 12;
        const showStars = element.props?.showStars !== false;
        const starCount = (element.props?.starCount as number) || 5;
        const starSize = (element.props?.starSize as number) || 24;
        const starColor = (element.props?.starColor as string) || '#FBBF24';
        const rating = (element.props?.rating as number) || 5.0;
        const ratingText = (element.props?.ratingText as string) || 'from 200+ reviews';
        const ratingColor = (element.props?.ratingColor as string) || '#111827';
        const subtextColor = (element.props?.subtextColor as string) || '#6B7280';
        const alignment = (element.props?.alignment as string) || 'center';
        const gap = (element.props?.gap as number) || 12;
        
        // Generate avatar placeholders with colors
        const avatarColors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="social-proof"
                elementLabel="Social Proof"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            <div 
              className={cn(
                'flex flex-col items-center w-full font-sans',
                alignment === 'left' && 'items-start',
                alignment === 'right' && 'items-end'
              )}
              style={{ gap: `${gap}px`, padding: element.props?.padding as string || '24px' }}
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              {/* Avatar group */}
              <div className="flex items-center">
                {Array.from({ length: avatarCount }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full border-2 border-white flex items-center justify-center text-white font-medium"
                    style={{
                      width: avatarSize,
                      height: avatarSize,
                      backgroundColor: avatarColors[i % avatarColors.length],
                      marginLeft: i > 0 ? -avatarOverlap : 0,
                      fontSize: avatarSize * 0.4,
                      zIndex: avatarCount - i,
                    }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              
              {/* Star rating */}
              {showStars && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: starCount }).map((_, i) => (
                    <svg
                      key={i}
                      viewBox="0 0 24 24"
                      fill={starColor}
                      style={{ width: starSize, height: starSize }}
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              )}
              
              {/* Rating text */}
              <div className="flex items-center gap-2 font-sans">
                <span style={{ color: ratingColor, fontWeight: 600 }}>{rating.toFixed(1)}</span>
                <span style={{ color: subtextColor }}>{ratingText}</span>
              </div>
            </div>
          </div>
        );
      }

      // ===============================================
      // FEATURE LIST - Perspective-style emoji icon list
      // ===============================================
      case 'feature-list': {
        const items = (element.props?.items as Array<{
          id: string;
          icon: string;
          title: string;
          description?: string;
        }>) || [];
        const layout = (element.props?.layout as string) || 'vertical';
        const listGap = (element.props?.gap as number) || 20;
        const iconSize = (element.props?.iconSize as number) || 32;
        const titleColor = (element.props?.titleColor as string) || '#111827';
        const descriptionColor = (element.props?.descriptionColor as string) || '#6B7280';
        const titleFontWeight = (element.props?.titleFontWeight as string) || '600';
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="feature-list"
                elementLabel="Feature List"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            <div 
              className={cn(
                'w-full font-sans',
                layout === 'vertical' ? 'flex flex-col' : 'grid grid-cols-2'
              )}
              style={{ 
                gap: `${listGap}px`,
                padding: element.props?.padding as string || '16px 0',
              }}
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              {items.length > 0 ? items.map((item) => (
                <div key={item.id} className="flex items-start gap-4">
                  <span style={{ fontSize: iconSize }} className="flex-shrink-0">
                    {item.icon}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span style={{ color: titleColor, fontWeight: titleFontWeight }}>
                      {item.title}
                    </span>
                    {item.description && (
                      <span style={{ color: descriptionColor }}>
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No features configured
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'image':
        const imgSrc = element.props?.src as string;
        const isLogoImage = element.props?.isLogo === true;
        // For logos, default to auto width to preserve aspect ratio; for regular images, default to 100%
        const defaultImageWidth = isLogoImage ? 'auto' : '100%';
        const imageStyles: React.CSSProperties = {
          width: element.styles?.width || defaultImageWidth,
          height: element.styles?.height || 'auto',
          maxWidth: element.styles?.maxWidth !== undefined ? element.styles.maxWidth : (isLogoImage ? '180px' : 'none'),
          borderRadius: element.styles?.borderRadius || '0px',
          objectFit: (element.props?.objectFit as React.CSSProperties['objectFit']) || 'cover',
        };
        const imageWrapperStyles: React.CSSProperties = {
          ...style,
          display: element.styles?.display || 'block',
          margin: element.styles?.margin || undefined,
          width: element.styles?.margin === '0 auto' || element.styles?.margin === '0 0 0 auto' ? 'fit-content' : undefined,
        };
        
        // Drag-and-drop image upload handlers
        const handleImageDragOver = (e: React.DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
        };
        
        const handleImageDrop = (e: React.DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const base64 = event.target?.result as string;
                onUpdate?.({ props: { ...element.props, src: base64 } });
              };
              reader.readAsDataURL(file);
            }
          }
        };
        
        return (
          <div 
            ref={combinedRef} 
            style={imageWrapperStyles} 
            className={cn(baseClasses, 'relative')}
            onDragOver={handleImageDragOver}
            onDrop={handleImageDrop}
            {...stateHandlers}
          >
            {/* Inject state styles CSS */}
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {/* Visual indicator badges */}
            {renderIndicatorBadges()}
            {/* Unified Toolbar */}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="image"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {/* Element drag handle integrated into toolbar */}
            {imgSrc ? (
              <img 
                src={imgSrc} 
                alt={(element.props?.alt as string) || ''} 
                style={imageStyles}
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                {...hoverHandlers}
              />
            ) : (
              <div 
                className={cn(
                  "rounded-xl flex flex-col items-center justify-center border-2 border-dashed transition-colors cursor-pointer",
                  // Only apply aspect ratio if no custom height is set
                  !element.styles?.height && (isLogoImage ? "aspect-[3/1]" : "aspect-video"),
                  isDarkTheme ? "bg-gray-800 border-gray-600 hover:border-gray-500" : "bg-gray-100 border-gray-300 hover:border-gray-400"
                )}
                style={{ 
                  width: element.styles?.width || (isLogoImage ? '120px' : '100%'),
                  height: element.styles?.height || 'auto',
                  maxWidth: element.styles?.maxWidth || (isLogoImage ? '180px' : 'none'),
                }}
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
              >
                <Image className={cn(
                  isLogoImage ? "w-6 h-6 mb-1" : "w-10 h-10 mb-2", 
                  isDarkTheme ? "text-gray-600" : "text-gray-300"
                )} />
                <span className={cn("text-xs text-center", isDarkTheme ? "text-gray-500" : "text-gray-400")}>
                  {(element.props?.placeholder as string) || (isLogoImage ? 'Drop logo' : 'Drop image')}
                </span>
              </div>
            )}
          </div>
        );

      case 'video': {
        // UNIFIED VIDEO ELEMENT: handles both embed and thumbnail modes
        // video-thumbnail is deprecated - use displayMode: 'thumbnail' instead
        const videoSettings = element.props?.videoSettings as { url?: string; platform?: string; autoplay?: boolean; muted?: boolean; loop?: boolean } | undefined;
        const videoUrl = videoSettings?.url || (element.props?.videoUrl as string);
        const videoPlatform = videoSettings?.platform || 'youtube';
        const thumbnailUrl = element.props?.thumbnailUrl as string;
        
        // Display mode: 'embed' shows iframe, 'thumbnail' shows clickable thumbnail
        // Auto-detect: if displayMode is set, use it; otherwise if URL exists, use embed
        const displayMode = (element.props?.displayMode as 'embed' | 'thumbnail') || 
          (videoUrl ? 'embed' : 'thumbnail');
        
        // Thumbnail styling
        const overlayStyle = (element.props?.overlayStyle as string) || 'gradient';
        const showPlayButton = element.props?.showPlayButton !== false;
        const playButtonStyle = (element.props?.playButtonStyle as string) || 'rounded';
        const playButtonStyleMap: Record<string, string> = {
          rounded: 'rounded-full bg-white/90',
          square: 'rounded-lg bg-white/90',
          minimal: 'bg-transparent border-2 border-white',
        };
        
        const videoContainerStyles: React.CSSProperties = {
          width: element.styles?.width || '100%',
          height: element.styles?.height || 'auto',
          aspectRatio: element.styles?.aspectRatio || '16/9',
          borderRadius: element.styles?.borderRadius || '12px',
          overflow: 'hidden',
        };
        const videoWrapperStyles: React.CSSProperties = {
          ...style,
          display: element.styles?.display || 'block',
          margin: element.styles?.margin || undefined,
          width: element.styles?.margin === '0 auto' || element.styles?.margin === '0 0 0 auto' ? 'fit-content' : undefined,
        };
        
        // Render based on display mode
        if (displayMode === 'thumbnail' || !videoUrl) {
          // THUMBNAIL MODE - shows thumbnail with play button overlay
          return (
            <div ref={combinedRef} style={videoWrapperStyles} className={cn(baseClasses, 'relative')} {...stateHandlers}>
              {stateStylesCSS && <style>{stateStylesCSS}</style>}
              {renderIndicatorBadges()}
              {!readOnly && (
                <UnifiedElementToolbar
                  elementId={element.id}
                  elementType="video"
                  elementLabel="Video"
                  isSelected={isSelected}
                  targetRef={wrapperRef}
                  deviceMode={deviceMode}
                  dragHandleProps={{ attributes, listeners }}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                />
              )}
              <div 
                className={cn(
                  "relative rounded-2xl overflow-hidden aspect-video cursor-pointer",
                  isDarkTheme ? "bg-white/5" : "bg-gray-100"
                )}
                style={{ minHeight: '200px', ...videoContainerStyles }}
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
              >
                {thumbnailUrl ? (
                  <img 
                    src={thumbnailUrl} 
                    alt="Video thumbnail"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className={cn(
                    "absolute inset-0 flex items-center justify-center",
                    isDarkTheme ? "bg-gradient-to-br from-white/10 to-white/5" : "bg-gradient-to-br from-gray-100 to-gray-200"
                  )}>
                    <Video className={cn("w-12 h-12", isDarkTheme ? "text-white/30" : "text-gray-400")} />
                  </div>
                )}
                {/* Overlay */}
                <div className={cn(
                  "video-thumbnail-overlay",
                  overlayStyle === 'gradient' && "bg-gradient-to-b from-transparent to-black/50"
                )}>
                  {showPlayButton && (
                    <div className={cn(
                      "w-16 h-16 flex items-center justify-center backdrop-blur-sm",
                      playButtonStyleMap[playButtonStyle] || playButtonStyleMap.rounded
                    )}>
                      <Play className={cn("w-8 h-8 ml-1", playButtonStyle === 'minimal' ? 'text-white' : 'text-gray-900')} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        } else {
          // EMBED MODE - shows iframe directly
          return (
            <div ref={combinedRef} style={videoWrapperStyles} className={cn(baseClasses, 'relative')} {...stateHandlers}>
              {stateStylesCSS && <style>{stateStylesCSS}</style>}
              {renderIndicatorBadges()}
              {!readOnly && (
                <UnifiedElementToolbar
                  elementId={element.id}
                  elementType="video"
                  elementLabel="Video"
                  isSelected={isSelected}
                  targetRef={wrapperRef}
                  deviceMode={deviceMode}
                  dragHandleProps={{ attributes, listeners }}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                />
              )}
              <div style={videoContainerStyles} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
                <iframe
                  src={getEmbedUrl(videoUrl, videoPlatform, {
                    autoplay: videoSettings?.autoplay,
                    muted: videoSettings?.muted,
                    loop: videoSettings?.loop,
                  })}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          );
        }
      }

      case 'divider': {
        const dividerColor = element.styles?.borderColor || (isDarkTheme ? '#374151' : '#e5e7eb');
        const dividerHeight = element.styles?.height || '1px';
        const dividerWidth = (element.props?.dividerWidth as string) || '100%';
        const dividerStyle = (element.props?.dividerStyle as string) || 'solid';
        const dividerAlign = (element.props?.dividerAlign as string) || 'center';
        
        // Compute alignment classes
        const alignClass = dividerAlign === 'left' ? 'mr-auto' : dividerAlign === 'right' ? 'ml-auto' : 'mx-auto';
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'w-full relative')} {...stateHandlers}>
            {/* Inject state styles CSS */}
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {/* Visual indicator badges */}
            {renderIndicatorBadges()}
            {/* Unified Toolbar */}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="divider"
                elementLabel="Divider"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                styles={{ backgroundColor: dividerColor }}
                onStyleChange={(newStyles) => {
                  if (newStyles.backgroundColor) {
                    onUpdate?.({ styles: { borderColor: newStyles.backgroundColor } });
                  }
                }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {/* Element drag handle integrated into toolbar */}
            <div className="w-full py-4" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
              <div 
                className={alignClass}
                style={{ 
                  backgroundColor: dividerStyle === 'solid' ? dividerColor : undefined,
                  borderTop: dividerStyle !== 'solid' ? `${dividerHeight} ${dividerStyle} ${dividerColor}` : undefined,
                  height: dividerStyle === 'solid' ? dividerHeight : 0,
                  width: dividerWidth,
                }}
              />
            </div>
          </div>
        );
      }

      case 'spacer':
        const spacerHeight = element.styles?.height || '48px';
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'w-full relative')} {...stateHandlers}>
            {/* Inject state styles CSS */}
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {/* Visual indicator badges */}
            {renderIndicatorBadges()}
            {/* Unified Toolbar */}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="spacer"
                elementLabel="Spacer"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {/* Element drag handle integrated into toolbar */}
            <div 
              className="w-full flex items-center justify-center border-2 border-dashed rounded-lg transition-colors"
              style={{ 
                height: spacerHeight,
                borderColor: isDarkTheme ? '#374151' : '#e5e7eb',
              }}
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              <Minus className={cn("w-4 h-4", isDarkTheme ? "text-gray-600" : "text-gray-300")} />
            </div>
          </div>
        );

      // FAQ Accordion element - proper rendering with expand/collapse
      case 'faq': {
        const faqItems = (element.props?.items as Array<{ question: string; answer: string }>) || [];
        const [openIndex, setOpenIndex] = useState<number | null>(0);
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'w-full relative')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="faq"
                elementLabel="FAQ"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            <div 
              className="w-full space-y-2 px-4 py-3"
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              {faqItems.length > 0 ? faqItems.map((item, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "rounded-lg border transition-all",
                    isDarkTheme 
                      ? "border-gray-700 bg-gray-800/50" 
                      : "border-gray-200 bg-gray-50"
                  )}
                >
                  <button
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 text-left font-medium transition-colors",
                      isDarkTheme ? "text-white hover:bg-gray-700/50" : "text-gray-900 hover:bg-gray-100"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!readOnly) {
                        setOpenIndex(openIndex === index ? null : index);
                      }
                    }}
                  >
                    <span>{item.question}</span>
                    <svg 
                      className={cn(
                        "w-5 h-5 transition-transform",
                        openIndex === index && "rotate-180"
                      )} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openIndex === index && (
                    <div className={cn(
                      "px-4 pb-4 text-sm leading-relaxed",
                      isDarkTheme ? "text-gray-300" : "text-gray-600"
                    )}>
                      {item.answer}
                    </div>
                  )}
                </div>
              )) : (
                <div className={cn(
                  "text-sm text-center py-4",
                  isDarkTheme ? "text-gray-500" : "text-gray-400"
                )}>
                  Add FAQ items in the inspector
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'icon':
        const iconName = element.content || 'star';
        const iconSize = element.styles?.fontSize || '24px';
        const iconColor = element.props?.color as string || (isDarkTheme ? '#9ca3af' : '#6b7280');
        const iconFillType = (element.props?.fillType as string) || 'solid';
        const iconGradient = element.props?.gradient as GradientValue;
        
        // BUG FIX #6: Icon gradient using CSS mask technique (works on SVGs)
        // WebkitBackgroundClip: 'text' doesn't work on SVG icons, use mask instead
        const iconStyle: React.CSSProperties = iconFillType === 'gradient' && iconGradient ? {
          width: iconSize,
          height: iconSize,
          background: gradientToCSS(iconGradient),
          // Use mask to make gradient visible through SVG shape
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          display: 'inline-block',
        } : {
          width: iconSize,
          height: iconSize,
          color: iconColor,
        };
        
        // For gradient icons, we need to render differently
        const isGradientIcon = iconFillType === 'gradient' && iconGradient;
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {/* Inject state styles CSS */}
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {/* Visual indicator badges */}
            {renderIndicatorBadges()}
            {/* Unified Toolbar */}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="icon"
                elementLabel="Icon"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                styles={{ textColor: iconColor }}
                onStyleChange={(newStyles) => {
                  if (newStyles.textColor) {
                    onUpdate?.({ props: { color: newStyles.textColor } });
                  }
                }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {/* Element drag handle integrated into toolbar */}
            <div 
              className="p-2 flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              {(() => {
                const IconComponent = getButtonIconComponent(element.content || 'Star');
                // BUG FIX #6: For gradient icons, wrap in a div with mask
                if (isGradientIcon) {
                  // Create unique gradient ID for this element
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
                      <IconComponent 
                        style={{ 
                          width: 24, 
                          height: 24,
                          fill: `url(#${gradientId})`,
                          stroke: `url(#${gradientId})`,
                        }} 
                      />
                    </svg>
                  );
                }
                return <IconComponent style={iconStyle} />;
              })()}
            </div>
          </div>
        );

      // ============================================
      // PREMIUM ELEMENT TYPES
      // ============================================
      
      case 'gradient-text':
        // Handle both array format and GradientValue object format
        const gradientProp = element.props?.gradient;
        let gradientCSS: string;
        
        if (Array.isArray(gradientProp)) {
          // Legacy array format: ['#8B5CF6', '#EC4899']
          const gradientAngle = (element.props?.gradientAngle as number) || 135;
          gradientCSS = `linear-gradient(${gradientAngle}deg, ${gradientProp.join(', ')})`;
        } else if (gradientProp && typeof gradientProp === 'object' && 'stops' in gradientProp) {
          // New GradientValue object format
          const gv = gradientProp as { type: string; angle: number; stops: Array<{ color: string; position: number }> };
          const stopsStr = gv.stops.sort((a, b) => a.position - b.position).map(s => `${s.color} ${s.position}%`).join(', ');
          gradientCSS = gv.type === 'radial' 
            ? `radial-gradient(circle, ${stopsStr})`
            : `linear-gradient(${gv.angle}deg, ${stopsStr})`;
        } else {
          // Default fallback
          const gradientAngle = (element.props?.gradientAngle as number) || 135;
          gradientCSS = `linear-gradient(${gradientAngle}deg, #8B5CF6, #EC4899)`;
        }
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="gradient-text"
                elementLabel="Gradient Text"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {(() => {
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
                <div 
                  style={{ textAlign: gradientTextAlign as 'left' | 'center' | 'right', width: '100%' }}
                  onClick={(e) => { e.stopPropagation(); onSelect(); }}
                >
                  <InlineTextEditor
                    value={element.content || 'Gradient Text'}
                    onChange={handleContentChange}
                    elementType="heading"
                    placeholder="Gradient text..."
                    disabled={readOnly}
                    elementId={element.id}
                    style={{ 
                      backgroundImage: gradientCSS,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontSize: fontSizeMap[gradientFontSize] || '2.25rem',
                      fontWeight: fontWeightMap[gradientFontWeight] || 700,
                      ...getTypographyStyles()
                    }}
                  />
                </div>
              );
            })()}
          </div>
        );
      
      case 'stat-number':
        // Use stripHtmlToText to ensure clean display values (prevent HTML leakage)
        const statSuffix = stripHtmlToText((element.props?.suffix as string) || '+');
        const statLabel = stripHtmlToText((element.props?.label as string) || '');
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="stat-number"
                elementLabel="Stat Number"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            <div 
              className="text-center stat-item"
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              {(() => {
                // Color/gradient settings
                const numberColorType = (element.props?.numberColorType as string) || 'solid';
                const numberColor = (element.props?.numberColor as string) || (isDarkTheme ? '#ffffff' : '#111827');
                const numberGradient = element.props?.numberGradient as GradientValue | undefined;
                
                const suffixColorType = (element.props?.suffixColorType as string) || 'solid';
                const suffixColor = (element.props?.suffixColor as string) || primaryColor;
                const suffixGradient = element.props?.suffixGradient as GradientValue | undefined;
                
                const labelColorType = (element.props?.labelColorType as string) || 'solid';
                const labelColor = (element.props?.labelColor as string) || (isDarkTheme ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)');
                const labelGradient = element.props?.labelGradient as GradientValue | undefined;
                
                const statSize = (element.props?.size as string) || 'xl';
                const statFontWeight = (element.props?.fontWeight as string) || 'bold';
                const statSizeMap: Record<string, string> = {
                  'lg': '1.875rem', 'xl': '3rem', '2xl': '3.75rem', '3xl': '4.5rem'
                };
                const statWeightMap: Record<string, number> = {
                  normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800
                };
                
                // Helper function for text gradient styles
                const getTextStyle = (colorType: string, solidColor: string, gradient?: GradientValue): React.CSSProperties => {
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
                  return { color: solidColor };
                };
                
                const suffixStyle = getTextStyle(suffixColorType, suffixColor, suffixGradient);
                
                return (
                  <>
                    <div 
                      className="stat-number stat-number-animate tracking-tight inline-flex items-baseline"
                      style={{ 
                        fontSize: statSizeMap[statSize] || '3rem',
                        fontWeight: statWeightMap[statFontWeight] || 700,
                      }}
                    >
                      <InlineTextEditor
                        key={`${element.id}-number`}
                        value={element.content || '0'}
                        onChange={(newContent: string) => onUpdate?.({ content: newContent })}
                        onStyleChange={(inlineStyles) => {
                          // Bidirectional sync: toolbar changes update element props → inspector updates
                          // CRITICAL: Do NOT spread element.props here - it creates stale closures
                          // Only send minimal updates; onUpdate merges at source of truth
                          const updates: Record<string, unknown> = {};
                          if (inlineStyles.textFillType !== undefined) updates.numberColorType = inlineStyles.textFillType;
                          if (inlineStyles.textColor !== undefined) updates.numberColor = inlineStyles.textColor;
                          if (inlineStyles.textGradient !== undefined) updates.numberGradient = inlineStyles.textGradient;
                          if (Object.keys(updates).length > 0) {
                            onUpdate?.({ props: updates });
                          }
                        }}
                        elementType="text"
                        placeholder="0"
                        disabled={readOnly}
                        elementId={`${element.id}-number`}
                        initialStyles={{
                          textFillType: (numberColorType as 'solid' | 'gradient') || 'solid',
                          textColor: numberColor,
                          textGradient: numberGradient,
                        }}
                        style={{ display: 'inline' }}
                        className="inline"
                      />
                      <InlineTextEditor
                        key={`${element.id}-suffix`}
                        value={statSuffix}
                        onChange={(newContent: string) => onUpdate?.({ props: { suffix: newContent } })}
                        onStyleChange={(inlineStyles) => {
                          // Bidirectional sync: toolbar changes update element props → inspector updates
                          // CRITICAL: Do NOT spread element.props here - it creates stale closures
                          const updates: Record<string, unknown> = {};
                          if (inlineStyles.textFillType !== undefined) updates.suffixColorType = inlineStyles.textFillType;
                          if (inlineStyles.textColor !== undefined) updates.suffixColor = inlineStyles.textColor;
                          if (inlineStyles.textGradient !== undefined) updates.suffixGradient = inlineStyles.textGradient;
                          if (Object.keys(updates).length > 0) {
                            onUpdate?.({ props: updates });
                          }
                        }}
                        elementType="text"
                        placeholder="+"
                        disabled={readOnly}
                        elementId={`${element.id}-suffix`}
                        initialStyles={{
                          textFillType: (suffixColorType as 'solid' | 'gradient') || 'solid',
                          textColor: suffixColor,
                          textGradient: suffixGradient,
                        }}
                        style={{ display: 'inline' }}
                        className="inline"
                      />
                    </div>
                    {statLabel && (
                      <div className="text-xs uppercase tracking-wider mt-2">
                        <InlineTextEditor
                          key={`${element.id}-label`}
                          value={statLabel}
                          onChange={(newContent: string) => onUpdate?.({ props: { label: newContent } })}
                          onStyleChange={(inlineStyles) => {
                            // Bidirectional sync: toolbar changes update element props → inspector updates
                            // CRITICAL: Do NOT spread element.props here - it creates stale closures
                            const updates: Record<string, unknown> = {};
                            if (inlineStyles.textFillType !== undefined) updates.labelColorType = inlineStyles.textFillType;
                            if (inlineStyles.textColor !== undefined) updates.labelColor = inlineStyles.textColor;
                            if (inlineStyles.textGradient !== undefined) updates.labelGradient = inlineStyles.textGradient;
                            if (Object.keys(updates).length > 0) {
                              onUpdate?.({ props: updates });
                            }
                          }}
                          elementType="text"
                          placeholder="LABEL"
                          disabled={readOnly}
                          elementId={`${element.id}-label`}
                          initialStyles={{
                            textFillType: (labelColorType as 'solid' | 'gradient') || 'solid',
                            textColor: labelColor,
                            textGradient: labelGradient,
                          }}
                          style={{ display: 'inline-block' }}
                          className="inline-block"
                        />
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        );
      
      case 'avatar-group':
        const avatarCount = (element.props?.count as number) || 3;
        const avatarSize = (element.props?.size as string) || 'md';
        const avatarAlignment = (element.props?.alignment as string) || 'flex-start';
        const avatarColorMode = (element.props?.colorMode as string) || 'gradient';
        const avatarOverlap = (element.props?.overlap as number) || 12;
        
        // Rating display mode (Perspective-style)
        const showRating = element.props?.showRating as boolean;
        const ratingValue = (element.props?.rating as number) || 4.8;
        const ratingCount = (element.props?.ratingCount as number) || 148;
        const ratingSource = (element.props?.ratingSource as string) || 'reviews';
        
        // Size mapping
        const sizeMap: Record<string, { wrapper: string; icon: string }> = {
          'xs': { wrapper: 'w-6 h-6', icon: 'w-3 h-3' },
          'sm': { wrapper: 'w-8 h-8', icon: 'w-4 h-4' },
          'md': { wrapper: 'w-10 h-10', icon: 'w-5 h-5' },
          'lg': { wrapper: 'w-12 h-12', icon: 'w-6 h-6' },
          'xl': { wrapper: 'w-14 h-14', icon: 'w-7 h-7' },
          '2xl': { wrapper: 'w-18 h-18', icon: 'w-9 h-9' },
        };
        const avatarSizeClasses = sizeMap[avatarSize] || sizeMap['md'];
        
        // Alignment mapping for row-reverse
        const alignmentJustify: Record<string, string> = {
          'flex-start': 'flex-end', // left aligned in row-reverse
          'center': 'center',
          'flex-end': 'flex-start', // right aligned in row-reverse
        };
        
        // Varied colors palette
        const variedColors = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#84CC16'];
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="avatar-group"
                elementLabel={showRating ? "Rating Display" : "Avatar Group"}
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            <div 
              className={cn("flex items-center gap-3", showRating && "flex-col")}
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              {/* Avatar stack */}
              <div 
                className="avatar-group"
                style={{ 
                  '--avatar-border': isDarkTheme ? '#0a0a0f' : '#ffffff',
                  '--avatar-overlap': `-${avatarOverlap}px`,
                  justifyContent: showRating ? 'center' : (alignmentJustify[avatarAlignment] || 'flex-end'),
                } as React.CSSProperties}
              >
                {Array.from({ length: avatarCount }).map((_, i) => {
                  // Color logic based on mode
                  let avatarBg: string;
                  const baseColor = (element.props?.gradientFrom as string) || primaryColor || '#8B5CF6';
                  const endColor = (element.props?.gradientTo as string) || shiftHue(baseColor, 40);
                  
                  if (avatarColorMode === 'solid') {
                    avatarBg = (element.props?.solidColor as string) || primaryColor;
                  } else if (avatarColorMode === 'varied') {
                    avatarBg = variedColors[i % variedColors.length];
                  } else {
                    // gradient mode
                    avatarBg = `linear-gradient(${135 + i * 15}deg, ${baseColor}, ${endColor})`;
                  }
                  
                  return (
                    <div 
                      key={i}
                      className={cn(avatarSizeClasses.wrapper, 'rounded-full flex items-center justify-center shrink-0')}
                      style={{
                        background: avatarBg,
                      }}
                    >
                      <User className={cn(avatarSizeClasses.icon, 'text-white')} />
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
                  <span 
                    className="text-sm"
                    style={{ color: isDarkTheme ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                  >
                    {ratingValue} from {ratingCount} {ratingSource}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'ticker':
        const tickerItems = (element.props?.items as string[]) || ['Item 1', 'Item 2', 'Item 3'];
        const tickerSeparator = (element.props?.separator as string) || '  •  ';
        const tickerSpeed = (element.props?.speed as number) || 30;
        const tickerTextColor = (element.props?.textColor as string) || (isDarkTheme ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)');
        const tickerSeparatorColor = (element.props?.separatorColor as string) || tickerTextColor;
        const tickerBgColor = (element.props?.backgroundColor as string) || 'transparent';
        const tickerFontSize = (element.props?.fontSize as string) || 'sm';
        const tickerFontWeight = (element.props?.fontWeight as string) || 'medium';
        const tickerLetterSpacing = (element.props?.letterSpacing as number) ?? 0.05;
        const tickerDirection = (element.props?.direction as string) || 'left';
        const tickerPauseOnHover = element.props?.pauseOnHover !== false; // Default true
        const tickerFontSizeMap: Record<string, string> = { xs: '10px', sm: '12px', md: '14px', lg: '16px', xl: '18px' };
        const tickerFontWeightMap: Record<string, number> = { normal: 400, medium: 500, semibold: 600, bold: 700 };
        
        // State for pause on hover in builder
        const [tickerPaused, setTickerPaused] = useState(false);
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative w-full')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="ticker"
                elementLabel="Ticker"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {(() => {
              const tickerTextFillType = (element.props?.textFillType as string) || 'solid';
              const tickerTextGradient = element.props?.textGradient as GradientValue;
              
              const tickerTextStyle: React.CSSProperties = tickerTextFillType === 'gradient' && tickerTextGradient ? {
                background: gradientToCSS(tickerTextGradient),
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline',
              } : { color: tickerTextColor };
              
              return (
                <div 
                  className="ticker-container w-full py-3"
                  style={{ 
                    '--ticker-speed': `${tickerSpeed}s`,
                    '--ticker-direction': tickerDirection === 'right' ? 'reverse' : 'normal',
                    backgroundColor: tickerBgColor,
                  } as React.CSSProperties}
                  onClick={(e) => { e.stopPropagation(); onSelect(); }}
                  onMouseEnter={() => tickerPauseOnHover && setTickerPaused(true)}
                  onMouseLeave={() => tickerPauseOnHover && setTickerPaused(false)}
                >
                  <div 
                    className="ticker-content"
                    style={{ animationPlayState: tickerPaused ? 'paused' : 'running' }}
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
                        {item}<span style={{ color: tickerSeparatorColor }}>{tickerSeparator}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      
      case 'badge':
        const badgeVariant = (element.props?.variant as string) || 'primary';
        const badgeIcon = element.props?.icon as string;
        const badgeAlignment = (element.props?.alignment as string) || 'flex-start';
        const badgeBgType = (element.props?.bgType as string) || 'solid';
        const badgeBgColor = (element.props?.bgColor as string) || '#8B5CF6';
        const badgeBgGradient = element.props?.bgGradient as { type: string; angle: number; stops: Array<{ color: string; position: number }> } | undefined;
        const badgeTextColor = (element.props?.textColor as string) || '#ffffff';
        const badgeBorderColor = (element.props?.borderColor as string) || 'transparent';
        const badgeClasses: Record<string, string> = {
          primary: 'premium-badge-primary',
          warning: 'premium-badge-warning',
          success: 'premium-badge-success',
          premium: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black',
        };
        const useCustomBadgeColors = badgeVariant === 'custom';
        
        // Build badge background style
        const badgeBackgroundStyle: React.CSSProperties = useCustomBadgeColors ? {
          ...(badgeBgType === 'gradient' && badgeBgGradient 
            ? { background: gradientToCSS(badgeBgGradient as GradientValue) }
            : { backgroundColor: badgeBgColor }),
          color: badgeTextColor,
          borderColor: badgeBorderColor,
          borderWidth: badgeBorderColor !== 'transparent' ? '1px' : '0',
          borderStyle: 'solid',
        } : undefined;
        
        return (
          <div 
            ref={combinedRef} 
            style={{ ...style, display: 'flex', justifyContent: badgeAlignment }} 
            className={cn(baseClasses, 'relative')} 
            {...stateHandlers}
          >
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="badge"
                elementLabel="Badge"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            <span 
              className={cn(
                'premium-badge',
                !useCustomBadgeColors && (badgeClasses[badgeVariant] || badgeClasses.primary)
              )}
              style={badgeBackgroundStyle}
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              {badgeIcon && (() => {
                const IconComponent = getButtonIconComponent(badgeIcon);
                return <IconComponent className="w-3 h-3" />;
              })()}
              <InlineTextEditor
                value={element.content || 'BADGE'}
                onChange={handleContentChange}
                elementType="text"
                placeholder="BADGE"
                disabled={readOnly}
                elementId={element.id}
                className="inline uppercase"
              />
            </span>
          </div>
        );
      
      case 'process-step':
        const stepNumber = (element.props?.step as number) || 1;
        const stepIcon = element.props?.icon as string;
        const stepShape = (element.props?.shape as string) || 'rounded-square';
        const stepSize = (element.props?.size as string) || 'md';
        const stepAccentColor = (element.props?.accentColor as string) || primaryColor;
        const stepTextColor = (element.props?.textColor as string) || (isDarkTheme ? '#ffffff' : '#111827');
        const stepNumberColor = (element.props?.numberColor as string) || '#ffffff';
        const stepDescription = (element.props?.description as string);
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
        const showConnector = element.props?.showConnector !== false; // Default to true
        const connectorStyle = (element.props?.connectorStyle as string) || 'solid';
        const stepAlignment = (element.props?.alignment as string) || 'center';
        const currentStepSize = stepSizeMap[stepSize] || stepSizeMap.md;
        const accentType = (element.props?.accentType as string) || 'solid';
        const accentGradient = element.props?.accentGradient as GradientValue;
        const stepBadgeBackground = accentType === 'gradient' && accentGradient 
          ? gradientToCSS(accentGradient)
          : `linear-gradient(135deg, ${stepAccentColor}, ${stepAccentColor}80)`;
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="process-step"
                elementLabel="Process Step"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            <div 
              className="process-step-item relative"
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: stepAlignment === 'center' ? 'center' : stepAlignment === 'flex-end' ? 'flex-end' : 'flex-start',
                textAlign: stepAlignment === 'center' ? 'center' : stepAlignment === 'flex-end' ? 'right' : 'left'
              }}
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              <div 
                className={cn(
                  currentStepSize.wrapper,
                  stepShapeMap[stepShape] || 'rounded-2xl',
                  'flex items-center justify-center'
                )}
                style={{ background: stepBadgeBackground }}
              >
                {stepIcon && stepIcon !== 'number' ? (() => {
                  const IconComponent = getButtonIconComponent(stepIcon);
                  return <IconComponent className={cn(currentStepSize.icon)} style={{ color: stepNumberColor }} />;
                })() : (
                  <span className={cn(currentStepSize.text, 'font-bold')} style={{ color: stepNumberColor }}>{stepNumber}</span>
                )}
              </div>
              <div className="text-sm font-semibold uppercase tracking-wider mt-2" style={{ color: stepTextColor }}>
                <InlineTextEditor
                  value={element.content || `Step ${stepNumber}`}
                  onChange={handleContentChange}
                  elementType="text"
                  placeholder="Step title..."
                  disabled={readOnly}
                  elementId={`${element.id}-title`}
                  style={{ color: stepTextColor }}
                  className="uppercase tracking-wider"
                />
              </div>
              <div className="text-xs mt-1" style={{ color: stepTextColor, opacity: 0.7 }}>
                <InlineTextEditor
                  value={stepDescription || ''}
                  onChange={(newContent: string) => onUpdate?.({ props: { ...element.props, description: newContent } })}
                  elementType="text"
                  placeholder="Optional description..."
                  disabled={readOnly}
                  elementId={`${element.id}-desc`}
                  style={{ color: stepTextColor, opacity: 0.7 }}
                />
              </div>
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
          </div>
        );
      
      // NOTE: 'video-thumbnail' is now handled by the unified 'video' case above
      
      case 'underline-text':
        const underlineFrom = (element.props?.underlineFrom as string) || primaryColor;
        const underlineTo = (element.props?.underlineTo as string) || '#EC4899';
        const underlineTextAlign = (element.props?.textAlign as string) || 'left';
        const underlineHeight = (element.props?.underlineHeight as number) || 4;
        const underlineOffset = (element.props?.underlineOffset as number) || 2;
        return (
          <div ref={combinedRef} style={{ ...style, textAlign: underlineTextAlign as 'left' | 'center' | 'right' }} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="underline-text"
                elementLabel="Underline Text"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            <span 
              className="underline-gradient text-2xl font-bold"
              style={{ 
                '--underline-from': underlineFrom,
                '--underline-to': underlineTo,
                '--underline-height': `${underlineHeight}px`,
                '--underline-offset': `${underlineOffset}px`,
                color: isDarkTheme ? '#ffffff' : '#111827',
                ...getTypographyStyles()
              } as React.CSSProperties}
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              {element.content || 'Underlined Text'}
            </span>
          </div>
        );

      // FUNCTIONAL ELEMENT TYPES (Phase: Make Components Work)
      // ============================================
      
      case 'countdown': {
        // CountdownTimer is hoisted to module scope
        const endDate = (element.props?.endDate as string) || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const countdownStyle = (element.props?.style as 'boxes' | 'inline' | 'minimal' | 'flip') || 'boxes';
        const expiredAction = (element.props?.expiredAction as 'hide' | 'show-message' | 'redirect') || 'show-message';
        const showLabels = element.props?.showLabels !== false;
        const showDays = element.props?.showDays !== false;
        const showSeconds = element.props?.showSeconds !== false;
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="countdown"
                elementLabel="Countdown Timer"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            <div onClick={(e) => { e.stopPropagation(); onSelect(); }}>
              <React.Suspense fallback={<div className="animate-pulse h-20 bg-muted rounded-xl" />}>
                <CountdownTimer
                  endDate={endDate}
                  style={countdownStyle}
                  expiredAction={expiredAction}
                  showLabels={showLabels}
                  showDays={showDays}
                  showSeconds={showSeconds}
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
                  isBuilder={true}
                />
              </React.Suspense>
            </div>
          </div>
        );
      }

      case 'loader': {
        // LoaderAnimation is hoisted to module scope
        const animationType = (element.props?.animationType as 'spinner' | 'progress' | 'dots' | 'pulse' | 'analyzing') || 'analyzing';
        const duration = (element.props?.duration as number) || 3000;
        const loaderText = element.content || 'Analyzing your results...';
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="loader"
                elementLabel="Loader"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            <div onClick={(e) => { e.stopPropagation(); onSelect(); }}>
              <React.Suspense fallback={<div className="animate-pulse h-32 bg-muted rounded-xl" />}>
                <LoaderAnimation
                  text={loaderText}
                  subText={element.props?.subText as string}
                  animationType={animationType}
                  duration={duration}
                  showProgress={element.props?.showProgress !== false}
                  size={(element.props?.size as 'sm' | 'md' | 'lg') || 'md'}
                  showPercentage={element.props?.showPercentage !== false}
                  easing={(element.props?.easing as 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out') || 'ease-out'}
                  customSteps={element.props?.customSteps as string[] | undefined}
                  completeText={(element.props?.completeText as string) || 'Complete!'}
                  colors={{
                    primary: (element.props?.colors as { primary?: string })?.primary || element.props?.primaryColor as string || primaryColor,
                    text: (element.props?.colors as { text?: string })?.text || element.props?.color as string,
                  }}
                  autoAdvance={element.props?.autoAdvance !== false}
                  isBuilder={true}
                  onComplete={() => {
                    // In editor/builder, just log completion for debugging
                    console.log('[Builder] Loader animation complete');
                  }}
                />
              </React.Suspense>
            </div>
          </div>
        );
      }

      case 'carousel': {
        // ImageCarousel is hoisted to module scope
        const slides = (element.props?.slides as Array<{ id: string; src: string; alt?: string }>) || [];
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="carousel"
                elementLabel="Image Carousel"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            <div onClick={(e) => { e.stopPropagation(); onSelect(); }}>
              <React.Suspense fallback={<div className="animate-pulse aspect-video bg-muted rounded-xl" />}>
                <ImageCarousel
                  slides={slides}
                  autoplay={element.props?.autoplay as boolean || false}
                  autoplayInterval={element.props?.autoplayInterval as number || 4000}
                  navigationStyle={(element.props?.navigationStyle as 'arrows' | 'dots' | 'both' | 'none') || 'both'}
                  loop={element.props?.loop !== false}
                  aspectRatio={(element.props?.aspectRatio as '16:9' | '4:3' | '1:1') || '16:9'}
                  borderRadius={parseInt(element.styles?.borderRadius as string || '12')}
                  isBuilder={true}
                  onSlidesChange={(newSlides) => {
                    onUpdate?.({ props: { ...element.props, slides: newSlides } });
                  }}
                />
              </React.Suspense>
            </div>
          </div>
        );
      }

      case 'logo-marquee': {
        // LogoMarquee is hoisted to module scope
        const logos = (element.props?.logos as Array<{ id: string; src: string; alt?: string }>) || [];
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative w-full')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="logo-marquee"
                elementLabel="Logo Bar"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            <div onClick={(e) => { e.stopPropagation(); onSelect(); }}>
              <React.Suspense fallback={<div className="animate-pulse h-16 bg-muted rounded-xl" />}>
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
                  isBuilder={true}
                  onLogosChange={(newLogos) => {
                    onUpdate?.({ props: { ...element.props, logos: newLogos } });
                  }}
                />
              </React.Suspense>
            </div>
          </div>
        );
      }

      case 'map-embed': {
        // MapEmbed is hoisted to module scope
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="map-embed"
                elementLabel="Google Maps"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            <div onClick={(e) => { e.stopPropagation(); onSelect(); }}>
              <React.Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-xl" />}>
                <MapEmbed
                  address={element.props?.address as string || ''}
                  zoom={element.props?.zoom as number || 15}
                  mapType={(element.props?.mapType as 'roadmap' | 'satellite') || 'roadmap'}
                  height={parseInt(element.styles?.height as string || '300', 10)}
                  borderRadius={parseInt(element.styles?.borderRadius as string || '12')}
                  isBuilder={true}
                />
              </React.Suspense>
            </div>
          </div>
        );
      }

      case 'html-embed': {
        // HTMLEmbed is hoisted to module scope
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="html-embed"
                elementLabel="HTML Embed"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            <div onClick={(e) => { e.stopPropagation(); onSelect(); }}>
              <React.Suspense fallback={<div className="animate-pulse h-48 bg-muted rounded-xl" />}>
                <HTMLEmbed
                  code={element.props?.code as string || ''}
                  height={parseInt(element.styles?.height as string || '300', 10)}
                  borderRadius={parseInt(element.styles?.borderRadius as string || '12')}
                  allowScripts={element.props?.allowScripts as boolean || false}
                  isBuilder={true}
                />
              </React.Suspense>
            </div>
          </div>
        );
      }

      case 'trustpilot': {
        // TrustpilotWidget is hoisted to module scope
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {renderIndicatorBadges()}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="trustpilot"
                elementLabel="Trustpilot Widget"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            <div onClick={(e) => { e.stopPropagation(); onSelect(); }}>
              <React.Suspense fallback={<div className="animate-pulse h-24 bg-muted rounded-xl" />}>
                <TrustpilotWidget
                  rating={element.props?.rating as number || 4.5}
                  reviewCount={element.props?.reviewCount as number || 1234}
                  businessName={element.props?.businessName as string}
                  layout={(element.props?.layout as 'horizontal' | 'vertical' | 'compact') || 'horizontal'}
                  showLogo={element.props?.showLogo !== false}
                  showReviewCount={element.props?.showReviewCount !== false}
                  linkUrl={element.props?.linkUrl as string}
                  isBuilder={true}
                />
              </React.Suspense>
            </div>
          </div>
        );
      }

      // ===============================================
      // MULTIPLE CHOICE / SINGLE CHOICE - Perspective-style cards
      // Supports both filled cards (with icons) and image-footer cards (quiz style)
      // ===============================================
      case 'multiple-choice':
      case 'single-choice': {
        const options = (element.props?.options as Array<{
          id: string;
          label: string;
          icon?: string;
          imageUrl?: string;
          description?: string;
        }>) || [];
        
        const layout = (element.props?.layout as string) || 'vertical';
        const cardStyle = (element.props?.cardStyle as string) || 'filled';
        const cardBg = (element.props?.cardBackgroundColor as string) || '#2563EB';
        const cardTextColor = (element.props?.cardTextColor as string) || '#FFFFFF';
        const cardRadius = (element.props?.cardBorderRadius as string) || '16px';
        const gap = (element.props?.gap as number) || 16;
        const columns = (element.props?.columns as number) || 2;
        
        // Image-footer specific props (quiz style)
        const footerBg = (element.props?.footerBackgroundColor as string) || '#2563EB';
        const footerTextColor = (element.props?.footerTextColor as string) || '#FFFFFF';
        const imageAspectRatio = (element.props?.imageAspectRatio as string) || '4:3';
        
        // Calculate aspect ratio as number
        const aspectParts = imageAspectRatio.split(':').map(Number);
        const aspectValue = aspectParts.length === 2 ? aspectParts[0] / aspectParts[1] : 4/3;
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType={element.type}
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            <div 
              className={cn(
                'w-full',
                layout === 'grid' ? `grid` : 'flex flex-col'
              )}
              style={{ 
                gap: `${gap}px`,
                gridTemplateColumns: layout === 'grid' ? `repeat(${columns}, 1fr)` : undefined
              }}
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              {options.length > 0 ? options.map((option) => {
                // Image-footer card style (quiz blocks)
                if (cardStyle === 'image-footer') {
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={cn(
                        'flex flex-col w-full overflow-hidden transition-all duration-200',
                        'hover:scale-[1.02] hover:shadow-lg',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      )}
                      style={{
                        borderRadius: cardRadius,
                        fontFamily: 'inherit',
                      }}
                    >
                      {/* Image placeholder area */}
                      <div 
                        className={cn(
                          'w-full flex items-center justify-center',
                          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
                        )}
                        style={{ 
                          aspectRatio: `${aspectValue}`,
                          backgroundImage: option.imageUrl ? `url(${option.imageUrl})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {!option.imageUrl && (
                          <Image className={cn(
                            "w-12 h-12",
                            isDarkTheme ? "text-gray-600" : "text-gray-400"
                          )} />
                        )}
                      </div>
                      {/* Footer with label */}
                      <div 
                        className="w-full px-5 py-4 font-medium text-left"
                        style={{
                          backgroundColor: footerBg,
                          color: footerTextColor,
                        }}
                      >
                        {option.label}
                      </div>
                    </button>
                  );
                }
                
                // Default filled card style
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={cn(
                      'flex items-center gap-4 w-full text-left transition-all duration-200',
                      'hover:opacity-90 hover:scale-[1.01]',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    )}
                    style={{
                      backgroundColor: cardBg,
                      color: cardTextColor,
                      borderRadius: cardRadius,
                      padding: '24px 28px',
                      fontWeight: 500,
                      fontSize: '16px',
                      fontFamily: 'inherit',
                    }}
                  >
                    {option.icon && (
                      <span className="text-2xl flex-shrink-0">{option.icon}</span>
                    )}
                    <span className="font-medium">{option.label}</span>
                  </button>
                );
              }) : (
                // Fallback if no options defined
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No choices configured
                </div>
              )}
            </div>
          </div>
        );
      }

      default: {
        // Format element type for display: "multiple-choice" → "Multiple Choice"
        const formatElementType = (type: string): string => 
          type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        return (
          <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {/* Inject state styles CSS */}
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {/* Unified Toolbar */}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType={element.type}
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                dragHandleProps={{ attributes, listeners }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {/* Styled fallback for unknown element types */}
            <div 
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors font-sans",
                isDarkTheme 
                  ? "bg-gray-800/50 border-gray-700/50 hover:border-gray-600" 
                  : "bg-gray-50 border-gray-200 hover:border-gray-300"
              )} 
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg",
                isDarkTheme ? "bg-gray-700/50" : "bg-gray-100"
              )}>
                <svg 
                  className={cn("w-4 h-4", isDarkTheme ? "text-gray-400" : "text-gray-500")} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <span className={cn(
                "text-sm font-medium tracking-tight",
                isDarkTheme ? "text-gray-300" : "text-gray-600"
              )}>
                {formatElementType(element.type)}
              </span>
            </div>
          </div>
        );
      }
    }
  };

  return renderElement();
});

SortableElementRenderer.displayName = 'SortableElementRenderer';

// Element Drag Overlay
const ElementDragOverlay: React.FC<{ element: Element }> = ({ element }) => (
  <div className="px-4 py-2 rounded-lg bg-white shadow-xl border-2 border-builder-accent opacity-90">
    <div className="text-sm font-medium text-gray-900">{element.type}</div>
    {element.content && (
      <div className="text-xs text-gray-500 truncate max-w-[200px]">{element.content}</div>
    )}
  </div>
);

// Sortable Block Renderer with Element DnD and Action Bar
interface SortableBlockRendererProps {
  block: Block;
  blockIndex: number;
  totalBlocks: number;
  selection: SelectionState;
  multiSelectedIds?: Set<string>;
  onSelect: (selection: SelectionState, isShiftHeld?: boolean) => void;
  path: string[];
  onReorderElements?: (blockId: string, fromIndex: number, toIndex: number) => void;
  onMoveBlock?: (direction: 'up' | 'down') => void;
  onDuplicateBlock?: () => void;
  onDeleteBlock?: () => void;
  onAddBlock?: (position: 'above' | 'below') => void;
  onUpdateElement?: (elementId: string, updates: Partial<Element>) => void;
  onUpdateBlock?: (updates: Partial<Block>) => void;
  onDuplicateElement?: (elementId: string) => void;
  onDeleteElement?: (elementId: string) => void;
  onCopy?: () => void;
  onPaste?: () => void;
  canPaste?: boolean;
  readOnly?: boolean;
  replayAnimationKey?: number;
  deviceMode?: DeviceMode;
  onNextStep?: () => void;
  onGoToStep?: (stepId: string) => void;
  onFormSubmit?: (values: Record<string, string>) => void;
  selectedApplicationStepId?: string | null;
  activeApplicationFlowBlockId?: string | null;
  selectedStepElement?: { stepId: string; elementType: 'title' | 'description' | 'button' | 'option' | 'input'; optionIndex?: number } | null;
  onSelectStepElement?: (element: { stepId: string; elementType: 'title' | 'description' | 'button' | 'option' | 'input'; optionIndex?: number } | null) => void;
}

const SortableBlockRenderer: React.FC<SortableBlockRendererProps> = ({ 
  block, 
  blockIndex,
  totalBlocks,
  selection,
  multiSelectedIds,
  onSelect, 
  path,
  onReorderElements,
  onMoveBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onAddBlock,
  onUpdateElement,
  onUpdateBlock,
  onDuplicateElement,
  onDeleteElement,
  onCopy,
  onPaste,
  canPaste = false,
  readOnly = false,
  replayAnimationKey = 0,
  deviceMode = 'desktop',
  onNextStep,
  onGoToStep,
  onFormSubmit,
  selectedApplicationStepId,
  activeApplicationFlowBlockId,
  selectedStepElement,
  onSelectStepElement,
}) => {
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const isSelected = selection.type === 'block' && selection.id === block.id;
  const isMultiSelected = multiSelectedIds?.has(block.id) ?? false;
  const blockPath = [...path, 'block', block.id];
  
  // Access theme context for BlockActionBar
  const { isDarkTheme } = useContext(ThemeContext);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  // Block wrapper ref for positioning toolbars (and for gradient-border wrapper)
  const blockWrapperRef = useRef<HTMLDivElement | null>(null);
  const setCombinedBlockRef = useCallback(
    (node: HTMLDivElement | null) => {
      blockWrapperRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef]
  );

  // Helper to get block shadow classes
  const getBlockShadowClass = () => {
    const shadow = block.props?.shadow as string;
    if (!shadow || shadow === 'none') return '';
    const shadowMap: Record<string, string> = {
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
      '2xl': 'shadow-2xl',
      inner: 'block-shadow-inner',
      glow: 'block-shadow-glow',
      neon: 'block-shadow-neon',
    };
    return shadowMap[shadow] || '';
  };

  // Helper to get block shadow inline style for custom glow color
  const getBlockShadowStyle = (): React.CSSProperties => {
    const shadow = block.props?.shadow as string;
    const glowColor = block.props?.glowColor as string;
    
    if (!shadow || shadow === 'none') return {};
    
    if ((shadow === 'glow' || shadow === 'neon') && glowColor) {
      const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };
      
      if (shadow === 'glow') {
        return {
          boxShadow: `0 0 30px -5px ${hexToRgba(glowColor, 0.4)}`
        };
      } else if (shadow === 'neon') {
        return {
          boxShadow: `0 0 10px ${hexToRgba(glowColor, 0.5)}, 0 0 30px ${hexToRgba(glowColor, 0.3)}`
        };
      }
    }
    
    return {};
  };

  const blockShadowClass = getBlockShadowClass();
  const blockShadowStyle = getBlockShadowStyle();

  // Build backdrop filter style for glassmorphism
  const backdropBlur = block.styles?.backdropBlur as string;
  const backdropStyle: React.CSSProperties = backdropBlur && backdropBlur !== '0' && backdropBlur !== '0px'
    ? { backdropFilter: `blur(${backdropBlur})`, WebkitBackdropFilter: `blur(${backdropBlur})` }
    : {};

  // Keep a consistent default radius while still allowing the inspector to override it.
  const effectiveBorderRadius = (block.styles?.borderRadius as string) || '12px';

  // Background is now read directly from block.styles (single source of truth)
  // No special-case needed for interactive blocks - they use the same block.styles path

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Apply block styles - all CSS values should be applied inline to guarantee they take effect
    // All blocks (including interactive) use block.styles for background (single source of truth)
    backgroundColor: block.styles?.backgroundColor,
    background: block.styles?.background,
    // Padding - individual values override shorthand; filter undefined to avoid overriding with 'undefined' string
    ...(block.styles?.padding ? { padding: block.styles.padding } : {}),
    ...(block.styles?.paddingTop ? { paddingTop: block.styles.paddingTop } : {}),
    ...(block.styles?.paddingRight ? { paddingRight: block.styles.paddingRight } : {}),
    ...(block.styles?.paddingBottom ? { paddingBottom: block.styles.paddingBottom } : {}),
    ...(block.styles?.paddingLeft ? { paddingLeft: block.styles.paddingLeft } : {}),
    // Margin
    ...(block.styles?.margin ? { margin: block.styles.margin } : {}),
    // Gap - applied to the inner flex container, but also set here for CSS compatibility
    ...(block.styles?.gap ? { gap: block.styles.gap } : {}),
    // Border radius - always apply (uses default if not set)
    borderRadius: effectiveBorderRadius,
    // Border styles - only apply if borderWidth is set
    ...(block.styles?.borderWidth ? { 
      borderWidth: block.styles.borderWidth, 
      borderStyle: 'solid',
      borderColor: block.styles?.borderColor || 'transparent'
    } : {}),
    // Apply block shadow
    ...blockShadowStyle,
    // Apply backdrop blur
    ...backdropStyle,
  };

  const elementSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleElementDragStart = (event: DragStartEvent) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[dnd] element drag start', { activeId: event.active.id, blockId: block.id });
    }
    setActiveElementId(event.active.id as string);
  };

  const handleElementDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveElementId(null);

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[dnd] element drag end', { activeId: active?.id, overId: over?.id, blockId: block.id });
    }

    if (over && active.id !== over.id && onReorderElements) {
      const oldIndex = block.elements.findIndex((el) => el.id === active.id);
      const newIndex = block.elements.findIndex((el) => el.id === over.id);
      onReorderElements(block.id, oldIndex, newIndex);
    }
  };

  const activeElement = activeElementId 
    ? block.elements.find(el => el.id === activeElementId) 
    : null;

  // Import block type label helper
  const blockTypeLabel = block.label || block.type.charAt(0).toUpperCase() + block.type.slice(1).replace(/-/g, ' ');
  
  // Check if gradient border is enabled
  const hasGradientBorder = block.props?.gradientBorder === true;
  const borderGradient = block.props?.borderGradient as { type: 'linear' | 'radial'; angle: number; stops: Array<{ color: string; position: number }> } | undefined;

  // Determine if this is a special layout block
  const isNavbar = block.props?.layout === 'navbar';
  const isFooter = block.type === 'footer' || block.props?.layout === 'footer' || block.props?.layout === 'footer-framer';
  const isHeader = block.props?.layout === 'header';
  const isContainer = block.props?.layout === 'container';
  
  // Check if any element inside this block is selected (for parent highlight)
  const hasSelectedChild = block.elements.some(el => selection.id === el.id && selection.type === 'element');
  
  // Get container-specific badge class
  const getBlockBadgeClass = () => {
    if (isNavbar) return 'block-badge-navigation';
    if (isHeader) return 'block-badge-header';
    if (isFooter) return 'block-badge-footer';
    if (isContainer) return 'block-badge-container';
    return '';
  };

  // Check if user has set any custom padding (not empty, not undefined)
  const hasCustomPadding = !!(
    (block.styles?.padding && block.styles.padding !== '0' && block.styles.padding !== '0px') ||
    (block.styles?.paddingTop && block.styles.paddingTop !== '0' && block.styles.paddingTop !== '0px') ||
    (block.styles?.paddingRight && block.styles.paddingRight !== '0' && block.styles.paddingRight !== '0px') ||
    (block.styles?.paddingBottom && block.styles.paddingBottom !== '0' && block.styles.paddingBottom !== '0px') ||
    (block.styles?.paddingLeft && block.styles.paddingLeft !== '0' && block.styles.paddingLeft !== '0px')
  );

  // Map shorthand values to CSS values
  const justifyMap: Record<string, string> = {
    'start': 'flex-start',
    'center': 'center', 
    'end': 'flex-end',
    'between': 'space-between',
    'around': 'space-around',
  };
  
  const alignMap: Record<string, string> = {
    'start': 'flex-start',
    'center': 'center',
    'end': 'flex-end', 
    'stretch': 'stretch',
  };

  // Special case: Application Flow blocks render as a card
  if (block.type === 'application-flow') {
    const applicationFlowContent = (
      <div
        ref={setCombinedBlockRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        className={cn(
          'relative p-4',
          // Only add editor chrome classes when NOT in readOnly mode
          !readOnly && 'builder-block-selectable builder-click-target group/block',
          !readOnly && isSelected && 'builder-block-selected',
          !readOnly && isMultiSelected && !isSelected && 'builder-multi-selected',
          isDragging && 'opacity-50 z-50'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect({ type: 'block', id: block.id, path: blockPath }, e.shiftKey);
        }}
      >
        {/* Clean canvas - no badge for application flow */}
        {!readOnly && (
          <BlockActionBar
            blockId={block.id}
            blockLabel={block.label}
            position="left"
            isSelected={isSelected}
            canMoveUp={blockIndex > 0}
            canMoveDown={blockIndex < totalBlocks - 1}
            onMoveUp={() => onMoveBlock?.('up')}
            onMoveDown={() => onMoveBlock?.('down')}
            onDuplicate={() => onDuplicateBlock?.()}
            onDelete={() => onDeleteBlock?.()}
            onAddAbove={() => onAddBlock?.('above')}
            onAddBelow={() => onAddBlock?.('below')}
            dragHandleProps={{ attributes, listeners }}
            deviceMode={deviceMode}
            targetRef={blockWrapperRef}
            editorTheme={isDarkTheme ? 'dark' : 'light'}
          />
        )}
        <ApplicationFlowCard
          block={block}
          isSelected={isSelected}
          onSelect={() => onSelect({ type: 'block', id: block.id, path: blockPath })}
          onUpdateBlock={(updates) => {
            // Wire up element updates to propagate through the canvas (legacy)
            if (updates.elements && onUpdateElement) {
              updates.elements.forEach((newEl) => {
                const oldEl = block.elements.find(e => e.id === newEl.id);
                if (oldEl && oldEl.content !== newEl.content) {
                  onUpdateElement(newEl.id, { content: newEl.content });
                }
              });
            }
            // Wire up props updates for step settings (bidirectional sync)
            // This ensures canvas edits update the block.props which syncs with right panel
            if (updates.props && onUpdateBlock) {
              onUpdateBlock({ props: updates.props });
            }
          }}
          readOnly={readOnly}
          selectedStepId={block.id === activeApplicationFlowBlockId ? selectedApplicationStepId : null}
          selectedStepElement={block.id === activeApplicationFlowBlockId ? selectedStepElement : null}
          onSelectStepElement={onSelectStepElement}
          isPreviewMode={readOnly}
          onNextStep={onNextStep}
          onGoToStep={onGoToStep}
        />
      </div>
    );

    if (readOnly) {
      return applicationFlowContent;
    }

    return (
      <BuilderContextMenu
        type="block"
        onCopy={() => {
          onSelect({ type: 'block', id: block.id, path: blockPath });
          onCopy?.();
        }}
        onPaste={() => onPaste?.()}
        onDuplicate={() => onDuplicateBlock?.()}
        onDelete={() => onDeleteBlock?.()}
        onMoveUp={() => onMoveBlock?.('up')}
        onMoveDown={() => onMoveBlock?.('down')}
        canMoveUp={blockIndex > 0}
        canMoveDown={blockIndex < totalBlocks - 1}
        canPaste={canPaste}
        disabled={readOnly}
      >
        {applicationFlowContent}
      </BuilderContextMenu>
    );
  }

  const blockInnerContent = (
    <div
      ref={!hasGradientBorder ? setCombinedBlockRef : undefined}
      style={{
        ...style,
        // Outer wrapper is responsible for background/padding/border/shadow/transform.
        // Flex layout for child elements is handled by the inner container so inspector controls reliably affect layout.
        display: 'block',
      }}
      className={cn(
        'relative',
        // Only add editor chrome classes when NOT in readOnly mode
        !readOnly && 'builder-block-selectable builder-click-target group/block',
        // Only apply default padding if the user hasn't set ANY padding styles (check for truthy non-empty values)
        !hasCustomPadding && (isNavbar ? 'py-4 px-8' : isFooter ? 'py-12 px-12' : 'p-6'),
        !readOnly && isSelected && 'builder-block-selected',
        !readOnly && isMultiSelected && !isSelected && 'builder-multi-selected',
        // Parent highlight when child element is selected
        !readOnly && hasSelectedChild && !isSelected && 'builder-parent-of-selected',
        block.type === 'hero' && !hasCustomPadding && 'text-center py-12',
        block.type === 'cta' && 'justify-center',
        isDragging && 'opacity-50 z-50',
        blockShadowClass
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect({ type: 'block', id: block.id, path: blockPath }, e.shiftKey);
      }}
    >
      {/* Block Type Badge - Shows on hover with blue styling (editor only) */}
      {!readOnly && (
        <span className={cn('block-type-badge block-type-badge-block', getBlockBadgeClass())}>{blockTypeLabel}</span>
      )}
      
      {/* Block Action Bar - shows on selection with smooth animation */}
      {!readOnly && (
        <BlockActionBar
          blockId={block.id}
          blockLabel={block.label}
          position="left"
          isSelected={isSelected}
          canMoveUp={blockIndex > 0}
          canMoveDown={blockIndex < totalBlocks - 1}
          onMoveUp={() => onMoveBlock?.('up')}
          onMoveDown={() => onMoveBlock?.('down')}
          onDuplicate={() => onDuplicateBlock?.()}
          onDelete={() => onDeleteBlock?.()}
          onAddAbove={() => onAddBlock?.('above')}
          onAddBelow={() => onAddBlock?.('below')}
          dragHandleProps={{ attributes, listeners }}
          deviceMode={deviceMode}
          targetRef={blockWrapperRef}
          editorTheme={isDarkTheme ? 'dark' : 'light'}
        />
      )}

      <DndContext
        sensors={elementSensors}
        collisionDetection={closestCenter}
        onDragStart={handleElementDragStart}
        onDragEnd={handleElementDragEnd}
      >
        <SortableContext
          items={block.elements.map(el => el.id)}
          strategy={isNavbar || block.props?.direction === 'row' ? horizontalListSortingStrategy : verticalListSortingStrategy}
        >
          <div 
            className={cn(
              'flex w-full',
              (block.props?.direction as string) === 'row' || isNavbar || isFooter ? 'flex-row' : 'flex-col'
            )}
            style={{
              flexDirection: (block.props?.direction as 'row' | 'column') || (isNavbar || isFooter ? 'row' : 'column'),
              justifyContent:
                justifyMap[block.props?.justifyContent as string] ||
                (block.props?.justifyContent as string) ||
                (isNavbar ? 'space-between' : 'flex-start'),
              alignItems:
                alignMap[block.props?.alignItems as string] ||
                (block.props?.alignItems as string) ||
                (isNavbar ? 'center' : 'stretch'),
              flexWrap: block.props?.wrap ? 'wrap' : (isFooter ? 'wrap' : 'nowrap'),
              width: '100%',
              gap: (block.styles?.gap as string) || (block.props?.gap as string) || (isFooter ? '48px' : '16px'),
              // Ensure minimum height for empty blocks so they're visible
              minHeight: block.elements.length === 0 ? '60px' : undefined,
            }}
          >
            {/* Empty block state - show placeholder when no elements */}
            {block.elements.length === 0 && !readOnly && (
              <div className="flex items-center justify-center w-full py-4 text-gray-400 text-sm">
                <span>Click to select this section, then add content</span>
              </div>
            )}
            {block.elements.map((element, elementIndex) => {
              const elementPath = [...blockPath, 'element', element.id];
              const isElementSelected = selection.type === 'element' && selection.id === element.id;
              const isElementMultiSelected = multiSelectedIds?.has(element.id) ?? false;
              
              return (
                <BuilderContextMenu
                  key={element.id}
                  type="element"
                  onCopy={() => {
                    onSelect({ type: 'element', id: element.id, path: elementPath });
                    onCopy?.();
                  }}
                  onPaste={() => onPaste?.()}
                  onDuplicate={() => onDuplicateElement?.(element.id)}
                  onDelete={() => onDeleteElement?.(element.id)}
                  onMoveUp={() => onReorderElements?.(block.id, elementIndex, elementIndex - 1)}
                  onMoveDown={() => onReorderElements?.(block.id, elementIndex, elementIndex + 1)}
                  canMoveUp={elementIndex > 0}
                  canMoveDown={elementIndex < block.elements.length - 1}
                  canPaste={canPaste}
                  disabled={readOnly}
                >
                  <SortableElementRenderer
                    element={element}
                    isSelected={isElementSelected}
                    isMultiSelected={isElementMultiSelected}
                    onSelect={(e) => onSelect({ type: 'element', id: element.id, path: elementPath }, e?.shiftKey)}
                    onUpdate={(updates) => onUpdateElement?.(element.id, updates)}
                    onDuplicate={() => onDuplicateElement?.(element.id)}
                    onDelete={() => onDeleteElement?.(element.id)}
                    onCopy={onCopy}
                    onPaste={onPaste}
                    canPaste={canPaste}
                    readOnly={readOnly}
                    replayAnimationKey={replayAnimationKey}
                    selectionId={selection.id}
                    deviceMode={deviceMode}
                    onNextStep={onNextStep}
                    onGoToStep={onGoToStep}
                    onFormSubmit={onFormSubmit}
                  />
                </BuilderContextMenu>
              );
            })}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeElement ? <ElementDragOverlay element={activeElement} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );

  // Wrap in gradient border if enabled - use proper border technique
  const blockContent = hasGradientBorder && borderGradient ? (
    <div
      ref={setCombinedBlockRef}
      className="relative"
      style={{
        padding: '2px',
        background: gradientToCSS(borderGradient),
        borderRadius: effectiveBorderRadius,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div
        style={{
          ...style,
          transform: undefined, // Remove transform from inner - already on outer
          transition: undefined,
          borderRadius: `calc(${effectiveBorderRadius} - 2px)`,
        }}
        className={cn(
          // Only add editor chrome classes when NOT in readOnly mode
          !readOnly && 'builder-block-selectable builder-click-target group/block',
          'relative',
          !hasCustomPadding && (isNavbar ? 'py-4 px-8' : isFooter ? 'py-12 px-12' : 'p-6'),
          !readOnly && isSelected && 'builder-block-selected',
          !readOnly && isMultiSelected && !isSelected && 'builder-multi-selected',
          !readOnly && hasSelectedChild && !isSelected && 'builder-parent-of-selected',
          block.type === 'hero' && !hasCustomPadding && 'text-center py-12',
          block.type === 'cta' && 'justify-center',
          isDragging && 'opacity-50 z-50',
          blockShadowClass
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect({ type: 'block', id: block.id, path: blockPath }, e.shiftKey);
        }}
      >
        {/* Block Type Badge (editor only) */}
        {!readOnly && (
          <span className={cn('block-type-badge', getBlockBadgeClass())}>{blockTypeLabel}</span>
        )}
        
        {!readOnly && (
          <BlockActionBar
            blockId={block.id}
            blockLabel={block.label}
            position="left"
            isSelected={isSelected}
            canMoveUp={blockIndex > 0}
            canMoveDown={blockIndex < totalBlocks - 1}
            onMoveUp={() => onMoveBlock?.('up')}
            onMoveDown={() => onMoveBlock?.('down')}
            onDuplicate={() => onDuplicateBlock?.()}
            onDelete={() => onDeleteBlock?.()}
            onAddAbove={() => onAddBlock?.('above')}
            onAddBelow={() => onAddBlock?.('below')}
            dragHandleProps={{ attributes, listeners }}
            deviceMode={deviceMode}
            targetRef={blockWrapperRef}
            editorTheme={isDarkTheme ? 'dark' : 'light'}
          />
        )}

        <DndContext
          sensors={elementSensors}
          collisionDetection={closestCenter}
          onDragStart={handleElementDragStart}
          onDragEnd={handleElementDragEnd}
        >
          <SortableContext
            items={block.elements.map(el => el.id)}
            strategy={isNavbar || block.props?.direction === 'row' ? horizontalListSortingStrategy : verticalListSortingStrategy}
          >
            <div 
              className={cn(
                'flex w-full',
                (block.props?.direction as string) === 'row' || isNavbar || isFooter ? 'flex-row' : 'flex-col'
              )}
              style={{
                flexDirection: (block.props?.direction as 'row' | 'column') || (isNavbar || isFooter ? 'row' : 'column'),
                justifyContent:
                  justifyMap[block.props?.justifyContent as string] ||
                  (block.props?.justifyContent as string) ||
                  (isNavbar ? 'space-between' : 'flex-start'),
                alignItems:
                  alignMap[block.props?.alignItems as string] ||
                  (block.props?.alignItems as string) ||
                  (isNavbar ? 'center' : 'stretch'),
                flexWrap: block.props?.wrap ? 'wrap' : (isFooter ? 'wrap' : 'nowrap'),
                width: '100%',
                gap: (block.styles?.gap as string) || (block.props?.gap as string) || (isFooter ? '48px' : '16px'),
              }}
            >
              {block.elements.map((element, elementIndex) => {
                const elementPath = [...blockPath, 'element', element.id];
                const isElementSelected = selection.type === 'element' && selection.id === element.id;
                const isElementMultiSelected = multiSelectedIds?.has(element.id) ?? false;
                
                return (
                  <BuilderContextMenu
                    key={element.id}
                    type="element"
                    onCopy={() => {
                      onSelect({ type: 'element', id: element.id, path: elementPath });
                      onCopy?.();
                    }}
                    onPaste={() => onPaste?.()}
                    onDuplicate={() => onDuplicateElement?.(element.id)}
                    onDelete={() => onDeleteElement?.(element.id)}
                    onMoveUp={() => onReorderElements?.(block.id, elementIndex, elementIndex - 1)}
                    onMoveDown={() => onReorderElements?.(block.id, elementIndex, elementIndex + 1)}
                    canMoveUp={elementIndex > 0}
                    canMoveDown={elementIndex < block.elements.length - 1}
                    canPaste={canPaste}
                    disabled={readOnly}
                  >
                    <SortableElementRenderer
                      element={element}
                      isSelected={isElementSelected}
                      isMultiSelected={isElementMultiSelected}
                      onSelect={(e) => onSelect({ type: 'element', id: element.id, path: elementPath }, e?.shiftKey)}
                      onUpdate={(updates) => onUpdateElement?.(element.id, updates)}
                      onDuplicate={() => onDuplicateElement?.(element.id)}
                      onDelete={() => onDeleteElement?.(element.id)}
                      onCopy={onCopy}
                      onPaste={onPaste}
                      canPaste={canPaste}
                      readOnly={readOnly}
                      replayAnimationKey={replayAnimationKey}
                      selectionId={selection.id}
                      deviceMode={deviceMode}
                      onNextStep={onNextStep}
                      onGoToStep={onGoToStep}
                      onFormSubmit={onFormSubmit}
                    />
                  </BuilderContextMenu>
                );
              })}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeElement ? <ElementDragOverlay element={activeElement} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  ) : blockInnerContent;

  // Wrap block with context menu
  if (readOnly) {
    return blockContent;
  }

  return (
    <BuilderContextMenu
      type="block"
      onCopy={() => {
        onSelect({ type: 'block', id: block.id, path: blockPath });
        onCopy?.();
      }}
      onPaste={() => onPaste?.()}
      onDuplicate={() => onDuplicateBlock?.()}
      onDelete={() => onDeleteBlock?.()}
      onMoveUp={() => onMoveBlock?.('up')}
      onMoveDown={() => onMoveBlock?.('down')}
      canMoveUp={blockIndex > 0}
      canMoveDown={blockIndex < totalBlocks - 1}
      canPaste={canPaste}
      disabled={readOnly}
    >
      {blockContent}
    </BuilderContextMenu>
  );
};

// Block Overlay for Drag
const BlockDragOverlay: React.FC<{ block: Block }> = ({ block }) => (
  <div className="p-6 rounded-xl bg-white shadow-2xl border-2 border-builder-accent opacity-90">
    <div className="text-sm font-medium text-gray-900">{block.label}</div>
    <div className="text-xs text-gray-500 mt-1">{block.type} block</div>
  </div>
);

// Stack Renderer with DnD
interface StackRendererProps {
  stack: Stack;
  selection: SelectionState;
  multiSelectedIds?: Set<string>;
  onSelect: (selection: SelectionState, isShiftHeld?: boolean) => void;
  path: string[];
  onReorderBlocks?: (stackId: string, fromIndex: number, toIndex: number) => void;
  onReorderElements?: (blockId: string, fromIndex: number, toIndex: number) => void;
  onAddBlock?: (block: Block, position?: { stackId: string; index: number }) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onDeleteBlock?: (blockId: string) => void;
  onUpdateBlock?: (blockId: string, updates: Partial<Block>) => void;
  onUpdateElement?: (elementId: string, updates: Partial<Element>) => void;
  onDuplicateElement?: (elementId: string) => void;
  onDeleteElement?: (elementId: string) => void;
  onCopy?: () => void;
  onPaste?: () => void;
  canPaste?: boolean;
  readOnly?: boolean;
  replayAnimationKey?: number;
  deviceMode?: DeviceMode;
  onNextStep?: () => void;
  onGoToStep?: (stepId: string) => void;
  onFormSubmit?: (values: Record<string, string>) => void;
  onOpenBlockPickerInPanel?: (stackId: string) => void;
  selectedApplicationStepId?: string | null;
  activeApplicationFlowBlockId?: string | null;
  selectedStepElement?: { stepId: string; elementType: 'title' | 'description' | 'button' | 'option' | 'input'; optionIndex?: number } | null;
  onSelectStepElement?: (element: { stepId: string; elementType: 'title' | 'description' | 'button' | 'option' | 'input'; optionIndex?: number } | null) => void;
  parentBackgroundColor?: string; // For contrast-adaptive UI elements
}

const StackRenderer: React.FC<StackRendererProps> = ({ 
  stack, 
  selection,
  multiSelectedIds,
  onSelect, 
  path,
  onReorderBlocks,
  onReorderElements,
  onAddBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onUpdateBlock,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  onCopy,
  onPaste,
  canPaste = false,
  readOnly = false,
  replayAnimationKey = 0,
  deviceMode = 'desktop',
  onNextStep,
  onGoToStep,
  onFormSubmit,
  onOpenBlockPickerInPanel,
  selectedApplicationStepId,
  activeApplicationFlowBlockId,
  selectedStepElement,
  onSelectStepElement,
  parentBackgroundColor,
}) => {
  // Compute if parent background is dark for contrast-adaptive UI
  const isParentDark = useMemo(() => {
    if (!parentBackgroundColor || parentBackgroundColor === 'transparent') return false;
    return !isLightColor(parentBackgroundColor);
  }, [parentBackgroundColor]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const isSelected = selection.type === 'stack' && selection.id === stack.id;
  const stackPath = [...path, 'stack', stack.id];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveBlockId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBlockId(null);

    if (over && active.id !== over.id && onReorderBlocks) {
      const oldIndex = stack.blocks.findIndex((block) => block.id === active.id);
      const newIndex = stack.blocks.findIndex((block) => block.id === over.id);
      onReorderBlocks(stack.id, oldIndex, newIndex);
    }
  };

  const activeBlock = activeBlockId 
    ? stack.blocks.find(b => b.id === activeBlockId) 
    : null;

  const handleAddBlockToStack = (block: Block) => {
    onAddBlock?.(block, { stackId: stack.id, index: stack.blocks.length });
  };

  // Extract parent frame ID and path from the received path prop
  // path format: ['step', stepId, 'frame', frameId]
  const frameIndex = path.indexOf('frame');
  const parentFrameId = frameIndex !== -1 && path[frameIndex + 1] ? path[frameIndex + 1] : null;
  const parentFramePath = frameIndex !== -1 ? path.slice(0, frameIndex + 2) : path;

  // Handler for selecting the parent frame (used for empty state click)
  const selectParentFrame = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (parentFrameId && !readOnly) {
      onSelect({ type: 'frame', id: parentFrameId, path: parentFramePath });
    }
  };

  return (
    <div
      className={cn(
        'p-2 rounded-xl relative',
        // Only add editor chrome classes when NOT in readOnly mode
        !readOnly && 'builder-section-selectable group/section',
        !readOnly && isSelected && 'builder-section-selected',
        stack.direction === 'horizontal' ? 'flex flex-row gap-4' : 'flex flex-col gap-3'
      )}
      // No onClick here - clicking bubbles up to FrameRenderer which handles frame selection
    >
      {/* Content area - no badge, clicking selects parent frame */}
      {/* CRITICAL: Empty state is ONLY for editor - never render in readOnly (preview/runtime) */}
      {stack.blocks.length === 0 ? (
        !readOnly ? (
          // Polished empty state - contrast-adaptive based on parent background
          <div 
            onClick={(e) => {
              e.stopPropagation();
              // First select the parent frame, then open block picker
              selectParentFrame();
              onOpenBlockPickerInPanel?.(stack.id);
            }}
            className="w-full py-16 flex items-center justify-center cursor-pointer"
          >
            <div className={cn(
              "group flex flex-col items-center justify-center py-20 px-8 w-full max-w-2xl border-2 border-dashed rounded-2xl transition-all duration-200",
              isParentDark
                ? "border-white/30 hover:border-white/50 bg-white/5"
                : "border-purple-300/50 hover:border-purple-400/60 bg-white"
            )}>
              {/* Icon container */}
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-5",
                isParentDark ? "bg-white/10" : "bg-gray-100"
              )}>
                <Layers size={32} className={isParentDark ? "text-white/60" : "text-gray-400"} />
              </div>
              
              {/* Title */}
              <span className={cn(
                "text-lg font-semibold mb-1",
                isParentDark ? "text-white/90" : "text-gray-800"
              )}>
                Add content to this section
              </span>
              
              {/* Subtitle */}
              <span className={cn(
                "text-sm mb-6",
                isParentDark ? "text-white/50" : "text-gray-400"
              )}>
                Capture forms, questions, buttons & more
              </span>
              
              {/* Button - always high contrast */}
              <span className={cn(
                "inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold shadow-lg transition-all",
                isParentDark
                  ? "bg-white text-gray-900 group-hover:bg-white/90"
                  : "bg-gray-900 text-white group-hover:bg-gray-800"
              )}>
                <Plus size={18} />
                <span>Insert Content</span>
              </span>
            </div>
          </div>
        ) : null /* Empty stacks render nothing in readOnly mode */
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stack.blocks.map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {stack.blocks.map((block, index) => (
                <SortableBlockRenderer
                  key={block.id}
                  block={block}
                  blockIndex={index}
                  totalBlocks={stack.blocks.length}
                  selection={selection}
                  multiSelectedIds={multiSelectedIds}
                  onSelect={onSelect}
                  path={stackPath}
                  onReorderElements={onReorderElements}
                  onMoveBlock={(direction) => {
                    if (direction === 'up' && index > 0) {
                      onReorderBlocks?.(stack.id, index, index - 1);
                    } else if (direction === 'down' && index < stack.blocks.length - 1) {
                      onReorderBlocks?.(stack.id, index, index + 1);
                    }
                  }}
                  onDuplicateBlock={() => onDuplicateBlock?.(block.id)}
                  onDeleteBlock={() => onDeleteBlock?.(block.id)}
                  onAddBlock={(position) => {
                    // This would be handled by parent for inserting at specific position
                  }}
                  onUpdateBlock={(updates) => onUpdateBlock?.(block.id, updates)}
                  onUpdateElement={onUpdateElement}
                  onDuplicateElement={onDuplicateElement}
                  onDeleteElement={onDeleteElement}
                  onCopy={onCopy}
                  onPaste={onPaste}
                  canPaste={canPaste}
                  readOnly={readOnly}
                  replayAnimationKey={replayAnimationKey}
                  deviceMode={deviceMode}
                  onNextStep={onNextStep}
                  onGoToStep={onGoToStep}
                  onFormSubmit={onFormSubmit}
                  selectedApplicationStepId={selectedApplicationStepId}
                  activeApplicationFlowBlockId={activeApplicationFlowBlockId}
                  selectedStepElement={selectedStepElement}
                  onSelectStepElement={onSelectStepElement}
                  />
                ))}
            </SortableContext>
            <DragOverlay>
              {activeBlock ? <BlockDragOverlay block={activeBlock} /> : null}
            </DragOverlay>
          </DndContext>
          
        </>
      )}
    </div>
  );
};

// Frame Renderer
interface FrameRendererProps {
  frame: Frame;
  frameIndex: number;
  totalFrames: number;
  selection: SelectionState;
  multiSelectedIds?: Set<string>;
  onSelect: (selection: SelectionState, isShiftHeld?: boolean) => void;
  path: string[];
  onReorderBlocks?: (stackId: string, fromIndex: number, toIndex: number) => void;
  onReorderElements?: (blockId: string, fromIndex: number, toIndex: number) => void;
  onAddBlock?: (block: Block, position?: { stackId: string; index: number }) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onDeleteBlock?: (blockId: string) => void;
  onUpdateBlock?: (blockId: string, updates: Partial<Block>) => void;
  onUpdateElement?: (elementId: string, updates: Partial<Element>) => void;
  onDuplicateElement?: (elementId: string) => void;
  onDeleteElement?: (elementId: string) => void;
  onCopy?: () => void;
  onPaste?: () => void;
  canPaste?: boolean;
  readOnly?: boolean;
  isDarkTheme?: boolean;
  replayAnimationKey?: number;
  deviceMode?: DeviceMode;
  onNextStep?: () => void;
  onGoToStep?: (stepId: string) => void;
  onFormSubmit?: (values: Record<string, string>) => void;
  // Section actions
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onAddAbove?: () => void;
  onAddBelow?: () => void;
  onRename?: (newName: string) => void;
  // Drag and drop
  dragHandleListeners?: React.DOMAttributes<HTMLButtonElement>;
  dragHandleAttributes?: React.HTMLAttributes<HTMLButtonElement>;
  onOpenBlockPickerInPanel?: (stackId: string) => void;
  selectedApplicationStepId?: string | null;
  activeApplicationFlowBlockId?: string | null;
  selectedStepElement?: { stepId: string; elementType: 'title' | 'description' | 'button' | 'option' | 'input'; optionIndex?: number } | null;
  onSelectStepElement?: (element: { stepId: string; elementType: 'title' | 'description' | 'button' | 'option' | 'input'; optionIndex?: number } | null) => void;
}

const FrameRenderer: React.FC<FrameRendererProps> = ({ 
  frame, 
  frameIndex,
  totalFrames,
  selection,
  multiSelectedIds,
  onSelect, 
  path,
  onReorderBlocks,
  onReorderElements,
  onAddBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onUpdateBlock,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  onCopy,
  onPaste,
  canPaste = false,
  readOnly = false,
  isDarkTheme = false,
  replayAnimationKey = 0,
  deviceMode = 'desktop',
  onNextStep,
  onGoToStep,
  onFormSubmit,
  // Section actions
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onAddAbove,
  onAddBelow,
  onRename,
  // Drag and drop
  dragHandleListeners,
  dragHandleAttributes,
  onOpenBlockPickerInPanel,
  selectedApplicationStepId,
  activeApplicationFlowBlockId,
  selectedStepElement,
  onSelectStepElement,
}) => {
  const isSelected = selection.type === 'frame' && selection.id === frame.id;
  const framePath = [...path, 'frame', frame.id];

  // Frame background resolver
  const getFrameBackgroundStyles = (): { className: string; style?: React.CSSProperties } => {
    const bg = frame.background || 'transparent';

    switch (bg) {
      case 'white':
        return { className: 'bg-white shadow-lg' };
      case 'dark':
        return { className: 'bg-gray-900 shadow-lg' };
      case 'glass': {
        // Use glassTint and glassBlur from frame.glass if available, otherwise defaults
        const glassSettings = (frame as any).glass as { backdropBlur?: number; glassTint?: string; glassTintOpacity?: number } | undefined;
        const glassTint = glassSettings?.glassTint || 'rgba(255,255,255,0.1)';
        const glassBlur = glassSettings?.backdropBlur || 12;
        const glassTintOpacity = glassSettings?.glassTintOpacity;
        
        // If glassTint is a hex color, convert to rgba with opacity
        let tintColor = glassTint;
        if (glassTint.startsWith('#') && glassTintOpacity !== undefined) {
          const hex = glassTint.replace('#', '');
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          tintColor = `rgba(${r}, ${g}, ${b}, ${glassTintOpacity / 100})`;
        }
        
        return { 
          className: 'border border-white/20 shadow-lg',
          style: {
            backdropFilter: `blur(${glassBlur}px)`,
            WebkitBackdropFilter: `blur(${glassBlur}px)`,
            backgroundColor: tintColor,
          }
        };
      }
      case 'custom':
        return {
          className: 'shadow-lg',
          style: { backgroundColor: frame.backgroundColor || '#ffffff' },
        };
      case 'gradient':
        return {
          className: 'shadow-lg',
          style: {
            background: frame.backgroundGradient
              ? gradientToCSS(frame.backgroundGradient as any)
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          },
        };
      case 'image':
        return {
          className: 'shadow-lg',
          style: frame.backgroundImage
            ? {
                backgroundImage: `url(${frame.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : { backgroundColor: frame.backgroundColor || '#ffffff' },
        };
      case 'video':
        // Video backgrounds are handled separately with a video element overlay
        return { className: 'shadow-lg overflow-hidden' };
      case 'transparent':
      default:
        return { className: 'bg-transparent' };
    }
  };

  // Check if this frame has a video background
  const hasVideoBackground = frame.background === 'video' && frame.backgroundVideo;
  const videoUrl = hasVideoBackground ? getVideoBackgroundUrl(frame.backgroundVideo) : null;
  const videoOpacity = (frame.backgroundVideoOpacity ?? 100) / 100;

  const frameStyles = getFrameBackgroundStyles();
  
  // Compute effective background color for contrast-adaptive child elements
  const effectiveBackgroundColor = useMemo(() => {
    const bg = frame.background || 'transparent';
    switch (bg) {
      case 'custom': return frame.backgroundColor || '#ffffff';
      case 'white': return '#ffffff';
      case 'dark': return '#111827';
      case 'gradient': {
        // Extract first color from gradient for contrast calculation
        const gradient = frame.backgroundGradient 
          ? gradientToCSS(frame.backgroundGradient as any)
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        return extractFirstGradientColor(gradient) || '#667eea';
      }
      case 'transparent':
      case 'glass':
      case 'image':
      case 'video':
      default:
        return 'transparent';
    }
  }, [frame.background, frame.backgroundColor, frame.backgroundGradient]);
  
  // Determine layout mode - 'contained' (centered box) or 'full-width' (edge-to-edge within device frame)
  // Default to full-width for better out-of-box experience
  const isFullWidth = frame.layout !== 'contained';
  
  return (
    <div
      className={cn(
        'overflow-visible transition-all relative',
        // Only add editor chrome when NOT in readOnly mode
        !readOnly && 'group/frame cursor-pointer',
        // Apply rounded corners and centering only for contained layout
        !isFullWidth && 'rounded-2xl mx-auto',
        frameStyles.className,
        // Selection ring only in editor mode
        !readOnly && isSelected && 'ring-2 ring-builder-accent shadow-[0_0_0_4px_hsl(var(--builder-accent)/0.15)]'
      )}
      style={{
        ...frameStyles.style,
        // Apply maxWidth for contained layout
        maxWidth: !isFullWidth ? (frame.maxWidth || 520) : undefined,
      }}
      onClick={(e) => {
        // Click anywhere on frame selects it (if not clicking a child element that handles selection)
        if (!readOnly) {
          e.stopPropagation();
          onSelect({ type: 'frame', id: frame.id, path: framePath });
        }
      }}
    >
      {/* Section Action Bar - floating toolbar for section management */}
      {!readOnly && (
        <SectionActionBar
          sectionId={frame.id}
          sectionLabel={frame.label || `Section ${frameIndex + 1}`}
          isSelected={isSelected}
          frameIndex={frameIndex}
          totalFrames={totalFrames}
          onSelect={() => onSelect({ type: 'frame', id: frame.id, path: framePath })}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onAddAbove={onAddAbove}
          onAddBelow={onAddBelow}
          onRename={onRename}
          dragHandleListeners={dragHandleListeners}
          dragHandleAttributes={dragHandleAttributes}
        />
      )}
      
      {/* Video Background Layer */}
      {hasVideoBackground && videoUrl && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" style={{ borderRadius: !isFullWidth ? '1rem' : undefined }}>
          {isDirectVideoUrl(frame.backgroundVideo) ? (
            <video
              src={videoUrl}
              autoPlay={frame.backgroundVideoAutoplay ?? true}
              muted={frame.backgroundVideoMuted ?? true}
              loop={frame.backgroundVideoLoop ?? true}
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: videoOpacity }}
            />
          ) : (
            <iframe
              src={videoUrl}
              className="absolute inset-0 w-full h-full scale-150"
              style={{ opacity: videoOpacity }}
              allow="autoplay; fullscreen"
              frameBorder={0}
            />
          )}
        </div>
      )}
      
      {/* Apply dynamic padding and spacing based on frame settings */}
      <div 
        className="relative z-10"
        style={{
          // Reduced default padding from 32px to 16px for tighter sections
          paddingTop: frame.paddingVertical ?? 16,
          paddingBottom: frame.paddingVertical ?? 16,
          paddingLeft: isFullWidth ? 16 : (frame.paddingHorizontal ?? 24),
          paddingRight: isFullWidth ? 16 : (frame.paddingHorizontal ?? 24),
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: frame.blockGap || 12 }}>
          {frame.stacks.map((stack) => (
            <StackRenderer
              key={stack.id}
              stack={stack}
              selection={selection}
              multiSelectedIds={multiSelectedIds}
              onSelect={onSelect}
              path={framePath}
              onReorderBlocks={onReorderBlocks}
              onReorderElements={onReorderElements}
              onAddBlock={onAddBlock}
              onDuplicateBlock={onDuplicateBlock}
              onDeleteBlock={onDeleteBlock}
              onUpdateBlock={onUpdateBlock}
              onUpdateElement={onUpdateElement}
              onDuplicateElement={onDuplicateElement}
              onDeleteElement={onDeleteElement}
              onCopy={onCopy}
              onPaste={onPaste}
              canPaste={canPaste}
              readOnly={readOnly}
              replayAnimationKey={replayAnimationKey}
              deviceMode={deviceMode}
              onNextStep={onNextStep}
              onGoToStep={onGoToStep}
              onFormSubmit={onFormSubmit}
              onOpenBlockPickerInPanel={onOpenBlockPickerInPanel}
              selectedApplicationStepId={selectedApplicationStepId}
              activeApplicationFlowBlockId={activeApplicationFlowBlockId}
              selectedStepElement={selectedStepElement}
              onSelectStepElement={onSelectStepElement}
              parentBackgroundColor={effectiveBackgroundColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Sortable wrapper for FrameRenderer - enables drag-and-drop reordering
interface SortableFrameRendererProps extends FrameRendererProps {
  id: string;
}

const SortableFrameRenderer: React.FC<SortableFrameRendererProps> = ({ id, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <FrameRenderer 
        {...props} 
        dragHandleListeners={listeners}
        dragHandleAttributes={attributes}
      />
    </div>
  );
};

// Main Canvas Component
export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  step,
  selection,
  onSelect,
  deviceMode,
  readOnly = false,
  designMode = 'select',
  onReorderBlocks,
  onReorderElements,
  onOpenBlockPalette,
  onAddBlock,
  onAddFrame,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  onDuplicateBlock,
  onDeleteBlock,
  onUpdateBlock,
  onCopy,
  onPaste,
  canPaste = false,
  pageSettings,
  replayAnimationKey = 0,
  onNextStep,
  onGoToStep,
  onFormSubmit,
  showGrid = false,
  onOpenAIGenerate,
  // Section (frame) management
  onReorderFrames,
  onDuplicateFrame,
  onDeleteFrame,
  onAddFrameAt,
  onRenameFrame,
  // Block picker in left panel
  onOpenBlockPickerInPanel,
  // Section picker
  onOpenSectionPicker,
  // Application Flow step selection
  selectedApplicationStepId,
  activeApplicationFlowBlockId,
  // Element selection within flow steps
  selectedStepElement,
  onSelectStepElement,
}) => {
  // Form state for preview mode
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [checkboxValues, setCheckboxValues] = useState<Record<string, Set<string>>>({});
  
  // Pan mode state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  
  const setValue = useCallback((key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  }, []);
  
  // Toggle checkbox in a group (for multi-select)
  const toggleCheckbox = useCallback((groupKey: string, value: string) => {
    setCheckboxValues(prev => {
      const currentSet = prev[groupKey] || new Set<string>();
      const newSet = new Set(currentSet);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...prev, [groupKey]: newSet };
    });
  }, []);
  
  // Check if a checkbox value is selected
  const isChecked = useCallback((groupKey: string, value: string) => {
    return checkboxValues[groupKey]?.has(value) || false;
  }, [checkboxValues]);
  
  // Pan mode handlers
  const handlePanMouseDown = useCallback((e: React.MouseEvent) => {
    if (designMode !== 'pan') return;
    e.preventDefault();
    setIsPanning(true);
    setPanStart({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollContainerRef.current?.scrollLeft || 0,
      scrollTop: scrollContainerRef.current?.scrollTop || 0,
    });
  }, [designMode]);
  
  const handlePanMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || designMode !== 'pan' || !scrollContainerRef.current) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    scrollContainerRef.current.scrollLeft = panStart.scrollLeft - dx;
    scrollContainerRef.current.scrollTop = panStart.scrollTop - dy;
  }, [isPanning, designMode, panStart]);
  
  const handlePanMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);
  
  // Drag and drop sensors for section reordering
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle frame drag end
  const handleFrameDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && step) {
      const oldIndex = step.frames.findIndex(f => f.id === active.id);
      const newIndex = step.frames.findIndex(f => f.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderFrames?.(oldIndex, newIndex);
      }
    }
  }, [step, onReorderFrames]);
  
  // Determine if we're in preview mode (readOnly means preview)
  const isPreviewMode = readOnly;
  
  if (!step) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas-bg">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-builder-surface flex items-center justify-center mx-auto mb-4">
            <Type className="w-8 h-8 text-builder-text-muted" />
          </div>
          <p className="text-builder-text-muted">Select a step to start editing</p>
        </div>
      </div>
    );
  }

  const stepPath = ['step', step.id];

  // Get first stack ID for adding blocks
  const firstStackId = step.frames[0]?.stacks[0]?.id;

  const handleAddBlockToCanvas = (block: Block) => {
    if (firstStackId) {
      onAddBlock?.(block, { stackId: firstStackId, index: 0 });
    }
  };

  // Apply theme settings
  // IMPORTANT: "dark theme" is derived from the *actual* background, not a saved toggle.
  // Otherwise we can end up with white text on a light background if theme=dark while bg=white.
  const backgroundSource = (step.background && (step.background.type || step.background.color))
    ? step.background
    : pageSettings?.page_background;

  // Dark theme detection: prefer luminance of the actual visible background when available.
  // Only fall back to pageSettings.theme when we can't infer background luminance (e.g. image/video).
  const isDarkTheme = (() => {
    if (!backgroundSource) {
      return pageSettings?.theme === 'dark';
    }

    let bgColor: string | undefined;
    // Helper to calculate luminance from hex color
    const calcLuminance = (hex: string): number | null => {
      try {
        const h = hex.replace('#', '');
        if (h.length !== 6) return null;
        const r = parseInt(h.substring(0, 2), 16) / 255;
        const g = parseInt(h.substring(2, 4), 16) / 255;
        const b = parseInt(h.substring(4, 6), 16) / 255;
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      } catch {
        return null;
      }
    };

    if (backgroundSource.type === 'solid') {
      bgColor = backgroundSource.color;
    } else if (backgroundSource.type === 'gradient' && backgroundSource.gradient?.stops?.length) {
      // Average luminance across all gradient stops for more accurate detection
      const stops = backgroundSource.gradient.stops;
      const luminances = stops.map((s: { color: string }) => calcLuminance(s.color)).filter((l: number | null): l is number => l !== null);
      if (luminances.length > 0) {
        const avgLuminance = luminances.reduce((a: number, b: number) => a + b, 0) / luminances.length;
        return avgLuminance < 0.5;
      }
    } else if ((backgroundSource.type === 'image' || backgroundSource.type === 'video') && backgroundSource.overlay) {
      // Check overlay color for image/video backgrounds
      const overlayLum = calcLuminance(backgroundSource.overlay);
      if (overlayLum !== null) {
        return overlayLum < 0.5;
      }
    }

    if (bgColor) {
      const lum = calcLuminance(bgColor);
      if (lum !== null) {
        return lum < 0.5;
      }
    }

    // Fallback when we can't infer luminance from the background
    if (pageSettings?.theme === 'dark') return true;
    if (pageSettings?.theme === 'light') return false;
    return false;
  })();

  const primaryColor = pageSettings?.primary_color || '#8B5CF6';
  const fontFamily = pageSettings?.font_family || 'Inter';

  return (
    <CanvasErrorBoundary fallbackMessage="Canvas rendering error" onReset={() => onSelect({ type: null, id: null, path: [] })}>
    <ThemeContext.Provider value={{ isDarkTheme, primaryColor }}>
    <FormStateContext.Provider value={{ values: formValues, checkboxValues, setValue, toggleCheckbox, isChecked, isPreviewMode }}>
      <div 
        ref={scrollContainerRef}
        className={cn(
          "flex-1 bg-canvas-bg canvas-grid overflow-y-auto overflow-x-hidden builder-scroll relative min-h-0",
          designMode === 'pan' && !isPanning && "cursor-grab",
          isPanning && "cursor-grabbing select-none",
          // Add preview mode wrapper class to trigger runtime CSS chrome stripping
          readOnly && "builder-v2-canvas--preview"
        )}
        onMouseDown={handlePanMouseDown}
        onMouseMove={handlePanMouseMove}
        onMouseUp={handlePanMouseUp}
        onMouseLeave={handlePanMouseUp}
        onClick={(e) => {
          // Click on canvas background (outside device frame) = clear selection
          if (e.target === e.currentTarget) {
            onSelect({ type: null, id: null, path: [] });
          }
        }}
      >
        {/* Grid Overlay */}
        {showGrid && (
          <div 
            className="absolute inset-0 pointer-events-none z-40"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
        )}
        
        {/* Minimal spacer at top - reduced from pt-4 to pt-1 to minimize gap above first section */}
        <div className="pt-1" />

        {/* Canvas Container with Device Frame */}
        <div className={cn('mx-auto px-8 pb-8 overflow-x-hidden', deviceWidths[deviceMode])}>
          {/* Device Frame - Apply theme settings and step/page background
              In readOnly mode (preview/runtime), DO NOT apply background here - 
              the root container already has the background for full-bleed effect */}
          <div 
            className={cn('device-frame relative min-h-[600px] overflow-x-hidden', isDarkTheme && 'dark-theme')}
            style={{ 
              fontFamily: fontFamily,
              '--primary-color': primaryColor,
              // Apply background in both editor and preview modes for visual parity
              ...getPageBackgroundStyles(
                (step.background && (step.background.type || step.background.color)) 
                  ? step.background 
                  : pageSettings?.page_background, 
                isDarkTheme
              ),
            } as React.CSSProperties}
            onClick={(e) => {
              // Click on empty device frame = clear selection (don't open settings panel)
              if (e.target === e.currentTarget) {
                onSelect({ type: null, id: null, path: [] });
              }
            }}
          >
            {/* Video Background (from step or page) - both editor and preview for parity */}
            {(() => {
              const hasStepBackground = step.background && (step.background.type || step.background.color);
              const bgSource = hasStepBackground ? step.background : pageSettings?.page_background;
              
              if (bgSource?.type === 'video' && bgSource.video) {
                const videoUrl = getVideoBackgroundUrl(bgSource.video);
                const opacity = (bgSource.videoOpacity ?? 100) / 100;
                
                if (videoUrl) {
                  return (
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                      {isDirectVideoUrl(bgSource.video) ? (
                        <video
                          src={videoUrl}
                          autoPlay={bgSource.videoAutoplay ?? true}
                          muted={bgSource.videoMuted ?? true}
                          loop={bgSource.videoLoop ?? true}
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ opacity }}
                        />
                      ) : (
                        <iframe
                          src={videoUrl}
                          className="absolute inset-0 w-full h-full scale-150"
                          style={{ opacity }}
                          allow="autoplay; fullscreen"
                          frameBorder={0}
                        />
                      )}
                    </div>
                  );
                }
              }
              return null;
            })()}
            
            {/* Background Overlay (from step or page) - editor only, runtime uses root */}
            {!readOnly && (() => {
              const hasStepBackground = step.background && (step.background.type || step.background.color);
              const bgSource = hasStepBackground ? step.background : pageSettings?.page_background;
              const overlayStyles = getOverlayStyles(bgSource);
              return overlayStyles ? (
                <div 
                  className="absolute inset-0 pointer-events-none z-[1]" 
                  style={overlayStyles} 
                />
              ) : null;
            })()}
            

            {/* Frames - wrapped in DndContext for drag-and-drop reordering */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleFrameDragEnd}
            >
              <SortableContext 
                items={step.frames.map(f => f.id)} 
                strategy={verticalListSortingStrategy}
              >
                <div className="min-h-[600px] relative z-10 group/canvas">
                  {step.frames.map((frame, frameIndex) => (
                    <React.Fragment key={frame.id}>
                      {/* Section Divider - visible between frames in editor only */}
                      {!readOnly && frameIndex > 0 && (
                        <div className="relative h-4 flex items-center px-4">
                          <div className="flex-1 h-[1px] bg-[hsl(var(--builder-border-subtle))]" />
                        </div>
                      )}
                      <SortableFrameRenderer
                        id={frame.id}
                        frame={frame}
                        frameIndex={frameIndex}
                        totalFrames={step.frames.length}
                        selection={selection}
                        onSelect={onSelect}
                        path={stepPath}
                        onReorderBlocks={onReorderBlocks}
                        onReorderElements={onReorderElements}
                        onAddBlock={onAddBlock}
                        onDuplicateBlock={onDuplicateBlock}
                        onDeleteBlock={onDeleteBlock}
                        onUpdateBlock={onUpdateBlock}
                        onUpdateElement={onUpdateElement}
                        onDuplicateElement={onDuplicateElement}
                        onDeleteElement={onDeleteElement}
                        onCopy={onCopy}
                        onPaste={onPaste}
                        canPaste={canPaste}
                        readOnly={readOnly}
                        isDarkTheme={isDarkTheme}
                        replayAnimationKey={replayAnimationKey}
                        deviceMode={deviceMode}
                        onNextStep={onNextStep}
                        onGoToStep={onGoToStep}
                        onFormSubmit={onFormSubmit}
                        onOpenBlockPickerInPanel={onOpenBlockPickerInPanel}
                        // Section actions
                        onMoveUp={frameIndex > 0 ? () => onReorderFrames?.(frameIndex, frameIndex - 1) : undefined}
                        onMoveDown={frameIndex < step.frames.length - 1 ? () => onReorderFrames?.(frameIndex, frameIndex + 1) : undefined}
                        onDuplicate={() => onDuplicateFrame?.(frame.id)}
                        onDelete={() => onDeleteFrame?.(frame.id)}
                        onAddAbove={() => onAddFrameAt?.('above', frame.id)}
                        onAddBelow={() => onAddFrameAt?.('below', frame.id)}
                        onRename={(newName) => onRenameFrame?.(frame.id, newName)}
                        selectedApplicationStepId={selectedApplicationStepId}
                        activeApplicationFlowBlockId={activeApplicationFlowBlockId}
                        selectedStepElement={selectedStepElement}
                        onSelectStepElement={onSelectStepElement}
                      />
                    </React.Fragment>
                  ))}
              
              {/* Empty canvas state - adapts to actual step background color */}
              {step.frames.length === 0 && !readOnly && onOpenSectionPicker && (() => {
                // Compute dark mode based on actual step/page background, not global theme setting
                const bgSource = (step.background && (step.background.type || step.background.color))
                  ? step.background
                  : pageSettings?.page_background;
                const bgColor = bgSource?.color || '#ffffff';
                // Simple luminance check: if background is dark, use light text
                const isBackgroundDark = (() => {
                  if (!bgColor || bgColor === 'transparent') return false;
                  const hex = bgColor.replace('#', '');
                  if (hex.length !== 6) return false;
                  const r = parseInt(hex.slice(0, 2), 16);
                  const g = parseInt(hex.slice(2, 4), 16);
                  const b = parseInt(hex.slice(4, 6), 16);
                  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                  return luminance < 0.5;
                })();

                return (
                  <div className="flex items-center justify-center min-h-[500px] px-4">
                    <div className="w-full max-w-md text-center">
                      {/* Icon - adapts to background */}
                      <div className={cn(
                        "w-16 h-16 mx-auto mb-4 rounded-xl border flex items-center justify-center",
                        isBackgroundDark
                          ? "bg-white/10 border-white/20"
                          : "bg-gray-100 border-gray-200"
                      )}>
                        <Layers className={cn("w-8 h-8", isBackgroundDark ? "text-white/50" : "text-gray-400")} />
                      </div>

                      {/* Title - adapts to background */}
                      <h2 className={cn(
                        "text-lg font-semibold mb-2",
                        isBackgroundDark ? "text-white" : "text-gray-900"
                      )}>
                        Add a Section
                      </h2>

                      {/* Subtitle - increase contrast on light backgrounds */}
                      <p className={cn(
                        "text-sm mb-6",
                        isBackgroundDark ? "text-white/70" : "text-gray-600"
                      )}>
                        Start building your page by adding sections
                      </p>

                      {/* Primary CTA - adapts to background */}
                      <button
                        onClick={() => onOpenSectionPicker()}
                        className={cn(
                          "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm",
                          "font-sans", // Explicit font-sans for Tailwind inheritance
                          isBackgroundDark
                            ? "bg-white text-gray-900 hover:bg-gray-100"
                            : "bg-gray-900 text-white hover:bg-gray-800"
                        )}
                        style={{ fontFamily: 'inherit' }}
                      >
                        <Plus size={18} />
                        Add Section
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Subtle Add Section button at bottom - adapts to actual background */}
              {step.frames.length > 0 && !readOnly && onOpenSectionPicker && (() => {
                const bgSource = (step.background && (step.background.type || step.background.color))
                  ? step.background
                  : pageSettings?.page_background;
                const bgColor = bgSource?.color || '#ffffff';
                const isBackgroundDark = (() => {
                  if (!bgColor || bgColor === 'transparent') return false;
                  const hex = bgColor.replace('#', '');
                  if (hex.length !== 6) return false;
                  const r = parseInt(hex.slice(0, 2), 16);
                  const g = parseInt(hex.slice(2, 4), 16);
                  const b = parseInt(hex.slice(4, 6), 16);
                  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                  return luminance < 0.5;
                })();

                return (
                  <div className="flex flex-col items-center py-8 group">
                    <button
                      onClick={() => onOpenSectionPicker()}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        "border-2 border-dashed",
                        isBackgroundDark
                          ? "border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300 hover:bg-gray-800"
                          : "border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <Plus size={18} />
                    </button>
                    <span className={cn(
                      "mt-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity",
                      isBackgroundDark ? "text-gray-500" : "text-gray-400"
                    )}>
                      Add Section
                    </span>
                  </div>
                );
              })()}
                </div>
              </SortableContext>
            </DndContext>

          </div>
        </div>

        {/* Bottom spacer */}
        <div className="pb-8" />
        
        {/* Form State Debug Panel - Only visible in preview mode with form data */}
        {isPreviewMode && Object.keys(formValues).length > 0 && (
          <div className="fixed bottom-4 right-4 p-3 bg-[hsl(var(--builder-surface))] backdrop-blur-sm border border-[hsl(var(--builder-border))] rounded-lg shadow-xl z-50 max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-[hsl(var(--builder-text))]">Form State</span>
            </div>
            <div className="space-y-1">
              {Object.entries(formValues).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-[hsl(var(--builder-text-muted))] font-mono truncate max-w-[100px]">{key}:</span>
                  <span className="text-[hsl(var(--builder-text))] font-mono truncate max-w-[120px]">{value || '(empty)'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </FormStateContext.Provider>
    </ThemeContext.Provider>
    </CanvasErrorBoundary>
  );
};