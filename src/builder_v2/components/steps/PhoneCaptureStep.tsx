import { cn } from '@/lib/utils';
import { Phone } from 'lucide-react';
import type { StepComponentProps } from './types';
import { FONT_SIZE_MAP, DEFAULT_DESIGN } from './types';
import { UnifiedButton, presetToVariant, sizeToVariant } from '@/components/builder/UnifiedButton';

export function PhoneCaptureStep({
  content,
  design,
  isSelected,
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
        "step-card step-card--phone_capture",
        isSelected && "step-card--selected"
      )}
      data-step-type="Phone Capture"
      style={{
        ...backgroundStyle,
        color: d.textColor,
      }}
      onClick={onSelect}
    >
      <div className="step-content">
        <h2 className={cn("step-headline", sizes.headline)}>
          {content.headline || 'Enter your phone number'}
        </h2>
        {content.subtext && (
          <p className={cn("step-subtext", sizes.subtext)}>
            {content.subtext}
          </p>
        )}
        <div className="step-input-wrapper">
          <Phone className="step-input-icon" size={18} />
          <input
            type="tel"
            className="step-input step-input--with-icon"
            placeholder={content.placeholder || '(555) 123-4567'}
            style={{
              backgroundColor: d.inputBg || 'rgba(255,255,255,0.1)',
              color: d.inputTextColor || d.textColor,
              borderRadius: `${d.inputRadius || d.borderRadius}px`,
              borderColor: d.inputBorder || 'rgba(255,255,255,0.2)',
            }}
            readOnly
          />
        </div>
        <UnifiedButton
          variant={presetToVariant((d as any).buttonPreset)}
          size={sizeToVariant(sizes.button === 'text-sm' ? 'sm' : sizes.button === 'text-lg' ? 'lg' : 'md')}
          backgroundColor={d.buttonColor}
          textColor={d.buttonTextColor}
          borderRadiusPx={d.borderRadius}
          fullWidth={(d as any).buttonFullWidth ?? false}
          className="mt-4"
        >
          {content.button_text || 'Continue'}
        </UnifiedButton>
      </div>
    </div>
  );
}
