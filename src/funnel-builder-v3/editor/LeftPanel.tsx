import React, { useState } from 'react';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayersPanel } from './LayersPanel';
import { TemplateGalleryModal } from './TemplateGalleryModal';
import { cn } from '@/lib/utils';
import { Funnel } from '@/funnel-builder-v3/types/funnel';
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Home,
  FileText,
  Layers,
  FolderOpen,
  Sparkles,
  Pencil,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';

function StepItem({ step, index, isActive, isHome, onClick, totalSteps, onRename, onMoveUp, onMoveDown, onDelete }: {
  step: { id: string; name: string; type: string };
  index: number;
  isActive: boolean;
  isHome: boolean;
  onClick: () => void;
  totalSteps: number;
  onRename: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const canMoveUp = index > 0;
  const canMoveDown = index < totalSteps - 1;
  const canDelete = totalSteps > 1;

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200',
        isActive 
          ? 'bg-primary/10 border border-primary/20 shadow-sm' 
          : 'hover:bg-accent border border-transparent'
      )}
    >
      {/* Home or page icon */}
      <div className={cn(
        'w-6 h-6 rounded flex items-center justify-center shrink-0',
        isActive ? 'bg-primary/20' : 'bg-muted'
      )}>
        {isHome ? (
          <Home className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-muted-foreground')} />
        ) : (
          <FileText className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-muted-foreground')} />
        )}
      </div>
      
      <span className={cn(
        'flex-1 text-sm font-medium truncate',
        isActive ? 'text-primary' : 'text-foreground'
      )}>
        {step.name}
      </span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-60 hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover w-48">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={!canMoveUp}
          >
            <ChevronUp className="h-4 w-4 mr-2" />
            Move Up
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={!canMoveDown}
          >
            <ChevronDown className="h-4 w-4 mr-2" />
            Move Down
          </DropdownMenuItem>
          {canDelete && (
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

interface LeftPanelProps {
  onOpenAICopilot?: () => void;
}

export function LeftPanel({ onOpenAICopilot }: LeftPanelProps) {
  const { funnel, setFunnel, currentStepId, setCurrentStepId, addStep, updateStep, reorderSteps, deleteStep } = useFunnel();
  const [activeTab, setActiveTab] = useState('pages');
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleTemplateSelect = (template: Funnel) => {
    setFunnel({ ...template, id: funnel.id });
    setCurrentStepId(template.steps[0]?.id || null);
  };

  const handleRename = (stepId: string) => {
    const step = funnel.steps.find(s => s.id === stepId);
    if (step) {
      setEditingStepId(stepId);
      setEditValue(step.name);
    }
  };

  const handleRenameSubmit = (stepId: string) => {
    if (editValue.trim()) {
      updateStep(stepId, { name: editValue.trim() });
    }
    setEditingStepId(null);
    setEditValue('');
  };

  const handleRenameCancel = () => {
    setEditingStepId(null);
    setEditValue('');
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderSteps(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < funnel.steps.length - 1) {
      reorderSteps(index, index + 1);
    }
  };

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col shrink-0">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-2 pt-2 border-b border-border">
          <TabsList className="w-full h-9 bg-muted/50">
            <TabsTrigger value="pages" className="flex-1 text-xs gap-1.5 min-w-0 px-1.5">
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Pages</span>
            </TabsTrigger>
            <TabsTrigger value="layers" className="flex-1 text-xs gap-1.5 min-w-0 px-1.5">
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Layers</span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex-1 text-xs gap-1.5 min-w-0 px-1.5">
              <FolderOpen className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Assets</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Pages Tab */}
          <TabsContent value="pages" className="m-0 p-2">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pages
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 hover:bg-primary/10" 
                onClick={() => addStep()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {funnel.steps.map((step, index) => (
                editingStepId === step.id ? (
                  <div
                    key={step.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/20 bg-primary/5"
                  >
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleRenameSubmit(step.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameSubmit(step.id);
                        } else if (e.key === 'Escape') {
                          handleRenameCancel();
                        }
                      }}
                      className="flex-1 text-sm font-medium bg-transparent border-none outline-none text-foreground"
                      autoFocus
                    />
                  </div>
                ) : (
                  <StepItem
                    key={step.id}
                    step={step}
                    index={index}
                    isActive={step.id === currentStepId}
                    isHome={index === 0}
                    totalSteps={funnel.steps.length}
                    onClick={() => setCurrentStepId(step.id)}
                    onRename={() => handleRename(step.id)}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                    onDelete={() => deleteStep(step.id)}
                  />
                )
              ))}
            </div>
          </TabsContent>

          {/* Layers Tab */}
          <TabsContent value="layers" className="m-0 p-3">
            <div className="px-1 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Block Layers
              </span>
            </div>
            <LayersPanel />
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="m-0 p-4">
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No assets yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload images and files
              </p>
              <Button variant="outline" size="sm" className="mt-4">
                <Plus className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Template Selector */}
      <div className="p-3 border-t border-border">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 h-9 text-sm"
          onClick={() => setShowTemplateGallery(true)}
        >
          <Sparkles className="h-4 w-4" />
          Choose Template
        </Button>
      </div>

      {/* Template Gallery Modal */}
      <TemplateGalleryModal
        open={showTemplateGallery}
        onOpenChange={setShowTemplateGallery}
        onSelectTemplate={handleTemplateSelect}
      />

      {/* Stacker AI Badge */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => onOpenAICopilot?.()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 hover:from-primary/10 hover:to-primary/15 hover:border-primary/20 transition-all cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-xs font-medium">Stacker AI</span>
            <p className="text-[10px] text-muted-foreground">Powered by AI</p>
          </div>
        </button>
      </div>
    </div>
  );
}
