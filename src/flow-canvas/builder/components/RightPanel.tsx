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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  Image as ImageIcon,
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
  Smartphone,
  ArrowRight,
  PanelRightClose,
  Loader2,
  MapPin,
  Code,
  Star,
  ListOrdered,
  GripVertical,
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
  ImagePickerModal,
  StockVideoPicker
} from './modals';
import { BackgroundEditor, BackgroundValue, backgroundValueToCSS } from './BackgroundEditor';
import type { GradientValue, ButtonAction, VideoSettings } from './modals';
import { toast } from 'sonner';
import { useInlineEdit, useInlineSelectionSync } from '../contexts/InlineEditContext';
import { ButtonIconPicker } from './ButtonIconPicker';
import { ApplicationFlowInspector } from './inspectors/ApplicationFlowInspector';
import { InteractiveBlockInspector } from './inspectors/InteractiveBlockInspector';
import { StepElementInspector } from './inspectors/StepElementInspector';
import { PremiumElementInspector } from './inspectors/PremiumElementInspector';
import { ConditionalLogicEditor } from './inspectors/ConditionalLogicEditor';
import { UniversalAppearanceSection } from './inspectors/UniversalAppearanceSection';
import { AnimationPresetSection } from './inspectors/AnimationPresetSection';
import { ButtonActionSelector, type ButtonAction as ActionSelectorAction } from './ButtonActionSelector';
import { ButtonStyleInspector, type ButtonStyleSettings } from '@/components/builder/ButtonStyleInspector';
import { DEFAULT_FLOW_BUTTON_COLOR } from './ApplicationFlowCard';

interface RightPanelProps {
  page: Page;
  selection: SelectionState;
  onUpdateNode: (path: string[], updates: Record<string, unknown>) => void;
  onClearSelection: () => void;
  /** Callback to change selection - used for stack-to-frame redirection */
  onSelect?: (selection: SelectionState) => void;
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
  // Application Flow step selection (for canvas step switching)
  selectedApplicationStepId?: string | null;
  onSelectApplicationStep?: (stepId: string | null) => void;
  // Element selection within flow steps
  selectedStepElement?: { stepId: string; elementType: 'title' | 'description' | 'button' | 'option' | 'input'; optionIndex?: number } | null;
  onClearStepElement?: () => void;
  /** Callback to close the entire right panel */
  onClosePanel?: () => void;
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

// ========== SORTABLE ROW COMPONENTS FOR INSPECTOR LISTS ==========
// Used by Loader Steps, Carousel Slides, and Logo Marquee

interface SortableRowProps {
  id: string;
  children: React.ReactNode;
}

function SortableRow({ id, children }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity touch-none"
      >
        <GripVertical className="w-3 h-3 text-builder-text-muted" />
      </div>
      {children}
    </div>
  );
}

// Shared sensors for inspector sortable lists
function useInspectorSortableSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
}

// TogglePill: Now uses the deterministic BooleanToggle component
// This component sets explicit true/false values instead of flipping
import { BooleanToggle, coerceBoolean } from './BooleanToggle';

// Alias for backwards compatibility in this file
const TogglePill: React.FC<{ value: boolean; onToggle: () => void; labels?: [string, string] }> = ({ 
  value, 
  onToggle,
  labels = ['Yes', 'No']
}) => {
  // Convert the legacy "onToggle" (flip) pattern to the new explicit pattern
  // The value prop should already be the correct boolean
  return (
    <BooleanToggle
      value={value}
      onValueChange={(newValue) => {
        // Only call onToggle if the value actually changed
        if (newValue !== value) {
          onToggle();
        }
      }}
      labels={labels}
    />
  );
};

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
      {/* Save status is now handled by SaveStatusIndicator in the toolbar - no duplicate indicator here */}
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
  list: ['listItems', 'listStyle', 'typography'],
  // Premium elements - handled by PremiumElementInspector
  'gradient-text': ['premium'],
  'stat-number': ['premium'],
  'avatar-group': ['premium'],
  'ticker': ['premium'],
  'badge': ['premium'],
  'process-step': ['premium'],
  'video-thumbnail': ['premium'],
  'underline-text': ['premium'],
} as const;

// Premium element types that need specialized inspector
const PREMIUM_ELEMENT_TYPES = [
  'gradient-text', 'stat-number', 'avatar-group', 'ticker',
  'badge', 'process-step', 'video-thumbnail', 'underline-text'
] as const;

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
  page: Page;
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
  page,
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

  // Use the new selection sync hook for more reliable updates
  const contextSelectionTick = useInlineSelectionSync(element.id);

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

  // Combine both ticks for comprehensive reactivity
  const combinedTick = selectionTick + contextSelectionTick;

  const inlineSelectionStyles = useMemo(
    () => getInlineSelectionStyles(element.id),
    [getInlineSelectionStyles, element.id, combinedTick]
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
    // Check if we're editing a specific slide or logo
    const editingSlideIndex = (window as any).__editingSlideIndex;
    const editingLogoIndex = (window as any).__editingLogoIndex;
    
    if (editingSlideIndex !== undefined && editingSlideIndex !== null) {
      // Editing a carousel slide
      const slides = [...((element.props?.slides as Array<{ id: string; src: string; alt?: string; caption?: string }>) || [])];
      if (slides[editingSlideIndex]) {
        slides[editingSlideIndex] = { ...slides[editingSlideIndex], src: url };
        onUpdate({ props: { ...element.props, slides } });
      }
      (window as any).__editingSlideIndex = undefined;
    } else if (editingLogoIndex !== undefined && editingLogoIndex !== null) {
      // Editing a logo bar logo
      const logos = [...((element.props?.logos as Array<{ id: string; src: string; alt?: string; url?: string }>) || [])];
      if (logos[editingLogoIndex]) {
        logos[editingLogoIndex] = { ...logos[editingLogoIndex], src: url };
        onUpdate({ props: { ...element.props, logos } });
      }
      (window as any).__editingLogoIndex = undefined;
    } else {
      // Default: update the main image src
      onUpdate({ props: { ...element.props, src: url } });
    }
  };

  const buttonAction = element.props?.buttonAction as ButtonAction | null;
  const videoSettings = element.props?.videoSettings as VideoSettings | null;

  // Check if states section should show - extended to all interactive elements
  const showStates = ['button', 'text', 'heading', 'image', 'container', 'icon-text', 'gradient-text'].includes(element.type);
  const showAnimation = (sectionsToShow as readonly string[]).includes('animation');

  // Premium element types get specialized inspector
  if ((PREMIUM_ELEMENT_TYPES as readonly string[]).includes(element.type)) {
    return (
      <div className="space-y-0">
        {/* Premium Element Header */}
        <div className="px-4 py-3 border-b border-builder-border bg-gradient-to-r from-[hsl(315,85%,58%,0.1)] to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[hsl(315,85%,58%,0.15)] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[hsl(315,85%,70%)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-builder-text capitalize">
                  {element.type.replace(/-/g, ' ')}
                </p>
                <p className="text-[10px] text-[hsl(315,85%,65%)]">Premium Element</p>
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
        <PremiumElementInspector 
          element={element} 
          onUpdate={onUpdate}
          primaryColor={page.settings.primary_color}
        />
        {/* Visibility Section - universal for all elements including premium */}
        <CollapsibleSection title="Visibility" icon={<Eye className="w-4 h-4" />}>
          <div className="pt-3 space-y-3">
            <p className="text-[10px] text-builder-text-dim">
              Show or hide this element based on form field values.
            </p>
            <ConditionalLogicEditor
              conditions={element.visibility?.conditions?.map(c => {
                // Map from ConditionalRule operators to ConditionalLogicEditor operators
                const operatorMap: Record<string, 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'> = {
                  equals: 'equals',
                  notEquals: 'not_equals',
                  contains: 'contains',
                  notEmpty: 'is_not_empty',
                  isEmpty: 'is_empty',
                  greater_than: 'greater_than',
                  less_than: 'less_than',
                };
                return {
                  id: c.field,
                  fieldKey: c.field,
                  operator: operatorMap[c.operator] || 'equals',
                  value: c.value
                };
              }) || []}
              onUpdate={(conditions) => {
                // Map from ConditionalLogicEditor operators back to ConditionalRule operators
              const reverseOperatorMap: Record<string, 'equals' | 'notEquals' | 'contains' | 'notEmpty' | 'isEmpty' | 'greaterThan' | 'lessThan'> = {
                  equals: 'equals',
                  not_equals: 'notEquals',
                  contains: 'contains',
                  greater_than: 'greaterThan',
                  less_than: 'lessThan',
                  is_empty: 'isEmpty',
                  is_not_empty: 'notEmpty',
                };
                const mapped = conditions.map(c => ({
                  field: c.fieldKey,
                  operator: reverseOperatorMap[c.operator] || 'equals',
                  value: c.value,
                  action: 'show' as const
                }));
                onUpdate({ 
                  visibility: mapped.length > 0 
                    ? { conditions: mapped, logic: 'and' as const }
                    : undefined 
                });
              }}
              availableFields={collectFieldKeys(page.steps || []).map(f => ({ key: f.key, label: f.label }))}
            />
          </div>
        </CollapsibleSection>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-0">
      {/* Element Type Header with Quick Actions - Pink for Element level */}
      <div className="px-4 py-3 border-b border-builder-border bg-gradient-to-r from-[hsl(315,85%,58%,0.1)] to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[hsl(315,85%,58%,0.15)] flex items-center justify-center">
              {element.type === 'button' && <MousePointer2 className="w-4 h-4 text-[hsl(315,85%,70%)]" />}
              {element.type === 'image' && <ImageIcon className="w-4 h-4 text-[hsl(315,85%,70%)]" />}
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
        <AnimationPresetSection
          element={element}
          onUpdate={onUpdate}
          onReplayAnimation={onReplayAnimation}
        />
      )}

      {/* State Tabs - for all interactive elements */}
      {showStates && (
        <div className="px-4 py-2 border-b border-builder-border">
          <p className="text-[10px] text-builder-text-dim mb-2">Style for different interaction states:</p>
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
            <span className="text-xs text-builder-text-muted">Text Color</span>
            <ColorPickerPopover
              color={(element.stateStyles?.[activeState]?.textColor as string) || 'inherit'}
              onChange={(color) => handleStyleChange('textColor', color)}
            >
              <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.stateStyles?.[activeState]?.textColor as string) || '#ffffff' }} />
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
              <SelectContent className="bg-background border-border">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="0.95">Shrink (95%)</SelectItem>
                <SelectItem value="1.02">Subtle (102%)</SelectItem>
                <SelectItem value="1.05">Medium (105%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Opacity</span>
            <Select 
              value={(element.stateStyles?.[activeState]?.opacity as string) || 'none'}
              onValueChange={(value) => handleStyleChange('opacity', value === 'none' ? '' : value)}
            >
              <SelectTrigger className="builder-input w-24"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="0.9">90%</SelectItem>
                <SelectItem value="0.8">80%</SelectItem>
                <SelectItem value="0.7">70%</SelectItem>
                <SelectItem value="0.5">50%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Shadow</span>
            <Select 
              value={(element.stateStyles?.[activeState]?.shadow as string) || 'none'}
              onValueChange={(value) => handleStyleChange('shadow', value === 'none' ? '' : value)}
            >
              <SelectTrigger className="builder-input w-24"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="0 4px 6px rgba(0,0,0,0.1)">Small</SelectItem>
                <SelectItem value="0 10px 15px rgba(0,0,0,0.15)">Medium</SelectItem>
                <SelectItem value="0 20px 25px rgba(0,0,0,0.2)">Large</SelectItem>
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

      {/* ========== BUTTON SECTIONS (UNIFIED) ========== */}
      {element.type === 'button' && (
        <>
          {/* On Click Action - Using shared ButtonActionSelector */}
          <CollapsibleSection title="On Click" icon={<MousePointer2 className="w-4 h-4" />} defaultOpen sectionId="action" isHighlighted={highlightedSection === 'action'}>
            <div className="pt-2">
              <ButtonActionSelector
                action={buttonAction as ActionSelectorAction | undefined}
                onChange={(action) => handlePropsChange('buttonAction', action)}
                availableSteps={steps}
                stepType={undefined} // Not in a flow step, show all actions
              />
            </div>
          </CollapsibleSection>

          {/* Button Appearance - Using shared ButtonStyleInspector */}
          <CollapsibleSection title="Appearance" icon={<Palette className="w-4 h-4" />} defaultOpen sectionId="appearance" isHighlighted={highlightedSection === 'appearance'}>
            <div className="pt-2">
              <ButtonStyleInspector
                settings={{
                  preset: element.props?.buttonPreset as string || 'primary',
                  fillType: element.props?.fillType as 'outline' | 'solid' | 'gradient' || 'solid',
                  backgroundColor: element.styles?.backgroundColor as string,
                  textColor: element.props?.textColor as string,
                  gradient: element.props?.gradient as GradientValue | undefined,
                  size: element.props?.buttonSize as string || 'md',
                  borderRadius: parseInt(element.styles?.borderRadius as string || '12'),
                  shadow: element.props?.shadow as string || 'lg',
                  fullWidth: element.props?.fullWidth as boolean ?? false,
                  customWidth: element.props?.customWidth as number | undefined,
                  icon: element.props?.iconType as string || 'ArrowRight',
                  showIcon: element.props?.showIcon as boolean ?? true,
                }}
                onChange={(updates) => {
                  const newProps: Record<string, unknown> = { ...element.props };
                  const newStyles: Record<string, string> = { ...(element.styles as Record<string, string> || {}) };
                  
                  // Map updates to element props/styles
                  if (updates.preset !== undefined) newProps.buttonPreset = updates.preset;
                  if (updates.fillType !== undefined) {
                    newProps.fillType = updates.fillType;
                    if (updates.fillType === 'outline') {
                      newStyles.backgroundColor = 'transparent';
                      newProps.gradient = undefined;
                    }
                  }
                  if (updates.backgroundColor !== undefined) newStyles.backgroundColor = updates.backgroundColor;
                  if (updates.textColor !== undefined) newProps.textColor = updates.textColor;
                  if (updates.gradient !== undefined) newProps.gradient = updates.gradient;
                  if (updates.size !== undefined) newProps.buttonSize = updates.size;
                  if (updates.borderRadius !== undefined) newStyles.borderRadius = `${updates.borderRadius}px`;
                  if (updates.shadow !== undefined) newProps.shadow = updates.shadow;
                  if (updates.fullWidth !== undefined) newProps.fullWidth = updates.fullWidth;
                  if (updates.customWidth !== undefined) newProps.customWidth = updates.customWidth;
                  if (updates.widthMode !== undefined) {
                    if (updates.widthMode === 'full') {
                      newProps.fullWidth = true;
                      newProps.customWidth = undefined;
                    } else if (updates.widthMode === 'fixed') {
                      newProps.fullWidth = false;
                      newProps.customWidth = updates.customWidth || 200;
                    } else {
                      newProps.fullWidth = false;
                      newProps.customWidth = undefined;
                    }
                  }
                  if (updates.icon !== undefined) newProps.iconType = updates.icon;
                  if (updates.showIcon !== undefined) newProps.showIcon = updates.showIcon;
                  
                  onUpdate({ props: newProps, styles: newStyles });
                }}
                showPreset
                showFullWidth
                showIcon
                primaryColor={page.settings.primary_color || '#8B5CF6'}
              />
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

                      // Try inline selection first
                      const handled = applyInlineStyle(element.id, {
                        textFillType: 'solid',
                        ...(color ? { textColor: color } : {}),
                      } as any);
                      if (handled) return;

                      // Always fall back to whole-element if no selection was styled
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

                      // Try inline selection first
                      const handled = applyInlineStyle(element.id, {
                        textFillType: 'gradient',
                        textGradient: cloned,
                      } as any);
                      if (handled) return;

                      // Always fall back to whole-element if no selection was styled
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
                  onValueCommit={(v) => {
                    // Store as direct pixel value string for consistency - only on release
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
                  <SelectContent className="bg-background border-border">
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
                  <SelectContent className="bg-background border-border">
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
              
              {/* Letter Spacing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Letter Spacing</span>
                  <span className="text-xs font-mono text-builder-text-dim">
                    {(element.props?.letterSpacing as number) ?? 0}px
                  </span>
                </div>
                <Slider 
                  value={[(element.props?.letterSpacing as number) ?? 0]}
                  onValueCommit={(v) => handlePropsChange('letterSpacing', v[0])}
                  min={-2} max={10} step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] text-builder-text-dim">
                  <span>Tight</span>
                  <span>Wide</span>
                </div>
              </div>
              
              {/* Line Height */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Line Height</span>
                  <span className="text-xs font-mono text-builder-text-dim">
                    {((element.props?.lineHeight as number) ?? 1.5).toFixed(1)}
                  </span>
                </div>
                <Slider 
                  value={[(element.props?.lineHeight as number) ?? 1.5]}
                  onValueCommit={(v) => handlePropsChange('lineHeight', v[0])}
                  min={1} max={2.5} step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] text-builder-text-dim">
                  <span>Tight</span>
                  <span>Loose</span>
                </div>
              </div>
              
              {/* Text Transform */}
              <div className="space-y-1.5">
                <span className="text-xs text-builder-text-muted">Transform</span>
                <div className="flex gap-1">
                  {[
                    { value: 'none', label: 'Aa' },
                    { value: 'uppercase', label: 'AA' },
                    { value: 'lowercase', label: 'aa' },
                    { value: 'capitalize', label: 'Aa' },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => handlePropsChange('textTransform', t.value)}
                      className={cn(
                        'flex-1 py-1.5 rounded text-xs transition-colors',
                        element.props?.textTransform === t.value 
                          ? 'bg-[hsl(315,85%,58%)] text-white' 
                          : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface-active'
                      )}
                      style={{ textTransform: t.value as any }}
                      title={t.value}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Text Effect - Underline styling (moved from separate block) */}
          <CollapsibleSection title="Text Effect" icon={<Underline className="w-4 h-4" />}>
            <div className="space-y-3 pt-3">
              {/* Effect Type Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Effect</span>
                <div className="flex rounded-lg overflow-hidden border border-builder-border">
                  <button
                    onClick={() => handleMultiPropsChange({ textEffect: 'none', underlineFrom: undefined, underlineTo: undefined })}
                    className={cn(
                      "px-2.5 py-1.5 text-xs font-medium transition-colors",
                      (!element.props?.textEffect || element.props?.textEffect === 'none')
                        ? 'bg-builder-accent text-white' 
                        : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface'
                    )}
                  >
                    None
                  </button>
                  <button
                    onClick={() => handleMultiPropsChange({ 
                      textEffect: 'underline',
                      underlineFrom: (element.props?.underlineFrom as string) || page.settings.primary_color || '#8B5CF6',
                      underlineTo: (element.props?.underlineTo as string) || '#EC4899'
                    })}
                    className={cn(
                      "px-2.5 py-1.5 text-xs font-medium transition-colors",
                      element.props?.textEffect === 'underline'
                        ? 'bg-builder-accent text-white' 
                        : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface'
                    )}
                  >
                    Underline
                  </button>
                  <button
                    onClick={() => handleMultiPropsChange({ textEffect: 'highlight' })}
                    className={cn(
                      "px-2.5 py-1.5 text-xs font-medium transition-colors",
                      element.props?.textEffect === 'highlight'
                        ? 'bg-builder-accent text-white' 
                        : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface'
                    )}
                  >
                    Highlight
                  </button>
                </div>
              </div>
              
              {/* Underline Color Controls */}
              {element.props?.textEffect === 'underline' && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-builder-text-muted">From Color</span>
                    <ColorPickerPopover
                      color={(element.props?.underlineFrom as string) || page.settings.primary_color || '#8B5CF6'}
                      onChange={(c) => handlePropsChange('underlineFrom', c)}
                    >
                      <button className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.underlineFrom as string) || page.settings.primary_color || '#8B5CF6' }} />
                    </ColorPickerPopover>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-builder-text-muted">To Color</span>
                    <ColorPickerPopover
                      color={(element.props?.underlineTo as string) || '#EC4899'}
                      onChange={(c) => handlePropsChange('underlineTo', c)}
                    >
                      <button className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.underlineTo as string) || '#EC4899'}} />
                    </ColorPickerPopover>
                  </div>
                  {/* Preview */}
                  <div className="p-2 rounded-md bg-builder-surface-hover/50 mt-2">
                    <span 
                      className="text-sm font-medium relative inline-block"
                      style={{ 
                        backgroundImage: `linear-gradient(90deg, ${(element.props?.underlineFrom as string) || page.settings.primary_color || '#8B5CF6'}, ${(element.props?.underlineTo as string) || '#EC4899'})`,
                        backgroundSize: '100% 3px',
                        backgroundPosition: '0 100%',
                        backgroundRepeat: 'no-repeat',
                        paddingBottom: '4px'
                      }}
                    >
                      Preview underline
                    </span>
                  </div>
                </div>
              )}
              
              {/* Highlight Color Control */}
              {element.props?.textEffect === 'highlight' && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-builder-text-muted">Highlight Color</span>
                    <ColorPickerPopover
                      color={(element.props?.highlightColor as string) || 'rgba(255,255,0,0.3)'}
                      onChange={(c) => handlePropsChange('highlightColor', c)}
                    >
                      <button className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.highlightColor as string) || 'rgba(255,255,0,0.3)' }} />
                    </ColorPickerPopover>
                  </div>
                </div>
              )}
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
          <CollapsibleSection title="Image Source" icon={<ImageIcon className="w-4 h-4" />} defaultOpen sectionId="source" isHighlighted={highlightedSection === 'source'}>
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
                    <SelectContent className="bg-background border-border">
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
                  <SelectContent className="bg-background border-border">
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
                  <SelectContent className="bg-background border-border">
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
                  <SelectContent className="bg-background border-border">
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
                    <SelectContent className="bg-background border-border">
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
                <BooleanToggle 
                  value={coerceBoolean(element.props?.required, false)} 
                  onValueChange={(v) => handlePropsChange('required', v)} 
                />
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
                    onValueCommit={(v) => handleStyleChange('borderRadius', `${v[0]}px`)}
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
              <BooleanToggle 
                value={coerceBoolean(element.props?.defaultChecked, false)} 
                onValueChange={(v) => handlePropsChange('defaultChecked', v)} 
              />
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
                <SelectContent className="bg-background border-border">
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
                <SelectContent className="bg-background border-border">
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
                <ButtonIconPicker 
                  value={element.content || 'Star'}
                  onChange={(value) => onUpdate({ content: value })}
                />
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
                    <SelectItem value="64px">64px</SelectItem>
                    <SelectItem value="96px">96px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Icon Fill Type Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Fill Type</span>
                <div className="flex rounded-lg overflow-hidden border border-builder-border">
                  <button
                    onClick={() => handlePropsChange('fillType', 'solid')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium transition-colors",
                      (element.props?.fillType || 'solid') === 'solid'
                        ? 'bg-builder-accent text-white' 
                        : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface'
                    )}
                  >
                    Solid
                  </button>
                  <button
                    onClick={() => handlePropsChange('fillType', 'gradient')}
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
              {(element.props?.fillType || 'solid') === 'solid' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Color</span>
                  <ColorPickerPopover color={element.props?.color as string || '#6b7280'} onChange={(color) => handlePropsChange('color', color)}>
                    <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                      <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: element.props?.color as string || '#6b7280' }} />
                      <span className="text-xs text-builder-text-muted">Edit</span>
                    </button>
                  </ColorPickerPopover>
                </div>
              )}
              
              {/* Gradient Color */}
              {element.props?.fillType === 'gradient' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Gradient</span>
                  <GradientPickerPopover
                    value={element.props?.gradient as { type: 'linear' | 'radial'; angle: number; stops: Array<{ color: string; position: number }> } || { type: 'linear', angle: 135, stops: [{ color: '#8B5CF6', position: 0 }, { color: '#EC4899', position: 100 }] }}
                    onChange={(gradient) => handlePropsChange('gradient', gradient)}
                  >
                    <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                      <div 
                        className="w-6 h-6 rounded-md border border-builder-border" 
                        style={{ 
                          background: element.props?.gradient 
                            ? `linear-gradient(${(element.props.gradient as { angle?: number }).angle || 135}deg, ${((element.props.gradient as { stops?: Array<{ color: string; position: number }> }).stops || []).map((s: { color: string; position: number }) => `${s.color} ${s.position}%`).join(', ')})` 
                            : 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                        }} 
                      />
                      <span className="text-xs text-builder-text-muted">Edit</span>
                    </button>
                  </GradientPickerPopover>
                </div>
              )}
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* ========== COUNTDOWN TIMER SECTION ========== */}
      {element.type === 'countdown' && (
        <>
          <CollapsibleSection title="Timer Settings" icon={<Timer className="w-4 h-4" />} defaultOpen>
            <div className="pt-3 space-y-3">
              <FieldGroup label="End Date & Time">
                <Input
                  type="datetime-local"
                  value={element.props?.endDate ? new Date(element.props.endDate as string).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handlePropsChange('endDate', new Date(e.target.value).toISOString())}
                  className="builder-input"
                />
              </FieldGroup>
              <FieldGroup label="Style">
                <Select 
                  value={element.props?.style as string || 'boxes'}
                  onValueChange={(value) => handlePropsChange('style', value)}
                >
                  <SelectTrigger className="builder-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="boxes">Boxes</SelectItem>
                    <SelectItem value="inline">Inline</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="flip">Flip</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Size">
                <Select 
                  value={element.props?.boxSize as string || 'md'}
                  onValueChange={(value) => handlePropsChange('boxSize', value)}
                >
                  <SelectTrigger className="builder-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Show Days</span>
                <BooleanToggle 
                  value={coerceBoolean(element.props?.showDays, true)} 
                  onValueChange={(v) => handlePropsChange('showDays', v)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Show Seconds</span>
                <BooleanToggle 
                  value={coerceBoolean(element.props?.showSeconds, true)} 
                  onValueChange={(v) => handlePropsChange('showSeconds', v)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Show Labels</span>
                <BooleanToggle 
                  value={coerceBoolean(element.props?.showLabels, true)} 
                  onValueChange={(v) => handlePropsChange('showLabels', v)} 
                />
              </div>
            </div>
          </CollapsibleSection>
          
          <CollapsibleSection title="Urgency & Effects" icon={<Zap className="w-4 h-4" />}>
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Loop Mode</span>
                <BooleanToggle 
                  value={coerceBoolean(element.props?.loopMode, false)} 
                  onValueChange={(v) => handlePropsChange('loopMode', v)} 
                />
              </div>
              {element.props?.loopMode && (
                <FieldGroup label="Reset Interval" hint="Minutes">
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[element.props?.loopInterval as number || 60]}
                      onValueCommit={([v]) => handlePropsChange('loopInterval', v)}
                      min={5} max={180} step={5} className="flex-1"
                    />
                    <span className="text-xs text-builder-text w-12">{String(element.props?.loopInterval || 60)}m</span>
                  </div>
                </FieldGroup>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Speed Multiplier</span>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[element.props?.speedMultiplier as number || 1]}
                    onValueCommit={([v]) => handlePropsChange('speedMultiplier', v)}
                    min={1} max={10} step={0.5} className="w-20"
                  />
                  <span className="text-xs text-builder-text w-8">{String(element.props?.speedMultiplier || 1)}x</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Animate Digits</span>
                <BooleanToggle 
                  value={coerceBoolean(element.props?.animateDigits, false)} 
                  onValueChange={(v) => handlePropsChange('animateDigits', v)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Urgency Pulse</span>
                <BooleanToggle 
                  value={coerceBoolean(element.props?.urgencyPulse, false)} 
                  onValueChange={(v) => handlePropsChange('urgencyPulse', v)} 
                />
              </div>
              <p className="text-[10px] text-builder-text-dim">
                Urgency pulse adds animation when under 1 minute remaining
              </p>
            </div>
          </CollapsibleSection>
          
          <CollapsibleSection title="Custom Labels" icon={<Type className="w-4 h-4" />}>
            <div className="pt-3 space-y-3">
              <FieldGroup label="Days Label">
                <Input
                  value={(element.props?.customLabels as { days?: string })?.days || ''}
                  onChange={(e) => handlePropsChange('customLabels', { ...(element.props?.customLabels as object || {}), days: e.target.value })}
                  className="builder-input"
                  placeholder="Days"
                />
              </FieldGroup>
              <FieldGroup label="Hours Label">
                <Input
                  value={(element.props?.customLabels as { hours?: string })?.hours || ''}
                  onChange={(e) => handlePropsChange('customLabels', { ...(element.props?.customLabels as object || {}), hours: e.target.value })}
                  className="builder-input"
                  placeholder="Hours"
                />
              </FieldGroup>
              <FieldGroup label="Minutes Label">
                <Input
                  value={(element.props?.customLabels as { minutes?: string })?.minutes || ''}
                  onChange={(e) => handlePropsChange('customLabels', { ...(element.props?.customLabels as object || {}), minutes: e.target.value })}
                  className="builder-input"
                  placeholder="Minutes"
                />
              </FieldGroup>
              <FieldGroup label="Seconds Label">
                <Input
                  value={(element.props?.customLabels as { seconds?: string })?.seconds || ''}
                  onChange={(e) => handlePropsChange('customLabels', { ...(element.props?.customLabels as object || {}), seconds: e.target.value })}
                  className="builder-input"
                  placeholder="Seconds"
                />
              </FieldGroup>
            </div>
          </CollapsibleSection>
          
          <CollapsibleSection title="When Expired" icon={<Clock className="w-4 h-4" />}>
            <div className="pt-3 space-y-3">
              <FieldGroup label="Action">
                <Select 
                  value={element.props?.expiredAction as string || 'show-message'}
                  onValueChange={(value) => handlePropsChange('expiredAction', value)}
                >
                  <SelectTrigger className="builder-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="show-message">Show Message</SelectItem>
                    <SelectItem value="hide">Hide Timer</SelectItem>
                    <SelectItem value="redirect">Redirect</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              {element.props?.expiredAction === 'show-message' && (
                <FieldGroup label="Message">
                  <Input
                    value={element.props?.expiredMessage as string || "Time's up!"}
                    onChange={(e) => handlePropsChange('expiredMessage', e.target.value)}
                    className="builder-input"
                    placeholder="Time's up!"
                  />
                </FieldGroup>
              )}
              {element.props?.expiredAction === 'redirect' && (
                <FieldGroup label="Redirect URL">
                  <Input
                    value={element.props?.expiredRedirectUrl as string || ''}
                    onChange={(e) => handlePropsChange('expiredRedirectUrl', e.target.value)}
                    className="builder-input"
                    placeholder="https://..."
                  />
                </FieldGroup>
              )}
            </div>
          </CollapsibleSection>
          
          <CollapsibleSection title="Colors" icon={<Palette className="w-4 h-4" />}>
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Background</span>
                <ColorPickerPopover 
                  color={(element.props?.colors as { background?: string; text?: string } | undefined)?.background || 'rgba(139, 92, 246, 0.15)'} 
                  onChange={(color) => handlePropsChange('colors', { ...(element.props?.colors as object || {}), background: color })}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.colors as { background?: string; text?: string } | undefined)?.background || 'rgba(139, 92, 246, 0.15)' }} />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Text</span>
                <ColorPickerPopover 
                  color={(element.props?.colors as { background?: string; text?: string } | undefined)?.text || '#ffffff'} 
                  onChange={(color) => handlePropsChange('colors', { ...(element.props?.colors as object || {}), text: color })}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.colors as { background?: string; text?: string } | undefined)?.text || '#ffffff' }} />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Labels</span>
                <ColorPickerPopover 
                  color={(element.props?.colors as { label?: string })?.label || '#888888'} 
                  onChange={(color) => handlePropsChange('colors', { ...(element.props?.colors as object || {}), label: color })}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.colors as { label?: string })?.label || '#888888' }} />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Separator</span>
                <ColorPickerPopover 
                  color={(element.props?.colors as { separator?: string })?.separator || '#ffffff'} 
                  onChange={(color) => handlePropsChange('colors', { ...(element.props?.colors as object || {}), separator: color })}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.colors as { separator?: string })?.separator || '#ffffff' }} />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* ========== LOADER SECTION ========== */}
      {element.type === 'loader' && (
        <>
          <CollapsibleSection title="Loader Settings" icon={<Loader2 className="w-4 h-4" />} defaultOpen>
            <div className="pt-3 space-y-3">
              <FieldGroup label="Text">
                <Input
                  value={element.content || 'Analyzing your results...'}
                  onChange={(e) => onUpdate({ content: e.target.value })}
                  className="builder-input"
                  placeholder="Loading text..."
                />
              </FieldGroup>
              <FieldGroup label="Sub Text">
                <Input
                  value={element.props?.subText as string || ''}
                  onChange={(e) => handlePropsChange('subText', e.target.value)}
                  className="builder-input"
                  placeholder="Optional sub text..."
                />
              </FieldGroup>
              <FieldGroup label="Complete Text">
                <Input
                  value={element.props?.completeText as string || 'Complete!'}
                  onChange={(e) => handlePropsChange('completeText', e.target.value)}
                  className="builder-input"
                  placeholder="Complete!"
                />
              </FieldGroup>
              <FieldGroup label="Animation">
                <Select 
                  value={element.props?.animationType as string || 'analyzing'}
                  onValueChange={(value) => handlePropsChange('animationType', value)}
                >
                  <SelectTrigger className="builder-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="analyzing">Analyzing (Multi-step)</SelectItem>
                    <SelectItem value="spinner">Spinner</SelectItem>
                    <SelectItem value="progress">Progress Bar</SelectItem>
                    <SelectItem value="dots">Bouncing Dots</SelectItem>
                    <SelectItem value="pulse">Pulse</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Size">
                <Select 
                  value={element.props?.size as string || 'md'}
                  onValueChange={(value) => handlePropsChange('size', value)}
                >
                  <SelectTrigger className="builder-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Duration" hint="In seconds">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[(element.props?.duration as number || 3000) / 1000]}
                    onValueCommit={([v]) => handlePropsChange('duration', v * 1000)}
                    min={1} max={10} step={0.5} className="flex-1"
                  />
                  <span className="text-xs text-builder-text w-10">{((element.props?.duration as number || 3000) / 1000).toFixed(1)}s</span>
                </div>
              </FieldGroup>
              <FieldGroup label="Easing">
                <Select 
                  value={element.props?.easing as string || 'ease-out'}
                  onValueChange={(value) => handlePropsChange('easing', value)}
                >
                  <SelectTrigger className="builder-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="ease-in">Ease In</SelectItem>
                    <SelectItem value="ease-out">Ease Out</SelectItem>
                    <SelectItem value="ease-in-out">Ease In-Out</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Show Progress</span>
                <BooleanToggle 
                  value={coerceBoolean(element.props?.showProgress, true)} 
                  onValueChange={(v) => handlePropsChange('showProgress', v)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Show Percentage</span>
                <BooleanToggle 
                  value={coerceBoolean(element.props?.showPercentage, true)} 
                  onValueChange={(v) => handlePropsChange('showPercentage', v)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Auto Advance</span>
                <BooleanToggle 
                  value={coerceBoolean(element.props?.autoAdvance, true)} 
                  onValueChange={(v) => handlePropsChange('autoAdvance', v)} 
                />
              </div>
            </div>
          </CollapsibleSection>
          
          {/* Custom Steps for Analyzing type */}
          {element.props?.animationType === 'analyzing' && (
            <CollapsibleSection title="Step Messages" icon={<ListOrdered className="w-4 h-4" />}>
              <div className="pt-3 space-y-2">
                <DndContext
                  sensors={useSensors(
                    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
                    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
                  )}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => {
                    const { active, over } = event;
                    if (!over || active.id === over.id) return;
                    const currentSteps = (element.props?.customSteps as string[]) || ['Analyzing your responses...', 'Calculating results...', 'Preparing your personalized report...'];
                    const oldIndex = currentSteps.findIndex((_, i) => `step-${i}` === active.id);
                    const newIndex = currentSteps.findIndex((_, i) => `step-${i}` === over.id);
                    if (oldIndex === -1 || newIndex === -1) return;
                    const reordered = arrayMove(currentSteps, oldIndex, newIndex);
                    handlePropsChange('customSteps', reordered);
                  }}
                >
                  <SortableContext
                    items={((element.props?.customSteps as string[]) || ['Analyzing your responses...', 'Calculating results...', 'Preparing your personalized report...']).map((_, i) => `step-${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {((element.props?.customSteps as string[]) || ['Analyzing your responses...', 'Calculating results...', 'Preparing your personalized report...']).map((step, idx) => (
                      <SortableRow key={`step-${idx}`} id={`step-${idx}`}>
                        <span className="text-xs text-builder-text-muted w-4">{idx + 1}.</span>
                        <Input
                          value={step}
                          onChange={(e) => {
                            const steps = [...((element.props?.customSteps as string[]) || ['Analyzing your responses...', 'Calculating results...', 'Preparing your personalized report...'])];
                            steps[idx] = e.target.value;
                            handlePropsChange('customSteps', steps);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="builder-input flex-1 text-xs h-8"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            const steps = ((element.props?.customSteps as string[]) || ['Analyzing your responses...', 'Calculating results...', 'Preparing your personalized report...']).filter((_, i) => i !== idx);
                            if (steps.length > 0) handlePropsChange('customSteps', steps);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </SortableRow>
                    ))}
                  </SortableContext>
                </DndContext>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2 mt-2"
                  onClick={() => {
                    const steps = [...((element.props?.customSteps as string[]) || ['Analyzing your responses...', 'Calculating results...', 'Preparing your personalized report...'])];
                    steps.push(`Step ${steps.length + 1}...`);
                    handlePropsChange('customSteps', steps);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </Button>
              </div>
            </CollapsibleSection>
          )}
          
          <CollapsibleSection title="Colors" icon={<Palette className="w-4 h-4" />}>
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Primary Color</span>
                <ColorPickerPopover 
                  color={(element.props?.colors as { primary?: string } | undefined)?.primary || 'hsl(var(--primary))'}
                  onChange={(color) => handlePropsChange('colors', { ...(element.props?.colors as object || {}), primary: color })}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.colors as { primary?: string } | undefined)?.primary || 'hsl(var(--primary))' }} />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Background</span>
                <ColorPickerPopover 
                  color={(element.props?.colors as { background?: string } | undefined)?.background || 'hsl(var(--muted))'}
                  onChange={(color) => handlePropsChange('colors', { ...(element.props?.colors as object || {}), background: color })}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.colors as { background?: string } | undefined)?.background || 'hsl(var(--muted))' }} />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Text Color</span>
                <ColorPickerPopover 
                  color={(element.props?.colors as { text?: string } | undefined)?.text || '#ffffff'}
                  onChange={(color) => handlePropsChange('colors', { ...(element.props?.colors as object || {}), text: color })}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.colors as { text?: string } | undefined)?.text || '#ffffff' }} />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* ========== CAROUSEL SECTION ========== */}
      {element.type === 'carousel' && (
        <>
          <CollapsibleSection title="Carousel Settings" icon={<Layers className="w-4 h-4" />} defaultOpen>
            <div className="pt-3 space-y-3">
              <FieldGroup label="Aspect Ratio">
                <Select 
                  value={element.props?.aspectRatio as string || '16:9'}
                  onValueChange={(value) => handlePropsChange('aspectRatio', value)}
                >
                  <SelectTrigger className="builder-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                    <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                    <SelectItem value="21:9">21:9 (Cinematic)</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Navigation">
                <Select 
                  value={element.props?.navigationStyle as string || 'both'}
                  onValueChange={(value) => handlePropsChange('navigationStyle', value)}
                >
                  <SelectTrigger className="builder-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="both">Arrows + Dots</SelectItem>
                    <SelectItem value="arrows">Arrows Only</SelectItem>
                    <SelectItem value="dots">Dots Only</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Autoplay</span>
                <BooleanToggle 
                  value={coerceBoolean(element.props?.autoplay, false)} 
                  onValueChange={(v) => handlePropsChange('autoplay', v)} 
                />
              </div>
              {element.props?.autoplay && (
                <FieldGroup label="Interval" hint="Seconds between slides">
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[(element.props?.autoplayInterval as number || 4000) / 1000]}
                      onValueCommit={([v]) => handlePropsChange('autoplayInterval', v * 1000)}
                      min={2} max={10} step={0.5} className="flex-1"
                    />
                    <span className="text-xs text-builder-text w-10">{((element.props?.autoplayInterval as number || 4000) / 1000).toFixed(1)}s</span>
                  </div>
                </FieldGroup>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Loop</span>
                <BooleanToggle 
                  value={coerceBoolean(element.props?.loop, true)} 
                  onValueChange={(v) => handlePropsChange('loop', v)} 
                />
              </div>
            </div>
          </CollapsibleSection>
          <CollapsibleSection title="Slides" icon={<ImageIcon className="w-4 h-4" />}>
            <div className="pt-3 space-y-2">
              <DndContext
                sensors={useSensors(
                  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
                  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
                )}
                collisionDetection={closestCenter}
                onDragEnd={(event) => {
                  const { active, over } = event;
                  if (!over || active.id === over.id) return;
                  const currentSlides = (element.props?.slides as Array<{ id: string; src: string; alt?: string; caption?: string }>) || [];
                  const oldIndex = currentSlides.findIndex((s) => s.id === active.id);
                  const newIndex = currentSlides.findIndex((s) => s.id === over.id);
                  if (oldIndex === -1 || newIndex === -1) return;
                  const reordered = arrayMove(currentSlides, oldIndex, newIndex);
                  handlePropsChange('slides', reordered);
                }}
              >
                <SortableContext
                  items={((element.props?.slides as Array<{ id: string }>) || []).map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {((element.props?.slides as Array<{ id: string; src: string; alt?: string; caption?: string }>) || []).map((slide, idx) => (
                    <SortableRow key={slide.id} id={slide.id}>
                      <div 
                        className="w-14 h-10 rounded bg-muted flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-primary/50 transition-all"
                        onClick={() => {
                          (window as any).__editingSlideIndex = idx;
                          setIsImagePickerOpen(true);
                        }}
                      >
                        {slide.src ? (
                          <img src={slide.src} alt={slide.alt || ''} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                        )}
                      </div>
                      <Input 
                        value={slide.alt || ''} 
                        onChange={(e) => {
                          const slides = [...((element.props?.slides as Array<{ id: string; src: string; alt?: string; caption?: string }>) || [])];
                          slides[idx] = { ...slides[idx], alt: e.target.value };
                          handlePropsChange('slides', slides);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        placeholder="Alt text..."
                        className="builder-input flex-1 text-xs h-8"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const slides = ((element.props?.slides as Array<{ id: string; src: string; alt?: string; caption?: string }>) || []).filter((_, i) => i !== idx);
                          handlePropsChange('slides', slides);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </SortableRow>
                  ))}
                </SortableContext>
              </DndContext>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2 mt-2"
                onClick={() => {
                  const slides = [...((element.props?.slides as Array<{ id: string; src: string; alt?: string; caption?: string }>) || [])];
                  slides.push({ id: `slide-${Date.now()}`, src: '', alt: `Slide ${slides.length + 1}` });
                  handlePropsChange('slides', slides);
                }}
              >
                <Plus className="w-4 h-4" />
                Add Slide
              </Button>
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* ========== LOGO MARQUEE SECTION ========== */}
      {element.type === 'logo-marquee' && (
        <>
          <CollapsibleSection title="Logo Bar Settings" icon={<Layout className="w-4 h-4" />} defaultOpen>
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Animated</span>
                <BooleanToggle 
                  value={coerceBoolean(element.props?.animated, true)} 
                  onValueChange={(v) => handlePropsChange('animated', v)} 
                />
              </div>
              {coerceBoolean(element.props?.animated, true) && (
                <>
                  <FieldGroup label="Speed" hint="Seconds for one cycle">
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[element.props?.speed as number || 30]}
                        onValueCommit={([v]) => handlePropsChange('speed', v)}
                        min={10} max={60} step={5} className="flex-1"
                      />
                      <span className="text-xs text-builder-text w-10">{String(element.props?.speed || 30)}s</span>
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Direction">
                    <Select 
                      value={element.props?.direction as string || 'left'}
                      onValueChange={(value) => handlePropsChange('direction', value)}
                    >
                      <SelectTrigger className="builder-input"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-builder-text-muted">Pause on Hover</span>
                    <BooleanToggle 
                      value={coerceBoolean(element.props?.pauseOnHover, true)} 
                      onValueChange={(v) => handlePropsChange('pauseOnHover', v)} 
                    />
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Grayscale</span>
                <BooleanToggle 
                  value={coerceBoolean(element.props?.grayscale, true)} 
                  onValueChange={(v) => handlePropsChange('grayscale', v)} 
                />
              </div>
              <FieldGroup label="Logo Height">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[element.props?.logoHeight as number || 40]}
                    onValueCommit={([v]) => handlePropsChange('logoHeight', v)}
                    min={24} max={80} step={4} className="flex-1"
                  />
                  <span className="text-xs text-builder-text w-10">{String(element.props?.logoHeight || 40)}px</span>
                </div>
              </FieldGroup>
            </div>
          </CollapsibleSection>
          <CollapsibleSection title="Logos" icon={<ImageIcon className="w-4 h-4" />}>
            <div className="pt-3 space-y-2">
              <DndContext
                sensors={useSensors(
                  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
                  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
                )}
                collisionDetection={closestCenter}
                onDragEnd={(event) => {
                  const { active, over } = event;
                  if (!over || active.id === over.id) return;
                  const currentLogos = (element.props?.logos as Array<{ id: string; src: string; alt?: string; url?: string }>) || [];
                  const oldIndex = currentLogos.findIndex((l) => l.id === active.id);
                  const newIndex = currentLogos.findIndex((l) => l.id === over.id);
                  if (oldIndex === -1 || newIndex === -1) return;
                  const reordered = arrayMove(currentLogos, oldIndex, newIndex);
                  handlePropsChange('logos', reordered);
                }}
              >
                <SortableContext
                  items={((element.props?.logos as Array<{ id: string }>) || []).map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {((element.props?.logos as Array<{ id: string; src: string; alt?: string; url?: string }>) || []).map((logo, idx) => (
                    <SortableRow key={logo.id} id={logo.id}>
                      <div 
                        className="w-12 h-8 rounded bg-muted flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-primary/50 transition-all"
                        onClick={() => {
                          (window as any).__editingLogoIndex = idx;
                          setIsImagePickerOpen(true);
                        }}
                      >
                        {logo.src ? (
                          <img src={logo.src} alt={logo.alt || ''} className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <Input 
                        value={logo.url || ''} 
                        onChange={(e) => {
                          const logos = [...((element.props?.logos as Array<{ id: string; src: string; alt?: string; url?: string }>) || [])];
                          logos[idx] = { ...logos[idx], url: e.target.value };
                          handlePropsChange('logos', logos);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        placeholder="Link URL..."
                        className="builder-input flex-1 text-xs h-8"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const logos = ((element.props?.logos as Array<{ id: string; src: string; alt?: string; url?: string }>) || []).filter((_, i) => i !== idx);
                          handlePropsChange('logos', logos);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </SortableRow>
                  ))}
                </SortableContext>
              </DndContext>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2 mt-2"
                onClick={() => {
                  const logos = [...((element.props?.logos as Array<{ id: string; src: string; alt?: string; url?: string }>) || [])];
                  logos.push({ id: `logo-${Date.now()}`, src: '', alt: `Logo ${logos.length + 1}` });
                  handlePropsChange('logos', logos);
                }}
              >
                <Plus className="w-4 h-4" />
                Add Logo
              </Button>
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* ========== MAP EMBED SECTION ========== */}
      {element.type === 'map-embed' && (
        <>
          <CollapsibleSection title="Map Settings" icon={<MapPin className="w-4 h-4" />} defaultOpen>
            <div className="pt-3 space-y-3">
              <FieldGroup label="Address">
                <Textarea
                  value={element.props?.address as string || ''}
                  onChange={(e) => handlePropsChange('address', e.target.value)}
                  className="builder-input min-h-[60px]"
                  placeholder="123 Main St, City, Country"
                />
              </FieldGroup>
              <FieldGroup label="Zoom Level">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[element.props?.zoom as number || 15]}
                    onValueCommit={([v]) => handlePropsChange('zoom', v)}
                    min={5} max={20} step={1} className="flex-1"
                  />
                  <span className="text-xs text-builder-text w-8">{String(element.props?.zoom || 15)}</span>
                </div>
              </FieldGroup>
              <FieldGroup label="Map Type">
                <Select 
                  value={element.props?.mapType as string || 'roadmap'}
                  onValueChange={(value) => handlePropsChange('mapType', value)}
                >
                  <SelectTrigger className="builder-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="roadmap">Roadmap</SelectItem>
                    <SelectItem value="satellite">Satellite</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="terrain">Terrain</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Height">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[parseInt(element.styles?.height as string || '300', 10)]}
                    onValueCommit={([v]) => handleStyleChange('height', `${v}px`)}
                    min={150} max={600} step={50} className="flex-1"
                  />
                  <span className="text-xs text-builder-text w-12">{parseInt(element.styles?.height as string || '300', 10)}px</span>
                </div>
              </FieldGroup>
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* ========== HTML EMBED SECTION ========== */}
      {element.type === 'html-embed' && (
        <>
          <CollapsibleSection title="HTML Settings" icon={<Code className="w-4 h-4" />} defaultOpen>
            <div className="pt-3 space-y-3">
              <FieldGroup label="HTML Code">
                <Textarea
                  value={element.props?.code as string || ''}
                  onChange={(e) => handlePropsChange('code', e.target.value)}
                  className="builder-input min-h-[120px] font-mono text-xs"
                  placeholder="<div>Your HTML here...</div>"
                />
              </FieldGroup>
              <FieldGroup label="Height">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[parseInt(element.styles?.height as string || '300', 10)]}
                    onValueCommit={([v]) => handleStyleChange('height', `${v}px`)}
                    min={100} max={600} step={50} className="flex-1"
                  />
                  <span className="text-xs text-builder-text w-12">{parseInt(element.styles?.height as string || '300', 10)}px</span>
                </div>
              </FieldGroup>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Allow Scripts</span>
                <BooleanToggle 
                  value={coerceBoolean(element.props?.allowScripts, false)} 
                  onValueChange={(v) => handlePropsChange('allowScripts', v)} 
                />
              </div>
              {element.props?.allowScripts && (
                <p className="text-[10px] text-amber-500 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Scripts are sandboxed for security
                </p>
              )}
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* ========== TRUSTPILOT SECTION ========== */}
      {element.type === 'trustpilot' && (
        <>
          <CollapsibleSection title="Trustpilot Settings" icon={<Star className="w-4 h-4" />} defaultOpen>
            <div className="pt-3 space-y-3">
              <FieldGroup label="Rating" hint="1-5 stars">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[element.props?.rating as number || 4.5]}
                    onValueCommit={([v]) => handlePropsChange('rating', v)}
                    min={1} max={5} step={0.1} className="flex-1"
                  />
                  <span className="text-xs text-builder-text w-10">{(element.props?.rating as number || 4.5).toFixed(1)}</span>
                </div>
              </FieldGroup>
              <FieldGroup label="Review Count">
                <Input
                  type="number"
                  value={element.props?.reviewCount as number || 1234}
                  onChange={(e) => handlePropsChange('reviewCount', parseInt(e.target.value) || 0)}
                  className="builder-input"
                />
              </FieldGroup>
              <FieldGroup label="Business Name">
                <Input
                  value={element.props?.businessName as string || ''}
                  onChange={(e) => handlePropsChange('businessName', e.target.value)}
                  className="builder-input"
                  placeholder="Your Company"
                />
              </FieldGroup>
              <FieldGroup label="Layout">
                <Select 
                  value={element.props?.layout as string || 'horizontal'}
                  onValueChange={(value) => handlePropsChange('layout', value)}
                >
                  <SelectTrigger className="builder-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                    <SelectItem value="vertical">Vertical</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Show Logo</span>
                <BooleanToggle 
                  value={coerceBoolean(element.props?.showLogo, true)} 
                  onValueChange={(v) => handlePropsChange('showLogo', v)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Show Review Count</span>
                <BooleanToggle 
                  value={coerceBoolean(element.props?.showReviewCount, true)} 
                  onValueChange={(v) => handlePropsChange('showReviewCount', v)} 
                />
              </div>
              <FieldGroup label="Link URL" hint="Optional Trustpilot page">
                <Input
                  value={element.props?.linkUrl as string || ''}
                  onChange={(e) => handlePropsChange('linkUrl', e.target.value)}
                  className="builder-input"
                  placeholder="https://trustpilot.com/review/..."
                />
              </FieldGroup>
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* ========== UNIVERSAL APPEARANCE/BORDER/RESPONSIVE SECTIONS ========== */}
      <UniversalAppearanceSection element={element} onUpdate={onUpdate} />

      {/* ========== UNIVERSAL VISIBILITY SECTION (for all non-premium elements) ========== */}
      <CollapsibleSection title="Visibility" icon={<Eye className="w-4 h-4" />}>
        <div className="pt-3 space-y-3">
          <p className="text-[10px] text-builder-text-dim">
            Show or hide this element based on form field values.
          </p>
          <ConditionalLogicEditor
            conditions={element.visibility?.conditions?.map(c => {
              const operatorMap: Record<string, 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'> = {
                equals: 'equals',
                notEquals: 'not_equals',
                contains: 'contains',
                notEmpty: 'not_equals',
                isEmpty: 'equals',
              };
              return {
                id: c.field,
                fieldKey: c.field,
                operator: operatorMap[c.operator] || 'equals',
                value: c.value
              };
            }) || []}
            onUpdate={(conditions) => {
              const reverseOperatorMap: Record<string, 'equals' | 'notEquals' | 'contains' | 'notEmpty' | 'isEmpty' | 'greaterThan' | 'lessThan'> = {
                equals: 'equals',
                not_equals: 'notEquals',
                contains: 'contains',
                greater_than: 'greaterThan',
                less_than: 'lessThan',
              };
              const mapped = conditions.map(c => ({
                field: c.fieldKey,
                operator: reverseOperatorMap[c.operator] || 'equals',
                value: c.value,
                action: 'show' as const
              }));
              onUpdate({ 
                visibility: mapped.length > 0 
                  ? { conditions: mapped, logic: 'and' as const }
                  : undefined 
              });
            }}
            availableFields={collectFieldKeys(page.steps || []).map(f => ({ key: f.key, label: f.label }))}
          />
        </div>
      </CollapsibleSection>

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
  // BUG FIX: Derive bgType directly from step.background to ensure it resets when step changes.
  // Previously, useState initialized once and never updated when switching steps, causing
  // the inspector to show stale background type from the previous step.
  const currentBgType = step.background?.type || 'solid';
  // Now support all background types including 'pattern'
  const [bgType, setBgType] = useState<'solid' | 'gradient' | 'image' | 'video' | 'pattern'>(currentBgType as 'solid' | 'gradient' | 'image' | 'video' | 'pattern');
  
  // CRITICAL: Reset local bgType state when the step changes.
  // Without this, switching to a new step would keep the old step's bgType in state,
  // causing visual mismatch and potential data corruption when editing.
  useEffect(() => {
    const type = step.background?.type || 'solid';
    setBgType(type as 'solid' | 'gradient' | 'image' | 'video' | 'pattern');
  }, [step.id, step.background?.type]);
  
  const handleBackgroundTypeChange = (newType: 'solid' | 'gradient' | 'image' | 'video' | 'pattern') => {
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
        ...(newType === 'video' && { 
          video: step.background?.video || '',
          videoAutoplay: true,
          videoLoop: true,
          videoMuted: true,
          videoOpacity: 100
        }),
        ...(newType === 'pattern' && {
          color: step.background?.color || '#0f172a',
          pattern: {
            type: step.background?.pattern?.type || 'dots',
            color: step.background?.pattern?.color || '#3b82f6',
            size: step.background?.pattern?.size || 20,
            opacity: step.background?.pattern?.opacity || 20,
          },
        }),
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
            <button 
              onClick={() => handleBackgroundTypeChange('video')}
              className={cn('toggle-pill-option flex-1 text-center', bgType === 'video' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive')}
            >
              Video
            </button>
            <button 
              onClick={() => handleBackgroundTypeChange('pattern')}
              className={cn('toggle-pill-option flex-1 text-center', bgType === 'pattern' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive')}
            >
              Pattern
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

          {bgType === 'video' && (
            <div className="space-y-3">
              <FieldGroup label="Video URL">
                <Input
                  value={step.background?.video || ''}
                  onChange={(e) => onUpdate({ 
                    background: { ...step.background, type: 'video', video: e.target.value } 
                  })}
                  placeholder="YouTube, Vimeo, or MP4 URL..."
                  className="builder-input"
                />
              </FieldGroup>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Opacity</span>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[step.background?.videoOpacity ?? 100]}
                    onValueChange={([v]) => onUpdate({ 
                      background: { ...step.background, type: 'video', videoOpacity: v } 
                    })}
                    min={0} max={100} step={5} className="w-20"
                  />
                  <span className="text-xs text-builder-text w-8">{step.background?.videoOpacity ?? 100}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Autoplay</span>
                <BooleanToggle 
                  value={coerceBoolean(step.background?.videoAutoplay, true)} 
                  onValueChange={(v) => onUpdate({ 
                    background: { ...step.background, type: 'video', videoAutoplay: v } 
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Loop</span>
                <BooleanToggle 
                  value={coerceBoolean(step.background?.videoLoop, true)} 
                  onValueChange={(v) => onUpdate({ 
                    background: { ...step.background, type: 'video', videoLoop: v } 
                  })}
                />
              </div>
            </div>
          )}

          {bgType === 'pattern' && (
            <div className="space-y-3">
              <FieldGroup label="Pattern Type">
                <Select 
                  value={step.background?.pattern?.type || 'dots'}
                  onValueChange={(value) => onUpdate({ 
                    background: { 
                      ...step.background, 
                      type: 'pattern', 
                      pattern: { ...step.background?.pattern, type: value as 'dots' | 'grid' | 'lines' | 'noise', color: step.background?.pattern?.color || '#3b82f6', opacity: step.background?.pattern?.opacity || 20 } 
                    } 
                  })}
                >
                  <SelectTrigger className="builder-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="dots">Dots</SelectItem>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="lines">Diagonal Lines</SelectItem>
                    <SelectItem value="noise">Cross-Hatch</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Pattern Color</span>
                <ColorPickerPopover
                  color={step.background?.pattern?.color || '#3b82f6'}
                  onChange={(color) => onUpdate({ 
                    background: { 
                      ...step.background, 
                      type: 'pattern', 
                      pattern: { ...step.background?.pattern, type: step.background?.pattern?.type || 'dots', color, opacity: step.background?.pattern?.opacity || 20 } 
                    } 
                  })}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div 
                      className="w-6 h-6 rounded-md border border-builder-border" 
                      style={{ backgroundColor: step.background?.pattern?.color || '#3b82f6' }}
                    />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Base Color</span>
                <ColorPickerPopover
                  color={step.background?.color || '#0f172a'}
                  onChange={(color) => onUpdate({ 
                    background: { ...step.background, type: 'pattern', color } 
                  })}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div 
                      className="w-6 h-6 rounded-md border border-builder-border" 
                      style={{ backgroundColor: step.background?.color || '#0f172a' }}
                    />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Pattern Size</span>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[step.background?.pattern?.size ?? 20]}
                    onValueChange={([v]) => onUpdate({ 
                      background: { 
                        ...step.background, 
                        type: 'pattern', 
                        pattern: { ...step.background?.pattern, type: step.background?.pattern?.type || 'dots', color: step.background?.pattern?.color || '#3b82f6', opacity: step.background?.pattern?.opacity || 20, size: v } 
                      } 
                    })}
                    min={8} max={60} step={4} className="w-20"
                  />
                  <span className="text-xs text-builder-text w-8">{step.background?.pattern?.size ?? 20}px</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Opacity</span>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[step.background?.pattern?.opacity ?? 20]}
                    onValueChange={([v]) => onUpdate({ 
                      background: { 
                        ...step.background, 
                        type: 'pattern', 
                        pattern: { ...step.background?.pattern, type: step.background?.pattern?.type || 'dots', color: step.background?.pattern?.color || '#3b82f6', size: step.background?.pattern?.size || 20, opacity: v } 
                      } 
                    })}
                    min={5} max={50} step={5} className="w-20"
                  />
                  <span className="text-xs text-builder-text w-8">{step.background?.pattern?.opacity ?? 20}%</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-[10px] text-builder-text-dim">
            Overrides the global Canvas Background for this step only. The "Card Background" in the section inspector styles the content card that sits on top.
          </p>
        </div>
      </CollapsibleSection>

      {/* Phase 14: Content Area Settings */}
      <CollapsibleSection title="Content Area" icon={<BoxSelect className="w-4 h-4" />}>
        <div className="space-y-3 pt-3">
          <FieldGroup label="Max Width">
            <Select 
              value={step.settings?.maxWidth as string || '1200px'}
              onValueChange={(value) => onUpdate({ settings: { ...step.settings, maxWidth: value } })}
            >
              <SelectTrigger className="builder-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="640px">Narrow (640px)</SelectItem>
                <SelectItem value="768px">Small (768px)</SelectItem>
                <SelectItem value="1024px">Medium (1024px)</SelectItem>
                <SelectItem value="1200px">Large (1200px)</SelectItem>
                <SelectItem value="1400px">XL (1400px)</SelectItem>
                <SelectItem value="100%">Full Width</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          
          <FieldGroup label="Min Height">
            <Select 
              value={step.settings?.minHeight as string || 'auto'}
              onValueChange={(value) => onUpdate({ settings: { ...step.settings, minHeight: value } })}
            >
              <SelectTrigger className="builder-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="50vh">Half Screen</SelectItem>
                <SelectItem value="100vh">Full Screen</SelectItem>
                <SelectItem value="150vh">1.5x Screen</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          
          <FieldGroup label="Content Alignment">
            <Select 
              value={step.settings?.verticalAlign || 'top'}
              onValueChange={(value) => onUpdate({ settings: { ...step.settings, verticalAlign: value as 'top' | 'center' | 'bottom' } })}
            >
              <SelectTrigger className="builder-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
        </div>
      </CollapsibleSection>

      {/* Phase 14: Background Overlay */}
      <CollapsibleSection title="Background Overlay" icon={<Layers className="w-4 h-4" />}>
        <div className="space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Enable Overlay</span>
            <BooleanToggle 
              value={coerceBoolean((step.settings as Record<string, unknown>)?.overlayEnabled, false)}
              onValueChange={(v) => onUpdate({ 
                settings: { 
                  ...step.settings, 
                  overlayEnabled: v 
                }
              })}
            />
          </div>
          
          {(step.settings as Record<string, unknown>)?.overlayEnabled && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Overlay Color</span>
                <ColorPickerPopover
                  color={(step.settings as Record<string, unknown>)?.overlayColor as string || '#000000'}
                  onChange={(color) => onUpdate({ 
                    settings: { ...step.settings, overlayColor: color }
                  })}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div 
                      className="w-6 h-6 rounded-md border border-builder-border" 
                      style={{ backgroundColor: (step.settings as Record<string, unknown>)?.overlayColor as string || '#000000' }} 
                    />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Opacity</span>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[(step.settings as Record<string, unknown>)?.overlayOpacity as number ?? 50]}
                    onValueChange={([v]) => onUpdate({ 
                      settings: { ...step.settings, overlayOpacity: v }
                    })}
                    min={0} max={100} step={5}
                    className="w-20"
                  />
                  <span className="text-xs text-builder-text w-8">
                    {step.settings?.overlayOpacity ?? 50}%
                  </span>
                </div>
              </div>
            </>
          )}
          
          <p className="text-[10px] text-builder-text-dim">
            Adds a color overlay on top of the background for better text readability.
          </p>
        </div>
      </CollapsibleSection>

      {/* Phase 14: Glass/Blur Effects */}
      <CollapsibleSection title="Effects" icon={<Sparkles className="w-4 h-4" />}>
        <div className="space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Glassmorphism</span>
            <BooleanToggle 
              value={coerceBoolean((step.settings as Record<string, unknown>)?.glassEnabled, false)}
              onValueChange={(v) => onUpdate({ 
                settings: { 
                  ...step.settings, 
                  glassEnabled: v 
                }
              })}
            />
          </div>
          
          {(step.settings as Record<string, unknown>)?.glassEnabled && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Blur Amount</span>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[(step.settings as Record<string, unknown>)?.glassBlur as number ?? 10]}
                    onValueChange={([v]) => onUpdate({ 
                      settings: { ...step.settings, glassBlur: v }
                    })}
                    min={0} max={30} step={2}
                    className="w-20"
                  />
                  <span className="text-xs text-builder-text w-8">
                    {step.settings?.glassBlur ?? 10}px
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Glass Tint</span>
                <ColorPickerPopover
                  color={(step.settings as Record<string, unknown>)?.glassTint as string || 'rgba(255,255,255,0.1)'}
                  onChange={(color) => onUpdate({ 
                    settings: { ...step.settings, glassTint: color }
                  })}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div 
                      className="w-6 h-6 rounded-md border border-builder-border" 
                      style={{ backgroundColor: (step.settings as Record<string, unknown>)?.glassTint as string || 'rgba(255,255,255,0.1)' }} 
                    />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
            </>
          )}
          
          <p className="text-[10px] text-builder-text-dim">
            Creates a frosted glass effect on the content area.
          </p>
        </div>
      </CollapsibleSection>

      {/* Phase 14: Scroll Animation */}
      <CollapsibleSection title="Scroll Animation" icon={<ArrowUpDown className="w-4 h-4" />}>
        <div className="space-y-3 pt-3">
          <FieldGroup label="Animation Type">
            <Select 
              value={step.settings?.scrollAnimation || 'none'}
              onValueChange={(value) => onUpdate({ settings: { ...step.settings, scrollAnimation: value as Step['settings']['scrollAnimation'] } })}
            >
              <SelectTrigger className="builder-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="fade-in">Fade In</SelectItem>
                <SelectItem value="slide-up">Slide Up</SelectItem>
                <SelectItem value="slide-left">Slide from Left</SelectItem>
                <SelectItem value="slide-right">Slide from Right</SelectItem>
                <SelectItem value="scale">Scale Up</SelectItem>
                <SelectItem value="parallax">Parallax</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          
          {(step.settings as Record<string, unknown>)?.scrollAnimation && 
           (step.settings as Record<string, unknown>)?.scrollAnimation !== 'none' && (
            <>
              <FieldGroup label="Delay">
                <Select 
                  value={(step.settings as Record<string, unknown>)?.scrollDelay as string || '0ms'}
                  onValueChange={(value) => onUpdate({ settings: { ...step.settings, scrollDelay: value } })}
                >
                  <SelectTrigger className="builder-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="0ms">None</SelectItem>
                    <SelectItem value="100ms">100ms</SelectItem>
                    <SelectItem value="200ms">200ms</SelectItem>
                    <SelectItem value="300ms">300ms</SelectItem>
                    <SelectItem value="500ms">500ms</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              
              <FieldGroup label="Duration">
                <Select 
                  value={(step.settings as Record<string, unknown>)?.scrollDuration as string || '500ms'}
                  onValueChange={(value) => onUpdate({ settings: { ...step.settings, scrollDuration: value } })}
                >
                  <SelectTrigger className="builder-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="300ms">Fast (300ms)</SelectItem>
                    <SelectItem value="500ms">Normal (500ms)</SelectItem>
                    <SelectItem value="700ms">Slow (700ms)</SelectItem>
                    <SelectItem value="1000ms">Very Slow (1s)</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
            </>
          )}
          
          <p className="text-[10px] text-builder-text-dim">
            Animate content as visitors scroll down the page.
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
  // IMPROVED: Read gradient from props.backgroundGradient object first to avoid parsing losses
  const getBlockBackgroundValue = (): BackgroundValue => {
    // Check if we have a stored gradient object (preferred)
    if (block.props?.backgroundGradient) {
      return { 
        type: 'gradient', 
        gradient: cloneGradient(block.props.backgroundGradient as GradientValue) 
      };
    }
    // Fallback: parse from CSS string (legacy)
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
        },
        props: {
          ...block.props,
          backgroundGradient: undefined // Clear gradient object
        }
      });
    } else if (value.type === 'gradient' && value.gradient) {
      const css = gradientToCSS(value.gradient);
      onUpdate({ 
        styles: { 
          ...block.styles, 
          background: css,
          backgroundColor: undefined
        },
        props: {
          ...block.props,
          backgroundGradient: cloneGradient(value.gradient) // Store gradient object for lossless retrieval
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

      {/* Media Block Controls - for media/image/video content blocks */}
      {block.type === 'media' && (
        <CollapsibleSection title="Media Settings" icon={<ImageIcon className="w-4 h-4" />} defaultOpen>
          <div className="pt-3 space-y-3">
            <div className="text-xs text-builder-text-muted bg-builder-surface-hover rounded-lg p-3">
              <p className="font-medium text-builder-text mb-1">💡 To edit the image:</p>
              <p>Click directly on the image element in the canvas to access image controls (source, size, fit).</p>
            </div>
          </div>
        </CollapsibleSection>
      )}

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
              <BooleanToggle
                value={coerceBoolean(block.props?.wrap, false)}
                onValueChange={(v) => onUpdate({ props: { ...block.props, wrap: v } })}
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
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Gradient Border</span>
              <BooleanToggle 
                value={coerceBoolean(block.props?.gradientBorder, false)} 
                onValueChange={(v) => {
                  if (v) {
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
            
            {/* Quick Effects Presets */}
            <div className="space-y-2 pt-2 border-t border-builder-border/50">
              <span className="text-xs text-builder-text-muted">Quick Effects</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    handleStyleUpdate('backdropBlur', '12px');
                    handleStyleUpdate('backgroundColor', 'rgba(255,255,255,0.1)');
                    handleStyleUpdate('borderWidth', '1px');
                    handleStyleUpdate('borderColor', 'rgba(255,255,255,0.2)');
                    handleStyleUpdate('borderRadius', '16px');
                  }}
                  className="px-2 py-1.5 text-[10px] rounded-md bg-builder-surface-hover hover:bg-builder-surface-active transition-colors text-builder-text-muted hover:text-builder-text"
                >
                  Glassmorphism
                </button>
                <button
                  onClick={() => {
                    onUpdate({ 
                      props: { ...block.props, shadow: 'neon', glowColor: '#8b5cf6' }
                    });
                    handleStyleUpdate('borderRadius', '12px');
                  }}
                  className="px-2 py-1.5 text-[10px] rounded-md bg-builder-surface-hover hover:bg-builder-surface-active transition-colors text-builder-text-muted hover:text-builder-text"
                >
                  Neon Glow
                </button>
                <button
                  onClick={() => {
                    onUpdate({ props: { ...block.props, shadow: 'lg' } });
                    handleStyleUpdate('backgroundColor', 'rgba(255,255,255,0.95)');
                    handleStyleUpdate('borderRadius', '16px');
                    handleStyleUpdate('backdropBlur', '0px');
                  }}
                  className="px-2 py-1.5 text-[10px] rounded-md bg-builder-surface-hover hover:bg-builder-surface-active transition-colors text-builder-text-muted hover:text-builder-text"
                >
                  Soft Shadow
                </button>
                <button
                  onClick={() => {
                    onUpdate({ props: { ...block.props, shadow: 'xl' } });
                    handleStyleUpdate('borderRadius', '20px');
                    handleStyleUpdate('backgroundColor', 'rgba(255,255,255,0.98)');
                  }}
                  className="px-2 py-1.5 text-[10px] rounded-md bg-builder-surface-hover hover:bg-builder-surface-active transition-colors text-builder-text-muted hover:text-builder-text"
                >
                  Floating Card
                </button>
              </div>
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
    if (bg === 'video' && frame.backgroundVideo) {
      return { 
        type: 'video', 
        videoUrl: frame.backgroundVideo,
        videoAutoplay: frame.backgroundVideoAutoplay ?? true,
        videoLoop: frame.backgroundVideoLoop ?? true,
        videoMuted: frame.backgroundVideoMuted ?? true,
        videoOpacity: frame.backgroundVideoOpacity ?? 100,
      };
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
      updates.backgroundVideo = undefined;
    } else if (value.type === 'gradient') {
      updates.background = 'gradient';
      updates.backgroundGradient = value.gradient ? cloneGradient(value.gradient) : undefined;
      updates.backgroundColor = undefined;
      updates.backgroundImage = undefined;
      updates.backgroundVideo = undefined;
    } else if (value.type === 'image') {
      updates.background = 'image';
      updates.backgroundImage = value.imageUrl;
      updates.backgroundColor = undefined;
      updates.backgroundGradient = undefined;
      updates.backgroundVideo = undefined;
    } else if (value.type === 'video') {
      updates.background = 'video';
      updates.backgroundVideo = value.videoUrl;
      updates.backgroundVideoAutoplay = value.videoAutoplay ?? true;
      updates.backgroundVideoLoop = value.videoLoop ?? true;
      updates.backgroundVideoMuted = value.videoMuted ?? true;
      updates.backgroundVideoOpacity = value.videoOpacity ?? 100;
      updates.backgroundColor = undefined;
      updates.backgroundGradient = undefined;
      updates.backgroundImage = undefined;
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
                  frame.layout === 'contained' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive'
                )}
              >
                Contained
              </button>
              <button 
                type="button"
                onClick={() => onUpdate({ layout: 'full-width' })}
                className={cn(
                  'toggle-pill-option flex-1 text-center',
                  (frame.layout || 'full-width') === 'full-width' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive'
                )}
              >
                Full Width
              </button>
            </div>
          </FieldGroup>

          {/* Max Width Slider - only when contained */}
          {frame.layout === 'contained' && (
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
            showVideoOption={true}
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
  const rawBgType = page.settings.page_background?.type || 'solid';
  const [localBgType, setLocalBgType] = useState<'solid' | 'gradient' | 'image' | 'video'>(
    rawBgType === 'pattern' ? 'solid' : (rawBgType as 'solid' | 'gradient' | 'image' | 'video')
  );
  
  // Sync local state with external prop changes
  useEffect(() => {
    const externalType = page.settings.page_background?.type || 'solid';
    const normalizedType = externalType === 'pattern' ? 'solid' : externalType;
    if (normalizedType !== localBgType) {
      setLocalBgType(normalizedType as 'solid' | 'gradient' | 'image' | 'video');
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
  const handleBackgroundTypeChange = useCallback((newType: 'solid' | 'gradient' | 'image' | 'video') => {
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
          ...(newType === 'video' && {
            video: page.settings.page_background?.video || '',
            videoAutoplay: page.settings.page_background?.videoAutoplay ?? true,
            videoLoop: page.settings.page_background?.videoLoop ?? true,
            videoMuted: page.settings.page_background?.videoMuted ?? true,
            videoOpacity: page.settings.page_background?.videoOpacity ?? 100,
          }),
        },
      },
    };
    
    onUpdate(updates);
  }, [page.settings, onUpdate]);

  // Keyboard navigation for toggle pill
  const handleToggleKeyDown = useCallback((e: React.KeyboardEvent, currentType: string) => {
    const types = ['solid', 'gradient', 'image', 'video'] as const;
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

      <CollapsibleSection title="Canvas Background" icon={<ImageIcon className="w-4 h-4" />} defaultOpen>
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
            <button 
              type="button"
              role="tab"
              aria-selected={currentBgType === 'video'}
              tabIndex={currentBgType === 'video' ? 0 : -1}
              onClick={() => handleBackgroundTypeChange('video')}
              onKeyDown={(e) => handleToggleKeyDown(e, currentBgType)}
              className={cn(
                'toggle-pill-option flex-1 text-center focus:outline-none focus:ring-2 focus:ring-builder-accent focus:ring-inset',
                currentBgType === 'video' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive'
              )}
            >
              Video
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

          {/* Video Background Section */}
          {currentBgType === 'video' && (
            <div className="space-y-3">
              <FieldGroup label="Video URL" hint="YouTube, Vimeo, or direct .mp4 URL">
                <div className="flex gap-2">
                  <Input
                    value={page.settings.page_background?.video || ''}
                    onChange={(e) => onUpdate({ 
                      settings: { 
                        ...page.settings, 
                        page_background: { 
                          ...page.settings.page_background,
                          type: 'video', 
                          video: e.target.value 
                        } 
                      } 
                    })}
                    placeholder="https://..."
                    className="builder-input flex-1"
                  />
                  <StockVideoPicker onSelect={(url) => onUpdate({ 
                    settings: { 
                      ...page.settings, 
                      page_background: { 
                        ...page.settings.page_background,
                        type: 'video', 
                        video: url 
                      } 
                    } 
                  })}>
                    <Button variant="outline" size="sm" className="px-2">
                      <Video className="w-4 h-4" />
                    </Button>
                  </StockVideoPicker>
                </div>
              </FieldGroup>
              
              {/* Video Preview */}
              {page.settings.page_background?.video && (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-builder-border bg-black">
                  {page.settings.page_background.video.match(/\.(mp4|webm|ogg)(\?|$)/i) ? (
                    <video 
                      src={page.settings.page_background.video} 
                      autoPlay 
                      muted 
                      loop 
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : page.settings.page_background.video.includes('youtube') || page.settings.page_background.video.includes('youtu.be') ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${page.settings.page_background.video.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1]}?autoplay=1&mute=1&loop=1&controls=0`}
                      className="w-full h-full"
                      allow="autoplay"
                    />
                  ) : page.settings.page_background.video.includes('vimeo') ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${page.settings.page_background.video.match(/vimeo\.com\/(\d+)/)?.[1]}?autoplay=1&muted=1&loop=1&background=1`}
                      className="w-full h-full"
                      allow="autoplay"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Video className="w-8 h-8" />
                    </div>
                  )}
                </div>
              )}
              
              {/* Video Options */}
              <div className="space-y-2 pt-2 border-t border-builder-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Autoplay</span>
                  <BooleanToggle 
                    value={coerceBoolean(page.settings.page_background?.videoAutoplay, true)}
                    onValueChange={(v) => onUpdate({ 
                      settings: { 
                        ...page.settings, 
                        page_background: { 
                          ...page.settings.page_background,
                          type: 'video',
                          videoAutoplay: v
                        } 
                      } 
                    })}
                    labels={['On', 'Off']}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Loop</span>
                  <BooleanToggle 
                    value={coerceBoolean(page.settings.page_background?.videoLoop, true)}
                    onValueChange={(v) => onUpdate({ 
                      settings: { 
                        ...page.settings, 
                        page_background: { 
                          ...page.settings.page_background,
                          type: 'video',
                          videoLoop: v
                        } 
                      } 
                    })}
                    labels={['On', 'Off']}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Muted</span>
                  <BooleanToggle 
                    value={coerceBoolean(page.settings.page_background?.videoMuted, true)}
                    onValueChange={(v) => onUpdate({ 
                      settings: { 
                        ...page.settings, 
                        page_background: { 
                          ...page.settings.page_background,
                          type: 'video',
                          videoMuted: v
                        } 
                      } 
                    })}
                    labels={['On', 'Off']}
                  />
                </div>
              </div>
              
              {/* Video Opacity */}
              <div className="flex items-center justify-between pt-2 border-t border-builder-border">
                <span className="text-xs text-builder-text-muted">Opacity</span>
                <div className="flex items-center gap-2">
                  <Slider 
                    value={[page.settings.page_background?.videoOpacity ?? 100]}
                    onValueChange={(v) => onUpdate({ 
                      settings: { 
                        ...page.settings, 
                        page_background: { 
                          ...page.settings.page_background,
                          type: 'video',
                          videoOpacity: v[0] 
                        } 
                      } 
                    })}
                    min={0}
                    max={100}
                    step={5}
                    className="w-20"
                  />
                  <span className="text-xs text-builder-text w-10">{page.settings.page_background?.videoOpacity ?? 100}%</span>
                </div>
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
  onSelect,
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
  selectedApplicationStepId,
  onSelectApplicationStep,
  selectedStepElement,
  onClearStepElement,
  onClosePanel,
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
    } else if (type === 'section' || type === 'frame') {
      // Select the frame
      if (activeStep) {
        onSelect?.({ 
          id, 
          type: 'frame', 
          path: ['step', activeStep.id, 'frame', id] 
        });
      }
    } else if (type === 'block') {
      // Find the block's parent frame and select the block
      if (activeStep) {
        for (const frame of activeStep.frames) {
          for (const stack of frame.stacks) {
            const blockIndex = stack.blocks.findIndex(b => b.id === id);
            if (blockIndex !== -1) {
              onSelect?.({ 
                id, 
                type: 'block', 
                path: ['step', activeStep.id, 'frame', frame.id, 'block', id] 
              });
              return;
            }
          }
        }
      }
    } else if (type === 'element') {
      // Find the element's parent block and frame
      if (activeStep) {
        for (const frame of activeStep.frames) {
          for (const stack of frame.stacks) {
            for (const block of stack.blocks) {
              const elementIndex = block.elements.findIndex(e => e.id === id);
              if (elementIndex !== -1) {
                onSelect?.({ 
                  id, 
                  type: 'element', 
                  path: ['step', activeStep.id, 'frame', frame.id, 'block', block.id, 'element', id] 
                });
                return;
              }
            }
          }
        }
      }
    }
  }, [onClearSelection, activeStep, onSelect]);

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
      
      {/* Panel Header with Close Button */}
      <div className="flex items-center justify-between border-b border-builder-border shrink-0">
        {/* Close Panel Button - far left */}
        {onClosePanel && (
          <button
            onClick={onClosePanel}
            className="shrink-0 p-2.5 hover:bg-builder-surface-hover text-builder-text-muted hover:text-builder-text transition-colors border-r border-builder-border"
            title="Close panel"
          >
            <PanelRightClose size={14} />
          </button>
        )}
        {/* Selection Breadcrumb - shows hierarchy when something is selected */}
        {breadcrumbItems.length > 0 ? (
          <div className="flex-1 min-w-0">
            <SelectionBreadcrumb 
              items={breadcrumbItems}
              onSelect={handleBreadcrumbSelect}
            />
          </div>
        ) : (
          <div className="flex-1 px-3 py-2.5 text-sm font-medium text-builder-text">
            Inspector
          </div>
        )}
      </div>

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
          (selectedNode as Block).type === 'application-flow' ? (
            // Check if an element within a step is selected
            selectedStepElement ? (
              <StepElementInspector
                block={selectedNode as Block}
                selection={selectedStepElement}
                onUpdateBlock={(updates) => handleUpdate(updates)}
                onBack={() => onClearStepElement?.()}
                themePrimaryColor={page.settings?.primary_color || DEFAULT_FLOW_BUTTON_COLOR}
              />
            ) : (
              <ApplicationFlowInspector 
                block={selectedNode as Block} 
                onUpdateBlock={(updates) => handleUpdate(updates)}
                selectedStepId={selectedApplicationStepId}
                onSelectStep={onSelectApplicationStep}
              />
            )
          ) : (selectedNode as Block).type === 'form-field' ? (
            <InteractiveBlockInspector 
              block={selectedNode as Block} 
              onUpdateBlock={(updates) => handleUpdate(updates)}
              steps={page.steps?.map(s => ({ id: s.id, name: s.name })) || []}
            />
          ) : (
            <BlockInspector block={selectedNode as Block} onUpdate={handleUpdate} />
          )
        ) : resolvedType === 'interactive-step' && selection.applicationEngineId ? (
          // Interactive step selection - find the parent block and show step inspector
          (() => {
            const { node: parentBlock } = findNodeById(page, selection.applicationEngineId);
            if (parentBlock && (parentBlock as Block).type === 'application-flow') {
              return (
                <ApplicationFlowInspector 
                  block={parentBlock as Block} 
                  onUpdateBlock={(updates) => {
                    // Update via the parent block's path
                    onUpdateNode([], updates);
                  }}
                  selectedStepId={selection.id}
                  onSelectStep={onSelectApplicationStep}
                />
              );
            }
            // STRICT CONTRACT: Parent block not found - show error, not silent fallback
            return (
              <div className="p-4 space-y-3">
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-destructive/10 flex items-center justify-center">
                    <X className="w-5 h-5 text-destructive" />
                  </div>
                  <p className="text-sm font-medium text-builder-text">Flow Step Not Found</p>
                  <p className="text-xs text-builder-text-muted mt-1">
                    The parent flow block could not be found.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => onClearSelection()}
                >
                  Clear Selection
                </Button>
              </div>
            );
          })()
        ) : resolvedType === 'element' && selectedNode ? (
          <ElementInspector 
            element={selectedNode as Element} 
            onUpdate={handleUpdate} 
            page={page}
            steps={steps}
            allSteps={page.steps}
            onDuplicate={selection.id ? () => onDuplicateElement?.(selection.id!) : undefined}
            onDelete={selection.id ? () => onDeleteElement?.(selection.id!) : undefined}
            onMoveUp={selection.id ? () => onMoveElement?.(selection.id!, 'up') : undefined}
            onMoveDown={selection.id ? () => onMoveElement?.(selection.id!, 'down') : undefined}
            onReplayAnimation={selection.id ? () => onReplayAnimation?.(selection.id!) : undefined}
            currentDeviceMode={currentDeviceMode}
          />
        ) : resolvedType === 'stack' && selection.id && selection.path.length >= 2 ? (
          // Stack is not directly inspectable - redirect to parent frame
          (() => {
            const frameIdx = selection.path.findIndex((p, i) => p === 'frame' && selection.path[i + 1]);
            if (frameIdx !== -1 && onSelect) {
              const frameId = selection.path[frameIdx + 1];
              const framePath = selection.path.slice(0, frameIdx + 2);
              // Use effect-style redirect via setTimeout to avoid render-during-render
              setTimeout(() => onSelect({ type: 'frame', id: frameId, path: framePath }), 0);
            }
            return (
              <div className="p-4 flex items-center justify-center">
                <p className="text-xs text-builder-text-muted">Selecting section...</p>
              </div>
            );
          })()
        ) : selection.id && !selectedNode ? (
          // STRICT CONTRACT: Selection exists but node not found - show error, not fallback
          <div className="p-4 space-y-3">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-sm font-medium text-builder-text">Selection Not Found</p>
              <p className="text-xs text-builder-text-muted mt-1">
                The selected {resolvedType || 'item'} could not be found.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onClearSelection()}
            >
              Clear Selection
            </Button>
          </div>
        ) : (
          <PageInspector page={page} onUpdate={handleUpdate} onPublish={onPublish} />
        )}
      </div>
    </div>
  );
};
