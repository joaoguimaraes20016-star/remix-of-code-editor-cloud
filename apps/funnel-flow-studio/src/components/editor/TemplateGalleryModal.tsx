import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TemplateCard, TemplateMetadata } from './TemplateCard';
import { templates } from '@/lib/templates';
import { Funnel } from '@/types/funnel';
import { Sparkles, LayoutTemplate, Target } from 'lucide-react';

interface TemplateGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: Funnel) => void;
}

// Define metadata for each template with visual properties
const templateMetadata: Record<string, Omit<TemplateMetadata, 'id' | 'name' | 'description' | 'stepCount'>> = {
  'Trading Course Funnel': {
    category: 'niche',
    categoryLabel: 'Trading',
    headline: 'Turn market knowledge into consistent profits',
    colors: {
      background: '#0f0f1a',
      heading: '#ffd700',
      text: '#e5e7eb',
      accent: '#ffd700',
    },
  },
  'Marketing Agency Funnel': {
    category: 'niche',
    categoryLabel: 'Marketing',
    headline: '10X your leads without hiring an in-house team',
    colors: {
      background: '#ffffff',
      heading: '#0f172a',
      text: '#374151',
      accent: '#3b82f6',
    },
  },
  'Consulting Funnel': {
    category: 'niche',
    categoryLabel: 'Consulting',
    headline: 'Strategic clarity for 7-figure business owners',
    colors: {
      background: '#020617',
      heading: '#f8fafc',
      text: '#94a3b8',
      accent: '#6366f1',
    },
  },
  'Coaching Funnel': {
    category: 'niche',
    categoryLabel: 'Coaching',
    headline: 'Unlock your full potential in 90 days',
    colors: {
      background: '#fffbeb',
      heading: '#451a03',
      text: '#78350f',
      accent: '#f59e0b',
    },
  },
  'Lead Magnet Funnel': {
    category: 'general',
    categoryLabel: 'Lead Capture',
    headline: 'Capture emails with a free resource offer',
    colors: {
      background: '#f8fafc',
      heading: '#0f172a',
      text: '#475569',
      accent: '#10b981',
    },
  },
  'Booking Funnel': {
    category: 'general',
    categoryLabel: 'Appointment',
    headline: 'Let prospects easily book appointments with you',
    colors: {
      background: '#faf5ff',
      heading: '#581c87',
      text: '#6b21a8',
      accent: '#a855f7',
    },
  },
  'Quiz Funnel': {
    category: 'general',
    categoryLabel: 'Quiz',
    headline: 'Segment and qualify leads with interactive quizzes',
    colors: {
      background: '#ecfeff',
      heading: '#164e63',
      text: '#155e75',
      accent: '#06b6d4',
    },
  },
  'Webinar Funnel': {
    category: 'general',
    categoryLabel: 'Webinar',
    headline: 'Fill your webinar with engaged attendees',
    colors: {
      background: '#fef2f2',
      heading: '#7f1d1d',
      text: '#991b1b',
      accent: '#ef4444',
    },
  },
  'Sales Page Funnel': {
    category: 'general',
    categoryLabel: 'Sales Page',
    headline: 'High-converting product sales page',
    colors: {
      background: '#f0fdf4',
      heading: '#14532d',
      text: '#166534',
      accent: '#22c55e',
    },
  },
};

// Get default metadata for templates without explicit configuration
const getDefaultMetadata = (templateName: string, index: number): Omit<TemplateMetadata, 'id' | 'name' | 'description' | 'stepCount'> => {
  const palettes = [
    { background: '#f8fafc', heading: '#0f172a', text: '#64748b', accent: '#6366f1' },
    { background: '#fefce8', heading: '#713f12', text: '#854d0e', accent: '#eab308' },
    { background: '#f0fdfa', heading: '#134e4a', text: '#115e59', accent: '#14b8a6' },
  ];
  return {
    category: 'general',
    categoryLabel: 'Template',
    headline: templateName.replace(' Funnel', ''),
    colors: palettes[index % palettes.length],
  };
};

export function TemplateGalleryModal({ open, onOpenChange, onSelectTemplate }: TemplateGalleryModalProps) {
  const [activeTab, setActiveTab] = useState('all');

  // Build template data with metadata
  const templatesWithMetadata = templates.map((template, index) => {
    const meta = templateMetadata[template.name] || getDefaultMetadata(template.name, index);
    return {
      template,
      metadata: {
        id: template.id,
        name: template.name,
        description: template.description || '',
        stepCount: template.steps.length,
        category: meta.category,
        categoryLabel: meta.categoryLabel,
        headline: meta.headline,
        colors: meta.colors,
      } as TemplateMetadata,
    };
  });

  const nicheTemplates = templatesWithMetadata.filter(t => t.metadata.category === 'niche');
  const generalTemplates = templatesWithMetadata.filter(t => t.metadata.category === 'general');

  const handleSelect = (template: Funnel) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  const renderGrid = (items: typeof templatesWithMetadata) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
      {items.map(({ template, metadata }) => (
        <TemplateCard
          key={template.id}
          template={template}
          metadata={metadata}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Choose a Template</DialogTitle>
              <DialogDescription className="text-sm">
                Start with a high-converting funnel built for your niche
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-6 pt-4 border-b border-border shrink-0">
            <TabsList className="h-9 bg-muted/50">
              <TabsTrigger value="all" className="text-xs gap-1.5">
                <LayoutTemplate className="h-3.5 w-3.5" />
                All Templates
              </TabsTrigger>
              <TabsTrigger value="niche" className="text-xs gap-1.5">
                <Target className="h-3.5 w-3.5" />
                Niche ({nicheTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="general" className="text-xs gap-1.5">
                <LayoutTemplate className="h-3.5 w-3.5" />
                General ({generalTemplates.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 min-h-0 h-full">
            <div className="px-6 py-4">
              <TabsContent value="all" className="m-0 mt-0">
                {nicheTemplates.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Featured Niche Templates
                    </h3>
                    {renderGrid(nicheTemplates)}
                  </div>
                )}
                {generalTemplates.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      General Templates
                    </h3>
                    {renderGrid(generalTemplates)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="niche" className="m-0 mt-0">
                {renderGrid(nicheTemplates)}
              </TabsContent>

              <TabsContent value="general" className="m-0 mt-0">
                {renderGrid(generalTemplates)}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
