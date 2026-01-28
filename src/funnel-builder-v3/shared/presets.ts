/**
 * Funnel Builder v3 - Unified Presets
 * 
 * Single source of truth for colors, gradients, fonts, and shadows.
 * All inspector components MUST import from this file.
 */

// =============================================================================
// COLOR PRESETS
// =============================================================================

/**
 * Master color palette - 48 colors (6 rows × 8 columns)
 * Row 1: Neutrals, Row 2: Purples, Row 3: Blues, Row 4: Greens, Row 5: Warm, Row 6: Pinks
 */
export const masterColorPresets = [
  // Row 1: Neutrals
  '#FFFFFF', '#F9FAFB', '#E5E7EB', '#9CA3AF', '#4B5563', '#1F2937', '#111827', '#000000',
  // Row 2: Brand Purples/Magentas
  '#F5D0FE', '#E879F9', '#D946EF', '#C026D3', '#A855F7', '#8B5CF6', '#7C3AED', '#6D28D9',
  // Row 3: Blues/Cyans
  '#BFDBFE', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#06B6D4', '#0891B2', '#0E7490',
  // Row 4: Greens
  '#BBF7D0', '#86EFAC', '#4ADE80', '#22C55E', '#16A34A', '#10B981', '#059669', '#047857',
  // Row 5: Yellows/Oranges
  '#FEF08A', '#FACC15', '#EAB308', '#F59E0B', '#F97316', '#EA580C', '#DC2626', '#B91C1C',
  // Row 6: Pinks/Reds
  '#FECDD3', '#FDA4AF', '#FB7185', '#F43F5E', '#E11D48', '#EC4899', '#DB2777', '#BE185D',
] as const;

/**
 * Compact color palette - 22 colors for toolbars/mobile
 */
export const compactColorPresets = [
  '#FFFFFF', '#F9FAFB', '#E5E7EB', '#9CA3AF', '#6B7280', '#374151',
  '#111827', '#000000', '#EF4444', '#F97316', '#F59E0B', '#FCD34D',
  '#10B981', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#F472B6',
] as const;

/**
 * Inspector color palette - Organized by category for clarity
 */
export const inspectorColorPresets = {
  neutrals: ['#ffffff', '#f8fafc', '#e2e8f0', '#94a3b8', '#64748b', '#334155', '#1e293b', '#000000'],
  brand: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'],
  warm: ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#fbbf24'],
  cool: ['#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6'],
} as const;

/**
 * Flat array of inspector colors for backward compatibility
 */
export const inspectorColorPresetsFlat = [
  ...inspectorColorPresets.neutrals,
  ...inspectorColorPresets.brand,
  ...inspectorColorPresets.warm,
  ...inspectorColorPresets.cool,
];

/**
 * Background color presets - organized by intent
 */
export const backgroundColorPresets = {
  light: ['#FFFFFF', '#F8FAFC', '#F1F5F9'],
  dark: ['#1E293B', '#0F172A', '#030712'],
  accent: ['#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'],
} as const;

/**
 * Text color presets - high contrast, readable
 */
export const textColorPresets = [
  '#FFFFFF', '#F9FAFB', '#E5E7EB', '#9CA3AF', '#6B7280', '#374151', '#111827', '#000000',
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
] as const;

/**
 * Highlight accent presets (for {{text}} syntax)
 */
export const highlightPresets = [
  { color: '#F59E0B', label: 'Gold' },
  { color: '#EF4444', label: 'Red' },
  { color: '#10B981', label: 'Green' },
  { color: '#3B82F6', label: 'Blue' },
  { color: '#8B5CF6', label: 'Purple' },
  { color: '#EC4899', label: 'Pink' },
  { color: '#06B6D4', label: 'Cyan' },
  { color: '#FFFFFF', label: 'White' },
] as const;

// =============================================================================
// GRADIENT PRESETS
// =============================================================================

export interface GradientStop {
  color: string;
  position: number;
}

export interface GradientValue {
  type: 'linear' | 'radial';
  angle: number;
  stops: GradientStop[];
}

export interface GradientPreset {
  name: string;
  gradient: GradientValue;
}

/**
 * Master gradient presets - unified across all pickers
 */
export const masterGradientPresets: GradientPreset[] = [
  { 
    name: 'White Fade', 
    gradient: { type: 'linear', angle: 180, stops: [{ color: '#ffffff', position: 0 }, { color: '#9ca3af', position: 100 }] } 
  },
  { 
    name: 'Fire', 
    gradient: { type: 'linear', angle: 135, stops: [{ color: '#ef4444', position: 0 }, { color: '#f97316', position: 50 }, { color: '#fbbf24', position: 100 }] } 
  },
  { 
    name: 'Gold', 
    gradient: { type: 'linear', angle: 135, stops: [{ color: '#fbbf24', position: 0 }, { color: '#f59e0b', position: 50 }, { color: '#d97706', position: 100 }] } 
  },
  { 
    name: 'Purple Magic', 
    gradient: { type: 'linear', angle: 135, stops: [{ color: '#8b5cf6', position: 0 }, { color: '#a855f7', position: 50 }, { color: '#d946ef', position: 100 }] } 
  },
  { 
    name: 'Ocean', 
    gradient: { type: 'linear', angle: 135, stops: [{ color: '#06b6d4', position: 0 }, { color: '#3b82f6', position: 50 }, { color: '#8b5cf6', position: 100 }] } 
  },
  { 
    name: 'Sunset', 
    gradient: { type: 'linear', angle: 135, stops: [{ color: '#f97316', position: 0 }, { color: '#ef4444', position: 50 }, { color: '#ec4899', position: 100 }] } 
  },
  { 
    name: 'Steel', 
    gradient: { type: 'linear', angle: 180, stops: [{ color: '#374151', position: 0 }, { color: '#1f2937', position: 100 }] } 
  },
  { 
    name: 'Neon Green', 
    gradient: { type: 'linear', angle: 135, stops: [{ color: '#10b981', position: 0 }, { color: '#22d3ee', position: 100 }] } 
  },
  { 
    name: 'Dark Fade', 
    gradient: { type: 'linear', angle: 180, stops: [{ color: '#1f2937', position: 0 }, { color: '#030712', position: 100 }] } 
  },
  { 
    name: 'Sky', 
    gradient: { type: 'linear', angle: 135, stops: [{ color: '#0ea5e9', position: 0 }, { color: '#38bdf8', position: 100 }] } 
  },
  { 
    name: 'Teal', 
    gradient: { type: 'linear', angle: 135, stops: [{ color: '#14b8a6', position: 0 }, { color: '#06b6d4', position: 50 }, { color: '#0ea5e9', position: 100 }] } 
  },
  { 
    name: 'Midnight', 
    gradient: { type: 'radial', angle: 0, stops: [{ color: '#1e3a8a', position: 0 }, { color: '#0f172a', position: 100 }] } 
  },
];

/**
 * CSS string gradient presets for inspector panels
 */
export const inspectorGradientPresets = [
  { name: 'Indigo', value: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)' },
  { name: 'Night', value: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
  { name: 'Purple', value: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' },
] as const;

// =============================================================================
// SHADOW PRESETS
// =============================================================================

export interface TextShadowPreset {
  label: string;
  value: string;
  css: string;
}

export const textShadowPresets: TextShadowPreset[] = [
  { label: 'None', value: 'none', css: 'none' },
  { label: 'Subtle', value: 'subtle', css: '0 1px 2px rgba(0, 0, 0, 0.15)' },
  { label: 'Medium', value: 'medium', css: '0 2px 4px rgba(0, 0, 0, 0.25)' },
  { label: 'Strong', value: 'strong', css: '0 4px 8px rgba(0, 0, 0, 0.4)' },
  { label: 'Glow', value: 'glow', css: '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3), 0 0 30px rgba(255, 255, 255, 0.2)' },
  { label: 'Neon', value: 'neon', css: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor' },
  { label: '3D Depth', value: 'depth', css: '0 1px 0 rgba(0, 0, 0, 0.1), 0 2px 0 rgba(0, 0, 0, 0.08), 0 3px 0 rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.15)' },
];

export interface BlockShadowPreset {
  label: string;
  value: string;
}

export const blockShadowPresets: BlockShadowPreset[] = [
  { label: 'None', value: 'none' },
  { label: 'Subtle', value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large', value: 'lg' },
  { label: 'X-Large', value: 'xl' },
  { label: '2X-Large', value: '2xl' },
  { label: 'Inner', value: 'inner' },
  { label: 'Glow', value: 'glow' },
];

// =============================================================================
// FONT PRESETS
// =============================================================================

export const fontSizeOptions = [
  { label: 'XS', value: '12px' },
  { label: 'SM', value: '14px' },
  { label: 'Base', value: '16px' },
  { label: 'LG', value: '18px' },
  { label: 'XL', value: '20px' },
  { label: '2XL', value: '24px' },
  { label: '3XL', value: '30px' },
  { label: '4XL', value: '36px' },
  { label: '5XL', value: '48px' },
  { label: '6XL', value: '60px' },
  { label: '7XL', value: '72px' },
  { label: '8XL', value: '96px' },
] as const;

export const fontWeightOptions = [
  { label: 'Light', value: '300' },
  { label: 'Normal', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Black', value: '900' },
] as const;

export const letterSpacingOptions = [
  { label: 'Tight', value: '-0.05em' },
  { label: 'Snug', value: '-0.025em' },
  { label: 'Normal', value: '0em' },
  { label: 'Wide', value: '0.025em' },
  { label: 'Wider', value: '0.05em' },
  { label: 'Widest', value: '0.1em' },
] as const;

export const lineHeightOptions = [
  { label: 'None', value: '1' },
  { label: 'Tight', value: '1.25' },
  { label: 'Snug', value: '1.375' },
  { label: 'Normal', value: '1.5' },
  { label: 'Relaxed', value: '1.625' },
  { label: 'Loose', value: '2' },
] as const;

export const textTransformOptions = [
  { label: 'None', value: 'none' as const },
  { label: 'UPPER', value: 'uppercase' as const },
  { label: 'lower', value: 'lowercase' as const },
  { label: 'Title', value: 'capitalize' as const },
] as const;

export interface FontFamilyOption {
  value: string;
  label: string;
  category?: 'system' | 'display' | 'standard' | 'serif';
}

/**
 * Master font list - ALL editors must use this
 */
export const masterFontFamilies: FontFamilyOption[] = [
  // System
  { value: 'inherit', label: 'Inherit', category: 'system' },
  { value: 'system-ui', label: 'System', category: 'system' },
  // Display fonts (bold, expressive)
  { value: 'Oswald', label: 'Oswald', category: 'display' },
  { value: 'Anton', label: 'Anton', category: 'display' },
  { value: 'Bebas Neue', label: 'Bebas Neue', category: 'display' },
  { value: 'Archivo Black', label: 'Archivo Black', category: 'display' },
  { value: 'Space Grotesk', label: 'Space Grotesk', category: 'display' },
  { value: 'Syne', label: 'Syne', category: 'display' },
  // Standard fonts (readable, professional)
  { value: 'Inter', label: 'Inter', category: 'standard' },
  { value: 'DM Sans', label: 'DM Sans', category: 'standard' },
  { value: 'Roboto', label: 'Roboto', category: 'standard' },
  { value: 'Open Sans', label: 'Open Sans', category: 'standard' },
  { value: 'Poppins', label: 'Poppins', category: 'standard' },
  { value: 'Montserrat', label: 'Montserrat', category: 'standard' },
  { value: 'Lato', label: 'Lato', category: 'standard' },
  { value: 'Raleway', label: 'Raleway', category: 'standard' },
  // Serif
  { value: 'Playfair Display', label: 'Playfair Display', category: 'serif' },
];

/**
 * Compact font list for mobile/toolbar
 */
export const compactFontFamilies: FontFamilyOption[] = [
  { value: 'inherit', label: 'Inherit' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Anton', label: 'Anton' },
  { value: 'Poppins', label: 'Poppins' },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get text shadow CSS by preset value
 */
export const getTextShadowCSS = (value: string): string => {
  const preset = textShadowPresets.find(p => p.value === value);
  return preset?.css || 'none';
};

/**
 * Get block shadow CSS class by preset value
 */
export const getBlockShadowClass = (value: string): string => {
  const shadowMap: Record<string, string> = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
    inner: 'shadow-inner',
    glow: 'shadow-[0_0_20px_rgba(139,92,246,0.3)]',
  };
  return shadowMap[value] || '';
};
