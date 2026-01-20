import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Split } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface Variant {
  id: string;
  name: string;
  percentage: number;
}

interface SplitTestConfig {
  variants: Variant[];
}

interface SplitTestFormProps {
  config: SplitTestConfig;
  onChange: (config: SplitTestConfig) => void;
}

export function SplitTestForm({ config, onChange }: SplitTestFormProps) {
  const variants = config.variants || [
    { id: 'a', name: 'Variant A', percentage: 50 },
    { id: 'b', name: 'Variant B', percentage: 50 },
  ];

  const addVariant = () => {
    const newId = String.fromCharCode(97 + variants.length); // a, b, c, d...
    const evenSplit = Math.floor(100 / (variants.length + 1));
    const newVariants = variants.map(v => ({ ...v, percentage: evenSplit }));
    newVariants.push({ id: newId, name: `Variant ${newId.toUpperCase()}`, percentage: evenSplit });
    
    // Adjust to ensure 100%
    const total = newVariants.reduce((sum, v) => sum + v.percentage, 0);
    if (total < 100) {
      newVariants[0].percentage += 100 - total;
    }
    
    onChange({ ...config, variants: newVariants });
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) return;
    const newVariants = variants.filter((_, i) => i !== index);
    // Redistribute percentages
    const evenSplit = Math.floor(100 / newVariants.length);
    const distributed = newVariants.map(v => ({ ...v, percentage: evenSplit }));
    const total = distributed.reduce((sum, v) => sum + v.percentage, 0);
    if (total < 100) {
      distributed[0].percentage += 100 - total;
    }
    onChange({ ...config, variants: distributed });
  };

  const updateVariant = (index: number, update: Partial<Variant>) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], ...update };
    onChange({ ...config, variants: newVariants });
  };

  const totalPercentage = variants.reduce((sum, v) => sum + v.percentage, 0);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-pink-500/10 border border-pink-500/20">
        <div className="flex items-start gap-3">
          <Split className="h-5 w-5 text-pink-400 mt-0.5" />
          <div>
            <p className="text-sm text-white/80">
              Randomly split contacts into different paths for A/B testing.
            </p>
            <p className="text-xs text-white/50 mt-1">
              Connect each variant to different next steps in your workflow.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {variants.map((variant, index) => (
          <div key={variant.id} className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={variant.name}
                onChange={(e) => updateVariant(index, { name: e.target.value })}
                className="flex-1"
              />
              {variants.length > 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeVariant(index)}
                  className="shrink-0 text-red-400 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/60">
                <span>Split Percentage</span>
                <span className="font-mono">{variant.percentage}%</span>
              </div>
              <Slider
                value={[variant.percentage]}
                onValueChange={([value]) => updateVariant(index, { percentage: value })}
                min={5}
                max={95}
                step={5}
              />
            </div>
          </div>
        ))}
      </div>

      {totalPercentage !== 100 && (
        <p className="text-xs text-yellow-400">
          ⚠️ Total is {totalPercentage}% (should be 100%)
        </p>
      )}

      {variants.length < 4 && (
        <Button variant="outline" size="sm" onClick={addVariant} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      )}
    </div>
  );
}
