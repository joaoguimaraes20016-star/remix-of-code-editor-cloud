import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Check, CircleCheck, BadgeCheck, CheckCircle2, Star, Heart, ThumbsUp,
  ArrowRight, ChevronRight, MoveRight, ArrowRightCircle,
  Trophy, Medal, Crown, Award, Target, Flame,
  Zap, Rocket, Sparkles, Wand2,
  Shield, ShieldCheck, Lock, Key,
  MessageCircle, Bell, Mail,
  Gift, Gem, Lightbulb, Bookmark,
  Smile, Image as ImageIcon, Upload
} from 'lucide-react';

// Icon library with categories
const iconLibrary = {
  essentials: [
    { name: 'check', icon: Check },
    { name: 'circle-check', icon: CircleCheck },
    { name: 'badge-check', icon: BadgeCheck },
    { name: 'check-circle-2', icon: CheckCircle2 },
    { name: 'star', icon: Star },
    { name: 'heart', icon: Heart },
    { name: 'thumbs-up', icon: ThumbsUp },
  ],
  arrows: [
    { name: 'arrow-right', icon: ArrowRight },
    { name: 'chevron-right', icon: ChevronRight },
    { name: 'move-right', icon: MoveRight },
    { name: 'arrow-right-circle', icon: ArrowRightCircle },
  ],
  achievement: [
    { name: 'trophy', icon: Trophy },
    { name: 'medal', icon: Medal },
    { name: 'crown', icon: Crown },
    { name: 'award', icon: Award },
    { name: 'target', icon: Target },
    { name: 'flame', icon: Flame },
  ],
  tech: [
    { name: 'zap', icon: Zap },
    { name: 'rocket', icon: Rocket },
    { name: 'sparkles', icon: Sparkles },
    { name: 'wand-2', icon: Wand2 },
  ],
  security: [
    { name: 'shield', icon: Shield },
    { name: 'shield-check', icon: ShieldCheck },
    { name: 'lock', icon: Lock },
    { name: 'key', icon: Key },
  ],
  communication: [
    { name: 'message-circle', icon: MessageCircle },
    { name: 'bell', icon: Bell },
    { name: 'mail', icon: Mail },
  ],
  misc: [
    { name: 'gift', icon: Gift },
    { name: 'gem', icon: Gem },
    { name: 'lightbulb', icon: Lightbulb },
    { name: 'bookmark', icon: Bookmark },
  ],
};

// Flatten icon library for easy lookup
const allIcons = Object.values(iconLibrary).flat();

// Get icon component by name
export function getIconByName(name: string) {
  const found = allIcons.find(i => i.name === name);
  return found?.icon || Check;
}

// Emoji grid
const emojiGrid = [
  '✓', '✅', '⭐', '⚡', '🔥', '🚀',
  '💎', '🎯', '🏆', '👍', '❤️', '💡',
  '🎁', '👉', '✨', '🌟', '💪', '🎉',
  '👏', '🙌', '💯', '🔔', '📧', '🛡️',
  '🔑', '💰', '📈', '🎊', '🌈', '⚙️',
];

interface IconPickerProps {
  iconMode: 'icon' | 'emoji' | 'image';
  iconName?: string;
  emoji?: string;
  imageSrc?: string;
  iconColor?: string;
  compact?: boolean;  // For inline/per-item usage
  onChange: (value: { iconMode: 'icon' | 'emoji' | 'image'; iconName?: string; emoji?: string; imageSrc?: string }) => void;
}

type TabType = 'icon' | 'emoji' | 'image';

export function IconPicker({
  iconMode = 'icon',
  iconName = 'check',
  emoji = '✅',
  imageSrc = '',
  iconColor,
  compact = false,
  onChange,
}: IconPickerProps) {
  const [activeTab, setActiveTab] = useState<TabType>(iconMode);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleIconSelect = (name: string) => {
    onChange({ iconMode: 'icon', iconName: name, emoji, imageSrc });
  };

  const handleEmojiSelect = (selectedEmoji: string) => {
    onChange({ iconMode: 'emoji', iconName, emoji: selectedEmoji, imageSrc });
  };

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onChange({ iconMode: 'image', iconName, emoji, imageSrc: dataUrl });
    };
    reader.readAsDataURL(file);
  }, [onChange, iconName, emoji]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  // Filter icons based on search
  const filteredIcons = searchQuery
    ? allIcons.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allIcons;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'icon', label: 'Icons', icon: <Smile className="h-3.5 w-3.5" /> },
    { id: 'emoji', label: 'Emoji', icon: <span className="text-xs">😊</span> },
    { id: 'image', label: 'Image', icon: <ImageIcon className="h-3.5 w-3.5" /> },
  ];

  // Sizing based on compact mode
  const gridCols = compact ? 'grid-cols-5' : 'grid-cols-5';
  const buttonSize = compact ? 'w-6 h-6' : 'w-7 h-7';
  const iconSize = compact ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const scrollHeight = compact ? 'h-[120px]' : 'h-[140px]';
  const emojiSize = compact ? 'text-sm' : 'text-base';

  return (
    <div className="space-y-2">
      {/* Tab selector */}
      <div className="flex gap-0.5 p-0.5 bg-muted rounded-md">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id !== iconMode) {
                onChange({
                  iconMode: tab.id,
                  iconName: tab.id === 'icon' ? iconName : undefined,
                  emoji: tab.id === 'emoji' ? emoji : undefined,
                  imageSrc: tab.id === 'image' ? imageSrc : undefined,
                });
              }
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[10px] font-medium transition-colors",
              activeTab === tab.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Icon tab content */}
      {activeTab === 'icon' && (
        <div className="space-y-1.5">
          {!compact && (
            <Input
              placeholder="Search icons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 text-xs"
            />
          )}
          <ScrollArea className={scrollHeight}>
            <div className={cn("grid gap-0.5 pr-2", gridCols)}>
              {filteredIcons.map((item) => {
                const IconComponent = item.icon;
                const isSelected = iconMode === 'icon' && iconName === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleIconSelect(item.name)}
                    className={cn(
                      "flex items-center justify-center rounded transition-colors",
                      buttonSize,
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted-foreground/10"
                    )}
                    title={item.name}
                  >
                    <IconComponent
                      className={iconSize}
                      style={!isSelected && iconColor ? { color: iconColor } : undefined}
                    />
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Emoji tab content */}
      {activeTab === 'emoji' && (
        <ScrollArea className={scrollHeight}>
          <div className={cn("grid gap-0.5 pr-2", gridCols)}>
            {emojiGrid.map((emojiChar) => {
              const isSelected = iconMode === 'emoji' && emoji === emojiChar;
              return (
                <button
                  key={emojiChar}
                  onClick={() => handleEmojiSelect(emojiChar)}
                  className={cn(
                    "flex items-center justify-center rounded transition-colors",
                    buttonSize,
                    emojiSize,
                    isSelected
                      ? "bg-primary/20 ring-1 ring-primary"
                      : "hover:bg-muted-foreground/10"
                  )}
                >
                  {emojiChar}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Image tab content */}
      {activeTab === 'image' && (
        <div className="space-y-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {imageSrc && iconMode === 'image' ? (
            <div className="space-y-1.5">
              <div className={cn(
                "rounded-md border border-muted-foreground/20 flex items-center justify-center overflow-hidden bg-muted/30",
                compact ? "h-14" : "h-16"
              )}>
                <img
                  src={imageSrc}
                  alt="Selected icon"
                  className={cn(
                    "object-contain",
                    compact ? "max-h-10 max-w-10" : "max-h-12 max-w-12"
                  )}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-7 text-[10px]"
              >
                <Upload className="h-3 w-3 mr-1" />
                Change
              </Button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                "rounded-md border border-dashed border-muted-foreground/30 hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors bg-muted/20",
                compact ? "h-16 py-2" : "h-20 py-3"
              )}
            >
              <Upload className={cn("text-muted-foreground mb-0.5", compact ? "h-4 w-4" : "h-5 w-5")} />
              <span className="text-[10px] text-muted-foreground">Drop or click to upload</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
