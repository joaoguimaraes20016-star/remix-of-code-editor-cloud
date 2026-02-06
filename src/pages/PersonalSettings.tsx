import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Camera, Loader2, Save, Phone, User, Mail, Bell, 
  Link2, CheckCircle2, Settings, Sun, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// Integration logos
import calendlyLogo from "@/assets/integrations/calendly.svg";
import zoomLogo from "@/assets/integrations/zoom.svg";
import googleMeetLogo from "@/assets/integrations/google-meet.svg";

export default function PersonalSettings() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      
      if (error) throw error;
      if (data) {
        setFullName(data.full_name || "");
        setPhoneNumber((data as any).phone_number || "");
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Settings saved");
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      await updateProfileMutation.mutateAsync({ avatar_url: publicUrl });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate({ 
      full_name: fullName, 
      phone_number: phoneNumber 
    });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const personalApps = [
    {
      id: "calendly",
      name: "Calendly",
      description: "Connect your booking calendar",
      logo: calendlyLogo,
      connected: false,
      comingSoon: true,
    },
    {
      id: "zoom",
      name: "Zoom",
      description: "Video conferencing integration",
      logo: zoomLogo,
      connected: (profile as any)?.zoom_connected || false,
      comingSoon: true,
    },
    {
      id: "google-meet",
      name: "Google Meet",
      description: "Google video meetings",
      logo: googleMeetLogo,
      connected: (profile as any)?.google_meet_connected || false,
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl space-y-6">
        {/* Header with Gradient Icon */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        {/* Profile Section - Gradient Header */}
        <Card className="overflow-hidden border-border/50">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white pb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-white/20 ring-2 ring-white/10">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-white/20 text-white text-xl font-semibold">
                    {getInitials(profile?.full_name || profile?.email || "U")}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white border-2 border-purple-500 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors shadow-lg">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  ) : (
                    <Camera className="h-4 w-4 text-purple-600" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg text-white">{profile?.full_name || "No name set"}</p>
                <p className="text-sm text-white/70">{profile?.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Form Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="pl-10 bg-secondary/50"
                  />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={profile?.email || ""}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={updateProfileMutation.isPending}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Connected Apps Section - Teal Gradient Header */}
        <Card className="overflow-hidden border-border/50">
          <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-white" />
              <CardTitle className="text-lg text-white">Connected Apps</CardTitle>
            </div>
            <CardDescription className="text-white/70">Connect your personal accounts for scheduling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <div className="p-4 rounded-xl border border-border bg-muted/50">
              <p className="text-sm text-muted-foreground mb-3">
                Connect your Google Calendar, Zoom, and other integrations in the Schedule section to enable scheduling features.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/team/${teamId}/calendars`)}
                className="w-full sm:w-auto"
              >
                Go to Connections
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500/10 to-rose-500/10">
                <Sun className="h-4 w-4 text-orange-500" />
              </div>
              <CardTitle className="text-lg">Appearance</CardTitle>
            </div>
            <CardDescription>Customize how the app looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Theme</Label>
                <p className="text-xs text-muted-foreground">Choose between light and dark mode</p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-indigo-500/10">
                <Bell className="h-4 w-4 text-purple-500" />
              </div>
              <CardTitle className="text-lg">Notifications</CardTitle>
            </div>
            <CardDescription>Manage how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">New Lead Notifications</Label>
                <p className="text-xs text-muted-foreground">Get notified when new leads come in</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Task Reminders</Label>
                <p className="text-xs text-muted-foreground">Receive reminders for upcoming tasks</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Team Messages</Label>
                <p className="text-xs text-muted-foreground">Notifications for team chat messages</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
