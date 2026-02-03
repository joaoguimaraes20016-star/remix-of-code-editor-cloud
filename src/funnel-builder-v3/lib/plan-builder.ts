import { FunnelPlan, Funnel, FunnelStep, Block, PlannedStep, PlannedBlock } from '@/funnel-builder-v3/types/funnel';
import { blockDefinitions } from './block-definitions';
import { v4 as uuid } from 'uuid';

/**
 * Converts a FunnelPlan to an actual Funnel with default content
 */
export function buildFunnelFromPlan(plan: FunnelPlan, existingFunnelId?: string): Funnel {
  const steps: FunnelStep[] = plan.steps.map((plannedStep) => {
    const blocks: Block[] = plannedStep.blocks.map((plannedBlock) => {
      const definition = blockDefinitions[plannedBlock.type];
      
      return {
        id: uuid(),
        type: plannedBlock.type,
        content: definition.defaultContent,
        styles: definition.defaultStyles,
        order: plannedBlock.order,
      };
    });

    // Generate slug from step name
    const slug = plannedStep.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `step-${plannedStep.order}`;

    return {
      id: uuid(),
      name: plannedStep.name,
      type: plannedStep.type,
      slug,
      blocks,
      settings: {
        backgroundColor: '#ffffff',
      },
      order: plannedStep.order,
    };
  });

  return {
    id: existingFunnelId || uuid(),
    name: plan.name,
    description: plan.description,
    steps,
    settings: {
      primaryColor: '#3b82f6',
      fontFamily: 'Inter',
      showStepIndicator: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
