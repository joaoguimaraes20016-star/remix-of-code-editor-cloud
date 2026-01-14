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
  buttonStyle?: 'primary' | 'outline';
  inputStyle?: 'rounded' | 'square';
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
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header with Back Button */}
      <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-2"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Steps
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
            {stepTypeIcons[step.type]}
          </div>
          <Input
            value={step.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="h-7 text-sm font-medium bg-transparent border-transparent hover:border-gray-300 focus:border-gray-400 px-1"
          />
        </div>
      </div>

      {/* Step Preview - matches canvas exactly using semantic tokens */}
      <div className="px-4 py-3 border-b border-border">
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Preview</div>
        <div 
          className="border border-border rounded-xl p-3 bg-transparent overflow-hidden"
          style={{ height: '220px' }}
        >
          <div 
            className="origin-top"
            style={{ transform: 'scale(0.6)', transformOrigin: 'top center' }}
          >
            {/* Render same content as ApplicationFlowCard canvas - exact match */}
            <div className="text-center py-12 px-8 bg-card rounded-lg">
              {/* Title - matches ApplicationFlowCard exactly (text-2xl for welcome, text-xl for others) */}
              <h3 className={cn(
                'font-bold text-foreground',
                step.type === 'welcome' ? 'text-2xl' : 'text-xl'
              )}>
                {questionTitle || (step.type === 'welcome' ? 'Apply Now' : step.type === 'question' ? 'Your question here' : step.type === 'capture' ? 'Where should we send your results?' : step.type === 'ending' ? 'Thanks — we will be in touch!' : 'Heading')}
              </h3>
              
              {/* Description - matches ApplicationFlowCard */}
              {(questionDescription || step.type === 'welcome') && (
                <p className="text-sm text-muted-foreground mt-2">
                  {questionDescription || (step.type === 'welcome' ? 'Answer a few quick questions to see if we are a good fit.' : '')}
                </p>
              )}
              
              {/* Question options for multiple choice - matches renderQuestionStep */}
              {step.type === 'question' && questionType === 'multiple-choice' && options.length > 0 && (
                <div className="mt-6 space-y-2 max-w-md mx-auto">
                  {options.slice(0, 3).map((option, i) => (
                    <div 
                      key={i}
                      className="px-4 py-3 border border-border rounded-lg text-left text-sm text-foreground bg-background"
                    >
                      {option}
                    </div>
                  ))}
                  {options.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{options.length - 3} more</div>
                  )}
                </div>
              )}
              
              {/* Text input for text questions - matches renderQuestionStep */}
              {step.type === 'question' && questionType === 'text' && (
                <div className="mt-6 max-w-md mx-auto">
                  <div className="w-full px-4 py-3 border border-border rounded-lg text-sm text-muted-foreground bg-background text-left">
                    Type your answer...
                  </div>
                </div>
              )}
              
              {/* Capture fields - matches renderCaptureStep */}
              {step.type === 'capture' && (
                <div className="mt-6 space-y-3 max-w-md mx-auto">
                  <div className="px-4 py-3 border border-border rounded-lg text-sm text-muted-foreground bg-background text-left">
                    Your name
                  </div>
                  <div className="px-4 py-3 border border-border rounded-lg text-sm text-muted-foreground bg-background text-left">
                    Your email
                  </div>
                </div>
              )}
              
              {/* Ending step - no button, just message */}
              {step.type === 'ending' ? (
                questionDescription ? null : (
                  <p className="text-muted-foreground mt-4 text-sm">
                    We'll be in touch shortly.
                  </p>
                )
              ) : (
                /* Button - matches all step types except ending */
                <span className="inline-block mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm">
                  {buttonText || (step.type === 'welcome' ? 'Start Application →' : step.type === 'capture' ? 'Submit' : 'Continue')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['content', 'style', 'logic'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 px-3 py-2 text-xs font-medium transition-colors',
              activeTab === tab
                ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
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
            <Label className="text-[10px] text-gray-500 uppercase">Step Type</Label>
            <Select 
              value={step.type} 
              onValueChange={(value) => onUpdate({ type: value as ApplicationStepType })}
            >
              <SelectTrigger className="h-8 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
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
              <Label className="text-[10px] text-gray-500 uppercase">Question Type</Label>
              <Select 
                value={questionType}
                onValueChange={(value) => updateSettings({ questionType: value as QuestionType })}
              >
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
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
            <Label className="text-[10px] text-gray-500 uppercase">
              {step.type === 'question' ? 'Question' : 'Heading'}
            </Label>
            <Input
              value={questionTitle}
              onChange={(e) => updateSettings({ title: e.target.value })}
              placeholder={step.type === 'question' ? 'What is your biggest challenge?' : 'Welcome!'}
              className="h-8 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-500 uppercase">Description (optional)</Label>
            <Textarea
              value={questionDescription}
              onChange={(e) => updateSettings({ description: e.target.value })}
              placeholder="Add additional context..."
              className="text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 min-h-[60px] resize-none"
            />
          </div>

          {/* Options List (for multiple choice) */}
          {step.type === 'question' && (questionType === 'multiple-choice' || questionType === 'dropdown') && (
            <div className="space-y-2">
              <Label className="text-[10px] text-gray-500 uppercase">Options</Label>
              <div className="space-y-1.5">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-1.5 group">
                    <GripVertical className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 cursor-grab" />
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="h-7 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 flex-1"
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addOption}
                className="flex items-center gap-1.5 text-[10px] text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Plus className="w-3 h-3" />
                Add Option
              </button>
            </div>
          )}

          {/* Required Toggle */}
          {step.type === 'question' && (
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Label className="text-xs text-gray-700 dark:text-gray-300">Required</Label>
              <Switch
                checked={isRequired}
                onCheckedChange={(checked) => updateSettings({ required: checked })}
              />
            </div>
          )}

          {/* Button Text */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-500 uppercase">Button Text</Label>
            <Input
              value={buttonText}
              onChange={(e) => updateSettings({ buttonText: e.target.value })}
              placeholder="Continue"
              className="h-8 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <div className="flex-1 overflow-y-auto builder-scroll p-4 space-y-4">
          {/* Title Size */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-500 uppercase">Text Size</Label>
            <Select 
              value={stepSettings.titleSize || 'xl'}
              onValueChange={(value) => updateSettings({ titleSize: value })}
            >
              <SelectTrigger className="h-8 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <SelectItem value="lg" className="text-xs">Small</SelectItem>
                <SelectItem value="xl" className="text-xs">Medium</SelectItem>
                <SelectItem value="2xl" className="text-xs">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Text Alignment */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-500 uppercase">Alignment</Label>
            <div className="flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
              {['left', 'center'].map((align) => (
                <button
                  key={align}
                  onClick={() => updateSettings({ align })}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors capitalize',
                    (stepSettings.align || 'center') === align
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          {/* Button Style */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-500 uppercase">Button Style</Label>
            <div className="flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => updateSettings({ buttonStyle: 'primary' })}
                className={cn(
                  'flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors',
                  (stepSettings.buttonStyle || 'primary') === 'primary'
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                Primary
              </button>
              <button
                onClick={() => updateSettings({ buttonStyle: 'outline' })}
                className={cn(
                  'flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors',
                  stepSettings.buttonStyle === 'outline'
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                Outline
              </button>
            </div>
          </div>

          {/* Input Style (for question steps) */}
          {step.type === 'question' && (
            <div className="space-y-1.5">
              <Label className="text-[10px] text-gray-500 uppercase">Input Style</Label>
              <div className="flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => updateSettings({ inputStyle: 'rounded' })}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors',
                    (stepSettings.inputStyle || 'rounded') === 'rounded'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  Rounded
                </button>
                <button
                  onClick={() => updateSettings({ inputStyle: 'square' })}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors',
                    stepSettings.inputStyle === 'square'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  Square
                </button>
              </div>
            </div>
          )}

          {/* Button Color */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-500 uppercase">Button Color</Label>
            <div className="flex gap-2 flex-wrap">
              {['#18181b', '#3f3f46', '#71717a', '#0ea5e9', '#10b981', '#ef4444'].map((color) => (
                <button
                  key={color}
                  onClick={() => updateSettings({ buttonColor: color })}
                  className={cn(
                    'w-7 h-7 rounded-md transition-all',
                    (stepSettings.buttonColor || '#18181b') === color
                      ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white' 
                      : 'hover:scale-110'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Spacing */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-500 uppercase">Spacing</Label>
            <Select 
              value={stepSettings.spacing || 'normal'}
              onValueChange={(value) => updateSettings({ spacing: value })}
            >
              <SelectTrigger className="h-8 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <SelectItem value="compact" className="text-xs">Compact</SelectItem>
                <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                <SelectItem value="relaxed" className="text-xs">Spacious</SelectItem>
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
            <Label className="text-[10px] text-gray-500 uppercase">After This Step</Label>
            <Select 
              value={step.navigation.action}
              onValueChange={(value) => onUpdate({ navigation: { ...step.navigation, action: value as any } })}
            >
              <SelectTrigger className="h-8 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <SelectItem value="next" className="text-xs">Next Step</SelectItem>
                <SelectItem value="go-to-step" className="text-xs">Go to Funnel Page</SelectItem>
                <SelectItem value="submit" className="text-xs">Submit & Complete</SelectItem>
                <SelectItem value="redirect" className="text-xs">Redirect to URL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Page (if go-to-step) */}
          {step.navigation.action === 'go-to-step' && (
            <div className="space-y-1.5">
              <Label className="text-[10px] text-gray-500 uppercase">Target Page</Label>
              <Select 
                value={step.navigation.targetStepId || ''}
                onValueChange={(value) => onUpdate({ navigation: { ...step.navigation, targetStepId: value } })}
              >
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Select page..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  {allSteps.filter(s => s.id !== step.id).map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-gray-400">Use this to jump to another page in the funnel.</p>
            </div>
          )}

          {/* Redirect URL (if redirect) */}
          {step.navigation.action === 'redirect' && (
            <div className="space-y-1.5">
              <Label className="text-[10px] text-gray-500 uppercase">Redirect URL</Label>
              <Input
                value={step.navigation.redirectUrl || ''}
                onChange={(e) => onUpdate({ navigation: { ...step.navigation, redirectUrl: e.target.value } })}
                placeholder="https://..."
                className="h-8 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              />
            </div>
          )}

          {/* Conditional Logic Placeholder */}
          <div className="mt-6 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-center">
            <p className="text-xs text-gray-500">Conditional logic coming soon</p>
            <p className="text-[10px] text-gray-400 mt-1">Show/hide this step based on previous answers</p>
          </div>
        </div>
      )}
    </div>
  );
};
