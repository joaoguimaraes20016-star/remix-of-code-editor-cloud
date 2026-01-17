/**
 * Shared ButtonAction Type
 * 
 * Single source of truth for button action types across the flow-canvas system.
 * Used by:
 * - ButtonActionSelector (UI for selecting actions)
 * - FlowContainerContext (intent conversion)
 * - FlowCanvasRenderer (runtime action handling)
 * - CanvasRenderer (editor action handling)
 */

// ═══════════════════════════════════════════════════════════════
// ACTION TYPES
// ═══════════════════════════════════════════════════════════════

export type ButtonActionType = 
  | 'next-step'      // Primary: "Next Step"
  | 'prev-step'      // Primary: "Previous Step"
  | 'go-to-step'     // Secondary: "Go to Step"
  | 'submit'         // Final: "Submit" (only on capture/final)
  | 'url'            // External: "Open URL"
  | 'scroll'         // External: "Scroll To"
  | 'phone'          // External: "Call"
  | 'email'          // External: "Email"
  | 'download';      // External: "Download"

// ═══════════════════════════════════════════════════════════════
// BUTTON ACTION INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface ButtonAction {
  /** The type of action to perform */
  type: ButtonActionType;
  /** Optional value (URL, step ID, phone number, etc.) */
  value?: string;
  /** Whether to open URLs in a new tab */
  openNewTab?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT ACTION
// ═══════════════════════════════════════════════════════════════

/** Default button action - next step */
export const DEFAULT_BUTTON_ACTION: ButtonAction = {
  type: 'next-step',
};
