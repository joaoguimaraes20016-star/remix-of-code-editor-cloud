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
  Zap,
  Sparkles,
  FolderPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { toast } from "sonner";
import { getIconComponent } from "@/components/IconPicker";

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

const FOLDER_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  blue: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-l-blue-500" },
  green: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-l-emerald-500" },
  purple: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-l-purple-500" },
  orange: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-l-orange-500" },
  red: { text: "text-red-400", bg: "bg-red-500/10", border: "border-l-red-500" },
  pink: { text: "text-pink-400", bg: "bg-pink-500/10", border: "border-l-pink-500" },
  yellow: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-l-yellow-500" },
  cyan: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-l-cyan-500" },
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

  const renderFolderIcon = (folder: AutomationFolder, isSelected: boolean) => {
    const colorClasses = FOLDER_COLORS[folder.color] || FOLDER_COLORS.blue;
    
    if (folder.icon) {
      const IconComponent = getIconComponent(folder.icon);
      return <IconComponent className={cn("h-4 w-4", colorClasses.text)} />;
    }
    
    return isSelected 
      ? <FolderOpen className={cn("h-4 w-4", colorClasses.text)} />
      : <Folder className={cn("h-4 w-4", colorClasses.text)} />;
  };

  const FolderContextMenuItems = ({ folder }: { folder: AutomationFolder }) => (
    <>
      <ContextMenuItem onClick={() => handleEditFolder(folder)}>
        <Pencil className="h-3.5 w-3.5 mr-2" />
        Edit Folder
      </ContextMenuItem>
      <ContextMenuItem 
        onClick={() => handleDeleteFolder(folder)}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5 mr-2" />
        Delete Folder
      </ContextMenuItem>
    </>
  );

  return (
    <div className="w-60 border-r border-border bg-card/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              Folders
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* All Automations */}
        <motion.button
          whileHover={{ x: 2 }}
          onClick={() => onSelectFolder(null)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
            "border-l-2 border-transparent",
            selectedFolderId === null 
              ? "bg-primary/10 border-l-primary text-foreground font-medium" 
              : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
          )}
        >
          <div className={cn(
            "p-1.5 rounded-md",
            selectedFolderId === null ? "bg-primary/20" : "bg-muted"
          )}>
            <Zap className={cn(
              "h-3.5 w-3.5",
              selectedFolderId === null ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <span className="flex-1 text-left">All Automations</span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            selectedFolderId === null 
              ? "bg-primary/20 text-primary" 
              : "bg-muted text-muted-foreground"
          )}>
            {totalCount}
          </span>
        </motion.button>

        {/* Uncategorized */}
        {uncategorizedCount > 0 && (
          <motion.button
            whileHover={{ x: 2 }}
            onClick={() => onSelectFolder("uncategorized")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
              "border-l-2 border-transparent",
              selectedFolderId === "uncategorized" 
                ? "bg-muted border-l-muted-foreground text-foreground font-medium" 
                : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="p-1.5 rounded-md bg-muted">
              <Folder className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="flex-1 text-left">Uncategorized</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {uncategorizedCount}
            </span>
          </motion.button>
        )}

        {/* Separator */}
        {folders.length > 0 && (
          <div className="py-2">
            <div className="h-px bg-border" />
          </div>
        )}

        {/* Folder List */}
        <AnimatePresence mode="popLayout">
          {folders.map((folder) => {
            const isSelected = selectedFolderId === folder.id;
            const colorClasses = FOLDER_COLORS[folder.color] || FOLDER_COLORS.blue;
            const count = automationCounts[folder.id] || 0;
            
            return (
              <ContextMenu key={folder.id}>
                <ContextMenuTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="group relative"
                  >
                    <motion.button
                      whileHover={{ x: 2 }}
                      onClick={() => onSelectFolder(folder.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                        "border-l-2",
                        isSelected 
                          ? cn(colorClasses.bg, colorClasses.border, "text-foreground font-medium")
                          : "border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-md transition-colors",
                        isSelected ? colorClasses.bg : "bg-muted group-hover:bg-muted/80"
                      )}>
                        {renderFolderIcon(folder, isSelected)}
                      </div>
                      <span className="flex-1 text-left truncate">{folder.name}</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full transition-colors",
                        isSelected 
                          ? cn(colorClasses.bg, colorClasses.text)
                          : "bg-muted text-muted-foreground"
                      )}>
                        {count}
                      </span>
                    </motion.button>

                    {/* Hover Actions */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 hover:bg-background"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleEditFolder(folder)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteFolder(folder)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <FolderContextMenuItems folder={folder} />
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </AnimatePresence>

        {/* Empty State */}
        {folders.length === 0 && !isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 px-4 text-center"
          >
            <div className="mx-auto w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
              <FolderPlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Organize your automations
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Folder
            </Button>
          </motion.div>
        )}
      </div>

      {/* Footer Create Button */}
      {folders.length > 0 && (
        <div className="p-3 border-t border-border">
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
      )}

      <CreateFolderDialog
        open={createDialogOpen}
        onOpenChange={handleDialogClose}
        teamId={teamId}
        editingFolder={editingFolder}
      />
    </div>
  );
}
