/**
 * CaptureFlow Components - TRANSITIONAL MODULE
 * 
 * This module is being consolidated into the unified ApplicationEngine system.
 * New code should use ApplicationStepRenderer from '@/flow-canvas/shared'.
 * 
 * The node components here are thin adapters that convert CaptureNode → ApplicationStep
 * and delegate to the unified renderer.
 */

export { CaptureNodeRenderer } from './CaptureNodeRenderer';
export type { CaptureNodeRendererProps } from './CaptureNodeRenderer';
export { CaptureNodeWrapper } from './CaptureNodeWrapper';

// Node components (adapters to unified system)
export { OpenEndedNode } from './nodes/OpenEndedNode';
export { SingleChoiceNode } from './nodes/SingleChoiceNode';
export { MultiChoiceNode } from './nodes/MultiChoiceNode';
export { EmailNode } from './nodes/EmailNode';
export { PhoneNode } from './nodes/PhoneNode';
export { NameNode } from './nodes/NameNode';
export { DateNode } from './nodes/DateNode';
export { ScaleNode } from './nodes/ScaleNode';
export { YesNoNode } from './nodes/YesNoNode';

// Inspectors - ApplicationStepInspector is the UNIFIED inspector
export { ApplicationStepInspector } from '../inspectors/ApplicationStepInspector';

/** @deprecated Use ApplicationStepInspector instead */
export { CaptureFlowInspector } from '../inspectors/CaptureFlowInspector';
/** @deprecated Use ApplicationStepInspector instead */
export { CaptureNodeEditor } from '../inspectors/CaptureNodeEditor';

// Modal
export { CaptureFlowModal } from '../CaptureFlowModal';

// Utilities
export { getInputStyleClass, getInputClasses } from './nodes/nodeStyles';
