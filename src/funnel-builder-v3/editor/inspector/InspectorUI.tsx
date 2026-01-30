import React from 'react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline, Strikethrough,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Eye, EyeOff, Lock, Unlock, Link, Unlink,
  Plus, Minus, RotateCcw, Check
} from 'lucide-react';

// ========== SECTION WRAPPER ==========
interface InspectorSectionProps {
  title: string;
  info?: string;
  children: React.ReactNode;
  className?: string;
}

export function InspectorSection({ title, info, children, className }: InspectorSectionProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{title}</h4>
        {info && (
          <button className="w-3.5 h-3.5 rounded-full border border-border flex items-center justify-center text-[9px] text-muted-foreground hover:bg-muted">
            i
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ========== ICON TOGGLE ROW ==========
interface IconToggleOption {
  value: string;
  icon: React.ReactNode;
  label?: string;
}

interface IconToggleRowProps {
  options: IconToggleOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function IconToggleRow({ options, value, onChange, className }: IconToggleRowProps) {
  return (
    <div className={cn("inline-flex gap-0.5 bg-muted p-0.5 rounded-md", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-7 px-2.5 rounded flex items-center justify-center transition-all",
            value === option.value 
              ? "bg-background shadow-sm text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
          title={option.label}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}

// ========== LABELED TOGGLE ROW ==========
interface LabeledToggleOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface LabeledToggleRowProps {
  options: LabeledToggleOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function LabeledToggleRow({ options, value, onChange, className }: LabeledToggleRowProps) {
  return (
    <div className={cn("inline-flex gap-0.5 bg-muted p-0.5 rounded-md", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-7 rounded flex items-center justify-center gap-1 px-2 transition-all text-[11px] font-medium",
            value === option.value 
              ? "bg-background shadow-sm text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.icon}
          <span className="truncate">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

// ========== MULTI-TOGGLE ROW ==========
interface MultiToggleRowProps {
  options: IconToggleOption[];
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export function MultiToggleRow({ options, values, onChange, className }: MultiToggleRowProps) {
  const toggle = (optionValue: string) => {
    if (values.includes(optionValue)) {
      onChange(values.filter(v => v !== optionValue));
    } else {
      onChange([...values, optionValue]);
    }
  };

  return (
    <div className={cn("inline-flex gap-0.5 bg-muted p-0.5 rounded-md", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => toggle(option.value)}
          className={cn(
            "h-7 px-2.5 rounded flex items-center justify-center transition-all",
            values.includes(option.value)
              ? "bg-background shadow-sm text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
          title={option.label}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}

// ========== VISUAL SLIDER WITH ICON ==========
interface VisualSliderProps {
  icon?: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}

export function VisualSlider({ 
  icon, 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1,
  unit = '',
  className 
}: VisualSliderProps) {
  return (
    <div className={cn("flex items-center gap-2 bg-muted/50 px-2 py-1.5 rounded-md", className)}>
      {icon && <div className="text-muted-foreground shrink-0">{icon}</div>}
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="flex-1"
      />
      <span className="text-[11px] text-muted-foreground tabular-nums w-9 text-right">
        {value}{unit}
      </span>
    </div>
  );
}

// ========== SPACING CONTROL (Per-Side) ==========
interface SpacingValue {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface SpacingControlProps {
  value: SpacingValue;
  onChange: (value: SpacingValue) => void;
  max?: number;
  icon?: React.ReactNode;
  className?: string;
}

export function SpacingControl({
  value,
  onChange,
  max = 96,
  icon,
  className,
}: SpacingControlProps) {
  const [linked, setLinked] = React.useState(
    value.top === value.right && value.right === value.bottom && value.bottom === value.left
  );

  const handleUniformChange = (v: number) => {
    onChange({ top: v, right: v, bottom: v, left: v });
  };

  const handleSideChange = (side: keyof SpacingValue, v: number) => {
    onChange({ ...value, [side]: v });
  };

  const toggleLinked = () => {
    if (!linked) {
      // When linking, use the top value for all sides
      onChange({ top: value.top, right: value.top, bottom: value.top, left: value.top });
    }
    setLinked(!linked);
  };

  if (linked) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2 bg-muted/50 px-2 py-1.5 rounded-md">
          {icon && <div className="text-muted-foreground shrink-0">{icon}</div>}
          <Slider
            value={[value.top]}
            onValueChange={([v]) => handleUniformChange(v)}
            min={0}
            max={max}
            step={1}
            className="flex-1"
          />
          <span className="text-[11px] text-muted-foreground tabular-nums w-9 text-right">
            {value.top}px
          </span>
          <button
            onClick={toggleLinked}
            className="p-1 hover:bg-background rounded transition-colors"
            title="Unlink sides"
          >
            <Lock className="h-3 w-3 text-primary" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">Per-side spacing</span>
        <button
          onClick={toggleLinked}
          className="p-1 hover:bg-muted rounded transition-colors"
          title="Link all sides"
        >
          <Unlock className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { key: 'top' as const, label: 'T', icon: <ArrowUp className="h-2.5 w-2.5" /> },
          { key: 'right' as const, label: 'R', icon: <ArrowRight className="h-2.5 w-2.5" /> },
          { key: 'bottom' as const, label: 'B', icon: <ArrowDown className="h-2.5 w-2.5" /> },
          { key: 'left' as const, label: 'L', icon: <ArrowLeft className="h-2.5 w-2.5" /> },
        ].map(({ key, label, icon: sideIcon }) => (
          <div key={key} className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
            <span className="text-[10px] text-muted-foreground w-3">{label}</span>
            <input
              type="number"
              value={value[key]}
              onChange={(e) => handleSideChange(key, Math.max(0, Math.min(max, parseInt(e.target.value) || 0)))}
              className="w-full h-6 bg-transparent text-center text-xs font-medium focus:outline-none"
              min={0}
              max={max}
            />
            <span className="text-[9px] text-muted-foreground">px</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== GRADIENT PICKER ==========
interface GradientPickerProps {
  value: string;
  onChange: (gradient: string) => void;
  className?: string;
}

const gradientPresets = [
  { id: 'none', value: '', preview: 'transparent' },
  { id: 'sunrise', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'ocean', value: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)', preview: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' },
  { id: 'fire', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'forest', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', preview: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 'sunset', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', preview: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 'midnight', value: 'linear-gradient(135deg, #232526 0%, #414345 100%)', preview: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
  { id: 'gold', value: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', preview: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' },
  { id: 'cosmic', value: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)', preview: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)' },
  { id: 'warmth', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', preview: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { id: 'arctic', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', preview: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { id: 'neon', value: 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)', preview: 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)' },
  { id: 'cherry', value: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)', preview: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' },
];

export function GradientPicker({ value, onChange, className }: GradientPickerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-5 gap-1.5">
        {gradientPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onChange(preset.value)}
            className={cn(
              "w-full h-8 rounded-md border transition-all hover:scale-105 relative overflow-hidden",
              value === preset.value ? "border-primary ring-1 ring-primary/30" : "border-border/50"
            )}
            style={{ background: preset.preview === 'transparent' ? undefined : preset.preview }}
            title={preset.id}
          >
            {preset.preview === 'transparent' && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ========== GRADIENT COLOR PICKER (Combined solid + gradient) ==========
interface GradientColorPickerProps {
  solidColor: string;
  gradient: string;
  onSolidChange: (color: string) => void;
  onGradientChange: (gradient: string) => void;
  colorPresets?: string[];
  className?: string;
}

export function GradientColorPicker({
  solidColor,
  gradient,
  onSolidChange,
  onGradientChange,
  colorPresets,
  className,
}: GradientColorPickerProps) {
  const [mode, setMode] = React.useState<'solid' | 'gradient'>(gradient ? 'gradient' : 'solid');

  const handleModeChange = (newMode: 'solid' | 'gradient') => {
    setMode(newMode);
    if (newMode === 'solid') {
      onGradientChange('');
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-0.5 bg-muted p-0.5 rounded-md w-fit">
        <button
          onClick={() => handleModeChange('solid')}
          className={cn(
            "px-2.5 py-1 rounded text-[11px] font-medium transition-all",
            mode === 'solid' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Solid
        </button>
        <button
          onClick={() => handleModeChange('gradient')}
          className={cn(
            "px-2.5 py-1 rounded text-[11px] font-medium transition-all",
            mode === 'gradient' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Gradient
        </button>
      </div>

      {mode === 'solid' ? (
        <ColorSwatchPicker
          value={solidColor}
          onChange={onSolidChange}
          presets={colorPresets}
        />
      ) : (
        <GradientPicker value={gradient} onChange={onGradientChange} />
      )}
    </div>
  );
}

// ========== COLOR SWATCH PICKER ==========
interface ColorSwatchPickerProps {
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
  showCustom?: boolean;
  className?: string;
}

const defaultColorPresets = [
  'transparent', '#ffffff', '#000000', '#f8fafc', '#f1f5f9',
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'
];

function safeColorInputValue(value: string): string {
  if (!value || value === 'transparent') return '#000000';
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;

  // rgb(...) / rgba(...)
  const rgbMatch = value.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  const rgbaMatch = value.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)$/);
  const match = rgbMatch || rgbaMatch;
  if (!match) return '#000000';

  const toHex = (n: string) => parseInt(n, 10).toString(16).padStart(2, '0');
  return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
}

export function ColorSwatchPicker({
  value,
  onChange,
  presets = defaultColorPresets,
  showCustom = true,
  className,
}: ColorSwatchPickerProps) {
  const inputValue = safeColorInputValue(value);
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap gap-1">
        {presets.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={cn(
              "w-5 h-5 rounded-md border transition-all hover:scale-110 relative overflow-hidden",
              value === color ? "border-primary ring-1 ring-primary/30" : "border-border/50"
            )}
            style={{ backgroundColor: color === 'transparent' ? undefined : color }}
          >
            {color === 'transparent' && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                  backgroundSize: '6px 6px',
                  backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                }}
              />
            )}
          </button>
        ))}
        {showCustom && (
          <label className="w-5 h-5 rounded-md border border-dashed border-border hover:border-primary cursor-pointer flex items-center justify-center overflow-hidden">
            <input
              type="color"
              value={inputValue}
              onChange={(e) => onChange(e.target.value)}
              className="opacity-0 absolute w-0 h-0"
            />
            <Plus className="h-2.5 w-2.5 text-muted-foreground" />
          </label>
        )}
      </div>
    </div>
  );
}

// ========== COLOR + GRADIENT SWATCH PICKER (Combined for inline toolbar) ==========
const textGradientPresets = [
  { id: 'sunrise', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'ocean', value: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' },
  { id: 'fire', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'forest', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 'sunset', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 'gold', value: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' },
  { id: 'cosmic', value: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)' },
  { id: 'neon', value: 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)' },
  { id: 'cherry', value: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' },
  { id: 'arctic', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
];

interface ColorGradientSwatchPickerProps {
  solidColor: string;
  gradient?: string;
  onSolidChange: (color: string) => void;
  onGradientChange: (gradient: string) => void;
  colorPresets?: string[];
  showCustom?: boolean;
  className?: string;
}

export function ColorGradientSwatchPicker({
  solidColor,
  gradient,
  onSolidChange,
  onGradientChange,
  colorPresets = defaultColorPresets,
  showCustom = true,
  className,
}: ColorGradientSwatchPickerProps) {
  const [mode, setMode] = React.useState<'solid' | 'gradient'>(gradient ? 'gradient' : 'solid');
  const [customGradient, setCustomGradient] = React.useState('');
  const customGradientDebounceRef = React.useRef<number | null>(null);
  const inputValue = safeColorInputValue(solidColor);

  // Detect if gradient is selected
  const isGradientSelected = (g: string) => gradient === g;
  const isCustomGradient = gradient && !textGradientPresets.some(p => p.value === gradient);

  React.useEffect(() => {
    if (isCustomGradient && gradient) {
      setCustomGradient(gradient);
    }
  }, [gradient, isCustomGradient]);

  // Live-preview & apply custom gradients while typing (no need to click out).
  // We only apply when the string is a valid CSS gradient to avoid "breaking" styles.
  React.useEffect(() => {
    if (mode !== 'gradient') return;
    if (!showCustom) return;

    const next = (customGradient || '').trim();
    // Don't spam updates if it already matches current gradient
    if (next && next === (gradient || '').trim()) return;

    if (customGradientDebounceRef.current) {
      window.clearTimeout(customGradientDebounceRef.current);
    }

    customGradientDebounceRef.current = window.setTimeout(() => {
      if (!next) return;
      // Validate with CSS.supports when available
      const supportsFn = typeof CSS !== 'undefined' && typeof (CSS as any).supports === 'function';
      const canUse = !supportsFn || (CSS as any).supports('background-image', next);

      if (canUse) {
        onGradientChange(next);
      }
    }, 120);

    return () => {
      if (customGradientDebounceRef.current) {
        window.clearTimeout(customGradientDebounceRef.current);
        customGradientDebounceRef.current = null;
      }
    };
  }, [customGradient, gradient, mode, onGradientChange, showCustom]);

  const handleModeChange = (newMode: 'solid' | 'gradient') => {
    setMode(newMode);
    if (newMode === 'solid') {
      onGradientChange(''); // Clear gradient when switching to solid
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Mode Toggle */}
      <div className="flex gap-0.5 bg-muted p-0.5 rounded-md w-fit">
        <button
          onClick={() => handleModeChange('solid')}
          className={cn(
            "px-2.5 py-1 rounded text-[11px] font-medium transition-all",
            mode === 'solid' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Solid
        </button>
        <button
          onClick={() => handleModeChange('gradient')}
          className={cn(
            "px-2.5 py-1 rounded text-[11px] font-medium transition-all",
            mode === 'gradient' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Gradient
        </button>
      </div>

      {mode === 'solid' ? (
        /* Solid Color Swatches */
        <div className="flex flex-wrap gap-1">
          {colorPresets.map((color) => (
            <button
              key={color}
              onClick={() => onSolidChange(color)}
              className={cn(
                "w-5 h-5 rounded-md border transition-all hover:scale-110 relative overflow-hidden",
                solidColor === color && !gradient ? "border-primary ring-1 ring-primary/30" : "border-border/50"
              )}
              style={{ backgroundColor: color === 'transparent' ? undefined : color }}
            >
              {color === 'transparent' && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                    backgroundSize: '6px 6px',
                    backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                  }}
                />
              )}
            </button>
          ))}
          {showCustom && (
            <label className="w-5 h-5 rounded-md border border-dashed border-border hover:border-primary cursor-pointer flex items-center justify-center overflow-hidden">
              <input
                type="color"
                value={inputValue}
                onChange={(e) => onSolidChange(e.target.value)}
                className="opacity-0 absolute w-0 h-0"
              />
              <Plus className="h-2.5 w-2.5 text-muted-foreground" />
            </label>
          )}
        </div>
      ) : (
        /* Gradient Swatches */
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {/* Clear/None option */}
            <button
              onClick={() => onGradientChange('')}
              className={cn(
                "w-5 h-5 rounded-md border transition-all hover:scale-110 relative overflow-hidden",
                !gradient ? "border-primary ring-1 ring-primary/30" : "border-border/50"
              )}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                  backgroundSize: '6px 6px',
                  backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                }}
              />
            </button>
            {textGradientPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onGradientChange(preset.value)}
                className={cn(
                  "w-5 h-5 rounded-md border transition-all hover:scale-110",
                  isGradientSelected(preset.value) ? "border-primary ring-1 ring-primary/30" : "border-border/50"
                )}
                style={{ background: preset.value }}
                title={preset.id}
              />
            ))}
          </div>
          {/* Custom gradient input */}
          <div className="flex items-center gap-1.5">
            <Input
              value={customGradient}
              onChange={(e) => setCustomGradient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const next = (customGradient || '').trim();
                  const supportsFn = typeof CSS !== 'undefined' && typeof (CSS as any).supports === 'function';
                  const canUse = !supportsFn || (CSS as any).supports('background-image', next);
                  if (next && canUse) onGradientChange(next);
                }
              }}
              placeholder="linear-gradient(135deg, #fff, #000)"
              className="h-7 text-xs flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2"
              onClick={() => {
                const next = (customGradient || '').trim();
                const supportsFn = typeof CSS !== 'undefined' && typeof (CSS as any).supports === 'function';
                const canUse = !supportsFn || (CSS as any).supports('background-image', next);
                if (next && canUse) onGradientChange(next);
              }}
            >
              <Check className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== INLINE COLOR PICKER ==========
interface InlineColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

export function InlineColorPicker({ value, onChange, label, className }: InlineColorPickerProps) {
  const inputValue = safeColorInputValue(value);
  return (
    <div className={cn("flex items-center gap-2 bg-muted/50 px-2 py-1.5 rounded-md", className)}>
      {label && <span className="text-[11px] text-muted-foreground flex-1">{label}</span>}
      <div className="flex items-center gap-1.5">
        <label 
          className="w-6 h-6 rounded-md border border-border cursor-pointer hover:scale-105 transition-transform overflow-hidden"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={inputValue}
            onChange={(e) => onChange(e.target.value)}
            className="opacity-0 w-full h-full cursor-pointer"
          />
        </label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-16 text-[10px] font-mono px-1.5"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

// ========== NUMBER STEPPER ==========
interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}

export function NumberStepper({ 
  value, 
  onChange, 
  min = 0, 
  max = 999, 
  step = 1,
  unit = '',
  className 
}: NumberStepperProps) {
  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  return (
    <div className={cn("flex items-center bg-muted rounded-lg overflow-hidden", className)}>
      <button 
        onClick={decrement}
        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
      >
        <Minus className="h-3 w-3" />
      </button>
      <div className="flex-1 text-center">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          className="w-full h-8 bg-transparent text-center text-sm font-medium focus:outline-none"
        />
      </div>
      <span className="text-xs text-muted-foreground pr-1">{unit}</span>
      <button 
        onClick={increment}
        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

// ========== IMAGE GRID PICKER ==========
interface ImageGridItem {
  id: string;
  src: string;
  label?: string;
}

interface ImageGridPickerProps {
  items: ImageGridItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onAdd?: () => void;
  columns?: number;
  className?: string;
}

export function ImageGridPicker({ 
  items, 
  selectedId, 
  onSelect, 
  onAdd,
  columns = 3,
  className 
}: ImageGridPickerProps) {
  return (
    <div className={cn(`grid gap-2`, className)} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={cn(
            "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
            selectedId === item.id 
              ? "border-primary ring-2 ring-primary/20" 
              : "border-transparent hover:border-border"
          )}
        >
          <img src={item.src} alt={item.label || ''} className="w-full h-full object-cover" />
          <span className="absolute bottom-1 left-1 bg-foreground/80 text-background text-[10px] font-medium px-1.5 py-0.5 rounded">
            {index + 1}
          </span>
        </button>
      ))}
      {onAdd && (
        <button
          onClick={onAdd}
          className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary flex items-center justify-center transition-colors"
        >
          <Plus className="h-5 w-5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

// ========== POSITION CONTROL ==========
interface PositionControlProps {
  xValue: number;
  yValue: number;
  onXChange: (value: number) => void;
  onYChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function PositionControl({ 
  xValue, 
  yValue, 
  onXChange, 
  onYChange,
  min = -100,
  max = 100,
  className 
}: PositionControlProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-3 bg-muted px-3 py-2 rounded-lg">
        <ArrowUp className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
        <Slider
          value={[xValue]}
          onValueChange={([v]) => onXChange(v)}
          min={min}
          max={max}
          className="flex-1"
        />
      </div>
      <div className="flex items-center gap-3 bg-muted px-3 py-2 rounded-lg">
        <ArrowUp className="h-4 w-4 text-muted-foreground" />
        <Slider
          value={[yValue]}
          onValueChange={([v]) => onYChange(v)}
          min={min}
          max={max}
          className="flex-1"
        />
      </div>
    </div>
  );
}

// ========== TOGGLE SWITCH ROW ==========
interface ToggleSwitchRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function ToggleSwitchRow({ label, checked, onChange, className }: ToggleSwitchRowProps) {
  return (
    <div className={cn("flex items-center justify-between py-1", className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} className="scale-90" />
    </div>
  );
}

// ========== TEXT INPUT ROW ==========
interface TextInputRowProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TextInputRow({ label, placeholder, value, onChange, className }: TextInputRowProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && <span className="text-[11px] text-muted-foreground">{label}</span>}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 bg-muted border-0 focus-visible:ring-1 text-sm"
      />
    </div>
  );
}

// ========== QUICK ACTIONS ==========
interface QuickAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface QuickActionsProps {
  actions: QuickAction[];
  className?: string;
}

export function QuickActions({ actions, className }: QuickActionsProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {actions.map((action, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className={cn(
            "flex-1 h-9",
            action.variant === 'destructive' && "hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
          )}
        >
          {action.icon}
          <span className="ml-1.5 text-xs">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}

// ========== ALIGNMENT CONTROLS ==========
export function TextAlignControls({ 
  value, 
  onChange 
}: { 
  value: 'left' | 'center' | 'right' | 'justify';
  onChange: (value: 'left' | 'center' | 'right' | 'justify') => void;
}) {
  return (
    <IconToggleRow
      value={value}
      onChange={(v) => onChange(v as any)}
      options={[
        { value: 'left', icon: <AlignLeft className="h-4 w-4" />, label: 'Align Left' },
        { value: 'center', icon: <AlignCenter className="h-4 w-4" />, label: 'Align Center' },
        { value: 'right', icon: <AlignRight className="h-4 w-4" />, label: 'Align Right' },
      ]}
    />
  );
}

// ========== TEXT STYLE CONTROLS ==========
export function TextStyleControls({ 
  bold, 
  italic, 
  underline,
  onBoldChange,
  onItalicChange,
  onUnderlineChange
}: { 
  bold: boolean;
  italic: boolean;
  underline: boolean;
  onBoldChange: (v: boolean) => void;
  onItalicChange: (v: boolean) => void;
  onUnderlineChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      {[
        { active: bold, onChange: onBoldChange, icon: <Bold className="h-4 w-4" />, label: 'Bold' },
        { active: italic, onChange: onItalicChange, icon: <Italic className="h-4 w-4" />, label: 'Italic' },
        { active: underline, onChange: onUnderlineChange, icon: <Underline className="h-4 w-4" />, label: 'Underline' },
      ].map((item, index) => (
        <button
          key={index}
          onClick={() => item.onChange(!item.active)}
          className={cn(
            "flex-1 h-8 rounded-md flex items-center justify-center transition-all",
            item.active
              ? "bg-background shadow-sm text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
          title={item.label}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}

// ========== PRESET PICKER ==========
interface Preset {
  id: string;
  name: string;
  preview: React.ReactNode;
  config: Record<string, any>;
}

interface PresetPickerProps {
  presets: Preset[];
  currentConfig?: Record<string, any>;
  onApply: (config: Record<string, any>) => void;
  className?: string;
}

export function PresetPicker({ presets, currentConfig, onApply, className }: PresetPickerProps) {
  // Simple matching - check if current config matches a preset
  const isActive = (preset: Preset) => {
    if (!currentConfig) return false;
    return Object.keys(preset.config).every(
      key => JSON.stringify(currentConfig[key]) === JSON.stringify(preset.config[key])
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Quick Styles</h4>
      <div className="grid grid-cols-4 gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onApply(preset.config)}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg transition-all",
              "bg-muted/50 hover:bg-muted border",
              isActive(preset)
                ? "border-primary ring-1 ring-primary/20"
                : "border-transparent"
            )}
          >
            <div className="w-full h-6 flex items-center justify-center mb-1">
              {preset.preview}
            </div>
            <span className="text-[9px] text-muted-foreground truncate w-full text-center">
              {preset.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ========== NICHE PRESET PICKER ==========
type NicheTab = 'all' | 'trading' | 'marketing' | 'consulting' | 'coaching';

interface NichePreset {
  id: string;
  name: string;
  config: Record<string, any>;
  category?: string;
}

interface NichePresetPickerProps {
  presets: NichePreset[];
  currentConfig?: Record<string, any>;
  onApply: (config: Record<string, any>) => void;
  className?: string;
}

export function NichePresetPicker({ presets, currentConfig, onApply, className }: NichePresetPickerProps) {
  const [activeTab, setActiveTab] = React.useState<NicheTab>('all');

  const nicheTabs: { id: NicheTab; name: string; color: string }[] = [
    { id: 'all', name: 'All', color: 'bg-muted' },
    { id: 'trading', name: '📈', color: 'bg-amber-500/20' },
    { id: 'marketing', name: '🚀', color: 'bg-blue-500/20' },
    { id: 'consulting', name: '💼', color: 'bg-purple-500/20' },
    { id: 'coaching', name: '🔥', color: 'bg-orange-500/20' },
  ];

  const filteredPresets = activeTab === 'all' 
    ? presets 
    : presets.filter(p => p.category === activeTab || p.category === 'universal');

  const isActive = (preset: NichePreset) => {
    if (!currentConfig) return false;
    return Object.keys(preset.config).every(
      key => JSON.stringify(currentConfig[key]) === JSON.stringify(preset.config[key])
    );
  };

  // Get visual preview based on config
  const getPreview = (config: Record<string, any>) => {
    if (config.backgroundColor) {
      return (
        <div 
          className="w-full h-3 rounded"
          style={{ backgroundColor: config.backgroundColor }}
        />
      );
    }
    if (config.styles?.color) {
      return (
        <div 
          className="font-bold text-[10px] leading-none"
          style={{ color: config.styles.color }}
        >
          Aa
        </div>
      );
    }
    return <div className="w-full h-3 bg-primary rounded" />;
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Niche Styles</h4>
        <div className="flex gap-0.5 bg-muted p-0.5 rounded-md">
          {nicheTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] transition-all",
                activeTab === tab.id 
                  ? "bg-background shadow-sm" 
                  : "hover:bg-background/50"
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {filteredPresets.slice(0, 6).map((preset) => (
          <button
            key={preset.id}
            onClick={() => onApply(preset.config)}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg transition-all",
              "bg-muted/50 hover:bg-muted border",
              isActive(preset)
                ? "border-primary ring-1 ring-primary/20"
                : "border-transparent"
            )}
          >
            <div className="w-full h-5 flex items-center justify-center mb-1">
              {getPreview(preset.config)}
            </div>
            <span className="text-[8px] text-muted-foreground truncate w-full text-center">
              {preset.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
