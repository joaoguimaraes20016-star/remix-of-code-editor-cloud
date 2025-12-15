// src/lib/ai/workflowAssistant.ts
import type {
  AiWorkflowSuggestionRequest,
  AiWorkflowSuggestionResponse,
  AiExplainWorkflowRequest,
  AiExplainWorkflowResponse,
  AiRewriteTemplateRequest,
  AiRewriteTemplateResponse,
} from './types';

/**
 * This file DOES NOT talk directly to OpenAI.
* Instead, call a backend route you create later (keeps API keys off the client).
 *
 * That way we don't leak API keys in the browser and your build stays safe.
 */

async function postJson<TReq, TRes>(url: string, body: TReq): Promise<TRes> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI request failed (${res.status}): ${text}`);
  }

  return (await res.json()) as TRes;
}

// --- Public helpers you can call from React components --- //

export async function requestWorkflowSuggestion(
  payload: AiWorkflowSuggestionRequest,
): Promise<AiWorkflowSuggestionResponse> {
  // Later, point this at your real backend endpoint:
  // e.g. "/api/ai/workflows/suggest"
  return postJson<AiWorkflowSuggestionRequest, AiWorkflowSuggestionResponse>(
    '/api/ai/workflows/suggest',
    payload,
  );
}

export async function requestWorkflowExplanation(
  payload: AiExplainWorkflowRequest,
): Promise<AiExplainWorkflowResponse> {
  return postJson<AiExplainWorkflowRequest, AiExplainWorkflowResponse>(
    '/api/ai/workflows/explain',
    payload,
  );
}

export async function requestTemplateRewrite(
  payload: AiRewriteTemplateRequest,
): Promise<AiRewriteTemplateResponse> {
  return postJson<AiRewriteTemplateRequest, AiRewriteTemplateResponse>(
    '/api/ai/workflows/rewrite-template',
    payload,
  );
}
