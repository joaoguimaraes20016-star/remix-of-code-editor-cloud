import { useState, useEffect, useCallback } from "react";
import { Search, Play, Loader2, CheckCircle2, AlertCircle, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { runAutomationManually } from "@/lib/automations/triggerHelper";

interface Contact {
  id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}

interface RunNowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automationId: string;
  automationName: string;
  teamId: string;
}

type RunStatus = "idle" | "running" | "success" | "error";

export function RunNowModal({
  open,
  onOpenChange,
  automationId,
  automationName,
  teamId,
}: RunNowModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [runResult, setRunResult] = useState<{
    automationsRun?: string[];
    error?: string;
  } | null>(null);

  // Search contacts when query changes
  const searchContacts = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setContacts([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from("contacts")
          .select("id, name, first_name, last_name, email, phone")
          .eq("team_id", teamId)
          .or(
            `name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`
          )
          .limit(10);

        if (error) {
          console.error("[RunNowModal] Search error:", error);
          return;
        }

        setContacts((data as Contact[]) || []);
      } catch (err) {
        console.error("[RunNowModal] Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    },
    [teamId]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchContacts(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchContacts]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setContacts([]);
      setSelectedContact(null);
      setRunStatus("idle");
      setRunResult(null);
    }
  }, [open]);

  const handleRun = async () => {
    setRunStatus("running");
    setRunResult(null);

    try {
      const result = await runAutomationManually(
        automationId,
        teamId,
        selectedContact?.id
      );

      if (result.success) {
        setRunStatus("success");
        setRunResult({ automationsRun: result.automationsRun });
      } else {
        setRunStatus("error");
        setRunResult({ error: result.error });
      }
    } catch (err) {
      setRunStatus("error");
      setRunResult({
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const getContactDisplayName = (contact: Contact) => {
    if (contact.name) return contact.name;
    if (contact.first_name || contact.last_name) {
      return `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
    }
    return contact.email || contact.phone || "Unnamed Contact";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Run Automation
          </DialogTitle>
          <DialogDescription>
            Manually trigger <strong>{automationName}</strong>. Optionally select a
            contact to run it against.
          </DialogDescription>
        </DialogHeader>

        {runStatus === "idle" || runStatus === "running" ? (
          <>
            {/* Contact Selector */}
            <div className="space-y-3">
              <Label>Select Contact (Optional)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts by name, email, or phone..."
                  className="pl-9"
                  disabled={runStatus === "running"}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Selected Contact Display */}
              {selectedContact && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getContactDisplayName(selectedContact)}
                    </p>
                    {selectedContact.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {selectedContact.email}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setSelectedContact(null)}
                    disabled={runStatus === "running"}
                  >
                    Clear
                  </Button>
                </div>
              )}

              {/* Contact Results */}
              {contacts.length > 0 && !selectedContact && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors",
                        "border-b last:border-b-0"
                      )}
                      onClick={() => {
                        setSelectedContact(contact);
                        setContacts([]);
                        setSearchQuery("");
                      }}
                    >
                      <div className="p-1 rounded-full bg-muted">
                        <User className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {getContactDisplayName(contact)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.email || contact.phone || "No email/phone"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 &&
                contacts.length === 0 &&
                !isSearching &&
                !selectedContact && (
                  <p className="text-sm text-muted-foreground text-center py-3">
                    No contacts found matching &quot;{searchQuery}&quot;
                  </p>
                )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={runStatus === "running"}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRun}
                disabled={runStatus === "running"}
                className="gap-2"
              >
                {runStatus === "running" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Now
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Result Display */}
            <div className="flex flex-col items-center gap-3 py-4">
              {runStatus === "success" ? (
                <>
                  <div className="p-3 rounded-full bg-green-500/10">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-green-600">
                      Automation executed successfully
                    </p>
                    {runResult?.automationsRun &&
                      runResult.automationsRun.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {runResult.automationsRun.length} automation
                          {runResult.automationsRun.length !== 1 ? "s" : ""} ran
                        </p>
                      )}
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-full bg-destructive/10">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-destructive">
                      Automation failed
                    </p>
                    {runResult?.error && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {runResult.error}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setRunStatus("idle");
                  setRunResult(null);
                }}
              >
                Run Again
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
