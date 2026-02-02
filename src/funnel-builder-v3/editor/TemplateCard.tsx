import React from 'react';
import { Funnel, Block } from '@/funnel-builder-v3/types/funnel';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

// Template metadata that defines the visual appearance
export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  headline: string;
  category: 'niche' | 'general';
  categoryLabel: string;
  stepCount: number;
  colors: {
    background: string;
    heading: string;
    text: string;
    accent: string;
  };
}

interface TemplateCardProps {
  template: Funnel;
  metadata: TemplateMetadata;
  onSelect: (template: Funnel) => void;
}

// Render abstract representation of each block type with accurate styling
function AbstractBlock({ block, colors, scale = 1 }: { block: Block; colors: TemplateMetadata['colors']; scale?: number }) {
  const type = block.type;

  switch (type) {
    case 'heading':
      const headingContent = block.content as any;
      const headingColor = headingContent?.styles?.color || colors.heading;
      const level = headingContent?.level || 1;
      const width = level === 1 ? 'w-11/12' : level === 2 ? 'w-3/4' : 'w-2/3';
      const headingHeight = level === 1 ? 'h-2' : level === 2 ? 'h-1.5' : 'h-1';
      return (
        <div
          className={cn('rounded-sm mx-auto', width, headingHeight)}
          style={{ backgroundColor: headingColor }}
        />
      );
    
    case 'text':
      const textContent = block.content as any;
      const textColor = textContent?.styles?.color || colors.text;
      return (
        <div className="flex flex-col gap-0.5 mx-2">
          <div 
            className="h-1 rounded-full w-full"
            style={{ backgroundColor: textColor, opacity: 0.6 }}
          />
          <div 
            className="h-1 rounded-full w-5/6"
            style={{ backgroundColor: textColor, opacity: 0.4 }}
          />
        </div>
      );
    
    case 'image':
      return (
        <div 
          className="mx-2 h-8 rounded flex items-center justify-center"
          style={{ backgroundColor: `${colors.text}15` }}
        >
          <div 
            className="w-4 h-4 rounded"
            style={{ backgroundColor: `${colors.accent}30` }}
          />
        </div>
      );
    
    case 'video':
      return (
        <div 
          className="mx-2 h-10 rounded flex items-center justify-center relative"
          style={{ backgroundColor: `${colors.text}20` }}
        >
          <div 
            className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.accent }}
          >
            <div 
              className="w-0 h-0 ml-0.5"
              style={{ 
                borderLeft: `5px solid ${colors.background}`,
                borderTop: '3px solid transparent',
                borderBottom: '3px solid transparent',
              }}
            />
          </div>
        </div>
      );
    
    case 'button':
      const buttonContent = block.content as any;
      const buttonBg = buttonContent?.backgroundColor || colors.accent;
      const buttonTextColor = buttonContent?.color || '#ffffff';
      const buttonRadius = buttonContent?.borderRadius ?? 6;
      return (
        <div 
          className="mx-3 h-4 flex items-center justify-center"
          style={{ 
            backgroundColor: buttonBg, 
            borderRadius: buttonRadius,
          }}
        >
          <div 
            className="h-1 w-10 rounded-full opacity-80"
            style={{ backgroundColor: buttonTextColor }}
          />
        </div>
      );
    
    case 'email-capture':
    case 'phone-capture':
      const captureContent = block.content as any;
      const captureBg = captureContent?.buttonColor || colors.accent;
      return (
        <div className="mx-2 flex gap-1">
          <div 
            className="flex-1 h-3 rounded"
            style={{ backgroundColor: `${colors.text}20` }}
          />
          <div 
            className="w-8 h-3 rounded"
            style={{ backgroundColor: captureBg }}
          />
        </div>
      );
    
    case 'social-proof':
      return (
        <div className="flex justify-center gap-2 mx-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div 
                className="w-4 h-1.5 rounded-sm font-bold"
                style={{ backgroundColor: colors.accent }}
              />
              <div 
                className="w-6 h-0.5 rounded-full opacity-40"
                style={{ backgroundColor: colors.text }}
              />
            </div>
          ))}
        </div>
      );
    
    case 'logo-bar':
      return (
        <div className="flex justify-center gap-1.5 mx-2">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i}
              className="w-3 h-3 rounded opacity-30"
              style={{ backgroundColor: colors.text }}
            />
          ))}
        </div>
      );
    
    case 'quiz':
      return (
        <div className="mx-2 flex flex-col gap-0.5">
          {[1, 2, 3].map(i => (
            <div 
              key={i}
              className="h-2 rounded"
              style={{ backgroundColor: `${colors.text}15`, border: `1px solid ${colors.accent}30` }}
            />
          ))}
        </div>
      );
    
    case 'calendar':
      return (
        <div 
          className="mx-2 h-8 rounded grid grid-cols-7 gap-px p-1"
          style={{ backgroundColor: `${colors.text}10` }}
        >
          {[...Array(14)].map((_, i) => (
            <div 
              key={i}
              className="rounded-sm"
              style={{ backgroundColor: i === 5 ? colors.accent : `${colors.text}20` }}
            />
          ))}
        </div>
      );
    
    case 'countdown':
      const countdownContent = block.content as any;
      const countdownAccent = countdownContent?.textColor || colors.accent;
      return (
        <div 
          className="mx-2 h-4 rounded flex justify-center items-center gap-1"
          style={{ backgroundColor: `${countdownAccent}20` }}
        >
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i}
              className="w-3 h-2.5 rounded-sm flex items-center justify-center"
              style={{ backgroundColor: countdownAccent }}
            >
              <div 
                className="w-1.5 h-0.5 rounded-sm opacity-70"
                style={{ backgroundColor: colors.background }}
              />
            </div>
          ))}
        </div>
      );
    
    case 'accordion':
      return (
        <div className="mx-2 flex flex-col gap-0.5">
          {[1, 2].map(i => (
            <div 
              key={i}
              className="h-2 rounded flex items-center px-1"
              style={{ backgroundColor: `${colors.text}10` }}
            >
              <div 
                className="w-5 h-0.5 rounded-full opacity-50"
                style={{ backgroundColor: colors.text }}
              />
            </div>
          ))}
        </div>
      );
    
    case 'form':
      const formContent = block.content as any;
      const formButtonBg = formContent?.buttonColor || colors.accent;
      return (
        <div className="mx-2 flex flex-col gap-0.5">
          {[1, 2].map(i => (
            <div 
              key={i}
              className="h-2.5 rounded"
              style={{ backgroundColor: `${colors.text}15` }}
            />
          ))}
          <div 
            className="h-3 rounded mt-0.5 flex items-center justify-center"
            style={{ backgroundColor: formButtonBg }}
          >
            <div 
              className="h-1 w-8 rounded-full opacity-80"
              style={{ backgroundColor: colors.background }}
            />
          </div>
        </div>
      );
    
    case 'divider':
      const dividerContent = block.content as any;
      return (
        <div 
          className="mx-3 h-px"
          style={{ backgroundColor: dividerContent?.color || `${colors.text}30` }}
        />
      );
    
    case 'spacer':
      const spacerContent = block.content as any;
      const spacerHeight = Math.min(Math.max(Math.round((spacerContent?.height || 20) / 10), 1), 4);
      return <div style={{ height: `${spacerHeight}px` }} />;
    
    default:
      return null;
  }
}

// Phone mockup that shows the template preview
function PhoneMockup({ blocks, colors, backgroundColor }: { 
  blocks: Block[]; 
  colors: TemplateMetadata['colors'];
  backgroundColor: string;
}) {
  return (
    <div className="relative mx-auto" style={{ width: '140px' }}>
      {/* Phone frame */}
      <div className="relative bg-white rounded-[24px] p-1.5 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-10 flex items-center justify-center">
          <div className="w-6 h-1.5 bg-gray-800 rounded-full" />
        </div>
        
        {/* Screen */}
        <div 
          className="rounded-[20px] overflow-hidden relative"
          style={{ backgroundColor }}
        >
          {/* Status bar */}
          <div className="h-6 flex items-center justify-between px-4 pt-1">
            <span className="text-[8px] font-medium" style={{ color: colors.heading }}>10:55</span>
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: colors.heading, opacity: 0.6 }} />
              <div className="w-1.5 h-2.5 rounded-sm" style={{ backgroundColor: colors.heading, opacity: 0.6 }} />
            </div>
          </div>
          
          {/* Content */}
          <div className="py-2 flex flex-col gap-1.5" style={{ minHeight: '180px' }}>
            {blocks.map((block, index) => (
              <AbstractBlock key={block.id || index} block={block} colors={colors} scale={0.8} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TemplateCard({ template, metadata, onSelect }: TemplateCardProps) {
  const { colors, categoryLabel, headline } = metadata;
  
  // Get first step background and blocks for preview
  const firstStep = template.steps[0];
  const stepBackground = firstStep?.settings?.backgroundColor || colors.background;
  const previewBlocks = firstStep?.blocks
    .filter(b => b.type !== 'spacer')
    .slice(0, 6) || [];

  // Determine text color based on background luminance
  const isLightBg = isLightColor(colors.background);
  const cardTextColor = isLightBg ? colors.heading : '#ffffff';
  const cardSubtextColor = isLightBg ? `${colors.heading}cc` : 'rgba(255,255,255,0.8)';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-300"
      style={{ backgroundColor: colors.background, minHeight: '340px' }}
      onClick={() => onSelect(template)}
    >
      {/* Content area */}
      <div className="px-6 pt-6 pb-4 text-center relative z-10">
        {/* Category label */}
        <span 
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: colors.accent }}
        >
          {categoryLabel}
        </span>
        
        {/* Headline */}
        <h3 
          className="text-xl font-bold mt-2 leading-tight"
          style={{ color: cardTextColor }}
        >
          {headline}
        </h3>
        
        {/* See details link */}
        <button 
          className="mt-3 text-sm font-medium inline-flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"
          style={{ color: cardSubtextColor }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(template);
          }}
        >
          See details
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      
      {/* Phone mockup area */}
      <div className="flex-1 flex items-end justify-center pb-0 pt-2 relative">
        {/* Gradient fade at bottom */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-8 z-10"
          style={{ 
            background: `linear-gradient(to top, ${colors.background}, transparent)` 
          }}
        />
        
        <PhoneMockup 
          blocks={previewBlocks}
          colors={colors}
          backgroundColor={stepBackground}
        />
      </div>
    </motion.div>
  );
}

// Helper to determine if a color is light or dark
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
