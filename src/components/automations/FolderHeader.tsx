import { useNavigate } from "react-router-dom";
import { Plus, Search, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FolderHeaderProps {
  teamId: string;
  folderName: string;
  automationCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  folderId: string | null;
  onCreateFolder: () => void;
}

export function FolderHeader({
  teamId,
  folderName,
  automationCount,
  searchQuery,
  onSearchChange,
  folderId,
  onCreateFolder,
}: FolderHeaderProps) {
  const navigate = useNavigate();

  const handleCreateAutomation = () => {
    // Pass folder ID as query param for new automations
    const folderParam = folderId && folderId !== "uncategorized" ? `?folder=${folderId}` : "";
    navigate(`/team/${teamId}/workflows/new/edit${folderParam}`);
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-semibold">{folderName}</h2>
        <p className="text-sm text-muted-foreground">
          {automationCount} automation{automationCount !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search automations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 w-64"
          />
        </div>

        <Button variant="outline" onClick={onCreateFolder}>
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>

        <Button onClick={handleCreateAutomation}>
          <Plus className="h-4 w-4 mr-2" />
          Create Automation
        </Button>
      </div>
    </div>
  );
}
