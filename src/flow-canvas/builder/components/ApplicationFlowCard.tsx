import React from 'react';
import { Block, ApplicationFlowSettings, ApplicationFlowStep } from '../../types/infostack';
import { cn } from '@/lib/utils';
import { InlineTextEditor } from './InlineTextEditor';
import {
  getTitleSizeClass,
  getAlignClass,
  getSpacingClass,
  getInputStyleClass,
  getButtonClasses,
  getButtonStyle,
} from '../utils/stepRenderHelpers';

interface ApplicationFlowCardProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateBlock: (updates: Partial<Block>) => void;
  readOnly?: boolean;
  selectedStepId?: string | null;
}

export const ApplicationFlowCard: React.FC<ApplicationFlowCardProps> = ({
  block,
  isSelected,
  onSelect,
  onUpdateBlock,
  readOnly = false,
  selectedStepId,
}) => {
  const settings = block.props as Partial<ApplicationFlowSettings>;
  const steps = settings?.steps || [];
  
  // Determine active step (default to first step / welcome)
  const activeStep = selectedStepId 
    ? steps.find(s => s.id === selectedStepId) 
    : steps[0];
  
  const stepSettings = (activeStep as any)?.settings || {};

  // Helper to update an element's content (for Welcome step via block.elements)
  const updateElementContent = (elementId: string, newContent: string) => {
    if (readOnly || !block.elements) return;
    
    const newElements = block.elements.map(el => 
      el.id === elementId ? { ...el, content: newContent } : el
    );
    onUpdateBlock({ elements: newElements });
  };

  // Helper to update step settings (for other step types)
  const updateStepSetting = (stepId: string, key: string, value: string) => {
    if (readOnly) return;
    const newSteps = steps.map(s => 
      s.id === stepId 
        ? { ...s, settings: { ...((s as any).settings || {}), [key]: value } }
        : s
    );
    onUpdateBlock({ props: { ...settings, steps: newSteps } });
  };

  // ─────────────────────────────────────────────────────────
  // Render "welcome" step using step.settings (single source of truth)
  // ─────────────────────────────────────────────────────────
  const renderWelcomeStep = () => {
    const welcomeStep = steps.find(s => s.type === 'welcome');
    const s = (welcomeStep as any)?.settings || {};
    const stepId = welcomeStep?.id || '';

    const alignClass = getAlignClass(s.align);
    const spacingClass = getSpacingClass(s.spacing);

    return (
      <div className={cn('flex flex-col', alignClass, spacingClass)}>
        {/* Heading – inline editable, reads from step.settings.title */}
        <div className="block">
          <InlineTextEditor
            value={s.title || 'Apply Now'}
            onChange={(content) => updateStepSetting(stepId, 'title', content)}
            placeholder="Apply Now"
            className={cn(getTitleSizeClass(s.titleSize), 'font-bold text-foreground inline-block')}
            elementType="heading"
            elementId={`step-${stepId}-title`}
          />
        </div>
        {/* Subline – inline editable, reads from step.settings.description */}
        <div className="block mt-2">
          <InlineTextEditor
            value={s.description || 'Answer a few quick questions to see if we are a good fit.'}
            onChange={(content) => updateStepSetting(stepId, 'description', content)}
            placeholder="Answer a few quick questions to see if we are a good fit."
            className="text-sm text-muted-foreground inline-block"
            elementType="text"
            elementId={`step-${stepId}-desc`}
          />
        </div>
        {/* CTA button – inline editable */}
        <div className="block mt-6">
          <span style={getButtonStyle(s)}>
            <InlineTextEditor
              value={s.buttonText || 'Start Application →'}
              onChange={(content) => updateStepSetting(stepId, 'buttonText', content)}
              placeholder="Start Application →"
              className={getButtonClasses(s)}
              elementType="text"
              elementId={`step-${stepId}-btn`}
            />
          </span>
        </div>
      </div>
    );
  };

  // Question step - show question text, options/input, and continue button
  const renderQuestionStep = (step: ApplicationFlowStep) => {
    const s = (step as any).settings || {};
    const alignClass = getAlignClass(s.align);
    const spacingClass = getSpacingClass(s.spacing);
    const inputStyleClass = getInputStyleClass(s.inputStyle);

    return (
      <div className={cn('flex flex-col', alignClass, spacingClass)}>
        <InlineTextEditor
          value={s.title || 'Your question here'}
          onChange={(content) => updateStepSetting(step.id, 'title', content)}
          placeholder="What's your biggest challenge?"
          className={cn(getTitleSizeClass(s.titleSize), 'font-bold text-foreground inline-block')}
          elementType="heading"
          elementId={`step-${step.id}-title`}
        />
        {s.description && (
          <p className="text-sm text-muted-foreground mt-2">{s.description}</p>
        )}
        
        {/* Multiple Choice Options */}
        {s.questionType === 'multiple-choice' && s.options && (
          <div className="mt-6 space-y-2 max-w-md w-full">
            {(s.options as string[]).map((option: string, i: number) => (
              <div 
                key={i} 
                className={cn(
                  'px-4 py-3 border border-border text-left text-sm text-foreground hover:border-primary/50 cursor-pointer transition-colors bg-background',
                  inputStyleClass
                )}
              >
                {option}
              </div>
            ))}
          </div>
        )}
        
        {/* Text Input */}
        {s.questionType === 'text' && (
          <div className="mt-6 max-w-md w-full">
            <textarea 
              className={cn(
                'w-full px-4 py-3 border border-border text-sm bg-background text-foreground resize-none',
                inputStyleClass
              )}
              placeholder="Type your answer..."
              rows={3}
              disabled
            />
          </div>
        )}

        {/* Dropdown */}
        {s.questionType === 'dropdown' && (
          <div className="mt-6 max-w-md w-full">
            <div 
              className={cn(
                'w-full px-4 py-3 border border-border text-sm bg-background text-foreground flex items-center justify-between',
                inputStyleClass
              )}
            >
              <span className="text-muted-foreground">
                {s.options?.[0] || 'Select an option...'}
              </span>
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        {/* Scale (1-10 or 1-5) */}
        {s.questionType === 'scale' && (
          <div className="mt-6 max-w-md w-full">
            <div className="flex gap-2 justify-center">
              {Array.from({ length: s.scaleMax || 10 }, (_, i) => i + 1).map((num) => (
                <div
                  key={num}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center border border-border text-sm font-medium cursor-pointer hover:border-primary hover:bg-primary/10 transition-colors',
                    inputStyleClass
                  )}
                >
                  {num}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{s.scaleMinLabel || 'Not at all'}</span>
              <span>{s.scaleMaxLabel || 'Extremely'}</span>
            </div>
          </div>
        )}

        {/* Yes/No */}
        {s.questionType === 'yes-no' && (
          <div className="mt-6 space-y-2 max-w-md w-full">
            {['Yes', 'No'].map((option) => (
              <div 
                key={option} 
                className={cn(
                  'px-4 py-3 border border-border text-left text-sm text-foreground hover:border-primary/50 cursor-pointer transition-colors bg-background',
                  inputStyleClass
                )}
              >
                {option}
              </div>
            ))}
          </div>
        )}
        
        <span 
          className={cn(getButtonClasses(s), 'mt-6')}
          style={getButtonStyle(s)}
        >
          {s.buttonText || 'Continue'}
        </span>
      </div>
    );
  };

  // Capture step - conditionally render name/email/phone fields based on settings
  const renderCaptureStep = (step: ApplicationFlowStep) => {
    const s = (step as any).settings || {};
    const alignClass = getAlignClass(s.align);
    const spacingClass = getSpacingClass(s.spacing);
    const inputStyleClass = getInputStyleClass(s.inputStyle);

    // Determine which fields to show - default to name + email if none specified
    const showName = s.collectName ?? true;
    const showEmail = s.collectEmail ?? true;
    const showPhone = s.collectPhone ?? false;

    return (
      <div className={cn('flex flex-col', alignClass, spacingClass)}>
        <InlineTextEditor
          value={s.title || 'Where should we send your results?'}
          onChange={(content) => updateStepSetting(step.id, 'title', content)}
          placeholder="Where should we send your results?"
          className={cn(getTitleSizeClass(s.titleSize), 'font-bold text-foreground inline-block')}
          elementType="heading"
          elementId={`step-${step.id}-title`}
        />
        {s.description && (
          <p className="text-sm text-muted-foreground mt-2">{s.description}</p>
        )}
        <div className="mt-6 space-y-3 max-w-md w-full">
          {showName && (
            <input 
              className={cn(
                'w-full px-4 py-3 border border-border text-sm bg-background text-foreground',
                inputStyleClass
              )}
              placeholder="Your name" 
              disabled
            />
          )}
          {showEmail && (
            <input 
              className={cn(
                'w-full px-4 py-3 border border-border text-sm bg-background text-foreground',
                inputStyleClass
              )}
              placeholder="Your email" 
              disabled
            />
          )}
          {showPhone && (
            <input 
              className={cn(
                'w-full px-4 py-3 border border-border text-sm bg-background text-foreground',
                inputStyleClass
              )}
              placeholder="Your phone" 
              disabled
            />
          )}
        </div>
        <span 
          className={cn(getButtonClasses(s), 'mt-6')}
          style={getButtonStyle(s)}
        >
          {s.buttonText || 'Submit'}
        </span>
      </div>
    );
  };

  // Ending step - thank you message
  const renderEndingStep = (step: ApplicationFlowStep) => {
    const s = (step as any).settings || {};
    const alignClass = getAlignClass(s.align);
    const spacingClass = getSpacingClass(s.spacing);

    return (
      <div className={cn('flex flex-col', alignClass, spacingClass)}>
        <InlineTextEditor
          value={s.title || 'Thanks — we\'ll be in touch!'}
          onChange={(content) => updateStepSetting(step.id, 'title', content)}
          placeholder="Thanks for applying!"
          className={cn(getTitleSizeClass(s.titleSize), 'font-bold text-foreground inline-block')}
          elementType="heading"
          elementId={`step-${step.id}-title`}
        />
        {s.description && (
          <p className="text-sm text-muted-foreground mt-2">{s.description}</p>
        )}
      </div>
    );
  };

  // Render different layouts based on step type
  const renderStepContent = () => {
    // If no step or welcome step: render from step.settings (unified source of truth)
    if (!activeStep || activeStep.type === 'welcome') {
      return renderWelcomeStep();
    }
    
    switch (activeStep.type) {
      case 'question':
        return renderQuestionStep(activeStep);
      case 'capture':
        return renderCaptureStep(activeStep);
      case 'ending':
        return renderEndingStep(activeStep);
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <div
      className={cn(
        'w-full rounded-lg transition-all duration-200 cursor-pointer overflow-hidden bg-background',
        isSelected 
          ? 'ring-2 ring-primary ring-offset-2' 
          : 'hover:ring-1 hover:ring-primary/30'
      )}
      onClick={onSelect}
    >
      {renderStepContent()}
      
      {/* Step indicator - subtle, at bottom */}
      {activeStep && steps.length > 1 && (
        <div className="border-t border-border/50 px-4 py-2 text-xs text-muted-foreground text-center">
          Editing: {activeStep.name}
        </div>
      )}
    </div>
  );
};
