import React from 'react';
import { useFunnel } from '@/context/FunnelContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { StepType } from '@/types/funnel';
import { FileInput, ShoppingCart, Calendar, GraduationCap, Trophy } from 'lucide-react';

const stepTypeConfig: Record<StepType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  capture: { label: 'Capture', icon: FileInput, color: 'text-blue-500' },
  sell: { label: 'Sell', icon: ShoppingCart, color: 'text-green-500' },
  book: { label: 'Book', icon: Calendar, color: 'text-purple-500' },
  educate: { label: 'Educate', icon: GraduationCap, color: 'text-amber-500' },
  result: { label: 'Result', icon: Trophy, color: 'text-emerald-500' },
};

export function StepSettings() {
  const { funnel, setFunnel, currentStepId, updateStep } = useFunnel();
  
  const currentStep = funnel.steps.find(s => s.id === currentStepId);
  
  if (!currentStep) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No step selected
      </div>
    );
  }

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('settings.')) {
      const settingsField = field.replace('settings.', '');
      updateStep(currentStep.id, {
        settings: { ...currentStep.settings, [settingsField]: value }
      });
    } else {
      updateStep(currentStep.id, { [field]: value });
    }
  };

  const handleFunnelSettingChange = (key: string, value: any) => {
    setFunnel({
      ...funnel,
      settings: { ...funnel.settings, [key]: value }
    });
  };

  return (
    <div className="space-y-6">
      {/* Step Name */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Step Name</Label>
        <Input
          value={currentStep.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Step name"
          className="h-9"
        />
      </div>

      {/* Step Type */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Step Type</Label>
        <Select
          value={currentStep.type}
          onValueChange={(value) => handleChange('type', value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {Object.entries(stepTypeConfig).map(([value, config]) => {
              const Icon = config.icon;
              return (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* URL Slug */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">URL Slug</Label>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">/</span>
          <Input
            value={currentStep.slug}
            onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="step-name"
            className="h-9 flex-1"
          />
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <div className="space-y-4">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Navigation</Label>
        
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">On Complete, Go To</Label>
          <Select
            value={currentStep.settings.nextStepId || 'next'}
            onValueChange={(value) => handleChange('settings.nextStepId', value === 'next' ? undefined : value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Next step" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="next">Next Step (Default)</SelectItem>
              <SelectItem value="end">End Funnel</SelectItem>
              {funnel.steps
                .filter(s => s.id !== currentStep.id)
                .map(step => (
                  <SelectItem key={step.id} value={step.id}>
                    Go to: {step.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Analytics */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Conversion Event</Label>
        <Input
          value={currentStep.settings.conversionEvent || ''}
          onChange={(e) => handleChange('settings.conversionEvent', e.target.value)}
          placeholder="e.g., lead_captured"
          className="h-9"
        />
        <p className="text-[10px] text-muted-foreground">
          Track this step completion in your analytics
        </p>
      </div>

      <Separator />

      {/* Background */}
      <div className="space-y-4">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Background</Label>
        
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={currentStep.settings.backgroundColor || '#ffffff'}
              onChange={(e) => handleChange('settings.backgroundColor', e.target.value)}
              className="w-10 h-9 p-1 cursor-pointer"
            />
            <Input
              value={currentStep.settings.backgroundColor || ''}
              onChange={(e) => handleChange('settings.backgroundColor', e.target.value)}
              placeholder="#ffffff"
              className="h-9 flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Image URL</Label>
          <Input
            value={currentStep.settings.backgroundImage || ''}
            onChange={(e) => handleChange('settings.backgroundImage', e.target.value)}
            placeholder="https://..."
            className="h-9"
          />
        </div>
      </div>

      <Separator />

      {/* Funnel Display Settings */}
      <div className="space-y-4">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Display</Label>
        
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xs">Step Indicator</Label>
            <p className="text-[10px] text-muted-foreground">
              Show navigation dots at bottom
            </p>
          </div>
          <Switch
            checked={funnel.settings.showStepIndicator !== false}
            onCheckedChange={(v) => handleFunnelSettingChange('showStepIndicator', v)}
          />
        </div>
      </div>
    </div>
  );
}
