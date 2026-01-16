/**
 * ApplicationFlowCard - Visual renderer for flow steps
 * 
 * ARCHITECTURE: This component ONLY handles rendering.
 * It uses SHARED components (FlowButton, InlineTextEditor) - no flow-specific UI.
 * 
 * FlowContainer (context) owns all behavioral decisions.
 * This component reads state from FlowContainer and renders accordingly.
 * 
 * EDITOR MODE: All elements are editable, flow restrictions are visual only
 * RUNTIME MODE: Flow rules enforced, real progression enabled
 */

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
  
  // ═══════════════════════════════════════════════════════════════
  // CONTAINER STYLING - All settings from inspector must render here
  // ═══════════════════════════════════════════════════════════════
  
  // Background (solid, gradient, or image)
  const flowBackground = settings.background;
  const flowTextColor = settings.textColor || '#000000';
  const flowInputBg = settings.inputBackground || '#ffffff';
  const flowInputBorder = settings.inputBorderColor || '#e5e7eb';
  
  // Container dimensions & styling
  const containerPadding = settings.containerPadding ?? 32;
  const containerRadius = settings.containerRadius ?? 12;
  const containerBorderColor = settings.containerBorderColor;
  const containerShadow = settings.containerShadow || 'none';
  const contentWidth = settings.contentWidth || 'md';
  const contentAlign = settings.contentAlign || 'center';
  
  // Flow behavior settings
  const displayMode = settings.displayMode || 'one-at-a-time';
  const showProgress = settings.showProgress ?? false;
  
  // Map shadow setting to CSS
  const shadowMap: Record<string, string> = {
    'none': 'none',
    'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  };
  
  // Map width setting to CSS
  const widthMap: Record<string, string> = {
    'sm': '400px',
    'md': '600px', 
    'lg': '800px',
    'full': '100%',
  };
  
  // Determine active step (default to first step / welcome)
  const activeStep = selectedStepId 
    ? steps.find(s => s.id === selectedStepId) 
    : steps[0];
  
  const stepSettings = (activeStep as any)?.settings || {};
  
  // Calculate progress
  const currentStepIndex = activeStep ? steps.findIndex(s => s.id === activeStep.id) : 0;
  const progressPercent = steps.length > 1 ? ((currentStepIndex) / (steps.length - 1)) * 100 : 0;

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

  /**
   * EDITING BEHAVIOR (Layout Preset Pattern):
   * - Elements inside steps are DIRECTLY editable (like regular canvas content)
   * - Clicking text → edits text (not selects step)
   * - Clicking button → selects button (not selects step)
   * - Step selection ONLY happens via step navigation dots or explicit step wrapper click
   * 
   * Steps provide STRUCTURE (spacing, alignment, order) but NEVER limit styling.
   */

  // Helper to select an element within a step - allows direct editing
  const handleElementClick = (e: React.MouseEvent, stepId: string, elementType: StepElementType, optionIndex?: number) => {
    if (readOnly || isPreviewMode) return;
    
    // Stop propagation to prevent step selection - element takes priority
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
      <div className={cn('flex flex-col w-full', alignClass, spacingClass)}>
        <div 
          className={cn(
            'cursor-pointer transition-colors duration-150',
            !isPreviewMode && 'hover:bg-foreground/[0.03] rounded px-1 -mx-1',
            isElementSelected(stepId, 'title') && 'bg-foreground/[0.06] rounded px-1 -mx-1'
          )}
          onClick={(e) => handleElementClick(e, stepId, 'title')}
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
            'mt-2 cursor-pointer transition-colors duration-150',
            !isPreviewMode && 'hover:bg-foreground/[0.03] rounded px-1 -mx-1',
            isElementSelected(stepId, 'description') && 'bg-foreground/[0.06] rounded px-1 -mx-1'
          )}
          onClick={(e) => handleElementClick(e, stepId, 'description')}
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
            'mt-4 inline-flex cursor-pointer transition-colors duration-150',
            !isPreviewMode && 'hover:bg-foreground/[0.03] rounded p-0.5 -m-0.5',
            isElementSelected(stepId, 'button') && 'bg-foreground/[0.06] rounded p-0.5 -m-0.5'
          )}
          onClick={(e) => {
            if (!isPreviewMode) {
              handleElementClick(e, stepId, 'button');
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
          <p className="text-xs mt-2 text-destructive/70" role="alert" aria-live="polite">
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
      <div className={cn('flex flex-col w-full', alignClass, spacingClass)}>
        {/* Title - selectable */}
        <div 
          className={cn(
            'cursor-pointer transition-colors duration-150',
            !isPreviewMode && 'hover:bg-foreground/[0.03] rounded px-1 -mx-1',
            isElementSelected(step.id, 'title') && 'bg-foreground/[0.06] rounded px-1 -mx-1'
          )}
          onClick={(e) => handleElementClick(e, step.id, 'title')}
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
              'mt-2 cursor-pointer transition-colors duration-150',
              !isPreviewMode && 'hover:bg-foreground/[0.03] rounded px-1 -mx-1',
              isElementSelected(step.id, 'description') && 'bg-foreground/[0.06] rounded px-1 -mx-1'
            )}
            onClick={(e) => handleElementClick(e, step.id, 'description')}
          >
            <p className="text-sm opacity-70" style={{ color: flowTextColor }}>{s.description}</p>
          </div>
        )}
        
        {/* Multiple Choice Options - each option selectable */}
        {s.questionType === 'multiple-choice' && s.options && (
          <div className="mt-4 space-y-1.5 max-w-md w-full">
            {(s.options as string[]).map((option: string, i: number) => (
              <div 
                key={i} 
                className={cn(
                  'px-3.5 py-2.5 text-left text-sm cursor-pointer transition-colors duration-150',
                  inputStyleClass,
                  !isPreviewMode && 'hover:bg-foreground/[0.03]',
                  isElementSelected(step.id, 'option', i) && 'bg-foreground/[0.06]'
                )}
                style={{ 
                  backgroundColor: flowInputBg, 
                  borderColor: flowInputBorder,
                  color: flowTextColor 
                }}
                onClick={(e) => handleElementClick(e, step.id, 'option', i)}
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
              'mt-4 max-w-md w-full cursor-pointer transition-colors duration-150',
              !isPreviewMode && 'hover:bg-foreground/[0.03] rounded p-0.5 -m-0.5',
              isElementSelected(step.id, 'input') && 'bg-foreground/[0.06] rounded p-0.5 -m-0.5'
            )}
            onClick={(e) => handleElementClick(e, step.id, 'input')}
          >
            <textarea 
              className={cn(
                'w-full px-3.5 py-2.5 text-sm resize-none pointer-events-none',
                inputStyleClass
              )}
              style={{ 
                backgroundColor: flowInputBg, 
                borderColor: flowInputBorder,
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
              'mt-4 max-w-md w-full cursor-pointer transition-colors duration-150',
              !isPreviewMode && 'hover:bg-foreground/[0.03] rounded p-0.5 -m-0.5',
              isElementSelected(step.id, 'input') && 'bg-foreground/[0.06] rounded p-0.5 -m-0.5'
            )}
            onClick={(e) => handleElementClick(e, step.id, 'input')}
          >
            <div 
              className={cn(
                'w-full px-3.5 py-2.5 text-sm flex items-center justify-between',
                inputStyleClass
              )}
              style={{ 
                backgroundColor: flowInputBg, 
                borderColor: flowInputBorder,
                color: flowTextColor 
              }}
            >
              <span className="opacity-60">
                {s.options?.[0] || 'Select an option...'}
              </span>
              <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        {/* Scale (1-10 or 1-5) */}
        {s.questionType === 'scale' && (
          <div 
            className={cn(
              'mt-4 max-w-md w-full cursor-pointer transition-colors duration-150',
              !isPreviewMode && 'hover:bg-foreground/[0.03] rounded p-0.5 -m-0.5',
              isElementSelected(step.id, 'input') && 'bg-foreground/[0.06] rounded p-0.5 -m-0.5'
            )}
            onClick={(e) => handleElementClick(e, step.id, 'input')}
          >
            <div className="flex gap-1.5 justify-center">
              {Array.from({ length: s.scaleMax || 10 }, (_, i) => i + 1).map((num) => (
                <div
                  key={num}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center text-sm font-medium pointer-events-none',
                    inputStyleClass
                  )}
                  style={{ 
                    backgroundColor: flowInputBg, 
                    borderColor: flowInputBorder,
                    color: flowTextColor 
                  }}
                >
                  {num}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs mt-1.5 opacity-50" style={{ color: flowTextColor }}>
              <span>{s.scaleMinLabel || 'Not at all'}</span>
              <span>{s.scaleMaxLabel || 'Extremely'}</span>
            </div>
          </div>
        )}

        {/* Yes/No */}
        {s.questionType === 'yes-no' && (
          <div className="mt-4 space-y-1.5 max-w-md w-full">
            {['Yes', 'No'].map((option, i) => (
              <div 
                key={option} 
                className={cn(
                  'px-3.5 py-2.5 text-left text-sm cursor-pointer transition-colors duration-150',
                  inputStyleClass,
                  !isPreviewMode && 'hover:bg-foreground/[0.03]',
                  isElementSelected(step.id, 'option', i) && 'bg-foreground/[0.06]'
                )}
                style={{ 
                  backgroundColor: flowInputBg, 
                  borderColor: flowInputBorder,
                  color: flowTextColor 
                }}
                onClick={(e) => handleElementClick(e, step.id, 'option', i)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
        
        {/* Button - UNIFIED FlowButton component */}
        <div
          className={cn(
            'mt-4 inline-flex cursor-pointer transition-colors duration-150',
            !isPreviewMode && 'hover:bg-foreground/[0.03] rounded p-0.5 -m-0.5',
            isElementSelected(step.id, 'button') && 'bg-foreground/[0.06] rounded p-0.5 -m-0.5'
          )}
          onClick={(e) => {
            if (!isPreviewMode) {
              handleElementClick(e, step.id, 'button');
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
          <p className="text-xs mt-2 text-destructive/70 text-center" role="alert" aria-live="polite">
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
      <div className={cn('flex flex-col w-full', alignClass, spacingClass)}>
        {/* Title - selectable */}
        <div 
          className={cn(
            'cursor-pointer transition-colors duration-150',
            !isPreviewMode && 'hover:bg-foreground/[0.03] rounded px-1 -mx-1',
            isElementSelected(step.id, 'title') && 'bg-foreground/[0.06] rounded px-1 -mx-1'
          )}
          onClick={(e) => handleElementClick(e, step.id, 'title')}
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
              'mt-2 cursor-pointer transition-colors duration-150',
              !isPreviewMode && 'hover:bg-foreground/[0.03] rounded px-1 -mx-1',
              isElementSelected(step.id, 'description') && 'bg-foreground/[0.06] rounded px-1 -mx-1'
            )}
            onClick={(e) => handleElementClick(e, step.id, 'description')}
          >
            <p className="text-sm opacity-70" style={{ color: flowTextColor }}>{s.description}</p>
          </div>
        )}
        <div className="mt-4 space-y-2 max-w-md w-full">
          {fields.map((field, index) => (
            <div
              key={field.type}
              className={cn(
                'cursor-pointer transition-colors duration-150',
                !isPreviewMode && 'hover:bg-foreground/[0.03] rounded p-0.5 -m-0.5',
                isElementSelected(step.id, 'input', index) && 'bg-foreground/[0.06] rounded p-0.5 -m-0.5'
              )}
              onClick={(e) => handleElementClick(e, step.id, 'input', index)}
            >
              <input 
                className={cn(
                  'w-full px-3.5 py-2.5 text-sm pointer-events-none',
                  inputStyleClass
                )}
                style={{ 
                  backgroundColor: flowInputBg, 
                  borderColor: flowInputBorder,
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
            'mt-4 inline-flex cursor-pointer transition-colors duration-150',
            !isPreviewMode && 'hover:bg-foreground/[0.03] rounded p-0.5 -m-0.5',
            isElementSelected(step.id, 'button') && 'bg-foreground/[0.06] rounded p-0.5 -m-0.5'
          )}
          onClick={(e) => {
            if (!isPreviewMode) {
              handleElementClick(e, step.id, 'button');
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
          <p className="text-xs mt-2 text-destructive/70 text-center" role="alert" aria-live="polite">
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
      <div className={cn('flex flex-col w-full', alignClass, spacingClass)}>
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
          <p className="text-sm mt-2 opacity-60" style={{ color: flowTextColor }}>{s.description}</p>
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

  /**
   * Step navigation click - ONLY used by nav dots
   * Content elements handle their own selection via handleElementClick
   */
  const handleStepNavClick = (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation();
    if (onSelectStep) {
      onSelectStep(stepId);
    }
  };

  /**
   * Block-level click - selects the flow block itself
   * Elements inside stop propagation to handle their own selection
   */
  const handleBlockClick = (e: React.MouseEvent) => {
    onSelect();
  };

  // Build container border style
  const containerBorderStyle = containerBorderColor && containerBorderColor !== 'transparent'
    ? `1px solid ${containerBorderColor}`
    : undefined;

  return (
    <div
      className={cn(
        'w-full transition-all duration-200 overflow-hidden',
        // Selection indicator
        isSelected && 'ring-1 ring-primary/30',
        // Content alignment
        contentAlign === 'left' && 'flex justify-start',
        contentAlign === 'center' && 'flex justify-center',
        contentAlign === 'right' && 'flex justify-end'
      )}
      onClick={handleBlockClick}
    >
      {/* Inner container with all styling applied */}
      <div
        style={{
          background: backgroundToCSS(flowBackground),
          borderRadius: `${containerRadius}px`,
          border: containerBorderStyle,
          boxShadow: shadowMap[containerShadow],
          padding: `${containerPadding}px`,
          maxWidth: widthMap[contentWidth],
          width: '100%',
        }}
      >
        {/* Progress bar - shown when enabled */}
        {showProgress && steps.length > 1 && (
          <div className="mb-4">
            <div 
              className="h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: `${flowTextColor}15` }}
            >
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${progressPercent}%`,
                  backgroundColor: flowTextColor,
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] opacity-50" style={{ color: flowTextColor }}>
                Step {currentStepIndex + 1} of {steps.length}
              </span>
            </div>
          </div>
        )}

        {/* Step content - display mode determines rendering */}
        {displayMode === 'all-visible' ? (
          // All steps visible mode - render all steps stacked
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={cn(
                  'transition-all duration-200',
                  selectedStepId === step.id && !isPreviewMode && 'ring-1 ring-primary/20 rounded-lg -m-2 p-2'
                )}
                onClick={(e) => {
                  if (!isPreviewMode) {
                    e.stopPropagation();
                    handleStepNavClick(e, step.id);
                  }
                }}
              >
                {step.type === 'welcome' && renderWelcomeStep()}
                {step.type === 'question' && renderQuestionStep(step)}
                {step.type === 'capture' && renderCaptureStep(step)}
                {step.type === 'ending' && renderEndingStep(step)}
              </div>
            ))}
          </div>
        ) : (
          // One at a time mode - render only active step
          renderStepContent()
        )}
        
        {/* Step navigation - shown only in one-at-a-time mode */}
        {displayMode === 'one-at-a-time' && (() => {
          const visibleNavSteps = getVisibleStepsForNav();
          if (visibleNavSteps.length <= 1) return null;
          
          return (
            <div 
              className="flex items-center justify-center gap-1.5 mt-4 pt-3"
              style={{ borderTop: `1px solid ${flowInputBorder}` }}
            >
              {visibleNavSteps.map((step) => {
                const isDisabled = isStepNavDisabled(step.id);
                const isCurrent = selectedStepId === step.id;
                
                return (
                  <button
                    key={step.id}
                    onClick={(e) => {
                      if (!isDisabled) {
                        handleStepNavClick(e, step.id);
                      }
                    }}
                    disabled={isDisabled}
                    aria-disabled={isDisabled}
                    aria-current={isCurrent ? 'step' : undefined}
                    title={step.name}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-all duration-150',
                      isCurrent
                        ? 'w-3'
                        : isDisabled
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:opacity-70 cursor-pointer'
                    )}
                    style={{
                      backgroundColor: isCurrent ? flowTextColor : `${flowTextColor}40`,
                    }}
                  />
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
