import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Loader2, 
  Folder,
  Users,
  Mail,
  Phone,
  Calendar,
  Star,
  Rocket,
  Briefcase,
  ShoppingCart,
  Heart,
  Bell,
  MessageSquare,
  Clock,
  Target,
  Gift,
  Zap,
  Send,
  TrendingUp,
  Award,
  Flame
} from "lucide-react";

interface AutomationFolder {
  id: string;
  name: string;
  color: string;
  icon: string;
  position: number;
}

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  editingFolder?: AutomationFolder | null;
}

const COLORS = [
  { value: "blue", bg: "bg-blue-500", ring: "ring-blue-500" },
  { value: "green", bg: "bg-emerald-500", ring: "ring-emerald-500" },
  { value: "purple", bg: "bg-purple-500", ring: "ring-purple-500" },
  { value: "orange", bg: "bg-orange-500", ring: "ring-orange-500" },
  { value: "red", bg: "bg-red-500", ring: "ring-red-500" },
  { value: "pink", bg: "bg-pink-500", ring: "ring-pink-500" },
  { value: "yellow", bg: "bg-yellow-500", ring: "ring-yellow-500" },
  { value: "cyan", bg: "bg-cyan-500", ring: "ring-cyan-500" },
];

const ICONS = [
  { value: "Folder", icon: Folder, label: "Folder" },
  { value: "Users", icon: Users, label: "Users" },
  { value: "Mail", icon: Mail, label: "Mail" },
  { value: "Phone", icon: Phone, label: "Phone" },
  { value: "Calendar", icon: Calendar, label: "Calendar" },
  { value: "Star", icon: Star, label: "Star" },
  { value: "Rocket", icon: Rocket, label: "Rocket" },
  { value: "Briefcase", icon: Briefcase, label: "Briefcase" },
  { value: "ShoppingCart", icon: ShoppingCart, label: "Cart" },
  { value: "Heart", icon: Heart, label: "Heart" },
  { value: "Bell", icon: Bell, label: "Bell" },
  { value: "MessageSquare", icon: MessageSquare, label: "Message" },
  { value: "Clock", icon: Clock, label: "Clock" },
  { value: "Target", icon: Target, label: "Target" },
  { value: "Gift", icon: Gift, label: "Gift" },
  { value: "Zap", icon: Zap, label: "Zap" },
  { value: "Send", icon: Send, label: "Send" },
  { value: "TrendingUp", icon: TrendingUp, label: "Growth" },
  { value: "Award", icon: Award, label: "Award" },
  { value: "Flame", icon: Flame, label: "Flame" },
];

const COLOR_CLASSES: Record<string, string> = {
  blue: "text-blue-500",
  green: "text-emerald-500",
  purple: "text-purple-500",
  orange: "text-orange-500",
  red: "text-red-500",
  pink: "text-pink-500",
  yellow: "text-yellow-500",
  cyan: "text-cyan-500",
};

export function CreateFolderDialog({
  open,
  onOpenChange,
  teamId,
  editingFolder,
}: CreateFolderDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const [icon, setIcon] = useState("Folder");

  useEffect(() => {
    if (editingFolder) {
      setName(editingFolder.name);
      setColor(editingFolder.color);
      setIcon(editingFolder.icon || "Folder");
    } else {
      setName("");
      setColor("blue");
      setIcon("Folder");
    }
  }, [editingFolder, open]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (editingFolder) {
        const { error } = await supabase
          .from("automation_folders")
          .update({ name, color, icon })
          .eq("id", editingFolder.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("automation_folders").insert({
          team_id: teamId,
          name,
          color,
          icon,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-folders"] });
      toast.success(editingFolder ? "Folder updated" : "Folder created");
      onOpenChange(false);
      setName("");
      setColor("blue");
      setIcon("Folder");
    },
    onError: () => {
      toast.error(editingFolder ? "Failed to update folder" : "Failed to create folder");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a folder name");
      return;
    }
    createMutation.mutate();
  };

  const SelectedIcon = ICONS.find(i => i.value === icon)?.icon || Folder;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                color === "blue" ? "bg-blue-500/10" :
                color === "green" ? "bg-emerald-500/10" :
                color === "purple" ? "bg-purple-500/10" :
                color === "orange" ? "bg-orange-500/10" :
                color === "red" ? "bg-red-500/10" :
                color === "pink" ? "bg-pink-500/10" :
                color === "yellow" ? "bg-yellow-500/10" :
                "bg-cyan-500/10"
              )}>
                <SelectedIcon className={cn("h-5 w-5", COLOR_CLASSES[color])} />
              </div>
              {editingFolder ? "Edit Folder" : "Create Folder"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">Folder Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Lead Follow-ups"
                autoFocus
                className="h-10"
              />
            </div>

            {/* Icon Picker */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-10 gap-1.5">
                {ICONS.map((i) => (
                  <button
                    key={i.value}
                    type="button"
                    onClick={() => setIcon(i.value)}
                    className={cn(
                      "p-2 rounded-lg transition-all flex items-center justify-center",
                      icon === i.value
                        ? cn("bg-primary/10 ring-2 ring-primary", COLOR_CLASSES[color])
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    title={i.label}
                  >
                    <i.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      c.bg,
                      color === c.value
                        ? cn("ring-2 ring-offset-2 ring-offset-background", c.ring)
                        : "opacity-60 hover:opacity-100"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingFolder ? "Save Changes" : "Create Folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
