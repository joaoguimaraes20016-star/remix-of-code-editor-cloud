/**
 * ColorGradientControl - Unified color/gradient picker control
 * 
 * Provides a single component that handles both solid colors and gradients.
 * Uses a type toggle and shows the appropriate picker based on current mode.
 * 
 * Usage:
 * <ColorGradientControl
 *   colorType={props.numberColorType || 'solid'}
 *   solidColor={props.numberColor || '#ffffff'}
 *   gradient={props.numberGradient}
 *   onColorTypeChange={(type) => handlePropsChange('numberColorType', type)}
 *   onSolidColorChange={(color) => handlePropsChange('numberColor', color)}
 *   onGradientChange={(gradient) => handlePropsChange('numberGradient', gradient)}
 * />
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ColorPickerPopover } from '../../modals/ColorPickerPopover';
import { GradientPickerPopover, GradientValue, gradientToCSS, defaultGradient, cloneGradient } from '../../modals/GradientPickerPopover';

export type ColorType = 'solid' | 'gradient';

export interface ColorGradientControlProps {
  /** Current color type mode */
  colorType: ColorType;
  /** Solid color value (hex) */
  solidColor: string;
  /** Gradient value object */
  gradient?: GradientValue | null;
  /** Called when switching between solid/gradient */
  onColorTypeChange: (type: ColorType) => void;
  /** Called when solid color changes */
  onSolidColorChange: (color: string) => void;
  /** Called when gradient changes */
  onGradientChange: (gradient: GradientValue) => void;
  /** Optional label - if not provided, no type toggle is shown */
  showTypeToggle?: boolean;
  /** Compact mode for tighter spaces */
  compact?: boolean;
}

export const ColorGradientControl: React.FC<ColorGradientControlProps> = ({
  colorType,
  solidColor,
  gradient,
  onColorTypeChange,
  onSolidColorChange,
  onGradientChange,
  showTypeToggle = true,
  compact = false,
}) => {
  const currentGradient = gradient || defaultGradient;
  
  // Render the preview swatch based on current type
  const renderPreviewSwatch = () => {
    const swatchStyle = colorType === 'gradient' 
      ? { background: gradientToCSS(currentGradient) }
      : { backgroundColor: solidColor };
    
    return (
      <div 
        className={cn(
          "rounded-md border border-builder-border flex-shrink-0",
          compact ? "w-5 h-5" : "w-6 h-6"
        )}
        style={swatchStyle}
      />
    );
  };

  // Handle switching to gradient mode
  const handleSwitchToGradient = () => {
    onColorTypeChange('gradient');
    // Initialize gradient with current color as first stop if not set
    if (!gradient) {
      onGradientChange({
        type: 'linear',
        angle: 135,
        stops: [
          { color: solidColor, position: 0 },
          { color: '#D946EF', position: 100 },
        ],
      });
    }
  };

  // Handle switching to solid mode
  const handleSwitchToSolid = () => {
    onColorTypeChange('solid');
  };

  return (
    <div className="space-y-2">
      {/* Type Toggle */}
      {showTypeToggle && (
        <div className="flex items-center gap-1">
          <button
            onClick={handleSwitchToSolid}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] transition-colors",
              colorType === 'solid' 
                ? "bg-builder-accent text-white" 
                : "text-builder-text-muted hover:text-builder-text"
            )}
          >
            Solid
          </button>
          <button
            onClick={handleSwitchToGradient}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] transition-colors",
              colorType === 'gradient' 
                ? "bg-builder-accent text-white" 
                : "text-builder-text-muted hover:text-builder-text"
            )}
          >
            Gradient
          </button>
        </div>
      )}

      {/* Color/Gradient Picker */}
      {colorType === 'solid' ? (
        <ColorPickerPopover
          color={solidColor}
          onChange={onSolidColorChange}
          showGradientOption={true}
          onGradientClick={handleSwitchToGradient}
        >
          <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors w-full">
            {renderPreviewSwatch()}
            <span className={cn(
              "text-builder-text-muted truncate font-mono",
              compact ? "text-[10px]" : "text-xs"
            )}>
              {solidColor}
            </span>
          </button>
        </ColorPickerPopover>
      ) : (
        <GradientPickerPopover
          value={currentGradient}
          onChange={(g) => onGradientChange(cloneGradient(g))}
        >
          <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors w-full">
            {renderPreviewSwatch()}
            <span className={cn(
              "text-builder-text-muted",
              compact ? "text-[10px]" : "text-xs"
            )}>
              Edit Gradient
            </span>
          </button>
        </GradientPickerPopover>
      )}
    </div>
  );
};

/**
 * Helper function to get CSS value from color type, solid color, and gradient
 * Use this in renderers to apply the correct color/gradient
 */
export const getColorOrGradientCSS = (
  colorType: ColorType | undefined,
  solidColor: string,
  gradient?: GradientValue | null
): string => {
  if (colorType === 'gradient' && gradient) {
    return gradientToCSS(gradient);
  }
  return solidColor;
};

/**
 * Helper function to get style object for text with color or gradient
 * Gradients require background-clip: text for text elements
 */
export const getTextColorStyle = (
  colorType: ColorType | undefined,
  solidColor: string,
  gradient?: GradientValue | null
): React.CSSProperties => {
  if (colorType === 'gradient' && gradient) {
    return {
      background: gradientToCSS(gradient),
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      display: 'inline',
    };
  }
  return { color: solidColor };
};

/**
 * Helper function to get style object for backgrounds
 */
export const getBackgroundStyle = (
  colorType: ColorType | undefined,
  solidColor: string,
  gradient?: GradientValue | null
): React.CSSProperties => {
  if (colorType === 'gradient' && gradient) {
    return { background: gradientToCSS(gradient) };
  }
  return { backgroundColor: solidColor };
};

export default ColorGradientControl;
