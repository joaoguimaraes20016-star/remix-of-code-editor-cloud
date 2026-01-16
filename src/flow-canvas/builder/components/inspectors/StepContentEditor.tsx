import React, { useState } from 'react';
import { ApplicationFlowStep, ApplicationStepType, ApplicationFlowStepSettings, QuestionType } from '../../../types/infostack';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Sparkles,
  HelpCircle,
  UserPlus,
  Calendar,
  CheckCircle2,
  Type,
  List,
  ChevronDown,
  ToggleLeft,
  Scale,
  Mail,
  Phone,
  User,
  Circle,
  Square,
  Maximize2,
} from 'lucide-react';
import {
  getTitleSizeClass,
  getAlignClass,
  getSpacingClass,
  getInputStyleClass,
  getButtonClasses,
  getButtonStyle,
  getDefaultTitle,
  getDefaultButtonText,
} from '../../utils/stepRenderHelpers';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorPickerPopover, GradientPickerPopover, gradientToCSS, defaultGradient, GradientValue } from '../modals';
import { ButtonActionSelector, type ButtonAction } from '../ButtonActionSelector';

const stepTypeIcons: Record<ApplicationStepType, React.ReactNode> = {
  welcome: <Sparkles className="w-4 h-4" />,
  question: <HelpCircle className="w-4 h-4" />,
  capture: <UserPlus className="w-4 h-4" />,
  booking: <Calendar className="w-4 h-4" />,
  ending: <CheckCircle2 className="w-4 h-4" />,
};

const stepTypeLabels: Record<ApplicationStepType, string> = {
  welcome: 'Welcome',
  question: 'Question',
  capture: 'Capture',
  booking: 'Booking',
  ending: 'Ending',
};

const questionTypeIcons: Record<QuestionType, React.ReactNode> = {
  'multiple-choice': <List className="w-4 h-4" />,
  'text': <Type className="w-4 h-4" />,
  'dropdown': <ChevronDown className="w-4 h-4" />,
  'scale': <Scale className="w-4 h-4" />,
  'yes-no': <ToggleLeft className="w-4 h-4" />,
};

// Use the shared settings type from infostack.ts
type StepSettings = ApplicationFlowStepSettings;

interface StepContentEditorProps {
  step: ApplicationFlowStep;
  allSteps: ApplicationFlowStep[];
  onUpdate: (updates: Partial<ApplicationFlowStep>) => void;
  onBack: () => void;
}

export const StepContentEditor: React.FC<StepContentEditorProps> = ({
  step,
  allSteps,
  onUpdate,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'logic'>('content');
  
  // Get step content from settings or defaults
  const stepSettings: StepSettings = (step as any).settings || {};
  const questionType = stepSettings.questionType || 'multiple-choice';
  const options = stepSettings.options || ['Option 1', 'Option 2'];
  const isRequired = stepSettings.required !== false;
  const questionTitle = stepSettings.title || '';
  const questionDescription = stepSettings.description || '';
  const buttonText = stepSettings.buttonText || 'Continue';

  const updateSettings = (updates: Partial<StepSettings>) => {
    onUpdate({ settings: { ...stepSettings, ...updates } } as any);
  };

  const addOption = () => {
    updateSettings({ options: [...options, `Option ${options.length + 1}`] });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    updateSettings({ options: newOptions });
  };

  const removeOption = (index: number) => {
    if (options.length > 1) {
      updateSettings({ options: options.filter((_, i) => i !== index) });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['content', 'style', 'logic'] as const).map((tab) => (
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

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="flex-1 overflow-y-auto builder-scroll p-4 space-y-4">
          {/* Step Type */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase">Step Type</Label>
            <Select 
              value={step.type} 
              onValueChange={(value) => onUpdate({ type: value as ApplicationStepType })}
            >
              <SelectTrigger className="h-8 text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {Object.entries(stepTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    <div className="flex items-center gap-2">
                      {stepTypeIcons[value as ApplicationStepType]}
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Question Type (for question steps) */}
          {step.type === 'question' && (
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase">Question Type</Label>
              <Select 
                value={questionType}
                onValueChange={(value) => updateSettings({ questionType: value as QuestionType })}
              >
                <SelectTrigger className="h-8 text-xs bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="multiple-choice" className="text-xs">
                    <div className="flex items-center gap-2">
                      {questionTypeIcons['multiple-choice']} Multiple Choice
                    </div>
                  </SelectItem>
                  <SelectItem value="text" className="text-xs">
                    <div className="flex items-center gap-2">
                      {questionTypeIcons['text']} Text Input
                    </div>
                  </SelectItem>
                  <SelectItem value="dropdown" className="text-xs">
                    <div className="flex items-center gap-2">
                      {questionTypeIcons['dropdown']} Dropdown
                    </div>
                  </SelectItem>
                  <SelectItem value="scale" className="text-xs">
                    <div className="flex items-center gap-2">
                      {questionTypeIcons['scale']} Scale
                    </div>
                  </SelectItem>
                  <SelectItem value="yes-no" className="text-xs">
                    <div className="flex items-center gap-2">
                      {questionTypeIcons['yes-no']} Yes/No
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Question/Heading Title */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase">
              {step.type === 'question' ? 'Question' : 'Heading'}
            </Label>
            <Input
              value={questionTitle}
              onChange={(e) => updateSettings({ title: e.target.value })}
              placeholder={step.type === 'question' ? 'What is your biggest challenge?' : 'Welcome!'}
              className="h-8 text-xs bg-background border-border"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase">Description (optional)</Label>
            <Textarea
              value={questionDescription}
              onChange={(e) => updateSettings({ description: e.target.value })}
              placeholder="Add additional context..."
              className="text-xs bg-background border-border min-h-[60px] resize-none"
            />
          </div>

          {/* Options List (for multiple choice) */}
          {step.type === 'question' && (questionType === 'multiple-choice' || questionType === 'dropdown') && (
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase">Options</Label>
              <div className="space-y-1.5">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-1.5 group">
                    <div 
                      className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing shrink-0"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-3 h-3" />
                    </div>
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="h-7 text-xs bg-background border-border flex-1"
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addOption}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-3 h-3" />
                Add Option
              </button>
            </div>
          )}

          {/* Required Toggle */}
          {step.type === 'question' && (
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 border border-border">
              <Label className="text-xs text-foreground">Required</Label>
              <Switch
                checked={isRequired}
                onCheckedChange={(checked) => updateSettings({ required: checked })}
              />
            </div>
          )}

          {/* Capture Fields (for capture steps) */}
          {step.type === 'capture' && (
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase">Fields to Collect</Label>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <Label className="text-xs text-foreground">Name</Label>
                  </div>
                  <Switch
                    checked={stepSettings.collectName ?? true}
                    onCheckedChange={(checked) => updateSettings({ collectName: checked })}
                  />
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <Label className="text-xs text-foreground">Email</Label>
                  </div>
                  <Switch
                    checked={stepSettings.collectEmail ?? true}
                    onCheckedChange={(checked) => updateSettings({ collectEmail: checked })}
                  />
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    <Label className="text-xs text-foreground">Phone</Label>
                  </div>
                  <Switch
                    checked={stepSettings.collectPhone ?? false}
                    onCheckedChange={(checked) => updateSettings({ collectPhone: checked })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Button Text */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase">Button Text</Label>
            <Input
              value={buttonText}
              onChange={(e) => updateSettings({ buttonText: e.target.value })}
              placeholder="Continue"
              className="h-8 text-xs bg-background border-border"
            />
          </div>
          
          {/* Button Action - What happens when button is clicked */}
          {step.type !== 'ending' && (
            <div className="space-y-1.5">
              <Label className="text-[10px] text-builder-text-muted uppercase">On Click</Label>
              <ButtonActionSelector
                action={stepSettings.buttonAction as ButtonAction | undefined}
                onChange={(action) => updateSettings({ buttonAction: action })}
                availableSteps={allSteps.filter(s => s.id !== step.id).map(s => ({ id: s.id, name: s.name }))}
                stepType={step.type as 'welcome' | 'question' | 'capture' | 'ending'}
                compact
              />
            </div>
          )}
        </div>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <div className="flex-1 overflow-y-auto builder-scroll p-4 space-y-4">
          {/* Title Size */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase">Text Size</Label>
            <Select 
              value={stepSettings.titleSize || 'xl'}
              onValueChange={(value) => updateSettings({ titleSize: value as ApplicationFlowStepSettings['titleSize'] })}
            >
              <SelectTrigger className="h-8 text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="lg" className="text-xs">Small</SelectItem>
                <SelectItem value="xl" className="text-xs">Medium</SelectItem>
                <SelectItem value="2xl" className="text-xs">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Text Alignment */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase">Alignment</Label>
            <div className="flex rounded-md overflow-hidden border border-border">
              {(['left', 'center'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => updateSettings({ align })}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors capitalize',
                    (stepSettings.align || 'center') === align
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          {/* Note: Button styling is controlled by clicking the button element directly */}
          {/* This ensures all buttons use the unified button inspector */}

          <div className="border-t border-border my-4 pt-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase mb-3">Answer Options</p>
          </div>

          {/* Input/Answer Style (for question steps) */}
          {step.type === 'question' && (
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase">Answer Style</Label>
              <div className="flex rounded-md overflow-hidden border border-border">
                <button
                  onClick={() => updateSettings({ inputStyle: 'default' })}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors',
                    (stepSettings.inputStyle || 'default') === 'default'
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  Rounded
                </button>
                <button
                  onClick={() => updateSettings({ inputStyle: 'square' })}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors',
                    stepSettings.inputStyle === 'square'
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  Square
                </button>
                <button
                  onClick={() => updateSettings({ inputStyle: 'rounded' })}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors',
                    stepSettings.inputStyle === 'rounded'
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  Pill
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-border my-4 pt-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase mb-3">Layout</p>
          </div>

          {/* Spacing */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase">Spacing</Label>
            <Select 
              value={stepSettings.spacing || 'normal'}
              onValueChange={(value) => updateSettings({ spacing: value as ApplicationFlowStepSettings['spacing'] })}
            >
              <SelectTrigger className="h-8 text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="compact" className="text-xs">Compact</SelectItem>
                <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                <SelectItem value="relaxed" className="text-xs">Spacious</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title Size */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase">Title Size</Label>
            <Select 
              value={stepSettings.titleSize || 'lg'}
              onValueChange={(value) => updateSettings({ titleSize: value as ApplicationFlowStepSettings['titleSize'] })}
            >
              <SelectTrigger className="h-8 text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="sm" className="text-xs">Small</SelectItem>
                <SelectItem value="md" className="text-xs">Medium</SelectItem>
                <SelectItem value="lg" className="text-xs">Large</SelectItem>
                <SelectItem value="xl" className="text-xs">X-Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Logic Tab */}
      {activeTab === 'logic' && (
        <div className="flex-1 overflow-y-auto builder-scroll p-4 space-y-4">
          {/* After This Step */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase">After This Step</Label>
            <Select 
              value={step.navigation.action}
              onValueChange={(value) => onUpdate({ navigation: { ...step.navigation, action: value as any } })}
            >
              <SelectTrigger className="h-8 text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="next" className="text-xs">Continue</SelectItem>
                <SelectItem value="go-to-step" className="text-xs">Go to Step</SelectItem>
                <SelectItem value="submit" className="text-xs">Submit</SelectItem>
                <SelectItem value="redirect" className="text-xs">Open URL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Page (if go-to-step) */}
          {step.navigation.action === 'go-to-step' && (
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase">Target Page</Label>
              <Select 
                value={step.navigation.targetStepId || ''}
                onValueChange={(value) => onUpdate({ navigation: { ...step.navigation, targetStepId: value } })}
              >
                <SelectTrigger className="h-8 text-xs bg-background border-border">
                  <SelectValue placeholder="Select page..." />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {allSteps.filter(s => s.id !== step.id).map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">Use this to jump to another page in the funnel.</p>
            </div>
          )}

          {/* Redirect URL (if redirect) */}
          {step.navigation.action === 'redirect' && (
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase">Redirect URL</Label>
              <Input
                value={step.navigation.redirectUrl || ''}
                onChange={(e) => onUpdate({ navigation: { ...step.navigation, redirectUrl: e.target.value } })}
                placeholder="https://..."
                className="h-8 text-xs bg-background border-border"
              />
            </div>
          )}

          
        </div>
      )}
    </div>
  );
};