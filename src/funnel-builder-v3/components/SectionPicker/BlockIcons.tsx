/**
 * BlockIcons - Rich visual icons for block tile cards
 * Ported from flow-canvas for v3 builder
 */

import { Star, Upload, CreditCard } from 'lucide-react';

// ============ CORE COMPONENT ICONS ============

export function TextIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-12 h-1.5 bg-slate-300 rounded" />
      <div className="flex flex-col gap-1 items-center">
        <div className="w-14 h-2 bg-slate-400 rounded" />
        <div className="w-12 h-1.5 bg-slate-300 rounded" />
        <div className="w-10 h-1.5 bg-slate-300 rounded" />
      </div>
    </div>
  );
}

export function ButtonIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-1.5 bg-blue-300 rounded" />
      <div className="px-5 py-2 bg-blue-500 rounded-lg text-white text-xs font-medium shadow-sm">
        Button
      </div>
    </div>
  );
}

export function ImageIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-1.5 bg-slate-300 rounded" />
      <div className="w-14 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg overflow-hidden flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
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
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-1.5 bg-purple-300 rounded" />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full" />
          <div className="w-12 h-1.5 bg-slate-400 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full" />
          <div className="w-10 h-1.5 bg-slate-400 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full" />
          <div className="w-8 h-1.5 bg-slate-400 rounded" />
        </div>
      </div>
    </div>
  );
}

export function DividerIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-1.5 bg-slate-300 rounded" />
      <div className="flex flex-col items-center gap-0.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
          <polyline points="18,15 12,9 6,15"/>
        </svg>
        <div className="w-14 h-0.5 bg-slate-400 rounded-full" />
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </div>
    </div>
  );
}

export function LogoBarIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-1.5 bg-yellow-300 rounded" />
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-purple-500 rounded" />
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-green-500" />
        <Star size={16} className="text-yellow-500 fill-yellow-500" />
        <div className="w-4 h-4 bg-blue-500 rounded-full" />
      </div>
    </div>
  );
}

export function ReviewsIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-1.5 bg-yellow-300 rounded" />
      <div className="flex flex-col items-center gap-1.5">
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
    </div>
  );
}

export function SpacerIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-1.5 bg-slate-300 rounded" />
      <div className="flex flex-col items-center gap-0.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
          <polyline points="18,15 12,9 6,15"/>
        </svg>
        <div className="w-0.5 h-5 bg-slate-300" />
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </div>
    </div>
  );
}

export function VideoIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-1.5 bg-slate-400 rounded" />
      <div className="w-14 h-10 bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
        <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent ml-0.5" />
      </div>
    </div>
  );
}

export function TestimonialIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-1.5 bg-orange-300 rounded" />
      <div className="flex items-start gap-2 p-2 bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="w-5 h-5 rounded-full bg-orange-400 flex-shrink-0" />
        <div className="flex flex-col gap-0.5">
          <div className="w-10 h-1.5 bg-slate-400 rounded" />
          <div className="w-6 h-1 bg-slate-300 rounded" />
        </div>
      </div>
    </div>
  );
}

export function FAQIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-1.5 bg-green-300 rounded" />
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center justify-between px-2 py-1 bg-white rounded border border-slate-200">
          <div className="w-8 h-1.5 bg-slate-400 rounded" />
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
            <polyline points="6,9 12,15 18,9"/>
          </svg>
        </div>
        <div className="flex items-center justify-between px-2 py-1 bg-white rounded border border-slate-200">
          <div className="w-6 h-1.5 bg-slate-400 rounded" />
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
            <polyline points="6,9 12,15 18,9"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

export function TeamIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-1.5 bg-blue-300 rounded" />
      <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    </div>
  );
}

export function CalendarIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-1.5 bg-blue-300 rounded" />
      <div className="w-14 h-10 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="h-2.5 bg-blue-500" />
        <div className="grid grid-cols-4 gap-0.5 p-0.5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="w-2.5 h-2 bg-slate-200 rounded-sm" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HTMLIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-1.5 bg-slate-300 rounded" />
      <div className="flex items-center gap-1 font-mono text-sm text-slate-500">
        <span className="text-blue-500">&lt;</span>
        <span>/</span>
        <span className="text-blue-500">&gt;</span>
      </div>
    </div>
  );
}

export function FormIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-1.5 bg-green-300 rounded" />
      <div className="flex flex-col gap-1 w-full">
        <div className="w-full h-4 bg-white rounded border border-slate-300 px-1 flex items-center">
          <div className="w-6 h-1 bg-slate-300 rounded" />
        </div>
        <div className="w-full h-4 bg-white rounded border border-slate-300 px-1 flex items-center">
          <div className="w-8 h-1 bg-slate-300 rounded" />
        </div>
      </div>
    </div>
  );
}

export function HeadingIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-1.5 bg-slate-400 rounded" />
      <div className="flex flex-col gap-1 items-center">
        <div className="w-16 h-3 bg-slate-700 rounded" />
        <div className="w-12 h-1.5 bg-slate-300 rounded" />
      </div>
    </div>
  );
}

export function IconBlockIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-1.5 bg-amber-300 rounded" />
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
        <Star size={20} className="text-white fill-white" />
      </div>
    </div>
  );
}
