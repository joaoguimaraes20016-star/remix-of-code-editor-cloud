import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Mail, Plus, CheckCircle, Clock, AlertCircle, Trash2, Globe, Sparkles, Shield } from "lucide-react";
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
  emails_sent?: number;
  last_email_at?: string | null;
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
        return (
          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/30">
            <CheckCircle className="w-3 h-3 mr-1" /> Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" /> Pending DNS
          </Badge>
        );
      case "verifying":
        return (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 border-blue-500/30">
            <Clock className="w-3 h-3 mr-1 animate-spin" /> Verifying
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="bg-red-500/20 text-red-600 border-red-500/30">
            <AlertCircle className="w-3 h-3 mr-1" /> Failed
          </Badge>
        );
    }
  };

  const handleDomainClick = (domain: SendingDomain) => {
    setSelectedDomain(domain);
    setDnsDialogOpen(true);
  };

  const verifiedDomains = domains?.filter(d => d.status === "verified") || [];
  const pendingDomains = domains?.filter(d => d.status !== "verified") || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Email Services</h2>
        <p className="text-muted-foreground">Configure email sending domains and settings</p>
      </div>

      {/* Stackit Default Email */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Stackit Email
                  <Badge variant="secondary" className="text-xs">Default</Badge>
                </CardTitle>
                <CardDescription>
                  Send emails instantly from our shared sending infrastructure
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={teamSettings?.stackit_email_enabled ?? true}
              onCheckedChange={(checked) => updateSettings.mutate({ stackit_email_enabled: checked })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-background/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sending Address</span>
            </div>
            <p className="font-mono text-sm text-foreground bg-muted/50 px-3 py-2 rounded-md">
              {teamSettings?.default_from_name || "Your Company"} &lt;noreply@notifications.usestackit.co&gt;
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Pre-warmed domain with excellent deliverability. Great for getting started quickly.
            </p>
          </div>

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
                Displayed as the sender name in recipient inboxes
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
                Replies will be sent to this address
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domains */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-muted border">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Custom Sending Domains</CardTitle>
                <CardDescription>
                  Send emails from your own branded domain for better deliverability and trust
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
            <div className="space-y-4">
              {/* Verified Domains */}
              {verifiedDomains.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground px-1">Active Domains</h4>
                  {verifiedDomains.map((domain) => (
                    <div
                      key={domain.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                      onClick={() => handleDomainClick(domain)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                          <Mail className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-medium">{domain.full_domain}</p>
                          <p className="text-xs text-muted-foreground">
                            {domain.emails_sent || 0} emails sent
                            {domain.verified_at && ` · Verified ${new Date(domain.verified_at).toLocaleDateString()}`}
                          </p>
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
                            if (confirm("Remove this domain? This cannot be undone.")) {
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
              )}

              {/* Pending Domains */}
              {pendingDomains.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground px-1">Pending Verification</h4>
                  {pendingDomains.map((domain) => (
                    <div
                      key={domain.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted/70 transition-colors cursor-pointer"
                      onClick={() => handleDomainClick(domain)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-medium">{domain.full_domain}</p>
                          <p className="text-xs text-muted-foreground">
                            Click to view DNS records and verify
                          </p>
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
              )}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-muted rounded-lg">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-medium text-foreground">No custom domains configured</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Add your own domain to send emails from addresses like hello@yourdomain.com
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
