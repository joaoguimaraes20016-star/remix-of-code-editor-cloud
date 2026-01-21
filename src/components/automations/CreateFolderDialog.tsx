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
import { Loader2 } from "lucide-react";

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
  { value: "blue", bg: "bg-blue-500", label: "Blue" },
  { value: "green", bg: "bg-green-500", label: "Green" },
  { value: "purple", bg: "bg-purple-500", label: "Purple" },
  { value: "orange", bg: "bg-orange-500", label: "Orange" },
  { value: "red", bg: "bg-red-500", label: "Red" },
  { value: "pink", bg: "bg-pink-500", label: "Pink" },
  { value: "yellow", bg: "bg-yellow-500", label: "Yellow" },
  { value: "cyan", bg: "bg-cyan-500", label: "Cyan" },
];

export function CreateFolderDialog({
  open,
  onOpenChange,
  teamId,
  editingFolder,
}: CreateFolderDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");

  useEffect(() => {
    if (editingFolder) {
      setName(editingFolder.name);
      setColor(editingFolder.color);
    } else {
      setName("");
      setColor("blue");
    }
  }, [editingFolder, open]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (editingFolder) {
        const { error } = await supabase
          .from("automation_folders")
          .update({ name, color })
          .eq("id", editingFolder.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("automation_folders").insert({
          team_id: teamId,
          name,
          color,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingFolder ? "Edit Folder" : "Create Folder"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Folder Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Lead Follow-ups"
                autoFocus
              />
            </div>

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
                        ? "ring-2 ring-offset-2 ring-primary"
                        : "opacity-60 hover:opacity-100"
                    )}
                    title={c.label}
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
