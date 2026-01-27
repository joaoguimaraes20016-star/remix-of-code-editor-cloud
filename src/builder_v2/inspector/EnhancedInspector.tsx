import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Type, 
  Palette, 
  Layout, 
  Settings,
  LayoutGrid,
  Plus,
  Trash2,
  GripVertical,
  RotateCcw,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Link,
  Sparkles,
  MousePointer2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '../state/editorStore';
import { ComponentRegistry, fallbackComponent } from '../registry/componentRegistry';
import type { CanvasNode, LayoutPersonality, Page } from '../types';
import { ButtonStyleInspector, type ButtonStyleSettings } from '@/components/builder/ButtonStyleInspector';
import { ButtonActionSelector, type ButtonAction } from '@/flow-canvas/builder/components/ButtonActionSelector';
import './enhanced-inspector.css';

type InspectorTab = 'content' | 'design' | 'blocks' | 'settings';

// Element-to-tab mapping for smart auto-switching
const ELEMENT_TO_TAB_MAP: Record<string, { tab: InspectorTab; section?: string }> = {
  headline: { tab: 'content', section: 'text' },
  heading: { tab: 'content', section: 'text' },
  paragraph: { tab: 'content', section: 'text' },
  text: { tab: 'content', section: 'text' },
  subtext: { tab: 'content', section: 'text' },
  button: { tab: 'design', section: 'button-styling' },
  cta_button: { tab: 'design', section: 'button-styling' },
  input: { tab: 'design', section: 'input-styling' },
  email_input: { tab: 'design', section: 'input-styling' },
  phone_input: { tab: 'design', section: 'input-styling' },
  options: { tab: 'content', section: 'options' },
  multi_choice: { tab: 'content', section: 'options' },
  video: { tab: 'content', section: 'video' },
  image: { tab: 'content', section: 'image' },
  embed: { tab: 'content', section: 'embed' },
  background: { tab: 'design', section: 'background' },
  section: { tab: 'blocks', section: 'structure' },
  frame: { tab: 'blocks', section: 'structure' },
  hero: { tab: 'content', section: 'hero' },
};

function getTabForElement(nodeType: string): InspectorTab {
  return ELEMENT_TO_TAB_MAP[nodeType]?.tab || 'content';
}

// Find node by ID in tree
function findNodeById(node: CanvasNode, nodeId: string): CanvasNode | null {
  if (node.id === nodeId) return node;
  for (const child of node.children) {
    const found = findNodeById(child, nodeId);
    if (found) return found;
  }
  return null;
}

// Import unified presets from single source of truth
import { 
  inspectorColorPresetsFlat as COLOR_PRESETS,
  inspectorGradientPresets as GRADIENT_PRESETS,
  inspectorFontSizes as FONT_SIZES,
  fontWeightOptions as FONT_WEIGHTS,
} from '@/flow-canvas/builder/utils/presets';

// Animation presets
const ANIMATION_PRESETS = [
  { label: 'None', value: 'none' },
  { label: 'Fade In', value: 'fadeIn' },
  { label: 'Slide Up', value: 'slideUp' },
  { label: 'Slide Down', value: 'slideDown' },
  { label: 'Scale', value: 'scale' },
  { label: 'Bounce', value: 'bounce' },
];

// Hover effect presets
const HOVER_EFFECTS = [
  { label: 'None', value: 'none' },
  { label: 'Lift', value: 'lift' },
  { label: 'Glow', value: 'glow' },
  { label: 'Scale', value: 'scale' },
  { label: 'Brighten', value: 'brighten' },
];

// Personality options - controls subtle interaction effects
const PERSONALITY_OPTIONS: { value: LayoutPersonality; label: string; description: string }[] = [
  { value: 'clean', label: 'Clean', description: 'Minimal spacing, subtle emphasis' },
  { value: 'bold', label: 'Bold', description: 'Stronger hover effects' },
  { value: 'editorial', label: 'Editorial', description: 'Reading-focused interactions' },
  { value: 'dense', label: 'Dense', description: 'Compact, efficient feedback' },
  { value: 'conversion', label: 'Conversion', description: 'Prominent CTA effects' },
];

// ============================================================================
// REUSABLE CONTROLS
// ============================================================================

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  showGradients?: boolean;
}

function ColorPicker({ value, onChange, label, showGradients }: ColorPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'solid' | 'gradient'>('solid');
  const isGradient = value?.includes('gradient');
  
  return (
    <div className="ei-field">
      <label className="ei-field-label">{label}</label>
      <button 
        type="button" 
        className="ei-color-trigger"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span 
          className="ei-color-swatch" 
          style={{ background: value || '#ffffff' }}
        />
        <span className="ei-color-value">
          {isGradient ? 'Gradient' : value || 'None'}
        </span>
        <ChevronDown className={cn("ei-chevron", isExpanded && "ei-chevron--open")} size={14} />
      </button>
      
      {isExpanded && (
        <div className="ei-color-popover">
          {showGradients && (
            <div className="ei-color-tabs">
              <button
                type="button"
                className={cn("ei-color-tab", activeTab === 'solid' && "ei-color-tab--active")}
                onClick={() => setActiveTab('solid')}
              >
                Solid
              </button>
              <button
                type="button"
                className={cn("ei-color-tab", activeTab === 'gradient' && "ei-color-tab--active")}
                onClick={() => setActiveTab('gradient')}
              >
                Gradient
              </button>
            </div>
          )}
          
          {activeTab === 'solid' && (
            <>
              <div className="ei-color-grid">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn("ei-color-preset", value === color && "ei-color-preset--active")}
                    style={{ background: color === 'transparent' ? 'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50% / 8px 8px' : color }}
                    onClick={() => onChange(color)}
                    title={color}
                  />
                ))}
              </div>
              <div className="ei-color-input-row">
                <input
                  type="color"
                  value={value?.startsWith('#') ? value : '#ffffff'}
                  onChange={(e) => onChange(e.target.value)}
                  className="ei-color-native"
                />
                <input
                  type="text"
                  value={value || ''}
                  onChange={(e) => onChange(e.target.value)}
                  className="ei-text-input ei-text-input--small"
                  placeholder="#000000"
                />
              </div>
            </>
          )}
          
          {activeTab === 'gradient' && showGradients && (
            <div className="ei-gradient-grid">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  className={cn("ei-gradient-preset", value === preset.value && "ei-gradient-preset--active")}
                  style={{ background: preset.value }}
                  onClick={() => onChange(preset.value)}
                  title={preset.name}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  multiline?: boolean;
}

function TextField({ value, onChange, label, placeholder, multiline }: TextFieldProps) {
  return (
    <div className="ei-field">
      <label className="ei-field-label">{label}</label>
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="ei-textarea"
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="ei-text-input"
        />
      )}
    </div>
  );
}

interface SliderFieldProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  unit?: string;
}

function SliderField({ value, onChange, label, min = 0, max = 100, unit = '' }: SliderFieldProps) {
  return (
    <div className="ei-field">
      <div className="ei-field-header">
        <label className="ei-field-label">{label}</label>
        <span className="ei-field-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        className="ei-slider"
      />
    </div>
  );
}

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: { value: string; label: string }[];
}

function SelectField({ value, onChange, label, options }: SelectFieldProps) {
  return (
    <div className="ei-field">
      <label className="ei-field-label">{label}</label>
      <select
        value={value || options[0]?.value}
        onChange={(e) => onChange(e.target.value)}
        className="ei-select"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

interface ButtonGroupProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: { value: string; label?: string | React.ReactNode; icon?: React.ReactNode }[];
}

function ButtonGroup({ value, onChange, label, options }: ButtonGroupProps) {
  return (
    <div className="ei-field">
      <label className="ei-field-label">{label}</label>
      <div className="ei-button-group">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={cn("ei-button-group-item", value === opt.value && "ei-button-group-item--active")}
            onClick={() => onChange(opt.value)}
          >
            {opt.icon || opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SwitchField({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="ei-field ei-field--row">
      <label className="ei-field-label">{label}</label>
      <button
        type="button"
        className={cn("ei-switch", value && "ei-switch--on")}
        onClick={() => onChange(!value)}
      >
        <span className="ei-switch-thumb" />
      </button>
    </div>
  );
}

// ============================================================================
// SECTIONS
// ============================================================================

function InspectorSection({ 
  title, 
  icon,
  children, 
  defaultOpen = true 
}: { 
  title: string; 
  icon?: React.ReactNode;
  children: React.ReactNode; 
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="ei-section">
      <button
        type="button"
        className="ei-section-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="ei-section-title">
          {icon}
          <span>{title}</span>
        </div>
        <ChevronDown className={cn("ei-chevron", isOpen && "ei-chevron--open")} size={14} />
      </button>
      {isOpen && <div className="ei-section-content">{children}</div>}
    </div>
  );
}

// Multi-choice options editor with image support for perspective-style cards
function OptionsEditor({ 
  options, 
  onChange 
}: { 
  options: Array<{ id: string; label: string; emoji?: string; image?: string }>; 
  onChange: (options: Array<{ id: string; label: string; emoji?: string; image?: string }>) => void;
}) {
  const handleOptionChange = (index: number, field: 'label' | 'emoji' | 'image', value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onChange(newOptions);
  };

  const addOption = () => {
    onChange([...options, { id: `opt${Date.now()}`, label: 'New Option', emoji: '✨', image: '' }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 1) {
      onChange(options.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="ei-options-editor">
      {options.map((option, index) => (
        <div key={option.id} className="ei-option-row ei-option-row--card">
          <div className="ei-option-row-main">
            <GripVertical size={14} className="ei-option-grip" />
            <input
              type="text"
              value={option.emoji || ''}
              onChange={(e) => handleOptionChange(index, 'emoji', e.target.value)}
              className="ei-option-emoji"
              placeholder="✨"
            />
            <input
              type="text"
              value={option.label}
              onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
              className="ei-option-label"
              placeholder="Option label"
            />
            <button
              type="button"
              className="ei-option-delete"
              onClick={() => removeOption(index)}
              disabled={options.length <= 1}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <input
            type="text"
            value={option.image || ''}
            onChange={(e) => handleOptionChange(index, 'image', e.target.value)}
            className="ei-option-image-url"
            placeholder="Image URL (optional for card style)"
          />
        </div>
      ))}
      <button type="button" className="ei-add-option" onClick={addOption}>
        <Plus size={14} /> Add Option
      </button>
    </div>
  );
}

// Button Action Section for unified action configuration
function ButtonActionSection({ 
  nodeProps, 
  onPropChange,
  pages,
  activePageId 
}: { 
  nodeProps: Record<string, any>;
  onPropChange: (key: string, value: any) => void;
  pages: Page[];
  activePageId: string;
}) {
  // Build available steps from pages
  const availableSteps = useMemo(() => {
    return pages
      .filter(p => p.id !== activePageId)
      .map(p => ({ id: p.id, name: p.name }));
  }, [pages, activePageId]);

  // Determine step type from page type - maps PageType to ButtonActionSelector stepType
  const currentPage = pages.find(p => p.id === activePageId);
  const getStepType = (): 'welcome' | 'question' | 'capture' | 'ending' | undefined => {
    if (!currentPage) return undefined;
    const pageType = currentPage.type;
    // Map PageType to step type for button action filtering
    if (pageType === 'thank_you') return 'ending';
    if (pageType === 'optin') return 'capture';
    if (pageType === 'appointment') return 'capture';
    if (pageType === 'landing') return 'welcome';
    return 'question';
  };

  // Get current action from node props
  const currentAction: ButtonAction | undefined = nodeProps.buttonAction;

  const handleActionChange = (action: ButtonAction | undefined) => {
    onPropChange('buttonAction', action);
  };

  return (
    <InspectorSection title="On Click" icon={<MousePointer2 size={14} />}>
      <ButtonActionSelector
        action={currentAction}
        onChange={handleActionChange}
        availableSteps={availableSteps}
        stepType={getStepType()}
        compact
      />
    </InspectorSection>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EnhancedInspector() {
  const {
    pages,
    activePageId,
    selectedNodeId,
    updateNodeProps,
    updatePageProps,
    deleteNode,
    deletePage,
  } = useEditorStore();

  const [activeTab, setActiveTab] = useState<InspectorTab>('content');
  const [previousNodeId, setPreviousNodeId] = useState<string | null>(null);

  // Auto-switch tab when selecting a new element
  useEffect(() => {
    if (selectedNodeId && selectedNodeId !== previousNodeId) {
      const page = pages.find((p) => p.id === activePageId);
      if (page) {
        const node = findNodeById(page.canvasRoot, selectedNodeId);
        if (node) {
          const suggestedTab = getTabForElement(node.type);
          setActiveTab(suggestedTab);
        }
      }
      setPreviousNodeId(selectedNodeId);
    }
  }, [selectedNodeId, previousNodeId, pages, activePageId]);

  const page = pages.find((p) => p.id === activePageId) ?? null;

  // Handle page personality update
  const handleUpdatePersonality = useCallback((personality: LayoutPersonality) => {
    if (page) {
      updatePageProps(page.id, { layoutPersonality: personality });
    }
  }, [page, updatePageProps]);

  // No page selected
  if (!page) {
    return (
      <div className="ei-inspector ei-inspector--empty">
        <div className="ei-empty-state">
          <Layout size={24} />
          <p>No page selected</p>
        </div>
      </div>
    );
  }

  const selectedNode = selectedNodeId 
    ? findNodeById(page.canvasRoot, selectedNodeId) 
    : null;
  
  const definition = selectedNode 
    ? (ComponentRegistry[selectedNode.type] ?? fallbackComponent)
    : null;

  // Page-level inspector when no node selected
  if (!selectedNode || !definition) {
    return (
      <div className="ei-inspector">
        <header className="ei-header">
          <h3 className="ei-title">Page Settings</h3>
          <span className="ei-subtitle">{page.name}</span>
        </header>

        <div className="ei-body">
          <InspectorSection title="Page Info" icon={<Type size={14} />}>
            <TextField
              value={page.name}
              onChange={(name) => updatePageProps(page.id, { name })}
              label="Page Name"
            />
          </InspectorSection>

          <InspectorSection title="Layout Personality" icon={<Layout size={14} />}>
            <div className="ei-personality-grid">
              {PERSONALITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={cn(
                    "ei-personality-option",
                    page.layoutPersonality === p.value && "ei-personality-option--active"
                  )}
                  onClick={() => handleUpdatePersonality(p.value)}
                >
                  <span className="ei-personality-label">{p.label}</span>
                  <span className="ei-personality-desc">{p.description}</span>
                </button>
              ))}
            </div>
          </InspectorSection>
        </div>
      </div>
    );
  }

  // Node-level inspector
  const nodeType = selectedNode.type;
  const nodeProps = selectedNode.props as Record<string, any>;
  const defaultProps = definition.defaultProps || {};

  const handlePropChange = (key: string, value: any) => {
    updateNodeProps(selectedNode.id, { [key]: value });
  };

  const handleResetToDefaults = () => {
    Object.keys(defaultProps).forEach((key) => {
      handlePropChange(key, defaultProps[key]);
    });
  };

  // Format display name to be user-friendly (no underscores)
  const displayName = definition.displayName.replace(/_/g, ' ');

  const handleDeleteNode = () => {
    if (selectedNode && selectedNodeId) {
      deleteNode(selectedNodeId);
    }
  };

  return (
    <div className="ei-inspector">
      <header className="ei-header">
        <div className="ei-header-row">
          <h3 className="ei-title">{displayName}</h3>
          <div className="ei-header-actions">
            <button
              type="button"
              className="ei-reset-btn"
              onClick={handleResetToDefaults}
              title="Reset to defaults"
            >
              <RotateCcw size={14} />
            </button>
            <button
              type="button"
              className="ei-delete-btn"
              onClick={handleDeleteNode}
              title="Delete element"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </header>

      <div className="ei-tabs">
        <button
          type="button"
          className={cn("ei-tab", activeTab === 'content' && "ei-tab--active")}
          onClick={() => setActiveTab('content')}
        >
          <Type size={14} /> Content
        </button>
        <button
          type="button"
          className={cn("ei-tab", activeTab === 'design' && "ei-tab--active")}
          onClick={() => setActiveTab('design')}
        >
          <Palette size={14} /> Design
        </button>
        <button
          type="button"
          className={cn("ei-tab", activeTab === 'blocks' && "ei-tab--active")}
          onClick={() => setActiveTab('blocks')}
        >
          <LayoutGrid size={14} /> Layout
        </button>
        <button
          type="button"
          className={cn("ei-tab", activeTab === 'settings' && "ei-tab--active")}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={14} /> Settings
        </button>
      </div>

      <div className="ei-body">
        {/* ====== CONTENT TAB ====== */}
        {activeTab === 'content' && (
          <>
            {/* Text Content */}
            {(nodeProps.text !== undefined || nodeProps.headline !== undefined) && (
              <InspectorSection title="Text" icon={<Type size={14} />}>
                {nodeProps.text !== undefined && (
                  <TextField
                    value={nodeProps.text}
                    onChange={(v) => handlePropChange('text', v)}
                    label="Text"
                    multiline={nodeType === 'paragraph'}
                  />
                )}
                {nodeProps.headline !== undefined && (
                  <TextField
                    value={nodeProps.headline}
                    onChange={(v) => handlePropChange('headline', v)}
                    label="Headline"
                  />
                )}
                {nodeProps.subtext !== undefined && (
                  <TextField
                    value={nodeProps.subtext}
                    onChange={(v) => handlePropChange('subtext', v)}
                    label="Subtext"
                    multiline
                  />
                )}
              </InspectorSection>
            )}

            {/* Button */}
            {nodeProps.buttonText !== undefined && (
              <InspectorSection title="Button" icon={<Type size={14} />}>
                <TextField
                  value={nodeProps.buttonText}
                  onChange={(v) => handlePropChange('buttonText', v)}
                  label="Button Label"
                />
              </InspectorSection>
            )}
            
            {/* Button Action - for button/cta_button types */}
            {(nodeType === 'button' || nodeType === 'cta_button' || nodeProps.buttonText !== undefined) && (
              <ButtonActionSection 
                nodeProps={nodeProps}
                onPropChange={handlePropChange}
                pages={pages}
                activePageId={activePageId}
              />
            )}

            {/* Input Fields */}
            {nodeProps.placeholder !== undefined && (
              <InspectorSection title="Input" icon={<Type size={14} />}>
                <TextField
                  value={nodeProps.placeholder}
                  onChange={(v) => handlePropChange('placeholder', v)}
                  label="Placeholder"
                />
                <TextField
                  value={nodeProps.label || ''}
                  onChange={(v) => handlePropChange('label', v)}
                  label="Label"
                />
              </InspectorSection>
            )}

            {/* Video/Embed */}
            {nodeProps.videoUrl !== undefined && (
              <InspectorSection title="Video" icon={<Type size={14} />}>
                <TextField
                  value={nodeProps.videoUrl}
                  onChange={(v) => handlePropChange('videoUrl', v)}
                  label="Video URL"
                  placeholder="https://youtube.com/watch?v=..."
                />
                <SwitchField
                  value={nodeProps.autoplay || false}
                  onChange={(v) => handlePropChange('autoplay', v)}
                  label="Autoplay"
                />
              </InspectorSection>
            )}

            {nodeProps.embedUrl !== undefined && (
              <InspectorSection title="Embed" icon={<Type size={14} />}>
                <TextField
                  value={nodeProps.embedUrl}
                  onChange={(v) => handlePropChange('embedUrl', v)}
                  label="Embed URL"
                  placeholder="https://calendly.com/..."
                />
              </InspectorSection>
            )}

            {/* Image */}
            {nodeProps.src !== undefined && (
              <InspectorSection title="Image" icon={<Type size={14} />}>
                <TextField
                  value={nodeProps.src}
                  onChange={(v) => handlePropChange('src', v)}
                  label="Image URL"
                  placeholder="https://..."
                />
                <TextField
                  value={nodeProps.alt || ''}
                  onChange={(v) => handlePropChange('alt', v)}
                  label="Alt Text"
                />
              </InspectorSection>
            )}

            {/* Options (Multi-choice) */}
            {nodeProps.options && Array.isArray(nodeProps.options) && (
              <InspectorSection title="Options" icon={<Type size={14} />}>
                <OptionsEditor
                  options={nodeProps.options}
                  onChange={(opts) => handlePropChange('options', opts)}
                />
              </InspectorSection>
            )}
          </>
        )}

        {/* ====== STYLE TAB ====== */}
        {activeTab === 'design' && (
          <>
            {/* Typography */}
            <InspectorSection title="Typography" icon={<Type size={14} />}>
              <ButtonGroup
                value={nodeProps.textAlign || 'center'}
                onChange={(v) => handlePropChange('textAlign', v)}
                label="Alignment"
                options={[
                  { value: 'left', icon: <AlignLeft size={14} /> },
                  { value: 'center', icon: <AlignCenter size={14} /> },
                  { value: 'right', icon: <AlignRight size={14} /> },
                ]}
              />
              <SelectField
                value={nodeProps.fontSize || '16px'}
                onChange={(v) => handlePropChange('fontSize', v)}
                label="Font Size"
                options={FONT_SIZES}
              />
              <SelectField
                value={nodeProps.fontWeight || '400'}
                onChange={(v) => handlePropChange('fontWeight', v)}
                label="Font Weight"
                options={FONT_WEIGHTS}
              />
            </InspectorSection>

            {/* Colors */}
            <InspectorSection title="Colors" icon={<Palette size={14} />}>
              <ColorPicker
                value={nodeProps.color || '#ffffff'}
                onChange={(v) => handlePropChange('color', v)}
                label="Text Color"
              />
              <ColorPicker
                value={nodeProps.backgroundColor || 'transparent'}
                onChange={(v) => handlePropChange('backgroundColor', v)}
                label="Background"
                showGradients
              />
            </InspectorSection>

            {/* Button Styling - uses shared ButtonStyleInspector */}
            {(nodeType === 'button' || nodeProps.buttonText !== undefined) && (
              <InspectorSection title="Button Style" icon={<Palette size={14} />}>
                <ButtonStyleInspector
                  settings={{
                    preset: nodeProps.buttonPreset || 'custom',
                    backgroundColor: nodeProps.buttonColor || '#6366f1',
                    textColor: nodeProps.buttonTextColor || '#ffffff',
                    gradient: nodeProps.buttonGradient,
                    size: nodeProps.buttonSize || 'md',
                    borderRadius: nodeProps.buttonRadius ?? 12,
                    shadow: nodeProps.buttonShadow || 'none',
                    fullWidth: nodeProps.buttonFullWidth ?? false,
                  }}
                  onChange={(updates) => {
                    if (updates.preset !== undefined) handlePropChange('buttonPreset', updates.preset);
                    if (updates.backgroundColor !== undefined) handlePropChange('buttonColor', updates.backgroundColor);
                    if (updates.textColor !== undefined) handlePropChange('buttonTextColor', updates.textColor);
                    if (updates.gradient !== undefined) handlePropChange('buttonGradient', updates.gradient);
                    if (updates.size !== undefined) handlePropChange('buttonSize', updates.size);
                    if (updates.borderRadius !== undefined) handlePropChange('buttonRadius', updates.borderRadius);
                    if (updates.shadow !== undefined) handlePropChange('buttonShadow', updates.shadow);
                    if (updates.fullWidth !== undefined) handlePropChange('buttonFullWidth', updates.fullWidth);
                  }}
                  showPreset
                  showFullWidth
                  compact
                />
              </InspectorSection>
            )}

            {/* Borders & Shadows */}
            <InspectorSection title="Effects" icon={<Sparkles size={14} />} defaultOpen={false}>
              <SliderField
                value={nodeProps.borderRadius || 0}
                onChange={(v) => handlePropChange('borderRadius', v)}
                label="Corner Radius"
                min={0}
                max={48}
                unit="px"
              />
              <SelectField
                value={nodeProps.shadow || 'none'}
                onChange={(v) => handlePropChange('shadow', v)}
                label="Shadow"
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'sm', label: 'Small' },
                  { value: 'md', label: 'Medium' },
                  { value: 'lg', label: 'Large' },
                  { value: 'xl', label: 'Extra Large' },
                ]}
              />
              <ColorPicker
                value={nodeProps.borderColor || 'transparent'}
                onChange={(v) => handlePropChange('borderColor', v)}
                label="Border Color"
              />
              <SliderField
                value={nodeProps.borderWidth || 0}
                onChange={(v) => handlePropChange('borderWidth', v)}
                label="Border Width"
                min={0}
                max={8}
                unit="px"
              />
            </InspectorSection>

            {/* Animation & Hover */}
            <InspectorSection title="Animation" icon={<Sparkles size={14} />} defaultOpen={false}>
              <SelectField
                value={nodeProps.animation || 'none'}
                onChange={(v) => handlePropChange('animation', v)}
                label="Enter Animation"
                options={ANIMATION_PRESETS}
              />
              <SelectField
                value={nodeProps.hoverEffect || 'none'}
                onChange={(v) => handlePropChange('hoverEffect', v)}
                label="Hover Effect"
                options={HOVER_EFFECTS}
              />
            </InspectorSection>
          </>
        )}

        {/* ====== LAYOUT TAB ====== */}
        {activeTab === 'blocks' && (
          <>
            <InspectorSection title="Spacing" icon={<Layout size={14} />}>
              <SliderField
                value={nodeProps.paddingTop || 0}
                onChange={(v) => handlePropChange('paddingTop', v)}
                label="Padding Top"
                min={0}
                max={64}
                unit="px"
              />
              <SliderField
                value={nodeProps.paddingBottom || 0}
                onChange={(v) => handlePropChange('paddingBottom', v)}
                label="Padding Bottom"
                min={0}
                max={64}
                unit="px"
              />
              <SliderField
                value={nodeProps.paddingX || 0}
                onChange={(v) => handlePropChange('paddingX', v)}
                label="Padding Sides"
                min={0}
                max={64}
                unit="px"
              />
              <SliderField
                value={nodeProps.gap || 0}
                onChange={(v) => handlePropChange('gap', v)}
                label="Gap"
                min={0}
                max={48}
                unit="px"
              />
            </InspectorSection>

            <InspectorSection title="Size" icon={<Layout size={14} />}>
              <SelectField
                value={nodeProps.maxWidth || 'full'}
                onChange={(v) => handlePropChange('maxWidth', v)}
                label="Max Width"
                options={[
                  { value: 'full', label: '100%' },
                  { value: 'sm', label: 'Small (320px)' },
                  { value: 'md', label: 'Medium (480px)' },
                  { value: 'lg', label: 'Large (640px)' },
                  { value: 'xl', label: 'Extra Large (800px)' },
                ]}
              />
              {nodeType === 'spacer' && (
                <SliderField
                  value={nodeProps.height || 32}
                  onChange={(v) => handlePropChange('height', v)}
                  label="Height"
                  min={8}
                  max={120}
                  unit="px"
                />
              )}
            </InspectorSection>
          </>
        )}

        {/* ====== SETTINGS TAB ====== */}
        {activeTab === 'settings' && (
          <>
            <InspectorSection title="Element Info" icon={<Settings size={14} />}>
              <div className="ei-info-row">
                <span className="ei-info-label">Type</span>
                <span className="ei-info-value">{definition.displayName}</span>
              </div>
              <div className="ei-info-row">
                <span className="ei-info-label">ID</span>
                <span className="ei-info-value ei-info-value--mono">{selectedNode.id.slice(0, 8)}...</span>
              </div>
            </InspectorSection>

            <InspectorSection title="Visibility" icon={<Settings size={14} />} defaultOpen={false}>
              <SwitchField
                value={nodeProps.hidden || false}
                onChange={(v) => handlePropChange('hidden', v)}
                label="Hide Element"
              />
            </InspectorSection>
          </>
        )}
      </div>
    </div>
  );
}
