import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Folder, 
  FolderOpen, 
  Plus, 
  MoreHorizontal,
  Pencil,
  Trash2,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { toast } from "sonner";

interface AutomationFolder {
  id: string;
  name: string;
  color: string;
  icon: string;
  position: number;
}

interface AutomationFoldersSidebarProps {
  teamId: string;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  automationCounts: Record<string, number>;
  totalCount: number;
}

const FOLDER_COLORS: Record<string, string> = {
  blue: "text-blue-500",
  green: "text-green-500",
  purple: "text-purple-500",
  orange: "text-orange-500",
  red: "text-red-500",
  pink: "text-pink-500",
  yellow: "text-yellow-500",
  cyan: "text-cyan-500",
};

export function AutomationFoldersSidebar({
  teamId,
  selectedFolderId,
  onSelectFolder,
  automationCounts,
  totalCount,
}: AutomationFoldersSidebarProps) {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<AutomationFolder | null>(null);

  const { data: folders = [], isLoading } = useQuery({
    queryKey: ["automation-folders", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_folders")
        .select("*")
        .eq("team_id", teamId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as AutomationFolder[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase
        .from("automation_folders")
        .delete()
        .eq("id", folderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-folders"] });
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast.success("Folder deleted");
      if (selectedFolderId === editingFolder?.id) {
        onSelectFolder(null);
      }
    },
    onError: () => {
      toast.error("Failed to delete folder");
    },
  });

  const handleEditFolder = (folder: AutomationFolder) => {
    setEditingFolder(folder);
    setCreateDialogOpen(true);
  };

  const handleDeleteFolder = (folder: AutomationFolder) => {
    if (confirm(`Delete "${folder.name}"? Automations will be moved to "All Automations".`)) {
      deleteMutation.mutate(folder.id);
    }
  };

  const handleDialogClose = () => {
    setCreateDialogOpen(false);
    setEditingFolder(null);
  };

  const uncategorizedCount = totalCount - Object.values(automationCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="w-56 border-r border-border bg-muted/30 flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Folders
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* All Automations */}
        <button
          onClick={() => onSelectFolder(null)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
            "hover:bg-muted",
            selectedFolderId === null && "bg-primary/10 text-primary font-medium"
          )}
        >
          <Zap className="h-4 w-4" />
          <span className="flex-1 text-left">All Automations</span>
          <span className="text-xs text-muted-foreground">{totalCount}</span>
        </button>

        {/* Uncategorized */}
        {uncategorizedCount > 0 && (
          <button
            onClick={() => onSelectFolder("uncategorized")}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
              "hover:bg-muted",
              selectedFolderId === "uncategorized" && "bg-primary/10 text-primary font-medium"
            )}
          >
            <Folder className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-left text-muted-foreground">Uncategorized</span>
            <span className="text-xs text-muted-foreground">{uncategorizedCount}</span>
          </button>
        )}

        {/* Separator */}
        {folders.length > 0 && (
          <div className="h-px bg-border my-2" />
        )}

        {/* Folder List */}
        <AnimatePresence mode="popLayout">
          {folders.map((folder) => (
            <motion.div
              key={folder.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="group relative"
            >
              <button
                onClick={() => onSelectFolder(folder.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  "hover:bg-muted",
                  selectedFolderId === folder.id && "bg-primary/10 text-primary font-medium"
                )}
              >
                {selectedFolderId === folder.id ? (
                  <FolderOpen className={cn("h-4 w-4", FOLDER_COLORS[folder.color] || "text-blue-500")} />
                ) : (
                  <Folder className={cn("h-4 w-4", FOLDER_COLORS[folder.color] || "text-blue-500")} />
                )}
                <span className="flex-1 text-left truncate">{folder.name}</span>
                <span className="text-xs text-muted-foreground">
                  {automationCounts[folder.id] || 0}
                </span>
              </button>

              {/* Folder Actions */}
              <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditFolder(folder)}>
                      <Pencil className="h-3 w-3 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteFolder(folder)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create Folder Button */}
      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New Folder
        </Button>
      </div>

      <CreateFolderDialog
        open={createDialogOpen}
        onOpenChange={handleDialogClose}
        teamId={teamId}
        editingFolder={editingFolder}
      />
    </div>
  );
}
