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

interface RightPanelProps {
  screen: Screen | null;
  block: Block | null;
  onUpdateScreen: (updates: Partial<Screen>) => void;
  onUpdateBlock: (updates: Partial<Block>) => void;
  onAddBlock: (type: BlockType) => void;
  onDeleteBlock: () => void;
  onDuplicateBlock: () => void;
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
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<'add' | 'style'>('add');

  if (!screen) {
    return (
      <div className="w-80 border-l border-[hsl(var(--builder-v3-border))] bg-[hsl(var(--builder-v3-surface))] flex items-center justify-center">
        <p className="text-[hsl(var(--builder-v3-text-muted))] text-sm">Select a screen</p>
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
          <TabsContent value="style" className="mt-0 p-4">
            {block ? (
              <BlockStyleEditor
                block={block}
                onUpdate={onUpdateBlock}
                onDelete={onDeleteBlock}
                onDuplicate={onDuplicateBlock}
              />
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
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDuplicate} 
          className={cn(
            'flex-1',
            'bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))]',
            'text-[hsl(var(--builder-v3-text-secondary))]',
            'hover:text-[hsl(var(--builder-v3-text))] hover:bg-[hsl(var(--builder-v3-surface-active))]'
          )}
        >
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDelete} 
          className={cn(
            'border-[hsl(var(--builder-v3-border))]',
            'text-[hsl(var(--builder-v3-error))]',
            'hover:text-[hsl(var(--builder-v3-error))] hover:bg-[hsl(var(--builder-v3-error)/0.1)]'
          )}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Separator */}
      <div className="h-px bg-[hsl(var(--builder-v3-border))]" />

      {/* Content */}
      {['heading', 'text', 'button'].includes(block.type) && (
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Content</Label>
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
              className="builder-v3-input"
            />
          )}
        </div>
      )}

      {/* Size (for heading/text) */}
      {['heading', 'text'].includes(block.type) && (
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Size</Label>
          <Select
            value={block.props.size || 'md'}
            onValueChange={(value) => onUpdate({ props: { ...block.props, size: value as any } })}
          >
            <SelectTrigger className="bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
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
      )}

      {/* Alignment */}
      {['heading', 'text', 'button'].includes(block.type) && (
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Alignment</Label>
          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map((align) => (
              <Button
                key={align}
                variant="outline"
                size="sm"
                onClick={() => onUpdate({ props: { ...block.props, align } })}
                className={cn(
                  'flex-1 capitalize border-[hsl(var(--builder-v3-border))]',
                  block.props.align === align 
                    ? 'bg-[hsl(var(--builder-v3-accent)/0.15)] text-[hsl(var(--builder-v3-accent))] border-[hsl(var(--builder-v3-accent)/0.3)]'
                    : 'bg-[hsl(var(--builder-v3-surface-hover))] text-[hsl(var(--builder-v3-text-muted))] hover:text-[hsl(var(--builder-v3-text))] hover:bg-[hsl(var(--builder-v3-surface-active))]'
                )}
              >
                {align}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Button Variant */}
      {block.type === 'button' && (
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Style</Label>
          <Select
            value={block.props.variant || 'primary'}
            onValueChange={(value) => onUpdate({ props: { ...block.props, variant: value as any } })}
          >
            <SelectTrigger className="bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
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
      )}

      {/* Input Fields */}
      {block.type === 'input' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Field Type</Label>
            <Select
              value={block.props.inputType || 'text'}
              onValueChange={(value) => onUpdate({ props: { ...block.props, inputType: value as any } })}
            >
              <SelectTrigger className="bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
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
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Placeholder</Label>
            <Input
              value={block.props.placeholder || ''}
              onChange={(e) => onUpdate({ props: { ...block.props, placeholder: e.target.value } })}
              placeholder="Enter placeholder..."
              className="builder-v3-input"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Required</Label>
            <Switch
              checked={block.props.required || false}
              onCheckedChange={(checked) => onUpdate({ props: { ...block.props, required: checked } })}
            />
          </div>
        </>
      )}

      {/* Image */}
      {block.type === 'image' && (
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Image URL</Label>
          <Input
            value={block.props.src || ''}
            onChange={(e) => onUpdate({ props: { ...block.props, src: e.target.value } })}
            placeholder="https://..."
            className="builder-v3-input"
          />
        </div>
      )}

      {/* Video */}
      {block.type === 'video' && (
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Video URL</Label>
          <Input
            value={block.props.src || ''}
            onChange={(e) => onUpdate({ props: { ...block.props, src: e.target.value } })}
            placeholder="https://youtube.com/..."
            className="builder-v3-input"
          />
        </div>
      )}

      {/* Spacer */}
      {block.type === 'spacer' && (
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Height (px)</Label>
          <Input
            type="number"
            value={block.props.height || 32}
            onChange={(e) => onUpdate({ props: { ...block.props, height: parseInt(e.target.value) } })}
            min={8}
            max={200}
            className="builder-v3-input"
          />
        </div>
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
    <div className="space-y-6">
      {/* Screen Name */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Screen Name</Label>
        <Input
          value={screen.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="builder-v3-input"
        />
      </div>

      {/* Separator */}
      <div className="h-px bg-[hsl(var(--builder-v3-border))]" />

      {/* Background */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium flex items-center gap-2 text-[hsl(var(--builder-v3-text))]">
          <Palette className="h-4 w-4 text-[hsl(var(--builder-v3-text-muted))]" />
          Background
        </h3>

        <div className="space-y-1.5">
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
            <SelectTrigger className="bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
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
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={screen.background?.color || '#ffffff'}
                onChange={(e) => onUpdate({ 
                  background: { ...screen.background, type: 'solid', color: e.target.value } 
                })}
                className="h-10 w-14 p-1 cursor-pointer bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))]"
              />
              <Input
                value={screen.background?.color || '#ffffff'}
                onChange={(e) => onUpdate({ 
                  background: { ...screen.background, type: 'solid', color: e.target.value } 
                })}
                className="builder-v3-input flex-1"
                placeholder="#ffffff"
              />
            </div>
          </div>
        )}

        {screen.background?.type === 'image' && (
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Image URL</Label>
            <Input
              value={screen.background?.image || ''}
              onChange={(e) => onUpdate({ 
                background: { ...screen.background, type: 'image', image: e.target.value } 
              })}
              placeholder="https://..."
              className="builder-v3-input"
            />
          </div>
        )}
      </div>
    </div>
  );
}
