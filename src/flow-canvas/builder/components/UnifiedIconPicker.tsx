/**
 * UnifiedIconPicker
 * A comprehensive icon picker that provides:
 * - Full Lucide icon library (~1500+ icons)
 * - Category-based organization
 * - Search functionality
 * - Custom SVG upload/paste
 * - Recent icons
 * - Emoji support
 */

import React, { useState, useMemo, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Search, Upload, Smile, Clock, HelpCircle } from 'lucide-react';

// Icon categories for organized browsing
const ICON_CATEGORIES: Record<string, string[]> = {
  arrows: ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowUpRight', 'ArrowDownRight', 'ArrowUpLeft', 'ArrowDownLeft', 'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown', 'ChevronsRight', 'ChevronsLeft', 'ChevronsUp', 'ChevronsDown', 'MoveRight', 'MoveLeft', 'MoveUp', 'MoveDown', 'CornerDownRight', 'CornerUpRight', 'CornerDownLeft', 'CornerUpLeft', 'Undo', 'Redo', 'RotateCw', 'RotateCcw', 'RefreshCw', 'RefreshCcw', 'Repeat', 'Shuffle'],
  actions: ['Plus', 'Minus', 'X', 'Check', 'CheckCircle', 'CheckSquare', 'XCircle', 'XSquare', 'PlusCircle', 'PlusSquare', 'MinusCircle', 'MinusSquare', 'Download', 'Upload', 'Send', 'Share', 'Share2', 'Link', 'Link2', 'Unlink', 'ExternalLink', 'Copy', 'Clipboard', 'ClipboardCheck', 'ClipboardCopy', 'Trash', 'Trash2', 'Edit', 'Edit2', 'Edit3', 'Pencil', 'PenTool', 'Save', 'FilePlus', 'FileEdit'],
  media: ['Play', 'Pause', 'Square', 'Circle', 'PlayCircle', 'PauseCircle', 'StopCircle', 'SkipBack', 'SkipForward', 'Rewind', 'FastForward', 'Volume', 'Volume1', 'Volume2', 'VolumeX', 'Mic', 'MicOff', 'Video', 'VideoOff', 'Camera', 'CameraOff', 'Image', 'Images', 'Film', 'Music', 'Music2', 'Headphones', 'Radio', 'Tv', 'Monitor', 'Airplay'],
  social: ['Heart', 'Star', 'ThumbsUp', 'ThumbsDown', 'Bookmark', 'Flag', 'Bell', 'BellOff', 'BellRing', 'MessageCircle', 'MessageSquare', 'MessagesSquare', 'Mail', 'MailOpen', 'Send', 'AtSign', 'Hash', 'Rss', 'Share', 'Share2', 'Users', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX', 'Gift', 'Award', 'Trophy', 'Medal'],
  commerce: ['ShoppingCart', 'ShoppingBag', 'CreditCard', 'DollarSign', 'Wallet', 'Receipt', 'Tag', 'Tags', 'Percent', 'BadgeDollarSign', 'BadgePercent', 'Store', 'Package', 'Truck', 'Gift', 'Barcode', 'QrCode', 'Ticket', 'Calculator'],
  ui: ['Menu', 'MoreHorizontal', 'MoreVertical', 'Grid', 'List', 'Columns', 'Rows', 'LayoutGrid', 'LayoutList', 'LayoutDashboard', 'Sidebar', 'PanelLeft', 'PanelRight', 'PanelTop', 'PanelBottom', 'Maximize', 'Minimize', 'Maximize2', 'Minimize2', 'Expand', 'Shrink', 'Move', 'GripVertical', 'GripHorizontal', 'Settings', 'Settings2', 'Sliders', 'SlidersHorizontal', 'Filter', 'Search', 'ZoomIn', 'ZoomOut', 'Eye', 'EyeOff'],
  time: ['Clock', 'Watch', 'Timer', 'Hourglass', 'Calendar', 'CalendarDays', 'CalendarRange', 'CalendarCheck', 'CalendarX', 'CalendarPlus', 'CalendarMinus', 'Alarm', 'AlarmCheck', 'History', 'TimerReset', 'Stopwatch'],
  files: ['File', 'FileText', 'FileCode', 'FileImage', 'FileVideo', 'FileAudio', 'FileArchive', 'FilePlus', 'FileMinus', 'FileX', 'FileCheck', 'Folder', 'FolderOpen', 'FolderPlus', 'FolderMinus', 'FolderX', 'FolderCheck', 'Archive', 'Paperclip', 'Attachment'],
  navigation: ['Home', 'Compass', 'Map', 'MapPin', 'Navigation', 'Navigation2', 'Locate', 'LocateFixed', 'LocateOff', 'Globe', 'Globe2', 'Building', 'Building2', 'Landmark', 'Signpost', 'Route', 'Milestone'],
  people: ['User', 'Users', 'UserCircle', 'UserSquare', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX', 'UserCog', 'Contact', 'Contact2', 'Smile', 'Meh', 'Frown', 'Laugh', 'Angry', 'PersonStanding', 'Accessibility', 'Baby', 'HeartHandshake'],
  security: ['Lock', 'Unlock', 'Key', 'Shield', 'ShieldCheck', 'ShieldAlert', 'ShieldOff', 'ShieldQuestion', 'Fingerprint', 'Scan', 'ScanFace', 'ScanLine', 'Eye', 'EyeOff', 'AlertTriangle', 'AlertCircle', 'AlertOctagon', 'Ban', 'XOctagon'],
  tech: ['Laptop', 'Monitor', 'Smartphone', 'Tablet', 'Cpu', 'HardDrive', 'Database', 'Server', 'Cloud', 'CloudOff', 'Wifi', 'WifiOff', 'Bluetooth', 'BluetoothOff', 'Usb', 'Cable', 'Plug', 'Power', 'PowerOff', 'Battery', 'BatteryCharging', 'Code', 'Code2', 'Terminal', 'Binary', 'Brackets', 'Braces', 'Bug', 'Cog', 'Wrench', 'Hammer', 'Zap', 'Bolt'],
  nature: ['Sun', 'Moon', 'Cloud', 'CloudRain', 'CloudSnow', 'CloudLightning', 'Wind', 'Droplets', 'Snowflake', 'Flame', 'Leaf', 'TreeDeciduous', 'TreePine', 'Flower', 'Flower2', 'Mountain', 'MountainSnow', 'Waves', 'Sunrise', 'Sunset', 'Rainbow'],
  energy: ['Zap', 'Rocket', 'Target', 'Crosshair', 'Lightbulb', 'Sparkles', 'Sparkle', 'Flame', 'Fire', 'Bolt', 'Activity', 'TrendingUp', 'TrendingDown', 'BarChart', 'BarChart2', 'BarChart3', 'PieChart', 'LineChart', 'AreaChart'],
};

// Most commonly used icons for quick access
const POPULAR_ICONS = [
  'ArrowRight', 'ArrowLeft', 'Check', 'X', 'Plus', 'Minus',
  'Star', 'Heart', 'Send', 'Mail', 'Phone', 'User',
  'Download', 'Upload', 'Share', 'Link', 'Copy', 'Edit',
  'Play', 'Pause', 'Settings', 'Search', 'Menu', 'Home',
  'Calendar', 'Clock', 'Bell', 'Lock', 'Eye', 'Trash',
  'ChevronRight', 'ChevronDown', 'ExternalLink', 'Sparkles', 'Zap', 'Rocket',
  'Gift', 'Trophy', 'Award', 'Target', 'Shield', 'Key',
  'MessageCircle', 'ThumbsUp', 'Bookmark', 'Flag', 'Tag', 'Folder'
];

// Common emojis for quick access
const COMMON_EMOJIS = [
  '🚀', '⭐', '✨', '🔥', '💡', '💪', '🎯', '🏆', '🎉', '💰',
  '📈', '💎', '⚡', '🌟', '❤️', '👍', '✅', '🎁', '📧', '📞',
  '🔒', '⏰', '📅', '💬', '🔔', '👀', '🙌', '💯', '🤝', '📊',
  '🛒', '💳', '📦', '🏠', '🌍', '☁️', '🌈', '🌙', '☀️', '🍀'
];

export interface IconValue {
  type: 'lucide' | 'custom' | 'emoji';
  value: string;
  customSvg?: string;
}

interface UnifiedIconPickerProps {
  value: string | IconValue;
  onChange: (icon: IconValue | string) => void;
  allowCustomUpload?: boolean;
  allowEmoji?: boolean;
  simpleMode?: boolean; // If true, just returns string name
  className?: string;
}

// Helper to get icon component by name
export function getLucideIcon(iconName: string): React.ComponentType<LucideIcons.LucideProps> | null {
  if (!iconName) return null;
  
  // Try exact match first
  const Icon = (LucideIcons as Record<string, unknown>)[iconName];
  if (Icon && typeof Icon === 'function') {
    return Icon as React.ComponentType<LucideIcons.LucideProps>;
  }
  
  // Try PascalCase conversion from kebab-case
  const pascalCase = iconName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  
  const PascalIcon = (LucideIcons as Record<string, unknown>)[pascalCase];
  if (PascalIcon && typeof PascalIcon === 'function') {
    return PascalIcon as React.ComponentType<LucideIcons.LucideProps>;
  }
  
  return null;
}

// Get all available icon names
const getAllIconNames = (): string[] => {
  return Object.keys(LucideIcons).filter(key => {
    // Filter out non-icon exports
    if (key === 'icons' || key === 'createLucideIcon' || key === 'default') return false;
    // Check if it's actually a component
    const item = (LucideIcons as Record<string, unknown>)[key];
    return typeof item === 'object' && item !== null && '$$typeof' in item;
  });
};

// Storage key for recent icons
const RECENT_ICONS_KEY = 'unified-icon-picker-recent';

// Get recent icons from localStorage
const getRecentIcons = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_ICONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save icon to recent
const saveToRecent = (iconName: string) => {
  try {
    const recent = getRecentIcons();
    const filtered = recent.filter(i => i !== iconName);
    const updated = [iconName, ...filtered].slice(0, 20);
    localStorage.setItem(RECENT_ICONS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
};

export function UnifiedIconPicker({
  value,
  onChange,
  allowCustomUpload = true,
  allowEmoji = true,
  simpleMode = true,
  className,
}: UnifiedIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'icons' | 'emoji' | 'custom'>('icons');
  const [activeCategory, setActiveCategory] = useState<string>('popular');
  const [customSvg, setCustomSvg] = useState('');
  const [recentIcons, setRecentIcons] = useState<string[]>(getRecentIcons);

  // Parse current value
  const currentValue = useMemo((): IconValue => {
    if (typeof value === 'string') {
      // Check if it's an emoji
      if (/\p{Emoji}/u.test(value) && value.length <= 4) {
        return { type: 'emoji', value };
      }
      return { type: 'lucide', value };
    }
    return value;
  }, [value]);

  // Get all icons for search
  const allIcons = useMemo(() => getAllIconNames(), []);

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      return allIcons.filter(name => 
        name.toLowerCase().includes(searchLower)
      ).slice(0, 100);
    }
    
    if (activeCategory === 'popular') {
      return POPULAR_ICONS;
    }
    
    if (activeCategory === 'recent') {
      return recentIcons;
    }
    
    return ICON_CATEGORIES[activeCategory] || POPULAR_ICONS;
  }, [search, activeCategory, allIcons, recentIcons]);

  // Handle icon selection
  const handleSelect = useCallback((iconName: string, type: 'lucide' | 'emoji' | 'custom' = 'lucide') => {
    if (type === 'lucide') {
      saveToRecent(iconName);
      setRecentIcons(getRecentIcons());
    }
    
    if (simpleMode) {
      onChange(iconName);
    } else {
      onChange({ type, value: iconName });
    }
    
    setOpen(false);
    setSearch('');
  }, [onChange, simpleMode]);

  // Handle custom SVG
  const handleCustomSvg = useCallback(() => {
    if (customSvg.trim()) {
      if (simpleMode) {
        // Can't use simple mode with custom SVG
        onChange({ type: 'custom', value: 'custom', customSvg });
      } else {
        onChange({ type: 'custom', value: 'custom', customSvg });
      }
      setOpen(false);
      setCustomSvg('');
    }
  }, [customSvg, onChange, simpleMode]);

  // Render the current icon
  const renderCurrentIcon = () => {
    if (currentValue.type === 'emoji') {
      return <span className="text-base">{currentValue.value}</span>;
    }
    
    if (currentValue.type === 'custom' && currentValue.customSvg) {
      return (
        <div 
          className="w-4 h-4"
          dangerouslySetInnerHTML={{ __html: currentValue.customSvg }}
        />
      );
    }
    
    const Icon = getLucideIcon(currentValue.value);
    if (Icon) {
      return <Icon className="w-4 h-4" />;
    }
    
    return <HelpCircle className="w-4 h-4" />;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-md',
            'bg-builder-surface-hover hover:bg-builder-surface-active',
            'border border-builder-border',
            'text-builder-text text-xs transition-colors',
            className
          )}
        >
          {renderCurrentIcon()}
          <span className="truncate max-w-[80px]">
            {currentValue.value || 'Select'}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 bg-builder-surface border-builder-border"
        align="start"
        side="left"
        sideOffset={8}
      >
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <div className="border-b border-builder-border p-2">
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="icons" className="text-xs">
                <LucideIcons.Shapes className="w-3 h-3 mr-1" />
                Icons
              </TabsTrigger>
              {allowEmoji && (
                <TabsTrigger value="emoji" className="text-xs">
                  <Smile className="w-3 h-3 mr-1" />
                  Emoji
                </TabsTrigger>
              )}
              {allowCustomUpload && (
                <TabsTrigger value="custom" className="text-xs">
                  <Upload className="w-3 h-3 mr-1" />
                  Custom
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="icons" className="m-0">
            {/* Search */}
            <div className="p-2 border-b border-builder-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-builder-text-dim" />
                <Input
                  placeholder="Search 1500+ icons..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs builder-input"
                />
              </div>
            </div>

            {/* Category tabs */}
            {!search && (
              <div className="border-b border-builder-border">
                <ScrollArea className="w-full">
                  <div className="flex gap-1 p-2">
                    <button
                      onClick={() => setActiveCategory('popular')}
                      className={cn(
                        'px-2 py-1 rounded text-xs whitespace-nowrap transition-colors',
                        activeCategory === 'popular'
                          ? 'bg-builder-accent text-white'
                          : 'text-builder-text-muted hover:bg-builder-surface-hover'
                      )}
                    >
                      Popular
                    </button>
                    {recentIcons.length > 0 && (
                      <button
                        onClick={() => setActiveCategory('recent')}
                        className={cn(
                          'px-2 py-1 rounded text-xs whitespace-nowrap transition-colors flex items-center gap-1',
                          activeCategory === 'recent'
                            ? 'bg-builder-accent text-white'
                            : 'text-builder-text-muted hover:bg-builder-surface-hover'
                        )}
                      >
                        <Clock className="w-3 h-3" />
                        Recent
                      </button>
                    )}
                    {Object.keys(ICON_CATEGORIES).map((category) => (
                      <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={cn(
                          'px-2 py-1 rounded text-xs whitespace-nowrap transition-colors capitalize',
                          activeCategory === category
                            ? 'bg-builder-accent text-white'
                            : 'text-builder-text-muted hover:bg-builder-surface-hover'
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Icons grid */}
            <ScrollArea className="h-64">
              <div className="grid grid-cols-8 gap-0.5 p-2">
                {filteredIcons.map((iconName) => {
                  const Icon = getLucideIcon(iconName);
                  if (!Icon) return null;
                  
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => handleSelect(iconName, 'lucide')}
                      className={cn(
                        'p-2 rounded transition-colors flex items-center justify-center',
                        'hover:bg-builder-surface-hover',
                        currentValue.value === iconName
                          ? 'bg-builder-accent/20 text-builder-accent'
                          : 'text-builder-text-muted'
                      )}
                      title={iconName}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
              {filteredIcons.length === 0 && (
                <p className="text-xs text-builder-text-muted text-center py-8">
                  No icons found for "{search}"
                </p>
              )}
            </ScrollArea>
          </TabsContent>

          {allowEmoji && (
            <TabsContent value="emoji" className="m-0">
              <ScrollArea className="h-64">
                <div className="grid grid-cols-8 gap-1 p-2">
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSelect(emoji, 'emoji')}
                      className={cn(
                        'p-2 rounded transition-colors flex items-center justify-center text-lg',
                        'hover:bg-builder-surface-hover',
                        currentValue.value === emoji
                          ? 'bg-builder-accent/20'
                          : ''
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          )}

          {allowCustomUpload && (
            <TabsContent value="custom" className="m-0 p-3 space-y-3">
              <div className="space-y-2">
                <label className="text-xs text-builder-text-muted">
                  Paste SVG code
                </label>
                <Textarea
                  value={customSvg}
                  onChange={(e) => setCustomSvg(e.target.value)}
                  placeholder="<svg>...</svg>"
                  className="h-32 text-xs font-mono builder-input"
                />
              </div>
              
              {customSvg && (
                <div className="flex items-center gap-2 p-2 rounded bg-builder-surface-hover">
                  <span className="text-xs text-builder-text-muted">Preview:</span>
                  <div 
                    className="w-6 h-6 text-builder-text"
                    dangerouslySetInnerHTML={{ __html: customSvg }}
                  />
                </div>
              )}
              
              <Button
                onClick={handleCustomSvg}
                disabled={!customSvg.trim()}
                size="sm"
                className="w-full"
              >
                Use Custom Icon
              </Button>
            </TabsContent>
          )}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

export default UnifiedIconPicker;
