/**
 * Plan Parser for Funnel Builder V3
 * 
 * Parses AI-generated plan JSON and converts to FunnelPlan structure
 */

import { FunnelPlan, PlannedStep, PlannedBlock, BlockType, StepType } from '@/funnel-builder-v3/types/funnel';
import { blockDefinitions } from './block-definitions';
import { v4 as uuid } from 'uuid';

/**
 * Validate block type exists in V3
 */
function isValidBlockType(type: string): type is BlockType {
  return type in blockDefinitions;
}

/**
 * Validate step type
 */
function isValidStepType(type: string): type is StepType {
  return ['capture', 'sell', 'book', 'educate', 'result'].includes(type);
}

/**
 * Parse AI-generated plan JSON into FunnelPlan
 */
export function parsePlanResponse(response: string): FunnelPlan | null {
  try {
    // Try to extract JSON from markdown code blocks
    let jsonStr = response.trim();
    
    // Remove markdown code blocks if present
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }
    
    // Try to find JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const parsed = JSON.parse(jsonStr);
    
    // Validate and convert to FunnelPlan
    if (!parsed.steps || !Array.isArray(parsed.steps)) {
      throw new Error('Invalid plan structure: missing steps array');
    }
    
    const steps: PlannedStep[] = parsed.steps.map((step: any, index: number) => {
      if (!step.name) {
        throw new Error(`Step ${index + 1} missing name`);
      }
      
      const blocks: PlannedBlock[] = (step.blocks || []).map((block: any, blockIndex: number) => {
        const blockType = block.type || block.blockType;
        if (!blockType || !isValidBlockType(blockType)) {
          throw new Error(`Invalid block type: ${blockType}`);
        }
        
        return {
          id: uuid(),
          type: blockType,
          description: block.description || block.placeholder || '',
          placeholder: block.placeholder || block.description || '',
          order: block.order ?? blockIndex,
        };
      });
      
      return {
        id: uuid(),
        name: step.name,
        type: isValidStepType(step.type) ? step.type : 'capture',
        description: step.description || '',
        blocks,
        order: step.order ?? index,
      };
    });
    
    return {
      id: uuid(),
      name: parsed.name || 'AI Generated Plan',
      description: parsed.description || '',
      steps,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error parsing plan response:', error);
    return null;
  }
}
