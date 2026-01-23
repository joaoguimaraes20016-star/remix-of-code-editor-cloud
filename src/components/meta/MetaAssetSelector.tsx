import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, ChevronDown, ChevronUp, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MetaAssetSelectorProps {
  teamId: string;
  onUpdate?: () => void;
}

interface Page {
  id: string;
  name: string;
  category?: string;
  picture?: string;
  has_access_token?: boolean;
  subscribed?: boolean;
}

interface LeadForm {
  id: string;
  name: string;
  status: string;
  leads_count?: number;
  created_time?: string;
}

export function MetaAssetSelector({ teamId, onUpdate }: MetaAssetSelectorProps) {
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  // Fetch pages
  const { data: pagesData, isLoading: loadingPages, refetch: refetchPages } = useQuery({
    queryKey: ["meta-pages", teamId],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("meta-fetch-assets", {
        body: { teamId, assetType: "pages" },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data.assets as Page[];
    },
    enabled: !!teamId,
  });

  // Fetch subscribed pages from integration config
  const { data: integration } = useQuery({
    queryKey: ["meta-integration-config", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_integrations_public" as any)
        .select("config_safe")
        .eq("team_id", teamId)
        .eq("integration_type", "meta")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  const subscribedPageIds = new Set(
    ((integration as any)?.config_safe?.selected_pages || []).map((p: any) => p.id)
  );

  // Subscribe/unsubscribe page mutation
  const subscribePageMutation = useMutation({
    mutationFn: async ({ pageId, action }: { pageId: string; action: "subscribe" | "unsubscribe" }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("meta-subscribe-page", {
        body: { teamId, pageId, action },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: (_, { action }) => {
      toast.success(action === "subscribe" ? "Page subscribed for leads" : "Page unsubscribed");
      refetchPages();
      onUpdate?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const togglePage = (pageId: string) => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  if (loadingPages) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pagesData || pagesData.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground border rounded-lg">
        No Facebook pages found. Make sure you have admin access to at least one page.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pagesData.map((page) => {
        const isSubscribed = subscribedPageIds.has(page.id);
        const isExpanded = expandedPages.has(page.id);
        const isLoading = subscribePageMutation.isPending;

        return (
          <Card key={page.id} className={isSubscribed ? "border-success/50" : ""}>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {page.picture ? (
                    <img
                      src={page.picture}
                      alt={page.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg font-medium">
                      {page.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-sm">{page.name}</CardTitle>
                    {page.category && (
                      <CardDescription className="text-xs">{page.category}</CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isSubscribed ? "outline" : "default"}
                    onClick={() =>
                      subscribePageMutation.mutate({
                        pageId: page.id,
                        action: isSubscribed ? "unsubscribe" : "subscribe",
                      })
                    }
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isSubscribed ? (
                      <>
                        <BellOff className="h-4 w-4 mr-1" />
                        Unsubscribe
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-1" />
                        Subscribe
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {isSubscribed && (
              <CardContent className="p-4 pt-2">
                <Collapsible open={isExpanded} onOpenChange={() => togglePage(page.id)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      <span className="text-xs text-muted-foreground">
                        View Lead Forms
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <PageLeadForms teamId={teamId} pageId={page.id} />
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function PageLeadForms({ teamId, pageId }: { teamId: string; pageId: string }) {
  const { data: forms, isLoading } = useQuery({
    queryKey: ["meta-lead-forms", teamId, pageId],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("meta-fetch-assets", {
        body: { teamId, assetType: "lead_forms", parentId: pageId },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data.assets as LeadForm[];
    },
    enabled: !!teamId && !!pageId,
  });

  if (isLoading) {
    return (
      <div className="py-4 flex justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!forms || forms.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        No lead forms found for this page
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {forms.map((form) => (
        <div
          key={form.id}
          className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
        >
          <div>
            <p className="font-medium">{form.name}</p>
            <p className="text-xs text-muted-foreground">
              Status: {form.status} {form.leads_count ? `• ${form.leads_count} leads` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 text-success text-xs">
            <Check className="h-3 w-3" />
            Syncing
          </div>
        </div>
      ))}
    </div>
  );
}
