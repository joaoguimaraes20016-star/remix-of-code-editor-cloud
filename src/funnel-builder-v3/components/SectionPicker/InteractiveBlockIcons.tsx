/**
 * InteractiveBlockIcons - High-fidelity form mockups for interactive blocks
 * Ported from flow-canvas for v3 builder
 */

import { Check, Play, Upload, CreditCard } from 'lucide-react';

// ============ QUESTION BLOCK MOCKUPS ============

export function MultipleChoiceMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-green-400 rounded mx-auto" />
      
      {/* Checkbox rows */}
      <div className="flex flex-col gap-1 px-2">
        {/* Selected option */}
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded px-2 py-1">
          <div className="w-3.5 h-3.5 bg-green-500 rounded flex items-center justify-center flex-shrink-0">
            <Check size={8} className="text-white" strokeWidth={3} />
          </div>
          <div className="h-1.5 flex-1 bg-green-300 rounded" />
        </div>
        
        {/* Unselected option */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded px-2 py-1">
          <div className="w-3.5 h-3.5 border-2 border-gray-300 rounded flex-shrink-0" />
          <div className="h-1.5 flex-1 bg-gray-200 rounded" />
        </div>
        
        {/* Unselected option */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded px-2 py-1">
          <div className="w-3.5 h-3.5 border-2 border-gray-300 rounded flex-shrink-0" />
          <div className="h-1.5 w-2/3 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ChoiceMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-blue-400 rounded mx-auto" />
      
      {/* Radio rows */}
      <div className="flex flex-col gap-1 px-2">
        {/* Selected option */}
        <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded px-2 py-1">
          <div className="w-3.5 h-3.5 border-2 border-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          </div>
          <div className="h-1.5 flex-1 bg-blue-300 rounded" />
        </div>
        
        {/* Unselected option */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded px-2 py-1">
          <div className="w-3.5 h-3.5 border-2 border-gray-300 rounded-full flex-shrink-0" />
          <div className="h-1.5 flex-1 bg-gray-200 rounded" />
        </div>
        
        {/* Unselected option */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded px-2 py-1">
          <div className="w-3.5 h-3.5 border-2 border-gray-300 rounded-full flex-shrink-0" />
          <div className="h-1.5 w-3/4 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function QuizMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-slate-400 rounded mx-auto" />
      
      {/* Two image cards side by side */}
      <div className="flex gap-1.5 px-2">
        <div className="flex-1 aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 rounded border border-slate-200 flex items-center justify-center">
          <div className="w-4 h-4 bg-slate-300 rounded" />
        </div>
        <div className="flex-1 aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 rounded border-2 border-blue-400 flex items-center justify-center">
          <div className="w-4 h-4 bg-blue-300 rounded" />
        </div>
      </div>
    </div>
  );
}

// ============ FORM BLOCK MOCKUPS ============

export function FormMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-indigo-400 rounded mx-auto" />
      
      {/* Input fields */}
      <div className="flex flex-col gap-1 px-2">
        <div className="flex flex-col gap-0.5">
          <div className="h-1 w-8 bg-indigo-300 rounded" />
          <div className="h-5 bg-white border border-gray-200 rounded px-1.5 flex items-center">
            <div className="h-1 w-12 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="h-1 w-6 bg-indigo-300 rounded" />
          <div className="h-5 bg-white border border-gray-200 rounded px-1.5 flex items-center">
            <div className="h-1 w-16 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppointmentMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-teal-400 rounded mx-auto" />
      
      {/* Calendar grid */}
      <div className="mx-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Month header */}
        <div className="bg-teal-50 px-2 py-1 flex items-center justify-between">
          <div className="w-1.5 h-1.5 border-l border-t border-teal-400 rotate-[-45deg]" />
          <div className="h-1.5 w-10 bg-teal-300 rounded" />
          <div className="w-1.5 h-1.5 border-r border-t border-teal-400 rotate-45" />
        </div>
        {/* Days grid */}
        <div className="grid grid-cols-7 gap-px p-1">
          {[...Array(14)].map((_, i) => (
            <div 
              key={i} 
              className={`aspect-square rounded-sm flex items-center justify-center text-[6px] ${
                i === 9 ? 'bg-teal-500 text-white' : 'bg-gray-50 text-gray-400'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UploadMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-purple-400 rounded mx-auto" />
      
      {/* Upload zone */}
      <div className="mx-2 h-14 border-2 border-dashed border-purple-300 bg-purple-50/50 rounded-lg flex flex-col items-center justify-center gap-1">
        <Upload size={14} className="text-purple-400" />
        <div className="h-1 w-12 bg-purple-200 rounded" />
      </div>
    </div>
  );
}

export function MessageMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-cyan-400 rounded mx-auto" />
      
      {/* Text area */}
      <div className="mx-2 h-14 bg-white border border-gray-200 rounded-lg p-2">
        <div className="flex flex-col gap-1">
          <div className="h-1 w-full bg-gray-200 rounded" />
          <div className="h-1 w-4/5 bg-gray-200 rounded" />
          <div className="h-1 w-2/3 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function DateMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-slate-400 rounded mx-auto" />
      
      {/* Date input + mini calendar */}
      <div className="flex flex-col gap-1 px-2">
        <div className="h-5 bg-white border border-gray-200 rounded px-1.5 flex items-center justify-between">
          <div className="h-1 w-14 bg-gray-200 rounded" />
          <div className="w-3 h-3 bg-slate-100 rounded flex items-center justify-center">
            <div className="w-2 h-2 border border-slate-400 rounded-sm" />
          </div>
        </div>
        {/* Mini calendar preview */}
        <div className="grid grid-cols-7 gap-px">
          {[...Array(7)].map((_, i) => (
            <div 
              key={i} 
              className={`w-2 h-2 rounded-sm ${i === 3 ? 'bg-blue-500' : 'bg-gray-100'}`} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DropdownMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-amber-400 rounded mx-auto" />
      
      {/* Select with dropdown */}
      <div className="flex flex-col gap-1 px-2">
        <div className="h-5 bg-white border border-gray-200 rounded px-1.5 flex items-center justify-between">
          <div className="h-1 w-10 bg-gray-200 rounded" />
          <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-gray-400" />
        </div>
        {/* Dropdown options */}
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="px-1.5 py-1 bg-amber-50 border-l-2 border-amber-400">
            <div className="h-1 w-10 bg-amber-300 rounded" />
          </div>
          <div className="px-1.5 py-1">
            <div className="h-1 w-8 bg-gray-200 rounded" />
          </div>
          <div className="px-1.5 py-1">
            <div className="h-1 w-12 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PaymentMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-amber-400 rounded mx-auto" />
      
      {/* Card form */}
      <div className="flex flex-col gap-1 px-2">
        {/* Card number */}
        <div className="h-5 bg-white border border-gray-200 rounded px-1.5 flex items-center justify-between">
          <div className="h-1 w-20 bg-gray-200 rounded" />
          <CreditCard size={10} className="text-gray-400" />
        </div>
        {/* Expiry + CVV */}
        <div className="flex gap-1">
          <div className="flex-1 h-5 bg-white border border-gray-200 rounded px-1.5 flex items-center">
            <div className="h-1 w-8 bg-gray-200 rounded" />
          </div>
          <div className="w-10 h-5 bg-white border border-gray-200 rounded px-1.5 flex items-center">
            <div className="h-1 w-5 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function InputMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-cyan-400 rounded mx-auto" />
      
      {/* Input field */}
      <div className="flex flex-col gap-1 px-2">
        <div className="h-1 w-10 bg-cyan-300 rounded" />
        <div className="h-6 bg-white border border-gray-200 rounded px-1.5 flex items-center">
          <div className="h-1 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function EmbedMockup() {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Title bar */}
      <div className="w-16 h-1.5 bg-slate-400 rounded mx-auto" />
      
      {/* Embed preview */}
      <div className="mx-2 h-14 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-1">
          <div className="text-[8px] text-slate-400 font-mono">&lt;embed/&gt;</div>
          <div className="h-1 w-12 bg-slate-300 rounded" />
        </div>
      </div>
    </div>
  );
}
