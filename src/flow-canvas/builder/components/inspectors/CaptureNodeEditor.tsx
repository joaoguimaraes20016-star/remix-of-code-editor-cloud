import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Type,
  List,
  CheckSquare,
  Mail,
  Phone,
  User,
  Calendar,
  Scale,
  ToggleLeft,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CaptureNode,
  CaptureNodeType,
  CaptureNodeSettings,
  CaptureNodeChoice,
  CaptureNodeValidation,
} from '../../../types/captureFlow';
import {
  getTitleSizeClass,
  getAlignClass,
  getSpacingClass,
  getInputStyleClass,
} from '../../utils/stepRenderHelpers';

// ============ CONFIG ============

const nodeTypeIcons: Record<CaptureNodeType, React.ReactNode> = {
  'open-ended': <Type className="w-4 h-4" />,
  'single-choice': <List className="w-4 h-4" />,
  'multi-choice': <CheckSquare className="w-4 h-4" />,
  'email': <Mail className="w-4 h-4" />,
  'phone': <Phone className="w-4 h-4" />,
  'name': <User className="w-4 h-4" />,
  'date': <Calendar className="w-4 h-4" />,
  'scale': <Scale className="w-4 h-4" />,
  'yes-no': <ToggleLeft className="w-4 h-4" />,
};

const nodeTypeLabels: Record<CaptureNodeType, string> = {
  'open-ended': 'Open-ended',
  'single-choice': 'Single Choice',
  'multi-choice': 'Multi Choice',
  'email': 'Email',
  'phone': 'Phone',
  'name': 'Name',
  'date': 'Date',
  'scale': 'Scale',
  'yes-no': 'Yes/No',
};

// ============ PROPS ============

interface CaptureNodeEditorProps {
  node: CaptureNode;
  allNodes: CaptureNode[];
  onUpdate: (updates: Partial<CaptureNode>) => void;
  onBack: () => void;
}

// ============ COMPONENT ============

export const CaptureNodeEditor: React.FC<CaptureNodeEditorProps> = ({
  node,
  allNodes,
  onUpdate,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'validation'>('content');

  const settings = node.settings;
  const validation = node.validation || {};
  const choices = settings.choices || [];

  const updateSettings = (updates: Partial<CaptureNodeSettings>) => {
    onUpdate({ settings: { ...settings, ...updates } });
  };

  const updateValidation = (updates: Partial<CaptureNodeValidation>) => {
    onUpdate({ validation: { ...validation, ...updates } });
  };

  const addChoice = () => {
    const newChoice: CaptureNodeChoice = {
      id: `choice-${Date.now()}`,
      label: `Option ${choices.length + 1}`,
    };
    updateSettings({ choices: [...choices, newChoice] });
  };

  const updateChoice = (index: number, updates: Partial<CaptureNodeChoice>) => {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], ...updates };
    updateSettings({ choices: newChoices });
  };

  const removeChoice = (index: number) => {
    if (choices.length > 1) {
      updateSettings({ choices: choices.filter((_, i) => i !== index) });
    }
  };

  const hasChoices = node.type === 'single-choice' || node.type === 'multi-choice';
  const hasScale = node.type === 'scale';
  const hasNameSettings = node.type === 'name';

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with Back Button */}
      <div className="px-3 py-2.5 border-b border-border">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Nodes
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground">
            {nodeTypeIcons[node.type]}
          </div>
          <div className="flex-1">
            <Input
              value={settings.title || ''}
              onChange={(e) => updateSettings({ title: e.target.value })}
              placeholder={nodeTypeLabels[node.type]}
              className="h-7 text-sm font-medium bg-transparent border-transparent hover:border-border focus:border-border px-1"
            />
          </div>
        </div>
      </div>

      {/* Node Preview */}
      <div className="px-4 py-3 border-b border-border">
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Preview</div>
        <div 
          className="border border-border rounded-xl p-3 overflow-hidden bg-muted/20"
          style={{ height: '180px' }}
        >
          <div 
            className="origin-top"
            style={{ transform: 'scale(0.55)', transformOrigin: 'top center' }}
          >
            <div className={cn(
              'flex flex-col rounded-lg bg-background',
              getAlignClass(settings.align),
              getSpacingClass(settings.spacing)
            )}>
              {/* Title */}
              <h3 className={cn(getTitleSizeClass(settings.titleSize), 'font-bold text-foreground')}>
                {settings.title || nodeTypeLabels[node.type]}
              </h3>
              
              {/* Description */}
              {settings.description && (
                <p className="text-sm mt-2 text-muted-foreground">
                  {settings.description}
                </p>
              )}
              
              {/* Choice Options Preview */}
              {hasChoices && choices.length > 0 && (
                <div className="mt-6 space-y-2 max-w-md w-full">
                  {choices.slice(0, 3).map((choice, i) => (
                    <div 
                      key={choice.id}
                      className={cn(
                        'px-4 py-3 border border-border text-left text-sm text-foreground bg-background',
                        getInputStyleClass(settings.inputStyle)
                      )}
                    >
                      {choice.emoji && <span className="mr-2">{choice.emoji}</span>}
                      {choice.label}
                    </div>
                  ))}
                  {choices.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{choices.length - 3} more</div>
                  )}
                </div>
              )}

              {/* Scale Preview */}
              {hasScale && (
                <div className="mt-6 max-w-md w-full">
                  <div className="flex gap-1 justify-center flex-wrap">
                    {Array.from({ length: settings.scaleMax || 10 }, (_, i) => i + (settings.scaleMin || 1)).map((num) => (
                      <div
                        key={num}
                        className={cn(
                          'w-8 h-8 flex items-center justify-center border border-border text-xs font-medium',
                          getInputStyleClass(settings.inputStyle)
                        )}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{settings.scaleMinLabel || 'Low'}</span>
                    <span>{settings.scaleMaxLabel || 'High'}</span>
                  </div>
                </div>
              )}

              {/* Input Preview for other types */}
              {!hasChoices && !hasScale && node.type !== 'yes-no' && (
                <div className="mt-6 max-w-md w-full">
                  <div className={cn(
                    'w-full px-4 py-3 border border-border text-sm bg-background text-muted-foreground',
                    getInputStyleClass(settings.inputStyle)
                  )}>
                    {settings.placeholder || `Enter your ${nodeTypeLabels[node.type].toLowerCase()}...`}
                  </div>
                </div>
              )}

              {/* Yes/No Preview */}
              {node.type === 'yes-no' && (
                <div className="mt-6 space-y-2 max-w-md w-full">
                  {['Yes', 'No'].map((option) => (
                    <div 
                      key={option}
                      className={cn(
                        'px-4 py-3 border border-border text-left text-sm text-foreground bg-background',
                        getInputStyleClass(settings.inputStyle)
                      )}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}

              {/* Button */}
              <span className="mt-6 inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                {settings.buttonText || 'Continue'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['content', 'style', 'validation'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 px-3 py-2 text-xs font-medium transition-colors',
              activeTab === tab
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto builder-scroll p-4 space-y-4">
        {/* CONTENT TAB */}
        {activeTab === 'content' && (
          <>
            {/* Node Type */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase">Node Type</Label>
              <Select 
                value={node.type} 
                onValueChange={(value) => onUpdate({ type: value as CaptureNodeType })}
              >
                <SelectTrigger className="h-8 text-xs bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {(Object.keys(nodeTypeLabels) as CaptureNodeType[]).map((type) => (
                    <SelectItem key={type} value={type} className="text-xs">
                      <div className="flex items-center gap-2">
                        {nodeTypeIcons[type]}
                        {nodeTypeLabels[type]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase">Question / Title</Label>
              <Input
                value={settings.title || ''}
                onChange={(e) => updateSettings({ title: e.target.value })}
                placeholder="What is your question?"
                className="h-8 text-xs bg-background border-border"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase">Description (optional)</Label>
              <Textarea
                value={settings.description || ''}
                onChange={(e) => updateSettings({ description: e.target.value })}
                placeholder="Add additional context..."
                className="text-xs bg-background border-border min-h-[60px] resize-none"
              />
            </div>

            {/* Field Key */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase">Field Key (for data)</Label>
              <Input
                value={node.fieldKey}
                onChange={(e) => onUpdate({ fieldKey: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                placeholder="e.g., user_email, q1_budget"
                className="h-8 text-xs bg-background border-border font-mono"
              />
            </div>

            {/* Choices (for choice types) */}
            {hasChoices && (
              <div className="space-y-2">
                <Label className="text-[10px] text-muted-foreground uppercase">Options</Label>
                <div className="space-y-1.5">
                  {choices.map((choice, index) => (
                    <div key={choice.id} className="flex items-center gap-1.5 group">
                      <div className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab shrink-0">
                        <GripVertical className="w-3 h-3" />
                      </div>
                      <Input
                        value={choice.label}
                        onChange={(e) => updateChoice(index, { label: e.target.value })}
                        className="h-7 text-xs bg-background border-border flex-1"
                      />
                      <button
                        onClick={() => removeChoice(index)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addChoice}
                  className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-foreground/30 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Option
                </button>
              </div>
            )}

            {/* Scale Settings */}
            {hasScale && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase">Min Value</Label>
                    <Input
                      type="number"
                      value={settings.scaleMin || 1}
                      onChange={(e) => updateSettings({ scaleMin: parseInt(e.target.value) || 1 })}
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase">Max Value</Label>
                    <Input
                      type="number"
                      value={settings.scaleMax || 10}
                      onChange={(e) => updateSettings({ scaleMax: parseInt(e.target.value) || 10 })}
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase">Min Label</Label>
                    <Input
                      value={settings.scaleMinLabel || ''}
                      onChange={(e) => updateSettings({ scaleMinLabel: e.target.value })}
                      placeholder="Not at all"
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase">Max Label</Label>
                    <Input
                      value={settings.scaleMaxLabel || ''}
                      onChange={(e) => updateSettings({ scaleMaxLabel: e.target.value })}
                      placeholder="Extremely"
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Name Settings */}
            {hasNameSettings && (
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Split into First/Last Name</Label>
                <Switch
                  checked={settings.splitName || false}
                  onCheckedChange={(checked) => updateSettings({ splitName: checked })}
                />
              </div>
            )}

            {/* Placeholder (for input types) */}
            {!hasChoices && !hasScale && node.type !== 'yes-no' && (
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase">Placeholder</Label>
                <Input
                  value={settings.placeholder || ''}
                  onChange={(e) => updateSettings({ placeholder: e.target.value })}
                  placeholder={`Enter your ${nodeTypeLabels[node.type].toLowerCase()}...`}
                  className="h-8 text-xs bg-background border-border"
                />
              </div>
            )}

            {/* Button Text */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase">Button Text</Label>
              <Input
                value={settings.buttonText || ''}
                onChange={(e) => updateSettings({ buttonText: e.target.value })}
                placeholder="Continue"
                className="h-8 text-xs bg-background border-border"
              />
            </div>
          </>
        )}

        {/* STYLE TAB */}
        {activeTab === 'style' && (
          <>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase">Alignment</Label>
              <Select
                value={settings.align || 'center'}
                onValueChange={(value) => updateSettings({ align: value as 'left' | 'center' | 'right' })}
              >
                <SelectTrigger className="h-8 text-xs bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="left" className="text-xs">Left</SelectItem>
                  <SelectItem value="center" className="text-xs">Center</SelectItem>
                  <SelectItem value="right" className="text-xs">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase">Spacing</Label>
              <Select
                value={settings.spacing || 'normal'}
                onValueChange={(value) => updateSettings({ spacing: value as 'compact' | 'normal' | 'relaxed' })}
              >
                <SelectTrigger className="h-8 text-xs bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="compact" className="text-xs">Compact</SelectItem>
                  <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                  <SelectItem value="relaxed" className="text-xs">Relaxed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase">Title Size</Label>
              <Select
                value={settings.titleSize || 'xl'}
                onValueChange={(value) => updateSettings({ titleSize: value as 'sm' | 'md' | 'lg' | 'xl' | '2xl' })}
              >
                <SelectTrigger className="h-8 text-xs bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="sm" className="text-xs">Small</SelectItem>
                  <SelectItem value="md" className="text-xs">Medium</SelectItem>
                  <SelectItem value="lg" className="text-xs">Large</SelectItem>
                  <SelectItem value="xl" className="text-xs">Extra Large</SelectItem>
                  <SelectItem value="2xl" className="text-xs">2X Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase">Input Style</Label>
              <Select
                value={settings.inputStyle || 'default'}
                onValueChange={(value) => updateSettings({ inputStyle: value as 'default' | 'minimal' | 'rounded' | 'square' })}
              >
                <SelectTrigger className="h-8 text-xs bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="default" className="text-xs">Default</SelectItem>
                  <SelectItem value="minimal" className="text-xs">Minimal</SelectItem>
                  <SelectItem value="rounded" className="text-xs">Rounded</SelectItem>
                  <SelectItem value="square" className="text-xs">Square</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase">Button Style</Label>
              <Select
                value={settings.buttonStyle || 'solid'}
                onValueChange={(value) => updateSettings({ buttonStyle: value as 'solid' | 'outline' | 'minimal' | 'primary' })}
              >
                <SelectTrigger className="h-8 text-xs bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="solid" className="text-xs">Solid</SelectItem>
                  <SelectItem value="outline" className="text-xs">Outline</SelectItem>
                  <SelectItem value="minimal" className="text-xs">Minimal</SelectItem>
                  <SelectItem value="primary" className="text-xs">Primary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* VALIDATION TAB */}
        {activeTab === 'validation' && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Required</Label>
              <Switch
                checked={validation.required !== false}
                onCheckedChange={(checked) => updateValidation({ required: checked })}
              />
            </div>

            {(node.type === 'open-ended' || node.type === 'email' || node.type === 'phone' || node.type === 'name') && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase">Min Length</Label>
                  <Input
                    type="number"
                    value={validation.minLength || ''}
                    onChange={(e) => updateValidation({ minLength: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="No minimum"
                    className="h-8 text-xs bg-background border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase">Max Length</Label>
                  <Input
                    type="number"
                    value={validation.maxLength || ''}
                    onChange={(e) => updateValidation({ maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="No maximum"
                    className="h-8 text-xs bg-background border-border"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase">Custom Error Message</Label>
              <Input
                value={validation.customMessage || ''}
                onChange={(e) => updateValidation({ customMessage: e.target.value })}
                placeholder="This field is required"
                className="h-8 text-xs bg-background border-border"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
