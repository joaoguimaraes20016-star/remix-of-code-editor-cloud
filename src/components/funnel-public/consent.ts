export type ConsentMode = "explicit" | "implicit";

// Minimal shared step shape for consent helpers
export interface ConsentStep {
  step_type?: string;
  content?: Record<string, any>;
}

export function getTermsUrl(step?: ConsentStep): string {
  // Legacy helper preserved for backward compatibility.
  // Delegate to the canonical privacy policy resolver using step-level data only.
  return resolvePrivacyPolicyUrl(step, undefined, undefined);
}

export function getConsentMode(step: ConsentStep | undefined, termsUrl: string): ConsentMode {
  const rawMode = step?.content?.consent_mode as ConsentMode | undefined;
  if (rawMode === "explicit" || rawMode === "implicit") return rawMode;
  return termsUrl ? "implicit" : "explicit";
}

export function isConsentRequired(step?: ConsentStep): boolean {
  if (!step) return false;
  // Opt-in intent implies consent by definition.
  return step.step_type === "opt_in";
}

export function shouldShowConsentCheckbox(step?: ConsentStep, termsUrl?: string): boolean {
  if (!step) return false;
  // Checkbox is deterministic for opt-in: only when a terms URL exists.
  return step.step_type === "opt_in" && !!termsUrl;
}

export function resolvePrivacyPolicyUrl(
  step: any | undefined,
  funnel: any | undefined,
  team: any | undefined
): string {
  return (
    step?.content?.privacy_link ||
    step?.content?.terms_url ||
    step?.content?.terms_link ||
    funnel?.settings?.privacy_policy_url ||
    team?.settings?.privacy_policy_url ||
    ""
  );
}
