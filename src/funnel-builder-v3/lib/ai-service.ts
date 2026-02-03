/**
 * AI Service for Funnel Builder V3
 * 
 * Provides copywriting generation and Q&A support for V3 blocks only.
 * No layout or styling changes - content only.
 */

import { supabase } from '@/integrations/supabase/client';
import { BlockType, BlockContent, FunnelPlan } from '@/funnel-builder-v3/types/funnel';

export type AITaskType = 'copy' | 'help' | 'clone' | 'generate' | 'plan';

export interface V3Context {
  // Current funnel state
  currentStepId?: string | null;
  selectedBlockId?: string | null;
  selectedBlockType?: BlockType | null;
  
  // Content context
  currentBlockContent?: Partial<BlockContent>;
  existingContent?: string; // Text content from selected block
  
  // Funnel context
  stepName?: string;
  funnelName?: string;
  
  // Available blocks for reference
  availableBlockTypes?: BlockType[];
}

export interface CopyResponse {
  content: Partial<BlockContent>;
  blockType: BlockType;
  explanation?: string;
}

export interface HelpResponse {
  answer: string;
  relatedBlocks?: BlockType[];
}

export interface PlanResponse {
  plan: FunnelPlan;
}

interface StreamOptions {
  onDelta: (chunk: string) => void;
  onDone: () => void;
  onError?: (error: Error) => void;
}

const COPILOT_V3_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-copilot-v3`;

/**
 * Stream a copywriting generation response
 */
export async function streamCopyGeneration(
  prompt: string,
  context: V3Context,
  options: StreamOptions
): Promise<void> {
  const { onDelta, onDone, onError } = options;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const response = await fetch(COPILOT_V3_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ 
        task: 'copy',
        prompt,
        context,
        stream: true 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          // Incomplete JSON, put back and wait for more
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    onDone();
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('[ai-service-v3] Stream error:', err);
    onError?.(err);
  }
}

/**
 * Stream clone plan from URL (lightweight plan, not full build)
 */
export async function streamClonePlan(
  url: string,
  context: V3Context & { cloneAction?: 'replace-funnel' | 'replace-step' },
  options: StreamOptions
): Promise<void> {
  const { onDelta, onDone, onError } = options;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const response = await fetch(COPILOT_V3_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ 
        task: 'clone-plan',
        prompt: url,
        context,
        stream: true 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    onDone();
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('[ai-service-v3] Clone plan stream error:', err);
    onError?.(err);
  }
}

/**
 * Stream clone from URL response
 */
export async function streamCloneFromURL(
  url: string,
  context: V3Context & { cloneAction?: 'replace-funnel' | 'replace-step'; approvedPlan?: any },
  options: StreamOptions
): Promise<void> {
  const { onDelta, onDone, onError } = options;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const response = await fetch(COPILOT_V3_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ 
        task: 'clone',
        prompt: url,
        context,
        stream: true 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          // Incomplete JSON, put back and wait for more
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    onDone();
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('[ai-service-v3] Clone stream error:', err);
    onError?.(err);
  }
}

/**
 * Stream funnel generation response
 */
export async function streamGenerateFunnel(
  prompt: string,
  context: V3Context,
  options: StreamOptions
): Promise<void> {
  const { onDelta, onDone, onError } = options;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const response = await fetch(COPILOT_V3_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ 
        task: 'generate',
        prompt,
        context,
        stream: true 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          // Incomplete JSON, put back and wait for more
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    onDone();
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('[ai-service-v3] Generate stream error:', err);
    onError?.(err);
  }
}

/**
 * Stream help/Q&A response
 */
export async function streamHelpResponse(
  question: string,
  context: V3Context,
  options: StreamOptions
): Promise<void> {
  const { onDelta, onDone, onError } = options;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const response = await fetch(COPILOT_V3_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ 
        task: 'help',
        prompt: question,
        context,
        stream: true 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          // Incomplete JSON, put back and wait for more
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    onDone();
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('[ai-service-v3] Stream error:', err);
    onError?.(err);
  }
}

/**
 * Get help/Q&A response (non-streaming, deprecated - use streamHelpResponse)
 */
export async function getHelpResponse(
  question: string,
  context: V3Context
): Promise<HelpResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const response = await fetch(COPILOT_V3_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ 
      task: 'help',
      prompt: question,
      context,
      stream: false 
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed: ${response.status}`);
  }

  const data = await response.json();
  // Handle OpenAI-style response
  if (data.choices?.[0]?.message?.content) {
    return { answer: data.choices[0].message.content };
  }
  return data;
}

/**
 * Stream plan generation response
 */
export async function streamPlanGeneration(
  prompt: string,
  context: V3Context,
  options: StreamOptions
): Promise<void> {
  const { onDelta, onDone, onError } = options;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const response = await fetch(COPILOT_V3_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ 
        task: 'plan',
        prompt,
        context,
        stream: true 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              onDelta(parsed.content);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    onDone();
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    if (onError) {
      onError(error);
    } else {
      throw error;
    }
  }
}
