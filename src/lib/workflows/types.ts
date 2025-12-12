// src/lib/workflows/types.ts
import type { TriggerType, ActionType } from '../automations/types';

export type WorkflowNodeKind = 'trigger' | 'action' | 'condition';

export interface WorkflowNodeBase {
  id: string;
  kind: WorkflowNodeKind;
  label: string;
  x?: number;
  y?: number;
}

export interface WorkflowTriggerNode extends WorkflowNodeBase {
  kind: 'trigger';
  triggerType: TriggerType;
  config?: Record<string, any>;
}

export interface WorkflowActionNode extends WorkflowNodeBase {
  kind: 'action';
  actionType: ActionType;
  config?: Record<string, any>;
}

export interface WorkflowConditionNode extends WorkflowNodeBase {
  kind: 'condition';
  /** High-level description like "lead.status equals 'show-up'" */
  description?: string;
  /** Raw conditions that map into AutomationCondition[] later */
  conditions?: Record<string, any>[];
  logicOperator?: 'AND' | 'OR';
}

export type WorkflowNode =
  | WorkflowTriggerNode
  | WorkflowActionNode
  | WorkflowConditionNode;

export interface WorkflowEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  /** e.g. "true" / "false" branch on condition nodes */
  label?: string;
}

export interface WorkflowDefinition {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}
