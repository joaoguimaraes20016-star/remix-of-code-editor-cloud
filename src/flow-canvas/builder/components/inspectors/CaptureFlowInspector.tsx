import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Plus,
  GripVertical,
  MoreHorizontal,
  Trash2,
  Copy,
  Settings2,
  Palette,
  Layers,
  Type,
  List,
  CheckSquare,
  Mail,
  Phone,
  User,
  Calendar,
  Scale,
  ToggleLeft,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCaptureFlow } from '../../contexts/CaptureFlowContext';
import { CaptureNode, CaptureNodeType, CaptureFlow } from '../../../types/captureFlow';
import { CaptureNodeEditor } from './CaptureNodeEditor';
import { BackgroundEditor, BackgroundValue } from '../BackgroundEditor';
import { ColorPickerPopover } from '../modals';

// ============ NODE TYPE CONFIG ============

const nodeTypeIcons: Record<CaptureNodeType, React.ReactNode> = {
  'open-ended': <Type className="w-3.5 h-3.5" />,
  'single-choice': <List className="w-3.5 h-3.5" />,
  'multi-choice': <CheckSquare className="w-3.5 h-3.5" />,
  'email': <Mail className="w-3.5 h-3.5" />,
  'phone': <Phone className="w-3.5 h-3.5" />,
  'name': <User className="w-3.5 h-3.5" />,
  'date': <Calendar className="w-3.5 h-3.5" />,
  'scale': <Scale className="w-3.5 h-3.5" />,
  'yes-no': <ToggleLeft className="w-3.5 h-3.5" />,
};

const nodeTypeLabels: Record<CaptureNodeType, string> = {
  'open-ended': 'Open-ended',
  'single-choice': 'Single Choice',
  'multi-choice': 'Multi Choice',
  'email': 'Email',
  'phone': 'Phone',
  'name': 'Name',
  'date': 'Date',
  'scale': 'Scale',
  'yes-no': 'Yes/No',
};

// ============ SORTABLE NODE ITEM ============

interface NodeListItemProps {
  node: CaptureNode;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const NodeListItem: React.FC<NodeListItemProps> = ({
  node,
  index,
  isActive,
  onSelect,
  onDuplicate,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        'group relative flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150',
        isActive 
          ? 'bg-accent/40 border-l-2 border-foreground' 
          : 'hover:bg-accent/30',
        isDragging && 'opacity-50 z-50 shadow-lg'
      )}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <div 
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>

      {/* Node Number Badge */}
      <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0">
        {index + 1}
      </div>

      {/* Node Info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground truncate">
          {node.settings.title || nodeTypeLabels[node.type]}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {nodeTypeLabels[node.type]}
        </div>
      </div>

      {/* Node Type Icon */}
      <div className="shrink-0 text-muted-foreground">
        {nodeTypeIcons[node.type]}
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent transition-all shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-3 h-3 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background border-border">
          <DropdownMenuItem 
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="text-xs"
          >
            <Copy className="w-3 h-3 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-destructive text-xs"
          >
            <Trash2 className="w-3 h-3 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// ============ MAIN INSPECTOR ============

export const CaptureFlowInspector: React.FC = () => {
  const {
    activeCaptureFlow,
    updateCaptureFlow,
    selectedNodeId,
    setSelectedNodeId,
    addNode,
    updateNode,
    deleteNode,
    reorderNodes,
  } = useCaptureFlow();
  
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!activeCaptureFlow) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Layers className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No CaptureFlow selected</p>
      </div>
    );
  }

  const nodes = activeCaptureFlow.nodes;
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  const activeNode = activeId ? nodes.find(n => n.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = nodes.findIndex((n) => n.id === active.id);
      const newIndex = nodes.findIndex((n) => n.id === over.id);
      const newOrder = arrayMove(nodes, oldIndex, newIndex);
      reorderNodes(newOrder.map(n => n.id));
    }
  };

  const handleAddNode = (type: CaptureNodeType) => {
    const newNode = addNode(type);
    setSelectedNodeId(newNode.id);
  };

  const handleDuplicateNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const newNode = addNode(node.type, nodeId);
      updateNode(newNode.id, {
        settings: { ...node.settings },
        validation: node.validation ? { ...node.validation } : undefined,
      });
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    deleteNode(nodeId);
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const handleBackToList = () => {
    setSelectedNodeId(null);
  };

  // Two-panel layout: Node List View vs Node Editor View
  if (selectedNode) {
    return (
      <CaptureNodeEditor
        node={selectedNode}
        allNodes={nodes}
        onUpdate={(updates) => updateNode(selectedNode.id, updates)}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
            <Layers className="w-3 h-3 text-muted-foreground" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">Capture Flow</div>
            <div className="text-[10px] text-muted-foreground">{nodes.length} nodes</div>
          </div>
        </div>
      </div>

      {/* Nodes List */}
      <div className="flex-1 overflow-y-auto builder-scroll">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 px-3 py-2 bg-background border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Nodes ({nodes.length})
            </span>
            <span className="text-[10px] text-muted-foreground">Click to edit</span>
          </div>
        </div>
        
        <div className="p-3 space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={nodes.map(n => n.id)} strategy={verticalListSortingStrategy}>
              {nodes.map((node, index) => (
                <NodeListItem
                  key={node.id}
                  node={node}
                  index={index}
                  isActive={node.id === selectedNodeId}
                  onSelect={() => setSelectedNodeId(node.id)}
                  onDuplicate={() => handleDuplicateNode(node.id)}
                  onDelete={() => handleDeleteNode(node.id)}
                />
              ))}
            </SortableContext>
            <DragOverlay>
              {activeNode ? (
                <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-background text-foreground shadow-xl border border-border">
                  <GripVertical className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium">
                    {activeNode.settings.title || nodeTypeLabels[activeNode.type]}
                  </span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Add Node Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-center gap-1 py-2 mt-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-foreground/30 rounded-md transition-colors">
                <Plus className="w-3 h-3" />
                Add Node
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-44 bg-background border-border">
              {(Object.keys(nodeTypeLabels) as CaptureNodeType[]).map((type) => (
                <DropdownMenuItem 
                  key={type}
                  onClick={() => handleAddNode(type)} 
                  className="text-xs"
                >
                  <span className="mr-2 text-muted-foreground">{nodeTypeIcons[type]}</span>
                  {nodeTypeLabels[type]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="border-t border-border p-3 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Appearance</span>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] text-muted-foreground">Background</Label>
          <BackgroundEditor
            value={{
              type: activeCaptureFlow.appearance.background?.type || 'solid',
              color: activeCaptureFlow.appearance.background?.color || '#ffffff',
              gradient: activeCaptureFlow.appearance.background?.gradient,
              imageUrl: activeCaptureFlow.appearance.background?.imageUrl,
            } as BackgroundValue}
            onChange={(value) => {
              updateCaptureFlow({
                appearance: {
                  ...activeCaptureFlow.appearance,
                  background: {
                    type: value.type,
                    color: value.color,
                    gradient: value.gradient,
                    imageUrl: value.imageUrl,
                  },
                },
              });
            }}
            showImageOption={true}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Text Color</Label>
          <ColorPickerPopover
            color={activeCaptureFlow.appearance.textColor || '#000000'}
            onChange={(color) => updateCaptureFlow({
              appearance: { ...activeCaptureFlow.appearance, textColor: color },
            })}
          >
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
              <div 
                className="w-5 h-5 rounded border border-border"
                style={{ backgroundColor: activeCaptureFlow.appearance.textColor || '#000000' }}
              />
              <span className="text-xs text-foreground font-mono">
                {activeCaptureFlow.appearance.textColor || '#000000'}
              </span>
            </button>
          </ColorPickerPopover>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Input Background</Label>
          <ColorPickerPopover
            color={activeCaptureFlow.appearance.inputBackground || '#ffffff'}
            onChange={(color) => updateCaptureFlow({
              appearance: { ...activeCaptureFlow.appearance, inputBackground: color },
            })}
          >
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
              <div 
                className="w-5 h-5 rounded border border-border"
                style={{ backgroundColor: activeCaptureFlow.appearance.inputBackground || '#ffffff' }}
              />
              <span className="text-xs text-foreground font-mono">
                {activeCaptureFlow.appearance.inputBackground || '#ffffff'}
              </span>
            </button>
          </ColorPickerPopover>
        </div>
      </div>

      {/* Flow Settings */}
      <div className="border-t border-border p-3 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Settings2 className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Settings</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Show Progress</Label>
            <button
              onClick={() => updateCaptureFlow({
                appearance: {
                  ...activeCaptureFlow.appearance,
                  showProgress: !activeCaptureFlow.appearance.showProgress,
                },
              })}
              className={cn(
                'w-8 h-4 rounded-full transition-colors relative',
                activeCaptureFlow.appearance.showProgress ? 'bg-primary' : 'bg-muted'
              )}
            >
              <div className={cn(
                'absolute w-3 h-3 rounded-full bg-white top-0.5 transition-all',
                activeCaptureFlow.appearance.showProgress ? 'left-4' : 'left-0.5'
              )} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
