/**
 * BlockIcons - Rich visual icons for block tile cards
 * Simple, recognizable representations of each block type
 */

import { Star } from 'lucide-react';

export function TextIcon() {
  return (
    <div className="flex flex-col gap-1.5 items-center">
      <div className="w-14 h-1.5 bg-slate-400 rounded-full" />
      <div className="w-16 h-2 bg-slate-500 rounded" />
      <div className="w-12 h-2 bg-slate-400 rounded" />
    </div>
  );
}

export function ButtonIcon() {
  return (
    <div className="px-5 py-2 bg-blue-500 rounded-lg text-white text-xs font-medium shadow-sm">
      Button
    </div>
  );
}

export function ImageIcon() {
  return (
    <div className="w-16 h-12 bg-slate-200 rounded-lg flex items-center justify-center border border-slate-300">
      <div className="w-6 h-6 rounded bg-slate-300 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21,15 16,10 5,21"/>
        </svg>
      </div>
    </div>
  );
}

export function ListIcon() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-purple-500 rounded-full" />
        <div className="w-14 h-1.5 bg-slate-400 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-purple-500 rounded-full" />
        <div className="w-12 h-1.5 bg-slate-400 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-purple-500 rounded-full" />
        <div className="w-10 h-1.5 bg-slate-400 rounded" />
      </div>
    </div>
  );
}

export function DividerIcon() {
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
        <polyline points="18,15 12,9 6,15"/>
      </svg>
      <div className="w-16 h-0.5 bg-slate-400 rounded-full" />
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
        <polyline points="6,9 12,15 18,9"/>
      </svg>
    </div>
  );
}

export function LogoBarIcon() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-purple-500 rounded" />
      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-green-500" />
      <Star size={16} className="text-yellow-500 fill-yellow-500" />
      <div className="w-4 h-4 bg-blue-500 rounded-full" />
    </div>
  );
}

export function ReviewsIcon() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={10} className="text-yellow-500 fill-yellow-500" />
        ))}
      </div>
      <div className="flex items-center -space-x-1.5">
        <div className="w-5 h-5 rounded-full bg-blue-400 border-2 border-white" />
        <div className="w-5 h-5 rounded-full bg-green-400 border-2 border-white" />
        <div className="w-5 h-5 rounded-full bg-purple-400 border-2 border-white" />
      </div>
    </div>
  );
}

export function SpacerIcon() {
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
        <polyline points="18,15 12,9 6,15"/>
      </svg>
      <div className="w-0.5 h-6 bg-slate-300" />
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
        <polyline points="6,9 12,15 18,9"/>
      </svg>
    </div>
  );
}

export function VideoIcon() {
  return (
    <div className="w-16 h-10 bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
      <div className="w-0 h-0 border-l-[10px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1" />
    </div>
  );
}

export function TestimonialIcon() {
  return (
    <div className="flex items-start gap-2 p-2 bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="w-6 h-6 rounded-full bg-orange-400 flex-shrink-0" />
      <div className="flex flex-col gap-1">
        <div className="w-12 h-1.5 bg-slate-400 rounded" />
        <div className="w-8 h-1 bg-slate-300 rounded" />
      </div>
    </div>
  );
}

export function FAQIcon() {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between px-2 py-1.5 bg-white rounded border border-slate-200">
        <div className="w-10 h-1.5 bg-slate-400 rounded" />
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </div>
      <div className="flex items-center justify-between px-2 py-1.5 bg-white rounded border border-slate-200">
        <div className="w-8 h-1.5 bg-slate-400 rounded" />
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </div>
    </div>
  );
}

export function TeamIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <div className="w-10 h-1.5 bg-slate-400 rounded" />
    </div>
  );
}

export function CalendarIcon() {
  return (
    <div className="w-14 h-12 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <div className="h-3 bg-blue-500" />
      <div className="grid grid-cols-4 gap-0.5 p-1">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="w-2 h-2 bg-slate-200 rounded-sm" />
        ))}
      </div>
    </div>
  );
}

export function HTMLIcon() {
  return (
    <div className="flex items-center gap-1 font-mono text-xs text-slate-500">
      <span className="text-blue-500">&lt;</span>
      <span>/</span>
      <span className="text-blue-500">&gt;</span>
    </div>
  );
}

export function FormIcon() {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="w-full h-5 bg-white rounded border border-slate-300 px-1.5 flex items-center">
        <div className="w-8 h-1.5 bg-slate-300 rounded" />
      </div>
      <div className="w-full h-5 bg-white rounded border border-slate-300 px-1.5 flex items-center">
        <div className="w-6 h-1.5 bg-slate-300 rounded" />
      </div>
    </div>
  );
}
