import React, { useState } from 'react';
import { ApplicationFlowStep, ApplicationStepType } from '../../../types/infostack';
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

type QuestionType = 'multiple-choice' | 'text' | 'dropdown' | 'scale' | 'yes-no';

const questionTypeIcons: Record<QuestionType, React.ReactNode> = {
  'multiple-choice': <List className="w-4 h-4" />,
  'text': <Type className="w-4 h-4" />,
  'dropdown': <ChevronDown className="w-4 h-4" />,
  'scale': <Scale className="w-4 h-4" />,
  'yes-no': <ToggleLeft className="w-4 h-4" />,
};

// Step settings stored in elements or as extended step data
interface StepSettings {
  questionType?: QuestionType;
  options?: string[];
  required?: boolean;
  title?: string;
  description?: string;
  buttonText?: string;
  titleSize?: string;
  align?: string;
  buttonColor?: string;
  spacing?: string;
}

interface StepContentEditorProps {
  step: ApplicationFlowStep & { settings?: StepSettings };
  allSteps: ApplicationFlowStep[];
  onUpdate: (updates: Partial<ApplicationFlowStep & { settings?: StepSettings }>) => void;
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
    <div className="flex flex-col h-full">
      {/* Header with Back Button */}
      <div className="px-4 py-3 border-b border-builder-border bg-builder-surface">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs text-builder-text-muted hover:text-builder-text transition-colors mb-2"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Steps
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-builder-accent/15 flex items-center justify-center text-builder-accent">
            {stepTypeIcons[step.type]}
          </div>
          <Input
            value={step.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="h-7 text-sm font-semibold bg-transparent border-transparent hover:border-builder-border focus:border-builder-accent px-1"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-builder-border">
        {(['content', 'style', 'logic'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 px-3 py-2 text-xs font-medium transition-colors',
              activeTab === tab
                ? 'text-builder-accent border-b-2 border-builder-accent'
                : 'text-builder-text-muted hover:text-builder-text'
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
            <Label className="text-[10px] text-builder-text-muted uppercase">Step Type</Label>
            <Select 
              value={step.type} 
              onValueChange={(value) => onUpdate({ type: value as ApplicationStepType })}
            >
              <SelectTrigger className="h-8 text-xs bg-builder-surface border-builder-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-builder-surface border-builder-border">
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
              <Label className="text-[10px] text-builder-text-muted uppercase">Question Type</Label>
              <Select 
                value={questionType}
                onValueChange={(value) => updateSettings({ questionType: value as QuestionType })}
              >
                <SelectTrigger className="h-8 text-xs bg-builder-surface border-builder-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-builder-surface border-builder-border">
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
            <Label className="text-[10px] text-builder-text-muted uppercase">
              {step.type === 'question' ? 'Question' : 'Heading'}
            </Label>
            <Input
              value={questionTitle}
              onChange={(e) => updateSettings({ title: e.target.value })}
              placeholder={step.type === 'question' ? 'What is your biggest challenge?' : 'Welcome!'}
              className="h-8 text-xs bg-builder-surface border-builder-border"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-builder-text-muted uppercase">Description (optional)</Label>
            <Textarea
              value={questionDescription}
              onChange={(e) => updateSettings({ description: e.target.value })}
              placeholder="Add additional context..."
              className="text-xs bg-builder-surface border-builder-border min-h-[60px] resize-none"
            />
          </div>

          {/* Options List (for multiple choice) */}
          {step.type === 'question' && (questionType === 'multiple-choice' || questionType === 'dropdown') && (
            <div className="space-y-2">
              <Label className="text-[10px] text-builder-text-muted uppercase">Options</Label>
              <div className="space-y-1.5">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-1.5 group">
                    <GripVertical className="w-3 h-3 text-builder-text-dim opacity-0 group-hover:opacity-100 cursor-grab" />
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="h-7 text-xs bg-builder-surface border-builder-border flex-1"
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="p-1 rounded hover:bg-builder-error/10 text-builder-text-dim hover:text-builder-error opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addOption}
                className="flex items-center gap-1.5 text-[10px] text-builder-accent hover:text-builder-accent/80"
              >
                <Plus className="w-3 h-3" />
                Add Option
              </button>
            </div>
          )}

          {/* Required Toggle */}
          {step.type === 'question' && (
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-builder-surface border border-builder-border">
              <Label className="text-xs text-builder-text">Required</Label>
              <Switch
                checked={isRequired}
                onCheckedChange={(checked) => updateSettings({ required: checked })}
              />
            </div>
          )}

          {/* Button Text */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-builder-text-muted uppercase">Button Text</Label>
            <Input
              value={buttonText}
              onChange={(e) => updateSettings({ buttonText: e.target.value })}
              placeholder="Continue"
              className="h-8 text-xs bg-builder-surface border-builder-border"
            />
          </div>

          {/* Button Action */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-builder-text-muted uppercase">After This Step</Label>
            <Select 
              value={step.navigation.action}
              onValueChange={(value) => onUpdate({ navigation: { ...step.navigation, action: value as any } })}
            >
              <SelectTrigger className="h-8 text-xs bg-builder-surface border-builder-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-builder-surface border-builder-border">
                <SelectItem value="next" className="text-xs">Next Step</SelectItem>
                <SelectItem value="go-to-step" className="text-xs">Go to Funnel Page</SelectItem>
                <SelectItem value="submit" className="text-xs">Submit Form</SelectItem>
                <SelectItem value="redirect" className="text-xs">Redirect to URL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {step.navigation.action === 'go-to-step' && (
            <div className="space-y-1.5">
              <Label className="text-[10px] text-builder-text-muted uppercase">Target Page</Label>
              <Select 
                value={step.navigation.targetStepId || ''}
                onValueChange={(value) => onUpdate({ navigation: { ...step.navigation, targetStepId: value } })}
              >
                <SelectTrigger className="h-8 text-xs bg-builder-surface border-builder-border">
                  <SelectValue placeholder="Select page..." />
                </SelectTrigger>
                <SelectContent className="bg-builder-surface border-builder-border">
                  {allSteps.filter(s => s.id !== step.id).map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-builder-text-dim">Use this to jump to any step on another page.</p>
            </div>
          )}

          {step.navigation.action === 'redirect' && (
            <div className="space-y-1.5">
              <Label className="text-[10px] text-builder-text-muted uppercase">Redirect URL</Label>
              <Input
                value={step.navigation.redirectUrl || ''}
                onChange={(e) => onUpdate({ navigation: { ...step.navigation, redirectUrl: e.target.value } })}
                placeholder="https://..."
                className="h-8 text-xs bg-builder-surface border-builder-border"
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
            <Label className="text-[10px] text-builder-text-muted uppercase">Title Size</Label>
            <Select 
              value={stepSettings.titleSize || 'xl'}
              onValueChange={(value) => updateSettings({ titleSize: value })}
            >
              <SelectTrigger className="h-8 text-xs bg-builder-surface border-builder-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-builder-surface border-builder-border">
                <SelectItem value="lg" className="text-xs">Large</SelectItem>
                <SelectItem value="xl" className="text-xs">Extra Large</SelectItem>
                <SelectItem value="2xl" className="text-xs">Huge</SelectItem>
                <SelectItem value="3xl" className="text-xs">Giant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Text Alignment */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-builder-text-muted uppercase">Alignment</Label>
            <div className="flex rounded-md overflow-hidden border border-builder-border">
              {['left', 'center', 'right'].map((align) => (
                <button
                  key={align}
                  onClick={() => updateSettings({ align })}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors capitalize',
                    (stepSettings.align || 'center') === align
                      ? 'bg-builder-accent text-white'
                      : 'bg-builder-surface text-builder-text-muted hover:bg-builder-surface-hover'
                  )}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          {/* Button Color */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-builder-text-muted uppercase">Button Color</Label>
            <div className="flex gap-2">
              {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map((color) => (
                <button
                  key={color}
                  onClick={() => updateSettings({ buttonColor: color })}
                  className={cn(
                    'w-7 h-7 rounded-md transition-all',
                    (stepSettings.buttonColor || '#6366f1') === color
                      ? 'ring-2 ring-offset-2 ring-builder-accent' 
                      : 'hover:scale-110'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Spacing */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-builder-text-muted uppercase">Spacing</Label>
            <Select 
              value={stepSettings.spacing || 'normal'}
              onValueChange={(value) => updateSettings({ spacing: value })}
            >
              <SelectTrigger className="h-8 text-xs bg-builder-surface border-builder-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-builder-surface border-builder-border">
                <SelectItem value="compact" className="text-xs">Compact</SelectItem>
                <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                <SelectItem value="relaxed" className="text-xs">Relaxed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Logic Tab */}
      {activeTab === 'logic' && (
        <div className="flex-1 overflow-y-auto builder-scroll p-4">
          <div className="text-center py-8 text-builder-text-muted">
            <p className="text-xs">Conditional logic coming soon</p>
            <p className="text-[10px] mt-1">Show/hide this step based on previous answers</p>
          </div>
        </div>
      )}
    </div>
  );
};
