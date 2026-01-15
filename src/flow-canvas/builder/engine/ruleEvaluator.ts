/**
 * Rule Evaluator
 * 
 * PURE FUNCTIONS for evaluating rules against form state.
 * No side effects, no component dependencies.
 * 
 * EVALUATION ORDER (deterministic):
 * 1. Visibility rules
 * 2. Validation rules  
 * 3. Progression rules
 */

import type {
  Condition,
  FieldCondition,
  AndCondition,
  OrCondition,
  NotCondition,
  AlwaysCondition,
  Rule,
  VisibilityRule,
  ValidationRule,
  ProgressionRule,
  ValidationConstraint,
  VisibilityState,
  ValidationState,
  ProgressionState,
  RuleEvaluationResult,
  FieldValidationError,
  DEFAULT_VISIBILITY_STATE,
  DEFAULT_VALIDATION_STATE,
  DEFAULT_PROGRESSION_STATE,
} from './rules';

// ============ CONDITION EVALUATION ============

/**
 * Evaluate a single condition against form values
 * @param condition The condition to evaluate
 * @param values Current form values
 * @returns boolean result of the condition
 */
export function evaluateCondition(
  condition: Condition,
  values: Record<string, unknown>
): boolean {
  switch (condition.type) {
    case 'always':
      return condition.value;

    case 'field':
      return evaluateFieldCondition(condition, values);

    case 'and':
      return evaluateAndCondition(condition, values);

    case 'or':
      return evaluateOrCondition(condition, values);

    case 'not':
      return !evaluateCondition(condition.condition, values);

    default:
      // Unknown condition type - fail closed (return false)
      console.warn('[RuleEvaluator] Unknown condition type:', (condition as any).type);
      return false;
  }
}

function evaluateFieldCondition(
  condition: FieldCondition,
  values: Record<string, unknown>
): boolean {
  const fieldValue = values[condition.fieldKey];
  const compareValue = condition.value;

  switch (condition.operator) {
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;

    case 'not_exists':
      return fieldValue === undefined || fieldValue === null;

    case 'is_empty':
      return isEmpty(fieldValue);

    case 'is_not_empty':
      return !isEmpty(fieldValue);

    case 'equals':
      return String(fieldValue) === String(compareValue);

    case 'not_equals':
      return String(fieldValue) !== String(compareValue);

    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());

    case 'not_contains':
      return !String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());

    case 'starts_with':
      return String(fieldValue).toLowerCase().startsWith(String(compareValue).toLowerCase());

    case 'ends_with':
      return String(fieldValue).toLowerCase().endsWith(String(compareValue).toLowerCase());

    case 'greater_than':
      return Number(fieldValue) > Number(compareValue);

    case 'less_than':
      return Number(fieldValue) < Number(compareValue);

    case 'greater_than_or_equal':
      return Number(fieldValue) >= Number(compareValue);

    case 'less_than_or_equal':
      return Number(fieldValue) <= Number(compareValue);

    case 'matches_pattern':
      try {
        const regex = new RegExp(String(compareValue));
        return regex.test(String(fieldValue));
      } catch {
        return false;
      }

    case 'is_email':
      return isValidEmail(String(fieldValue));

    case 'is_phone':
      return isValidPhone(String(fieldValue));

    default:
      console.warn('[RuleEvaluator] Unknown operator:', condition.operator);
      return false;
  }
}

function evaluateAndCondition(
  condition: AndCondition,
  values: Record<string, unknown>
): boolean {
  if (condition.conditions.length === 0) return true;
  return condition.conditions.every(c => evaluateCondition(c, values));
}

function evaluateOrCondition(
  condition: OrCondition,
  values: Record<string, unknown>
): boolean {
  if (condition.conditions.length === 0) return false;
  return condition.conditions.some(c => evaluateCondition(c, values));
}

// ============ HELPER FUNCTIONS ============

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function isValidEmail(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  // RFC 5322 simplified pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(value.trim());
}

function isValidPhone(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  // Allows various phone formats with optional country code
  const phonePattern = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phonePattern.test(value.replace(/\s/g, ''));
}

// ============ VALIDATION CONSTRAINT EVALUATION ============

/**
 * Evaluate a validation constraint against a field value
 * @returns Error message if invalid, null if valid
 */
export function evaluateValidationConstraint(
  constraint: ValidationConstraint,
  fieldValue: unknown,
  fieldKey: string
): FieldValidationError | null {
  const stringValue = fieldValue != null ? String(fieldValue) : '';
  const defaultMessages: Record<string, string> = {
    required: `${fieldKey} is required`,
    min_length: `${fieldKey} must be at least ${constraint.value} characters`,
    max_length: `${fieldKey} must be at most ${constraint.value} characters`,
    min_value: `${fieldKey} must be at least ${constraint.value}`,
    max_value: `${fieldKey} must be at most ${constraint.value}`,
    pattern: `${fieldKey} is invalid`,
    email: `${fieldKey} must be a valid email`,
    phone: `${fieldKey} must be a valid phone number`,
    url: `${fieldKey} must be a valid URL`,
    custom: constraint.message || `${fieldKey} is invalid`,
  };

  const createError = (): FieldValidationError => ({
    fieldKey,
    constraintType: constraint.type,
    message: constraint.message || defaultMessages[constraint.type] || `${fieldKey} is invalid`,
  });

  switch (constraint.type) {
    case 'required':
      if (isEmpty(fieldValue)) return createError();
      break;

    case 'min_length':
      if (stringValue.length < Number(constraint.value)) return createError();
      break;

    case 'max_length':
      if (stringValue.length > Number(constraint.value)) return createError();
      break;

    case 'min_value':
      if (Number(fieldValue) < Number(constraint.value)) return createError();
      break;

    case 'max_value':
      if (Number(fieldValue) > Number(constraint.value)) return createError();
      break;

    case 'pattern':
      try {
        const regex = new RegExp(String(constraint.value));
        if (!regex.test(stringValue)) return createError();
      } catch {
        return createError();
      }
      break;

    case 'email':
      if (!isEmpty(fieldValue) && !isValidEmail(stringValue)) return createError();
      break;

    case 'phone':
      if (!isEmpty(fieldValue) && !isValidPhone(stringValue)) return createError();
      break;

    case 'url':
      try {
        if (!isEmpty(fieldValue)) {
          new URL(stringValue);
        }
      } catch {
        return createError();
      }
      break;

    case 'custom':
      // Custom validation requires external logic - skip here
      break;
  }

  return null;
}

// ============ RULE EVALUATION ============

/**
 * Evaluate visibility rules
 */
export function evaluateVisibilityRules(
  rules: VisibilityRule[],
  values: Record<string, unknown>,
  allStepIds: string[] = [],
  allElementIds: string[] = []
): VisibilityState {
  // Start with all visible (default behavior)
  const steps: Record<string, boolean> = {};
  const elements: Record<string, boolean> = {};
  
  // Initialize all steps/elements as visible by default
  allStepIds.forEach(id => { steps[id] = true; });
  allElementIds.forEach(id => { elements[id] = true; });

  // Sort by priority (lower first, so higher priority wins)
  const sortedRules = [...rules].sort((a, b) => (a.priority || 0) - (b.priority || 0));

  for (const rule of sortedRules) {
    const isVisible = evaluateCondition(rule.condition, values);
    
    if (rule.target.kind === 'step') {
      steps[rule.target.stepId] = isVisible;
    } else if (rule.target.kind === 'element') {
      elements[rule.target.elementId] = isVisible;
    }
  }

  return { steps, elements };
}

/**
 * Evaluate validation rules
 */
export function evaluateValidationRules(
  rules: ValidationRule[],
  values: Record<string, unknown>
): ValidationState {
  const errors: Record<string, FieldValidationError[]> = {};
  const allErrors: FieldValidationError[] = [];

  // Sort by priority
  const sortedRules = [...rules].sort((a, b) => (a.priority || 0) - (b.priority || 0));

  for (const rule of sortedRules) {
    // Check if validation should run (when condition)
    if (rule.when && !evaluateCondition(rule.when, values)) {
      continue;
    }

    const fieldKey = rule.target.fieldKey;
    const fieldValue = values[fieldKey];
    const error = evaluateValidationConstraint(rule.constraint, fieldValue, fieldKey);

    if (error) {
      if (!errors[fieldKey]) {
        errors[fieldKey] = [];
      }
      errors[fieldKey].push(error);
      allErrors.push(error);
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors,
    allErrors,
  };
}

/**
 * Evaluate progression rules
 */
export function evaluateProgressionRules(
  rules: ProgressionRule[],
  values: Record<string, unknown>,
  validationState: ValidationState
): ProgressionState {
  // Default: allow all progression
  let canGoNext = true;
  let nextBlockedReason: string | undefined;
  let canGoPrev = true;
  let prevBlockedReason: string | undefined;
  let canSubmit = true;
  let submitBlockedReason: string | undefined;
  const canGoToStep: Record<string, boolean> = {};

  // If validation fails, block next-step and submit by default
  if (!validationState.isValid) {
    canGoNext = false;
    nextBlockedReason = 'Please fix validation errors before continuing';
    canSubmit = false;
    submitBlockedReason = 'Please fix validation errors before submitting';
  }

  // Sort by priority
  const sortedRules = [...rules].sort((a, b) => (a.priority || 0) - (b.priority || 0));

  for (const rule of sortedRules) {
    const allowed = evaluateCondition(rule.condition, values);

    switch (rule.intent) {
      case 'next-step':
        canGoNext = allowed;
        if (!allowed) {
          nextBlockedReason = rule.blockedReason || 'Progression not allowed';
        }
        break;

      case 'prev-step':
        canGoPrev = allowed;
        if (!allowed) {
          prevBlockedReason = rule.blockedReason || 'Cannot go back';
        }
        break;

      case 'submit':
        canSubmit = allowed;
        if (!allowed) {
          submitBlockedReason = rule.blockedReason || 'Submit not allowed';
        }
        break;

      case 'go-to-step':
        if (rule.targetStepId) {
          canGoToStep[rule.targetStepId] = allowed;
        }
        break;
    }
  }

  return {
    canGoNext,
    nextBlockedReason,
    canGoPrev,
    prevBlockedReason,
    canSubmit,
    submitBlockedReason,
    canGoToStep,
  };
}

// ============ MAIN EVALUATION FUNCTION ============

export interface EvaluationContext {
  /** Current form values */
  values: Record<string, unknown>;
  /** All step IDs in the flow */
  allStepIds?: string[];
  /** All element IDs in the flow */
  allElementIds?: string[];
}

/**
 * Evaluate all rules in deterministic order:
 * 1. Visibility rules
 * 2. Validation rules
 * 3. Progression rules
 * 
 * @param rules All rules to evaluate
 * @param context Evaluation context with form values
 * @returns Complete evaluation result
 */
export function evaluateRules(
  rules: Rule[],
  context: EvaluationContext
): RuleEvaluationResult {
  const { values, allStepIds = [], allElementIds = [] } = context;

  // Separate rules by type
  const visibilityRules = rules.filter((r): r is VisibilityRule => r.type === 'visibility');
  const validationRules = rules.filter((r): r is ValidationRule => r.type === 'validation');
  const progressionRules = rules.filter((r): r is ProgressionRule => r.type === 'progression');

  // STEP 1: Evaluate visibility
  const visibility = evaluateVisibilityRules(visibilityRules, values, allStepIds, allElementIds);

  // STEP 2: Evaluate validation
  const validation = evaluateValidationRules(validationRules, values);

  // STEP 3: Evaluate progression (depends on validation)
  const progression = evaluateProgressionRules(progressionRules, values, validation);

  return {
    visibility,
    validation,
    progression,
    evaluatedAt: Date.now(),
  };
}

/**
 * Evaluate with empty rules - returns default permissive state
 * Ensures backward compatibility for flows without rules
 */
export function evaluateEmptyRules(): RuleEvaluationResult {
  return {
    visibility: { steps: {}, elements: {} },
    validation: { isValid: true, errors: {}, allErrors: [] },
    progression: {
      canGoNext: true,
      canGoPrev: true,
      canSubmit: true,
      canGoToStep: {},
    },
    evaluatedAt: Date.now(),
  };
}
