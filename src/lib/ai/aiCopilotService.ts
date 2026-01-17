/**
 * AI Copilot Service
 * 
 * Client for the ai-copilot edge function.
 * Supports streaming and non-streaming responses.
 */

import { supabase } from '@/integrations/supabase/client';

export type TaskType = 'suggest' | 'generate' | 'rewrite' | 'analyze';

export interface PageContext {
  pageName?: string;
  stepIntents?: string[];
  currentStep?: string;
  elementType?: string;
  elementContent?: string;
  blockType?: string;
}

export interface AISuggestion {
  id: string;
  type: 'step' | 'copy' | 'layout' | 'next-action';
  title: string;
  description: string;
  confidence: number;
}

export interface AIGeneratedBlock {
  type: string;
  label: string;
  elements: Array<{
    type: string;
    content: string;
    props: Record<string, unknown>;
  }>;
  props: Record<string, unknown>;
}

export interface AIRewriteResult {
  rewritten: string;
  reasoning: string;
}

export interface AIAnalysisResult {
  score: number;
  assessment: string;
  issues: Array<{
    severity: 'high' | 'medium' | 'low';
    issue: string;
    fix: string;
  }>;
  recommendations: string[];
}

interface StreamOptions {
  onDelta: (chunk: string) => void;
  onDone: () => void;
  onError?: (error: Error) => void;
}

const COPILOT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-copilot`;

/**
 * Stream a response from the AI copilot
 */
export async function streamAICopilot(
  task: TaskType,
  prompt: string,
  context: PageContext,
  options: StreamOptions
): Promise<void> {
  const { onDelta, onDone, onError } = options;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const response = await fetch(COPILOT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ task, prompt, context, stream: true }),
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
    console.error('[aiCopilotService] Stream error:', err);
    onError?.(err);
  }
}

/**
 * Non-streaming request to AI copilot
 */
export async function callAICopilot<T>(
  task: TaskType,
  prompt: string,
  context: PageContext
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const response = await fetch(COPILOT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ task, prompt, context, stream: false }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content in AI response');
  }

  // Parse the JSON response
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * Get suggestions for the current page context
 */
export async function getSuggestions(context: PageContext): Promise<AISuggestion[]> {
  const result = await callAICopilot<{ suggestions: AISuggestion[] }>(
    'suggest',
    'Analyze the current page and provide improvement suggestions.',
    context
  );
  return result.suggestions;
}

/**
 * Generate a block based on a prompt
 */
export async function generateBlock(
  prompt: string,
  context: PageContext
): Promise<AIGeneratedBlock> {
  const result = await callAICopilot<{ block: AIGeneratedBlock }>(
    'generate',
    prompt,
    context
  );
  return result.block;
}

/**
 * Rewrite copy for better conversion
 */
export async function rewriteCopy(
  content: string,
  context: PageContext
): Promise<AIRewriteResult> {
  return callAICopilot<AIRewriteResult>(
    'rewrite',
    `Rewrite this copy: "${content}"`,
    { ...context, elementContent: content }
  );
}

/**
 * Analyze funnel structure
 */
export async function analyzeFunnel(context: PageContext): Promise<AIAnalysisResult> {
  return callAICopilot<AIAnalysisResult>(
    'analyze',
    'Analyze this funnel structure and provide recommendations.',
    context
  );
}
