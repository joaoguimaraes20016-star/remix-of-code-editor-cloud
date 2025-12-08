import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { FunnelStep } from '@/pages/FunnelEditor';
import { cn } from '@/lib/utils';

interface StepContentEditorProps {
  step: FunnelStep;
  onUpdate: (content: FunnelStep['content']) => void;
  selectedElement?: string | null;
}

const stepTypeLabels = {
  welcome: 'Welcome',
  text_question: 'Text Question',
  multi_choice: 'Multi Choice',
  email_capture: 'Email Capture',
  phone_capture: 'Phone Capture',
  video: 'Video',
  thank_you: 'Thank You',
};

export function StepContentEditor({ step, onUpdate, selectedElement }: StepContentEditorProps) {
  const content = step.content;
  const headlineRef = useRef<HTMLInputElement>(null);
  const subtextRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLInputElement>(null);
  const placeholderRef = useRef<HTMLInputElement>(null);

  // Auto-focus based on selected element
  useEffect(() => {
    if (selectedElement === 'headline') headlineRef.current?.focus();
    if (selectedElement === 'subtext') subtextRef.current?.focus();
    if (selectedElement === 'button_text') buttonRef.current?.focus();
    if (selectedElement === 'placeholder') placeholderRef.current?.focus();
  }, [selectedElement]);

  const updateField = (field: string, value: any) => {
    onUpdate({ ...content, [field]: value });
  };

  const isHighlighted = (field: string) => selectedElement === field;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-1">
          Content
        </h3>
        <p className="text-xs text-muted-foreground">
          {stepTypeLabels[step.step_type]}
        </p>
      </div>

      {/* Headline - all types */}
      <div className={cn(
        "space-y-2 p-3 -mx-3 rounded-lg transition-colors",
        isHighlighted('headline') && "bg-primary/10 ring-1 ring-primary/30"
      )}>
        <Label className="text-xs">Headline</Label>
        <Input
          ref={headlineRef}
          value={content.headline || ''}
          onChange={(e) => updateField('headline', e.target.value)}
          placeholder="Enter headline..."
        />
      </div>

      {/* Subtext - most types */}
      {step.step_type !== 'multi_choice' && (
        <div className={cn(
          "space-y-2 p-3 -mx-3 rounded-lg transition-colors",
          isHighlighted('subtext') && "bg-primary/10 ring-1 ring-primary/30"
        )}>
          <Label className="text-xs">Subtext</Label>
          <Textarea
            ref={subtextRef}
            value={content.subtext || ''}
            onChange={(e) => updateField('subtext', e.target.value)}
            placeholder="Additional text (optional)..."
            rows={2}
          />
        </div>
      )}

      {/* Button text - welcome, video */}
      {(step.step_type === 'welcome' || step.step_type === 'video') && (
        <div className={cn(
          "space-y-2 p-3 -mx-3 rounded-lg transition-colors",
          isHighlighted('button_text') && "bg-primary/10 ring-1 ring-primary/30"
        )}>
          <Label className="text-xs">Button Text</Label>
          <Input
            ref={buttonRef}
            value={content.button_text || ''}
            onChange={(e) => updateField('button_text', e.target.value)}
            placeholder="Continue"
          />
        </div>
      )}

      {/* Placeholder - text_question, email, phone */}
      {(step.step_type === 'text_question' || step.step_type === 'email_capture' || step.step_type === 'phone_capture') && (
        <div className={cn(
          "space-y-2 p-3 -mx-3 rounded-lg transition-colors",
          isHighlighted('placeholder') && "bg-primary/10 ring-1 ring-primary/30"
        )}>
          <Label className="text-xs">Placeholder</Label>
          <Input
            ref={placeholderRef}
            value={content.placeholder || ''}
            onChange={(e) => updateField('placeholder', e.target.value)}
            placeholder="Type here..."
          />
        </div>
      )}

      {/* Video URL */}
      {step.step_type === 'video' && (
        <div className={cn(
          "space-y-2 p-3 -mx-3 rounded-lg transition-colors",
          isHighlighted('video_url') && "bg-primary/10 ring-1 ring-primary/30"
        )}>
          <Label className="text-xs">Video URL</Label>
          <Input
            value={content.video_url || ''}
            onChange={(e) => updateField('video_url', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="text-xs text-muted-foreground">
            Supports YouTube, Vimeo, and Wistia
          </p>
        </div>
      )}

      {/* Multi Choice Options */}
      {step.step_type === 'multi_choice' && (
        <div className={cn(
          "space-y-2 p-3 -mx-3 rounded-lg transition-colors",
          isHighlighted('options') && "bg-primary/10 ring-1 ring-primary/30"
        )}>
          <Label className="text-xs">Options</Label>
          <div className="space-y-2">
            {(content.options || []).map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(content.options || [])];
                    newOptions[index] = e.target.value;
                    updateField('options', newOptions);
                  }}
                  placeholder={`Option ${index + 1}`}
                />
                {(content.options || []).length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newOptions = (content.options || []).filter((_, i) => i !== index);
                      updateField('options', newOptions);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newOptions = [...(content.options || []), `Option ${(content.options || []).length + 1}`];
              updateField('options', newOptions);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        </div>
      )}

      {/* Required toggle - questions only */}
      {(step.step_type === 'text_question' || step.step_type === 'multi_choice' || step.step_type === 'email_capture' || step.step_type === 'phone_capture') && (
        <div className="flex items-center justify-between p-3 -mx-3 rounded-lg">
          <Label className="text-xs">Required</Label>
          <Switch
            checked={content.is_required !== false}
            onCheckedChange={(checked) => updateField('is_required', checked)}
          />
        </div>
      )}

      {/* Redirect URL - thank_you only */}
      {step.step_type === 'thank_you' && (
        <div className="space-y-2 p-3 -mx-3 rounded-lg">
          <Label className="text-xs">Redirect URL (optional)</Label>
          <Input
            value={content.redirect_url || ''}
            onChange={(e) => updateField('redirect_url', e.target.value)}
            placeholder="https://..."
          />
          <p className="text-xs text-muted-foreground">
            Redirect to this URL after 3 seconds
          </p>
        </div>
      )}
    </div>
  );
}
