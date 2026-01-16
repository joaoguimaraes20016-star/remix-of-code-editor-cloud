import React from 'react';
import { Block, ApplicationFlowSettings, ApplicationFlowStep, ApplicationFlowBackground } from '../../types/infostack';
import { cn } from '@/lib/utils';
import { InlineTextEditor } from './InlineTextEditor';
import {
  getTitleSizeClass,
  getAlignClass,
  getSpacingClass,
  getInputStyleClass,
} from '../utils/stepRenderHelpers';
import { useFlowContainerSafe, buttonActionToIntent } from '../contexts/FlowContainerContext';
import { FlowButton, presetToVariant } from './FlowButton';

// Convert ApplicationFlowBackground to CSS string
const backgroundToCSS = (bg?: ApplicationFlowBackground): string => {
  if (!bg) return '#ffffff';
  
  switch (bg.type) {
    case 'solid':
      return bg.color || '#ffffff';
    case 'gradient':
      if (!bg.gradient) return '#ffffff';
      const stops = bg.gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ');
      return bg.gradient.type === 'radial' 
        ? `radial-gradient(circle, ${stops})`
        : `linear-gradient(${bg.gradient.angle}deg, ${stops})`;
    case 'image':
      return bg.imageUrl ? `url(${bg.imageUrl}) center/cover no-repeat` : '#ffffff';
    default:
      return '#ffffff';
  }
};

// Step element types that can be selected
export type StepElementType = 'title' | 'description' | 'button' | 'option' | 'input';

export interface StepElementSelection {
  stepId: string;
  elementType: StepElementType;
  optionIndex?: number; // For option elements
}

interface ApplicationFlowCardProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateBlock: (updates: Partial<Block>) => void;
  readOnly?: boolean;
  selectedStepId?: string | null;
  /** Currently selected element within a step */
  selectedStepElement?: StepElementSelection | null;
  /** Called when a specific step is clicked (for direct step selection) */
  onSelectStep?: (stepId: string) => void;
  /** Called when an element within a step is clicked for editing */
  onSelectStepElement?: (selection: StepElementSelection) => void;
  /** Called when button action is "next-step" - advances to the next step */
  onNextStep?: () => void;
  /** Called when button action is "go-to-step" - jumps to a specific step */
  onGoToStep?: (stepId: string) => void;
  /** Preview mode - enables button click handling */
  isPreviewMode?: boolean;
}

export const ApplicationFlowCard: React.FC<ApplicationFlowCardProps> = ({
  block,
  isSelected,
  onSelect,
  onUpdateBlock,
  readOnly = false,
  selectedStepId,
  selectedStepElement,
  onSelectStep,
  onSelectStepElement,
  onNextStep,
  onGoToStep,
  isPreviewMode = false,
}) => {
  const settings = block.props as Partial<ApplicationFlowSettings>;
  const steps = settings?.steps || [];
  
  // Access FlowContainer for intent-based button actions (SINGLE SOURCE OF TRUTH)
  const flowContainer = useFlowContainerSafe();
  
  // Independent styling (not affected by global theme)
  const flowBackground = settings.background;
  const flowTextColor = settings.textColor || '#000000';
  const flowInputBg = settings.inputBackground || '#ffffff';
  const flowInputBorder = settings.inputBorderColor || '#e5e7eb';
  
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

  // Helper to select an element within a step
  const handleElementSelect = (e: React.MouseEvent, stepId: string, elementType: StepElementType, optionIndex?: number) => {
    if (readOnly || isPreviewMode) return;
    e.stopPropagation();
    
    if (onSelectStepElement) {
      onSelectStepElement({ stepId, elementType, optionIndex });
    }
  };

  // Check if an element is currently selected
  const isElementSelected = (stepId: string, elementType: StepElementType, optionIndex?: number): boolean => {
    if (!selectedStepElement) return false;
    return (
      selectedStepElement.stepId === stepId &&
      selectedStepElement.elementType === elementType &&
      (optionIndex === undefined || selectedStepElement.optionIndex === optionIndex)
    );
  };

  // Button click handler - EMITS INTENT to FlowContainer (SOLE AUTHORITY)
  // This component does NOT know step order or validation. It ONLY emits intent.
  // If FlowContainer is not present, progression is BLOCKED - no fallbacks.
  const handleButtonClick = (e: React.MouseEvent, stepSettings: any) => {
    if (!isPreviewMode) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    // ALWAYS emit intent to FlowContainer - it is the SOLE AUTHORITY
    // Intent fires even if disabled - FlowContainer decides what to do
    const action = stepSettings?.buttonAction;
    const intent = buttonActionToIntent(action);
    
    if (intent && flowContainer) {
      flowContainer.emitIntent(intent);
    }
    // If no FlowContainer: intent is dropped (progression blocked)
    // This is intentional - FlowContainer is REQUIRED for progression
  };

  /**
   * Check if a button should be disabled based on FlowContainer state.
   * This is a READ-ONLY check - button NEVER decides progression.
   */
  const isButtonDisabled = (stepSettings: any): boolean => {
    // In edit mode, never visually disabled
    if (!isPreviewMode) return false;
    // If no FlowContainer, cannot progress (but don't visually disable)
    if (!flowContainer) return false;
    
    const action = stepSettings?.buttonAction;
    const actionType = action?.type || 'next-step';
    const canProgress = flowContainer.canProgress;
    
    switch (actionType) {
      case 'next-step':
        return !canProgress.next;
      case 'prev-step':
        return !canProgress.prev;
      case 'submit':
        return !canProgress.submit;
      case 'go-to-step':
        return action?.value ? canProgress.goToStep[action.value] === false : false;
      // External actions are never disabled
      default:
        return false;
    }
  };

  /**
   * Get the blocked reason to display near buttons.
   * Only shown when there's a recent blocked intent.
   */
  const getBlockedReasonDisplay = (): string | null => {
    if (!isPreviewMode || !flowContainer) return null;
    return flowContainer.lastBlockedReason || null;
  };

  /**
   * Check if a step navigation dot should be disabled.
   * Uses FlowContainer's canProgress.goToStep state.
   */
  const isStepNavDisabled = (stepId: string): boolean => {
    if (!isPreviewMode || !flowContainer) return false;
    // Check if step is in visible steps
    if (!flowContainer.visibleSteps.includes(stepId)) return true;
    // Check if go-to-step is allowed
    return flowContainer.canProgress.goToStep[stepId] === false;
  };

  /**
   * Get filtered visible steps for navigation.
   * Only render steps that are in FlowContainer's visibleSteps.
   */
  const getVisibleStepsForNav = () => {
    if (!flowContainer || !isPreviewMode) {
      // In edit mode, show all steps
      return steps;
    }
    return steps.filter(step => flowContainer.visibleSteps.includes(step.id));
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
      <div className={cn('flex flex-col w-full px-6 py-8', alignClass, spacingClass)}>
        {/* Heading – inline editable, selectable for inspector */}
        <div 
          className={cn(
            'block cursor-pointer rounded transition-all',
            !isPreviewMode && 'hover:ring-2 hover:ring-primary/30',
            isElementSelected(stepId, 'title') && 'ring-2 ring-primary'
          )}
          onClick={(e) => handleElementSelect(e, stepId, 'title')}
        >
          <InlineTextEditor
            value={s.title || 'Apply Now'}
            onChange={(content) => updateStepSetting(stepId, 'title', content)}
            placeholder="Apply Now"
            className={cn(getTitleSizeClass(s.titleSize), 'font-bold inline-block')}
            style={{ color: flowTextColor }}
            elementType="heading"
            elementId={`step-${stepId}-title`}
          />
        </div>
        {/* Subline – inline editable, selectable for inspector */}
        <div 
          className={cn(
            'block mt-2 cursor-pointer rounded transition-all',
            !isPreviewMode && 'hover:ring-2 hover:ring-primary/30',
            isElementSelected(stepId, 'description') && 'ring-2 ring-primary'
          )}
          onClick={(e) => handleElementSelect(e, stepId, 'description')}
        >
          <InlineTextEditor
            value={s.description || 'Answer a few quick questions to see if we are a good fit.'}
            onChange={(content) => updateStepSetting(stepId, 'description', content)}
            placeholder="Answer a few quick questions to see if we are a good fit."
            className="text-sm inline-block opacity-70"
            style={{ color: flowTextColor }}
            elementType="text"
            elementId={`step-${stepId}-desc`}
          />
        </div>
        {/* CTA button – UNIFIED FlowButton component */}
        <div
          className={cn(
            'mt-6 inline-flex cursor-pointer rounded transition-all',
            !isPreviewMode && 'hover:ring-2 hover:ring-primary/30',
            isElementSelected(stepId, 'button') && 'ring-2 ring-primary'
          )}
          onClick={(e) => {
            if (!isPreviewMode) {
              e.stopPropagation();
              handleElementSelect(e, stepId, 'button');
            }
          }}
          onPointerDown={(e) => {
            if (!isPreviewMode) e.stopPropagation();
          }}
        >
          <FlowButton
            variant={presetToVariant(s.buttonPreset)}
            onClick={(e) => {
              if (isPreviewMode) handleButtonClick(e, s);
            }}
            isDisabled={isButtonDisabled(s)}
            className={cn(
              'builder-element-selectable',
              !isPreviewMode && 'pointer-events-none'
            )}
          >
            {s.buttonText || 'Start Application →'}
          </FlowButton>
        </div>
        {/* Blocked reason display */}
        {isButtonDisabled(s) && getBlockedReasonDisplay() && (
          <p className="text-xs mt-2 text-destructive/80" role="alert" aria-live="polite">
            {getBlockedReasonDisplay()}
          </p>
        )}
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
      <div className={cn('flex flex-col w-full px-6 py-8', alignClass, spacingClass)}>
        {/* Title - selectable */}
        <div 
          className={cn(
            'cursor-pointer rounded transition-all',
            !isPreviewMode && 'hover:ring-2 hover:ring-primary/30',
            isElementSelected(step.id, 'title') && 'ring-2 ring-primary'
          )}
          onClick={(e) => handleElementSelect(e, step.id, 'title')}
        >
          <InlineTextEditor
            value={s.title || 'Your question here'}
            onChange={(content) => updateStepSetting(step.id, 'title', content)}
            placeholder="What's your biggest challenge?"
            className={cn(getTitleSizeClass(s.titleSize), 'font-bold inline-block')}
            style={{ color: flowTextColor }}
            elementType="heading"
            elementId={`step-${step.id}-title`}
          />
        </div>
        {s.description && (
          <div 
            className={cn(
              'mt-2 cursor-pointer rounded transition-all',
              !isPreviewMode && 'hover:ring-2 hover:ring-primary/30',
              isElementSelected(step.id, 'description') && 'ring-2 ring-primary'
            )}
            onClick={(e) => handleElementSelect(e, step.id, 'description')}
          >
            <p className="text-sm opacity-70" style={{ color: flowTextColor }}>{s.description}</p>
          </div>
        )}
        
        {/* Multiple Choice Options - each option selectable */}
        {s.questionType === 'multiple-choice' && s.options && (
          <div className="mt-6 space-y-2 max-w-md w-full">
            {(s.options as string[]).map((option: string, i: number) => (
              <div 
                key={i} 
                className={cn(
                  'px-4 py-3 text-left text-sm cursor-pointer transition-all',
                  inputStyleClass,
                  !isPreviewMode && 'hover:ring-2 hover:ring-primary/30',
                  isElementSelected(step.id, 'option', i) && 'ring-2 ring-primary'
                )}
                style={{ 
                  backgroundColor: flowInputBg, 
                  borderColor: flowInputBorder, 
                  borderWidth: '1px', 
                  borderStyle: 'solid',
                  color: flowTextColor 
                }}
                onClick={(e) => handleElementSelect(e, step.id, 'option', i)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
        
        {/* Text Input */}
        {s.questionType === 'text' && (
          <div 
            className={cn(
              'mt-6 max-w-md w-full cursor-pointer rounded transition-all',
              !isPreviewMode && 'hover:ring-2 hover:ring-primary/30',
              isElementSelected(step.id, 'input') && 'ring-2 ring-primary'
            )}
            onClick={(e) => handleElementSelect(e, step.id, 'input')}
          >
            <textarea 
              className={cn(
                'w-full px-4 py-3 text-sm resize-none pointer-events-none',
                inputStyleClass
              )}
              style={{ 
                backgroundColor: flowInputBg, 
                borderColor: flowInputBorder, 
                borderWidth: '1px', 
                borderStyle: 'solid',
                color: flowTextColor 
              }}
              placeholder="Type your answer..."
              rows={3}
              disabled
            />
          </div>
        )}

        {/* Dropdown */}
        {s.questionType === 'dropdown' && (
          <div 
            className={cn(
              'mt-6 max-w-md w-full cursor-pointer rounded transition-all',
              !isPreviewMode && 'hover:ring-2 hover:ring-primary/30',
              isElementSelected(step.id, 'input') && 'ring-2 ring-primary'
            )}
            onClick={(e) => handleElementSelect(e, step.id, 'input')}
          >
            <div 
              className={cn(
                'w-full px-4 py-3 text-sm flex items-center justify-between',
                inputStyleClass
              )}
              style={{ 
                backgroundColor: flowInputBg, 
                borderColor: flowInputBorder, 
                borderWidth: '1px', 
                borderStyle: 'solid',
                color: flowTextColor 
              }}
            >
              <span className="opacity-60">
                {s.options?.[0] || 'Select an option...'}
              </span>
              <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        {/* Scale (1-10 or 1-5) */}
        {s.questionType === 'scale' && (
          <div 
            className={cn(
              'mt-6 max-w-md w-full cursor-pointer rounded transition-all',
              !isPreviewMode && 'hover:ring-2 hover:ring-primary/30',
              isElementSelected(step.id, 'input') && 'ring-2 ring-primary'
            )}
            onClick={(e) => handleElementSelect(e, step.id, 'input')}
          >
            <div className="flex gap-2 justify-center">
              {Array.from({ length: s.scaleMax || 10 }, (_, i) => i + 1).map((num) => (
                <div
                  key={num}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center text-sm font-medium pointer-events-none',
                    inputStyleClass
                  )}
                  style={{ 
                    backgroundColor: flowInputBg, 
                    borderColor: flowInputBorder, 
                    borderWidth: '1px', 
                    borderStyle: 'solid',
                    color: flowTextColor 
                  }}
                >
                  {num}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs mt-2 opacity-60" style={{ color: flowTextColor }}>
              <span>{s.scaleMinLabel || 'Not at all'}</span>
              <span>{s.scaleMaxLabel || 'Extremely'}</span>
            </div>
          </div>
        )}

        {/* Yes/No */}
        {s.questionType === 'yes-no' && (
          <div className="mt-6 space-y-2 max-w-md w-full">
            {['Yes', 'No'].map((option, i) => (
              <div 
                key={option} 
                className={cn(
                  'px-4 py-3 text-left text-sm cursor-pointer transition-all',
                  inputStyleClass,
                  !isPreviewMode && 'hover:ring-2 hover:ring-primary/30',
                  isElementSelected(step.id, 'option', i) && 'ring-2 ring-primary'
                )}
                style={{ 
                  backgroundColor: flowInputBg, 
                  borderColor: flowInputBorder, 
                  borderWidth: '1px', 
                  borderStyle: 'solid',
                  color: flowTextColor 
                }}
                onClick={(e) => handleElementSelect(e, step.id, 'option', i)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
        
        {/* Button - selectable */}
        {/* Button - UNIFIED FlowButton component */}
        <div
          className={cn(
            'mt-6 inline-flex cursor-pointer rounded transition-all',
            !isPreviewMode && 'hover:ring-2 hover:ring-primary/30',
            isElementSelected(step.id, 'button') && 'ring-2 ring-primary'
          )}
          onClick={(e) => {
            if (!isPreviewMode) {
              e.stopPropagation();
              handleElementSelect(e, step.id, 'button');
            }
          }}
          onPointerDown={(e) => {
            if (!isPreviewMode) e.stopPropagation();
          }}
        >
          <FlowButton
            variant={presetToVariant(s.buttonPreset)}
            onClick={(e) => {
              if (isPreviewMode) handleButtonClick(e, s);
            }}
            isDisabled={isButtonDisabled(s)}
            className={cn(
              'builder-element-selectable',
              !isPreviewMode && 'pointer-events-none'
            )}
          >
            {s.buttonText || 'Continue'}
          </FlowButton>
        </div>
        {/* Blocked reason display */}
        {isButtonDisabled(s) && getBlockedReasonDisplay() && (
          <p className="text-xs mt-2 text-destructive/80 text-center" role="alert" aria-live="polite">
            {getBlockedReasonDisplay()}
          </p>
        )}
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

    // Build field list for input selection indexing
    const fields: Array<{type: 'name' | 'email' | 'phone', placeholder: string}> = [];
    if (showName) fields.push({ type: 'name', placeholder: 'Your name' });
    if (showEmail) fields.push({ type: 'email', placeholder: 'Your email' });
    if (showPhone) fields.push({ type: 'phone', placeholder: 'Your phone' });

    return (
      <div className={cn('flex flex-col w-full px-6 py-8', alignClass, spacingClass)}>
        {/* Title - selectable */}
        <div 
          className={cn(
            'cursor-pointer rounded transition-all',
            !isPreviewMode && 'hover:ring-2 hover:ring-primary/30',
            isElementSelected(step.id, 'title') && 'ring-2 ring-primary'
          )}
          onClick={(e) => handleElementSelect(e, step.id, 'title')}
        >
          <InlineTextEditor
            value={s.title || 'Where should we send your results?'}
            onChange={(content) => updateStepSetting(step.id, 'title', content)}
            placeholder="Where should we send your results?"
            className={cn(getTitleSizeClass(s.titleSize), 'font-bold inline-block')}
            style={{ color: flowTextColor }}
            elementType="heading"
            elementId={`step-${step.id}-title`}
          />
        </div>
        {s.description && (
          <div 
            className={cn(
              'mt-2 cursor-pointer rounded transition-all',
              !isPreviewMode && 'hover:ring-2 hover:ring-primary/30',
              isElementSelected(step.id, 'description') && 'ring-2 ring-primary'
            )}
            onClick={(e) => handleElementSelect(e, step.id, 'description')}
          >
            <p className="text-sm opacity-70" style={{ color: flowTextColor }}>{s.description}</p>
          </div>
        )}
        <div className="mt-6 space-y-3 max-w-md w-full">
          {fields.map((field, index) => (
            <div
              key={field.type}
              className={cn(
                'cursor-pointer rounded transition-all',
                !isPreviewMode && 'hover:ring-2 hover:ring-primary/30',
                isElementSelected(step.id, 'input', index) && 'ring-2 ring-primary'
              )}
              onClick={(e) => handleElementSelect(e, step.id, 'input', index)}
            >
              <input 
                className={cn(
                  'w-full px-4 py-3 text-sm pointer-events-none',
                  inputStyleClass
                )}
                style={{ 
                  backgroundColor: flowInputBg, 
                  borderColor: flowInputBorder, 
                  borderWidth: '1px', 
                  borderStyle: 'solid',
                  color: flowTextColor 
                }}
                placeholder={field.placeholder} 
                disabled
              />
            </div>
          ))}
        </div>
        {/* Button - UNIFIED FlowButton component */}
        <div
          className={cn(
            'mt-6 inline-flex cursor-pointer rounded transition-all',
            !isPreviewMode && 'hover:ring-2 hover:ring-primary/30',
            isElementSelected(step.id, 'button') && 'ring-2 ring-primary'
          )}
          onClick={(e) => {
            if (!isPreviewMode) {
              e.stopPropagation();
              handleElementSelect(e, step.id, 'button');
            }
          }}
          onPointerDown={(e) => {
            if (!isPreviewMode) e.stopPropagation();
          }}
        >
          <FlowButton
            variant={presetToVariant(s.buttonPreset)}
            onClick={(e) => {
              if (isPreviewMode) handleButtonClick(e, s);
            }}
            isDisabled={isButtonDisabled(s)}
            className={cn(
              'builder-element-selectable',
              !isPreviewMode && 'pointer-events-none'
            )}
          >
            {s.buttonText || 'Submit'}
          </FlowButton>
        </div>
        {/* Blocked reason display */}
        {isButtonDisabled(s) && getBlockedReasonDisplay() && (
          <p className="text-xs mt-2 text-destructive/80 text-center" role="alert" aria-live="polite">
            {getBlockedReasonDisplay()}
          </p>
        )}
      </div>
    );
  };

  // Ending step - thank you message
  const renderEndingStep = (step: ApplicationFlowStep) => {
    const s = (step as any).settings || {};
    const alignClass = getAlignClass(s.align);
    const spacingClass = getSpacingClass(s.spacing);

    return (
      <div className={cn('flex flex-col w-full px-6 py-8', alignClass, spacingClass)}>
        <InlineTextEditor
          value={s.title || 'Thanks — we\'ll be in touch!'}
          onChange={(content) => updateStepSetting(step.id, 'title', content)}
          placeholder="Thanks for applying!"
          className={cn(getTitleSizeClass(s.titleSize), 'font-bold inline-block')}
          style={{ color: flowTextColor }}
          elementType="heading"
          elementId={`step-${step.id}-title`}
        />
        {s.description && (
          <p className="text-sm mt-2 opacity-70" style={{ color: flowTextColor }}>{s.description}</p>
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

  // Get block-level styling
  const blockStyle = block.styles || {};
  const blockBorderRadius = blockStyle.borderRadius;
  const blockBorder = blockStyle.border;
  const blockShadow = blockStyle.boxShadow;

  // Handle step click - select that specific step for editing
  const handleStepClick = (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation();
    if (onSelectStep) {
      onSelectStep(stepId);
    } else {
      // Fallback to selecting the entire block if no step handler
      onSelect();
    }
  };

  return (
    <div
      className={cn(
        'w-full rounded-lg transition-all duration-200 overflow-hidden',
        isSelected 
          ? 'ring-2 ring-primary ring-offset-2' 
          : 'hover:ring-1 hover:ring-primary/30'
      )}
      style={{
        background: backgroundToCSS(flowBackground),
        borderRadius: blockBorderRadius || undefined,
        border: blockBorder || undefined,
        boxShadow: blockShadow || undefined,
      }}
      onClick={onSelect}
    >
      {/* Clickable step wrapper for direct step selection */}
      <div
        className={cn(
          'cursor-pointer transition-all',
          activeStep && selectedStepId === activeStep.id && 'ring-1 ring-inset ring-primary/50'
        )}
        onClick={(e) => activeStep && handleStepClick(e, activeStep.id)}
      >
        {renderStepContent()}
      </div>
      
      {/* Step navigation bar - shows ONLY visible steps for quick switching */}
      {(() => {
        const visibleNavSteps = getVisibleStepsForNav();
        if (visibleNavSteps.length <= 1) return null;
        
        return (
          <div 
            className="flex items-center justify-center gap-1 px-4 py-2 flex-wrap"
            style={{ 
              borderTop: `1px solid ${flowInputBorder}`,
            }}
          >
            {visibleNavSteps.map((step, index) => {
              const isDisabled = isStepNavDisabled(step.id);
              const isCurrent = selectedStepId === step.id;
              
              return (
                <button
                  key={step.id}
                  onClick={(e) => {
                    if (!isDisabled) {
                      handleStepClick(e, step.id);
                    }
                  }}
                  disabled={isDisabled}
                  aria-disabled={isDisabled}
                  aria-current={isCurrent ? 'step' : undefined}
                  title={step.name}
                  className={cn(
                    'w-6 h-6 rounded-full text-[10px] font-medium transition-all',
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : isDisabled
                        ? 'bg-muted/50 cursor-not-allowed opacity-50'
                        : 'bg-muted hover:bg-muted-foreground/20 cursor-pointer'
                  )}
                  style={{ color: isCurrent ? undefined : flowTextColor }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};
