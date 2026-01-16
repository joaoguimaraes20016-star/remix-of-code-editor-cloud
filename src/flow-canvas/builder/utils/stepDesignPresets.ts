/**
 * Step Design Presets
 * 
 * Presets provide sensible defaults, but users can override EVERYTHING.
 * No preset locks any style - they're just starting points.
 */

export type StepDesignPreset = 'none' | 'minimal' | 'card' | 'glass' | 'full-bleed';

export interface StepDesignSettings {
  preset: StepDesignPreset;
  // Container
  containerPadding: number;
  containerRadius: number;
  containerBorderColor: string | null;
  containerShadow: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  // Colors (null = inherit from page)
  backgroundColor: string | null;
  textColor: string | null;
  // Glass-specific
  backdropBlur: number;
  backgroundOpacity: number;
}

/**
 * Preset definitions - each provides sensible defaults
 * Users can fully override any setting after applying
 */
export const stepDesignPresets: Record<StepDesignPreset, Omit<StepDesignSettings, 'preset'>> = {
  // None: Raw canvas - completely transparent, no styling
  none: {
    containerPadding: 0,
    containerRadius: 0,
    containerBorderColor: null,
    containerShadow: 'none',
    backgroundColor: null,
    textColor: null,
    backdropBlur: 0,
    backgroundOpacity: 100,
  },
  
  // Minimal: Subtle, clean - the default
  minimal: {
    containerPadding: 32,
    containerRadius: 0,
    containerBorderColor: null,
    containerShadow: 'none',
    backgroundColor: null,
    textColor: null,
    backdropBlur: 0,
    backgroundOpacity: 100,
  },
  
  // Card: Traditional card with shadow & border
  card: {
    containerPadding: 32,
    containerRadius: 16,
    containerBorderColor: 'rgba(0,0,0,0.08)',
    containerShadow: 'lg',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    backdropBlur: 0,
    backgroundOpacity: 100,
  },
  
  // Glass: Frosted glass effect
  glass: {
    containerPadding: 32,
    containerRadius: 20,
    containerBorderColor: 'rgba(255,255,255,0.2)',
    containerShadow: 'md',
    backgroundColor: 'rgba(255,255,255,0.1)',
    textColor: '#ffffff',
    backdropBlur: 12,
    backgroundOpacity: 10,
  },
  
  // Full-bleed: Edge-to-edge, no container
  'full-bleed': {
    containerPadding: 40,
    containerRadius: 0,
    containerBorderColor: null,
    containerShadow: 'none',
    backgroundColor: null,
    textColor: null,
    backdropBlur: 0,
    backgroundOpacity: 100,
  },
};

/**
 * Get preset label for UI
 */
export const presetLabels: Record<StepDesignPreset, string> = {
  none: 'None',
  minimal: 'Minimal',
  card: 'Card',
  glass: 'Glass',
  'full-bleed': 'Full Bleed',
};

/**
 * Get preset description for UI
 */
export const presetDescriptions: Record<StepDesignPreset, string> = {
  none: 'Raw canvas, no container styling',
  minimal: 'Clean and subtle, inherits page colors',
  card: 'Traditional card with shadow',
  glass: 'Frosted glass effect',
  'full-bleed': 'Edge-to-edge, immersive layout',
};

/**
 * Apply a preset and return new settings
 * Preserves any user overrides if merging
 */
export function applyPreset(
  preset: StepDesignPreset,
  currentSettings?: Partial<StepDesignSettings>
): StepDesignSettings {
  const presetDefaults = stepDesignPresets[preset];
  return {
    preset,
    ...presetDefaults,
    // If user had overrides, we replace them with preset values
    // (preset selection is an intentional reset)
  };
}

/**
 * Get CSS styles from design settings
 */
export function getContainerStyles(settings: Partial<StepDesignSettings>): React.CSSProperties {
  const preset = settings.preset || 'minimal';
  const defaults = stepDesignPresets[preset];
  
  const padding = settings.containerPadding ?? defaults.containerPadding;
  const radius = settings.containerRadius ?? defaults.containerRadius;
  const borderColor = settings.containerBorderColor ?? defaults.containerBorderColor;
  const shadow = settings.containerShadow ?? defaults.containerShadow;
  const bgColor = settings.backgroundColor ?? defaults.backgroundColor;
  const blur = settings.backdropBlur ?? defaults.backdropBlur;
  const opacity = settings.backgroundOpacity ?? defaults.backgroundOpacity;
  
  const shadowMap: Record<string, string> = {
    'none': 'none',
    'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  };
  
  const styles: React.CSSProperties = {
    padding: `${padding}px`,
    borderRadius: `${radius}px`,
    boxShadow: shadowMap[shadow] || 'none',
  };
  
  if (borderColor) {
    styles.border = `1px solid ${borderColor}`;
  }
  
  if (bgColor) {
    styles.backgroundColor = bgColor;
  }
  
  if (blur > 0) {
    styles.backdropFilter = `blur(${blur}px)`;
    styles.WebkitBackdropFilter = `blur(${blur}px)`;
  }
  
  return styles;
}

/**
 * Default container settings (minimal preset)
 */
export const DEFAULT_CONTAINER_SETTINGS: StepDesignSettings = {
  preset: 'minimal',
  ...stepDesignPresets.minimal,
};
