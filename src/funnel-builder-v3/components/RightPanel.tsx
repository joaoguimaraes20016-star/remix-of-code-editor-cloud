/**
 * Funnel Builder v3 - Right Panel (Properties + Add Blocks)
 * Dark charcoal theme matching flow-canvas aesthetic
 */

import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Screen, Block, BlockType, BLOCK_TYPE_CONFIG, SCREEN_TYPE_CONFIG } from '../types/funnel';
import { cn } from '@/lib/utils';
import { CollapsibleSection, InspectorBreadcrumb, EmptyState } from './inspector';

interface RightPanelProps {
  screen: Screen | null;
  block: Block | null;
  onUpdateScreen: (updates: Partial<Screen>) => void;
  onUpdateBlock: (updates: Partial<Block>) => void;
  onAddBlock: (type: BlockType) => void;
  onDeleteBlock: () => void;
  onDuplicateBlock: () => void;
  onClearBlockSelection?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
  onUpdateScreen,
  onUpdateBlock,
  onAddBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onClearBlockSelection,
  isCollapsed = false,
  onToggleCollapse,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<'add' | 'style'>('add');

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
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'add' | 'style')} className="flex flex-col h-full">
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
              Add Blocks
            </button>
            <button 
              onClick={() => setActiveTab('style')}
              className={cn(
                'builder-v3-panel-tab',
                activeTab === 'style' && 'builder-v3-panel-tab--active'
              )}
            >
              {block ? 'Block Style' : 'Screen Style'}
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1 builder-v3-scroll">
          {/* Add Blocks Tab */}
          <TabsContent value="add" className="mt-0 p-4">
            <div className="space-y-4">
              {/* Content Blocks */}
              <div>
                <h3 className="text-[10px] font-medium text-[hsl(var(--builder-v3-text-dim))] uppercase tracking-wider mb-2">
                  Content
                </h3>
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
                            'flex flex-col items-center gap-2 p-3 rounded-lg transition-all',
                            'border border-[hsl(var(--builder-v3-border))]',
                            'bg-[hsl(var(--builder-v3-surface-hover))]',
                            'hover:bg-[hsl(var(--builder-v3-surface-active))]',
                            'hover:border-[hsl(var(--builder-v3-accent)/0.3)]',
                            'text-[hsl(var(--builder-v3-text-secondary))]'
                          )}
                        >
                          <Icon className="h-5 w-5 text-[hsl(var(--builder-v3-text-muted))]" />
                          <span className="text-xs">{config.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Input Blocks */}
              {allowedBlocks.some(type => BLOCK_TYPE_CONFIG[type].category === 'input') && (
                <div>
                  <h3 className="text-[10px] font-medium text-[hsl(var(--builder-v3-text-dim))] uppercase tracking-wider mb-2">
                    Inputs
                  </h3>
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
                              'flex flex-col items-center gap-2 p-3 rounded-lg transition-all',
                              'border border-[hsl(var(--builder-v3-border))]',
                              'bg-[hsl(var(--builder-v3-surface-hover))]',
                              'hover:bg-[hsl(var(--builder-v3-surface-active))]',
                              'hover:border-[hsl(var(--builder-v3-accent)/0.3)]',
                              'text-[hsl(var(--builder-v3-text-secondary))]'
                            )}
                          >
                            <Icon className="h-5 w-5 text-[hsl(var(--builder-v3-text-muted))]" />
                            <span className="text-xs">{config.label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Layout Blocks */}
              {allowedBlocks.some(type => BLOCK_TYPE_CONFIG[type].category === 'layout') && (
                <div>
                  <h3 className="text-[10px] font-medium text-[hsl(var(--builder-v3-text-dim))] uppercase tracking-wider mb-2">
                    Layout
                  </h3>
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
                              'flex flex-col items-center gap-2 p-3 rounded-lg transition-all',
                              'border border-[hsl(var(--builder-v3-border))]',
                              'bg-[hsl(var(--builder-v3-surface-hover))]',
                              'hover:bg-[hsl(var(--builder-v3-surface-active))]',
                              'hover:border-[hsl(var(--builder-v3-accent)/0.3)]',
                              'text-[hsl(var(--builder-v3-text-secondary))]'
                            )}
                          >
                            <Icon className="h-5 w-5 text-[hsl(var(--builder-v3-text-muted))]" />
                            <span className="text-xs">{config.label}</span>
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

      {/* Media Section */}
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
        </CollapsibleSection>
      )}

      {/* Layout Section (spacer) */}
      {block.type === 'spacer' && (
        <CollapsibleSection 
          title="Layout" 
          icon={<Space size={14} />}
          defaultOpen
        >
          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Height (px)</Label>
            <Input
              type="number"
              value={block.props.height || 32}
              onChange={(e) => onUpdate({ props: { ...block.props, height: parseInt(e.target.value) } })}
              min={8}
              max={200}
              className="builder-v3-input builder-v3-control-md"
            />
          </div>
        </CollapsibleSection>
      )}
    </div>
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

      {/* Background Section */}
      <CollapsibleSection 
        title="Background" 
        icon={<Palette size={14} />}
        defaultOpen
      >
        <div className="builder-v3-field-group">
          <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Type</Label>
          <Select
            value={screen.background?.type || 'solid'}
            onValueChange={(value) => onUpdate({ 
              background: { 
                ...screen.background, 
                type: value as 'solid' | 'gradient' | 'image' 
              } 
            })}
          >
            <SelectTrigger className="builder-v3-control-md bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))]">
              <SelectItem value="solid" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Solid Color</SelectItem>
              <SelectItem value="gradient" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Gradient</SelectItem>
              <SelectItem value="image" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Image</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {screen.background?.type === 'solid' && (
          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Color</Label>
            <div className="flex gap-2">
              <div 
                className="builder-v3-color-swatch"
                style={{ background: screen.background?.color || '#ffffff' }}
              >
                <input
                  type="color"
                  value={screen.background?.color || '#ffffff'}
                  onChange={(e) => onUpdate({ 
                    background: { ...screen.background, type: 'solid', color: e.target.value } 
                  })}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
              </div>
              <Input
                value={screen.background?.color || '#ffffff'}
                onChange={(e) => onUpdate({ 
                  background: { ...screen.background, type: 'solid', color: e.target.value } 
                })}
                className="builder-v3-input builder-v3-control-md flex-1"
                placeholder="#ffffff"
              />
            </div>
          </div>
        )}

        {screen.background?.type === 'image' && (
          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Image URL</Label>
            <Input
              value={screen.background?.image || ''}
              onChange={(e) => onUpdate({ 
                background: { ...screen.background, type: 'image', image: e.target.value } 
              })}
              placeholder="https://..."
              className="builder-v3-input builder-v3-control-md"
            />
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
