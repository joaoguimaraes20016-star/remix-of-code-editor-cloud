import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTeamRole } from "@/hooks/useTeamRole";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Settings, DollarSign, Trash2, Loader2, Upload, UserPlus, Mail, AlertTriangle, Type, Layers, Link2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { CommissionSettings } from "@/components/CommissionSettings";
import { ClearTeamData } from "@/components/ClearTeamData";
import { TerminologySettings } from "@/components/settings/TerminologySettings";
import { useTeamLabels } from "@/contexts/TeamLabelsContext";
import { cn } from "@/lib/utils";
import { SubaccountsList } from "@/components/workspace/SubaccountsList";
import { checkParentAccountIdExists } from "@/lib/db/checkColumnExists";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  profiles: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export default function TeamSettings() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading, isMainAccount, canCreateSubaccounts } = useTeamRole(teamId);
  const { getRoleLabel } = useTeamLabels();

  const [teamName, setTeamName] = useState("");
  const [teamLogo, setTeamLogo] = useState<string | null>(null);
  const [bookingSlug, setBookingSlug] = useState("");
  const [slugSaved, setSlugSaved] = useState(false);
  const [savingSlug, setSavingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [columnExists, setColumnExists] = useState<boolean | null>(null);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("closer");
  const [inviting, setInviting] = useState(false);

  // Check if column exists for feature detection
  useEffect(() => {
    checkParentAccountIdExists().then(setColumnExists);
  }, []);

  useEffect(() => {
    if (teamId) {
      loadTeamData();
      loadMembers();
    }
  }, [teamId]);

  // Redirect non-admins
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate(`/team/${teamId}`);
      toast.error("You don't have permission to access team settings");
    }
  }, [roleLoading, isAdmin, navigate, teamId]);

  const loadTeamData = async () => {
    try {
      const { data, error } = await supabase
        .from("teams" as any)
        .select("name, logo_url, booking_slug")
        .eq("id", teamId)
        .single();

      if (error) throw error;
      setTeamName(data?.name || "");
      setTeamLogo(data?.logo_url || null);
      setBookingSlug(data?.booking_slug || "");
    } catch (error) {
      console.error("Error loading team:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSaveBookingSlug = async () => {
    const slug = bookingSlug.trim();
    if (!slug) {
      setSlugError("Booking URL is required");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError("Only lowercase letters, numbers, and hyphens allowed");
      return;
    }
    if (slug.length < 3) {
      setSlugError("Must be at least 3 characters");
      return;
    }

    setSavingSlug(true);
    setSlugError(null);
    try {
      // Check uniqueness
      const { data: existing } = await supabase
        .from("teams" as any)
        .select("id")
        .eq("booking_slug", slug)
        .neq("id", teamId!)
        .maybeSingle();

      if (existing) {
        setSlugError("This URL is already taken. Try another.");
        return;
      }

      const { error } = await supabase
        .from("teams" as any)
        .update({ booking_slug: slug })
        .eq("id", teamId);

      if (error) throw error;
      toast.success("Booking URL saved");
      setSlugSaved(true);
      setTimeout(() => setSlugSaved(false), 3000);
    } catch (error) {
      console.error("Error saving booking slug:", error);
      toast.error("Failed to save booking URL");
    } finally {
      setSavingSlug(false);
    }
  };

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("*, profiles(full_name, email, avatar_url)")
        .eq("team_id", teamId)
        .eq("is_active", true);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error loading members:", error);
    }
  };

  const handleSaveTeam = async () => {
    if (!teamName.trim()) {
      toast.error("Team name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("teams")
        .update({ name: teamName.trim() })
        .eq("id", teamId);

      if (error) throw error;
      toast.success("Team settings saved");
    } catch (error) {
      console.error("Error saving team:", error);
      toast.error("Failed to save team settings");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${teamId}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("team-assets")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("team-assets")
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("teams")
        .update({ logo_url: urlData.publicUrl })
        .eq("id", teamId);

      if (updateError) throw updateError;

      setTeamLogo(urlData.publicUrl);
      toast.success("Logo updated");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("team_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;
      toast.success("Role updated");
      loadMembers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the team?`)) return;

    try {
      const { error } = await supabase
        .from("team_members")
        .update({ is_active: false })
        .eq("id", memberId);

      if (error) throw error;
      toast.success("Member removed");
      loadMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setInviting(true);
    try {
      const { error } = await supabase.functions.invoke("send-team-invite", {
        body: {
          teamId,
          email: inviteEmail.trim(),
          role: inviteRole,
          invitedBy: user?.id,
        },
      });

      if (error) throw error;
      toast.success("Invitation sent");
      setInviteEmail("");
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header with Gradient Icon */}
      <div className="space-y-1 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Team Settings</h1>
          <p className="text-muted-foreground">
            Manage your team's branding, members, and commissions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="branding" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/10 data-[state=active]:to-indigo-500/10">
            Branding
          </TabsTrigger>
          <TabsTrigger value="booking" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-cyan-500/10">
            <Link2 className="h-4 w-4" />
            Booking URL
          </TabsTrigger>
          <TabsTrigger value="terminology" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500/10 data-[state=active]:to-purple-500/10">
            <Type className="h-4 w-4" />
            Terminology
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500/10 data-[state=active]:to-cyan-500/10">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="commissions" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/10 data-[state=active]:to-rose-500/10">
            <DollarSign className="h-4 w-4" />
            Commissions
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-2 text-destructive data-[state=active]:bg-red-500/10">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
              <CardTitle className="text-lg text-white">Team Branding</CardTitle>
              <CardDescription className="text-white/70">
                Customize your team's name and logo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Team Logo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 ring-2 ring-purple-500/20">
                    <AvatarImage src={teamLogo || undefined} />
                    <AvatarFallback className="text-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                      {getInitials(teamName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("logo-upload")?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Upload Logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 2MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                />
              </div>

              <Button onClick={handleSaveTeam} disabled={saving} className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking URL Tab */}
        <TabsContent value="booking" className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Public Booking URL
              </CardTitle>
              <CardDescription className="text-white/70">
                Set a custom URL for your public booking page. Share this with clients so they can book meetings with your team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="booking-slug" className="text-sm font-medium">Booking URL</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-muted rounded-l-md px-3 h-10 text-sm text-muted-foreground border border-r-0 shrink-0">
                    {window.location.origin}/book/
                  </div>
                  <Input
                    id="booking-slug"
                    value={bookingSlug}
                    onChange={(e) => {
                      setBookingSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                      setSlugError(null);
                      setSlugSaved(false);
                    }}
                    placeholder="your-team-name"
                    className="rounded-l-none"
                  />
                </div>
                {slugError && <p className="text-xs text-destructive">{slugError}</p>}
                {!bookingSlug && teamName && (
                  <button
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => setBookingSlug(generateSlug(teamName))}
                  >
                    Suggest: {generateSlug(teamName)}
                  </button>
                )}
                <p className="text-xs text-muted-foreground">
                  This is the base URL for all your booking calendars. Each calendar will be available at{" "}
                  <code className="bg-muted px-1 rounded">{window.location.origin}/book/{bookingSlug || "your-slug"}/calendar-name</code>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSaveBookingSlug}
                  disabled={savingSlug || !bookingSlug.trim()}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  {savingSlug && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {slugSaved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    "Save Booking URL"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          {/* Invite Section */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <UserPlus className="h-5 w-5" />
                Invite Team Member
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="closer">{getRoleLabel('closer')}</SelectItem>
                      <SelectItem value="setter">{getRoleLabel('setter')}</SelectItem>
                    </SelectContent>
                  </Select>
                <Button onClick={handleInvite} disabled={inviting} className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">
                  {inviting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Members</CardTitle>
              <CardDescription>
                {members.length} active member{members.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                          {getInitials(member.profiles?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.profiles?.full_name || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.profiles?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role || "closer"}
                        onValueChange={(value) => handleRoleChange(member.id, value)}
                        disabled={member.user_id === user?.id}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="closer">{getRoleLabel('closer')}</SelectItem>
                          <SelectItem value="setter">{getRoleLabel('setter')}</SelectItem>
                        </SelectContent>
                      </Select>
                      {member.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            handleRemoveMember(
                              member.id,
                              member.profiles?.full_name || "this member"
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terminology Tab */}
        <TabsContent value="terminology">
          <TerminologySettings />
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions">
          <CommissionSettings teamId={teamId!} />
        </TabsContent>

        {/* Subaccounts Tab - Only visible for main accounts when column exists */}
        {isMainAccount && columnExists && (
          <TabsContent value="subaccounts">
            <SubaccountsList parentAccountId={teamId!} canCreate={canCreateSubaccounts} />
          </TabsContent>
        )}

        {/* Danger Zone Tab */}
        <TabsContent value="danger">
          <ClearTeamData teamId={teamId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
