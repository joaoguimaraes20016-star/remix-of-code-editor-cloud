import { cn } from '@/lib/utils';
import type { StepComponentProps } from './types';
import { FONT_SIZE_MAP, DEFAULT_DESIGN } from './types';
import { UnifiedButton } from '@/components/builder/UnifiedButton';

export function WelcomeStep({
  content,
  design,
  isSelected,
  onContentChange,
  onSelect,
}: StepComponentProps) {
  const d = { ...DEFAULT_DESIGN, ...design, ...content.design };
  const fontSize = d.fontSize || 'medium';
  const sizes = FONT_SIZE_MAP[fontSize];

  const backgroundStyle = d.useGradient && d.gradientFrom && d.gradientTo
    ? { background: `linear-gradient(${d.gradientDirection || 'to bottom'}, ${d.gradientFrom}, ${d.gradientTo})` }
    : { backgroundColor: d.backgroundColor };

  return (
    <div
      className={cn(
        "step-card step-card--welcome",
        isSelected && "step-card--selected"
      )}
      data-step-type="Welcome"
      style={{
        ...backgroundStyle,
        color: d.textColor,
        fontFamily: d.fontFamily,
      }}
      onClick={onSelect}
    >
      <div className="step-content">
        <h2 className={cn("step-headline", sizes.headline)}>
          {content.headline || 'Welcome!'}
        </h2>
        {content.subtext && (
          <p className={cn("step-subtext", sizes.subtext)}>
            {content.subtext}
          </p>
        )}
        {/* UNIFIED BUTTON - no wrapper, no fake backgrounds */}
        <UnifiedButton
          backgroundColor={d.buttonColor}
          textColor={d.buttonTextColor}
          borderRadiusPx={d.borderRadius}
          fullWidth={(d as any).buttonFullWidth ?? false}
          size={sizes.button === 'text-sm' ? 'sm' : sizes.button === 'text-lg' ? 'lg' : 'md'}
          className="mt-4 builder-element-selectable"
        >
          {content.button_text || 'Get Started'}
        </UnifiedButton>
      </div>
    </div>
  );
}
