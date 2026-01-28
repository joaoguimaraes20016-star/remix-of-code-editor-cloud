/**
 * Funnel Builder v3 - Right Panel (Properties + Add Blocks)
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
  Settings,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
      <div className="w-80 border-l border-border bg-card flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Select a screen</p>
      </div>
    );
  }

  const allowedBlocks = SCREEN_TYPE_CONFIG[screen.type].allowedBlocks;

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col shrink-0">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'add' | 'style')} className="flex flex-col h-full">
        {/* Tab Headers */}
        <div className="h-12 px-4 flex items-center border-b border-border">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add" className="text-xs">
              Add Blocks
            </TabsTrigger>
            <TabsTrigger value="style" className="text-xs">
              {block ? 'Block Style' : 'Screen Style'}
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Add Blocks Tab */}
          <TabsContent value="add" className="mt-0 p-4">
            <div className="space-y-4">
              {/* Content Blocks */}
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
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
                          className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                        >
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs">{config.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Input Blocks */}
              {allowedBlocks.some(type => BLOCK_TYPE_CONFIG[type].category === 'input') && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
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
                            className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                          >
                            <Icon className="h-5 w-5 text-muted-foreground" />
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
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
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
                            className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                          >
                            <Icon className="h-5 w-5 text-muted-foreground" />
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
        <Button variant="outline" size="sm" onClick={onDuplicate} className="flex-1">
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* Content */}
      {['heading', 'text', 'button'].includes(block.type) && (
        <div className="space-y-2">
          <Label>Content</Label>
          {block.type === 'text' ? (
            <Textarea
              value={block.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              rows={3}
            />
          ) : (
            <Input
              value={block.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
            />
          )}
        </div>
      )}

      {/* Size (for heading/text) */}
      {['heading', 'text'].includes(block.type) && (
        <div className="space-y-2">
          <Label>Size</Label>
          <Select
            value={block.props.size || 'md'}
            onValueChange={(value) => onUpdate({ props: { ...block.props, size: value as any } })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="md">Medium</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
              <SelectItem value="xl">Extra Large</SelectItem>
              <SelectItem value="2xl">2X Large</SelectItem>
              <SelectItem value="3xl">3X Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Alignment */}
      {['heading', 'text', 'button'].includes(block.type) && (
        <div className="space-y-2">
          <Label>Alignment</Label>
          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map((align) => (
              <Button
                key={align}
                variant={block.props.align === align ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdate({ props: { ...block.props, align } })}
                className="flex-1 capitalize"
              >
                {align}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Button Variant */}
      {block.type === 'button' && (
        <div className="space-y-2">
          <Label>Style</Label>
          <Select
            value={block.props.variant || 'primary'}
            onValueChange={(value) => onUpdate({ props: { ...block.props, variant: value as any } })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="ghost">Ghost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Input Fields */}
      {block.type === 'input' && (
        <>
          <div className="space-y-2">
            <Label>Field Type</Label>
            <Select
              value={block.props.inputType || 'text'}
              onValueChange={(value) => onUpdate({ props: { ...block.props, inputType: value as any } })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="textarea">Long Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Placeholder</Label>
            <Input
              value={block.props.placeholder || ''}
              onChange={(e) => onUpdate({ props: { ...block.props, placeholder: e.target.value } })}
              placeholder="Enter placeholder..."
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Required</Label>
            <Switch
              checked={block.props.required || false}
              onCheckedChange={(checked) => onUpdate({ props: { ...block.props, required: checked } })}
            />
          </div>
        </>
      )}

      {/* Image */}
      {block.type === 'image' && (
        <div className="space-y-2">
          <Label>Image URL</Label>
          <Input
            value={block.props.src || ''}
            onChange={(e) => onUpdate({ props: { ...block.props, src: e.target.value } })}
            placeholder="https://..."
          />
        </div>
      )}

      {/* Video */}
      {block.type === 'video' && (
        <div className="space-y-2">
          <Label>Video URL</Label>
          <Input
            value={block.props.src || ''}
            onChange={(e) => onUpdate({ props: { ...block.props, src: e.target.value } })}
            placeholder="https://youtube.com/..."
          />
        </div>
      )}

      {/* Spacer */}
      {block.type === 'spacer' && (
        <div className="space-y-2">
          <Label>Height (px)</Label>
          <Input
            type="number"
            value={block.props.height || 32}
            onChange={(e) => onUpdate({ props: { ...block.props, height: parseInt(e.target.value) } })}
            min={8}
            max={200}
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
      <div className="space-y-2">
        <Label>Screen Name</Label>
        <Input
          value={screen.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
      </div>

      <Separator />

      {/* Background */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Background
        </h3>

        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={screen.background?.type || 'solid'}
            onValueChange={(value) => onUpdate({ 
              background: { 
                ...screen.background, 
                type: value as 'solid' | 'gradient' | 'image' 
              } 
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Solid Color</SelectItem>
              <SelectItem value="gradient">Gradient</SelectItem>
              <SelectItem value="image">Image</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {screen.background?.type === 'solid' && (
          <div className="space-y-2">
            <Label>Color</Label>
            <Input
              type="color"
              value={screen.background?.color || '#ffffff'}
              onChange={(e) => onUpdate({ 
                background: { ...screen.background, type: 'solid', color: e.target.value } 
              })}
              className="h-10 w-full"
            />
          </div>
        )}

        {screen.background?.type === 'image' && (
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input
              value={screen.background?.image || ''}
              onChange={(e) => onUpdate({ 
                background: { ...screen.background, type: 'image', image: e.target.value } 
              })}
              placeholder="https://..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
