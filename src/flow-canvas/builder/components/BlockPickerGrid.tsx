import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, X } from 'lucide-react';

// Block category definition
interface BlockCategory {
  id: string;
  label: string;
  blocks: BlockDefinition[];
}

interface BlockDefinition {
  id: string;
  type: string;
  label: string;
  icon: string; // Emoji for now
  description?: string;
}

// Default block categories for mobile picker
const defaultCategories: BlockCategory[] = [
  {
    id: 'capture',
    label: 'Capture',
    blocks: [
      { id: 'email-capture', type: 'form-field', label: 'Email', icon: '📧' },
      { id: 'phone-capture', type: 'form-field', label: 'Phone', icon: '📱' },
      { id: 'name-capture', type: 'form-field', label: 'Name', icon: '👤' },
      { id: 'form-capture', type: 'form-field', label: 'Form', icon: '📋' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    blocks: [
      { id: 'text-block', type: 'text-block', label: 'Text', icon: '📝' },
      { id: 'heading-block', type: 'heading', label: 'Heading', icon: '🔤' },
      { id: 'button-block', type: 'cta', label: 'Button', icon: '👆' },
      { id: 'list-block', type: 'bullet-list', label: 'List', icon: '📋' },
    ],
  },
  {
    id: 'media',
    label: 'Media',
    blocks: [
      { id: 'image-block', type: 'media', label: 'Image', icon: '🖼️' },
      { id: 'video-block', type: 'video', label: 'Video', icon: '📹' },
      { id: 'icon-block', type: 'icon', label: 'Icon', icon: '⭐' },
    ],
  },
  {
    id: 'layout',
    label: 'Layout',
    blocks: [
      { id: 'hero-section', type: 'hero', label: 'Hero', icon: '🏠' },
      { id: 'columns-block', type: 'columns', label: 'Columns', icon: '📊' },
      { id: 'spacer-block', type: 'spacer', label: 'Spacer', icon: '↕️' },
      { id: 'divider-block', type: 'divider', label: 'Divider', icon: '➖' },
    ],
  },
  {
    id: 'interactive',
    label: 'Interactive',
    blocks: [
      { id: 'calendar-block', type: 'calendar', label: 'Calendar', icon: '📅' },
      { id: 'quiz-block', type: 'application-flow', label: 'Quiz', icon: '❓' },
      { id: 'timer-block', type: 'countdown', label: 'Timer', icon: '⏱️' },
    ],
  },
];

interface BlockPickerGridProps {
  open: boolean;
  onClose: () => void;
  onSelectBlock: (blockType: string) => void;
  categories?: BlockCategory[];
  title?: string;
}

export const BlockPickerGrid: React.FC<BlockPickerGridProps> = ({
  open,
  onClose,
  onSelectBlock,
  categories = defaultCategories,
  title = 'Add Content',
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  if (!open) return null;

  const currentCategory = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)
    : null;

  const handleSelectBlock = (blockType: string) => {
    onSelectBlock(blockType);
    onClose();
    setSelectedCategory(null);
  };

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[hsl(var(--builder-bg))]">
      {/* Header */}
      <div className="block-picker-header">
        <button
          onClick={handleBack}
          className="block-picker-back-btn"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5 text-[hsl(var(--builder-text-muted))]" />
        </button>
        <h2 className="block-picker-title">
          {currentCategory ? currentCategory.label : title}
        </h2>
        <button
          onClick={onClose}
          className="block-picker-back-btn ml-auto"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-[hsl(var(--builder-text-muted))]" />
        </button>
      </div>

      {/* Grid content */}
      <div className="block-picker-grid">
        {currentCategory
          ? // Show blocks in category
            currentCategory.blocks.map((block) => (
              <button
                key={block.id}
                onClick={() => handleSelectBlock(block.type)}
                className="block-picker-tile"
              >
                <span className="block-picker-tile__icon">{block.icon}</span>
                <span className="block-picker-tile__label">{block.label}</span>
              </button>
            ))
          : // Show categories
            categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="block-picker-tile"
              >
                <span className="block-picker-tile__icon">
                  {category.blocks[0]?.icon || '📦'}
                </span>
                <span className="block-picker-tile__label">{category.label}</span>
              </button>
            ))}
      </div>
    </div>
  );
};

// Simplified tile button for inline use
interface BlockTileProps {
  icon: string;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}

export const BlockTile: React.FC<BlockTileProps> = ({
  icon,
  label,
  onClick,
  isActive = false,
}) => (
  <button
    onClick={onClick}
    className={cn(
      "block-picker-tile",
      isActive && "border-[hsl(var(--builder-accent))] bg-[hsl(var(--builder-accent)/0.1)]"
    )}
  >
    <span className="block-picker-tile__icon">{icon}</span>
    <span className="block-picker-tile__label">{label}</span>
  </button>
);
