// ============================================
// UNIFIED PRESETS - Single source of truth
// ============================================
// ALL color/gradient/font presets MUST be defined here.
// Components should IMPORT from this file, never define their own.
// ============================================

// ===========================================
// MASTER COLOR PALETTE - 48 colors (6 rows x 8 columns)
// ===========================================
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
];

// ===========================================
// COMPACT COLOR PALETTE - 22 colors for toolbars/mobile
// ===========================================
export const compactColorPresets = [
  '#FFFFFF', '#F9FAFB', '#E5E7EB', '#9CA3AF', '#6B7280', '#374151',
  '#111827', '#000000', '#EF4444', '#F97316', '#F59E0B', '#FCD34D',
  '#10B981', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#F472B6',
];

// ===========================================
// INSPECTOR COLOR PALETTE - 25 colors for side panel
// ===========================================
export const inspectorColorPresets = [
  '#ffffff', '#f8fafc', '#e2e8f0', '#94a3b8', '#64748b',
  '#334155', '#1e293b', '#0f172a', '#000000', 'transparent',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
];

// Quick color presets for BACKGROUNDS (solid colors) - vibrant & useful
export const backgroundColorPresets = [
  // Clean neutrals
  '#FFFFFF', '#F8FAFC', '#F1F5F9', 
  // Dark backgrounds
  '#1E293B', '#0F172A', '#030712',
  // Vibrant colors
  '#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899',
];

// Quick color presets for TEXT - high contrast, readable
export const textColorPresets = [
  // Standard text
  '#FFFFFF', '#F9FAFB', '#E5E7EB', '#9CA3AF', '#6B7280', '#374151', '#111827', '#000000',
  // Accent colors
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
];

// Quick color presets for ELEMENTS (buttons, cards, etc.)
export const elementColorPresets = [
  // Brand purples
  '#8B5CF6', '#7C3AED', '#6D28D9',
  // Warm colors
  '#EF4444', '#F97316', '#F59E0B',
  // Cool colors  
  '#3B82F6', '#06B6D4', '#10B981',
  // Pinks
  '#EC4899', '#D946EF',
  // Neutrals
  '#FFFFFF', '#1E293B', '#000000',
];

// Highlight accent presets (for {{text}} syntax)
export const highlightPresets = [
  { color: '#F59E0B', label: 'Gold' },
  { color: '#EF4444', label: 'Red' },
  { color: '#10B981', label: 'Green' },
  { color: '#3B82F6', label: 'Blue' },
  { color: '#8B5CF6', label: 'Purple' },
  { color: '#EC4899', label: 'Pink' },
  { color: '#06B6D4', label: 'Cyan' },
  { color: '#FFFFFF', label: 'White' },
];

// Accent color presets for settings/branding
export const accentColorPresets = [
  { name: 'Cyan', value: '#00d4ff' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Yellow', value: '#eab308' },
];

// Legacy export for backward compatibility
export const colorPresets = textColorPresets;

// ===========================================
// GRADIENT TYPES AND PRESETS
// ===========================================

// Standard gradient value type - use everywhere
export interface GradientValue {
  type: 'linear' | 'radial';
  angle: number;
  stops: Array<{ color: string; position: number }>;
}

// Gradient preset with name
export interface GradientPreset {
  name: string;
  gradient: GradientValue;
}

// Master gradient presets - unified across all pickers
export const masterGradientPresets: GradientPreset[] = [
  // Text/Headline gradients (optimized for text readability)
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
  // Background gradients (more subtle)
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
  // Additional premium gradients
  { 
    name: 'Rose', 
    gradient: { type: 'linear', angle: 135, stops: [{ color: '#ec4899', position: 0 }, { color: '#f472b6', position: 100 }] } 
  },
  { 
    name: 'Aurora', 
    gradient: { type: 'linear', angle: 135, stops: [{ color: '#8b5cf6', position: 0 }, { color: '#06b6d4', position: 50 }, { color: '#10b981', position: 100 }] } 
  },
  { 
    name: 'Midnight', 
    gradient: { type: 'radial', angle: 0, stops: [{ color: '#1e3a8a', position: 0 }, { color: '#0f172a', position: 100 }] } 
  },
];

// CSS string gradient presets for inspector panels
export const inspectorGradientPresets = [
  { name: 'Indigo', value: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)' },
  { name: 'Night', value: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
  { name: 'Purple', value: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' },
];

// Legacy export for backward compatibility
export const gradientPresets = masterGradientPresets;

// ===========================================
// TEXT SHADOW PRESETS
// ===========================================

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

// Compact text shadow presets (without css property) for toolbars
export const compactTextShadowPresets = [
  { label: 'None', value: 'none' },
  { label: 'Subtle', value: 'subtle' },
  { label: 'Medium', value: 'medium' },
  { label: 'Strong', value: 'strong' },
  { label: 'Glow', value: 'glow' },
  { label: 'Neon', value: 'neon' },
  { label: '3D', value: 'depth' },
];

// ===========================================
// BLOCK SHADOW PRESETS
// ===========================================

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
  { label: 'Neon', value: 'neon' },
];

// ===========================================
// FONT PRESETS
// ===========================================

// Font size options (extended for hero headlines)
export const fontSizeOptions = [
  { label: 'S', value: 'sm' as const },
  { label: 'M', value: 'md' as const },
  { label: 'L', value: 'lg' as const },
  { label: 'XL', value: 'xl' as const },
  { label: '2XL', value: '2xl' as const },
  { label: '3XL', value: '3xl' as const },
  { label: '4XL', value: '4xl' as const },
  { label: '5XL', value: '5xl' as const },
];

// Font size options in pixels for inspector (extended range)
export const inspectorFontSizes = [
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
];

// Letter spacing presets
export const letterSpacingOptions = [
  { label: 'Tight', value: '-0.05em' },
  { label: 'Snug', value: '-0.025em' },
  { label: 'Normal', value: '0em' },
  { label: 'Wide', value: '0.025em' },
  { label: 'Wider', value: '0.05em' },
  { label: 'Widest', value: '0.1em' },
  { label: 'Ultra', value: '0.2em' },
];

// Line height presets
export const lineHeightOptions = [
  { label: 'None', value: '1' },
  { label: 'Tight', value: '1.25' },
  { label: 'Snug', value: '1.375' },
  { label: 'Normal', value: '1.5' },
  { label: 'Relaxed', value: '1.625' },
  { label: 'Loose', value: '2' },
];

// Text transform options
export const textTransformOptions = [
  { label: 'None', value: 'none' as const },
  { label: 'UPPER', value: 'uppercase' as const },
  { label: 'lower', value: 'lowercase' as const },
  { label: 'Title', value: 'capitalize' as const },
];

// Font weight numeric values for variable fonts (slider)
export const fontWeightNumericOptions = [
  { label: 'Thin', value: 100 },
  { label: 'Light', value: 300 },
  { label: 'Regular', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'Semibold', value: 600 },
  { label: 'Bold', value: 700 },
  { label: 'Extra Bold', value: 800 },
  { label: 'Black', value: 900 },
];

// Display fonts for hyper-expressive headlines
export const displayFonts = [
  { label: 'Inherit', value: 'inherit', isDisplay: false },
  // Display fonts
  { label: 'Oswald', value: 'Oswald', isDisplay: true },
  { label: 'Anton', value: 'Anton', isDisplay: true },
  { label: 'Bebas Neue', value: 'Bebas Neue', isDisplay: true },
  { label: 'Archivo Black', value: 'Archivo Black', isDisplay: true },
  { label: 'Space Grotesk', value: 'Space Grotesk', isDisplay: true },
  { label: 'Syne', value: 'Syne', isDisplay: true },
  // Standard fonts
  { label: 'Inter', value: 'Inter', isDisplay: false },
  { label: 'DM Sans', value: 'DM Sans', isDisplay: false },
  { label: 'Poppins', value: 'Poppins', isDisplay: false },
  { label: 'Montserrat', value: 'Montserrat', isDisplay: false },
  { label: 'Playfair', value: 'Playfair Display', isDisplay: false },
];

// Compact display fonts for mobile/toolbar
export const compactDisplayFonts = [
  { label: 'Inherit', value: 'inherit' },
  { label: 'Oswald', value: 'Oswald' },
  { label: 'Anton', value: 'Anton' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Poppins', value: 'Poppins' },
];

// Font weight options
export const fontWeightOptions = [
  { label: 'Light', value: '300' },
  { label: 'Normal', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Black', value: '900' },
];

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

// Get text shadow CSS by preset value
export const getTextShadowCSS = (value: string): string => {
  const preset = textShadowPresets.find(p => p.value === value);
  return preset?.css || 'none';
};

// Convert gradient value to CSS string
export const gradientToCSS = (gradient: GradientValue): string => {
  const stopsStr = gradient.stops
    .sort((a, b) => a.position - b.position)
    .map(s => `${s.color} ${s.position}%`)
    .join(', ');
  
  if (gradient.type === 'radial') {
    return `radial-gradient(circle, ${stopsStr})`;
  }
  return `linear-gradient(${gradient.angle}deg, ${stopsStr})`;
};

// Parse CSS gradient string to GradientValue object
export const cssToGradientValue = (css: string): GradientValue | null => {
  if (!css || !css.includes('gradient')) return null;
  
  const isRadial = css.includes('radial');
  const angleMatch = css.match(/(\d+)deg/);
  const angle = angleMatch ? parseInt(angleMatch[1]) : 135;
  
  // Extract color stops
  const stopsRegex = /(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgba?\([^)]+\))\s*(\d+)?%?/g;
  const stops: Array<{ color: string; position: number }> = [];
  let match;
  let index = 0;
  
  while ((match = stopsRegex.exec(css)) !== null) {
    const color = match[1];
    const position = match[2] ? parseInt(match[2]) : (index === 0 ? 0 : 100);
    stops.push({ color, position });
    index++;
  }
  
  if (stops.length < 2) return null;
  
  return {
    type: isRadial ? 'radial' : 'linear',
    angle,
    stops,
  };
};

// Default gradient value
export const defaultGradientValue: GradientValue = {
  type: 'linear',
  angle: 135,
  stops: [
    { color: '#8b5cf6', position: 0 },
    { color: '#d946ef', position: 100 },
  ],
};

// ===========================================
// MASTER FONT FAMILY PRESETS
// ===========================================

export interface FontFamilyOption {
  value: string;
  label: string;
  category?: 'system' | 'display' | 'standard' | 'serif';
}

// Master font list - ALL editors must use this
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
  // Serif/Display
  { value: 'Playfair Display', label: 'Playfair Display', category: 'serif' },
];

// Compact font list for settings/global (most common)
export const compactFontFamilies: FontFamilyOption[] = masterFontFamilies.filter(
  f => ['inherit', 'system-ui', 'Inter', 'DM Sans', 'Poppins', 'Montserrat', 'Playfair Display', 'Oswald', 'Space Grotesk'].includes(f.value)
);

// Settings font options (without 'inherit')
export const settingsFontFamilies: FontFamilyOption[] = masterFontFamilies.filter(
  f => f.value !== 'inherit'
);

// ===========================================
// BOX SHADOW CSS PRESETS
// ===========================================

// CSS string values for box shadows
export const boxShadowCSS: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  glow: '0 0 20px rgba(139, 92, 246, 0.35)',
  neon: '0 0 10px currentColor, 0 0 20px currentColor',
};

// Inspector shadow presets with Tailwind class mapping
export const inspectorShadowPresets = [
  { value: 'none' as const, label: 'None', preview: 'shadow-none' },
  { value: 'sm' as const, label: 'S', preview: 'shadow-sm' },
  { value: 'md' as const, label: 'M', preview: 'shadow-md' },
  { value: 'lg' as const, label: 'L', preview: 'shadow-lg' },
  { value: 'xl' as const, label: 'XL', preview: 'shadow-xl' },
];

// Multi-layer shadow presets for advanced editor
export interface ShadowLayer {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  inset?: boolean;
}

export const advancedShadowPresets: { label: string; layers: ShadowLayer[] }[] = [
  { label: 'None', layers: [] },
  { label: 'Subtle', layers: [{ x: 0, y: 1, blur: 3, spread: 0, color: 'rgba(0, 0, 0, 0.1)' }] },
  { label: 'Medium', layers: [{ x: 0, y: 4, blur: 6, spread: -1, color: 'rgba(0, 0, 0, 0.1)' }, { x: 0, y: 2, blur: 4, spread: -1, color: 'rgba(0, 0, 0, 0.06)' }] },
  { label: 'Large', layers: [{ x: 0, y: 10, blur: 15, spread: -3, color: 'rgba(0, 0, 0, 0.1)' }, { x: 0, y: 4, blur: 6, spread: -2, color: 'rgba(0, 0, 0, 0.05)' }] },
  { label: 'Elevated', layers: [{ x: 0, y: 20, blur: 25, spread: -5, color: 'rgba(0, 0, 0, 0.1)' }, { x: 0, y: 8, blur: 10, spread: -6, color: 'rgba(0, 0, 0, 0.1)' }] },
  { label: 'Glow', layers: [{ x: 0, y: 0, blur: 20, spread: 0, color: 'rgba(139, 92, 246, 0.35)' }] },
  { label: 'Inset', layers: [{ x: 0, y: 2, blur: 4, spread: 0, color: 'rgba(0, 0, 0, 0.1)', inset: true }] },
];

// Convert shadow layers to CSS box-shadow string
export const shadowLayersToCSS = (layers: ShadowLayer[]): string => {
  if (!layers || layers.length === 0) return 'none';
  
  return layers
    .map(layer => {
      const inset = layer.inset ? 'inset ' : '';
      return `${inset}${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px ${layer.color}`;
    })
    .join(', ');
};

// ===========================================
// BORDER RADIUS PRESETS
// ===========================================

// Unified radius constraints
export const RADIUS_MAX = 50;
export const RADIUS_STEP = 2;

export const radiusPresets = [
  { value: 0, label: 'None' },
  { value: 4, label: 'XS' },
  { value: 8, label: 'SM' },
  { value: 12, label: 'MD' },
  { value: 16, label: 'LG' },
  { value: 24, label: 'XL' },
  { value: 32, label: '2XL' },
  { value: 9999, label: 'Full' },
];

// Named radius presets for buttons/inputs
export const namedRadiusPresets = [
  { value: 'none', label: 'Square', px: 0 },
  { value: 'sm', label: 'Subtle', px: 4 },
  { value: 'md', label: 'Medium', px: 8 },
  { value: 'lg', label: 'Large', px: 12 },
  { value: 'xl', label: 'Extra Large', px: 16 },
  { value: 'full', label: 'Pill', px: 9999 },
];

// ===========================================
// ANIMATION & EASING PRESETS
// ===========================================

// Master easing map - cubic-bezier values
export const easingMap: Record<string, string> = {
  'linear': 'linear',
  'ease': 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
};

// Easing options for dropdowns
export const easingOptions = [
  { value: 'ease', label: 'Ease' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
  { value: 'linear', label: 'Linear' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'spring', label: 'Spring' },
];

// Animation repeat options
export const repeatOptions = [
  { value: 'once', label: 'Once' },
  { value: 'loop', label: 'Loop' },
  { value: 'hover', label: 'On Hover' },
];

// Transition timing
export const transitionDurations = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

// ===========================================
// SPACING & PADDING PRESETS
// ===========================================

// Unified spacing constraints
export const SPACING_MAX = 100;
export const SPACING_STEP = 4;

export const spacingPresets = [
  { value: 0, label: 'None' },
  { value: 8, label: 'XS' },
  { value: 16, label: 'SM' },
  { value: 24, label: 'MD' },
  { value: 32, label: 'LG' },
  { value: 48, label: 'XL' },
  { value: 64, label: '2XL' },
  { value: 80, label: '3XL' },
];

// Container padding presets
export const containerPaddingPresets = [
  { value: 0, label: 'None' },
  { value: 16, label: 'Tight' },
  { value: 24, label: 'Compact' },
  { value: 32, label: 'Normal' },
  { value: 48, label: 'Spacious' },
  { value: 64, label: 'Generous' },
];

// ===========================================
// BUTTON STYLE PRESETS
// ===========================================

export const buttonVariantPresets = [
  { value: 'primary', label: 'Primary', description: 'Solid primary color' },
  { value: 'secondary', label: 'Secondary', description: 'Muted background' },
  { value: 'outline', label: 'Outline', description: 'Border only' },
  { value: 'ghost', label: 'Ghost', description: 'Transparent' },
  { value: 'gradient', label: 'Gradient', description: 'Custom gradient' },
  { value: 'custom', label: 'Custom', description: 'Full control' },
];

export const buttonSizePresets = [
  { value: 'sm', label: 'Small', height: 36 },
  { value: 'md', label: 'Medium', height: 40 },
  { value: 'lg', label: 'Large', height: 48 },
  { value: 'xl', label: 'Extra Large', height: 56 },
];

export const buttonShadowPresets = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Subtle' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'glow', label: 'Glow' },
];

// ===========================================
// GRADIENT DIRECTION PRESETS
// ===========================================

export const gradientDirections = [
  { value: 'to bottom', label: 'Top to Bottom' },
  { value: 'to top', label: 'Bottom to Top' },
  { value: 'to right', label: 'Left to Right' },
  { value: 'to left', label: 'Right to Left' },
  { value: 'to bottom right', label: 'Diagonal ↘' },
  { value: 'to bottom left', label: 'Diagonal ↙' },
  { value: 'to top right', label: 'Diagonal ↗' },
  { value: 'to top left', label: 'Diagonal ↖' },
];

// Legacy two-stop gradient presets (for backwards compatibility)
export const legacyGradientPresets = [
  { from: '#667eea', to: '#764ba2', label: 'Purple Dream' },
  { from: '#f093fb', to: '#f5576c', label: 'Pink Sunset' },
  { from: '#4facfe', to: '#00f2fe', label: 'Ocean Blue' },
  { from: '#43e97b', to: '#38f9d7', label: 'Fresh Mint' },
  { from: '#fa709a', to: '#fee140', label: 'Warm Glow' },
  { from: '#a8edea', to: '#fed6e3', label: 'Soft Pastel' },
  { from: '#ff0844', to: '#ffb199', label: 'Coral Fire' },
  { from: '#0f0c29', to: '#302b63', label: 'Dark Night' },
];

// ===========================================
// BUTTON ANIMATION PRESETS
// ===========================================

export const buttonAnimationOptions = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade In' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'scale', label: 'Scale' },
];

export const buttonHoverOptions = [
  { value: 'none', label: 'None' },
  { value: 'glow', label: 'Glow' },
  { value: 'lift', label: 'Lift' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'shine', label: 'Shine' },
];
