/**
 * TokenTestHarness - Visual verification page for all style tokens
 * 
 * This page renders EVERY token combination to verify they work correctly.
 * Access via /builder/token-test in development.
 */

import { useState } from 'react';
import { Check, X, Play, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  StyleTokenSystem,
  shadowTokens,
  radiusTokens,
  borderWidthTokens,
  effectTokens,
  hoverTokens,
  tokenMetadata,
  resolveTokens,
  type StyleTokens,
} from '../tokens';

interface TokenTestCardProps {
  name: string;
  style: React.CSSProperties;
  className?: string;
}

function TokenTestCard({ name, style, className }: TokenTestCardProps) {
  const [verified, setVerified] = useState<boolean | null>(null);
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={cn("w-16 h-16 bg-white rounded-lg border border-slate-200", className)}
        style={style}
      />
      <span className="text-xs font-medium text-slate-700">{name}</span>
      <div className="flex gap-1">
        <button
          onClick={() => setVerified(true)}
          className={cn(
            "w-6 h-6 rounded flex items-center justify-center transition-colors",
            verified === true ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-green-100"
          )}
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          onClick={() => setVerified(false)}
          className={cn(
            "w-6 h-6 rounded flex items-center justify-center transition-colors",
            verified === false ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-red-100"
          )}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

interface EffectTestCardProps {
  name: string;
  effectClass: string;
}

function EffectTestCard({ name, effectClass }: EffectTestCardProps) {
  const [key, setKey] = useState(0);
  const [verified, setVerified] = useState<boolean | null>(null);
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        key={key}
        className={cn(
          "w-16 h-16 bg-purple-500 rounded-lg flex items-center justify-center",
          effectClass
        )}
      >
        <Play className="w-5 h-5 text-white" />
      </div>
      <span className="text-xs font-medium text-slate-700">{name}</span>
      <div className="flex gap-1">
        <button
          onClick={() => setKey(k => k + 1)}
          className="w-6 h-6 rounded flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200"
          title="Replay"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
        <button
          onClick={() => setVerified(true)}
          className={cn(
            "w-6 h-6 rounded flex items-center justify-center transition-colors",
            verified === true ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-green-100"
          )}
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          onClick={() => setVerified(false)}
          className={cn(
            "w-6 h-6 rounded flex items-center justify-center transition-colors",
            verified === false ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-red-100"
          )}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

interface HoverTestCardProps {
  name: string;
  hoverClass: string;
}

function HoverTestCard({ name, hoverClass }: HoverTestCardProps) {
  const [verified, setVerified] = useState<boolean | null>(null);
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={cn(
          "w-16 h-16 bg-purple-500 rounded-lg flex items-center justify-center cursor-pointer",
          hoverClass
        )}
      >
        <span className="text-white text-xs">Hover</span>
      </div>
      <span className="text-xs font-medium text-slate-700">{name}</span>
      <div className="flex gap-1">
        <button
          onClick={() => setVerified(true)}
          className={cn(
            "w-6 h-6 rounded flex items-center justify-center transition-colors",
            verified === true ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-green-100"
          )}
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          onClick={() => setVerified(false)}
          className={cn(
            "w-6 h-6 rounded flex items-center justify-center transition-colors",
            verified === false ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-red-100"
          )}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export function TokenTestHarness() {
  const primaryColor = '#8b5cf6';
  
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Token Test Harness</h1>
          <p className="text-slate-500 mt-2">
            Visual verification of all style tokens. Click ✓ or ✗ to mark each token.
          </p>
        </header>

        {/* Shadow Tokens */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Shadow Tokens</h2>
          <p className="text-sm text-slate-500 mb-6">
            Each box should show a distinct shadow. "none" should have no shadow.
          </p>
          <div className="grid grid-cols-6 gap-6">
            {tokenMetadata.shadow.options.map((opt) => {
              const tokenDef = shadowTokens[opt.value];
              const style = typeof tokenDef === 'function' 
                ? tokenDef(primaryColor) 
                : tokenDef;
              return (
                <TokenTestCard 
                  key={opt.value} 
                  name={opt.value} 
                  style={style}
                />
              );
            })}
          </div>
        </section>

        {/* Radius Tokens */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Border Radius Tokens</h2>
          <p className="text-sm text-slate-500 mb-6">
            Each box should show progressively more rounded corners. "full" should be a circle/pill.
          </p>
          <div className="grid grid-cols-6 gap-6">
            {tokenMetadata.radius.options.map((opt) => (
              <TokenTestCard 
                key={opt.value} 
                name={opt.value} 
                style={radiusTokens[opt.value]}
                className="bg-purple-500"
              />
            ))}
          </div>
        </section>

        {/* Border Width Tokens */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Border Width Tokens</h2>
          <p className="text-sm text-slate-500 mb-6">
            Each box should show progressively thicker borders. "0" should have no visible border.
          </p>
          <div className="grid grid-cols-4 gap-6">
            {tokenMetadata.borderWidth.options.map((opt) => (
              <TokenTestCard 
                key={opt.value} 
                name={opt.label} 
                style={{
                  ...borderWidthTokens[opt.value],
                  borderColor: '#8b5cf6',
                  borderStyle: 'solid',
                }}
              />
            ))}
          </div>
        </section>

        {/* Effect Tokens (Animations) */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Effect Tokens (Animations)</h2>
          <p className="text-sm text-slate-500 mb-6">
            Click the refresh button to replay each animation. Each should be distinct.
          </p>
          <div className="grid grid-cols-6 gap-6">
            {tokenMetadata.effect.options.filter(o => o.value !== 'none').map((opt) => (
              <EffectTestCard 
                key={opt.value} 
                name={opt.label}
                effectClass={`token-effect-${opt.value}`}
              />
            ))}
          </div>
        </section>

        {/* Hover Tokens */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Hover Effect Tokens</h2>
          <p className="text-sm text-slate-500 mb-6">
            Hover over each box to see the effect. Each should be distinct.
          </p>
          <div className="grid grid-cols-5 gap-6">
            {tokenMetadata.hover.options.filter(o => o.value !== 'none').map((opt) => (
              <HoverTestCard 
                key={opt.value} 
                name={opt.label}
                hoverClass={`token-hover-${opt.value}`}
              />
            ))}
          </div>
        </section>

        {/* Button Combinations */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Button Token Combinations</h2>
          <p className="text-sm text-slate-500 mb-6">
            Shadow × Radius combinations. Each button should have the correct combination.
          </p>
          <div className="grid grid-cols-6 gap-3">
            {tokenMetadata.shadow.options.slice(0, 5).flatMap((shadow) =>
              tokenMetadata.radius.options.slice(0, 4).map((radius) => {
                const tokens: StyleTokens = {
                  shadow: shadow.value,
                  radius: radius.value,
                };
                const style = resolveTokens(tokens, { primaryColor });
                
                return (
                  <button
                    key={`${shadow.value}-${radius.value}`}
                    className="px-3 py-2 bg-purple-500 text-white text-xs font-medium"
                    style={style}
                  >
                    {shadow.value}/{radius.value}
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Live Builder Preview */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Live Token Builder</h2>
          <p className="text-sm text-slate-500 mb-6">
            Interactive token selector to verify real-time updates.
          </p>
          <LiveTokenBuilder />
        </section>
      </div>
    </div>
  );
}

function LiveTokenBuilder() {
  const [tokens, setTokens] = useState<StyleTokens>({
    shadow: 'md',
    radius: 'lg',
    borderWidth: '2',
    effect: 'none',
    hover: 'scale',
  });
  const [isHovered, setIsHovered] = useState(false);
  
  const primaryColor = '#8b5cf6';
  const style = resolveTokens(tokens, { primaryColor, isHovered });
  
  return (
    <div className="flex gap-8">
      {/* Controls */}
      <div className="flex-1 space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Shadow</label>
          <div className="flex gap-1">
            {tokenMetadata.shadow.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTokens(t => ({ ...t, shadow: opt.value }))}
                className={cn(
                  "flex-1 h-8 text-xs rounded",
                  tokens.shadow === opt.value 
                    ? "bg-slate-900 text-white" 
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Radius</label>
          <div className="flex gap-1">
            {tokenMetadata.radius.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTokens(t => ({ ...t, radius: opt.value }))}
                className={cn(
                  "flex-1 h-8 text-xs rounded",
                  tokens.radius === opt.value 
                    ? "bg-slate-900 text-white" 
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Hover</label>
          <div className="flex gap-1">
            {tokenMetadata.hover.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTokens(t => ({ ...t, hover: opt.value }))}
                className={cn(
                  "flex-1 h-8 text-xs rounded",
                  tokens.hover === opt.value 
                    ? "bg-slate-900 text-white" 
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Preview */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl p-8">
        <button
          className={cn(
            "px-6 py-3 bg-purple-500 text-white font-medium",
            tokens.hover && tokens.hover !== 'none' && `token-hover-${tokens.hover}`
          )}
          style={{
            ...style,
            borderColor: primaryColor,
            borderStyle: 'solid',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Preview Button
        </button>
      </div>
    </div>
  );
}

export default TokenTestHarness;
