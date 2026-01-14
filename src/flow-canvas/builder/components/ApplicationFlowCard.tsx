import React from 'react';
import { Block, ApplicationFlowSettings, ApplicationFlowStep } from '../../types/infostack';
import { cn } from '@/lib/utils';
import { InlineTextEditor } from './InlineTextEditor';

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
  // This syncs with right panel edits - no more block.elements split
  // ─────────────────────────────────────────────────────────
  const renderWelcomeStep = () => {
    const welcomeStep = steps.find(s => s.type === 'welcome');
    const s = (welcomeStep as any)?.settings || {};
    const stepId = welcomeStep?.id || '';

    return (
      <div className="text-center py-12 px-8">
        {/* Heading – inline editable, reads from step.settings.title */}
        <div className="block">
          <InlineTextEditor
            value={s.title || 'Apply Now'}
            onChange={(content) => updateStepSetting(stepId, 'title', content)}
            placeholder="Apply Now"
            className="text-2xl font-bold text-foreground inline-block"
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
          <InlineTextEditor
            value={s.buttonText || 'Start Application →'}
            onChange={(content) => updateStepSetting(stepId, 'buttonText', content)}
            placeholder="Start Application →"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
            elementType="text"
            elementId={`step-${stepId}-btn`}
          />
        </div>
      </div>
    );
  };

  // Question step - show question text, options/input, and continue button
  const renderQuestionStep = (step: ApplicationFlowStep) => {
    const s = (step as any).settings || {};
    return (
      <div className="text-center py-12 px-8">
        <InlineTextEditor
          value={s.title || 'Your question here'}
          onChange={(content) => updateStepSetting(step.id, 'title', content)}
          placeholder="What's your biggest challenge?"
          className="text-xl font-bold text-foreground inline-block"
          elementType="heading"
          elementId={`step-${step.id}-title`}
        />
        {s.description && (
          <p className="text-sm text-muted-foreground mt-2">{s.description}</p>
        )}
        
        {/* Multiple Choice Options */}
        {s.questionType === 'multiple-choice' && s.options && (
          <div className="mt-6 space-y-2 max-w-md mx-auto">
            {(s.options as string[]).map((option: string, i: number) => (
              <div 
                key={i} 
                className="px-4 py-3 border border-border rounded-lg text-left text-sm text-foreground hover:border-primary/50 cursor-pointer transition-colors bg-background"
              >
                {option}
              </div>
            ))}
          </div>
        )}
        
        {/* Text Input */}
        {s.questionType === 'text' && (
          <div className="mt-6 max-w-md mx-auto">
            <textarea 
              className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-background text-foreground resize-none"
              placeholder="Type your answer..."
              rows={3}
              disabled
            />
          </div>
        )}
        
        <span 
          className="inline-block mt-6 px-6 py-3 rounded-lg font-medium text-sm bg-primary text-primary-foreground"
        >
          {s.buttonText || 'Continue'}
        </span>
      </div>
    );
  };

  // Capture step - name/email fields + submit button
  const renderCaptureStep = (step: ApplicationFlowStep) => {
    const s = (step as any).settings || {};
    return (
      <div className="text-center py-12 px-8">
        <InlineTextEditor
          value={s.title || 'Where should we send your results?'}
          onChange={(content) => updateStepSetting(step.id, 'title', content)}
          placeholder="Where should we send your results?"
          className="text-xl font-bold text-foreground inline-block"
          elementType="heading"
          elementId={`step-${step.id}-title`}
        />
        <div className="mt-6 space-y-3 max-w-md mx-auto">
          <input 
            className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-background text-foreground" 
            placeholder="Your name" 
            disabled
          />
          <input 
            className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-background text-foreground" 
            placeholder="Your email" 
            disabled
          />
        </div>
        <span 
          className="inline-block mt-6 px-6 py-3 rounded-lg font-medium text-sm bg-primary text-primary-foreground"
        >
          {s.buttonText || 'Submit'}
        </span>
      </div>
    );
  };

  // Ending step - thank you message
  const renderEndingStep = (step: ApplicationFlowStep) => {
    const s = (step as any).settings || {};
    return (
      <div className="text-center py-12 px-8">
        <InlineTextEditor
          value={s.title || 'Thanks — we\'ll be in touch!'}
          onChange={(content) => updateStepSetting(step.id, 'title', content)}
          placeholder="Thanks for applying!"
          className="text-xl font-bold text-foreground inline-block"
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
        'w-full rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden bg-card',
        isSelected 
          ? 'border-primary ring-1 ring-primary/20' 
          : 'border-border hover:border-primary/30'
      )}
      onClick={onSelect}
    >
      {renderStepContent()}
      
      {/* Step indicator - subtle, at bottom */}
      {activeStep && steps.length > 1 && (
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground text-center bg-muted/30">
          Editing: {activeStep.name}
        </div>
      )}
    </div>
  );
};
