/**
 * CaptureFlow Context
 * Manages the active CaptureFlow being edited and provides access to CaptureFlow operations
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { CaptureFlow, CaptureNode } from '../../types/captureFlow';
import { createCaptureFlow, createCaptureNode, CaptureNodeType } from '../../types/captureFlow';

// ============ CONTEXT VALUE TYPE ============

interface CaptureFlowContextValue {
  // Active CaptureFlow state
  activeCaptureFlow: CaptureFlow | null;
  setActiveCaptureFlow: (flow: CaptureFlow | null) => void;
  
  // Editing mode - when true, the CaptureFlow editor is open
  isEditingCaptureFlow: boolean;
  setIsEditingCaptureFlow: (editing: boolean) => void;
  
  // Selected node within the active CaptureFlow
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
  
  // CaptureFlow operations
  createNewCaptureFlow: (name?: string) => CaptureFlow;
  updateCaptureFlow: (updates: Partial<CaptureFlow>) => void;
  
  // Node operations
  addNode: (type: CaptureNodeType, afterNodeId?: string) => CaptureNode;
  updateNode: (nodeId: string, updates: Partial<CaptureNode>) => void;
  deleteNode: (nodeId: string) => void;
  reorderNodes: (nodeIds: string[]) => void;
  
  // CaptureFlows storage (per-page)
  captureFlows: Map<string, CaptureFlow>;
  getCaptureFlow: (id: string) => CaptureFlow | undefined;
  saveCaptureFlow: (flow: CaptureFlow) => void;
  deleteCaptureFlow: (id: string) => void;
}

const CaptureFlowContext = createContext<CaptureFlowContextValue | null>(null);

// ============ PROVIDER ============

interface CaptureFlowProviderProps {
  children: React.ReactNode;
  initialFlows?: CaptureFlow[];
  onFlowsChange?: (flows: CaptureFlow[]) => void;
}

export function CaptureFlowProvider({ 
  children, 
  initialFlows = [],
  onFlowsChange,
}: CaptureFlowProviderProps) {
  // Storage for all CaptureFlows
  const [captureFlows, setCaptureFlows] = useState<Map<string, CaptureFlow>>(() => {
    const map = new Map<string, CaptureFlow>();
    initialFlows.forEach(flow => map.set(flow.id, flow));
    return map;
  });
  
  // Active flow being edited
  const [activeCaptureFlow, setActiveCaptureFlowState] = useState<CaptureFlow | null>(null);
  const [isEditingCaptureFlow, setIsEditingCaptureFlow] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Notify parent of changes
  const notifyChange = useCallback((newFlows: Map<string, CaptureFlow>) => {
    if (onFlowsChange) {
      onFlowsChange(Array.from(newFlows.values()));
    }
  }, [onFlowsChange]);
  
  // Set active CaptureFlow
  const setActiveCaptureFlow = useCallback((flow: CaptureFlow | null) => {
    setActiveCaptureFlowState(flow);
    setSelectedNodeId(flow?.nodes[0]?.id || null);
  }, []);
  
  // Create a new CaptureFlow
  const createNewCaptureFlow = useCallback((name?: string): CaptureFlow => {
    const newFlow = createCaptureFlow(name);
    setCaptureFlows(prev => {
      const next = new Map(prev);
      next.set(newFlow.id, newFlow);
      notifyChange(next);
      return next;
    });
    return newFlow;
  }, [notifyChange]);
  
  // Update the active CaptureFlow
  const updateCaptureFlow = useCallback((updates: Partial<CaptureFlow>) => {
    if (!activeCaptureFlow) return;
    
    const updatedFlow: CaptureFlow = {
      ...activeCaptureFlow,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    setActiveCaptureFlowState(updatedFlow);
    setCaptureFlows(prev => {
      const next = new Map(prev);
      next.set(updatedFlow.id, updatedFlow);
      notifyChange(next);
      return next;
    });
  }, [activeCaptureFlow, notifyChange]);
  
  // Add a new node
  const addNode = useCallback((type: CaptureNodeType, afterNodeId?: string): CaptureNode => {
    const newNode = createCaptureNode(type);
    
    if (!activeCaptureFlow) {
      return newNode;
    }
    
    const nodes = [...activeCaptureFlow.nodes];
    
    if (afterNodeId) {
      const index = nodes.findIndex(n => n.id === afterNodeId);
      if (index !== -1) {
        nodes.splice(index + 1, 0, newNode);
      } else {
        nodes.push(newNode);
      }
    } else {
      nodes.push(newNode);
    }
    
    updateCaptureFlow({ nodes });
    setSelectedNodeId(newNode.id);
    
    return newNode;
  }, [activeCaptureFlow, updateCaptureFlow]);
  
  // Update a node
  const updateNode = useCallback((nodeId: string, updates: Partial<CaptureNode>) => {
    if (!activeCaptureFlow) return;
    
    const nodes = activeCaptureFlow.nodes.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    );
    
    updateCaptureFlow({ nodes });
  }, [activeCaptureFlow, updateCaptureFlow]);
  
  // Delete a node
  const deleteNode = useCallback((nodeId: string) => {
    if (!activeCaptureFlow) return;
    
    const nodes = activeCaptureFlow.nodes.filter(n => n.id !== nodeId);
    
    // Select the previous or next node
    if (selectedNodeId === nodeId) {
      const deletedIndex = activeCaptureFlow.nodes.findIndex(n => n.id === nodeId);
      const newSelectedIndex = Math.max(0, deletedIndex - 1);
      setSelectedNodeId(nodes[newSelectedIndex]?.id || null);
    }
    
    updateCaptureFlow({ nodes });
  }, [activeCaptureFlow, selectedNodeId, updateCaptureFlow]);
  
  // Reorder nodes
  const reorderNodes = useCallback((nodeIds: string[]) => {
    if (!activeCaptureFlow) return;
    
    const nodeMap = new Map(activeCaptureFlow.nodes.map(n => [n.id, n]));
    const reorderedNodes = nodeIds
      .map(id => nodeMap.get(id))
      .filter((n): n is CaptureNode => n !== undefined);
    
    updateCaptureFlow({ nodes: reorderedNodes });
  }, [activeCaptureFlow, updateCaptureFlow]);
  
  // Get a CaptureFlow by ID
  const getCaptureFlow = useCallback((id: string): CaptureFlow | undefined => {
    return captureFlows.get(id);
  }, [captureFlows]);
  
  // Save a CaptureFlow
  const saveCaptureFlow = useCallback((flow: CaptureFlow) => {
    setCaptureFlows(prev => {
      const next = new Map(prev);
      next.set(flow.id, { ...flow, updatedAt: new Date().toISOString() });
      notifyChange(next);
      return next;
    });
  }, [notifyChange]);
  
  // Delete a CaptureFlow
  const deleteCaptureFlow = useCallback((id: string) => {
    setCaptureFlows(prev => {
      const next = new Map(prev);
      next.delete(id);
      notifyChange(next);
      return next;
    });
    
    if (activeCaptureFlow?.id === id) {
      setActiveCaptureFlowState(null);
      setIsEditingCaptureFlow(false);
      setSelectedNodeId(null);
    }
  }, [activeCaptureFlow, notifyChange]);
  
  // Memoize context value
  const value = useMemo<CaptureFlowContextValue>(() => ({
    activeCaptureFlow,
    setActiveCaptureFlow,
    isEditingCaptureFlow,
    setIsEditingCaptureFlow,
    selectedNodeId,
    setSelectedNodeId,
    createNewCaptureFlow,
    updateCaptureFlow,
    addNode,
    updateNode,
    deleteNode,
    reorderNodes,
    captureFlows,
    getCaptureFlow,
    saveCaptureFlow,
    deleteCaptureFlow,
  }), [
    activeCaptureFlow,
    setActiveCaptureFlow,
    isEditingCaptureFlow,
    selectedNodeId,
    createNewCaptureFlow,
    updateCaptureFlow,
    addNode,
    updateNode,
    deleteNode,
    reorderNodes,
    captureFlows,
    getCaptureFlow,
    saveCaptureFlow,
    deleteCaptureFlow,
  ]);
  
  return (
    <CaptureFlowContext.Provider value={value}>
      {children}
    </CaptureFlowContext.Provider>
  );
}

// ============ HOOK ============

export function useCaptureFlow() {
  const ctx = useContext(CaptureFlowContext);
  if (!ctx) {
    throw new Error('useCaptureFlow must be used within a CaptureFlowProvider');
  }
  return ctx;
}

// Optional: Safe version that doesn't throw
export function useCaptureFlowSafe() {
  return useContext(CaptureFlowContext);
}
