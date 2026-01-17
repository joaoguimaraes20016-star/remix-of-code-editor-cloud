/**
 * FlowCanvasRenderer - Public runtime for flow-canvas funnels
 * 
 * This component renders published flow-canvas funnels with:
 * - Typeform-style step transitions (one question at a time)
 * - Form data collection and CRM integration
 * - Button action handling (next-step, submit, redirect)
 * - Pixel event firing
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, Loader2, Play, User } from 'lucide-react';

// Helper to convert gradient object to CSS
function gradientToCSS(gradient: { type?: string; angle?: number; stops?: Array<{ color: string; position: number }> }): string {
  const stops = (gradient.stops || [{ color: '#8B5CF6', position: 0 }, { color: '#EC4899', position: 100 }])
    .map(s => `${s.color} ${s.position}%`).join(', ');
  if (gradient.type === 'radial') {
    return `radial-gradient(circle, ${stops})`;
  }
  return `linear-gradient(${gradient.angle || 135}deg, ${stops})`;
}

// Types
interface FlowCanvasBlock {
  id: string;
  type: string;
  label: string;
  elements: FlowCanvasElement[];
  props: Record<string, unknown>;
  styles?: Record<string, string>;
}

interface FlowCanvasElement {
  id: string;
  type: string;
  content?: string;
  props: Record<string, unknown>;
  styles?: Record<string, string>;
}

interface FlowCanvasStep {
  id: string;
  name: string;
  frames: Array<{
    id: string;
    stacks: Array<{
      id: string;
      blocks: FlowCanvasBlock[];
    }>;
  }>;
  settings?: Record<string, unknown>;
}

interface FlowCanvasPage {
  id: string;
  name: string;
  steps: FlowCanvasStep[];
  settings?: {
    theme?: 'light' | 'dark';
    primary_color?: string;
    page_background?: {
      type: string;
      color?: string;
    };
  };
}

interface FunnelSettings {
  primary_color?: string;
  background_color?: string;
  meta_pixel_id?: string;
  google_analytics_id?: string;
  tiktok_pixel_id?: string;
  popup_optin_enabled?: boolean;
}

interface FlowCanvasRendererProps {
  funnelId: string;
  teamId?: string;
  page: FlowCanvasPage | Record<string, any>;
  settings?: FunnelSettings;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

// Animation variants
const stepVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] as const } },
};

// Element renderers
function renderHeading(element: FlowCanvasElement) {
  const level = (element.props.level as number) || 2;
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const sizeClasses: Record<number, string> = {
    1: 'text-3xl md:text-4xl font-bold',
    2: 'text-2xl md:text-3xl font-semibold',
    3: 'text-xl md:text-2xl font-medium',
    4: 'text-lg font-medium',
  };
  
  return (
    <Tag key={element.id} className={cn('text-foreground', sizeClasses[level] || sizeClasses[2])}>
      {element.content}
    </Tag>
  );
}

function renderText(element: FlowCanvasElement) {
  const variant = element.props.variant as string;
  const baseClasses = 'text-muted-foreground';
  const variantClasses: Record<string, string> = {
    subtext: 'text-sm opacity-80',
    label: 'text-sm font-medium text-foreground',
    caption: 'text-xs italic',
    quote: 'text-lg italic border-l-2 border-primary pl-4',
  };
  
  return (
    <p key={element.id} className={cn(baseClasses, variantClasses[variant] || '')}>
      {element.content}
    </p>
  );
}

interface InputRendererProps {
  element: FlowCanvasElement;
  value: string;
  onChange: (value: string) => void;
}

function InputRenderer({ element, value, onChange }: InputRendererProps) {
  const inputType = (element.props.type as string) || 'text';
  const placeholder = (element.props.placeholder as string) || '';
  const required = element.props.required as boolean;
  const icon = element.props.icon as string;
  
  return (
    <div key={element.id} className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon === 'mail' && <span>📧</span>}
          {icon === 'phone' && <span>📱</span>}
          {icon === 'user' && <span>👤</span>}
        </div>
      )}
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={cn(
          'w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'placeholder:text-muted-foreground transition-all',
          icon && 'pl-10'
        )}
      />
    </div>
  );
}

interface RadioRendererProps {
  element: FlowCanvasElement;
  selectedValue: string;
  onSelect: (value: string) => void;
}

function RadioRenderer({ element, selectedValue, onSelect }: RadioRendererProps) {
  const value = (element.props.value as string) || '';
  const name = (element.props.name as string) || 'radio';
  const isSelected = selectedValue === value;
  
  return (
    <button
      key={element.id}
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        'w-full text-left px-4 py-3 rounded-lg border transition-all',
        isSelected
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-border bg-background text-foreground hover:border-primary/50'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center',
          isSelected ? 'border-primary' : 'border-muted-foreground'
        )}>
          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
        </div>
        <span>{element.content}</span>
      </div>
    </button>
  );
}

interface CheckboxRendererProps {
  element: FlowCanvasElement;
  checked: boolean;
  onToggle: (value: string, checked: boolean) => void;
}

function CheckboxRenderer({ element, checked, onToggle }: CheckboxRendererProps) {
  const value = (element.props.value as string) || '';
  
  return (
    <button
      key={element.id}
      type="button"
      onClick={() => onToggle(value, !checked)}
      className={cn(
        'w-full text-left px-4 py-3 rounded-lg border transition-all',
        checked
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-border bg-background text-foreground hover:border-primary/50'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-5 h-5 rounded-md border-2 flex items-center justify-center',
          checked ? 'border-primary bg-primary' : 'border-muted-foreground'
        )}>
          {checked && <span className="text-white text-xs">✓</span>}
        </div>
        <span>{element.content}</span>
      </div>
    </button>
  );
}

interface ButtonRendererProps {
  element: FlowCanvasElement;
  onClick: () => void;
  isSubmitting: boolean;
}

function ButtonRenderer({ element, onClick, isSubmitting }: ButtonRendererProps) {
  const variant = (element.props.variant as string) || 'primary';
  const size = (element.props.size as string) || 'md';
  
  const sizeClasses: Record<string, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  return (
    <button
      key={element.id}
      type="button"
      onClick={onClick}
      disabled={isSubmitting}
      className={cn(
        'w-full rounded-lg font-semibold transition-all',
        'bg-primary text-primary-foreground hover:opacity-90',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size]
      )}
    >
      {isSubmitting ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Submitting...
        </span>
      ) : (
        element.content
      )}
    </button>
  );
}

// Main component
export function FlowCanvasRenderer({
  funnelId,
  teamId,
  page,
  settings,
  utmSource,
  utmMedium,
  utmCampaign,
}: FlowCanvasRendererProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);

  const steps = page.steps || [];
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const totalSteps = steps.length;

  // Get all blocks from current step
  const currentBlocks = useMemo(() => {
    if (!currentStep) return [];
    return currentStep.frames.flatMap(frame => 
      frame.stacks.flatMap(stack => stack.blocks)
    );
  }, [currentStep]);

  // Handle input changes
  const handleInputChange = useCallback((fieldKey: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }));
  }, []);

  // Handle radio selection
  const handleRadioSelect = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Handle checkbox toggle
  const handleCheckboxToggle = useCallback((name: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentValues = (prev[name] as string[]) || [];
      if (checked) {
        return { ...prev, [name]: [...currentValues, value] };
      } else {
        return { ...prev, [name]: currentValues.filter(v => v !== value) };
      }
    });
  }, []);

  // Submit lead data
  const submitLead = useCallback(async () => {
    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase.functions.invoke('submit-funnel-lead', {
        body: {
          funnel_id: funnelId,
          team_id: teamId,
          answers: formData,
          name: formData.name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        },
      });

      if (error) throw error;
      
      setLeadId(data?.lead_id || null);
      return true;
    } catch (err) {
      console.error('Failed to submit lead:', err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [funnelId, teamId, formData, utmSource, utmMedium, utmCampaign]);

  // Handle button click
  const handleButtonClick = useCallback(async (element: FlowCanvasElement) => {
    // Support both unified buttonAction object (new) and legacy individual props (old)
    const buttonAction = element.props.buttonAction as { type?: string; value?: string; openNewTab?: boolean } | undefined;
    const action = buttonAction?.type || (element.props.action as string) || 'next-step';
    const actionValue = buttonAction?.value;
    const openNewTab = buttonAction?.openNewTab;
    // Legacy fallbacks
    const redirectUrl = actionValue || (element.props.redirectUrl as string);
    const targetStepId = actionValue || (element.props.targetStepId as string);

    switch (action) {
      case 'next-step':
        if (!isLastStep) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          // Last step - submit and show complete
          const success = await submitLead();
          if (success) {
            setIsComplete(true);
          }
        }
        break;
        
      case 'submit':
        const success = await submitLead();
        if (success) {
          if (redirectUrl) {
            window.location.href = redirectUrl;
          } else {
            setIsComplete(true);
          }
        }
        break;
        
      case 'url':
      case 'redirect':
        if (redirectUrl) {
          if (openNewTab) {
            window.open(redirectUrl, '_blank');
          } else {
            window.location.href = redirectUrl;
          }
        }
        break;
        
      case 'go-to-step':
        if (targetStepId) {
          const stepIndex = steps.findIndex(s => s.id === targetStepId);
          if (stepIndex !== -1) {
            setCurrentStepIndex(stepIndex);
          }
        }
        break;

      case 'scroll':
        if (actionValue) {
          document.querySelector(actionValue)?.scrollIntoView({ behavior: 'smooth' });
        }
        break;

      case 'phone':
        if (actionValue) {
          window.location.href = `tel:${actionValue}`;
        }
        break;

      case 'email':
        if (actionValue) {
          window.location.href = `mailto:${actionValue}`;
        }
        break;

      case 'download':
        if (actionValue) {
          window.open(actionValue, '_blank');
        }
        break;
        
      default:
        if (!isLastStep) {
          setCurrentStepIndex(prev => prev + 1);
        }
    }
  }, [isLastStep, steps, submitLead]);

  // Render element
  const renderElement = useCallback((element: FlowCanvasElement, block: FlowCanvasBlock) => {
    switch (element.type) {
      case 'heading':
        return renderHeading(element);
        
      case 'text':
        return renderText(element);
        
      case 'input':
        const fieldKey = (element.props.fieldKey as string) || element.id;
        return (
          <InputRenderer
            key={element.id}
            element={element}
            value={(formData[fieldKey] as string) || ''}
            onChange={(value) => handleInputChange(fieldKey, value)}
          />
        );
        
      case 'radio':
        const radioName = (element.props.name as string) || 'radio';
        return (
          <RadioRenderer
            key={element.id}
            element={element}
            selectedValue={(formData[radioName] as string) || ''}
            onSelect={(value) => handleRadioSelect(radioName, value)}
          />
        );
        
      case 'checkbox':
        const checkboxName = (element.props.name as string) || 'checkbox';
        const checkboxValue = (element.props.value as string) || '';
        const checkedValues = (formData[checkboxName] as string[]) || [];
        return (
          <CheckboxRenderer
            key={element.id}
            element={element}
            checked={checkedValues.includes(checkboxValue)}
            onToggle={(value, checked) => handleCheckboxToggle(checkboxName, value, checked)}
          />
        );
        
      case 'button':
        return (
          <ButtonRenderer
            key={element.id}
            element={element}
            onClick={() => handleButtonClick(element)}
            isSubmitting={isSubmitting}
          />
        );
        
      case 'image':
        const src = element.props.src as string;
        const alt = (element.props.alt as string) || 'Image';
        return src ? (
          <img key={element.id} src={src} alt={alt} className="w-full rounded-lg" />
        ) : null;

      case 'video':
        const videoUrl = ((element.props?.videoSettings as { url?: string })?.url) || (element.props?.src as string);
        if (!videoUrl) return null;
        const embedUrl = videoUrl.includes('youtube') 
          ? videoUrl.replace('watch?v=', 'embed/')
          : videoUrl.includes('vimeo') 
            ? `https://player.vimeo.com/video/${videoUrl.split('/').pop()}`
            : videoUrl;
        return (
          <div key={element.id} className="aspect-video w-full rounded-lg overflow-hidden">
            <iframe src={embedUrl} className="w-full h-full" allow="autoplay; fullscreen" />
          </div>
        );

      case 'divider':
        return <hr key={element.id} className="border-t border-border my-4" style={element.styles} />;

      case 'spacer':
        return <div key={element.id} style={{ height: element.styles?.height || '48px' }} />;

      // Premium Elements
      case 'gradient-text':
        const gradientProps = (element.props?.gradient as { type?: string; angle?: number; stops?: Array<{ color: string; position: number }> }) || {};
        return (
          <span 
            key={element.id}
            className="text-4xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: gradientToCSS(gradientProps) }}
          >
            {element.content || 'Gradient Text'}
          </span>
        );

      case 'stat-number':
        const suffix = (element.props?.suffix as string) || '+';
        const statLabel = (element.props?.label as string) || '';
        return (
          <div key={element.id} className="text-center">
            <div className="text-5xl font-bold tracking-tight">{element.content || '0'}{suffix}</div>
            {statLabel && <div className="text-xs uppercase tracking-wider mt-2 opacity-70">{statLabel}</div>}
          </div>
        );

      case 'avatar-group':
        const avatarCount = (element.props?.count as number) || 3;
        const avatarBaseColor = (element.props?.gradientFrom as string) || '#8B5CF6';
        return (
          <div key={element.id} className="flex -space-x-3">
            {Array.from({ length: avatarCount }).map((_, i) => (
              <div 
                key={i}
                className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-background"
                style={{ background: `linear-gradient(${135 + i * 15}deg, ${avatarBaseColor}, #EC4899)` }}
              >
                <User className="w-5 h-5 text-white" />
              </div>
            ))}
          </div>
        );

      case 'ticker':
        const tickerItems = (element.props?.items as string[]) || ['Item 1', 'Item 2', 'Item 3'];
        const tickerSep = (element.props?.separator as string) || '  •  ';
        return (
          <div key={element.id} className="w-full overflow-hidden py-3">
            <div className="animate-marquee whitespace-nowrap">
              {[...tickerItems, ...tickerItems].map((item, i) => (
                <span key={i} className="text-sm font-medium uppercase tracking-wider mx-4">
                  {item}{tickerSep}
                </span>
              ))}
            </div>
          </div>
        );

      case 'badge':
        const badgeVariant = (element.props?.variant as string) || 'primary';
        const badgeClasses: Record<string, string> = {
          primary: 'bg-purple-500/20 text-purple-400',
          success: 'bg-green-500/20 text-green-400',
          warning: 'bg-amber-500/20 text-amber-400',
          premium: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black'
        };
        return (
          <span key={element.id} className={cn('px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider', badgeClasses[badgeVariant] || badgeClasses.primary)}>
            {element.content || 'BADGE'}
          </span>
        );

      case 'process-step':
        const stepNum = (element.props?.step as number) || 1;
        return (
          <div key={element.id} className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
              {stepNum}
            </div>
            <span className="font-medium">{element.content || 'Step Title'}</span>
          </div>
        );

      case 'video-thumbnail':
        const thumbnailUrl = (element.props?.thumbnailUrl as string);
        return (
          <div key={element.id} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            {thumbnailUrl && <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
                <Play className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        );

      case 'underline-text':
        const underlineFrom = (element.props?.underlineFrom as string) || '#8B5CF6';
        const underlineTo = (element.props?.underlineTo as string) || '#EC4899';
        return (
          <span key={element.id} className="relative inline-block text-2xl font-bold">
            {element.content || 'Underlined Text'}
            <span 
              className="absolute bottom-0 left-0 right-0 h-1 rounded-full"
              style={{ background: `linear-gradient(90deg, ${underlineFrom}, ${underlineTo})` }}
            />
          </span>
        );
        
      default:
        return null;
    }
  }, [formData, handleInputChange, handleRadioSelect, handleCheckboxToggle, handleButtonClick, isSubmitting]);

  // Progress indicator
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100;

  // Complete state
  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">You're All Set!</h1>
          <p className="text-muted-foreground">
            We've received your application. Check your inbox for next steps.
          </p>
        </motion.div>
      </div>
    );
  }

  // No steps
  if (steps.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No content available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Progress bar */}
      {totalSteps > 1 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Navigation arrows */}
      {totalSteps > 1 && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40">
          <button
            onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
            disabled={currentStepIndex === 0}
            className={cn(
              'p-2 rounded-full transition-all',
              currentStepIndex === 0
                ? 'text-muted-foreground/30 cursor-not-allowed'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentStepIndex(prev => Math.min(totalSteps - 1, prev + 1))}
            disabled={currentStepIndex === totalSteps - 1}
            className={cn(
              'p-2 rounded-full transition-all',
              currentStepIndex === totalSteps - 1
                ? 'text-muted-foreground/30 cursor-not-allowed'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Step content */}
      <div className="flex items-center justify-center min-h-screen p-4 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep?.id || currentStepIndex}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-lg"
          >
            <div className="space-y-4">
              {currentBlocks.map(block => (
                <div key={block.id} className="space-y-3">
                  {block.elements.map(element => renderElement(element, block))}
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Step counter */}
      {totalSteps > 1 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
          {currentStepIndex + 1} / {totalSteps}
        </div>
      )}
    </div>
  );
}

export default FlowCanvasRenderer;
