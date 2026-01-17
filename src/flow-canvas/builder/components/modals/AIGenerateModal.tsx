import React, { useState } from 'react';
import { Sparkles, Wand2, Loader2, Lightbulb, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Block } from '../../../types/infostack';
import { generateId } from '../../utils/helpers';
import { toast } from 'sonner';
import { generateBlock, PageContext } from '@/lib/ai/aiCopilotService';

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateBlock: (block: Block) => void;
  context?: PageContext;
}

const suggestions = [
  'Create a hero section with a headline and call-to-action',
  'Generate a testimonials section with 3 customer quotes',
  'Build a pricing table with 3 tiers',
  'Create a FAQ section with 5 common questions',
  'Design a feature grid highlighting 4 key benefits',
];

export const AIGenerateModal: React.FC<AIGenerateModalProps> = ({
  isOpen,
  onClose,
  onGenerateBlock,
  context = {},
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    
    try {
      const aiBlock = await generateBlock(prompt, context);
      
      // Convert AI response to Block format with proper IDs
      const blockType = (aiBlock.type || 'text-block') as Block['type'];
      const block: Block = {
        id: generateId(),
        type: blockType,
        label: aiBlock.label || 'AI Generated Block',
        elements: (aiBlock.elements || []).map(el => ({
          id: generateId(),
          type: el.type as 'heading' | 'text' | 'button' | 'image',
          content: el.content,
          props: el.props || {},
        })),
        props: aiBlock.props || {},
      };

      onGenerateBlock(block);
      setPrompt('');
      toast.success('Block generated successfully!');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate block';
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setError(null);
  };

  const handleClose = () => {
    setError(null);
    setPrompt('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-builder-surface border-builder-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-builder-text flex items-center gap-2">
            <div className="p-1.5 rounded-lg btn-gradient">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Generate with AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-builder-text">
              Describe what you want to create
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setError(null);
              }}
              placeholder="E.g., Create a hero section with a bold headline, supporting text, and a call-to-action button..."
              className="builder-input resize-none"
              rows={4}
            />
          </div>

          {/* Error State */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Suggestions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-builder-text-muted">
              <Lightbulb className="w-3.5 h-3.5" />
              Try these prompts
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isGenerating}
                  className="text-xs px-3 py-1.5 rounded-full bg-[hsl(var(--builder-surface-hover))] border border-[hsl(var(--builder-border-subtle))] text-builder-text-secondary hover:bg-builder-accent/10 hover:text-builder-accent hover:border-builder-accent/30 transition-colors disabled:opacity-50"
                >
                  {suggestion.length > 40 ? suggestion.slice(0, 40) + '...' : suggestion}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Block
              </>
            )}
          </Button>

          <p className="text-xs text-builder-text-dim text-center">
            AI generation uses credits from your account
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
