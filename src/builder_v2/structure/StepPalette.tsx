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

// Theme-aligned step type colors using HSL tokens
const STEP_TYPE_CONFIG = [
  { type: 'welcome', icon: Play, color: 'hsl(239 84% 67%)' },       // Primary indigo
  { type: 'text_question', icon: MessageSquare, color: 'hsl(250 84% 67%)' },
  { type: 'multi_choice', icon: List, color: 'hsl(270 76% 65%)' },
  { type: 'email_capture', icon: Mail, color: 'hsl(330 80% 60%)' },
  { type: 'phone_capture', icon: Phone, color: 'hsl(350 89% 60%)' },
  { type: 'opt_in', icon: UserCheck, color: 'hsl(25 95% 53%)' },
  { type: 'video', icon: Video, color: 'hsl(45 93% 47%)' },
  { type: 'embed', icon: Code, color: 'hsl(142 71% 45%)' },
  { type: 'thank_you', icon: CheckCircle, color: 'hsl(168 76% 42%)' },
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
        {STEP_TYPE_CONFIG.map(({ type, icon: Icon, color }) => {
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
                style={{ backgroundColor: `${color}20`, color }}
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
