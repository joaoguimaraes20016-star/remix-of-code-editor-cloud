// CaptureNodeRenderer - Main dispatcher for rendering CaptureNodes
// Routes to specific node type renderers based on node.type

import React from 'react';
import { CaptureNode, CaptureFlowAnswers } from '@/flow-canvas/types/captureFlow';
import { OpenEndedNode } from './nodes/OpenEndedNode';
import { SingleChoiceNode } from './nodes/SingleChoiceNode';
import { MultiChoiceNode } from './nodes/MultiChoiceNode';
import { EmailNode } from './nodes/EmailNode';
import { PhoneNode } from './nodes/PhoneNode';
import { NameNode } from './nodes/NameNode';
import { DateNode } from './nodes/DateNode';
import { ScaleNode } from './nodes/ScaleNode';
import { YesNoNode } from './nodes/YesNoNode';

export interface CaptureNodeRendererProps {
  node: CaptureNode;
  value: CaptureFlowAnswers[string];
  onChange: (value: CaptureFlowAnswers[string]) => void;
  onSubmit: () => void;
  validationError?: string;
  isPreview?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const CaptureNodeRenderer: React.FC<CaptureNodeRendererProps> = ({
  node,
  value,
  onChange,
  onSubmit,
  validationError,
  isPreview = false,
  isSelected = false,
  onSelect,
}) => {
  const commonProps = {
    node,
    value,
    onChange,
    onSubmit,
    validationError,
    isPreview,
    isSelected,
    onSelect,
  };

  switch (node.type) {
    case 'open-ended':
      return <OpenEndedNode {...commonProps} />;
    case 'single-choice':
      return <SingleChoiceNode {...commonProps} />;
    case 'multi-choice':
      return <MultiChoiceNode {...commonProps} />;
    case 'email':
      return <EmailNode {...commonProps} />;
    case 'phone':
      return <PhoneNode {...commonProps} />;
    case 'name':
      return <NameNode {...commonProps} />;
    case 'date':
      return <DateNode {...commonProps} />;
    case 'scale':
      return <ScaleNode {...commonProps} />;
    case 'yes-no':
      return <YesNoNode {...commonProps} />;
    default:
      return (
        <div className="p-4 text-center text-muted-foreground">
          Unknown node type: {(node as any).type}
        </div>
      );
  }
};

export default CaptureNodeRenderer;
