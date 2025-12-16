import React, { useEffect, useRef, useState } from 'react';
import { FunnelRenderer } from '@/components/funnel-public/FunnelRenderer';

// Dev-only test page to verify funnel intent, emission, and dedupe
export default function FunnelTest() {
  if (!import.meta.env.DEV) {
    return <div>Not available</div>;
  }

  const [events, setEvents] = useState<any[]>([]);
  const rendererRef = useRef<HTMLDivElement | null>(null);

  const testFunnel = {
    id: 'dev-funnel-1',
    team_id: 'dev-team-1',
    name: 'Dev Funnel',
    slug: 'dev-funnel',
    settings: {
      primary_color: '#10b981',
      background_color: '#000000',
      button_text: 'Continue',
    },
  } as any;

  const testSteps = [
    {
      id: 'dev-step-1',
      order_index: 0,
      step_type: 'email_capture',
      content: {
        headline: 'Dev Email Capture',
        placeholder: 'dev@example.com',
        is_required: false,
        // Try both explicit intent and defaulting in different tests
        // intent: 'capture',
      },
    },
  ] as any[];

  useEffect(() => {
    const handler = (e: any) => {
      setEvents((s) => [{ time: Date.now(), detail: e.detail }, ...s].slice(0, 10));
    };

    window.addEventListener('dev:funnelEventEmitted', handler as EventListener);
    return () => window.removeEventListener('dev:funnelEventEmitted', handler as EventListener);
  }, []);

  const simulateSubmit = async (times = 1, gapMs = 100) => {
    // Find the visible submit button inside the renderer
    const root = document.querySelector('[data-dev-funnel-test-root]');
    if (!root) return;

    const findAndClick = () => {
      // Visible button inside the active step container
      const btn = root.querySelector('button:not([disabled])');
      if (btn) (btn as HTMLButtonElement).click();
    };

    for (let i = 0; i < times; i++) {
      findAndClick();
      if (i < times - 1) await new Promise((r) => setTimeout(r, gapMs));
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl font-bold mb-4">DEV Funnel Test</h1>

      <div className="mb-4">
        <button
          onClick={() => simulateSubmit(1)}
          className="mr-2 px-3 py-2 bg-green-600 rounded"
        >
          Submit Once
        </button>
        <button
          onClick={() => simulateSubmit(2, 50)}
          className="mr-2 px-3 py-2 bg-orange-600 rounded"
        >
          Submit Twice Rapidly
        </button>
        <button
          onClick={() => setEvents([])}
          className="px-3 py-2 bg-gray-600 rounded"
        >
          Clear Logs
        </button>
      </div>

      <div
        ref={rendererRef}
        data-dev-funnel-test-root
        style={{ border: '1px solid rgba(255,255,255,0.08)', padding: 8 }}
      >
        <FunnelRenderer funnel={testFunnel} steps={testSteps} />
      </div>

      <div className="mt-6">
        <h2 className="font-semibold">Captured Dev Events (most recent first)</h2>
        <div style={{ maxHeight: 320, overflow: 'auto' }}>
          {events.length === 0 && <p className="text-sm text-white/60">No dev events yet</p>}
          {events.map((ev, idx) => (
            <pre key={idx} className="text-xs bg-black/60 p-2 my-2">
{JSON.stringify({ time: new Date(ev.time).toISOString(), ...ev.detail }, null, 2)}
            </pre>
          ))}
        </div>
      </div>
    </div>
  );
}
