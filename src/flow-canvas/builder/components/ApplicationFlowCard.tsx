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

  // Welcome step renders from block.elements (the Apply Section)
  const renderWelcomeFromElements = () => (
    <div className="text-center py-12 px-8">
      {block.elements && block.elements.length > 0 ? (
        block.elements.map((el) => {
          if (el.type === 'heading') {
            return (
              <div key={el.id} className="block">
                <InlineTextEditor
                  value={el.content || ''}
                  onChange={(newContent) => updateElementContent(el.id, newContent)}
                  placeholder="Apply Now"
                  className="text-2xl font-bold text-foreground inline-block"
                  elementType="heading"
                  elementId={el.id}
                />
              </div>
            );
          }
          if (el.type === 'text') {
            return (
              <div key={el.id} className="block mt-2">
                <InlineTextEditor
                  value={el.content || ''}
                  onChange={(newContent) => updateElementContent(el.id, newContent)}
                  placeholder="Answer a few quick questions..."
                  className="text-sm text-muted-foreground inline-block"
                  elementType="text"
                  elementId={el.id}
                />
              </div>
            );
          }
          if (el.type === 'button') {
            return (
              <span 
                key={el.id} 
                className="inline-block mt-6 px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium text-sm transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {el.content || 'Start Application →'}
              </span>
            );
          }
          return null;
        })
      ) : (
        <>
          <h2 className="text-2xl font-bold text-foreground">Apply Now</h2>
          <p className="text-sm text-muted-foreground mt-2">Answer a few quick questions to get started.</p>
          <span className="inline-block mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm">
            Start Application →
          </span>
        </>
      )}
    </div>
  );

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
    // If no step or welcome step: render block.elements (Apply Section)
    if (!activeStep || activeStep.type === 'welcome') {
      return renderWelcomeFromElements();
    }
    
    switch (activeStep.type) {
      case 'question':
        return renderQuestionStep(activeStep);
      case 'capture':
        return renderCaptureStep(activeStep);
      case 'ending':
        return renderEndingStep(activeStep);
      default:
        return renderWelcomeFromElements();
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
