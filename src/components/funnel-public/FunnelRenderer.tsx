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
  // Pixel Tracking
  meta_pixel_id?: string;
  google_analytics_id?: string;
  google_ads_id?: string;
  tiktok_pixel_id?: string;
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
  const pixelsInitializedRef = useRef(false);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isThankYouStep = currentStep?.step_type === 'thank_you';

  // Initialize pixel tracking scripts
  useEffect(() => {
    if (pixelsInitializedRef.current) return;
    pixelsInitializedRef.current = true;

    const { meta_pixel_id, google_analytics_id, tiktok_pixel_id } = funnel.settings;

    // Meta Pixel
    if (meta_pixel_id && !(window as any).fbq) {
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${meta_pixel_id}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);
    }

    // Google Analytics
    if (google_analytics_id && !(window as any).gtag) {
      const gtagScript = document.createElement('script');
      gtagScript.async = true;
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${google_analytics_id}`;
      document.head.appendChild(gtagScript);

      const configScript = document.createElement('script');
      configScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${google_analytics_id}');
      `;
      document.head.appendChild(configScript);
    }

    // TikTok Pixel
    if (tiktok_pixel_id && !(window as any).ttq) {
      const ttScript = document.createElement('script');
      ttScript.innerHTML = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${tiktok_pixel_id}');
          ttq.page();
        }(window, document, 'ttq');
      `;
      document.head.appendChild(ttScript);
    }
  }, [funnel.settings]);

  // Fire pixel events helper
  const firePixelEvent = useCallback((eventType: 'Lead' | 'CompleteRegistration' | 'Schedule', data?: Record<string, any>) => {
    const { meta_pixel_id, google_analytics_id, tiktok_pixel_id } = funnel.settings;

    // Meta Pixel
    if (meta_pixel_id && (window as any).fbq) {
      (window as any).fbq('track', eventType, data);
      console.log(`Meta Pixel: ${eventType}`, data);
    }

    // Google Analytics
    if (google_analytics_id && (window as any).gtag) {
      const gaEvent = eventType === 'Lead' ? 'generate_lead' 
        : eventType === 'CompleteRegistration' ? 'conversion' 
        : 'schedule';
      (window as any).gtag('event', gaEvent, data);
      console.log(`GA4: ${gaEvent}`, data);
    }

    // TikTok Pixel
    if (tiktok_pixel_id && (window as any).ttq) {
      const ttEvent = eventType === 'Lead' ? 'SubmitForm' 
        : eventType === 'CompleteRegistration' ? 'CompleteRegistration' 
        : 'Schedule';
      (window as any).ttq.track(ttEvent, data);
      console.log(`TikTok Pixel: ${ttEvent}`, data);
    }
  }, [funnel.settings]);

  // Store Calendly booking data when detected
  const handleCalendlyBooking = useCallback((bookingData?: CalendlyBookingData) => {
    if (bookingData) {
      calendlyBookingRef.current = bookingData;
      console.log('Stored Calendly booking data:', bookingData);
      
      // Fire Schedule pixel event for Calendly booking
      firePixelEvent('Schedule', {
        event_start_time: bookingData.event_start_time,
        invitee_email: bookingData.invitee_email,
      });
    }
  }, [firePixelEvent]);

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
        
        // Fire Lead pixel event when contact info is captured
        if (['opt_in', 'email_capture', 'phone_capture'].includes(currentStep.step_type)) {
          const eventData = typeof value === 'object' ? value : { value };
          firePixelEvent('Lead', eventData);
        }
      }
    }

    // If this is the step before thank you, do final complete save
    const nextStep = steps[currentStepIndex + 1];
    if (nextStep?.step_type === 'thank_you') {
      setIsSubmitting(true);
      await saveLead(updatedAnswers, true);
      setIsSubmitting(false);
      
      // Fire CompleteRegistration pixel event
      firePixelEvent('CompleteRegistration', { funnel_id: funnel.id, funnel_name: funnel.name });
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