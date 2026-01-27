// Types for step components in Builder V2

import type { ButtonAction } from '@/builder_v2/hooks/useButtonAction';

export interface StepDesign {
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
  fontFamily?: string;
  borderRadius?: number;
  useGradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: string;
  inputBg?: string;
  inputTextColor?: string;
  inputBorder?: string;
  inputRadius?: number;
  // A4: Button action support
  buttonAction?: ButtonAction;
}

export interface StepContent {
  headline?: string;
  subtext?: string;
  button_text?: string;
  placeholder?: string;
  video_url?: string;
  embed_url?: string;
  // A3: Autoplay support for video
  autoplay?: boolean;
  options?: Array<{ id: string; label: string; emoji?: string }>;
  fields?: Array<{ id: string; label: string; type: string; required?: boolean }>;
  element_order?: string[];
  dynamic_elements?: Record<string, any>;
  design?: StepDesign;
  intent?: 'capture' | 'collect' | 'schedule' | 'complete';
  // A4: Button action support
  buttonAction?: ButtonAction;
}

export interface StepComponentProps {
  content: StepContent;
  design?: StepDesign;
  isSelected?: boolean;
  isEditing?: boolean;
  onContentChange?: (field: string, value: any) => void;
  onSelect?: () => void;
}

export const FONT_SIZE_MAP = {
  small: { headline: 'text-lg', subtext: 'text-xs', button: 'text-sm' },
  medium: { headline: 'text-xl', subtext: 'text-sm', button: 'text-base' },
  large: { headline: 'text-2xl', subtext: 'text-base', button: 'text-lg' },
};

// B2: Default step design uses theme tokens
export const DEFAULT_DESIGN: StepDesign = {
  backgroundColor: 'hsl(var(--builder-bg, 225 12% 10%))',
  textColor: 'hsl(var(--builder-text, 0 0% 100%))',
  buttonColor: 'hsl(var(--primary, 217 91% 60%))',
  buttonTextColor: 'hsl(var(--primary-foreground, 0 0% 100%))',
  fontSize: 'medium',
  borderRadius: 12,
};

// ─────────────────────────────────────────────────────────
// NOTE: getButtonStyle has been removed
// All button rendering now uses UnifiedButton from @/components/builder/UnifiedButton
// ─────────────────────────────────────────────────────────
