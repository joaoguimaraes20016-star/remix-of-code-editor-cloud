import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, UserPlus, AlertTriangle, Heart, 
  Clock, Check, X, Eye, Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  WORKFLOW_TEMPLATES, 
  type WorkflowTemplate,
  createDefinitionFromTemplate 
} from "@/lib/automations/workflowTemplates";
import type { AutomationDefinition } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

interface TemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onSelectTemplate: (definition: AutomationDefinition) => void;
}

const CATEGORY_CONFIG = {
  appointment: {
    label: "Appointment Management",
    icon: Calendar,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
  },
  lead: {
    label: "Lead Nurturing",
    icon: UserPlus,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  recovery: {
    label: "Recovery & Re-engagement",
    icon: AlertTriangle,
    color: "text-sky-400",
    bgColor: "bg-sky-500/20",
  },
  engagement: {
    label: "Customer Engagement",
    icon: Heart,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
};

type Category = keyof typeof CATEGORY_CONFIG;

export function TemplateGallery({
  open,
  onOpenChange,
  teamId,
  onSelectTemplate,
}: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [previewTemplate, setPreviewTemplate] = useState<WorkflowTemplate | null>(null);

  const filteredTemplates = selectedCategory === "all" 
    ? WORKFLOW_TEMPLATES 
    : WORKFLOW_TEMPLATES.filter(t => t.category === selectedCategory);

  const handleUseTemplate = (template: WorkflowTemplate) => {
    const definition = createDefinitionFromTemplate(template, teamId);
    onSelectTemplate(definition);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Start with a Template
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full overflow-hidden">
          {/* Category Filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={cn(
                selectedCategory === "all" 
                  ? "bg-primary" 
                  : "border-border bg-muted/30 text-foreground/70 hover:bg-muted/50"
              )}
            >
              All Templates
            </Button>
            {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const Icon = config.icon;
              return (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    selectedCategory === cat 
                      ? "bg-primary" 
                      : "border-border bg-muted/30 text-foreground/70 hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {config.label}
                </Button>
              );
            })}
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => {
                const catConfig = CATEGORY_CONFIG[template.category];
                const CatIcon = catConfig.icon;

                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="relative group"
                  >
                    <div className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 hover:border-border/70 transition-all">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={cn("p-2 rounded-lg", catConfig.bgColor)}>
                          <CatIcon className={cn("h-5 w-5", catConfig.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {template.name}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          <span>{template.stepCount} steps</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{template.estimatedSetupTime}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template)}
                          className="flex-1"
                        >
                          Use Template
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewTemplate(template)}
                          className="border-border bg-muted/30 hover:bg-muted/50 text-foreground/70"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {previewTemplate && (
          <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
            <DialogContent className="max-w-md bg-background border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">{previewTemplate.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>
                
                {/* Steps Preview */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Steps</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Badge variant="outline" className="text-xs">Trigger</Badge>
                      <span className="text-sm text-foreground">{previewTemplate.trigger.replace(/_/g, " ")}</span>
                    </div>
                    {previewTemplate.steps.map((step, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border"
                      >
                        <Badge variant="outline" className="text-xs">{idx + 1}</Badge>
                        <span className="text-sm text-foreground/80">{step.type.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    handleUseTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="w-full"
                >
                  Use This Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
