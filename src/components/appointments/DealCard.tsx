import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GripVertical, MoreVertical, DollarSign, Calendar, User } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface DealCardProps {
  id: string;
  appointment: {
    id: string;
    lead_name: string;
    lead_email: string;
    start_at_utc: string;
    cc_collected: number | null;
    mrr_amount: number | null;
    setter_name: string | null;
    updated_at: string;
    pipeline_stage: string | null;
  };
  onCloseDeal: (appointment: any) => void;
  onMoveTo: (id: string, stage: string) => void;
}

export function DealCard({ id, appointment, onCloseDeal, onMoveTo }: DealCardProps) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  const dealValue = (appointment.cc_collected || 0) + (appointment.mrr_amount || 0) * 12;
  const daysInStage = differenceInDays(new Date(), new Date(appointment.updated_at));
  
  const getDaysColor = (days: number) => {
    if (days < 7) return "text-green-600 dark:text-green-400";
    if (days < 14) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-3 mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div {...attributes} {...listeners} className="cursor-grab mt-1">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{appointment.lead_name}</h4>
            <p className="text-xs text-muted-foreground truncate">{appointment.lead_email}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onCloseDeal(appointment)}>
              Close Deal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMoveTo(id, 'lost')}>
              Mark as Lost
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {dealValue > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-semibold">${dealValue.toLocaleString()}</span>
        </div>
      )}

      <div className="space-y-1 text-xs text-muted-foreground">
        {appointment.setter_name && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate">{appointment.setter_name}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{format(new Date(appointment.start_at_utc), "MMM dd")}</span>
        </div>
        <div className={getDaysColor(daysInStage)}>
          {daysInStage} day{daysInStage !== 1 ? 's' : ''} in stage
        </div>
      </div>
    </Card>
  );
}
