import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WelcomeStep } from './WelcomeStep';
import { TextQuestionStep } from './TextQuestionStep';
import { MultiChoiceStep } from './MultiChoiceStep';
import { EmailCaptureStep } from './EmailCaptureStep';
import { PhoneCaptureStep } from './PhoneCaptureStep';
import { VideoStep } from './VideoStep';
import { ThankYouStep } from './ThankYouStep';
import { OptInStep } from './OptInStep';
import { EmbedStep } from './EmbedStep';
import { ProgressDots } from './ProgressDots';
import { cn } from '@/lib/utils';
import type { CalendlyBookingData } from './DynamicElementRenderer';

interface FunnelStep {
  id: string;
  order_index: number;
  step_type: string;
  content: Record<string, any>;
}

interface FunnelSettings {
  logo_url?: string;
  primary_color: string;
  background_color: string;
  button_text: string;
  ghl_webhook_url?: string;
}

interface Funnel {
  id: string;
  team_id: string;
  name: string;
  slug: string;
  settings: FunnelSettings;
}

interface FunnelRendererProps {
  funnel: Funnel;
  steps: FunnelStep[];
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export function FunnelRenderer({ funnel, steps, utmSource, utmMedium, utmCampaign }: FunnelRendererProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const calendlyBookingRef = useRef<CalendlyBookingData | null>(null);
  const pendingSaveRef = useRef(false);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isThankYouStep = currentStep?.step_type === 'thank_you';

  // Store Calendly booking data when detected
  const handleCalendlyBooking = useCallback((bookingData?: CalendlyBookingData) => {
    if (bookingData) {
      calendlyBookingRef.current = bookingData;
      console.log('Stored Calendly booking data:', bookingData);
    }
  }, []);

  // Progressive lead save - creates or updates lead
  const saveLead = useCallback(async (allAnswers: Record<string, any>, isComplete: boolean = false) => {
    if (pendingSaveRef.current) return;
    pendingSaveRef.current = true;

    try {
      const { data, error } = await supabase.functions.invoke('submit-funnel-lead', {
        body: {
          funnel_id: funnel.id,
          lead_id: leadId, // Pass existing lead ID for updates
          answers: allAnswers,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          calendly_booking: calendlyBookingRef.current,
          is_complete: isComplete,
        },
      });

      if (error) {
        console.error('Failed to save lead:', error);
      } else if (data?.lead_id) {
        setLeadId(data.lead_id);
        console.log('Lead saved:', data.lead_id, isComplete ? '(complete)' : '(partial)');
      }
    } catch (err) {
      console.error('Error saving lead:', err);
    } finally {
      pendingSaveRef.current = false;
    }
  }, [funnel.id, leadId, utmSource, utmMedium, utmCampaign]);

  // Check if answer contains meaningful data worth saving
  const hasMeaningfulData = useCallback((value: any, stepType: string): boolean => {
    if (!value) return false;
    
    // Always save opt-in, email, phone captures immediately
    if (['opt_in', 'email_capture', 'phone_capture'].includes(stepType)) {
      return true;
    }
    
    // For opt_in step, check if it has name, email, or phone
    if (stepType === 'opt_in' && typeof value === 'object') {
      return !!(value.email || value.phone || value.name);
    }
    
    // For text questions, save if it looks like a name or has content
    if (stepType === 'text_question' && typeof value === 'string') {
      return value.trim().length > 0;
    }
    
    // For multi-choice, always save selections
    if (stepType === 'multi_choice') {
      return true;
    }
    
    return false;
  }, []);

  const handleNext = useCallback(async (value?: any) => {
    let updatedAnswers = { ...answers };
    
    // Save answer if value provided
    if (value !== undefined && currentStep) {
      updatedAnswers = {
        ...answers,
        [currentStep.id]: {
          value,
          step_type: currentStep.step_type,
          content: currentStep.content,
        },
      };
      setAnswers(updatedAnswers);
      
      // Progressive save on meaningful data
      if (hasMeaningfulData(value, currentStep.step_type)) {
        // Don't wait for save to complete before moving to next step
        saveLead(updatedAnswers, false);
      }
    }

    // If this is the step before thank you, do final complete save
    const nextStep = steps[currentStepIndex + 1];
    if (nextStep?.step_type === 'thank_you') {
      setIsSubmitting(true);
      await saveLead(updatedAnswers, true);
      setIsSubmitting(false);
    }

    // Move to next step
    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsComplete(true);
    }
  }, [currentStep, currentStepIndex, steps, answers, isLastStep, saveLead, hasMeaningfulData]);

  // Calculate question number for multi_choice steps (excluding welcome, thank_you, video)
  const questionSteps = steps.filter(s => 
    ['text_question', 'multi_choice', 'email_capture', 'phone_capture', 'opt_in'].includes(s.step_type)
  );

  const renderStep = (step: FunnelStep, isActive: boolean, stepIndex: number) => {
    // Calculate current question number for this step
    const questionIndex = questionSteps.findIndex(q => q.id === step.id);
    const currentQuestionNumber = questionIndex >= 0 ? questionIndex + 1 : undefined;
    const totalQuestions = questionSteps.length;

    const commonProps = {
      content: step.content,
      settings: funnel.settings,
      onNext: handleNext,
      isActive,
      currentStep: currentQuestionNumber,
      totalSteps: totalQuestions,
      onCalendlyBooking: handleCalendlyBooking,
    };

    switch (step.step_type) {
      case 'welcome':
        return <WelcomeStep {...commonProps} />;
      case 'text_question':
        return <TextQuestionStep {...commonProps} />;
      case 'multi_choice':
        return <MultiChoiceStep {...commonProps} />;
      case 'email_capture':
        return <EmailCaptureStep {...commonProps} />;
      case 'phone_capture':
        return <PhoneCaptureStep {...commonProps} />;
      case 'opt_in':
        return <OptInStep {...commonProps} />;
      case 'video':
        return <VideoStep {...commonProps} />;
      case 'embed':
        return <EmbedStep {...commonProps} />;
      case 'thank_you':
        return <ThankYouStep {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen w-full relative overflow-x-hidden overflow-y-auto"
      style={{ backgroundColor: funnel.settings.background_color }}
    >
      {/* Logo */}
      {funnel.settings.logo_url && (
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
          <img
            src={funnel.settings.logo_url}
            alt="Logo"
            className="h-6 md:h-8 w-auto object-contain"
          />
        </div>
      )}

      {/* Progress Dots */}
      {!isThankYouStep && (
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
          <ProgressDots
            total={steps.length}
            current={currentStepIndex}
            primaryColor={funnel.settings.primary_color}
          />
        </div>
      )}

      {/* Steps Container - scrollable on each step */}
      <div className="min-h-screen w-full pt-16 md:pt-20 pb-8">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'min-h-[calc(100vh-5rem)] w-full flex flex-col items-center justify-start py-4 md:py-8 px-4 md:px-6 transition-all duration-500 ease-out',
              index === currentStepIndex
                ? 'block opacity-100'
                : 'hidden opacity-0'
            )}
          >
            <div className="w-full max-w-2xl mx-auto">
              {renderStep(step, index === currentStepIndex, index)}
            </div>
          </div>
        ))}
      </div>

      {/* Loading overlay during submission */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}