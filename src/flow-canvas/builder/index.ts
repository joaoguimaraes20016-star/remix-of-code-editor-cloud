/**
 * InfoStack Builder Module
 * A modular, importable Funnel & Website Builder
 * 
 * Architecture Overview:
 * ─────────────────────────────────────────────────────────
 * Phase 1: Core Type Consolidation
 *   - Unified type definitions in ../types/infostack.ts
 *   - Consistent interfaces across all components
 * 
 * Phase 2: Button System Consolidation
 *   - UnifiedButton as single source of truth
 *   - FlowButton re-exports UnifiedButton for compatibility
 * 
 * Phase 3: Renderer Improvements
 *   - Modular renderer components in ./components/renderers/
 *   - CanvasRenderer orchestrates sub-renderers
 * 
 * Phase 4: Inspector Enhancements
 *   - Extended validation settings
 *   - Phone-specific controls
 *   - Improved UI organization
 * 
 * Phase 5: Text Editor Improvements
 *   - Enhanced selection handling via InlineEditContext
 *   - Better Right Panel integration
 *   - Selection manager utilities
 * 
 * Phase 6: Cleanup & Documentation
 *   - Consolidated exports
 *   - Comprehensive documentation
 * ─────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────
// MAIN EDITOR COMPONENT
// ─────────────────────────────────────────────────────────
export { EditorShell } from './components/EditorShell';

// ─────────────────────────────────────────────────────────
// INDIVIDUAL COMPONENTS (for custom integrations)
// ─────────────────────────────────────────────────────────
export { LeftPanel } from './components/LeftPanel';
export { RightPanel } from './components/RightPanel';
export { TopToolbar } from './components/TopToolbar';
export { CanvasRenderer } from './components/CanvasRenderer';
export { AIBuilderCopilot } from './components/AIBuilderCopilot';
export { BlockPalette } from './components/BlockPalette';
export { AddSectionPopover } from './components/AddSectionPopover';
export { BlockActionBar } from './components/BlockActionBar';
export { InlineTextEditor } from './components/InlineTextEditor';
export { RichTextToolbar } from './components/RichTextToolbar';
export { SectionPicker } from './components/SectionPicker';

// ─────────────────────────────────────────────────────────
// BUTTON ACTION SELECTOR (Phase 8)
// ─────────────────────────────────────────────────────────
export { ButtonActionSelector } from './components/ButtonActionSelector';
export type { ButtonAction, ButtonActionType } from '../shared/types/buttonAction';
// ─────────────────────────────────────────────────────────
// MODULAR RENDERERS (Phase 3)
// ─────────────────────────────────────────────────────────
export {
  CanvasUtilities,
  ThemeContext,
  FormStateContext,
  ElementDragOverlay,
  BlockDragOverlay,
  StackRenderer,
  FrameRenderer,
  SortableFrameRenderer,
} from './components/renderers';

export type {
  ThemeContextValue,
  FormStateContextValue,
} from './components/renderers';

// ─────────────────────────────────────────────────────────
// CONTEXTS (Phase 5)
// ─────────────────────────────────────────────────────────
export { 
  InlineEditProvider, 
  useInlineEdit, 
  useInlineSelectionSync 
} from './contexts/InlineEditContext';

// ─────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────
export { useHistory } from './hooks/useHistory';
export { useSnapGuides, SnapGuidesOverlay } from './hooks/useSnapGuides';
export { useScrollAnimation, evaluateVisibility, collectFieldKeys } from './hooks/useScrollAnimation';

// ─────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────
export * from './utils/helpers';
export * from './utils/textHighlight';
export * from './utils/selectionManager';
export { backgroundColorPresets, textColorPresets, elementColorPresets, highlightPresets, gradientPresets } from './utils/presets';
export { createBlock, isValidBlockId, getAllBlockIds } from './utils/blockFactory';

// ─────────────────────────────────────────────────────────
// TYPES (re-exported from types folder)
// ─────────────────────────────────────────────────────────
export type {
  Page,
  Step,
  Frame,
  Stack,
  Block,
  Element,
  SelectionState,
  BuilderProps,
  StepIntent,
  StepType,
  SubmitMode,
  ElementType,
  BlockType,
  AIsuggestion,
  AICopilotProps,
  TextStyles,
  BlockAction,
  ConditionalRule,
  VisibilitySettings,
  AnimationSettings,
} from '../types/infostack';

// Re-export sample page creator
export { createSamplePage } from './utils/helpers';

// Device mode type
export type { DeviceMode } from './components/TopToolbar';