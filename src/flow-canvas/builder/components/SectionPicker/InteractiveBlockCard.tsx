/**
 * InteractiveBlockCard - Taller card with high-fidelity form mockups
 * Different visual treatment from basic block cards
 */

import { cn } from '@/lib/utils';

interface InteractiveBlockCardProps {
  id: string;
  name: string;
  mockup: React.ReactNode;
  onAdd: () => void;
}

export function InteractiveBlockCard({ id, name, mockup, onAdd }: InteractiveBlockCardProps) {
  return (
    <button
      onClick={onAdd}
      className={cn(
        "flex flex-col bg-white border border-gray-200 rounded-xl transition-all overflow-hidden font-sans",
        "hover:border-gray-300 hover:shadow-md hover:scale-[1.02]",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        "p-3"
      )}
      style={{ aspectRatio: '3/4' }}
    >
      {/* Mockup preview area */}
      <div className="flex-1 flex items-center justify-center w-full">
        {mockup}
      </div>
      
      {/* Block name */}
      <span className="text-sm font-medium text-gray-800 mt-2 text-center tracking-tight">
        {name}
      </span>
    </button>
  );
}
