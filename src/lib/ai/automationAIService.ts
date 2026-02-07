/**
 * Automation AI Service
 * 
 * Dedicated service for automation workflow AI operations.
 * Provides streaming functions for workflow generation, help, optimization, and explanation.
 */

import { supabase } from '@/integrations/supabase/client';
import type { AutomationDefinition, TriggerType, ActionType } from '@/lib/automations/types';

export interface AutomationContext {
  currentDefinition?: AutomationDefinition;
  triggerType?: TriggerType;
  availableTriggers: TriggerType[];
  availableActions: ActionType[];
  stepCount: number;
  hasConditionals: boolean;
  teamId?: string;
  userGuidance?: string;
}

interface StreamOptions {
  onDelta: (chunk: string) => void;
  onDone: () => void;
  onError?: (error: Error) => void;
}

const COPILOT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-copilot`;

/**
 * Stream workflow generation from AI
 */
export async function streamWorkflowGeneration(
  prompt: string,
  context: AutomationContext,
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
      body: JSON.stringify({ 
        task: 'generate',
        prompt,
        context: {
          currentDefinition: context.currentDefinition,
          triggerType: context.triggerType,
          stepCount: context.stepCount,
          hasConditionals: context.hasConditionals,
          userGuidance: context.userGuidance,
        },
        mode: 'workflow',
        stream: true 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `Request failed: ${response.status}` };
      }
      console.error('[automationAIService] API error:', response.status, errorData);
      throw new Error(errorData.error || errorData.message || `Request failed: ${response.status}`);
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
    console.error('[automationAIService] Stream error:', err);
    onError?.(err);
  }
}

/**
 * Stream workflow help/chat response from AI
 */
export async function streamWorkflowHelp(
  question: string,
  context: AutomationContext,
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
      body: JSON.stringify({ 
        task: 'help',
        prompt: question,
        context: {
          currentDefinition: context.currentDefinition,
          triggerType: context.triggerType,
          stepCount: context.stepCount,
          hasConditionals: context.hasConditionals,
          availableTriggers: context.availableTriggers,
          availableActions: context.availableActions,
          userGuidance: context.userGuidance,
        },
        mode: 'workflow',
        stream: true 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `Request failed: ${response.status}` };
      }
      console.error('[automationAIService] API error:', response.status, errorData);
      throw new Error(errorData.error || errorData.message || `Request failed: ${response.status}`);
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
    console.error('[automationAIService] Stream error:', err);
    onError?.(err);
  }
}

/**
 * Stream workflow optimization suggestions from AI
 */
export async function streamWorkflowOptimization(
  context: AutomationContext,
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
      body: JSON.stringify({ 
        task: 'optimize',
        prompt: 'Analyze this workflow and suggest improvements',
        context: {
          currentDefinition: context.currentDefinition,
          triggerType: context.triggerType,
          stepCount: context.stepCount,
          hasConditionals: context.hasConditionals,
          userGuidance: context.userGuidance,
        },
        mode: 'workflow',
        stream: true 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `Request failed: ${response.status}` };
      }
      console.error('[automationAIService] API error:', response.status, errorData);
      throw new Error(errorData.error || errorData.message || `Request failed: ${response.status}`);
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
    console.error('[automationAIService] Stream error:', err);
    onError?.(err);
  }
}

/**
 * Stream workflow explanation from AI
 */
export async function streamWorkflowExplain(
  context: AutomationContext,
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
      body: JSON.stringify({ 
        task: 'explain',
        prompt: 'Explain this workflow in simple terms',
        context: {
          currentDefinition: context.currentDefinition,
          triggerType: context.triggerType,
          stepCount: context.stepCount,
          hasConditionals: context.hasConditionals,
          userGuidance: context.userGuidance,
        },
        mode: 'workflow',
        stream: true 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `Request failed: ${response.status}` };
      }
      console.error('[automationAIService] API error:', response.status, errorData);
      throw new Error(errorData.error || errorData.message || `Request failed: ${response.status}`);
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
    console.error('[automationAIService] Stream error:', err);
    onError?.(err);
  }
}
