import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Page, 
  Step, 
  Block, 
  Element, 
  Frame,
  SelectionState,
  StepIntent,
  StepType,
  SubmitMode,
  ConditionalRule,
  VisibilitySettings,
  AnimationSettings
} from '../../types/infostack';
import { findNodeByPath, findNodeById } from '../utils/helpers';
import { collectFieldKeys } from '../hooks/useScrollAnimation';
import { 
  getBlockTypeLabel, 
  getBlockCategory,
  shouldShowLayoutControls,
  getElementTypeLabel, 
  stepIntentLabels, 
  stepTypeLabels, 
  submitModeLabels,
  formatRelativeTime,
  cursorOptions,
  overflowOptions
} from '../utils/labels';
import { 
  backgroundColorPresets, 
  textColorPresets, 
  elementColorPresets,
  highlightPresets,
  gradientPresets 
} from '../utils/presets';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SelectionBreadcrumb } from './SelectionBreadcrumb';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Settings2, 
  Type, 
  Palette, 
  Layout, 
  Layers,
  MousePointer2,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Plus,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Clock,
  Check,
  ExternalLink,
  Image,
  Video,
  Play,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Copy,
  Trash2,
  MoveUp,
  MoveDown,
  Square,
  BoxSelect,
  ArrowUpDown,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  Rows,
  Columns,
  Timer,
  Zap,
  Info,
  Monitor,
  Tablet,
  Smartphone
} from 'lucide-react';
import { 
  EffectsPickerPopover, 
  OverlayPickerPopover, 
  ColorPickerPopover,
  GradientPickerPopover,
  gradientToCSS,
  cloneGradient,
  ButtonActionModal,
  VideoEmbedModal,
  ImagePickerModal
} from './modals';
import { BackgroundEditor, BackgroundValue, backgroundValueToCSS } from './BackgroundEditor';
import type { GradientValue, ButtonAction, VideoSettings } from './modals';
import { toast } from 'sonner';
import { useInlineEdit } from '../contexts/InlineEditContext';
import { ButtonIconPicker } from './ButtonIconPicker';

interface RightPanelProps {
  page: Page;
  selection: SelectionState;
  onUpdateNode: (path: string[], updates: Record<string, unknown>) => void;
  onClearSelection: () => void;
  onPublish?: () => void;
  // Element action callbacks
  onDuplicateElement?: (elementId: string) => void;
  onDeleteElement?: (elementId: string) => void;
  onMoveElement?: (elementId: string, direction: 'up' | 'down') => void;
  // Direct element update for better prop merging
  onUpdateElement?: (elementId: string, updates: Partial<Element>) => void;
  // Animation replay callback
  onReplayAnimation?: (elementId: string) => void;
  // Current device mode for responsive editing
  currentDeviceMode?: 'desktop' | 'tablet' | 'mobile';
  // Frame/Section action callbacks
  onDeleteFrame?: (frameId: string) => void;
  onDuplicateFrame?: (frameId: string) => void;
  onMoveFrame?: (frameId: string, direction: 'up' | 'down') => void;
  onAddFrameAt?: (position: 'above' | 'below', referenceFrameId: string) => void;
  // Frame index info for move buttons
  activeStep?: Step | null;
}

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
  sectionId?: string;
  isHighlighted?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  icon,
  defaultOpen = false, 
  children,
  badge,
  sectionId,
  isHighlighted = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sectionRef = React.useRef<HTMLDivElement>(null);

  // Auto-open and scroll when highlighted
  useEffect(() => {
    if (isHighlighted && sectionRef.current) {
      setIsOpen(true);
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [isHighlighted]);

  return (
    <div 
      ref={sectionRef}
      id={sectionId}
      className={cn(
        "inspector-section transition-all duration-200",
        isHighlighted && "ring-1 ring-[hsl(315,85%,58%)] bg-[hsl(315,85%,58%)]/5"
      )}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="inspector-section-header w-full"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-builder-text-muted">{icon}</span>}
          <span className="text-xs font-medium text-builder-text">{title}</span>
          {badge}
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-builder-text-dim" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-builder-text-dim" />
        )}
      </button>
      {isOpen && (
        <div className="inspector-section-content animate-in">
          {children}
        </div>
      )}
    </div>
  );
};

const FieldGroup: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-builder-text-muted">{label}</Label>
    {children}
    {hint && <p className="text-[10px] text-builder-text-dim">{hint}</p>}
  </div>
);

// TogglePill: value=true means first option is active, value=false means second option is active
const TogglePill: React.FC<{ value: boolean; onToggle: () => void; labels?: [string, string] }> = ({ 
  value, 
  onToggle,
  labels = ['Yes', 'No']
}) => (
  <div className="toggle-pill">
    <button 
      onClick={() => { if (!value) onToggle(); }}
      className={cn('toggle-pill-option', value ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive')}
    >
      {labels[0]}
    </button>
    <button 
      onClick={() => { if (value) onToggle(); }}
      className={cn('toggle-pill-option', !value ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive')}
    >
      {labels[1]}
    </button>
  </div>
);

// PublishToggle removed - Draft/Live toggle was non-functional and confusing
// Publish is now handled by the dedicated "Publish Changes" button in SiteInfo

// Site Info Section
const SiteInfo: React.FC<{ page: Page; onPublish?: () => void }> = ({ page, onPublish }) => {
  const domain = page.slug ? `${page.slug}.yoursite.app` : 'yoursite.app';
  const lastUpdated = formatRelativeTime(page.updated_at);
  
  return (
    <div className="p-4 border-b border-builder-border space-y-3">
      <div className="flex items-center gap-2">
        <LinkIcon className="w-4 h-4 text-builder-text-muted" />
        <a 
          href={`https://${domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-builder-accent hover:underline flex items-center gap-1"
        >
          {domain}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-builder-text-muted" />
        <span className="text-xs text-builder-text-muted">Updated {lastUpdated}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-builder-success/20 flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-builder-success" />
        </div>
        <span className="text-xs text-builder-text-muted">All changes saved</span>
      </div>
      <button 
        onClick={onPublish}
        className="w-full py-2.5 rounded-lg bg-builder-accent text-white text-sm font-semibold hover:brightness-110 transition-all"
      >
        Publish Changes
      </button>
    </div>
  );
};

// Element Type Section Config - defines which sections show for each element type
// SIMPLIFIED: Removed 'states' from text/heading - only buttons need hover states
const ELEMENT_SECTIONS = {
  button: ['action', 'appearance', 'animation', 'advanced'],
  text: ['typography', 'animation'],
  heading: ['typography', 'animation'],
  image: ['source', 'size', 'animation'],
  video: ['source', 'size'],
  input: ['field', 'inputStyle'],
  select: ['field', 'inputStyle'],
  checkbox: ['field'],
  radio: ['field'],
  divider: ['dividerStyle'],
  spacer: ['spacerStyle'],
} as const;

type ElementSectionType = keyof typeof ELEMENT_SECTIONS;

// Helper to parse font size to number (handles 'px', preset names, or raw numbers)
const parseFontSize = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Handle 'px' suffix
    if (value.endsWith('px')) return parseInt(value, 10) || 16;
    // Handle preset names
    const presets: Record<string, number> = {
      'xs': 12, 'sm': 14, 'base': 16, 'md': 16, 'lg': 20, 'xl': 24, 
      '2xl': 30, '3xl': 36, '4xl': 48, '5xl': 60, '6xl': 72
    };
    if (presets[value]) return presets[value];
    // Try parsing as number
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return 16; // default
};

// Element Inspector - Contextual sections based on element type
const ElementInspector: React.FC<{ 
  element: Element; 
  onUpdate: (updates: Partial<Element>) => void;
  steps?: { id: string; name: string }[];
  allSteps?: Step[];
  onDuplicate?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onReplayAnimation?: () => void;
  currentDeviceMode?: 'desktop' | 'tablet' | 'mobile';
}> = ({ 
  element, 
  onUpdate,
  steps = [],
  allSteps = [],
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onReplayAnimation,
  currentDeviceMode = 'desktop',
}) => {
  const [activeState, setActiveState] = useState<'base' | 'hover' | 'active' | 'disabled'>('base');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  
  // When a text element is being edited, route Right Panel fill changes to the selection
  const { applyInlineStyle, hasActiveEditor, getInlineSelectionStyles } = useInlineEdit();

  // Force re-render while selection changes so the inspector reflects the *actual selected span* styles
  const [selectionTick, setSelectionTick] = useState(0);

   useEffect(() => {
     if (element.type !== 'text' && element.type !== 'heading') return;
     if (!hasActiveEditor(element.id)) return;

     let raf = 0;
     const onSel = () => {
       cancelAnimationFrame(raf);
       raf = requestAnimationFrame(() => setSelectionTick((t) => t + 1));
     };

     document.addEventListener('selectionchange', onSel);
     return () => {
       cancelAnimationFrame(raf);
       document.removeEventListener('selectionchange', onSel);
     };
   }, [element.id, element.type, hasActiveEditor]);

  const inlineSelectionStyles = useMemo(
    () => getInlineSelectionStyles(element.id),
    [getInlineSelectionStyles, element.id, selectionTick]
  );

  // Compute the actual rendered text color from the DOM element when no explicit color is set
  const computedTextColorFallback = useMemo(() => {
    // Try to get the actual rendered color from the canvas element
    const canvasElement = document.querySelector(`[data-element-id="${element.id}"]`);
    if (canvasElement) {
      const computed = window.getComputedStyle(canvasElement).color;
      // Normalize rgb() to hex for consistent display
      if (computed && computed !== 'transparent') {
        const match = computed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (match) {
          const [, r, g, b] = match.map(Number);
          const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
          return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        }
      }
    }
    return '#000000'; // Default fallback (black text is more common than white)
  }, [element.id, selectionTick]);

  const effectiveTextFillType = inlineSelectionStyles?.textFillType ?? (element.props?.textFillType as any);
  const rawTextColor = inlineSelectionStyles?.textColor ?? (element.props?.textColor as string | undefined);
  // Use computed fallback when no explicit color is set
  const effectiveTextColor = rawTextColor || computedTextColorFallback;
  const effectiveTextGradient = inlineSelectionStyles?.textGradient ?? (element.props?.textGradient as GradientValue | undefined);

  const [isButtonActionOpen, setIsButtonActionOpen] = useState(false);
  const [isVideoEmbedOpen, setIsVideoEmbedOpen] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  // Get which sections to show for this element type
  const elementType = element.type as ElementSectionType;
  const sectionsToShow = ELEMENT_SECTIONS[elementType] || ['advanced'];
  
  // Get the primary section for this element type (first one in the list)
  const primarySection = sectionsToShow[0];

  // Auto-scroll to the primary section when element changes
  useEffect(() => {
    if (primarySection && containerRef.current) {
      // Highlight the primary section briefly
      setHighlightedSection(primarySection);
      
      // Remove highlight after animation
      const timer = setTimeout(() => {
        setHighlightedSection(null);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [element.id, primarySection]);

  const handleStyleChange = (key: string, value: string) => {
    if (activeState !== 'base') {
      const currentStateStyles = element.stateStyles || { base: {} };
      onUpdate({ 
        stateStyles: {
          ...currentStateStyles,
          [activeState]: {
            ...(currentStateStyles[activeState] || {}),
            [key]: value
          }
        }
      });
    } else {
      onUpdate({ styles: { ...element.styles, [key]: value } });
    }
  };

  const handlePropsChange = (key: string, value: unknown) => {
    onUpdate({ props: { ...element.props, [key]: value } });
  };

  // Atomic update of multiple props at once to prevent race conditions
  const handleMultiPropsChange = (updates: Record<string, unknown>) => {
    onUpdate({ props: { ...element.props, ...updates } });
  };

  const handleResponsiveStyleChange = (key: string, value: string) => {
    if (currentDeviceMode === 'desktop') {
      handleStyleChange(key, value);
    } else {
      const currentResponsive = element.responsive || {};
      onUpdate({
        responsive: {
          ...currentResponsive,
          [currentDeviceMode]: {
            ...(currentResponsive[currentDeviceMode] || {}),
            [key]: value
          }
        }
      });
    }
  };

  const handleButtonActionSave = (action: ButtonAction) => {
    onUpdate({ props: { ...element.props, buttonAction: action } });
    toast.success('Button action saved');
  };

  const handleVideoSettingsSave = (settings: VideoSettings) => {
    onUpdate({ props: { ...element.props, videoSettings: settings } });
    toast.success('Video settings saved');
  };

  const handleImageSelect = (url: string) => {
    onUpdate({ props: { ...element.props, src: url } });
  };

  const buttonAction = element.props?.buttonAction as ButtonAction | null;
  const videoSettings = element.props?.videoSettings as VideoSettings | null;

  // Check if states section should show - ONLY for buttons now
  const showStates = element.type === 'button';
  const showAnimation = (sectionsToShow as readonly string[]).includes('animation');

  return (
    <div ref={containerRef} className="space-y-0">
      {/* Element Type Header with Quick Actions - Pink for Element level */}
      <div className="px-4 py-3 border-b border-builder-border bg-gradient-to-r from-[hsl(315,85%,58%,0.1)] to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[hsl(315,85%,58%,0.15)] flex items-center justify-center">
              {element.type === 'button' && <MousePointer2 className="w-4 h-4 text-[hsl(315,85%,70%)]" />}
              {element.type === 'image' && <Image className="w-4 h-4 text-[hsl(315,85%,70%)]" />}
              {element.type === 'video' && <Video className="w-4 h-4 text-[hsl(315,85%,70%)]" />}
              {['input', 'select'].includes(element.type) && <Type className="w-4 h-4 text-[hsl(315,85%,70%)]" />}
              {!['button', 'image', 'video', 'input', 'select'].includes(element.type) && <Type className="w-4 h-4 text-[hsl(315,85%,70%)]" />}
            </div>
            <div>
              <p className="text-sm font-medium text-builder-text">{getElementTypeLabel(element.type)}</p>
              <p className="text-[10px] text-[hsl(315,85%,65%)]">Element</p>
            </div>
          </div>
          {/* Quick Actions */}
          <div className="flex items-center gap-0.5">
            <button onClick={onMoveUp} className="p-1.5 rounded-md bg-builder-surface-hover text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-active transition-colors" title="Move Up">
              <MoveUp className="w-3.5 h-3.5" />
            </button>
            <button onClick={onMoveDown} className="p-1.5 rounded-md bg-builder-surface-hover text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-active transition-colors" title="Move Down">
              <MoveDown className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDuplicate} className="p-1.5 rounded-md bg-builder-surface-hover text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-active transition-colors" title="Duplicate">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-md bg-builder-surface-hover text-builder-text-muted hover:text-destructive hover:bg-destructive/15 transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========== QUICK ANIMATION (Easy to find!) ========== */}
      {showAnimation && (
        <div className="px-4 py-3 border-b border-builder-border bg-gradient-to-r from-[hsl(315,85%,58%)]/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[hsl(315,85%,58%)]" />
              <span className="text-xs font-medium text-builder-text">Animation</span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Replay button - only show when animation is set */}
              {element.animation?.effect && onReplayAnimation && (
                <button
                  onClick={onReplayAnimation}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-builder-surface-hover text-builder-text-muted hover:text-[hsl(315,85%,58%)] hover:bg-[hsl(315,85%,58%)]/10 transition-colors text-xs"
                  title="Replay animation"
                >
                  <Play className="w-3 h-3" />
                </button>
              )}
              <EffectsPickerPopover 
                onSelectEffect={(effect) => {
                  onUpdate({ 
                    animation: { 
                      ...(element.animation || {}), 
                      effect,
                      trigger: element.animation?.trigger || 'scroll',
                      delay: element.animation?.delay || 0,
                      duration: element.animation?.duration || 500,
                      easing: element.animation?.easing || 'ease-out',
                      threshold: element.animation?.threshold || 0.1
                    } as AnimationSettings
                  });
                }} 
                currentEffect={element.animation?.effect}
              >
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(315,85%,58%)]/10 text-[hsl(315,85%,58%)] text-xs font-medium hover:bg-[hsl(315,85%,58%)]/20 transition-colors border border-[hsl(315,85%,58%)]/20">
                  {element.animation?.effect ? (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span className="capitalize">{element.animation.effect.replace('-', ' ')}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>Add Effect</span>
                    </>
                  )}
                </button>
              </EffectsPickerPopover>
            </div>
          </div>
          {element.animation?.effect && (
            <div className="mt-3 space-y-3">
              {/* Trigger selector */}
              <div className="flex items-center gap-2">
                <Select 
                  value={element.animation?.trigger || 'scroll'}
                  onValueChange={(value) => onUpdate({ animation: { ...(element.animation || { effect: '', delay: 0, duration: 500, easing: 'ease-out', threshold: 0.1 }), trigger: value as any } as AnimationSettings })}
                >
                  <SelectTrigger className="builder-input h-7 text-xs flex-1">
                    <SelectValue placeholder="Trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="load">On Page Load</SelectItem>
                    <SelectItem value="scroll">When Scrolled Into View</SelectItem>
                    <SelectItem value="hover">On Hover</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={() => onUpdate({ animation: undefined })}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-builder-text-muted hover:text-destructive transition-colors"
                  title="Remove animation"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {/* Duration slider with real-time feedback */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Duration</span>
                  <span className="text-xs font-mono text-builder-text-dim">{element.animation?.duration || 500}ms</span>
                </div>
                <Slider 
                  value={[element.animation?.duration || 500]}
                  onValueChange={(v) => onUpdate({ 
                    animation: { 
                      ...(element.animation || { effect: '', trigger: 'scroll', delay: 0, easing: 'ease-out', threshold: 0.1 }), 
                      duration: v[0] 
                    } as AnimationSettings 
                  })}
                  min={100}
                  max={2000}
                  step={50}
                  className="w-full"
                />
              </div>
              
              {/* Delay slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Delay</span>
                  <span className="text-xs font-mono text-builder-text-dim">{element.animation?.delay || 0}ms</span>
                </div>
                <Slider 
                  value={[element.animation?.delay || 0]}
                  onValueChange={(v) => onUpdate({ 
                    animation: { 
                      ...(element.animation || { effect: '', trigger: 'scroll', duration: 500, easing: 'ease-out', threshold: 0.1 }), 
                      delay: v[0] 
                    } as AnimationSettings 
                  })}
                  min={0}
                  max={2000}
                  step={50}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* State Tabs - ONLY for buttons */}
      {showStates && (
        <div className="px-4 py-2 border-b border-builder-border">
          <p className="text-[10px] text-builder-text-dim mb-2">Style button for different interaction states:</p>
          <div className="flex gap-1">
            {(['base', 'hover', 'active'] as const).map((state) => {
              const hasStylesForState = state !== 'base' && 
                element.stateStyles?.[state] && 
                Object.keys(element.stateStyles[state] || {}).length > 0;
              
              const stateLabels = {
                base: 'Default',
                hover: 'Mouse Over', 
                active: 'Clicked'
              };
              
              return (
                <button
                  key={state}
                  onClick={() => setActiveState(state)}
                  className={cn(
                    'state-tab flex items-center gap-1',
                    activeState === state ? 'state-tab-active' : 'state-tab-inactive'
                  )}
                >
                  {stateLabels[state]}
                  {hasStylesForState && (
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* State-Specific Controls Panel */}
      {showStates && activeState !== 'base' && (
        <div className="px-4 py-3 border-b border-builder-border bg-builder-surface-hover/30 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <MousePointer2 className="w-3.5 h-3.5 text-builder-accent" />
            <span className="text-xs font-medium text-builder-text capitalize">{activeState} State</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Background</span>
            <ColorPickerPopover
              color={(element.stateStyles?.[activeState]?.backgroundColor as string) || 'transparent'}
              onChange={(color) => handleStyleChange('backgroundColor', color)}
            >
              <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.stateStyles?.[activeState]?.backgroundColor as string) || 'transparent' }} />
                <span className="text-xs text-builder-text-muted">Edit</span>
              </button>
            </ColorPickerPopover>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Scale</span>
            <Select 
              value={(element.stateStyles?.[activeState]?.scale as string) || 'none'}
              onValueChange={(value) => handleStyleChange('scale', value === 'none' ? '' : value)}
            >
              <SelectTrigger className="builder-input w-24"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="0.95">Shrink (95%)</SelectItem>
                <SelectItem value="1.02">Subtle (102%)</SelectItem>
                <SelectItem value="1.05">Medium (105%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <button
            onClick={() => {
              const newStateStyles = { ...(element.stateStyles || {}) };
              delete (newStateStyles as Record<string, unknown>)[activeState];
              onUpdate({ stateStyles: newStateStyles as any });
              toast.info(`${activeState} state cleared`);
            }}
            className="w-full py-1.5 text-xs text-builder-text-muted hover:text-destructive border border-builder-border rounded-md hover:border-destructive/50 transition-colors"
          >
            Clear {activeState} state
          </button>
        </div>
      )}

      {/* ========== BUTTON SECTIONS ========== */}
      {element.type === 'button' && (
        <>
          {/* Click Action */}
          <CollapsibleSection title="Click Action" icon={<MousePointer2 className="w-4 h-4" />} defaultOpen sectionId="action" isHighlighted={highlightedSection === 'action'}>
            <div className="pt-3 space-y-3">
              <div className="p-3 rounded-lg border border-builder-border bg-builder-surface-hover">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-builder-text">
                    {buttonAction?.type ? buttonAction.type.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'No action set'}
                  </span>
                </div>
                {buttonAction?.value && (
                  <p className="text-xs text-builder-text-muted truncate">{buttonAction.value}</p>
                )}
              </div>
              <Button variant="outline" onClick={() => setIsButtonActionOpen(true)} className="w-full border-builder-border text-builder-text hover:bg-builder-surface-hover">
                <Settings2 className="w-4 h-4 mr-2" />
                Configure Action
              </Button>
            </div>
          </CollapsibleSection>

          {/* Button Appearance */}
          <CollapsibleSection title="Appearance" icon={<Palette className="w-4 h-4" />} defaultOpen sectionId="appearance" isHighlighted={highlightedSection === 'appearance'}>
            <div className="pt-3 space-y-3">
              {/* Fill Type Toggle - ATOMIC UPDATES */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Fill</span>
                <div className="flex rounded-lg overflow-hidden border border-builder-border">
                  <button
                    onClick={() => {
                      // Atomic update: set fillType and ensure backgroundColor exists
                      const bg = element.styles?.backgroundColor || '#8B5CF6';
                      handleMultiPropsChange({ fillType: 'solid' });
                      handleStyleChange('backgroundColor', bg);
                    }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium transition-colors",
                      element.props?.fillType !== 'gradient'
                        ? 'bg-builder-accent text-white' 
                        : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface'
                    )}
                  >
                    Solid
                  </button>
                  <button
                    onClick={() => {
                      // Atomic update: set fillType and ensure gradient exists
                      const existingGradient = element.props?.gradient as GradientValue | undefined;
                      const gradient = existingGradient || {
                        type: 'linear' as const,
                        angle: 135,
                        stops: [
                          { color: '#8B5CF6', position: 0 },
                          { color: '#D946EF', position: 100 },
                        ],
                      };
                      handleMultiPropsChange({ 
                        fillType: 'gradient',
                        gradient: cloneGradient(gradient),
                      });
                    }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium transition-colors",
                      element.props?.fillType === 'gradient'
                        ? 'bg-builder-accent text-white' 
                        : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface'
                    )}
                  >
                    Gradient
                  </button>
                </div>
              </div>
              
              {/* Solid Color */}
              {element.props?.fillType !== 'gradient' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Background</span>
                  <ColorPickerPopover color={element.styles?.backgroundColor as string || '#8B5CF6'} onChange={(color) => handleStyleChange('backgroundColor', color)}>
                    <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                      <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: element.styles?.backgroundColor as string || '#8B5CF6' }} />
                      <span className="text-xs text-builder-text font-mono">{element.styles?.backgroundColor || '#8B5CF6'}</span>
                    </button>
                  </ColorPickerPopover>
                </div>
              )}
              
              {/* Gradient */}
              {element.props?.fillType === 'gradient' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Gradient</span>
                  <GradientPickerPopover
                    value={element.props?.gradient as GradientValue | undefined}
                    onChange={(gradient) => {
                      // Clone gradient and store it - CanvasRenderer will convert to CSS
                      handlePropsChange('gradient', cloneGradient(gradient));
                    }}
                  >
                    <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                      <div 
                        className="w-12 h-6 rounded-md border border-builder-border" 
                        style={{ 
                          background: element.props?.gradient 
                            ? gradientToCSS(element.props.gradient as GradientValue) 
                            : 'linear-gradient(135deg, #8B5CF6, #D946EF)' 
                        }} 
                      />
                      <span className="text-xs text-builder-text-muted">Edit</span>
                    </button>
                  </GradientPickerPopover>
                </div>
              )}
              
              {/* Text Color */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Text Color</span>
                <ColorPickerPopover color={element.props?.textColor as string || '#ffffff'} onChange={(color) => handlePropsChange('textColor', color)}>
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: element.props?.textColor as string || '#ffffff' }} />
                    <span className="text-xs text-builder-text font-mono">{(element.props?.textColor as string) || '#ffffff'}</span>
                  </button>
                </ColorPickerPopover>
              </div>
              
              {/* Border Radius */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Radius</span>
                <div className="flex items-center gap-2">
                  <Slider 
                    value={[parseInt(element.styles?.borderRadius as string || '12')]}
                    onValueChange={(v) => handleStyleChange('borderRadius', `${v[0]}px`)}
                    min={0} max={50} step={2} className="w-20"
                  />
                  <span className="text-xs text-builder-text w-10">{element.styles?.borderRadius || '12px'}</span>
                </div>
              </div>
              
              {/* Icon */}
              {element.props?.showIcon !== false && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Icon</span>
                  <ButtonIconPicker 
                    value={element.props?.iconType as string || 'ArrowRight'} 
                    onChange={(value) => handlePropsChange('iconType', value)}
                  />
                </div>
              )}
              
              {/* Size Preset */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Size</span>
                <Select value={element.props?.buttonSize as string || 'md'} onValueChange={(value) => handlePropsChange('buttonSize', value)}>
                  <SelectTrigger className="builder-input w-24"><SelectValue placeholder="Medium" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                    <SelectItem value="xl">X-Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Custom Width */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Width</span>
                <div className="flex items-center gap-1">
                  <Select 
                    value={element.styles?.width ? (element.styles.width.toString().endsWith('%') ? 'percent' : 'fixed') : 'auto'} 
                    onValueChange={(value) => {
                      if (value === 'auto') {
                        handleStyleChange('width', undefined as any);
                      } else if (value === 'fixed') {
                        handleStyleChange('width', '200px');
                      } else if (value === 'percent') {
                        handleStyleChange('width', '100%');
                      }
                    }}
                  >
                    <SelectTrigger className="builder-input w-16"><SelectValue placeholder="Auto" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="percent">100%</SelectItem>
                    </SelectContent>
                  </Select>
                  {element.styles?.width && !element.styles.width.toString().endsWith('%') && (
                    <Input
                      type="number"
                      value={parseInt(element.styles.width.toString()) || 200}
                      onChange={(e) => handleStyleChange('width', `${e.target.value}px`)}
                      className="builder-input w-16 text-xs"
                      min={50}
                      max={600}
                    />
                  )}
                </div>
              </div>
              
              {/* Shadow */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Shadow</span>
                <Select value={element.props?.shadow as string || 'lg'} onValueChange={(value) => handlePropsChange('shadow', value)}>
                  <SelectTrigger className="builder-input w-24"><SelectValue placeholder="Large" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="sm">Subtle</SelectItem>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                    <SelectItem value="glow">Glow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleSection>

          {/* Button Content */}
          <CollapsibleSection title="Content" icon={<Type className="w-4 h-4" />} sectionId="content" isHighlighted={highlightedSection === 'content'}>
            <div className="pt-3">
              <Textarea
                value={element.content || ''}
                onChange={(e) => onUpdate({ content: e.target.value })}
                className="builder-input resize-none"
                rows={2}
                placeholder="Button text..."
              />
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* ========== TEXT/HEADING SECTIONS ========== */}
      {(element.type === 'text' || element.type === 'heading') && (
        <>
          {/* Text Fill - Color or Gradient */}
          <CollapsibleSection title="Text Fill" icon={<Palette className="w-4 h-4" />} defaultOpen sectionId="typography" isHighlighted={highlightedSection === 'typography'}>
            <div className="space-y-3 pt-3">
              {/* Fill Type Toggle - ATOMIC UPDATES to prevent race conditions */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Fill Type</span>
                <div className="flex rounded-lg overflow-hidden border border-builder-border">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      // IMPORTANT: never default to white; let the editor compute a safe fallback.
                      const color = effectiveTextColor;

                      const handled = applyInlineStyle(element.id, {
                        textFillType: 'solid',
                        ...(color ? { textColor: color } : {}),
                      } as any);
                      if (handled) return;

                      // If an inline editor is active, do NOT fall back to whole-block.
                      if (hasActiveEditor(element.id)) {
                        toast.info('Select text to apply fill');
                        return;
                      }

                      handleMultiPropsChange({
                        textFillType: 'solid',
                        ...(color ? { textColor: color } : {}),
                      });
                    }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium transition-colors",
                      effectiveTextFillType !== 'gradient'
                        ? 'bg-builder-accent text-white' 
                        : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface'
                    )}
                  >
                    Solid
                  </button>
                  <button
                    onClick={() => {
                      // Atomic update: set both fillType and gradient together
                      const gradient =
                        effectiveTextGradient ||
                        ({
                          type: 'linear',
                          angle: 135,
                          stops: [
                            { color: '#8B5CF6', position: 0 },
                            { color: '#D946EF', position: 100 },
                          ],
                        } as GradientValue);

                      const cloned = cloneGradient(gradient as GradientValue);

                      const handled = applyInlineStyle(element.id, {
                        textFillType: 'gradient',
                        textGradient: cloned,
                      } as any);
                      if (handled) return;

                      // If an inline editor is active, do NOT fall back to whole-block.
                      if (hasActiveEditor(element.id)) {
                        toast.info('Select text to apply fill');
                        return;
                      }

                      handleMultiPropsChange({
                        textFillType: 'gradient',
                        textGradient: cloned,
                      });
                    }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium transition-colors",
                      effectiveTextFillType === 'gradient'
                        ? 'bg-builder-accent text-white' 
                        : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface'
                    )}
                  >
                    Gradient
                  </button>
                </div>
              </div>
              
              {/* Solid Color Picker */}
              {effectiveTextFillType !== 'gradient' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Color</span>
                  <ColorPickerPopover 
                    color={effectiveTextColor} 
                    onChange={(color) => {
                      const handled = applyInlineStyle(element.id, {
                        textFillType: 'solid',
                        textColor: color,
                      } as any);
                      if (handled) return;

                      if (hasActiveEditor(element.id)) {
                        toast.info('Select text to apply fill');
                        return;
                      }

                      handlePropsChange('textColor', color);
                    }}
                  >
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                      <div 
                        className="w-6 h-6 rounded-md border border-builder-border" 
                        style={{ backgroundColor: effectiveTextColor }} 
                      />
                      <span className="text-xs text-builder-text-muted">Edit</span>
                    </button>
                  </ColorPickerPopover>
                </div>
              )}
              
              {/* Gradient Picker */}
              {effectiveTextFillType === 'gradient' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Gradient</span>
                  <GradientPickerPopover
                    value={effectiveTextGradient}
                    onChange={(gradient) => {
                      const cloned = cloneGradient(gradient);
                      const handled = applyInlineStyle(element.id, {
                        textFillType: 'gradient',
                        textGradient: cloned,
                      } as any);
                      if (handled) return;

                      if (hasActiveEditor(element.id)) {
                        toast.info('Select text to apply fill');
                        return;
                      }

                      handlePropsChange('textGradient', cloned);
                    }}
                  >
                    <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                      <div 
                        className="w-12 h-6 rounded-md border border-builder-border" 
                        style={{ 
                          background: effectiveTextGradient 
                            ? gradientToCSS(effectiveTextGradient) 
                            : 'linear-gradient(135deg, #8B5CF6, #D946EF)' 
                        }} 
                      />
                      <span className="text-xs text-builder-text-muted">Edit</span>
                    </button>
                  </GradientPickerPopover>
                </div>
              )}
              
              {/* Quick Color Presets (for solid) */}
              {effectiveTextFillType !== 'gradient' && (
                <div className="flex gap-1 flex-wrap">
                    {textColorPresets.map((color) => (
                      <button
                        key={color}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          const handled = applyInlineStyle(element.id, {
                            textFillType: 'solid',
                            textColor: color,
                          } as any);
                          if (handled) return;

                          if (hasActiveEditor(element.id)) {
                            toast.info('Select text to apply fill');
                            return;
                          }

                          handlePropsChange('textColor', color);
                        }}
                      className={cn(
                        'w-5 h-5 rounded border transition-all',
                        effectiveTextColor === color
                          ? 'ring-2 ring-builder-accent ring-offset-1'
                          : 'border-builder-border hover:scale-110'
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
          </CollapsibleSection>
          
          {/* Typography - Simplified with sliders */}
          <CollapsibleSection title="Typography" icon={<Type className="w-4 h-4" />} defaultOpen>
            <div className="space-y-4 pt-3">
              {/* Font Size - Direct pixel value slider (no preset mapping) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Size</span>
                  <span className="text-xs font-mono text-builder-text-dim">
                    {parseFontSize(element.props?.fontSize)}px
                  </span>
                </div>
                <Slider 
                  value={[parseFontSize(element.props?.fontSize)]}
                  onValueChange={(v) => {
                    // Store as direct pixel value string for consistency
                    handlePropsChange('fontSize', `${v[0]}px`);
                  }}
                  min={12} max={72} step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] text-builder-text-dim">
                  <span>12px</span>
                  <span>72px</span>
                </div>
              </div>
              
              {/* Font Family */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Font</span>
                <Select value={element.props?.fontFamily as string || 'inherit'} onValueChange={(value) => handlePropsChange('fontFamily', value)}>
                  <SelectTrigger className="builder-input w-28"><SelectValue placeholder="Inherit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">Inherit</SelectItem>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="DM Sans">DM Sans</SelectItem>
                    <SelectItem value="Oswald">Oswald</SelectItem>
                    <SelectItem value="Anton">Anton</SelectItem>
                    <SelectItem value="Bebas Neue">Bebas Neue</SelectItem>
                    <SelectItem value="Space Grotesk">Space Grotesk</SelectItem>
                    <SelectItem value="Playfair Display">Playfair</SelectItem>
                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Font Weight - Visual buttons instead of dropdown */}
              <div className="space-y-1.5">
                <span className="text-xs text-builder-text-muted">Weight</span>
                <div className="flex gap-1">
                  {[
                    { value: 'normal', label: 'Aa' },
                    { value: 'medium', label: 'Aa' },
                    { value: 'semibold', label: 'Aa' },
                    { value: 'bold', label: 'Aa' },
                  ].map((w, i) => (
                    <button
                      key={w.value}
                      onClick={() => handlePropsChange('fontWeight', w.value)}
                      className={cn(
                        'flex-1 py-1.5 rounded text-xs transition-colors',
                        element.props?.fontWeight === w.value 
                          ? 'bg-[hsl(315,85%,58%)] text-white' 
                          : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface-active'
                      )}
                      style={{ fontWeight: [400, 500, 600, 700][i] }}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Text Alignment */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Align</span>
                <div className="flex border border-builder-border rounded-lg overflow-hidden">
                  {[
                    { value: 'left', icon: <AlignLeft className="w-3.5 h-3.5" /> },
                    { value: 'center', icon: <AlignCenter className="w-3.5 h-3.5" /> },
                    { value: 'right', icon: <AlignRight className="w-3.5 h-3.5" /> },
                  ].map((align) => (
                    <button
                      key={align.value}
                      onClick={() => handlePropsChange('textAlign', align.value)}
                      className={cn(
                        'p-2 transition-colors',
                        element.props?.textAlign === align.value 
                          ? 'bg-builder-accent text-white' 
                          : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface'
                      )}
                    >
                      {align.icon}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Text Shadow */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Shadow</span>
                <Select value={element.props?.textShadow as string || 'none'} onValueChange={(value) => handlePropsChange('textShadow', value)}>
                  <SelectTrigger className="builder-input w-24"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="subtle">Subtle</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                    <SelectItem value="glow">Glow</SelectItem>
                    <SelectItem value="neon">Neon</SelectItem>
                    <SelectItem value="depth">3D Depth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleSection>

          {/* Text Content */}
          <CollapsibleSection title="Content" icon={<Type className="w-4 h-4" />} sectionId="content" isHighlighted={highlightedSection === 'content'}>
            <div className="pt-3">
              <Textarea
                value={element.content || ''}
                onChange={(e) => onUpdate({ content: e.target.value })}
                className="builder-input resize-none"
                rows={3}
                placeholder="Enter text content..."
              />
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* ========== IMAGE SECTIONS ========== */}
      {element.type === 'image' && (
        <>
          {/* Image Source */}
          <CollapsibleSection title="Image Source" icon={<Image className="w-4 h-4" />} defaultOpen sectionId="source" isHighlighted={highlightedSection === 'source'}>
            <div className="pt-3 space-y-3">
              {element.props?.src ? (
                <div className="relative rounded-lg overflow-hidden border border-builder-border">
                  <img src={element.props.src as string} alt="Preview" className="w-full h-24 object-cover" />
                  <button
                    onClick={() => setIsImagePickerOpen(true)}
                    className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <span className="text-xs text-white font-medium">Change Image</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsImagePickerOpen(true)}
                  className="w-full py-6 rounded-lg border-2 border-dashed border-builder-border hover:border-builder-accent/50 transition-colors flex flex-col items-center gap-2"
                >
                  <Upload className="w-6 h-6 text-builder-text-muted" />
                  <span className="text-xs text-builder-text-muted">Click to add image</span>
                </button>
              )}
              <FieldGroup label="Alt Text" hint="Describe for accessibility">
                <Input
                  value={element.props?.alt as string || ''}
                  onChange={(e) => handlePropsChange('alt', e.target.value)}
                  placeholder="Image description..."
                  className="builder-input"
                />
              </FieldGroup>
            </div>
          </CollapsibleSection>

          {/* Size & Fit */}
          <CollapsibleSection title="Size & Fit" icon={<BoxSelect className="w-4 h-4" />} defaultOpen sectionId="size" isHighlighted={highlightedSection === 'size'}>
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Width</span>
                <div className="flex items-center gap-2">
                  <Select 
                    value={element.styles?.width === '100%' ? 'full' : (element.styles?.width ? 'custom' : 'auto')}
                    onValueChange={(value) => {
                      if (value === 'full') handleStyleChange('width', '100%');
                      else if (value === 'custom') handleStyleChange('width', '300px');
                      else handleStyleChange('width', '');
                    }}
                  >
                    <SelectTrigger className="builder-input w-20"><SelectValue placeholder="Auto" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {element.styles?.width && element.styles.width !== '100%' && (
                    <Input className="builder-input w-20 text-xs text-center" value={element.styles.width} onChange={(e) => handleStyleChange('width', e.target.value)} />
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Object Fit</span>
                <Select value={element.props?.objectFit as string || 'cover'} onValueChange={(value) => handlePropsChange('objectFit', value)}>
                  <SelectTrigger className="builder-input w-24"><SelectValue placeholder="Cover" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="contain">Contain</SelectItem>
                    <SelectItem value="fill">Fill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Radius</span>
                <div className="flex items-center gap-2">
                  <Slider 
                    value={[parseInt(element.styles?.borderRadius as string || '0')]}
                    onValueChange={(v) => handleStyleChange('borderRadius', `${v[0]}px`)}
                    min={0} max={50} step={2} className="w-20"
                  />
                  <span className="text-xs text-builder-text w-10">{element.styles?.borderRadius || '0px'}</span>
                </div>
              </div>
              
              {/* Logo-specific max-width control */}
              {element.props?.isLogo && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Max Width</span>
                  <div className="flex items-center gap-2">
                    <Slider 
                      value={[parseInt(element.styles?.maxWidth as string || '180')]}
                      onValueChange={(v) => handleStyleChange('maxWidth', `${v[0]}px`)}
                      min={60} max={300} step={10} className="w-20"
                    />
                    <span className="text-xs text-builder-text w-12">{element.styles?.maxWidth || '180px'}</span>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* ========== VIDEO SECTIONS ========== */}
      {element.type === 'video' && (
        <>
          <CollapsibleSection title="Video Source" icon={<Video className="w-4 h-4" />} defaultOpen sectionId="source" isHighlighted={highlightedSection === 'source'}>
            <div className="pt-3 space-y-3">
              {videoSettings?.url ? (
                <div className="p-3 rounded-lg border border-builder-border bg-builder-surface-hover">
                  <div className="flex items-center gap-2 mb-2">
                    <Play className="w-4 h-4 text-builder-accent" />
                    <span className="text-xs font-medium text-builder-text capitalize">{videoSettings.platform}</span>
                  </div>
                  <p className="text-xs text-builder-text-muted truncate">{videoSettings.url}</p>
                </div>
              ) : (
                <div className="p-4 rounded-lg border-2 border-dashed border-builder-border text-center">
                  <Video className="w-8 h-8 text-builder-text-muted mx-auto mb-2" />
                  <p className="text-xs text-builder-text-muted">No video configured</p>
                </div>
              )}
              <Button variant="outline" onClick={() => setIsVideoEmbedOpen(true)} className="w-full border-builder-border text-builder-text hover:bg-builder-surface-hover">
                <Video className="w-4 h-4 mr-2" />
                {videoSettings?.url ? 'Edit Video' : 'Add Video'}
              </Button>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Size & Alignment" icon={<BoxSelect className="w-4 h-4" />} sectionId="size" isHighlighted={highlightedSection === 'size'}>
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Width</span>
                <Select 
                  value={element.styles?.width === '100%' ? 'full' : (element.styles?.width ? 'custom' : 'auto')}
                  onValueChange={(value) => {
                    if (value === 'full') handleStyleChange('width', '100%');
                    else if (value === 'custom') handleStyleChange('width', '560px');
                    else handleStyleChange('width', '');
                  }}
                >
                  <SelectTrigger className="builder-input w-24"><SelectValue placeholder="Auto" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Aspect Ratio</span>
                <Select value={(element.styles?.aspectRatio as string) || '16/9'} onValueChange={(value) => handleStyleChange('aspectRatio', value)}>
                  <SelectTrigger className="builder-input w-24"><SelectValue placeholder="16:9" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16/9">16:9</SelectItem>
                    <SelectItem value="4/3">4:3</SelectItem>
                    <SelectItem value="1/1">1:1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* ========== INPUT/SELECT SECTIONS ========== */}
      {['input', 'select'].includes(element.type) && (
        <>
          <CollapsibleSection title="Field Settings" icon={<Type className="w-4 h-4" />} defaultOpen sectionId="field" isHighlighted={highlightedSection === 'field'}>
            <div className="space-y-3 pt-3">
              <FieldGroup label="Field Key" hint="Unique identifier for form data">
                <Input
                  value={element.props?.fieldKey as string || ''}
                  onChange={(e) => handlePropsChange('fieldKey', e.target.value)}
                  className="builder-input"
                  placeholder="e.g., email"
                />
              </FieldGroup>
              {element.type === 'input' && (
                <FieldGroup label="Input Type">
                  <Select value={element.props?.type as string || 'text'} onValueChange={(value) => handlePropsChange('type', value)}>
                    <SelectTrigger className="builder-input"><SelectValue placeholder="Text" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="tel">Phone</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldGroup>
              )}
              <FieldGroup label="Placeholder">
                <Input
                  value={element.props?.placeholder as string || ''}
                  onChange={(e) => handlePropsChange('placeholder', e.target.value)}
                  className="builder-input"
                  placeholder="Placeholder text..."
                />
              </FieldGroup>
              <FieldGroup label="Label">
                <Input
                  value={element.props?.label as string || ''}
                  onChange={(e) => handlePropsChange('label', e.target.value)}
                  className="builder-input"
                  placeholder="Field label..."
                />
              </FieldGroup>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Required</span>
                <TogglePill value={element.props?.required as boolean || false} onToggle={() => handlePropsChange('required', !element.props?.required)} />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Appearance" icon={<Palette className="w-4 h-4" />} sectionId="inputStyle" isHighlighted={highlightedSection === 'inputStyle'}>
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Background</span>
                <ColorPickerPopover color={element.styles?.backgroundColor as string || '#ffffff'} onChange={(color) => handleStyleChange('backgroundColor', color)}>
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: element.styles?.backgroundColor as string || '#ffffff' }} />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Border Color</span>
                <ColorPickerPopover color={element.styles?.borderColor as string || '#e5e7eb'} onChange={(color) => handleStyleChange('borderColor', color)}>
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: element.styles?.borderColor as string || '#e5e7eb' }} />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Radius</span>
                <div className="flex items-center gap-2">
                  <Slider 
                    value={[parseInt(element.styles?.borderRadius as string || '12')]}
                    onValueChange={(v) => handleStyleChange('borderRadius', `${v[0]}px`)}
                    min={0} max={24} step={2} className="w-16"
                  />
                  <span className="text-xs text-builder-text w-10">{element.styles?.borderRadius || '12px'}</span>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Focus State" icon={<MousePointer2 className="w-4 h-4" />} sectionId="focusStates" isHighlighted={highlightedSection === 'focusStates'}>
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Focus Border</span>
                <ColorPickerPopover color={element.props?.focusBorderColor as string || '#3b82f6'} onChange={(color) => handlePropsChange('focusBorderColor', color)}>
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: element.props?.focusBorderColor as string || '#3b82f6' }} />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* ========== CHECKBOX/RADIO SECTIONS ========== */}
      {['checkbox', 'radio'].includes(element.type) && (
        <CollapsibleSection title="Field Settings" icon={<Type className="w-4 h-4" />} defaultOpen sectionId="field" isHighlighted={highlightedSection === 'field'}>
          <div className="space-y-3 pt-3">
            <FieldGroup label="Field Key">
              <Input
                value={element.props?.fieldKey as string || ''}
                onChange={(e) => handlePropsChange('fieldKey', e.target.value)}
                className="builder-input"
                placeholder="e.g., subscribe"
              />
            </FieldGroup>
            <FieldGroup label="Label">
              <Input
                value={element.props?.label as string || ''}
                onChange={(e) => handlePropsChange('label', e.target.value)}
                className="builder-input"
                placeholder="Checkbox label..."
              />
            </FieldGroup>
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Default Checked</span>
              <TogglePill value={element.props?.defaultChecked === true} onToggle={() => handlePropsChange('defaultChecked', !element.props?.defaultChecked)} />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ========== DIVIDER SECTION ========== */}
      {element.type === 'divider' && (
        <CollapsibleSection title="Divider Style" icon={<Rows className="w-4 h-4" />} defaultOpen sectionId="dividerStyle" isHighlighted={highlightedSection === 'dividerStyle'}>
          <div className="pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Color</span>
              <ColorPickerPopover color={element.styles?.borderColor as string || '#e5e7eb'} onChange={(color) => handleStyleChange('borderColor', color)}>
                <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                  <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: element.styles?.borderColor as string || '#e5e7eb' }} />
                  <span className="text-xs text-builder-text-muted">Edit</span>
                </button>
              </ColorPickerPopover>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Thickness</span>
              <Select 
                value={element.styles?.height || '1px'}
                onValueChange={(value) => handleStyleChange('height', value)}
              >
                <SelectTrigger className="builder-input w-20"><SelectValue placeholder="1px" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1px">1px</SelectItem>
                  <SelectItem value="2px">2px</SelectItem>
                  <SelectItem value="3px">3px</SelectItem>
                  <SelectItem value="4px">4px</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ========== SPACER SECTION ========== */}
      {element.type === 'spacer' && (
        <CollapsibleSection title="Spacer" icon={<Rows className="w-4 h-4" />} defaultOpen sectionId="spacerStyle" isHighlighted={highlightedSection === 'spacerStyle'}>
          <div className="pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Height</span>
              <Select 
                value={element.styles?.height || '48px'}
                onValueChange={(value) => handleStyleChange('height', value)}
              >
                <SelectTrigger className="builder-input w-24"><SelectValue placeholder="48px" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="16px">Small (16px)</SelectItem>
                  <SelectItem value="24px">Medium (24px)</SelectItem>
                  <SelectItem value="32px">32px</SelectItem>
                  <SelectItem value="48px">Large (48px)</SelectItem>
                  <SelectItem value="64px">64px</SelectItem>
                  <SelectItem value="96px">XL (96px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ========== ICON SECTION ========== */}
      {element.type === 'icon' && (
        <>
          <CollapsibleSection title="Icon" icon={<Sparkles className="w-4 h-4" />} defaultOpen>
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Icon</span>
                <Select 
                  value={element.content || 'star'}
                  onValueChange={(value) => onUpdate({ content: value })}
                >
                  <SelectTrigger className="builder-input w-28"><SelectValue placeholder="Star" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="star">Star</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="arrow-right">Arrow Right</SelectItem>
                    <SelectItem value="play">Play</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Size</span>
                <Select 
                  value={element.styles?.fontSize || '24px'}
                  onValueChange={(value) => handleStyleChange('fontSize', value)}
                >
                  <SelectTrigger className="builder-input w-20"><SelectValue placeholder="24px" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16px">16px</SelectItem>
                    <SelectItem value="20px">20px</SelectItem>
                    <SelectItem value="24px">24px</SelectItem>
                    <SelectItem value="32px">32px</SelectItem>
                    <SelectItem value="48px">48px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Color</span>
                <ColorPickerPopover color={element.props?.color as string || '#6b7280'} onChange={(color) => handlePropsChange('color', color)}>
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: element.props?.color as string || '#6b7280' }} />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* ========== SIMPLIFIED ADVANCED SECTION (Visibility only - animation is at top) ========== */}
      {element.type === 'button' && (
        <CollapsibleSection title="More Options" icon={<Settings2 className="w-4 h-4" />}>
          <div className="pt-3 space-y-2">
            {/* Visibility/Show-Hide */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Visibility</span>
              <TogglePill 
                value={element.styles?.display !== 'none'} 
                onToggle={() => onUpdate({ styles: { ...element.styles, display: element.styles?.display === 'none' ? 'block' : 'none' } })}
                labels={['Show', 'Hide']}
              />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Modals */}
      <ButtonActionModal
        isOpen={isButtonActionOpen}
        onClose={() => setIsButtonActionOpen(false)}
        action={buttonAction}
        onSave={handleButtonActionSave}
        steps={steps}
      />
      <VideoEmbedModal
        isOpen={isVideoEmbedOpen}
        onClose={() => setIsVideoEmbedOpen(false)}
        settings={videoSettings}
        onSave={handleVideoSettingsSave}
      />
      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelectImage={handleImageSelect}
        currentImage={element.props?.src as string}
      />
    </div>
  );
};

// Step Inspector with per-step background controls
const StepInspector: React.FC<{ step: Step; onUpdate: (updates: Partial<Step>) => void }> = ({ 
  step, 
  onUpdate 
}) => {
  // Background state
  const currentBgType = step.background?.type || 'solid';
  const [bgType, setBgType] = useState<'solid' | 'gradient' | 'image'>(currentBgType);
  
  const handleBackgroundTypeChange = (newType: 'solid' | 'gradient' | 'image') => {
    setBgType(newType);
    const updates: Partial<Step> = {
      background: {
        type: newType,
        ...(newType === 'solid' && { color: step.background?.color || '#ffffff' }),
        ...(newType === 'gradient' && { 
          gradient: step.background?.gradient || {
            type: 'linear',
            angle: 135,
            stops: [{ color: '#667eea', position: 0 }, { color: '#764ba2', position: 100 }]
          }
        }),
        ...(newType === 'image' && { image: step.background?.image || '' }),
      },
    };
    onUpdate(updates);
  };

  const handleBgColorChange = (color: string) => {
    onUpdate({ 
      background: { 
        ...step.background, 
        type: 'solid', 
        color 
      } 
    });
  };

  const handleBgGradientChange = (gradient: GradientValue) => {
    onUpdate({ 
      background: { 
        ...step.background, 
        type: 'gradient', 
        gradient 
      } 
    });
  };

  const handleBgImageChange = (image: string) => {
    onUpdate({ 
      background: { 
        ...step.background, 
        type: 'image', 
        image 
      } 
    });
  };

  return (
    <div className="space-y-0">
      {/* Step Header - Blue accent for Steps/Pages */}
      <div className="px-4 py-3 border-b border-builder-border bg-gradient-to-r from-blue-500/15 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-builder-text">{step.name || 'Step'}</p>
            <p className="text-xs text-blue-400/80">Page/Step Settings</p>
          </div>
        </div>
      </div>

      <CollapsibleSection title="Step Settings" icon={<Layers className="w-4 h-4" />} defaultOpen>
        <div className="space-y-4 pt-3">
          <FieldGroup label="Step Name">
            <Input
              value={step.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="builder-input"
              placeholder="e.g., Get Started"
            />
          </FieldGroup>
          <FieldGroup label="Page Type">
            <Select 
              value={step.step_type} 
              onValueChange={(value) => onUpdate({ step_type: value as StepType })}
            >
              <SelectTrigger className="builder-input">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(stepTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Purpose">
            <Select 
              value={step.step_intent} 
              onValueChange={(value) => onUpdate({ step_intent: value as StepIntent })}
            >
              <SelectTrigger className="builder-input">
                <SelectValue placeholder="Select purpose..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(stepIntentLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="On Submit">
            <Select 
              value={step.submit_mode} 
              onValueChange={(value) => onUpdate({ submit_mode: value as SubmitMode })}
            >
              <SelectTrigger className="builder-input">
                <SelectValue placeholder="Select action..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(submitModeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </div>
      </CollapsibleSection>

      {/* Per-Step Background - labeled as "Step Background" to distinguish from global Canvas Background */}
      <CollapsibleSection title="Step Background" icon={<Palette className="w-4 h-4" />} defaultOpen>
        <div className="space-y-4 pt-3">
          <div className="toggle-pill w-full">
            <button 
              onClick={() => handleBackgroundTypeChange('solid')}
              className={cn('toggle-pill-option flex-1 text-center', bgType === 'solid' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive')}
            >
              Solid
            </button>
            <button 
              onClick={() => handleBackgroundTypeChange('gradient')}
              className={cn('toggle-pill-option flex-1 text-center', bgType === 'gradient' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive')}
            >
              Gradient
            </button>
            <button 
              onClick={() => handleBackgroundTypeChange('image')}
              className={cn('toggle-pill-option flex-1 text-center', bgType === 'image' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive')}
            >
              Image
            </button>
          </div>

          {bgType === 'solid' && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Background Color</span>
              <ColorPickerPopover
                color={step.background?.color || '#ffffff'}
                onChange={handleBgColorChange}
              >
                <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                  <div 
                    className="w-6 h-6 rounded-md border border-builder-border" 
                    style={{ backgroundColor: step.background?.color || '#ffffff' }}
                  />
                  <span className="text-xs text-builder-text font-mono">
                    {step.background?.color || '#ffffff'}
                  </span>
                </button>
              </ColorPickerPopover>
            </div>
          )}

          {bgType === 'gradient' && (
            <GradientPickerPopover
              value={step.background?.gradient}
              onChange={handleBgGradientChange}
            >
              <button 
                className="w-full h-12 rounded-lg border border-builder-border hover:ring-2 hover:ring-builder-accent transition-all"
                style={{ 
                  background: step.background?.gradient 
                    ? gradientToCSS(step.background.gradient) 
                    : 'linear-gradient(135deg, #667eea, #764ba2)' 
                }}
              >
                <span className="text-xs text-white font-medium drop-shadow-sm">Click to edit gradient</span>
              </button>
            </GradientPickerPopover>
          )}

          {bgType === 'image' && (
            <FieldGroup label="Background Image URL">
              <Input
                value={step.background?.image || ''}
                onChange={(e) => handleBgImageChange(e.target.value)}
                placeholder="https://..."
                className="builder-input"
              />
            </FieldGroup>
          )}

          <p className="text-[10px] text-builder-text-dim">
            Overrides the global Canvas Background for this step only. The "Card Background" in the section inspector styles the content card that sits on top.
          </p>
        </div>
      </CollapsibleSection>

      {step.submit_mode === 'redirect' && (
        <CollapsibleSection title="Redirect" icon={<MousePointer2 className="w-4 h-4" />} defaultOpen>
          <div className="space-y-4 pt-3">
            <FieldGroup label="Redirect URL">
              <Input
                value={step.settings.redirect_url || ''}
                onChange={(e) => onUpdate({ settings: { ...step.settings, redirect_url: e.target.value } })}
                placeholder="https://..."
                className="builder-input"
              />
            </FieldGroup>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
};

// Parse gradient string back to GradientValue
const parseGradientString = (gradientStr: string): GradientValue | null => {
  if (!gradientStr || !gradientStr.includes('gradient')) return null;
  
  const isRadial = gradientStr.includes('radial-gradient');
  const type = isRadial ? 'radial' : 'linear';
  
  // Extract angle for linear gradients
  let angle = 135;
  const angleMatch = gradientStr.match(/(\d+)deg/);
  if (angleMatch) {
    angle = parseInt(angleMatch[1], 10);
  }
  
  // Extract color stops
  const colorMatches = gradientStr.match(/(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgba?\([^)]+\)|hsla?\([^)]+\))\s*(\d+%)?/g);
  const stops: Array<{ color: string; position: number }> = [];
  
  if (colorMatches) {
    colorMatches.forEach((match, index) => {
      const colorMatch = match.match(/(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgba?\([^)]+\)|hsla?\([^)]+\))/);
      const positionMatch = match.match(/(\d+)%/);
      const color = colorMatch ? colorMatch[1] : '#8B5CF6';
      const position = positionMatch ? parseInt(positionMatch[1], 10) : (index * 100) / Math.max(colorMatches.length - 1, 1);
      stops.push({ color, position });
    });
  }
  
  if (stops.length < 2) {
    stops.push({ color: '#8B5CF6', position: 0 }, { color: '#EC4899', position: 100 });
  }
  
  return { type, angle, stops };
};

// Block Inspector - uses unified BackgroundEditor
const BlockInspector: React.FC<{ block: Block; onUpdate: (updates: Partial<Block>) => void }> = ({ 
  block, 
  onUpdate 
}) => {
  // Convert block styles to BackgroundValue
  const getBlockBackgroundValue = (): BackgroundValue => {
    const hasGradient = block.styles?.background?.includes('gradient');
    if (hasGradient && block.styles?.background) {
      const gradient = parseGradientString(block.styles.background);
      if (gradient) {
        return { type: 'gradient', gradient };
      }
    }
    return { type: 'solid', color: block.styles?.backgroundColor || 'transparent' };
  };

  const handleBackgroundEditorChange = (value: BackgroundValue) => {
    if (value.type === 'solid') {
      onUpdate({ 
        styles: { 
          ...block.styles, 
          backgroundColor: value.color,
          background: undefined
        } 
      });
    } else if (value.type === 'gradient' && value.gradient) {
      const css = gradientToCSS(value.gradient);
      onUpdate({ 
        styles: { 
          ...block.styles, 
          background: css,
          backgroundColor: undefined
        } 
      });
    }
  };

  const handleStyleUpdate = useCallback((key: string, value: string) => {
    const normalizeLength = (v: string) => {
      const trimmed = v.trim();
      if (!trimmed) return trimmed;
      // If user entered a pure number, treat it as px for convenience.
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
      return trimmed;
    };

    const lengthKeys = new Set([
      'padding',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'margin',
      'gap',
      'borderRadius',
      'borderWidth',
      'backdropBlur',
      'height',
      'width',
      'maxWidth',
      'minHeight',
      'minWidth',
    ]);

    onUpdate({
      styles: {
        ...block.styles,
        [key]: lengthKeys.has(key) ? normalizeLength(value) : value,
      },
    });
  }, [block.styles, onUpdate]);

  return (
    <div className="space-y-0">
      {/* Block Header - Purple accent for Block level */}
      <div className="px-4 py-3 border-b border-builder-border bg-gradient-to-r from-[hsl(280,75%,55%,0.12)] to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[hsl(280,75%,55%,0.2)] flex items-center justify-center">
            <Square className="w-4 h-4 text-[hsl(280,75%,70%)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-builder-text">{getBlockTypeLabel(block.type)}</p>
            {/* Only show Container badge for section-type blocks, not content blocks */}
            {getBlockCategory(block.type) === 'Container' && (
              <p className="text-[10px] text-[hsl(280,75%,65%)]">Block</p>
            )}
          </div>
        </div>
      </div>

      {/* Block Settings only shown for Container types, not content blocks */}
      {getBlockCategory(block.type) === 'Container' && (
        <CollapsibleSection title="Block Settings" icon={<Layout className="w-4 h-4" />} defaultOpen>
          <div className="space-y-4 pt-3">
            <FieldGroup label="Label">
              <Input
                value={block.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                className="builder-input"
                placeholder="Enter a name..."
              />
            </FieldGroup>
            <FieldGroup label="Block Type">
              <div className="px-3 py-2 bg-builder-surface-hover border border-builder-border rounded-lg text-sm text-builder-text-secondary">
                {getBlockTypeLabel(block.type)}
              </div>
            </FieldGroup>
          </div>
        </CollapsibleSection>
      )}

      {/* Layout controls only shown for Section types, not content blocks like Text/Button/Image */}
      {shouldShowLayoutControls(block.type) && (
      <CollapsibleSection title="Layout" icon={<Rows className="w-4 h-4" />} defaultOpen>
        <div className="space-y-3 pt-3">
          {/* Direction */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Direction</span>
            <Select 
              value={block.props?.direction as string || 'column'}
              onValueChange={(value) => onUpdate({ props: { ...block.props, direction: value } })}
            >
              <SelectTrigger className="builder-input w-28">
                <SelectValue placeholder="Column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="column">Vertical</SelectItem>
                <SelectItem value="row">Horizontal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Justify Content */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Justify</span>
            <Select 
              value={block.props?.justifyContent as string || 'start'}
              onValueChange={(value) => onUpdate({ props: { ...block.props, justifyContent: value } })}
            >
              <SelectTrigger className="builder-input w-28">
                <SelectValue placeholder="Start" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">Start</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="end">End</SelectItem>
                <SelectItem value="between">Space Between</SelectItem>
                <SelectItem value="around">Space Around</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Align Items */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Align</span>
            <Select 
              value={block.props?.alignItems as string || 'stretch'}
              onValueChange={(value) => onUpdate({ props: { ...block.props, alignItems: value } })}
            >
              <SelectTrigger className="builder-input w-28">
                <SelectValue placeholder="Stretch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">Start</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="end">End</SelectItem>
                <SelectItem value="stretch">Stretch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Padding */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Padding</span>
            <Input 
              className="builder-input w-20 text-xs text-center" 
              value={block.styles?.padding || '24px'}
              onChange={(e) => handleStyleUpdate('padding', e.target.value)}
              placeholder="24px"
            />
          </div>
          {/* Gap */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Gap</span>
            <Input 
              className="builder-input w-20 text-xs text-center" 
              value={block.styles?.gap || '16px'}
              onChange={(e) => handleStyleUpdate('gap', e.target.value)}
              placeholder="16px"
            />
          </div>
          {/* Wrap (for row direction) */}
          {(block.props?.direction === 'row') && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Wrap Items</span>
              <TogglePill
                value={block.props?.wrap === true}
                onToggle={() => onUpdate({ props: { ...block.props, wrap: !block.props?.wrap } })}
                labels={['On', 'Off']}
              />
            </div>
          )}
          {/* Border Radius */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Border Radius</span>
            <Input 
              className="builder-input w-20 text-xs text-center" 
              value={block.styles?.borderRadius || '12px'}
              onChange={(e) => handleStyleUpdate('borderRadius', e.target.value)}
              placeholder="12px"
            />
          </div>
        </div>
      </CollapsibleSection>
      )}

      {/* Spacing controls only for Container blocks - content inherits from parent */}
      {getBlockCategory(block.type) === 'Container' && (
        <CollapsibleSection title="Spacing" icon={<BoxSelect className="w-4 h-4" />}>
          <div className="space-y-3 pt-3">
            {/* Margin */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Margin</span>
              <Input 
                className="builder-input w-20 text-xs text-center" 
                value={block.styles?.margin || '0'}
                onChange={(e) => handleStyleUpdate('margin', e.target.value)}
                placeholder="0px"
              />
            </div>
            {/* Padding (detailed) */}
            <div className="space-y-2">
              <span className="text-xs text-builder-text-muted">Padding (detailed)</span>
              <div className="grid grid-cols-4 gap-1">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-builder-text-muted">Top</span>
                  <Input 
                    className="builder-input text-xs text-center h-8 w-full" 
                    value={block.styles?.paddingTop || ''}
                    onChange={(e) => handleStyleUpdate('paddingTop', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-builder-text-muted">Right</span>
                  <Input 
                    className="builder-input text-xs text-center h-8 w-full" 
                    value={block.styles?.paddingRight || ''}
                    onChange={(e) => handleStyleUpdate('paddingRight', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-builder-text-muted">Bottom</span>
                  <Input 
                    className="builder-input text-xs text-center h-8 w-full" 
                    value={block.styles?.paddingBottom || ''}
                    onChange={(e) => handleStyleUpdate('paddingBottom', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-builder-text-muted">Left</span>
                  <Input 
                    className="builder-input text-xs text-center h-8 w-full" 
                    value={block.styles?.paddingLeft || ''}
                    onChange={(e) => handleStyleUpdate('paddingLeft', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Border & Shadow only for Container blocks */}
      {getBlockCategory(block.type) === 'Container' && (
        <CollapsibleSection title="Border & Shadow" icon={<Square className="w-4 h-4" />}>
          <div className="space-y-3 pt-3">
            {/* Border Width */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Border Width</span>
              <div className="flex items-center gap-2">
                <Slider 
                  value={[parseInt(block.styles?.borderWidth as string || '0')]}
                  onValueChange={(v) => handleStyleUpdate('borderWidth', `${v[0]}px`)}
                  min={0}
                  max={8}
                  step={1}
                  className="w-16"
                />
                <span className="text-xs text-builder-text w-10">{block.styles?.borderWidth || '0px'}</span>
              </div>
            </div>
            {/* Border Color */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Border Color</span>
              <ColorPickerPopover
                color={block.styles?.borderColor as string || 'transparent'}
                onChange={(color) => handleStyleUpdate('borderColor', color)}
              >
                <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                  <div 
                    className="w-6 h-6 rounded-md border border-builder-border" 
                    style={{ backgroundColor: block.styles?.borderColor as string || 'transparent' }}
                  />
                  <span className="text-xs text-builder-text-muted">Edit</span>
                </button>
              </ColorPickerPopover>
            </div>
            {/* Gradient Border */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Gradient Border</span>
              <TogglePill 
                value={block.props?.gradientBorder === true} 
                onToggle={() => {
                  const isCurrentlyOn = block.props?.gradientBorder === true;
                  if (!isCurrentlyOn) {
                    const defaultGradient = {
                      type: 'linear' as const,
                      angle: 135,
                      stops: [
                        { color: '#8B5CF6', position: 0 },
                        { color: '#EC4899', position: 100 }
                      ]
                    };
                    onUpdate({ 
                      props: { 
                        ...block.props, 
                        gradientBorder: true,
                        borderGradient: block.props?.borderGradient || defaultGradient
                      } 
                    });
                  } else {
                    onUpdate({ props: { ...block.props, gradientBorder: false } });
                  }
                }} 
                labels={['On', 'Off']} 
              />
            </div>
            {block.props?.gradientBorder && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Border Gradient</span>
                <GradientPickerPopover
                  value={block.props?.borderGradient as GradientValue | undefined}
                  onChange={(gradient) => onUpdate({ props: { ...block.props, borderGradient: cloneGradient(gradient) } })}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div 
                      className="w-12 h-6 rounded-md border border-builder-border" 
                      style={{ background: block.props?.borderGradient ? gradientToCSS(block.props.borderGradient as GradientValue) : 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}
                    />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </GradientPickerPopover>
              </div>
            )}
            {/* Shadow */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Shadow</span>
              <Select 
                value={block.props?.shadow as string || 'none'}
                onValueChange={(value) => onUpdate({ props: { ...block.props, shadow: value } })}
              >
                <SelectTrigger className="builder-input w-28">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="sm">Subtle</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">X-Large</SelectItem>
                  <SelectItem value="2xl">2X-Large</SelectItem>
                  <SelectItem value="inner">Inner</SelectItem>
                  <SelectItem value="glow">Glow</SelectItem>
                  <SelectItem value="neon">Neon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Glow Color - only show for glow/neon shadows */}
            {(block.props?.shadow === 'glow' || block.props?.shadow === 'neon') && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Glow Color</span>
                <ColorPickerPopover
                  color={block.props?.glowColor as string || '#8b5cf6'}
                  onChange={(color) => onUpdate({ props: { ...block.props, glowColor: color } })}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div 
                      className="w-6 h-6 rounded-md border border-builder-border" 
                      style={{ backgroundColor: block.props?.glowColor as string || '#8b5cf6' }}
                    />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
            )}
            {/* Backdrop Blur (Glassmorphism) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Backdrop Blur</span>
                <div className="flex items-center gap-2">
                  <Slider 
                    value={[parseInt((block.styles?.backdropBlur as string || '0').replace('px', ''))]}
                    onValueChange={(v) => handleStyleUpdate('backdropBlur', `${v[0]}px`)}
                    min={0}
                    max={24}
                    step={2}
                    className="w-16"
                  />
                  <span className="text-xs text-builder-text w-10">{parseInt((block.styles?.backdropBlur as string || '0').replace('px', ''))}px</span>
                </div>
              </div>
              {parseInt((block.styles?.backdropBlur as string || '0').replace('px', '')) > 0 && (
                <p className="text-[10px] text-builder-text-muted flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Works best with semi-transparent background
                </p>
              )}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Background only for Container blocks - content inherits from parent */}
      {getBlockCategory(block.type) === 'Container' && (
        <CollapsibleSection title="Background" icon={<Palette className="w-4 h-4" />} defaultOpen>
          <div className="pt-3">
            <BackgroundEditor
              value={getBlockBackgroundValue()}
              onChange={handleBackgroundEditorChange}
              showImageOption={false}
            />
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
};

// Frame Inspector - uses unified BackgroundEditor for consistency
const FrameInspector: React.FC<{ 
  frame: Frame; 
  frameIndex?: number;
  totalFrames?: number;
  onUpdate: (updates: Partial<Frame>) => void;
  onDelete?: () => void;
  onSelectCanvas?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
  onAddAbove?: () => void;
  onAddBelow?: () => void;
}> = ({ 
  frame, 
  frameIndex = 0,
  totalFrames = 1,
  onUpdate,
  onDelete,
  onSelectCanvas,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onAddAbove,
  onAddBelow
}) => {
  const canMoveUp = frameIndex > 0;
  const canMoveDown = frameIndex < totalFrames - 1;
  
  // Convert frame background props to BackgroundValue
  const getBackgroundValue = (): BackgroundValue => {
    const bg = frame.background || 'transparent';
    if (bg === 'gradient' && frame.backgroundGradient) {
      return { type: 'gradient', gradient: frame.backgroundGradient as GradientValue };
    }
    if (bg === 'image' && frame.backgroundImage) {
      return { type: 'image', imageUrl: frame.backgroundImage };
    }
    if (bg === 'custom' && frame.backgroundColor) {
      return { type: 'solid', color: frame.backgroundColor };
    }
    return { type: 'solid', color: 'transparent' };
  };

  const handleBackgroundEditorChange = (value: BackgroundValue) => {
    const updates: Partial<Frame> = {};
    
    if (value.type === 'solid') {
      updates.background = value.color === 'transparent' ? 'transparent' : 'custom';
      updates.backgroundColor = value.color;
      updates.backgroundGradient = undefined;
      updates.backgroundImage = undefined;
    } else if (value.type === 'gradient') {
      updates.background = 'gradient';
      updates.backgroundGradient = value.gradient ? cloneGradient(value.gradient) : undefined;
      updates.backgroundColor = undefined;
      updates.backgroundImage = undefined;
    } else if (value.type === 'image') {
      updates.background = 'image';
      updates.backgroundImage = value.imageUrl;
      updates.backgroundColor = undefined;
      updates.backgroundGradient = undefined;
    }
    
    onUpdate(updates);
  };

  return (
    <div className="space-y-0">
      {/* Back to Canvas navigation */}
      <button 
        onClick={() => onSelectCanvas?.()}
        className="w-full text-xs text-builder-text-muted hover:text-[hsl(217,91%,60%)] flex items-center gap-1 px-4 py-2 border-b border-builder-border hover:bg-builder-surface-hover transition-colors"
      >
        <ChevronLeft className="w-3 h-3" /> Canvas
      </button>
      
      {/* Section Header with Horizontal Action Bar - Blue color for Section level */}
      <div className="px-4 py-3 border-b border-builder-border bg-gradient-to-r from-[hsl(217,91%,60%,0.12)] to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[hsl(217,91%,60%,0.2)] flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-[hsl(217,91%,70%)]" />
            </div>
            <p className="text-sm font-semibold text-builder-text truncate max-w-[100px]">{frame.label || 'Section'}</p>
          </div>
          
          {/* Horizontal Action Bar */}
          <div className="flex items-center gap-0.5">
            <TooltipProvider delayDuration={300}>
              {/* Move Up */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onMoveUp}
                    disabled={!canMoveUp}
                    className={cn(
                      "p-1.5 rounded-md transition-colors",
                      canMoveUp 
                        ? "text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-hover" 
                        : "text-builder-text-dim cursor-not-allowed opacity-40"
                    )}
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Move Up</TooltipContent>
              </Tooltip>
              
              {/* Move Down */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onMoveDown}
                    disabled={!canMoveDown}
                    className={cn(
                      "p-1.5 rounded-md transition-colors",
                      canMoveDown 
                        ? "text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-hover" 
                        : "text-builder-text-dim cursor-not-allowed opacity-40"
                    )}
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Move Down</TooltipContent>
              </Tooltip>
              
              {/* Duplicate */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onDuplicate}
                    className="p-1.5 rounded-md text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-hover transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Duplicate</TooltipContent>
              </Tooltip>
              
              {/* Add Section Above */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onAddAbove}
                    className="p-1.5 rounded-md text-builder-text-muted hover:text-builder-accent hover:bg-builder-surface-hover transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Add Section Above</TooltipContent>
              </Tooltip>
              
              {/* Delete */}
              {onDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onDelete}
                      className="p-1.5 rounded-md text-builder-text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Delete Section</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Section Name & Layout */}
      <CollapsibleSection title="General" icon={<Settings2 className="w-4 h-4" />} defaultOpen>
        <div className="space-y-3 pt-3">
          <FieldGroup label="Section Name" hint="Give this section a recognizable name">
            <Input
              value={frame.label || ''}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="e.g., Hero, Features, CTA"
              className="builder-input"
            />
          </FieldGroup>
          
          {/* Layout Width Toggle */}
          <FieldGroup label="Section Width" hint="Control how wide this section stretches">
            <div className="toggle-pill w-full">
              <button 
                type="button"
                onClick={() => onUpdate({ layout: 'contained' })}
                className={cn(
                  'toggle-pill-option flex-1 text-center',
                  (frame.layout || 'contained') === 'contained' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive'
                )}
              >
                Contained
              </button>
              <button 
                type="button"
                onClick={() => onUpdate({ layout: 'full-width' })}
                className={cn(
                  'toggle-pill-option flex-1 text-center',
                  frame.layout === 'full-width' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive'
                )}
              >
                Full Width
              </button>
            </div>
          </FieldGroup>

          {/* Max Width Slider - only when contained */}
          {(frame.layout || 'contained') === 'contained' && (
            <FieldGroup label={`Max Width: ${frame.maxWidth || 520}px`} hint="Control the maximum content width">
              <Slider
                value={[frame.maxWidth || 520]}
                onValueChange={([v]) => onUpdate({ maxWidth: v })}
                min={400}
                max={800}
                step={20}
                className="w-full"
              />
            </FieldGroup>
          )}
        </div>
      </CollapsibleSection>

      {/* Spacing Controls */}
      <CollapsibleSection title="Spacing" icon={<ArrowUpDown className="w-4 h-4" />} defaultOpen>
        <div className="space-y-3 pt-3">
          <FieldGroup label={`Vertical Padding: ${frame.paddingVertical || 32}px`}>
            <Slider
              value={[frame.paddingVertical || 32]}
              onValueChange={([v]) => onUpdate({ paddingVertical: v })}
              min={16}
              max={64}
              step={4}
              className="w-full"
            />
          </FieldGroup>
          <FieldGroup label={`Horizontal Padding: ${frame.paddingHorizontal || 32}px`}>
            <Slider
              value={[frame.paddingHorizontal || 32]}
              onValueChange={([v]) => onUpdate({ paddingHorizontal: v })}
              min={16}
              max={64}
              step={4}
              className="w-full"
            />
          </FieldGroup>
          <FieldGroup label={`Block Spacing: ${frame.blockGap || 12}px`} hint="Gap between blocks inside this section">
            <Slider
              value={[frame.blockGap || 12]}
              onValueChange={([v]) => onUpdate({ blockGap: v })}
              min={8}
              max={32}
              step={4}
              className="w-full"
            />
          </FieldGroup>
        </div>
      </CollapsibleSection>

      {/* Background - using unified BackgroundEditor */}
      <CollapsibleSection title="Section Background" icon={<Palette className="w-4 h-4" />} defaultOpen>
        <div className="pt-3">
          {/* Hint explaining section vs canvas */}
          <div className="text-[10px] text-builder-text-dim bg-builder-surface-hover rounded-lg px-3 py-2 mb-3">
            💡 This is the section (card) background. Blocks like Hero, CTA, and Forms sit inside this section.
          </div>
          <BackgroundEditor
            value={getBackgroundValue()}
            onChange={handleBackgroundEditorChange}
            showImageOption={true}
          />
          
          {/* Presets for quick selection */}
          {getBackgroundValue().type === 'solid' && (
            <div className="space-y-1.5 mt-3 pt-3 border-t border-builder-border">
              <span className="text-xs text-builder-text-dim">Quick Presets</span>
              <div className="flex flex-wrap gap-1.5">
                {backgroundColorPresets.map((color) => (
                  <button
                    key={color}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleBackgroundEditorChange({ type: 'solid', color });
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={cn(
                      'w-6 h-6 rounded-md border transition-all cursor-pointer',
                      frame.backgroundColor === color 
                        ? 'ring-2 ring-builder-accent border-builder-accent' 
                        : 'border-builder-border hover:border-builder-accent hover:scale-110'
                    )}
                    style={{ backgroundColor: color }}
                    title={`Set background to ${color}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Danger Zone */}
      {onDelete && (
        <CollapsibleSection title="Danger Zone" icon={<Trash2 className="w-4 h-4" />}>
          <div className="pt-3">
            <Button
              variant="destructive"
              onClick={onDelete}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete This Section
            </Button>
            <p className="text-[10px] text-builder-text-dim mt-2 text-center">
              This will remove the section and all blocks inside it.
            </p>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

// Note: Using unified presets from ../utils/presets.ts
// backgroundColorPresets, textColorPresets, elementColorPresets, highlightPresets, gradientPresets

// Page Inspector
const PageInspector: React.FC<{ page: Page; onUpdate: (updates: Partial<Page>) => void; onPublish?: () => void }> = ({ 
  page, 
  onUpdate,
  onPublish
}) => {
  // Local state for immediate UI feedback on background type change
  const [localBgType, setLocalBgType] = useState<'solid' | 'gradient' | 'image'>(
    page.settings.page_background?.type || 'solid'
  );
  
  // Sync local state with external prop changes
  useEffect(() => {
    const externalType = page.settings.page_background?.type || 'solid';
    if (externalType !== localBgType) {
      setLocalBgType(externalType);
    }
  }, [page.settings.page_background?.type]);
  
  const handleMetaUpdate = useCallback((key: string, value: string) => {
    onUpdate({ 
      settings: { 
        ...page.settings, 
        meta: { 
          ...page.settings.meta, 
          [key]: value 
        } 
      } 
    });
  }, [page.settings, onUpdate]);

  const handleSettingsUpdate = useCallback((key: string, value: string) => {
    onUpdate({ 
      settings: { 
        ...page.settings, 
        [key]: value 
      } 
    });
  }, [page.settings, onUpdate]);

  // Background type change handler - updates local state immediately for UI feedback
  const handleBackgroundTypeChange = useCallback((newType: 'solid' | 'gradient' | 'image') => {
    // Update local state immediately for instant UI feedback
    setLocalBgType(newType);
    
    const updates: Record<string, unknown> = {
      settings: {
        ...page.settings,
        page_background: {
          ...(page.settings.page_background || {}),
          type: newType,
          ...(newType === 'solid' && { 
            color: page.settings.page_background?.color || (page.settings.theme === 'dark' ? '#111827' : '#ffffff') 
          }),
          ...(newType === 'gradient' && { 
            gradient: page.settings.page_background?.gradient || {
              type: 'linear',
              angle: 135,
              stops: [{ color: '#667eea', position: 0 }, { color: '#764ba2', position: 100 }]
            }
          }),
          ...(newType === 'image' && {
            image: page.settings.page_background?.image || ''
          }),
        },
      },
    };
    
    onUpdate(updates);
  }, [page.settings, onUpdate]);

  // Keyboard navigation for toggle pill
  const handleToggleKeyDown = useCallback((e: React.KeyboardEvent, currentType: string) => {
    const types = ['solid', 'gradient', 'image'] as const;
    const currentIndex = types.indexOf(currentType as typeof types[number]);
    
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = currentIndex <= 0 ? types.length - 1 : currentIndex - 1;
      handleBackgroundTypeChange(types[newIndex]);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = currentIndex >= types.length - 1 ? 0 : currentIndex + 1;
      handleBackgroundTypeChange(types[newIndex]);
    }
  }, [handleBackgroundTypeChange]);

  const primaryColor = page.settings.primary_color || '#8B5CF6';
  // Use local state for immediate UI updates
  const currentBgType = localBgType;

  return (
    <div className="space-y-0">
      {/* Canvas Selection Header */}
      <div className="px-4 py-3 border-b border-builder-border bg-gradient-to-r from-[hsl(var(--builder-accent)/0.1)] to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--builder-accent)/0.15)] flex items-center justify-center">
            <Layers className="w-4 h-4 text-[hsl(var(--builder-accent))]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-builder-text">Canvas</p>
            <p className="text-[10px] text-builder-text-muted">Page-level background & settings</p>
          </div>
        </div>
      </div>
      
      <SiteInfo page={page} onPublish={onPublish} />

      <CollapsibleSection title="Canvas Background" icon={<Image className="w-4 h-4" />} defaultOpen>
        <div className="space-y-3 pt-3">
          {/* Hint explaining canvas vs section */}
          <div className="text-[10px] text-builder-text-dim bg-builder-surface-hover rounded-lg px-3 py-2 -mt-1 space-y-1">
            <p>💡 This is the page-level background. Sections (cards) sit on top of this.</p>
            <p>To change section width, click a section first.</p>
          </div>
          {/* Reset Button */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Background Type</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({
                  settings: {
                    ...page.settings,
                    page_background: {
                      type: 'solid',
                      color: page.settings.theme === 'dark' ? '#111827' : '#ffffff',
                    },
                  },
                });
              }}
              className="text-xs text-builder-text-dim hover:text-builder-accent transition-colors"
            >
              Reset
            </button>
          </div>
          {/* Background Type Toggle with ARIA and Keyboard Navigation */}
          <div 
            className="toggle-pill w-full"
            role="tablist"
            aria-label="Background type selection"
          >
            <button 
              type="button"
              role="tab"
              aria-selected={currentBgType === 'solid'}
              tabIndex={currentBgType === 'solid' ? 0 : -1}
              onClick={() => handleBackgroundTypeChange('solid')}
              onKeyDown={(e) => handleToggleKeyDown(e, currentBgType)}
              className={cn(
                'toggle-pill-option flex-1 text-center focus:outline-none focus:ring-2 focus:ring-builder-accent focus:ring-inset',
                currentBgType === 'solid' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive'
              )}
            >
              Solid
            </button>
            <button 
              type="button"
              role="tab"
              aria-selected={currentBgType === 'gradient'}
              tabIndex={currentBgType === 'gradient' ? 0 : -1}
              onClick={() => handleBackgroundTypeChange('gradient')}
              onKeyDown={(e) => handleToggleKeyDown(e, currentBgType)}
              className={cn(
                'toggle-pill-option flex-1 text-center focus:outline-none focus:ring-2 focus:ring-builder-accent focus:ring-inset',
                currentBgType === 'gradient' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive'
              )}
            >
              Gradient
            </button>
            <button 
              type="button"
              role="tab"
              aria-selected={currentBgType === 'image'}
              tabIndex={currentBgType === 'image' ? 0 : -1}
              onClick={() => handleBackgroundTypeChange('image')}
              onKeyDown={(e) => handleToggleKeyDown(e, currentBgType)}
              className={cn(
                'toggle-pill-option flex-1 text-center focus:outline-none focus:ring-2 focus:ring-builder-accent focus:ring-inset',
                currentBgType === 'image' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive'
              )}
            >
              Image
            </button>
          </div>

          {/* Solid Color Section */}
          {currentBgType === 'solid' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Background Color</span>
                <ColorPickerPopover
                  color={page.settings.page_background?.color || (page.settings.theme === 'dark' ? '#111827' : '#ffffff')}
                  onChange={(color) => {
                    onUpdate({ 
                      settings: { 
                        ...page.settings, 
                        page_background: { ...page.settings.page_background, type: 'solid', color } 
                      } 
                    });
                  }}
                >
                  <button 
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-builder-border hover:border-builder-accent hover:bg-builder-surface-hover focus:outline-none focus:ring-2 focus:ring-builder-accent focus:ring-offset-1 focus:ring-offset-builder-surface active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div 
                      className="w-8 h-8 rounded-lg border border-builder-border shadow-inner" 
                      style={{ backgroundColor: page.settings.page_background?.color || '#ffffff' }}
                    />
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-builder-text font-mono">
                        {page.settings.page_background?.color || '#ffffff'}
                      </span>
                      <span className="text-[10px] text-builder-text-muted">Click to change</span>
                    </div>
                  </button>
                </ColorPickerPopover>
              </div>
              
              {/* Preset Solid Colors */}
              <div>
                <span className="text-xs text-builder-text-dim block mb-2">Quick Colors</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {backgroundColorPresets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        onUpdate({
                          settings: {
                            ...page.settings,
                            page_background: { type: 'solid', color },
                          },
                        });
                      }}
                      className={cn(
                        'w-8 h-8 rounded-md border transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-builder-accent',
                        page.settings.page_background?.color === color
                          ? 'ring-2 ring-builder-accent border-builder-accent'
                          : 'border-builder-border hover:border-builder-text-muted'
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Gradient Section */}
          {currentBgType === 'gradient' && (
            <div className="space-y-3">
              <span className="text-xs text-builder-text-muted block">Gradient Background</span>
              <GradientPickerPopover
                value={page.settings.page_background?.gradient}
                onChange={(gradient) => {
                  onUpdate({ 
                    settings: { 
                      ...page.settings, 
                      page_background: { 
                        type: 'gradient', 
                        gradient 
                      } 
                    } 
                  });
                }}
              >
                <button 
                  type="button"
                  className="w-full h-16 rounded-xl border-2 border-builder-border hover:border-builder-accent focus:outline-none focus:ring-2 focus:ring-builder-accent focus:ring-offset-1 focus:ring-offset-builder-surface active:scale-[0.98] transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                  style={{ 
                    background: page.settings.page_background?.gradient 
                      ? gradientToCSS(page.settings.page_background.gradient) 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  }}
                >
                  <span className="text-sm text-white font-semibold drop-shadow-md px-4 py-1 bg-black/20 rounded-full">
                    Click to Edit Gradient
                  </span>
                </button>
              </GradientPickerPopover>
              
              {/* Preset Gradients */}
              <div>
                <span className="text-xs text-builder-text-dim block mb-2">Quick Gradients</span>
                <div className="grid grid-cols-3 gap-2">
                  {gradientPresets.slice(0, 6).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onUpdate({
                          settings: {
                            ...page.settings,
                            page_background: { type: 'gradient', gradient: preset.gradient },
                          },
                        });
                      }}
                      className="h-10 rounded-lg border-2 border-builder-border hover:border-builder-accent focus:outline-none focus:ring-2 focus:ring-builder-accent transition-all hover:scale-105"
                      style={{ background: gradientToCSS(preset.gradient) }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Image */}
          {currentBgType === 'image' && (
            <>
              <FieldGroup label="Image URL">
                <Input
                  value={page.settings.page_background?.image || ''}
                  onChange={(e) => onUpdate({ 
                    settings: { 
                      ...page.settings, 
                      page_background: { 
                        ...page.settings.page_background,
                        type: 'image', 
                        image: e.target.value 
                      } 
                    } 
                  })}
                  placeholder="https://..."
                  className="builder-input"
                />
              </FieldGroup>
              {page.settings.page_background?.image && (
                <div className="relative rounded-lg overflow-hidden border border-builder-border">
                  <img 
                    src={page.settings.page_background.image} 
                    alt="Background preview" 
                    className="w-full h-20 object-cover"
                  />
                </div>
              )}
            </>
          )}

          {/* Blur (for image backgrounds) */}
          {currentBgType === 'image' && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Blur</span>
              <div className="flex items-center gap-2">
                <Slider 
                  value={[page.settings.page_background?.blur || 0]}
                  onValueChange={(v) => onUpdate({ 
                    settings: { 
                      ...page.settings, 
                      page_background: { 
                        ...page.settings.page_background,
                        type: 'image',
                        blur: v[0] 
                      } 
                    } 
                  })}
                  min={0}
                  max={20}
                  step={1}
                  className="w-20"
                />
                <span className="text-xs text-builder-text w-10">{page.settings.page_background?.blur || 0}px</span>
              </div>
            </div>
          )}

          {/* Overlay */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Overlay</span>
            <Select 
              value={page.settings.page_background?.overlay || 'none'}
              onValueChange={(value) => onUpdate({ 
                settings: { 
                  ...page.settings, 
                  page_background: { 
                    ...page.settings.page_background,
                    type: page.settings.page_background?.type || 'solid',
                    overlay: value 
                  } 
                } 
              })}
            >
              <SelectTrigger className="builder-input w-28">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="gradient-dark">Gradient Dark</SelectItem>
                <SelectItem value="gradient-light">Gradient Light</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Overlay Opacity */}
          {page.settings.page_background?.overlay && page.settings.page_background.overlay !== 'none' && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Overlay Opacity</span>
              <div className="flex items-center gap-2">
                <Slider 
                  value={[(page.settings.page_background?.overlayOpacity || 50)]}
                  onValueChange={(v) => onUpdate({ 
                    settings: { 
                      ...page.settings, 
                      page_background: { 
                        ...page.settings.page_background,
                        type: page.settings.page_background?.type || 'solid',
                        overlayOpacity: v[0] 
                      } 
                    } 
                  })}
                  min={0}
                  max={100}
                  step={5}
                  className="w-20"
                />
                <span className="text-xs text-builder-text w-10">{page.settings.page_background?.overlayOpacity || 50}%</span>
              </div>
            </div>
          )}
          
          {/* Explanatory hint */}
          <p className="text-[10px] text-builder-text-dim pt-2 border-t border-builder-border mt-2">
            This is the outermost background layer. Content cards sit on top of this canvas.
          </p>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Theme" icon={<Palette className="w-4 h-4" />} defaultOpen={false}>
        <div className="space-y-4 pt-3">
          <FieldGroup label="Color Mode">
            <Select 
              value={page.settings.theme || 'light'} 
              onValueChange={(value) => handleSettingsUpdate('theme', value)}
            >
              <SelectTrigger className="builder-input">
                <SelectValue placeholder="Select mode..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white border border-gray-300" />
                    <span>Light</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-900 border border-gray-600" />
                    <span>Dark</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Accent Color" hint="Default button color, focus rings, and link colors in the published funnel">
            <ColorPickerPopover
              color={primaryColor}
              onChange={(color) => handleSettingsUpdate('primary_color', color)}
            >
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-builder-border hover:border-builder-text-muted transition-colors">
                <div 
                  className="w-8 h-8 rounded-lg border border-builder-border" 
                  style={{ backgroundColor: primaryColor }}
                />
                <span className="text-sm text-builder-text font-mono flex-1 text-left">
                  {primaryColor}
                </span>
                <Palette className="w-4 h-4 text-builder-text-muted" />
              </button>
            </ColorPickerPopover>
          </FieldGroup>
          <FieldGroup label="Font Family">
            <Select 
              value={page.settings.font_family || 'Inter'} 
              onValueChange={(value) => handleSettingsUpdate('font_family', value)}
            >
              <SelectTrigger className="builder-input">
                <SelectValue placeholder="Select font..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">
                  <span style={{ fontFamily: 'Inter' }}>Inter</span>
                </SelectItem>
                <SelectItem value="DM Sans">
                  <span style={{ fontFamily: 'DM Sans' }}>DM Sans</span>
                </SelectItem>
                <SelectItem value="Roboto">
                  <span style={{ fontFamily: 'Roboto' }}>Roboto</span>
                </SelectItem>
                <SelectItem value="Open Sans">
                  <span style={{ fontFamily: 'Open Sans' }}>Open Sans</span>
                </SelectItem>
                <SelectItem value="Poppins">
                  <span style={{ fontFamily: 'Poppins' }}>Poppins</span>
                </SelectItem>
                <SelectItem value="Montserrat">
                  <span style={{ fontFamily: 'Montserrat' }}>Montserrat</span>
                </SelectItem>
                <SelectItem value="Playfair Display">
                  <span style={{ fontFamily: 'Playfair Display' }}>Playfair Display</span>
                </SelectItem>
                <SelectItem value="Lato">
                  <span style={{ fontFamily: 'Lato' }}>Lato</span>
                </SelectItem>
                <SelectItem value="Raleway">
                  <span style={{ fontFamily: 'Raleway' }}>Raleway</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="SEO & Meta" icon={<Sparkles className="w-4 h-4" />} defaultOpen={false}>
        <div className="space-y-4 pt-3">
          <FieldGroup label="Page Title" hint="Appears in browser tab and search results">
            <Input
              value={page.settings.meta?.title || ''}
              onChange={(e) => handleMetaUpdate('title', e.target.value)}
              className="builder-input"
              placeholder="My Awesome Page"
            />
          </FieldGroup>
          <FieldGroup label="Description" hint="Shown in search engine results">
            <Textarea
              value={page.settings.meta?.description || ''}
              onChange={(e) => handleMetaUpdate('description', e.target.value)}
              className="builder-input resize-none"
              rows={2}
              placeholder="A brief description of your page..."
            />
          </FieldGroup>
          <FieldGroup label="Social Image URL" hint="Image shown when shared on social media">
            <Input
              value={page.settings.meta?.og_image || ''}
              onChange={(e) => handleMetaUpdate('og_image', e.target.value)}
              className="builder-input"
              placeholder="https://..."
            />
          </FieldGroup>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Advanced">
        <div className="space-y-3 pt-3">
          <FieldGroup label="Page Slug" hint="URL path for this page">
            <Input 
              className="builder-input text-sm font-mono" 
              value={page.slug}
              onChange={(e) => onUpdate({ slug: e.target.value })}
              placeholder="my-page"
            />
          </FieldGroup>
        </div>
      </CollapsibleSection>
    </div>
  );
};

// Main Right Panel Component
export const RightPanel: React.FC<RightPanelProps> = ({
  page,
  selection,
  onUpdateNode,
  onClearSelection,
  onPublish,
  onDuplicateElement,
  onDeleteElement,
  onMoveElement,
  onUpdateElement,
  onReplayAnimation,
  currentDeviceMode = 'desktop',
  onDeleteFrame,
  onDuplicateFrame,
  onMoveFrame,
  onAddFrameAt,
  activeStep,
}) => {
  // Try to find node by path first, then fallback to ID search
  let selectedNode = selection.id ? findNodeByPath(page, selection.path) : null;
  let resolvedType = selection.type;
  
  // Fallback: if path resolution fails but we have an ID, search the tree
  if (!selectedNode && selection.id) {
    const { node, type } = findNodeById(page, selection.id);
    selectedNode = node;
    if (type) resolvedType = type as SelectionState['type'];
  }
  
  // Get steps for button action modal
  const steps = page.steps.map(s => ({ id: s.id, name: s.name }));
  
  // Calculate frame index for move buttons
  const getFrameIndex = (): { index: number; total: number } => {
    if (resolvedType === 'frame' && selection.id && activeStep) {
      const index = activeStep.frames.findIndex(f => f.id === selection.id);
      return { index: index >= 0 ? index : 0, total: activeStep.frames.length };
    }
    return { index: 0, total: 1 };
  };
  
  const { index: frameIndex, total: totalFrames } = getFrameIndex();

  // Build breadcrumb items based on current selection hierarchy
  const buildBreadcrumbItems = useCallback((): Array<{ type: 'page' | 'section' | 'block' | 'element'; id: string; label: string }> => {
    const items: Array<{ type: 'page' | 'section' | 'block' | 'element'; id: string; label: string }> = [];
    
    if (!selection.id || selection.type === 'page') {
      return items; // No breadcrumb for canvas/page level
    }
    
    // Always start with Canvas (clicking goes to page)
    items.push({ type: 'page', id: 'canvas', label: 'Canvas' });
    
    // Parse the path to find parent nodes
    if (activeStep && selection.path.length > 0) {
      // Find frame (section) in path
      const frameIndex = selection.path.indexOf('frame');
      if (frameIndex !== -1 && selection.path[frameIndex + 1]) {
        const frameId = selection.path[frameIndex + 1];
        const frame = activeStep.frames.find(f => f.id === frameId);
        if (frame) {
          items.push({ type: 'section', id: frameId, label: frame.label || 'Section' });
        }
      }
      
      // Find block in path
      const blockIndex = selection.path.indexOf('block');
      if (blockIndex !== -1 && selection.path[blockIndex + 1]) {
        const blockId = selection.path[blockIndex + 1];
        // Search for block in step frames
        for (const frame of activeStep.frames) {
          for (const stack of frame.stacks) {
            const block = stack.blocks.find(b => b.id === blockId);
            if (block) {
              items.push({ type: 'block', id: blockId, label: block.label || getBlockTypeLabel(block.type) });
              break;
            }
          }
        }
      }
      
      // Add element if selected
      if (resolvedType === 'element' && selectedNode) {
        const element = selectedNode as Element;
        items.push({ type: 'element', id: element.id, label: getElementTypeLabel(element.type) });
      }
    }
    
    // If we only have canvas in breadcrumb, don't show it
    if (items.length <= 1) return [];
    
    return items;
  }, [selection, activeStep, resolvedType, selectedNode]);

  // Handle breadcrumb selection
  const handleBreadcrumbSelect = useCallback((type: string, id: string) => {
    if (type === 'page') {
      onClearSelection();
    } else if (type === 'section') {
      // Find the frame and select it
      if (activeStep) {
        const frame = activeStep.frames.find(f => f.id === id);
        if (frame) {
          onUpdateNode(['step', activeStep.id, 'frame', id], {});
          // This needs to trigger selection - we need a callback for this
          // For now, we'll just clear and let parent handle
        }
      }
    }
    // Block and element selections would need additional callback props
  }, [onClearSelection, activeStep, onUpdateNode]);

  // Use direct element update for elements, path-based for others
  // For page updates (no selection.id), always use empty path to target the page root
  const handleUpdate = (updates: Record<string, unknown>) => {
    if (resolvedType === 'element' && selection.id && onUpdateElement) {
      onUpdateElement(selection.id, updates as Partial<Element>);
    } else if (!selection.id) {
      // Page-level update - always use empty path
      onUpdateNode([], updates);
    } else {
      onUpdateNode(selection.path, updates);
    }
  };

  const breadcrumbItems = buildBreadcrumbItems();

  return (
    <div className="builder-right-panel w-72 bg-builder-surface border-l border-builder-border flex flex-col h-full min-h-0">
      
      {/* Selection Breadcrumb - shows hierarchy when something is selected */}
      {breadcrumbItems.length > 0 && (
        <SelectionBreadcrumb 
          items={breadcrumbItems}
          onSelect={handleBreadcrumbSelect}
        />
      )}

      {/* Content - min-h-0 critical for flex scroll */}
      <div className="flex-1 overflow-y-auto builder-scroll min-h-0">
        {/* Show PageInspector for: no selection, or explicit 'page' type selection */}
        {(!selection.id || selection.type === 'page') ? (
          <PageInspector page={page} onUpdate={handleUpdate} onPublish={onPublish} />
        ) : resolvedType === 'step' && selectedNode ? (
          <StepInspector step={selectedNode as Step} onUpdate={handleUpdate} />
        ) : resolvedType === 'frame' && selectedNode ? (
          <FrameInspector 
            frame={selectedNode as Frame} 
            frameIndex={frameIndex}
            totalFrames={totalFrames}
            onUpdate={handleUpdate} 
            onDelete={selection.id && onDeleteFrame ? () => onDeleteFrame(selection.id!) : undefined}
            onSelectCanvas={() => onClearSelection()}
            onMoveUp={selection.id && onMoveFrame ? () => onMoveFrame(selection.id!, 'up') : undefined}
            onMoveDown={selection.id && onMoveFrame ? () => onMoveFrame(selection.id!, 'down') : undefined}
            onDuplicate={selection.id && onDuplicateFrame ? () => onDuplicateFrame(selection.id!) : undefined}
            onAddAbove={selection.id && onAddFrameAt ? () => onAddFrameAt('above', selection.id!) : undefined}
            onAddBelow={selection.id && onAddFrameAt ? () => onAddFrameAt('below', selection.id!) : undefined}
          />
        ) : resolvedType === 'block' && selectedNode ? (
          <BlockInspector block={selectedNode as Block} onUpdate={handleUpdate} />
        ) : resolvedType === 'element' && selectedNode ? (
          <ElementInspector 
            element={selectedNode as Element} 
            onUpdate={handleUpdate} 
            steps={steps}
            allSteps={page.steps}
            onDuplicate={selection.id ? () => onDuplicateElement?.(selection.id!) : undefined}
            onDelete={selection.id ? () => onDeleteElement?.(selection.id!) : undefined}
            onMoveUp={selection.id ? () => onMoveElement?.(selection.id!, 'up') : undefined}
            onMoveDown={selection.id ? () => onMoveElement?.(selection.id!, 'down') : undefined}
            onReplayAnimation={selection.id ? () => onReplayAnimation?.(selection.id!) : undefined}
            currentDeviceMode={currentDeviceMode}
          />
        ) : resolvedType === 'stack' ? (
          /* Stack selections should select parent frame instead - show frame inspector if we can find parent */
          <div className="p-4 text-center text-builder-text-muted text-sm">
            <p>Click the section header above to edit section settings.</p>
          </div>
        ) : (
          <PageInspector page={page} onUpdate={handleUpdate} onPublish={onPublish} />
        )}
      </div>
    </div>
  );
};
