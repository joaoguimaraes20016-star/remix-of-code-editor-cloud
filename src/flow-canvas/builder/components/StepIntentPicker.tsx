import React from 'react';
import { StepIntent } from '../../types/infostack';
import { cn } from '@/lib/utils';
import { 
  UserPlus, 
  ClipboardCheck, 
  Calendar, 
  CreditCard, 
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface StepIntentPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIntent: (intent: StepIntent) => void;
  onAddBlankStep?: () => void;
}

interface IntentOption {
  intent: StepIntent;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const intentOptions: IntentOption[] = [
  {
    intent: 'capture',
    label: 'Capture',
    description: 'Collect email, phone or lead info',
    icon: <UserPlus className="w-5 h-5" />,
    color: 'text-[hsl(var(--intent-capture))]',
    bgColor: 'bg-[hsl(var(--intent-capture))]/10 hover:bg-[hsl(var(--intent-capture))]/20',
  },
  {
    intent: 'qualify',
    label: 'Qualify',
    description: 'Ask questions to segment leads',
    icon: <ClipboardCheck className="w-5 h-5" />,
    color: 'text-[hsl(var(--intent-qualify))]',
    bgColor: 'bg-[hsl(var(--intent-qualify))]/10 hover:bg-[hsl(var(--intent-qualify))]/20',
  },
  {
    intent: 'schedule',
    label: 'Schedule',
    description: 'Book a call or appointment',
    icon: <Calendar className="w-5 h-5" />,
    color: 'text-[hsl(var(--intent-schedule))]',
    bgColor: 'bg-[hsl(var(--intent-schedule))]/10 hover:bg-[hsl(var(--intent-schedule))]/20',
  },
  {
    intent: 'convert',
    label: 'Convert',
    description: 'Close the sale or offer',
    icon: <CreditCard className="w-5 h-5" />,
    color: 'text-[hsl(var(--intent-convert))]',
    bgColor: 'bg-[hsl(var(--intent-convert))]/10 hover:bg-[hsl(var(--intent-convert))]/20',
  },
  {
    intent: 'complete',
    label: 'Complete',
    description: 'Thank you or confirmation page',
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'text-[hsl(var(--intent-complete))]',
    bgColor: 'bg-[hsl(var(--intent-complete))]/10 hover:bg-[hsl(var(--intent-complete))]/20',
  },
];

export const StepIntentPicker: React.FC<StepIntentPickerProps> = ({
  isOpen,
  onClose,
  onSelectIntent,
  onAddBlankStep,
}) => {
  const handleSelectIntent = (intent: StepIntent) => {
    onSelectIntent(intent);
    onClose();
  };

  const handleAddBlank = () => {
    onAddBlankStep?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))] text-[hsl(var(--builder-text))]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[hsl(var(--builder-text))]">
            <Sparkles className="w-5 h-5 text-[hsl(var(--builder-accent))]" />
            Add New Step
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-[hsl(var(--builder-text-muted))] mb-4">
            Choose the purpose of this step to get started with relevant blocks:
          </p>

          <div className="grid grid-cols-1 gap-2">
            {intentOptions.map((option) => (
              <button
                key={option.intent}
                onClick={() => handleSelectIntent(option.intent)}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border border-[hsl(var(--builder-border))] transition-all text-left',
                  option.bgColor
                )}
              >
                <div className={cn('p-2 rounded-lg', option.bgColor, option.color)}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className={cn('font-medium', option.color)}>
                    {option.label}
                  </div>
                  <div className="text-sm text-[hsl(var(--builder-text-muted))]">
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Blank Step Option */}
          {onAddBlankStep && (
            <div className="mt-4 pt-4 border-t border-[hsl(var(--builder-border))]">
              <button
                onClick={handleAddBlank}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-[hsl(var(--builder-border))] text-[hsl(var(--builder-text-muted))] hover:border-[hsl(var(--builder-accent))] hover:text-[hsl(var(--builder-text))] transition-all"
              >
                <span className="text-sm font-medium">Or start with a blank page</span>
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
