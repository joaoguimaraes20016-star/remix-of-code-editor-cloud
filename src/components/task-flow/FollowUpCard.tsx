import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowUpCardProps {
  id: string;
  sequence: number;
  label: string;
  hoursAfter: number;
  assignedRole: string;
  enabled: boolean;
  stage: string;
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  no_show: 'no-show',
  canceled: 'cancellation',
  disqualified: 'disqualification',
};

export function FollowUpCard({
  id,
  sequence,
  label,
  hoursAfter,
  assignedRole,
  enabled,
  stage,
  onUpdate,
  onRemove,
  canRemove,
}: FollowUpCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPreviewText = () => {
    const days = Math.floor(hoursAfter / 24);
    const remainingHours = hoursAfter % 24;
    
    let timeText = '';
    if (days > 0 && remainingHours > 0) {
      timeText = `${days} day${days > 1 ? 's' : ''} ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
    } else if (days > 0) {
      timeText = `${days} day${days > 1 ? 's' : ''}`;
    } else {
      timeText = `${hoursAfter} hour${hoursAfter > 1 ? 's' : ''}`;
    }

    const roleLabel = assignedRole === 'off' ? 'No one' : assignedRole.charAt(0).toUpperCase() + assignedRole.slice(1);
    const stageLabel = STAGE_LABELS[stage] || stage;

    if (assignedRole === 'off') {
      return `Task will not be created for this follow-up`;
    }
    
    return `${roleLabel} will receive this task ${timeText} (${hoursAfter}h) after ${stageLabel}`;
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'mb-3 transition-opacity',
        isDragging && 'opacity-50',
        !enabled && 'opacity-60'
      )}
    >
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <button
            className="cursor-grab active:cursor-grabbing mt-2 text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="flex-1 space-y-4">
            {/* Header with Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">
                  Follow-Up #{sequence}
                </Label>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) => onUpdate('enabled', checked)}
                />
                <span className="text-sm text-muted-foreground">
                  {enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {canRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Label Input */}
            <div className="space-y-2">
              <Label htmlFor={`label-${id}`}>Label</Label>
              <Input
                id={`label-${id}`}
                value={label}
                onChange={(e) => onUpdate('label', e.target.value)}
                placeholder="e.g., First Follow-Up, Second Attempt"
              />
            </div>

            {/* Hours After and Role Selection */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`hours-${id}`} className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Hours After Stage Change
                </Label>
                <Input
                  id={`hours-${id}`}
                  type="number"
                  min={1}
                  max={8760}
                  value={hoursAfter}
                  onChange={(e) => onUpdate('hours_after', parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">
                  {Math.floor(hoursAfter / 24) > 0 && `≈ ${Math.floor(hoursAfter / 24)} days`}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`role-${id}`}>Assigned To</Label>
                <Select
                  value={assignedRole}
                  onValueChange={(value) => onUpdate('assigned_role', value)}
                >
                  <SelectTrigger id={`role-${id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="setter">Setter</SelectItem>
                    <SelectItem value="closer">Closer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="offer_owner">Offer Owner</SelectItem>
                    <SelectItem value="off">Off (Don't Create)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview Text */}
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">{getPreviewText()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
