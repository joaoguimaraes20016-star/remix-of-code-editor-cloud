/**
 * Funnel Builder v3 - Right Panel (Properties + Add Blocks + Settings)
 * Dark charcoal theme matching flow-canvas aesthetic
 */

import { useState, useEffect } from 'react';
import { useInspectorAutoTab } from './inspector/hooks/useInspectorAutoTab';
import { 
  Heading, 
  Type, 
  Image, 
  Video, 
  MousePointer, 
  Minus, 
  Space, 
  TextCursor, 
  ListChecks,
  Code,
  Trash2,
  Copy,
  Palette,
  Star,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MousePointerClick,
  Plus,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Send,
  Link,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Screen, Block, BlockType, ButtonAction, FunnelSettings, BLOCK_TYPE_CONFIG, SCREEN_TYPE_CONFIG } from '../types/funnel';
import { cn } from '@/lib/utils';
import { 
  CollapsibleSection, 
  InspectorBreadcrumb, 
  EmptyState,
  ScreenBackgroundEditor,
  BlockAnimationEditor,
  GlobalStylesEditor,
} from './inspector';

interface RightPanelProps {
  screen: Screen | null;
  block: Block | null;
  funnelSettings?: FunnelSettings;
  onUpdateScreen: (updates: Partial<Screen>) => void;
  onUpdateBlock: (updates: Partial<Block>) => void;
  onUpdateSettings?: (updates: FunnelSettings) => void;
  onAddBlock: (type: BlockType) => void;
  onDeleteBlock: () => void;
  onDuplicateBlock: () => void;
  onClearBlockSelection?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenSectionPicker?: () => void;
}

const BLOCK_ICONS: Record<BlockType, React.ComponentType<{ className?: string }>> = {
  heading: Heading,
  text: Type,
  image: Image,
  video: Video,
  button: MousePointer,
  divider: Minus,
  spacer: Space,
  input: TextCursor,
  choice: ListChecks,
  embed: Code,
  icon: Star,
};

export function RightPanel({
  screen,
  block,
  funnelSettings,
  onUpdateScreen,
  onUpdateBlock,
  onUpdateSettings,
  onAddBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onClearBlockSelection,
  isCollapsed = false,
  onToggleCollapse,
  onOpenSectionPicker,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<'add' | 'content' | 'style' | 'settings'>('add');
  
  // Auto-switch to style tab when a block is selected
  useInspectorAutoTab(block?.type, setActiveTab);

  if (isCollapsed) {
    return null;
  }

  if (!screen) {
    return (
      <div className="w-80 border-l border-[hsl(var(--builder-v3-border))] bg-[hsl(var(--builder-v3-surface))] flex items-center justify-center">
        <EmptyState
          icon={<MousePointerClick size={24} />}
          title="No screen selected"
          description="Select a screen from the left panel to edit its properties"
        />
      </div>
    );
  }

  const allowedBlocks = SCREEN_TYPE_CONFIG[screen.type].allowedBlocks;

  return (
    <div className="builder-v3-right-panel">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'add' | 'style' | 'settings')} className="flex flex-col h-full">
        {/* Tab Headers */}
        <div className="builder-v3-panel-header">
          <div className="builder-v3-panel-tabs">
            <button 
              onClick={() => setActiveTab('add')}
              className={cn(
                'builder-v3-panel-tab',
                activeTab === 'add' && 'builder-v3-panel-tab--active'
              )}
            >
              Add
            </button>
            <button 
              onClick={() => setActiveTab('style')}
              className={cn(
                'builder-v3-panel-tab',
                activeTab === 'style' && 'builder-v3-panel-tab--active'
              )}
            >
              {block ? 'Block' : 'Screen'}
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={cn(
                'builder-v3-panel-tab',
                activeTab === 'settings' && 'builder-v3-panel-tab--active'
              )}
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1 builder-v3-scroll">
          {/* Add Blocks Tab */}
          <TabsContent value="add" className="mt-0 p-4">
            <div className="space-y-4">
              {/* Browse All Templates Button */}
              {onOpenSectionPicker && (
                <button
                  onClick={onOpenSectionPicker}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 p-3 rounded-xl transition-all',
                    'bg-gradient-to-r from-blue-600 to-indigo-600',
                    'hover:from-blue-500 hover:to-indigo-500',
                    'text-white font-medium text-sm',
                    'shadow-lg shadow-blue-500/25'
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  Browse All Templates
                </button>
              )}

              {/* Content Blocks */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xs font-semibold text-[hsl(var(--builder-v3-text-secondary))]">Content</h3>
                  <span className="text-[9px] font-medium text-[hsl(var(--builder-v3-text-muted))] bg-[hsl(var(--builder-v3-surface-active))] px-1.5 py-0.5 rounded">Display</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {allowedBlocks
                    .filter(type => BLOCK_TYPE_CONFIG[type].category === 'content')
                    .map(type => {
                      const config = BLOCK_TYPE_CONFIG[type];
                      const Icon = BLOCK_ICONS[type];
                      return (
                        <button
                          key={type}
                          onClick={() => onAddBlock(type)}
                          className={cn(
                            'flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all',
                            'bg-slate-800/50 border border-slate-700/50',
                            'hover:bg-slate-700/50 hover:border-slate-600/50',
                            'hover:scale-[1.02] hover:shadow-md',
                            'aspect-square'
                          )}
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-700/50">
                            <Icon className="h-5 w-5 text-slate-300" />
                          </div>
                          <span className="text-xs font-medium text-slate-200">{config.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Input Blocks */}
              {allowedBlocks.some(type => BLOCK_TYPE_CONFIG[type].category === 'input') && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-semibold text-[hsl(var(--builder-v3-text-secondary))]">Inputs</h3>
                    <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Data</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {allowedBlocks
                      .filter(type => BLOCK_TYPE_CONFIG[type].category === 'input')
                      .map(type => {
                        const config = BLOCK_TYPE_CONFIG[type];
                        const Icon = BLOCK_ICONS[type];
                        return (
                          <button
                            key={type}
                            onClick={() => onAddBlock(type)}
                            className={cn(
                              'flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all',
                              'bg-emerald-900/20 border border-emerald-800/30',
                              'hover:bg-emerald-800/30 hover:border-emerald-700/40',
                              'hover:scale-[1.02] hover:shadow-md',
                              'aspect-square'
                            )}
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-800/30">
                              <Icon className="h-5 w-5 text-emerald-400" />
                            </div>
                            <span className="text-xs font-medium text-emerald-300">{config.label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Layout Blocks */}
              {allowedBlocks.some(type => BLOCK_TYPE_CONFIG[type].category === 'layout') && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-semibold text-[hsl(var(--builder-v3-text-secondary))]">Layout</h3>
                    <span className="text-[9px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Structure</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {allowedBlocks
                      .filter(type => BLOCK_TYPE_CONFIG[type].category === 'layout')
                      .map(type => {
                        const config = BLOCK_TYPE_CONFIG[type];
                        const Icon = BLOCK_ICONS[type];
                        return (
                          <button
                            key={type}
                            onClick={() => onAddBlock(type)}
                            className={cn(
                              'flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all',
                              'bg-amber-900/20 border border-amber-800/30',
                              'hover:bg-amber-800/30 hover:border-amber-700/40',
                              'hover:scale-[1.02] hover:shadow-md',
                              'aspect-square'
                            )}
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-800/30">
                              <Icon className="h-5 w-5 text-amber-400" />
                            </div>
                            <span className="text-xs font-medium text-amber-300">{config.label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="mt-0">
            {block ? (
              <>
                <InspectorBreadcrumb
                  screenName={screen.name}
                  blockType={BLOCK_TYPE_CONFIG[block.type]?.label || block.type}
                  onClearSelection={onClearBlockSelection}
                />
                <BlockStyleEditor
                  block={block}
                  onUpdate={onUpdateBlock}
                  onDelete={onDeleteBlock}
                  onDuplicate={onDuplicateBlock}
                />
              </>
            ) : (
              <ScreenStyleEditor
                screen={screen}
                onUpdate={onUpdateScreen}
              />
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-0 p-4">
            {funnelSettings && onUpdateSettings ? (
              <GlobalStylesEditor
                settings={funnelSettings}
                onChange={onUpdateSettings}
              />
            ) : (
              <EmptyState
                icon={<Settings size={24} />}
                title="Funnel Settings"
                description="Global settings not available in this context"
              />
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

// =============================================================================
// BLOCK STYLE EDITOR
// =============================================================================

interface BlockStyleEditorProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function BlockStyleEditor({ block, onUpdate, onDelete, onDuplicate }: BlockStyleEditorProps) {
  return (
    <div className="space-y-0">
      {/* Quick Actions Bar */}
      <div className="builder-v3-quick-actions">
        <button 
          onClick={onDuplicate} 
          className="builder-v3-inspector-action builder-v3-inspector-action--secondary flex-1"
        >
          <Copy size={14} />
          Duplicate
        </button>
        <button 
          onClick={onDelete} 
          className="builder-v3-inspector-action builder-v3-inspector-action--danger"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Content Section - for text/heading/button */}
      {['heading', 'text', 'button'].includes(block.type) && (
        <CollapsibleSection 
          title="Content" 
          icon={<Type size={14} />}
          defaultOpen
        >
          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Text</Label>
            {block.type === 'text' ? (
              <Textarea
                value={block.content}
                onChange={(e) => onUpdate({ content: e.target.value })}
                rows={3}
                className="builder-v3-textarea"
              />
            ) : (
              <Input
                value={block.content}
                onChange={(e) => onUpdate({ content: e.target.value })}
                className="builder-v3-input builder-v3-control-md"
              />
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Typography Section */}
      {['heading', 'text'].includes(block.type) && (
        <CollapsibleSection 
          title="Typography" 
          icon={<Type size={14} />}
        >
          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Size</Label>
            <Select
              value={block.props.size || 'md'}
              onValueChange={(value) => onUpdate({ props: { ...block.props, size: value as any } })}
            >
              <SelectTrigger className="builder-v3-control-md bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))]">
                <SelectItem value="sm" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Small</SelectItem>
                <SelectItem value="md" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Medium</SelectItem>
                <SelectItem value="lg" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Large</SelectItem>
                <SelectItem value="xl" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Extra Large</SelectItem>
                <SelectItem value="2xl" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">2X Large</SelectItem>
                <SelectItem value="3xl" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">3X Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Alignment</Label>
            <div className="builder-v3-toggle-pill w-full">
              {([
                { value: 'left', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'right', icon: AlignRight },
              ] as const).map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => onUpdate({ props: { ...block.props, align: value } })}
                  className={cn(
                    'builder-v3-toggle-option flex-1 flex items-center justify-center',
                    block.props.align === value && 'builder-v3-toggle-option--active'
                  )}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Button Section */}
      {block.type === 'button' && (
        <>
          <CollapsibleSection 
            title="Button Style" 
            icon={<MousePointer size={14} />}
          >
            <div className="builder-v3-field-group">
              <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Variant</Label>
              <Select
                value={block.props.variant || 'primary'}
                onValueChange={(value) => onUpdate({ props: { ...block.props, variant: value as any } })}
              >
                <SelectTrigger className="builder-v3-control-md bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))]">
                  <SelectItem value="primary" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Primary</SelectItem>
                  <SelectItem value="secondary" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Secondary</SelectItem>
                  <SelectItem value="outline" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Outline</SelectItem>
                  <SelectItem value="ghost" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Ghost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="builder-v3-field-group">
              <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Alignment</Label>
              <div className="builder-v3-toggle-pill w-full">
                {([
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight },
                ] as const).map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => onUpdate({ props: { ...block.props, align: value } })}
                    className={cn(
                      'builder-v3-toggle-option flex-1 flex items-center justify-center',
                      block.props.align === value && 'builder-v3-toggle-option--active'
                    )}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          <ButtonActionEditor block={block} onUpdate={onUpdate} />
        </>
      )}

      {/* Input Fields Section */}
      {block.type === 'input' && (
        <CollapsibleSection 
          title="Field Settings" 
          icon={<TextCursor size={14} />}
          defaultOpen
        >
          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Field Type</Label>
            <Select
              value={block.props.inputType || 'text'}
              onValueChange={(value) => onUpdate({ props: { ...block.props, inputType: value as any } })}
            >
              <SelectTrigger className="builder-v3-control-md bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))]">
                <SelectItem value="text" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Text</SelectItem>
                <SelectItem value="email" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Email</SelectItem>
                <SelectItem value="phone" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Phone</SelectItem>
                <SelectItem value="name" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Name</SelectItem>
                <SelectItem value="textarea" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Long Text</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Placeholder</Label>
            <Input
              value={block.props.placeholder || ''}
              onChange={(e) => onUpdate({ props: { ...block.props, placeholder: e.target.value } })}
              placeholder="Enter placeholder..."
              className="builder-v3-input builder-v3-control-md"
            />
          </div>

          <div className="builder-v3-field-row">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Required</Label>
            <Switch
              checked={block.props.required || false}
              onCheckedChange={(checked) => onUpdate({ props: { ...block.props, required: checked } })}
            />
          </div>
        </CollapsibleSection>
      )}

      {/* Media Section - Enhanced */}
      {['image', 'video'].includes(block.type) && (
        <CollapsibleSection 
          title="Media" 
          icon={block.type === 'image' ? <Image size={14} /> : <Video size={14} />}
          defaultOpen
        >
          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">
              {block.type === 'image' ? 'Image URL' : 'Video URL'}
            </Label>
            <Input
              value={block.props.src || ''}
              onChange={(e) => onUpdate({ props: { ...block.props, src: e.target.value } })}
              placeholder={block.type === 'image' ? 'https://...' : 'https://youtube.com/...'}
              className="builder-v3-input builder-v3-control-md"
            />
          </div>

          {block.type === 'image' && (
            <div className="builder-v3-field-group">
              <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Alt Text</Label>
              <Input
                value={block.props.alt || ''}
                onChange={(e) => onUpdate({ props: { ...block.props, alt: e.target.value } })}
                placeholder="Describe the image..."
                className="builder-v3-input builder-v3-control-md"
              />
            </div>
          )}

          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Aspect Ratio</Label>
            <Select
              value={block.props.aspectRatio || 'auto'}
              onValueChange={(value) => onUpdate({ props: { ...block.props, aspectRatio: value as any } })}
            >
              <SelectTrigger className="builder-v3-control-md bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))]">
                <SelectItem value="auto" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Auto</SelectItem>
                <SelectItem value="16:9" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">16:9</SelectItem>
                <SelectItem value="4:3" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">4:3</SelectItem>
                <SelectItem value="1:1" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Square (1:1)</SelectItem>
                <SelectItem value="9:16" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Portrait (9:16)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Object Fit</Label>
            <div className="builder-v3-toggle-pill w-full">
              {(['cover', 'contain', 'fill'] as const).map((fit) => (
                <button
                  key={fit}
                  onClick={() => onUpdate({ props: { ...block.props, objectFit: fit } })}
                  className={cn(
                    'builder-v3-toggle-option flex-1 text-xs capitalize',
                    block.props.objectFit === fit && 'builder-v3-toggle-option--active'
                  )}
                >
                  {fit}
                </button>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Spacer Section - Enhanced with slider */}
      {block.type === 'spacer' && (
        <CollapsibleSection 
          title="Layout" 
          icon={<Space size={14} />}
          defaultOpen
        >
          <div className="builder-v3-field-group">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Height</Label>
              <span className="text-[11px] text-[hsl(var(--builder-v3-text-secondary))]">{block.props.height || 32}px</span>
            </div>
            <input
              type="range"
              min={8}
              max={200}
              step={4}
              value={block.props.height || 32}
              onChange={(e) => onUpdate({ props: { ...block.props, height: parseInt(e.target.value) } })}
              className="builder-v3-slider w-full"
            />
            <div className="flex justify-between text-[9px] text-[hsl(var(--builder-v3-text-dim))] mt-1">
              <span>8px</span>
              <span>200px</span>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Divider Section - Color control */}
      {block.type === 'divider' && (
        <CollapsibleSection 
          title="Divider Style" 
          icon={<Minus size={14} />}
          defaultOpen
        >
          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Color</Label>
            <div className="flex gap-2">
              <div 
                className="builder-v3-color-swatch"
                style={{ background: block.props.color || '#e5e7eb' }}
              >
                <input
                  type="color"
                  value={block.props.color || '#e5e7eb'}
                  onChange={(e) => onUpdate({ props: { ...block.props, color: e.target.value } })}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
              </div>
              <Input
                value={block.props.color || '#e5e7eb'}
                onChange={(e) => onUpdate({ props: { ...block.props, color: e.target.value } })}
                className="builder-v3-input builder-v3-control-md flex-1"
                placeholder="#e5e7eb"
              />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Choice Options Section */}
      {block.type === 'choice' && (
        <ChoiceOptionsEditor block={block} onUpdate={onUpdate} />
      )}
    </div>
  );
}

// =============================================================================
// CHOICE OPTIONS EDITOR
// =============================================================================

interface ChoiceOptionsEditorProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
}

function ChoiceOptionsEditor({ block, onUpdate }: ChoiceOptionsEditorProps) {
  const options = block.props.options || [];

  const addOption = () => {
    const newOption = {
      id: `opt_${Date.now()}`,
      label: `Option ${options.length + 1}`,
      value: `option_${options.length + 1}`,
    };
    onUpdate({ props: { ...block.props, options: [...options, newOption] } });
  };

  const updateOption = (index: number, updates: Partial<typeof options[0]>) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    onUpdate({ props: { ...block.props, options: newOptions } });
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onUpdate({ props: { ...block.props, options: newOptions } });
  };

  return (
    <CollapsibleSection 
      title="Choice Options" 
      icon={<ListChecks size={14} />}
      defaultOpen
    >
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={option.id} className="flex gap-2 items-center">
            <Input
              value={option.label}
              onChange={(e) => updateOption(index, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              className="builder-v3-input builder-v3-control-md flex-1"
              placeholder={`Option ${index + 1}`}
            />
            <button
              onClick={() => removeOption(index)}
              className="builder-v3-icon-btn text-[hsl(var(--builder-v3-error))]"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        <button
          onClick={addOption}
          className="builder-v3-inspector-action builder-v3-inspector-action--secondary w-full mt-2"
        >
          <Plus size={14} />
          Add Option
        </button>
      </div>

      <div className="builder-v3-field-row mt-3">
        <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Multi-select</Label>
        <Switch
          checked={block.props.multiSelect || false}
          onCheckedChange={(checked) => onUpdate({ props: { ...block.props, multiSelect: checked } })}
        />
      </div>

      <div className="builder-v3-field-group mt-3">
        <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Layout</Label>
        <div className="builder-v3-toggle-pill w-full">
          {(['vertical', 'horizontal', 'grid'] as const).map((layout) => (
            <button
              key={layout}
              onClick={() => onUpdate({ props: { ...block.props, layout } })}
              className={cn(
                'builder-v3-toggle-option flex-1 text-xs capitalize',
                block.props.layout === layout && 'builder-v3-toggle-option--active'
              )}
            >
              {layout}
            </button>
          ))}
        </div>
      </div>
    </CollapsibleSection>
  );
}

// =============================================================================
// SCREEN STYLE EDITOR
// =============================================================================

interface ScreenStyleEditorProps {
  screen: Screen;
  onUpdate: (updates: Partial<Screen>) => void;
}

function ScreenStyleEditor({ screen, onUpdate }: ScreenStyleEditorProps) {
  return (
    <div className="space-y-0">
      {/* Screen Info Section */}
      <CollapsibleSection 
        title="Screen Info" 
        icon={<Type size={14} />}
        defaultOpen
      >
        <div className="builder-v3-field-group">
          <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Screen Name</Label>
          <Input
            value={screen.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="builder-v3-input builder-v3-control-md"
          />
        </div>
      </CollapsibleSection>

      {/* Background Section - Using enhanced editor */}
      <CollapsibleSection 
        title="Background" 
        icon={<Palette size={14} />}
        defaultOpen
      >
        <ScreenBackgroundEditor
          background={screen.background}
          onChange={(background) => onUpdate({ background })}
        />
      </CollapsibleSection>
    </div>
  );
}

// =============================================================================
// BUTTON ACTION EDITOR
// =============================================================================

interface ButtonActionEditorProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
}

function ButtonActionEditor({ block, onUpdate }: ButtonActionEditorProps) {
  const action = block.props.action || { type: 'next-screen' };
  const actionType = action.type;

  const handleActionTypeChange = (type: string) => {
    let newAction: ButtonAction;
    switch (type) {
      case 'next-screen':
        newAction = { type: 'next-screen' };
        break;
      case 'previous-screen':
        newAction = { type: 'previous-screen' };
        break;
      case 'go-to-screen':
        newAction = { type: 'go-to-screen', screenId: '' };
        break;
      case 'submit':
        newAction = { type: 'submit' };
        break;
      case 'url':
        newAction = { type: 'url', url: '', openInNewTab: false };
        break;
      default:
        newAction = { type: 'next-screen' };
    }
    onUpdate({ props: { ...block.props, action: newAction } });
  };

  return (
    <CollapsibleSection 
      title="Button Action" 
      icon={<Link size={14} />}
      defaultOpen
    >
      <div className="builder-v3-field-group">
        <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">On Click</Label>
        <Select
          value={actionType}
          onValueChange={handleActionTypeChange}
        >
          <SelectTrigger className="builder-v3-control-md bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))]">
            <SelectItem value="next-screen" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">
              <div className="flex items-center gap-2">
                <ArrowRight size={12} />
                Next Screen
              </div>
            </SelectItem>
            <SelectItem value="previous-screen" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">
              <div className="flex items-center gap-2">
                <ArrowLeft size={12} />
                Previous Screen
              </div>
            </SelectItem>
            <SelectItem value="submit" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">
              <div className="flex items-center gap-2">
                <Send size={12} />
                Submit Form
              </div>
            </SelectItem>
            <SelectItem value="url" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">
              <div className="flex items-center gap-2">
                <ExternalLink size={12} />
                Open URL
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {actionType === 'url' && action.type === 'url' && (
        <>
          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">URL</Label>
            <Input
              value={action.url || ''}
              onChange={(e) => onUpdate({ 
                props: { 
                  ...block.props, 
                  action: { ...action, url: e.target.value } 
                } 
              })}
              placeholder="https://..."
              className="builder-v3-input builder-v3-control-md"
            />
          </div>
          <div className="builder-v3-field-row">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Open in New Tab</Label>
            <Switch
              checked={action.openInNewTab || false}
              onCheckedChange={(checked) => onUpdate({ 
                props: { 
                  ...block.props, 
                  action: { ...action, openInNewTab: checked } 
                } 
              })}
            />
          </div>
        </>
      )}
    </CollapsibleSection>
  );
}
