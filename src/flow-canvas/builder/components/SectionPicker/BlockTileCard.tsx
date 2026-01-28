/**
 * BlockTileCard - Visual tile card for block picker
 * Soft colored background, rich icon, click to add
 */

import { cn } from '@/lib/utils';

interface BlockTileCardProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  bgColor: string;
  onAdd: () => void;
}

export function BlockTileCard({ id, name, icon, bgColor, onAdd }: BlockTileCardProps) {
  return (
    <button
      onClick={onAdd}
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition-all",
        "hover:scale-[1.02] hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        "aspect-square font-sans",
        bgColor
      )}
    >
      <div className="flex items-center justify-center flex-1">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-800 tracking-tight">
        {name}
      </span>
    </button>
  );
}
