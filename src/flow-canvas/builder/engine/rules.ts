/**
 * Rule Engine Types
 * 
 * ARCHITECTURAL PRINCIPLE:
 * Rules are PURE DATA, not functions.
 * Evaluation is deterministic and side-effect free.
 * 
 * This enables:
 * - Serialization to database
 * - Visual rule builders
 * - Server-side evaluation
 * - Automation triggers
 */

// ============ CONDITION TYPES ============
// Conditions are the building blocks of rules.
// They evaluate against form values and return boolean.

export type ConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'exists'
  | 'not_exists'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'matches_pattern'
  | 'is_email'
  | 'is_phone'
  | 'is_empty'
  | 'is_not_empty';

/**
 * A single condition that evaluates a field value
 */
export interface FieldCondition {
  type: 'field';
  /** The field key to evaluate (e.g., 'email', 'age') */
  fieldKey: string;
  /** The comparison operator */
  operator: ConditionOperator;
  /** The value to compare against (optional for exists/empty checks) */
  value?: string | number | boolean | string[];
}

/**
 * Logical AND - all conditions must be true
 */
export interface AndCondition {
  type: 'and';
  conditions: Condition[];
}

/**
 * Logical OR - at least one condition must be true
 */
export interface OrCondition {
  type: 'or';
  conditions: Condition[];
}

/**
 * Logical NOT - inverts the condition result
 */
export interface NotCondition {
  type: 'not';
  condition: Condition;
}

/**
 * Always true condition (for default rules)
 */
export interface AlwaysCondition {
  type: 'always';
  value: boolean;
}

/**
 * Union of all condition types
 */
export type Condition = 
  | FieldCondition 
  | AndCondition 
  | OrCondition 
  | NotCondition 
  | AlwaysCondition;

// ============ VALIDATION CONSTRAINTS ============
// Constraints define what makes a field value valid.

export type ValidationConstraintType =
  | 'required'
  | 'min_length'
  | 'max_length'
  | 'min_value'
  | 'max_value'
  | 'pattern'
  | 'email'
  | 'phone'
  | 'url'
  | 'custom';

export interface ValidationConstraint {
  type: ValidationConstraintType;
  /** Value for the constraint (e.g., min length number, regex pattern) */
  value?: string | number;
  /** Custom error message */
  message?: string;
}

// ============ RULE TARGETS ============
// Targets specify what a rule applies to.

export interface StepTarget {
  kind: 'step';
  stepId: string;
}

export interface ElementTarget {
  kind: 'element';
  elementId: string;
}

export interface FieldTarget {
  kind: 'field';
  fieldKey: string;
}

export type RuleTarget = StepTarget | ElementTarget | FieldTarget;

// ============ RULE TYPES ============

/**
 * Visibility Rule - controls whether a step or element is visible
 */
export interface VisibilityRule {
  id: string;
  type: 'visibility';
  target: StepTarget | ElementTarget;
  /** When condition is true, target is visible. When false, hidden. */
  condition: Condition;
  /** Priority for conflict resolution (higher = evaluated later, wins) */
  priority?: number;
}

/**
 * Validation Rule - defines constraints for a field
 */
export interface ValidationRule {
  id: string;
  type: 'validation';
  target: FieldTarget;
  /** The constraint to apply */
  constraint: ValidationConstraint;
  /** Optional: only validate when this condition is true */
  when?: Condition;
  /** Priority for multiple validations on same field */
  priority?: number;
}

/**
 * Progression Rule - controls whether progression is allowed
 */
export interface ProgressionRule {
  id: string;
  type: 'progression';
  /** Which intent this rule applies to */
  intent: 'next-step' | 'prev-step' | 'go-to-step' | 'submit';
  /** Target step for go-to-step intent */
  targetStepId?: string;
  /** When condition is true, progression is allowed */
  condition: Condition;
  /** Reason shown when blocked (not displayed yet, stored for later) */
  blockedReason?: string;
  /** Priority for conflict resolution */
  priority?: number;
}

/**
 * Union of all rule types
 */
export type Rule = VisibilityRule | ValidationRule | ProgressionRule;

// ============ EVALUATION RESULTS ============

/**
 * Result of evaluating visibility rules
 */
export interface VisibilityState {
  /** Map of stepId -> isVisible */
  steps: Record<string, boolean>;
  /** Map of elementId -> isVisible */
  elements: Record<string, boolean>;
}

/**
 * Validation error for a specific field
 */
export interface FieldValidationError {
  fieldKey: string;
  constraintType: ValidationConstraintType;
  message: string;
}

/**
 * Result of evaluating validation rules
 */
export interface ValidationState {
  /** Whether all validations pass */
  isValid: boolean;
  /** Map of fieldKey -> array of errors */
  errors: Record<string, FieldValidationError[]>;
  /** Flat list of all errors */
  allErrors: FieldValidationError[];
}

/**
 * Result of evaluating progression rules
 */
export interface ProgressionState {
  /** Whether next-step is allowed */
  canGoNext: boolean;
  /** Reason next-step is blocked */
  nextBlockedReason?: string;
  /** Whether prev-step is allowed */
  canGoPrev: boolean;
  /** Reason prev-step is blocked */
  prevBlockedReason?: string;
  /** Whether submit is allowed */
  canSubmit: boolean;
  /** Reason submit is blocked */
  submitBlockedReason?: string;
  /** Map of stepId -> whether go-to-step is allowed */
  canGoToStep: Record<string, boolean>;
}

/**
 * Complete evaluation result
 */
export interface RuleEvaluationResult {
  visibility: VisibilityState;
  validation: ValidationState;
  progression: ProgressionState;
  /** Timestamp of evaluation (for debugging/caching) */
  evaluatedAt: number;
}

// ============ RULE SET ============

/**
 * A collection of rules with metadata
 */
export interface RuleSet {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name?: string;
  /** All rules in this set */
  rules: Rule[];
  /** Version for migrations */
  version: number;
}

// ============ DEFAULT VALUES ============

/**
 * Empty evaluation result - used when no rules exist
 * Default behavior: everything visible, no validation errors, progression allowed
 */
export const DEFAULT_VISIBILITY_STATE: VisibilityState = {
  steps: {},
  elements: {},
};

export const DEFAULT_VALIDATION_STATE: ValidationState = {
  isValid: true,
  errors: {},
  allErrors: [],
};

export const DEFAULT_PROGRESSION_STATE: ProgressionState = {
  canGoNext: true,
  nextBlockedReason: undefined,
  canGoPrev: true,
  prevBlockedReason: undefined,
  canSubmit: true,
  submitBlockedReason: undefined,
  canGoToStep: {},
};

export const DEFAULT_EVALUATION_RESULT: RuleEvaluationResult = {
  visibility: DEFAULT_VISIBILITY_STATE,
  validation: DEFAULT_VALIDATION_STATE,
  progression: DEFAULT_PROGRESSION_STATE,
  evaluatedAt: 0,
};
