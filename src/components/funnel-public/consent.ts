export type ConsentMode = "explicit" | "implicit";

// Minimal shared step shape for consent helpers
export interface ConsentStep {
  step_type?: string;
  content?: Record<string, any>;
}

export function getTermsUrl(step?: ConsentStep): string {
  // Legacy helper preserved for backward compatibility.
  // Delegate to the canonical privacy policy resolver using step-level data only.
  if (typeof resolvePrivacyPolicyUrl !== "function") {
    return "";
  }
  return resolvePrivacyPolicyUrl(step, undefined, undefined);
}

export function getConsentMode(step: ConsentStep | undefined, termsUrl: string): ConsentMode {
  const rawMode = step?.content?.consent_mode as ConsentMode | undefined;
  if (rawMode === "explicit" || rawMode === "implicit") return rawMode;
  return termsUrl ? "implicit" : "explicit";
}

// Step types that collect identity data and require consent
const IDENTITY_STEP_TYPES = [
  "opt_in",
  "email_capture", 
  "phone_capture",
  "contact_capture",
  "full_identity",
];

export function isConsentRequired(step?: ConsentStep): boolean {
  if (!step) return false;
  const stepType = step.step_type || "";
  
  // Check if step type collects identity data
  if (IDENTITY_STEP_TYPES.includes(stepType)) return true;
  
  // Also check content for identity fields
  const content = step.content || {};
  const collectsEmail = content.collect_email === true || content.email_enabled === true;
  const collectsPhone = content.collect_phone === true || content.phone_enabled === true;
  
  return collectsEmail || collectsPhone;
}

export function shouldShowConsentCheckbox(step?: ConsentStep, termsUrl?: string): boolean {
  if (!step || !termsUrl) return false;

  // Use unified identity detection
  if (!isConsentRequired(step)) return false;

  const showConsentSetting = step.content?.show_consent_checkbox;
  const requiresConsent = step.content?.requires_consent === true;

  if (requiresConsent) return true;
  if (showConsentSetting === false) return false;
  return true;
}

interface DefaultPrivacyContext {
  team?: any;
  funnel?: any;
  domainOrigin?: string | null;
}

export function getDefaultPrivacyPolicyUrl({ team, funnel }: DefaultPrivacyContext): string {
  const funnelUrl = funnel?.settings?.privacy_policy_url;
  if (typeof funnelUrl === "string" && funnelUrl.trim().length > 0) {
    return funnelUrl.trim();
  }

  const teamUrl = team?.settings?.privacy_policy_url;
  if (typeof teamUrl === "string" && teamUrl.trim().length > 0) {
    return teamUrl.trim();
  }

  return "";
}

export function resolvePrivacyPolicyUrl(
  step: any | undefined,
  funnel: any | undefined,
  team: any | undefined,
  domainOrigin?: string,
): string {
  const stepUrl =
    step?.content?.privacy_link ||
    step?.content?.terms_url ||
    step?.content?.terms_link;

  if (typeof stepUrl === "string" && stepUrl.trim().length > 0) {
    return stepUrl.trim();
  }

  return getDefaultPrivacyPolicyUrl({ team, funnel, domainOrigin });
}
