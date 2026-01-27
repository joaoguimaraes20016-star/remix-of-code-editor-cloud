import {
  Play,
  MessageSquare,
  List,
  Mail,
  Phone,
  UserCheck,
  Video,
  Code,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STEP_DEFINITIONS } from '@/lib/funnel/stepDefinitions';

// B4: Step type colors using CSS custom properties for theme consistency
const STEP_TYPE_CONFIG = [
  { type: 'welcome', icon: Play, colorVar: '--step-color-welcome' },
  { type: 'text_question', icon: MessageSquare, colorVar: '--step-color-question' },
  { type: 'multi_choice', icon: List, colorVar: '--step-color-choice' },
  { type: 'email_capture', icon: Mail, colorVar: '--step-color-email' },
  { type: 'phone_capture', icon: Phone, colorVar: '--step-color-phone' },
  { type: 'opt_in', icon: UserCheck, colorVar: '--step-color-optin' },
  { type: 'video', icon: Video, colorVar: '--step-color-video' },
  { type: 'embed', icon: Code, colorVar: '--step-color-embed' },
  { type: 'thank_you', icon: CheckCircle, colorVar: '--step-color-thanks' },
] as const;

interface StepPaletteProps {
  onAddStep: (stepType: string) => void;
  compact?: boolean;
}

export function StepPalette({ onAddStep, compact = false }: StepPaletteProps) {
  return (
    <div className={cn("step-palette", compact && "step-palette--compact")}>
      <div className="step-palette-header">
        <span className="step-palette-title">Add Step</span>
      </div>
      <div className="step-palette-grid">
        {STEP_TYPE_CONFIG.map(({ type, icon: Icon, colorVar }) => {
          const def = STEP_DEFINITIONS[type as keyof typeof STEP_DEFINITIONS];
          if (!def) return null;
          
          return (
            <button
              key={type}
              type="button"
              className="step-palette-item"
              onClick={() => onAddStep(type)}
              title={def.description}
            >
              <div
                className="step-palette-icon"
                style={{ 
                  backgroundColor: `hsl(var(${colorVar}) / 0.15)`, 
                  color: `hsl(var(${colorVar}))` 
                }}
              >
                <Icon size={compact ? 16 : 20} />
              </div>
              <span className="step-palette-label">{def.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
