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

// Font size options in pixels for inspector
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
