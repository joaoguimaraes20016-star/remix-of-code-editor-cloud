import React, { useState, useCallback, createContext, useContext, useEffect, useRef } from 'react';
import { Step, Frame, Stack, Block, Element, SelectionState, Page, VisibilitySettings, AnimationSettings, ElementStateStyles, DeviceModeType, PageBackground } from '../../types/infostack';
import { cn } from '@/lib/utils';
import { Type, Image, Video, Minus, ArrowRight, Plus, GripVertical, Check, Circle, Play, Eye, Sparkles, Smartphone, MousePointer2, Layout, Menu, Layers, LayoutGrid } from 'lucide-react';
import { getButtonIconComponent } from './ButtonIconPicker';
import { DeviceMode } from './TopToolbar';
import { BlockActionBar } from './BlockActionBar';
import { SectionActionBar } from './SectionActionBar';
import { UnifiedElementToolbar, UnifiedToolbarStyles } from './UnifiedElementToolbar';
import { AddSectionPopover } from './AddSectionPopover';
import { InlineTextEditor, TextStyles } from './InlineTextEditor';
import { evaluateVisibility } from '../hooks/useScrollAnimation';
import { gradientToCSS, cloneGradient, GradientValue } from './modals';
import { BuilderContextMenu } from './ContextMenu';
import { ApplicationFlowCard } from './ApplicationFlowCard';
import { useFlowContainerSafe, buttonActionToIntent, FlowIntent } from '../contexts/FlowContainerContext';
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

// Helper to get contrasting text color based on background luminance
function getContrastTextColor(backgroundColor: string): string {
  try {
    const hex = backgroundColor.replace('#', '');
    if (hex.length !== 6) return '#ffffff';
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1f2937' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}

// Tiny helper: derive a lighter shade from a hex color (used for theme-aware gradient fallbacks)
function lightenHex(hex: string, mixWithWhite = 0.28): string {
  try {
    const h = hex.replace('#', '').trim();
    if (h.length !== 6) return hex;

    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);

    const mix = (c: number) => Math.round(c + (255 - c) * mixWithWhite);
    const toHex = (n: number) => n.toString(16).padStart(2, '0');

    return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
  } catch {
    return hex;
  }
}

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
    default:
      styles.backgroundColor = defaultBg;
  }
  
  return styles;
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
}

// Button Action type
interface ButtonAction {
  type: 'url' | 'next-step' | 'go-to-step' | 'scroll' | 'submit' | 'download' | 'phone' | 'email';
  value?: string;
  openNewTab?: boolean;
}

// Theme context for passing dark mode state and primary color down
interface ThemeContextValue {
  isDarkTheme: boolean;
  primaryColor: string;
}

const ThemeContext = createContext<ThemeContextValue>({
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

// Convert video URL to embed URL
const getEmbedUrl = (url: string, platform: string): string => {
  if (platform === 'youtube') {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  if (platform === 'vimeo') {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
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

const SortableElementRenderer: React.FC<SortableElementRendererProps> = ({ 
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
}) => {
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
  
  // Wrapper ref for toolbar positioning - combines with dnd-kit's setNodeRef
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const combinedRef = React.useCallback((node: HTMLDivElement | null) => {
    wrapperRef.current = node;
    setNodeRef(node);
  }, [setNodeRef]);
  
  // Easing presets map
  const easingMap: Record<string, string> = {
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
    const easing = easingMap[baseStyles?.transitionEasing || 'ease'] || 'ease';
    const delay = baseStyles?.transitionDelay || '0ms';
    
    // Build transition for all commonly animated properties
    const properties = ['transform', 'opacity', 'background-color', 'color', 'border-color', 'box-shadow'];
    return properties.map(prop => `${prop} ${duration} ${easing} ${delay}`).join(', ');
  }, [element.stateStyles?.base?.transitionDuration, element.stateStyles?.base?.transitionEasing, element.stateStyles?.base?.transitionDelay]);
  
  // Style resolver: merges base → stateStyles → responsive overrides
  const resolveElementStyles = useCallback((): React.CSSProperties => {
    const base: React.CSSProperties = {};
    
    // Apply base styles from element.styles
    if (element.styles?.opacity) base.opacity = element.styles.opacity;
    if (element.styles?.backgroundColor) base.backgroundColor = element.styles.backgroundColor;
    if (element.styles?.borderRadius) base.borderRadius = element.styles.borderRadius;
    if (element.styles?.cursor) base.cursor = element.styles.cursor;
    if (element.styles?.display) base.display = element.styles.display;
    if (element.styles?.overflow) base.overflow = element.styles.overflow;
    
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
    
    // Apply responsive overrides based on deviceMode
    if (deviceMode !== 'desktop' && element.responsive?.[deviceMode]) {
      const deviceOverrides = element.responsive[deviceMode];
      if (deviceOverrides?.backgroundColor) base.backgroundColor = deviceOverrides.backgroundColor;
      if (deviceOverrides?.textColor) base.color = deviceOverrides.textColor;
      if (deviceOverrides?.borderColor) base.borderColor = deviceOverrides.borderColor;
      if (deviceOverrides?.opacity) base.opacity = deviceOverrides.opacity;
      // Responsive typography
      if (deviceOverrides?.fontSize) {
        const sizeMap: Record<string, string> = { sm: '0.875rem', md: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem' };
        base.fontSize = sizeMap[deviceOverrides.fontSize] || deviceOverrides.fontSize;
      }
      if (deviceOverrides?.lineHeight) base.lineHeight = deviceOverrides.lineHeight;
      if (deviceOverrides?.letterSpacing) {
        const spacingMap: Record<string, string> = { tighter: '-0.05em', tight: '-0.025em', normal: '0', wide: '0.025em', wider: '0.05em' };
        base.letterSpacing = spacingMap[deviceOverrides.letterSpacing] || '0';
      }
    }
    
    return base;
  }, [element.styles, element.stateStyles, element.responsive, currentInteractionState, deviceMode]);
  
  // Evaluate conditional visibility
  const visibility = element.visibility as VisibilitySettings | undefined;
  if (isPreviewMode && visibility?.conditions && visibility.conditions.length > 0) {
    const isVisible = evaluateVisibility(visibility.conditions, visibility.logic || 'and', formValues);
    if (!isVisible) return null;
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
    'builder-element-selectable builder-click-target rounded-lg group/element relative',
    stateStyleClass,
    isSelected && 'builder-element-selected',
    isMultiSelected && !isSelected && 'builder-multi-selected',
    isDragging && 'opacity-50 z-50',
    animationKey >= 0 && effectClass // Include key to force re-render
  );
  
  // Inject state styles CSS
  const stateStylesCSS = generateStateStylesCSS();
  
  // Helper to render visual indicator badges
  const renderIndicatorBadges = () => {
    if (readOnly || (!hasConditionalLogic && !hasAnimation && !hasResponsiveOverrides && !hasStateStyles)) {
      return null;
    }
    return (
      <div className="absolute -top-2 -right-2 flex gap-0.5 z-10">
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
  
  // Button click action handler - EMITS INTENT to FlowContainer (single source of truth)
  // Buttons do NOT know step order, validation, or form state. They ONLY emit intent.
  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    if (!isPreviewMode) {
      e.stopPropagation();
      onSelect();
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const action = element.props?.buttonAction as ButtonAction | undefined;
    const intent = buttonActionToIntent(action);
    
    if (intent) {
      // If FlowContainer is available, emit intent to it (PREFERRED)
      if (flowContainer) {
        // For submit intent, include form values
        if (intent.type === 'submit') {
          flowContainer.emitIntent({ type: 'submit', values: formValues });
        } else {
          flowContainer.emitIntent(intent);
        }
      } else {
        // Fallback to legacy callbacks for backwards compatibility
        // This path will be removed once FlowContainer is fully integrated
        switch (intent.type) {
          case 'next-step':
            onNextStep?.();
            break;
          case 'go-to-step':
            onGoToStep?.(intent.stepId);
            break;
          case 'submit':
            onFormSubmit?.(formValues);
            break;
          case 'url':
            if (intent.openNewTab) {
              window.open(intent.url, '_blank');
            } else {
              window.location.href = intent.url;
            }
            break;
          case 'scroll':
            document.querySelector(intent.selector)?.scrollIntoView({ behavior: 'smooth' });
            break;
          case 'phone':
            window.location.href = `tel:${intent.number}`;
            break;
          case 'email':
            window.location.href = `mailto:${intent.address}`;
            break;
          case 'download':
            window.open(intent.url, '_blank');
            break;
        }
      }
    }
  }, [isPreviewMode, element.props?.buttonAction, onSelect, flowContainer, formValues, onNextStep, onGoToStep, onFormSubmit]);

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
      
      // Line height
      if (element.props?.lineHeight) {
        styles.lineHeight = element.props.lineHeight as string;
      }
      
      // Letter spacing
      const letterSpacing = element.props?.letterSpacing as string;
      if (letterSpacing) {
        const spacingMap: Record<string, string> = { tighter: '-0.05em', tight: '-0.025em', normal: '0', wide: '0.025em', wider: '0.05em' };
        styles.letterSpacing = spacingMap[letterSpacing] || '0';
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
      
      // If using glow/neon and custom glow color, set CSS variable
      if ((shadow === 'glow' || shadow === 'neon') && glowColor) {
        // Convert hex to rgba for glow
        const hexToRgba = (hex: string, alpha: number) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        
        if (shadow === 'glow') {
          return {
            boxShadow: `0 0 15px ${hexToRgba(glowColor, 0.5)}, 0 4px 15px -3px rgba(0, 0, 0, 0.2)`
          };
        } else if (shadow === 'neon') {
          return {
            boxShadow: `0 0 5px ${hexToRgba(glowColor, 0.6)}, 0 0 15px ${hexToRgba(glowColor, 0.4)}, 0 0 30px ${hexToRgba(glowColor, 0.2)}`
          };
        }
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
            style={headingWrapperStyles}
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
                  if (Object.keys(propUpdates).length > 0) updates.props = { ...element.props, ...propUpdates };
                  if (Object.keys(styleUpdates).length > 0) updates.styles = { ...element.styles, ...styleUpdates } as Record<string, string>;
                  if (Object.keys(updates).length > 0) onUpdate?.(updates);
                }}
                onAlignChange={(align) => onUpdate?.({ props: { ...element.props, textAlign: align } })}
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
        
        const textContent = (
          <div 
            className={cn(
              !hasTextTypography && !isLogo && !isFooterLogo && !isFooterHeading && "text-base leading-relaxed", 
              isLogo ? "px-0 py-0" : isFooterLogo ? "px-0 py-0" : isFooterHeading ? "px-0 py-1" : "px-3 py-2", 
              !(element.props?.textColor || element.props?.textFillType === 'gradient') && !variantClasses && (isDarkTheme ? 'text-gray-300' : 'text-gray-600'),
              variantClasses,
              textLinkUrl && textLinkUnderline === 'always' && 'underline',
              textLinkUrl && textLinkUnderline === 'hover' && 'hover:underline',
              textLinkUrl && 'cursor-pointer'
            )} 
            style={textWrapperStyles}
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
                  if (Object.keys(propUpdates).length > 0) updates.props = { ...element.props, ...propUpdates };
                  if (Object.keys(styleUpdates).length > 0) updates.styles = { ...element.styles, ...styleUpdates } as Record<string, string>;
                  if (Object.keys(updates).length > 0) onUpdate?.(updates);
                }}
                onAlignChange={(align) => onUpdate?.({ props: { ...element.props, textAlign: align } })}
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
        const wrapperStyle: React.CSSProperties = {
          ...style,
          ...layoutStyles,
          // Use flexbox for reliable alignment
          display: 'flex',
          width: isNavPill || isFooterLink ? 'auto' : '100%',
          justifyContent: buttonAlignment === 'center' ? 'center' : 
                          buttonAlignment === 'right' ? 'flex-end' : 'flex-start',
        };
        
        // For outline mode, use foreground color; for filled, use the actual bg
        const effectiveBgForContrast = isOutlineMode ? (isDarkTheme ? '#1f2937' : '#ffffff') : (buttonBg || primaryColor);
        const buttonShadowStyle = getButtonShadowStyle();
        // Outline buttons get no shadow; filled buttons get shadow
        const defaultShadow = (isNavPill || isFooterLink || isGhostButton || isOutlineMode) 
          ? 'none' 
          : (isDarkTheme ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.2)');
        
        // Text color: outline uses foreground, filled uses contrast or user-set
        const buttonTextColor = isNavPill 
          ? (isDarkTheme ? '#ffffff' : '#1f2937')
          : isFooterLink 
            ? (isDarkTheme ? '#9ca3af' : '#6b7280')
            : isOutlineMode
              ? (isDarkTheme ? '#ffffff' : '#18181b') // Foreground for outline
              : (element.props?.textColor as string || getContrastTextColor(effectiveBgForContrast));
        
        // Border for outline mode
        const outlineBorderColor = isDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
        
        // SINGLE VISUAL SURFACE RULE:
        // - Outline mode: transparent bg + border, no shadow
        // - Solid/Gradient mode: filled bg, NO border, optional shadow
        const customButtonStyle: React.CSSProperties = {
          backgroundColor: isGradient ? undefined : buttonBg,
          background: buttonGradient,
          color: buttonTextColor,
          // Outline buttons get no shadow; filled buttons can have shadow
          boxShadow: (isOutlineMode || isNavPill || isFooterLink || isGhostButton) 
            ? 'none' 
            : (buttonShadowStyle.boxShadow || defaultShadow),
          // CRITICAL: Only outline mode gets border; filled buttons have NO border
          borderWidth: isOutlineMode ? '2px' : (isNavPill ? '1px' : '0'),
          borderColor: isOutlineMode 
            ? outlineBorderColor 
            : (isNavPill ? (isDarkTheme ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)') : 'transparent'),
          borderStyle: (isOutlineMode || isNavPill) ? 'solid' : 'none',
          borderRadius: isNavPill ? '9999px' : (element.styles?.borderRadius || '12px'),
          transition: `transform ${transitionDuration}ms ease, box-shadow ${transitionDuration}ms ease`,
          // Apply custom dimensions
          width: element.styles?.width || undefined,
          height: element.styles?.height || undefined,
          padding: isNavPill ? '8px 16px' : (isFooterLink ? '4px 0' : element.styles?.padding),
        };
        
        // Only apply size class if no custom padding and not a special variant
        const useSizeClass = !element.styles?.padding && !isNavPill && !isFooterLink;
        
        // SINGLE SURFACE: Wrapper is for layout/selection ONLY - no visual styles
        // The button element is the ONLY visual surface
        const wrapperClasses = cn(
          'builder-element-selectable builder-click-target group/element relative',
          // NO rounded-lg, NO background, NO border on wrapper
          stateStyleClass,
          isMultiSelected && !isSelected && 'builder-multi-selected',
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
                  const updates: Partial<Element> = {};
                  if (newStyles.backgroundColor) {
                    updates.styles = { ...element.styles, backgroundColor: newStyles.backgroundColor };
                  }
                  if (newStyles.fillType) {
                    updates.props = { ...element.props, fillType: newStyles.fillType };
                  }
                  if (newStyles.gradient) {
                    updates.props = { ...element.props, ...updates.props, gradient: newStyles.gradient };
                  }
                  if (Object.keys(updates).length > 0) onUpdate?.(updates);
                }}
                onAlignChange={(align) => onUpdate?.({ styles: { ...element.styles, textAlign: align } })}
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
                useSizeClass && buttonSizeClasses[buttonSize],
                buttonWeightClass[buttonFontWeight],
                isNavPill && 'rounded-full',
                isFooterLink && 'text-left',
                // Remove shadow-lg class - shadow is now fully controlled by inline style
                !isNavPill && !isFooterLink && "rounded-xl",
                "inline-flex items-center justify-center gap-2",
                // Only apply shadowClass if not outline mode (prevents class/style conflict)
                !isOutlineMode && shadowClass,
                // Apply selection ring to the actual button element
                isSelected && 'builder-element-selected'
              )}
              style={{
                ...customButtonStyle,
                transition: `transform ${transitionDuration}ms ease, box-shadow ${transitionDuration}ms ease, background-color ${transitionDuration}ms ease`,
              }}
              onClick={handleButtonClick}
            >
              {element.props?.showIcon !== false && element.props?.iconPosition === 'left' && renderButtonIcon()}
              <InlineTextEditor
                value={element.content || 'Get started'}
                onChange={handleContentChange}
                elementType="button"
                disabled={readOnly}
                className="text-inherit"
                elementId={element.id}
              />
              {element.props?.showIcon !== false && element.props?.iconPosition !== 'left' && renderButtonIcon()}
            </button>
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
        
        // Input styling props
        const inputIsGradient = element.props?.fillType === 'gradient';
        const inputBg = inputIsGradient 
          ? undefined 
          : (element.styles?.backgroundColor || (isDarkTheme ? '#1f2937' : '#ffffff'));
        const inputGradient = inputIsGradient 
          ? (element.styles?.background as string || 'linear-gradient(135deg, #8B5CF6, #D946EF)')
          : undefined;
        const inputTextColor = element.props?.textColor as string || (isDarkTheme ? '#ffffff' : '#1f2937');
        const inputPlaceholderColor = element.props?.placeholderColor as string || (isDarkTheme ? '#6b7280' : '#9ca3af');
        const inputBorderColor = element.styles?.borderColor || (isDarkTheme ? '#374151' : '#e5e7eb');
        const inputBorderRadius = element.styles?.borderRadius || '12px';
        const inputBorderWidth = element.styles?.borderWidth || '1px';
        const inputPadding = element.styles?.padding || '16px 20px';
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
                    onUpdate?.({ styles: { ...element.styles, backgroundColor: newStyles.backgroundColor } });
                  }
                }}
                onAlignChange={(align) => {
                  const margin = align === 'center' ? '0 auto' : align === 'right' ? '0 0 0 auto' : '';
                  onUpdate?.({ styles: { ...element.styles, margin, display: 'block' } });
                }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {/* Element drag handle is now integrated into UnifiedElementToolbar */}
            <div onClick={(e) => { if (!isPreviewMode) { e.stopPropagation(); onSelect(); } }}>
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
              <input
                type={(element.props?.type as string) || 'text'}
                placeholder={(element.props?.placeholder as string) || 'Enter text...'}
                className={cn(`input-${element.id}`)}
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
                  if (isPreviewMode) e.stopPropagation();
                }}
              />
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

      case 'image':
        const imgSrc = element.props?.src as string;
        const isLogoImage = element.props?.isLogo === true;
        // For logos, default to auto width to preserve aspect ratio; for regular images, default to 100%
        const defaultImageWidth = isLogoImage ? 'auto' : '100%';
        const imageStyles: React.CSSProperties = {
          width: element.styles?.width || defaultImageWidth,
          height: element.styles?.height || 'auto',
          maxWidth: element.styles?.maxWidth || (isLogoImage ? '180px' : 'none'),
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
                  isLogoImage ? "aspect-[3/1]" : "aspect-video",
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

      case 'video':
        const videoSettings = element.props?.videoSettings as { url?: string; platform?: string; autoplay?: boolean; muted?: boolean } | undefined;
        const videoUrl = videoSettings?.url;
        const videoPlatform = videoSettings?.platform || 'youtube';
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
        
        return (
          <div ref={combinedRef} style={videoWrapperStyles} className={cn(baseClasses, 'relative')} {...stateHandlers}>
            {/* Inject state styles CSS */}
            {stateStylesCSS && <style>{stateStylesCSS}</style>}
            {/* Visual indicator badges */}
            {renderIndicatorBadges()}
            {/* Unified Toolbar */}
            {!readOnly && (
              <UnifiedElementToolbar
                elementId={element.id}
                elementType="video"
                elementLabel="Video"
                isSelected={isSelected}
                targetRef={wrapperRef}
                deviceMode={deviceMode}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {/* Element drag handle integrated into toolbar */}
            {videoUrl ? (
              <div style={videoContainerStyles} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
                <iframe
                  src={getEmbedUrl(videoUrl, videoPlatform)}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div 
                className="bg-gray-900 flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors" 
                style={videoContainerStyles}
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
              >
                <div className="text-center">
                  <Play className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                  <span className="text-xs text-gray-500">Click to add video</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'divider':
        const dividerColor = element.styles?.borderColor || (isDarkTheme ? '#374151' : '#e5e7eb');
        const dividerHeight = element.styles?.height || '1px';
        
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
                styles={{ backgroundColor: dividerColor }}
                onStyleChange={(newStyles) => {
                  if (newStyles.backgroundColor) {
                    onUpdate?.({ styles: { ...element.styles, borderColor: newStyles.backgroundColor } });
                  }
                }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {/* Element drag handle integrated into toolbar */}
            <div className="w-full py-4" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
              <div 
                className="w-full" 
                style={{ 
                  backgroundColor: dividerColor,
                  height: dividerHeight,
                }}
              />
            </div>
          </div>
        );

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

      case 'icon':
        const iconName = element.content || 'star';
        const iconSize = element.styles?.fontSize || '24px';
        const iconColor = element.props?.color as string || (isDarkTheme ? '#9ca3af' : '#6b7280');
        
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
                styles={{ textColor: iconColor }}
                onStyleChange={(newStyles) => {
                  if (newStyles.textColor) {
                    onUpdate?.({ props: { ...element.props, color: newStyles.textColor } });
                  }
                }}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {/* Element drag handle integrated into toolbar */}
            <div 
              className="p-2 flex items-center justify-center"
              style={{ color: iconColor, fontSize: iconSize }}
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              {/* Render icon based on name - using Lucide icons */}
              {iconName === 'star' && <Sparkles style={{ width: iconSize, height: iconSize }} />}
              {iconName === 'check' && <Check style={{ width: iconSize, height: iconSize }} />}
              {iconName === 'arrow-right' && <ArrowRight style={{ width: iconSize, height: iconSize }} />}
              {iconName === 'play' && <Play style={{ width: iconSize, height: iconSize }} />}
              {!['star', 'check', 'arrow-right', 'play'].includes(iconName) && (
                <Sparkles style={{ width: iconSize, height: iconSize }} />
              )}
            </div>
          </div>
        );

      default:
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
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {/* Element drag handle integrated into toolbar */}
            <div 
              className={cn(
                "px-4 py-3 rounded-xl border",
                isDarkTheme ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
              )} 
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              <span className={cn("text-sm", isDarkTheme ? "text-gray-400" : "text-gray-500")}>{element.type}</span>
            </div>
          </div>
        );
    }
  };

  return renderElement();
};

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
    setActiveElementId(event.active.id as string);
  };

  const handleElementDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveElementId(null);

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
          'builder-block-selectable builder-click-target group/block relative p-4',
          isSelected && 'builder-block-selected',
          isMultiSelected && !isSelected && 'builder-multi-selected',
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
        'builder-block-selectable builder-click-target group/block relative',
        // Only apply default padding if the user hasn't set ANY padding styles (check for truthy non-empty values)
        !hasCustomPadding && (isNavbar ? 'py-4 px-8' : isFooter ? 'py-12 px-12' : 'p-6'),
        isSelected && 'builder-block-selected',
        isMultiSelected && !isSelected && 'builder-multi-selected',
        // Parent highlight when child element is selected
        hasSelectedChild && !isSelected && 'builder-parent-of-selected',
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
      {/* Block Type Badge - Shows on hover with blue styling */}
      <span className={cn('block-type-badge block-type-badge-block', getBlockBadgeClass())}>{blockTypeLabel}</span>
      
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
                  onMoveUp={() => {
                    // Move element up logic would need element reorder
                  }}
                  onMoveDown={() => {
                    // Move element down logic would need element reorder
                  }}
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
          'builder-block-selectable builder-click-target group/block relative',
          !hasCustomPadding && (isNavbar ? 'py-4 px-8' : isFooter ? 'py-12 px-12' : 'p-6'),
          isSelected && 'builder-block-selected',
          isMultiSelected && !isSelected && 'builder-multi-selected',
          hasSelectedChild && !isSelected && 'builder-parent-of-selected',
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
        <span className={cn('block-type-badge', getBlockBadgeClass())}>{blockTypeLabel}</span>
        
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
                    onMoveUp={() => {}}
                    onMoveDown={() => {}}
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
}) => {
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
        'builder-section-selectable group/section p-2 rounded-xl relative',
        isSelected && 'builder-section-selected',
        stack.direction === 'horizontal' ? 'flex flex-row gap-4' : 'flex flex-col gap-3'
      )}
      // No onClick here - clicking bubbles up to FrameRenderer which handles frame selection
    >
      {/* Content area - no badge, clicking selects parent frame */}
      {stack.blocks.length === 0 ? (
        // Polished empty state - matches the original "Add Block" design
        <div 
          onClick={(e) => {
            e.stopPropagation();
            // First select the parent frame, then open block picker
            selectParentFrame();
            onOpenBlockPickerInPanel?.(stack.id);
          }}
          className="w-full py-16 flex items-center justify-center cursor-pointer"
        >
          <div className="group flex flex-col items-center justify-center py-20 px-8 w-full max-w-2xl border-2 border-dashed border-purple-300/50 rounded-2xl bg-white hover:border-purple-400/60 transition-all duration-200">
            {/* Icon container */}
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
              <Layers size={32} className="text-gray-400" />
            </div>
            
            {/* Title */}
            <span className="text-lg font-semibold text-gray-800 mb-1">
              Add content to this section
            </span>
            
            {/* Subtitle */}
            <span className="text-sm text-gray-400 mb-6">
              Capture forms, questions, buttons & more
            </span>
            
            {/* Dark button */}
            <span className="inline-flex items-center gap-2 rounded-lg px-6 py-3 bg-gray-900 text-white text-sm font-semibold shadow-lg group-hover:bg-gray-800 transition-all">
              <Plus size={18} />
              <span>Insert Content</span>
            </span>
          </div>
        </div>
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
                  />
                ))}
            </SortableContext>
            <DragOverlay>
              {activeBlock ? <BlockDragOverlay block={activeBlock} /> : null}
            </DragOverlay>
          </DndContext>
          
          {/* Add content button */}
          {!readOnly && stack.blocks.length > 0 && (
            <div className="mt-3 opacity-60 hover:opacity-100 transition-opacity">
              <button
                onClick={() => onOpenBlockPickerInPanel?.(stack.id)}
                className="flex items-center justify-center gap-1.5 w-full py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Plus size={14} />
                <span>Add content</span>
              </button>
            </div>
          )}
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
      case 'glass':
        return { className: 'backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg' };
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
      case 'transparent':
      default:
        return { className: 'bg-transparent' };
    }
  };

  const frameStyles = getFrameBackgroundStyles();
  
  // Determine layout mode - 'contained' (centered box) or 'full-width' (edge-to-edge within device frame)
  // Default to full-width for better out-of-box experience
  const isFullWidth = frame.layout !== 'contained';
  
  return (
    <div
      className={cn(
        'overflow-visible transition-all relative group/frame cursor-pointer',
        // Apply rounded corners and centering only for contained layout
        !isFullWidth && 'rounded-2xl mx-auto',
        frameStyles.className,
        isSelected && 'ring-2 ring-builder-accent shadow-[0_0_0_4px_hsl(var(--builder-accent)/0.15)]'
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
      {/* Apply dynamic padding and spacing based on frame settings */}
      <div 
        style={{
          paddingTop: frame.paddingVertical || 32,
          paddingBottom: frame.paddingVertical || 32,
          paddingLeft: isFullWidth ? 16 : (frame.paddingHorizontal || 32),
          paddingRight: isFullWidth ? 16 : (frame.paddingHorizontal || 32),
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
  const isDarkTheme = pageSettings?.theme === 'dark';
  const primaryColor = pageSettings?.primary_color || '#8B5CF6';
  const fontFamily = pageSettings?.font_family || 'Inter';

  return (
    <ThemeContext.Provider value={{ isDarkTheme, primaryColor }}>
    <FormStateContext.Provider value={{ values: formValues, checkboxValues, setValue, toggleCheckbox, isChecked, isPreviewMode }}>
      <div 
        ref={scrollContainerRef}
        className={cn(
          "flex-1 bg-canvas-bg canvas-grid overflow-y-auto overflow-x-hidden builder-scroll relative min-h-0",
          designMode === 'pan' && !isPanning && "cursor-grab",
          isPanning && "cursor-grabbing select-none"
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
        
        {/* Spacer at top */}
        <div className="pt-4" />

        {/* Canvas Container with Device Frame */}
        <div className={cn('mx-auto px-8 pb-8 overflow-x-hidden', deviceWidths[deviceMode])}>
          {/* Device Frame - Apply theme settings and step/page background */}
          <div 
            className={cn('device-frame relative min-h-[600px] overflow-x-hidden', isDarkTheme && 'dark-theme')}
            style={{ 
              fontFamily: fontFamily,
              '--primary-color': primaryColor,
              // Use step.background only if it has meaningful content, otherwise fall back to page background
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
            {/* Background Overlay (from step or page) */}
            {(() => {
              const hasStepBackground = step.background && (step.background.type || step.background.color);
              const bgSource = hasStepBackground ? step.background : pageSettings?.page_background;
              const overlayStyles = getOverlayStyles(bgSource);
              return overlayStyles ? (
                <div 
                  className="absolute inset-0 pointer-events-none z-0" 
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
                      {/* Section Divider - always visible between frames for clarity */}
                      {/* Simple divider line between sections */}
                      {frameIndex > 0 && (
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
                      />
                    </React.Fragment>
                  ))}
              
              {/* Empty canvas state - Simple "Add Section" prompt */}
              {step.frames.length === 0 && !readOnly && onOpenSectionPicker && (
                <div className="flex items-center justify-center min-h-[500px] px-4">
                  <div className="w-full max-w-md text-center">
                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <Layers className="w-8 h-8 text-gray-400" />
                    </div>
                    
                    {/* Title */}
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      Add a Section
                    </h2>
                    
                    {/* Subtitle */}
                    <p className="text-sm text-gray-500 mb-6">
                      Start building your page by adding sections
                    </p>
                    
                    {/* Primary CTA */}
                    <button
                      onClick={() => onOpenSectionPicker()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all shadow-sm"
                    >
                      <Plus size={18} />
                      Add Section
                    </button>
                  </div>
                </div>
              )}
              
              {/* Subtle Add Section button at bottom - only when content exists */}
              {step.frames.length > 0 && !readOnly && onOpenSectionPicker && (
                <div className="flex flex-col items-center py-8 group">
                  <button
                    onClick={() => onOpenSectionPicker()}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      "border-2 border-dashed",
                      isDarkTheme 
                        ? "border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300 hover:bg-gray-800" 
                        : "border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <Plus size={18} />
                  </button>
                  <span className={cn(
                    "mt-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity",
                    isDarkTheme ? "text-gray-500" : "text-gray-400"
                  )}>
                    Add Section
                  </span>
                </div>
              )}
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
  );
};