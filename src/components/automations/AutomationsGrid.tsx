import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Zap, FolderInput } from "lucide-react";
import { AutomationCard } from "./AutomationCard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { TriggerType } from "@/lib/automations/types";

interface Automation {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  is_active: boolean;
  definition: unknown;
  folder_id: string | null;
  created_at: string;
}

interface AutomationFolder {
  id: string;
  name: string;
  color: string;
}

interface AutomationsGridProps {
  teamId: string;
  folderId: string | null;
  searchQuery: string;
}

export function AutomationsGrid({
  teamId,
  folderId,
  searchQuery,
}: AutomationsGridProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["automations", teamId, folderId],
    queryFn: async () => {
      let query = supabase
        .from("automations")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

      if (folderId === "uncategorized") {
        query = query.is("folder_id", null);
      } else if (folderId) {
        query = query.eq("folder_id", folderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Automation[];
    },
  });

  const { data: folders = [] } = useQuery({
    queryKey: ["automation-folders", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_folders")
        .select("id, name, color")
        .eq("team_id", teamId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as AutomationFolder[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("automations")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
    onError: () => {
      toast.error("Failed to update automation");
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({ automationId, newFolderId }: { automationId: string; newFolderId: string | null }) => {
      const { error } = await supabase
        .from("automations")
        .update({ folder_id: newFolderId })
        .eq("id", automationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      queryClient.invalidateQueries({ queryKey: ["automation-counts"] });
      toast.success("Automation moved");
    },
    onError: () => {
      toast.error("Failed to move automation");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("automations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      queryClient.invalidateQueries({ queryKey: ["automation-counts"] });
      toast.success("Automation deleted");
    },
    onError: () => {
      toast.error("Failed to delete automation");
    },
  });

  const handleEdit = (automation: Automation) => {
    navigate(`/team/${teamId}/workflows/${automation.id}/edit`);
  };

  const handleToggle = (id: string, isActive: boolean) => {
    toggleMutation.mutate({ id, isActive });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this automation?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicate = (automation: Automation) => {
    toast.info("Duplicate feature coming soon");
  };

  // Filter by search query
  const filteredAutomations = automations.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStepsCount = (automation: Automation) => {
    const def = automation.definition as { steps?: unknown[] } | null;
    if (def && Array.isArray(def.steps)) {
      return def.steps.length;
    }
    return 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filteredAutomations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Zap className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">
          {searchQuery ? "No automations found" : "No automations yet"}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {searchQuery
            ? "Try a different search term"
            : "Create your first automation to start automating your workflows"}
        </p>
        {!searchQuery && (
          <Button onClick={() => {
            const folderParam = folderId && folderId !== "uncategorized" ? `?folder=${folderId}` : "";
            navigate(`/team/${teamId}/workflows/new/edit${folderParam}`);
          }}>
            Create Automation
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AnimatePresence mode="popLayout">
        {filteredAutomations.map((automation, index) => (
          <motion.div
            key={automation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
          >
            <AutomationCard
              name={automation.name}
              description={automation.description || ""}
              triggerType={automation.trigger_type as TriggerType}
              isActive={automation.is_active}
              stepsCount={getStepsCount(automation)}
              onToggle={(active) => handleToggle(automation.id, active)}
              onEdit={() => handleEdit(automation)}
              onDuplicate={() => handleDuplicate(automation)}
              onDelete={() => handleDelete(automation.id)}
              extraActions={
                folders.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <FolderInput className="h-4 w-4 mr-1" />
                        Move
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => moveMutation.mutate({ automationId: automation.id, newFolderId: null })}
                      >
                        Uncategorized
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {folders.map((folder) => (
                        <DropdownMenuItem
                          key={folder.id}
                          onClick={() => moveMutation.mutate({ automationId: automation.id, newFolderId: folder.id })}
                          disabled={folder.id === automation.folder_id}
                        >
                          {folder.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : undefined
              }
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
