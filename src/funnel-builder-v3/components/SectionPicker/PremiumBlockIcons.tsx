/**
 * PremiumBlockIcons - Visual mockups for premium elements
 * Ported from flow-canvas for v3 builder
 */

import { Check, ArrowRight } from 'lucide-react';

export function GradientTextMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded mx-auto" />
      
      {/* Gradient text preview */}
      <div className="px-2 py-3 flex flex-col items-center gap-1">
        <div 
          className="text-lg font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 bg-clip-text text-transparent"
          style={{ lineHeight: 1.2 }}
        >
          Gradient
        </div>
        <div className="h-1 w-12 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export function UnderlineTextMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-orange-400 rounded mx-auto" />
      
      {/* Underline text preview */}
      <div className="px-2 py-3 flex flex-col items-center gap-2">
        <div className="relative">
          <span className="text-base font-semibold text-gray-800">Important</span>
          <div className="absolute -bottom-0.5 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-300 to-amber-300 rounded-full opacity-60" />
        </div>
        <div className="h-1 w-16 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export function StatNumberMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-emerald-400 rounded mx-auto" />
      
      {/* Stat number preview */}
      <div className="px-2 py-2 flex flex-col items-center">
        <div className="text-2xl font-bold text-emerald-600" style={{ lineHeight: 1.1 }}>
          10K+
        </div>
        <div className="text-[8px] uppercase tracking-wider text-gray-500 font-medium mt-0.5">
          Users
        </div>
      </div>
    </div>
  );
}

export function AvatarGroupMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-blue-400 rounded mx-auto" />
      
      {/* Avatar group preview */}
      <div className="px-2 py-3 flex items-center justify-center">
        <div className="flex -space-x-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white shadow-sm" />
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white shadow-sm" />
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-white shadow-sm" />
          <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center">
            <span className="text-[8px] font-semibold text-gray-600">+5</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TickerMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-violet-400 rounded mx-auto" />
      
      {/* Ticker preview */}
      <div className="mx-2 py-2">
        <div className="bg-violet-50 border border-violet-200 rounded-lg px-2 py-1.5 flex items-center gap-1.5 overflow-hidden">
          <div className="flex items-center gap-1.5 animate-pulse">
            <div className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
            <div className="h-1 w-8 bg-violet-300 rounded" />
            <div className="w-1 h-1 bg-violet-300 rounded-full" />
            <div className="h-1 w-6 bg-violet-300 rounded" />
            <div className="w-1 h-1 bg-violet-300 rounded-full" />
            <div className="h-1 w-4 bg-violet-300 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BadgeMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-rose-400 rounded mx-auto" />
      
      {/* Badge preview */}
      <div className="px-2 py-3 flex flex-col items-center gap-1.5">
        <div className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
          <Check size={8} strokeWidth={3} />
          <span className="text-[9px] font-semibold">Featured</span>
        </div>
        <div className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
          <span className="text-[9px] text-gray-500">New</span>
        </div>
      </div>
    </div>
  );
}

export function ProcessStepMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-cyan-400 rounded mx-auto" />
      
      {/* Process step preview */}
      <div className="px-2 py-2 flex items-center justify-center gap-2">
        {/* Step 1 */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[10px] font-bold">
            1
          </div>
          <div className="h-1 w-6 bg-cyan-200 rounded" />
        </div>
        
        {/* Arrow */}
        <ArrowRight size={10} className="text-gray-300 flex-shrink-0" />
        
        {/* Step 2 */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-bold">
            2
          </div>
          <div className="h-1 w-6 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
