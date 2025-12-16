// Temporary helper for funnel step intent detection
// Once the funnel builder persists `content.intent` for each step,
// this defaulting logic can be removed.

export type StepIntent = "capture" | "collect" | "schedule" | "complete";

export type FunnelStepLike = {
  step_type?: string | null;
  content?: any;
};

/**
 * Return the explicit `content.intent` when present, otherwise try to
 * infer a sensible default from existing step fields such as `step_type`
 * or `content.component`. This does NOT change runtime behavior — it
 * only provides a typed accessor for callers that want an intent value.
 *
 * The defaulting is intentionally conservative and temporary.
 */
export function getStepIntent(step: FunnelStepLike | null | undefined): StepIntent {
  if (!step) return "capture";

  // Prefer explicit intent stored in step.content.intent
  try {
    const explicit = step.content?.intent;
    if (explicit && typeof explicit === "string") {
      const e = explicit.toLowerCase();
      if (e === "capture" || e === "collect" || e === "schedule" || e === "complete") {
        return e as StepIntent;
      }
    }
  } catch (err) {
    // ignore and fall through to inference
  }

  // Infer from the step_type (common legacy field)
  const st = (step.step_type || "").toString().toLowerCase();
  if (st.includes("form") || st.includes("collect") || st.includes("input")) return "collect";
  if (st.includes("schedule") || st.includes("booking") || st.includes("calendar")) return "schedule";
  if (st.includes("complete") || st.includes("thankyou") || st.includes("end")) return "complete";

  // Infer from common content.component or content.type values
  const comp = (step.content?.component || step.content?.type || "").toString().toLowerCase();
  if (comp.includes("form") || comp.includes("collect") || comp.includes("fields")) return "collect";
  if (comp.includes("scheduler") || comp.includes("calendly") || comp.includes("booking")) return "schedule";
  if (comp.includes("thank") || comp.includes("complete") || comp.includes("end")) return "complete";

  // Default to `capture` which is the most generic intent (e.g., page view / tracking)
  return "capture";
}

export default getStepIntent;
