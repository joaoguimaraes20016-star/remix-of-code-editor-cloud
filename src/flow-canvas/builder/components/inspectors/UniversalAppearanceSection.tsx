import React from 'react';
import { Element } from '../../../types/infostack';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Eye, 
  Square, 
  Monitor, 
  Tablet, 
  Smartphone,
  RotateCw,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ColorPickerPopover } from '../modals';

interface UniversalAppearanceSectionProps {
  element: Element;
  onUpdate: (updates: Partial<Element>) => void;
}

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  icon,
  defaultOpen = false, 
  children,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="inspector-section">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="inspector-section-header w-full"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-builder-text-muted">{icon}</span>}
          <span className="text-xs font-medium text-builder-text">{title}</span>
        </div>
        <svg 
          className={cn("w-3.5 h-3.5 text-builder-text-dim transition-transform", isOpen && "rotate-90")}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {isOpen && (
        <div className="inspector-section-content animate-in">
          {children}
        </div>
      )}
    </div>
  );
};

export const UniversalAppearanceSection: React.FC<UniversalAppearanceSectionProps> = ({
  element,
  onUpdate,
}) => {
  const handleStyleChange = (key: string, value: string) => {
    onUpdate({ styles: { ...element.styles, [key]: value } });
  };

  const handlePropsChange = (key: string, value: unknown) => {
    onUpdate({ props: { ...element.props, [key]: value } });
  };

  // Parse numeric values from styles
  const opacity = typeof element.styles?.opacity === 'string' 
    ? parseInt(element.styles.opacity) 
    : (element.styles?.opacity as number) ?? 100;
  const rotation = typeof element.styles?.rotate === 'string'
    ? parseInt(element.styles.rotate)
    : (element.styles?.rotate as number) ?? 0;
  const blur = (element.props?.blur as number) ?? 0;
  const brightness = (element.props?.brightness as number) ?? 100;
  
  return (
    <>
      {/* ========== APPEARANCE SECTION ========== */}
      <CollapsibleSection title="Appearance" icon={<Eye className="w-4 h-4" />}>
        <div className="pt-3 space-y-4">
          {/* Opacity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Opacity</span>
              <span className="text-xs font-mono text-builder-text-dim">{opacity}%</span>
            </div>
            <Slider 
              value={[opacity]}
              onValueChange={(v) => handleStyleChange('opacity', String(v[0]))}
              min={0} max={100} step={5}
              className="w-full"
            />
          </div>
          
          {/* Rotation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-builder-text-muted" />
                <span className="text-xs text-builder-text-muted">Rotation</span>
              </div>
              <span className="text-xs font-mono text-builder-text-dim">{rotation}°</span>
            </div>
            <Slider 
              value={[rotation]}
              onValueChange={(v) => handleStyleChange('rotate', String(v[0]))}
              min={0} max={360} step={5}
              className="w-full"
            />
          </div>
          
          {/* Blur */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Blur</span>
              <span className="text-xs font-mono text-builder-text-dim">{blur}px</span>
            </div>
            <Slider 
              value={[blur]}
              onValueChange={(v) => handlePropsChange('blur', v[0])}
              min={0} max={20} step={1}
              className="w-full"
            />
          </div>
          
          {/* Brightness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Brightness</span>
              <span className="text-xs font-mono text-builder-text-dim">{brightness}%</span>
            </div>
            <Slider 
              value={[brightness]}
              onValueChange={(v) => handlePropsChange('brightness', v[0])}
              min={50} max={150} step={5}
              className="w-full"
            />
          </div>
          
          {/* Shadow Preset */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Shadow</span>
            <Select 
              value={(element.props?.shadowPreset as string) || 'none'}
              onValueChange={(value) => handlePropsChange('shadowPreset', value)}
            >
              <SelectTrigger className="builder-input w-24"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">X-Large</SelectItem>
                <SelectItem value="2xl">2X-Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Z-Index */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-builder-text-muted" />
              <span className="text-xs text-builder-text-muted">Layer</span>
            </div>
            <Select 
              value={String(element.styles?.zIndex || 'auto')}
              onValueChange={(value) => handleStyleChange('zIndex', value)}
            >
              <SelectTrigger className="builder-input w-20"><SelectValue placeholder="Auto" /></SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleSection>

      {/* ========== BORDER SECTION ========== */}
      <CollapsibleSection title="Border" icon={<Square className="w-4 h-4" />}>
        <div className="pt-3 space-y-3">
          {/* Border Width */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Width</span>
            <Select 
              value={(element.styles?.borderWidth as string) || '0px'}
              onValueChange={(value) => handleStyleChange('borderWidth', value)}
            >
              <SelectTrigger className="builder-input w-20"><SelectValue placeholder="0px" /></SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="0px">None</SelectItem>
                <SelectItem value="1px">1px</SelectItem>
                <SelectItem value="2px">2px</SelectItem>
                <SelectItem value="3px">3px</SelectItem>
                <SelectItem value="4px">4px</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Border Style */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Style</span>
            <Select 
              value={(element.styles?.borderStyle as string) || 'solid'}
              onValueChange={(value) => handleStyleChange('borderStyle', value)}
            >
              <SelectTrigger className="builder-input w-20"><SelectValue placeholder="Solid" /></SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Border Color */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Color</span>
            <ColorPickerPopover 
              color={(element.styles?.borderColor as string) || '#e5e7eb'}
              onChange={(color) => handleStyleChange('borderColor', color)}
            >
              <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                <div 
                  className="w-6 h-6 rounded-md border border-builder-border" 
                  style={{ backgroundColor: (element.styles?.borderColor as string) || '#e5e7eb' }} 
                />
                <span className="text-xs text-builder-text-muted">Edit</span>
              </button>
            </ColorPickerPopover>
          </div>
          
          {/* Border Radius */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Radius</span>
              <span className="text-xs font-mono text-builder-text-dim">
                {element.styles?.borderRadius || '0px'}
              </span>
            </div>
            <Slider 
              value={[parseInt((element.styles?.borderRadius as string) || '0')]}
              onValueChange={(v) => handleStyleChange('borderRadius', `${v[0]}px`)}
              min={0} max={50} step={2}
              className="w-full"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* ========== RESPONSIVE VISIBILITY SECTION ========== */}
      <CollapsibleSection title="Responsive" icon={<Sparkles className="w-4 h-4" />}>
        <div className="pt-3 space-y-3">
          <p className="text-[10px] text-builder-text-dim">
            Hide this element on specific screen sizes.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePropsChange('hideOnDesktop', !element.props?.hideOnDesktop)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                element.props?.hideOnDesktop 
                  ? 'border-destructive/50 bg-destructive/10 text-destructive' 
                  : 'border-builder-border bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface-active'
              )}
              title="Hide on Desktop"
            >
              <Monitor className="w-4 h-4" />
              <span className="text-[10px]">{element.props?.hideOnDesktop ? 'Hidden' : 'Visible'}</span>
            </button>
            <button
              onClick={() => handlePropsChange('hideOnTablet', !element.props?.hideOnTablet)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                element.props?.hideOnTablet 
                  ? 'border-destructive/50 bg-destructive/10 text-destructive' 
                  : 'border-builder-border bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface-active'
              )}
              title="Hide on Tablet"
            >
              <Tablet className="w-4 h-4" />
              <span className="text-[10px]">{element.props?.hideOnTablet ? 'Hidden' : 'Visible'}</span>
            </button>
            <button
              onClick={() => handlePropsChange('hideOnMobile', !element.props?.hideOnMobile)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                element.props?.hideOnMobile 
                  ? 'border-destructive/50 bg-destructive/10 text-destructive' 
                  : 'border-builder-border bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface-active'
              )}
              title="Hide on Mobile"
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-[10px]">{element.props?.hideOnMobile ? 'Hidden' : 'Visible'}</span>
            </button>
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
};
