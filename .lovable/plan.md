

# Funnel Builder Critical Audit Fix Plan

## Executive Summary

This plan addresses **9 critical to high-severity bugs** in the funnel builder that cause:
- **Data loss** on lead submission
- **Validation bypass** through navigation
- **Answer overwrites** with default radio/checkbox names
- **Identity field corruption** from heuristic overrides
- **Missing draft tracking** on arrow navigation
- **Consent compliance gaps**
- **International phone truncation**
- **Security vulnerabilities** (arbitrary URL schemes)
- **Schema drift** between submission pipelines

---

## A. Critical Bugs (Data Loss / Revenue Loss)

### Issue 1: Stale Form Data on Submit

**Problem**: `handleFormSubmit` calls `setFormData` then immediately reads `formData` in `submitLead`, which uses stale closure state.

**Location**: `src/flow-canvas/components/FlowCanvasRenderer.tsx:2077-2086`
```typescript
const handleFormSubmit = useCallback(async (values: Record<string, string>) => {
  setFormData(prev => ({ ...prev, ...values }));  // Async state update
  const success = await submitLead({ submitMode: 'submit' });  // Uses stale formData
  // ...
}, [submitLead]);
```

**Fix**: Pass submitted values directly to `submitLead` instead of relying on state:
```typescript
const handleFormSubmit = useCallback(async (values: Record<string, string>) => {
  // Merge synchronously for payload
  const mergedData = { ...formData, ...values };
  setFormData(prev => ({ ...prev, ...values }));
  
  // Pass merged data directly
  const success = await submitLeadWithData(mergedData, { submitMode: 'submit' });
  if (success) {
    setIsComplete(true);
  }
}, [formData, submitLeadWithData]);
```

Create a new variant `submitLeadWithData(data, options)` that accepts explicit form data instead of reading from state.

**Files to modify**:
- `src/flow-canvas/components/FlowCanvasRenderer.tsx` (~30 lines)

---

### Issue 2: Navigation Bypasses Validation Engine

**Problem**: Arrow navigation and `go-to-step` actions directly call `setCurrentStepIndex`, bypassing `FlowContainerProvider.emitIntent()` and validation rules.

**Location**: `src/flow-canvas/components/FlowCanvasRenderer.tsx:2207-2230`
```typescript
<button onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))} ...>
  <ChevronUp />
</button>
<button onClick={() => setCurrentStepIndex(prev => Math.min(totalSteps - 1, prev + 1))} ...>
  <ChevronDown />
</button>
```

**Fix**: 
1. All navigation must go through `FlowContainerProvider`
2. Derive `currentStepIndex` from `FlowContainerContext.currentStepId`
3. Use `emitIntent({ type: 'next-step' })` and `emitIntent({ type: 'prev-step' })` instead of direct state manipulation

```typescript
// Replace arrows with intent-based navigation
const { emitIntent, currentStepIndex, canProgress, formValues } = useFlowContainer();

<button 
  onClick={() => emitIntent({ type: 'prev-step' })}
  disabled={!canProgress.prev}
>
  <ChevronUp />
</button>
<button 
  onClick={() => emitIntent({ type: 'next-step' })}
  disabled={!canProgress.next}
>
  <ChevronDown />
</button>
```

**Files to modify**:
- `src/flow-canvas/components/FlowCanvasRenderer.tsx` (~50 lines)
- May need to expose `formValues` from `FlowContainerContext` for runtime use

---

## B. High-Risk Logic Errors

### Issue 3: Radio/Checkbox Groups Overwrite Answers

**Problem**: Default name is hardcoded to `'radio'` or `'checkbox'`, causing collisions.

**Location**: `src/flow-canvas/components/FlowCanvasRenderer.tsx:1128, 1139`
```typescript
const radioName = (element.props.name as string) || 'radio';  // ALL radios share same key!
const checkboxName = (element.props.name as string) || 'checkbox';
```

**Fix**: Use element ID as fallback:
```typescript
const radioName = (element.props.name as string) || `radio_${element.id}`;
const checkboxName = (element.props.name as string) || `checkbox_${element.id}`;
```

**Files to modify**:
- `src/flow-canvas/components/FlowCanvasRenderer.tsx` (~4 lines)

---

### Issue 4: Identity Field Heuristics Override Explicit Keys

**Problem**: Auto-detection overwrites explicit `fieldKey` values, corrupting field mapping.

**Location**: `src/flow-canvas/components/FlowCanvasRenderer.tsx:1101-1116`
```typescript
const rawFieldKey = (element.props.fieldKey as string) || element.id;
// ...heuristic detection...
let fieldKey = rawFieldKey;
if (inputType === 'email' || placeholder.includes('email')) {
  fieldKey = 'email';  // OVERWRITES explicit rawFieldKey!
}
```

**Fix**: Only apply heuristics when no explicit fieldKey is set:
```typescript
const explicitFieldKey = element.props.fieldKey as string | undefined;
let fieldKey = explicitFieldKey || element.id;

// Only apply heuristics if no explicit key was set
if (!explicitFieldKey) {
  const placeholder = ((element.props.placeholder as string) || '').toLowerCase();
  const inputType = ((element.props.type as string) || 'text').toLowerCase();
  
  if (inputType === 'email' || placeholder.includes('email')) {
    fieldKey = 'email';
  } else if (inputType === 'tel' || placeholder.includes('phone')) {
    fieldKey = 'phone';
  } else if (placeholder.includes('name') && !placeholder.includes('company')) {
    fieldKey = 'name';
  }
}
```

**Files to modify**:
- `src/flow-canvas/components/FlowCanvasRenderer.tsx` (~15 lines)

---

## C. Event & Data Inconsistencies

### Issue 5: Draft Saves Missing on Arrow Navigation

**Problem**: Draft saves only happen in `handleButtonClick`, not on arrow/go-to-step navigation.

**Location**: Arrow navigation at line 2207-2230 never calls `saveDraft()`.

**Fix**: Create a unified step transition handler that always saves drafts:
```typescript
const handleStepChange = useCallback(async (newIndex: number) => {
  // Save draft with current form data before transitioning
  await saveDraftWithCurrentData();
  setCurrentStepIndex(newIndex);
}, [saveDraftWithCurrentData]);

// Use in arrows:
<button onClick={() => handleStepChange(Math.max(0, currentStepIndex - 1))}>
```

Better yet, integrate with `FlowContainerContext.emitIntent()` which should handle draft saves automatically on step transitions.

**Files to modify**:
- `src/flow-canvas/components/FlowCanvasRenderer.tsx` (~20 lines)
- Optionally: `src/flow-canvas/builder/contexts/FlowContainerContext.tsx` (add onStepChange callback)

---

## D. UX / Conversion Issues

### Issue 6: Consent Not Enforced During Submission

**Problem**: Consent checkbox only shows when `privacyPolicyUrl` is set, and submission never validates consent.

**Location**: 
- `src/flow-canvas/shared/hooks/useConsentRequired.ts:52-53`
- `src/flow-canvas/components/FlowCanvasRenderer.tsx` (submission logic)

**Fix - Two-part solution**:

1. **Show consent UI when identity is collected** (with or without privacy URL):
```typescript
// In useConsentRequired.ts
const showConsentCheckbox = requiresConsent; // Always show if identity collected

// Generate fallback message if no URL
let consentMessage = privacyPolicyUrl 
  ? 'I agree to the Privacy Policy'
  : 'I consent to having my information stored and processed';
```

2. **Block submission if consent required but not given**:
```typescript
// In handleFormSubmit / submitLead
const { requiresConsent } = useConsentRequired({ steps, privacyPolicyUrl });

if (requiresConsent && !consentState.agreed) {
  setConsentError('Please accept the consent checkbox to continue');
  return { error: 'Consent required' };
}
```

**Files to modify**:
- `src/flow-canvas/shared/hooks/useConsentRequired.ts` (~5 lines)
- `src/flow-canvas/components/FlowCanvasRenderer.tsx` (~15 lines)

---

## E. Performance / Data Integrity

### Issue 7: US-Only Phone Formatting Truncates International Numbers

**Problem**: Phone formatting strips all digits after 10 and forces US pattern.

**Location**:
- `src/flow-canvas/shared/components/ApplicationStepRenderer.tsx:480-485`
- `src/builder_v2/runtime/RuntimePrimitives.tsx:233-246`

**Fix**: Detect international prefix and preserve raw input:
```typescript
function formatPhone(input: string): string {
  // Preserve the original input if it starts with + (international)
  if (input.startsWith('+')) {
    // Allow international format - just clean non-digit except leading +
    return '+' + input.slice(1).replace(/[^\d]/g, '');
  }
  
  // US formatting for domestic numbers
  const digits = input.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  
  // Allow more than 10 digits (could be intl without +)
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
```

Also remove `maxLength={14}` constraint from phone inputs to allow longer international numbers.

**Files to modify**:
- `src/flow-canvas/shared/components/ApplicationStepRenderer.tsx` (~10 lines)
- `src/builder_v2/runtime/RuntimePrimitives.tsx` (~10 lines)

---

## F. Security Risks

### Issue 8: URL Actions Allow Arbitrary Schemes (XSS/Open Redirect)

**Problem**: User-configured URLs are used directly in `window.location.href` without validation.

**Location**: `src/flow-canvas/components/FlowCanvasRenderer.tsx:1041-1083`
```typescript
case 'url':
case 'redirect':
  if (redirectUrl) {
    window.location.href = redirectUrl;  // No validation!
  }
```

**Fix**: Add URL scheme allowlist:
```typescript
// Create helper
function sanitizeNavigationUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url, window.location.origin);
    const allowedSchemes = ['http:', 'https:', 'mailto:', 'tel:'];
    
    if (!allowedSchemes.includes(parsed.protocol)) {
      console.warn(`[Security] Blocked navigation to disallowed scheme: ${parsed.protocol}`);
      return null;
    }
    
    return parsed.href;
  } catch {
    // Relative URL - allow it (will use current origin)
    if (url.startsWith('/') || url.startsWith('#')) {
      return url;
    }
    console.warn(`[Security] Blocked navigation to invalid URL: ${url}`);
    return null;
  }
}

// Use in handlers:
case 'url':
case 'redirect':
  const safeUrl = sanitizeNavigationUrl(redirectUrl);
  if (safeUrl) {
    if (openNewTab) {
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = safeUrl;
    }
  }
  break;
```

**Files to modify**:
- `src/flow-canvas/components/FlowCanvasRenderer.tsx` (~30 lines)

---

## G. Architectural Improvements

### Issue 9: Consolidate Submission Pipelines

**Problem**: `useApplicationSubmit` and `useUnifiedLeadSubmit` have divergent payload schemas and consent handling.

**Current differences**:
| Field | useApplicationSubmit | useUnifiedLeadSubmit |
|-------|---------------------|---------------------|
| Consent | `consent.email`, `consent.sms` | `consent.agreed`, `consent.email_consent`, `consent.sms_consent` |
| Step tracking | `source.stepIds[]` | `step_id`, `step_ids[]`, `step_type`, `step_intent` |
| Idempotency key prefix | `appSubmit:` | `submitReq:` |

**Fix - Normalize to single contract**:

1. Create shared payload normalizer used by both hooks:
```typescript
// src/flow-canvas/shared/hooks/normalizeSubmitPayload.ts
export function normalizeToBackendPayload(
  answers: Record<string, any>,
  identity: LeadIdentity,
  consent: LeadConsent,
  source: LeadSource,
  metadata?: LeadMetadata
): BackendSubmitPayload {
  return {
    // Standard fields
    answers: { ...answers, ...identity },
    name: identity.name,
    email: identity.email,
    phone: identity.phone,
    
    // Normalized consent
    consent: consent.agreed ? {
      agreed: true,
      timestamp: consent.timestamp || new Date().toISOString(),
      email_consent: consent.email ?? false,
      sms_consent: consent.sms ?? false,
      privacy_policy_url: consent.privacyPolicyUrl,
    } : undefined,
    
    // Normalized source tracking
    step_id: source.stepId || source.stepIds?.[0],
    step_ids: source.stepIds,
    step_type: source.stepType,
    step_intent: source.stepIntent,
    page_id: source.pageId,
    last_step_index: source.lastStepIndex,
    
    // Metadata
    utm_source: metadata?.utm_source,
    utm_medium: metadata?.utm_medium,
    utm_campaign: metadata?.utm_campaign,
    calendly_booking: metadata?.calendly_booking,
  };
}
```

2. Both hooks import and use this normalizer before calling `submit-funnel-lead`.

**Files to modify**:
- Create `src/flow-canvas/shared/hooks/normalizeSubmitPayload.ts` (new file, ~50 lines)
- Update `src/flow-canvas/shared/hooks/useApplicationSubmit.ts` (~10 lines)
- Update `src/flow-canvas/shared/hooks/useUnifiedLeadSubmit.ts` (~10 lines)

---

## Implementation Priority

| Issue | Priority | Risk | Effort | Dependency |
|-------|----------|------|--------|------------|
| 1 - Stale form data | **P0** | Data loss | 30 min | None |
| 3 - Radio/checkbox names | **P0** | Data corruption | 5 min | None |
| 4 - Identity field keys | **P0** | Data corruption | 10 min | None |
| 8 - URL sanitization | **P1** | Security | 20 min | None |
| 7 - Phone formatting | **P1** | Data integrity | 15 min | None |
| 2 - Navigation validation | **P1** | Logic bypass | 60 min | FlowContainer |
| 5 - Draft on arrows | **P1** | Analytics | 20 min | Issue 2 |
| 6 - Consent enforcement | **P2** | Compliance | 30 min | None |
| 9 - Unified submissions | **P2** | Tech debt | 45 min | None |

---

## Files Summary

| File | Issues | Changes |
|------|--------|---------|
| `src/flow-canvas/components/FlowCanvasRenderer.tsx` | 1,2,3,4,5,8 | ~150 lines |
| `src/flow-canvas/shared/components/ApplicationStepRenderer.tsx` | 7 | ~10 lines |
| `src/builder_v2/runtime/RuntimePrimitives.tsx` | 7 | ~10 lines |
| `src/flow-canvas/shared/hooks/useConsentRequired.ts` | 6 | ~5 lines |
| `src/flow-canvas/shared/hooks/normalizeSubmitPayload.ts` | 9 | NEW (~50 lines) |
| `src/flow-canvas/shared/hooks/useApplicationSubmit.ts` | 9 | ~10 lines |
| `src/flow-canvas/shared/hooks/useUnifiedLeadSubmit.ts` | 9 | ~10 lines |

---

## Testing Checklist

After implementation:

**Data Integrity**
- [ ] Submit form with values just entered → all values captured (not stale)
- [ ] Two radio groups without names → each saves independently
- [ ] Input with explicit `fieldKey="company_email"` → saves as `company_email` not `email`
- [ ] Enter international phone `+44 20 1234 5678` → all digits preserved

**Validation & Navigation**
- [ ] Click arrow up/down → validation rules still enforced
- [ ] Skip required step via arrows → blocked with error message
- [ ] Draft saved on arrow navigation → verified in database

**Security**
- [ ] Button URL `javascript:alert(1)` → navigation blocked
- [ ] Button URL `data:text/html,...` → navigation blocked
- [ ] Button URL `https://example.com` → works normally

**Consent**
- [ ] Flow with email field but no privacy URL → consent checkbox shown
- [ ] Submit without checking consent → submission blocked
- [ ] Submit with consent checked → submission succeeds with consent record

**Submission Consistency**
- [ ] Submit from FlowCanvas → check payload schema
- [ ] Submit from ApplicationEngine → check payload schema matches

