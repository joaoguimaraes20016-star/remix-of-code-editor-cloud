import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Plus, CheckCircle, Clock, AlertCircle, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";
import { AddDomainDialog } from "./AddDomainDialog";
import { DomainDnsDialog } from "./DomainDnsDialog";

interface EmailSettingsProps {
  teamId: string;
}

interface SendingDomain {
  id: string;
  domain: string;
  subdomain: string | null;
  full_domain: string;
  status: "pending" | "verifying" | "verified" | "failed";
  dns_records: Array<{
    type: string;
    host: string;
    value: string;
    verified?: boolean;
  }>;
  verification_error: string | null;
  verified_at: string | null;
  created_at: string;
}

export function EmailSettings({ teamId }: EmailSettingsProps) {
  const queryClient = useQueryClient();
  const [addDomainOpen, setAddDomainOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<SendingDomain | null>(null);
  const [dnsDialogOpen, setDnsDialogOpen] = useState(false);

  // Fetch team email settings
  const { data: teamSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["team-email-settings", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("default_from_name, default_reply_to, stackit_email_enabled")
        .eq("id", teamId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch sending domains
  const { data: domains, isLoading: domainsLoading } = useQuery({
    queryKey: ["team-sending-domains", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_sending_domains")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as SendingDomain[];
    },
  });

  // Update team settings
  const updateSettings = useMutation({
    mutationFn: async (updates: { 
      default_from_name?: string; 
      default_reply_to?: string;
      stackit_email_enabled?: boolean;
    }) => {
      const { error } = await supabase
        .from("teams")
        .update(updates)
        .eq("id", teamId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-email-settings", teamId] });
      toast.success("Settings updated");
    },
    onError: (error) => {
      toast.error("Failed to update settings: " + error.message);
    },
  });

  // Delete domain
  const deleteDomain = useMutation({
    mutationFn: async (domainId: string) => {
      const { error } = await supabase
        .from("team_sending_domains")
        .delete()
        .eq("id", domainId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-sending-domains", teamId] });
      toast.success("Domain removed");
    },
    onError: (error) => {
      toast.error("Failed to remove domain: " + error.message);
    },
  });

  const getStatusBadge = (status: SendingDomain["status"]) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "verifying":
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="w-3 h-3 mr-1" /> Verifying</Badge>;
      case "failed":
        return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
    }
  };

  const handleDomainClick = (domain: SendingDomain) => {
    setSelectedDomain(domain);
    setDnsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stackit Default Email */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Stackit Email</CardTitle>
                <CardDescription>
                  Send emails instantly from our shared sending domain
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={teamSettings?.stackit_email_enabled ?? true}
              onCheckedChange={(checked) => updateSettings.mutate({ stackit_email_enabled: checked })}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              Emails will be sent from <span className="font-mono text-foreground">noreply@send.stackitmail.com</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Great for testing and low-volume sending. For custom branding, add your own domain below.
            </p>
          </div>

          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromName">Default From Name</Label>
                <Input
                  id="fromName"
                  placeholder="Your Company Name"
                  defaultValue={teamSettings?.default_from_name || ""}
                  onBlur={(e) => updateSettings.mutate({ default_from_name: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Shown as the sender name in inboxes
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="replyTo">Default Reply-To</Label>
                <Input
                  id="replyTo"
                  type="email"
                  placeholder="hello@yourcompany.com"
                  defaultValue={teamSettings?.default_reply_to || ""}
                  onBlur={(e) => updateSettings.mutate({ default_reply_to: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Where replies will be sent
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domains */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Custom Sending Domains</CardTitle>
                <CardDescription>
                  Send emails from your own branded domain for better deliverability
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setAddDomainOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {domainsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading domains...</div>
          ) : domains && domains.length > 0 ? (
            <div className="space-y-3">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted/70 transition-colors cursor-pointer"
                  onClick={() => handleDomainClick(domain)}
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-mono text-sm">{domain.full_domain}</p>
                      {domain.verified_at && (
                        <p className="text-xs text-muted-foreground">
                          Verified {new Date(domain.verified_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(domain.status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Remove this domain?")) {
                          deleteDomain.mutate(domain.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No custom domains configured</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add a domain to send emails from your own address
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setAddDomainOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Domain
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AddDomainDialog
        open={addDomainOpen}
        onOpenChange={setAddDomainOpen}
        teamId={teamId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["team-sending-domains", teamId] });
        }}
      />

      {selectedDomain && (
        <DomainDnsDialog
          open={dnsDialogOpen}
          onOpenChange={setDnsDialogOpen}
          domain={selectedDomain}
          teamId={teamId}
          onVerify={() => {
            queryClient.invalidateQueries({ queryKey: ["team-sending-domains", teamId] });
          }}
        />
      )}
    </div>
  );
}
