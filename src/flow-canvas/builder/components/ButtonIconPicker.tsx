import { useState } from "react";
import { Input } from "@/components/ui/input";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { 
  ArrowRight, ArrowUpRight, ArrowLeft, ArrowDown, ArrowUp,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Plus, Minus, Check, X as XIcon,
  Download, Upload, Send, Share, Link,
  Play, Pause, Square, RotateCw, RotateCcw,
  Heart, Star, Bookmark, Flag, Bell,
  Mail, MessageSquare, Phone, Video,
  Calendar, Clock, Timer, Zap, Target,
  Trophy, Award, Gift, Rocket, Lightbulb,
  Lock, Unlock, Key, Shield, Eye, EyeOff,
  Settings, Trash2, Edit, Copy, Search,
  Home, User, Users, Building, Globe,
  ShoppingCart, CreditCard, DollarSign, Percent,
  FileText, Folder, Image, Camera, Mic,
  Sparkles, Flame, Coffee, Sun, Moon,
  type LucideIcon
} from "lucide-react";

// Icon options specifically for buttons - action-oriented icons
export const BUTTON_ICON_OPTIONS: { name: string; component: LucideIcon }[] = [
  // Arrows
  { name: "ArrowRight", component: ArrowRight },
  { name: "ArrowUpRight", component: ArrowUpRight },
  { name: "ArrowLeft", component: ArrowLeft },
  { name: "ArrowDown", component: ArrowDown },
  { name: "ArrowUp", component: ArrowUp },
  { name: "ChevronRight", component: ChevronRight },
  { name: "ChevronLeft", component: ChevronLeft },
  { name: "ChevronDown", component: ChevronDown },
  { name: "ChevronUp", component: ChevronUp },
  // Actions
  { name: "Plus", component: Plus },
  { name: "Minus", component: Minus },
  { name: "Check", component: Check },
  { name: "X", component: XIcon },
  { name: "Download", component: Download },
  { name: "Upload", component: Upload },
  { name: "Send", component: Send },
  { name: "Share", component: Share },
  { name: "Link", component: Link },
  // Media
  { name: "Play", component: Play },
  { name: "Pause", component: Pause },
  { name: "Square", component: Square },
  { name: "RotateCw", component: RotateCw },
  { name: "RotateCcw", component: RotateCcw },
  // Social
  { name: "Heart", component: Heart },
  { name: "Star", component: Star },
  { name: "Bookmark", component: Bookmark },
  { name: "Flag", component: Flag },
  { name: "Bell", component: Bell },
  // Communication
  { name: "Mail", component: Mail },
  { name: "MessageSquare", component: MessageSquare },
  { name: "Phone", component: Phone },
  { name: "Video", component: Video },
  // Time
  { name: "Calendar", component: Calendar },
  { name: "Clock", component: Clock },
  { name: "Timer", component: Timer },
  // Energy
  { name: "Zap", component: Zap },
  { name: "Target", component: Target },
  { name: "Trophy", component: Trophy },
  { name: "Award", component: Award },
  { name: "Gift", component: Gift },
  { name: "Rocket", component: Rocket },
  { name: "Lightbulb", component: Lightbulb },
  // Security
  { name: "Lock", component: Lock },
  { name: "Unlock", component: Unlock },
  { name: "Key", component: Key },
  { name: "Shield", component: Shield },
  { name: "Eye", component: Eye },
  { name: "EyeOff", component: EyeOff },
  // Utility
  { name: "Settings", component: Settings },
  { name: "Trash2", component: Trash2 },
  { name: "Edit", component: Edit },
  { name: "Copy", component: Copy },
  { name: "Search", component: Search },
  // Navigation
  { name: "Home", component: Home },
  { name: "User", component: User },
  { name: "Users", component: Users },
  { name: "Building", component: Building },
  { name: "Globe", component: Globe },
  // Commerce
  { name: "ShoppingCart", component: ShoppingCart },
  { name: "CreditCard", component: CreditCard },
  { name: "DollarSign", component: DollarSign },
  { name: "Percent", component: Percent },
  // Content
  { name: "FileText", component: FileText },
  { name: "Folder", component: Folder },
  { name: "Image", component: Image },
  { name: "Camera", component: Camera },
  { name: "Mic", component: Mic },
  // Fun
  { name: "Sparkles", component: Sparkles },
  { name: "Flame", component: Flame },
  { name: "Coffee", component: Coffee },
  { name: "Sun", component: Sun },
  { name: "Moon", component: Moon },
];

export function getButtonIconComponent(iconName: string): LucideIcon {
  const found = BUTTON_ICON_OPTIONS.find(i => 
    i.name.toLowerCase() === iconName.toLowerCase() || 
    i.name.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() === iconName.toLowerCase()
  );
  return found?.component || ArrowRight;
}

interface ButtonIconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  className?: string;
}

export function ButtonIconPicker({ value, onChange, className }: ButtonIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const SelectedIcon = getButtonIconComponent(value);
  
  const filteredIcons = BUTTON_ICON_OPTIONS.filter(icon => 
    icon.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md",
            "bg-builder-surface-hover hover:bg-builder-surface-active",
            "border border-builder-border",
            "text-builder-text text-xs transition-colors",
            className
          )}
        >
          <SelectedIcon className="h-4 w-4" />
          <span className="truncate max-w-[80px]">{value || "ArrowRight"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-2 bg-builder-surface border-builder-border" 
        align="end"
        side="left"
        sideOffset={8}
      >
        <Input
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8 text-xs builder-input"
        />
        <div className="grid grid-cols-7 gap-0.5 max-h-48 overflow-y-auto">
          {filteredIcons.map(({ name, component: Icon }) => (
            <button
              key={name}
              type="button"
              className={cn(
                "p-2 rounded transition-colors",
                "hover:bg-builder-surface-hover",
                value === name || value.toLowerCase() === name.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
                  ? "bg-builder-accent/20 text-builder-accent" 
                  : "text-builder-text-muted"
              )}
              onClick={() => {
                onChange(name);
                setOpen(false);
                setSearch("");
              }}
              title={name}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        {filteredIcons.length === 0 && (
          <p className="text-xs text-builder-text-muted text-center py-4">No icons found</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
