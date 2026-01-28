/**
 * Funnel Builder V3 - Inspector Components
 * 
 * Centralized exports for all inspector UI components.
 */

// =============================================================================
// LAYOUT
// =============================================================================
export { CollapsibleSection } from './layout/CollapsibleSection';
export type { CollapsibleSectionProps } from './layout/CollapsibleSection';

export { FieldGroup } from './layout/FieldGroup';
export type { FieldGroupProps } from './layout/FieldGroup';

export { InspectorBreadcrumb } from './layout/InspectorBreadcrumb';
export type { InspectorBreadcrumbProps } from './layout/InspectorBreadcrumb';

export { EmptyState } from './layout/EmptyState';
export type { EmptyStateProps } from './layout/EmptyState';

// =============================================================================
// CONTROLS
// =============================================================================
export { TextField } from './controls/TextField';
export type { TextFieldProps } from './controls/TextField';

export { SelectField } from './controls/SelectField';
export type { SelectFieldProps, SelectOption } from './controls/SelectField';

export { SliderField } from './controls/SliderField';
export type { SliderFieldProps } from './controls/SliderField';

export { SwitchField } from './controls/SwitchField';
export type { SwitchFieldProps } from './controls/SwitchField';

export { ButtonGroup } from './controls/ButtonGroup';
export type { ButtonGroupProps, ButtonGroupOption } from './controls/ButtonGroup';

export { SpacingControl } from './controls/SpacingControl';
export type { SpacingControlProps, SpacingValue } from './controls/SpacingControl';

export { AlignmentControl } from './controls/AlignmentControl';
export type { AlignmentControlProps, AlignmentValue } from './controls/AlignmentControl';

// =============================================================================
// COLOR
// =============================================================================
export { ColorPresetGrid } from './color/ColorPresetGrid';
export type { ColorPresetGridProps } from './color/ColorPresetGrid';

export { ColorPickerPopover } from './color/ColorPickerPopover';
export type { ColorPickerPopoverProps } from './color/ColorPickerPopover';

export { 
  GradientEditor, 
  gradientToCSS, 
  cloneGradient, 
  defaultGradient 
} from './color/GradientEditor';
export type { GradientEditorProps } from './color/GradientEditor';

export { GradientPickerPopover } from './color/GradientPickerPopover';
export type { GradientPickerPopoverProps } from './color/GradientPickerPopover';

// =============================================================================
// ANIMATION
// =============================================================================
export { AnimationPicker } from './animation/AnimationPicker';
export type { AnimationPickerProps, AnimationSettings } from './animation/AnimationPicker';

// =============================================================================
// SPECIALIZED
// =============================================================================
export { OptionsEditor } from './specialized/OptionsEditor';
export type { OptionsEditorProps, ChoiceOption } from './specialized/OptionsEditor';

export { TypographySection } from './specialized/TypographySection';
export type { TypographySectionProps, TypographySettings } from './specialized/TypographySection';

export { SizeSection } from './specialized/SizeSection';
export type { SizeSectionProps, SizeSettings } from './specialized/SizeSection';

// =============================================================================
// HOOKS
// =============================================================================
export { useInspectorAutoTab } from './hooks/useInspectorAutoTab';
