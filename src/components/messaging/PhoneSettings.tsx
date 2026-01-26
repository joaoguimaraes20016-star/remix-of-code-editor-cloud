import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Phone, Plus, MessageSquare, Volume2, Star, MoreHorizontal, Trash2, Loader2 } from "lucide-react";
import { PhoneNumberMarketplace } from "./PhoneNumberMarketplace";
import { toast } from "sonner";

interface PhoneSettingsProps {
  teamId: string;
}

export function PhoneSettings({ teamId }: PhoneSettingsProps) {
  const queryClient = useQueryClient();
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);

  // Fetch team phone numbers
  const { data: phoneNumbers, isLoading } = useQuery({
    queryKey: ["team-phone-numbers", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_phone_numbers")
        .select("*")
        .eq("team_id", teamId)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("purchased_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (phoneNumberId: string) => {
      // First, unset all defaults
      await supabase
        .from("team_phone_numbers")
        .update({ is_default: false })
        .eq("team_id", teamId);

      // Then set the new default
      const { error } = await supabase
        .from("team_phone_numbers")
        .update({ is_default: true })
        .eq("id", phoneNumberId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Default phone number updated");
      queryClient.invalidateQueries({ queryKey: ["team-phone-numbers", teamId] });
    },
    onError: (error) => {
      toast.error("Failed to set default: " + error.message);
    },
  });

  // Release number mutation
  const releaseMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const { data, error } = await supabase.functions.invoke("release-phone-number", {
        body: { teamId, phoneNumber },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Failed to release number");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Phone number released successfully");
      queryClient.invalidateQueries({ queryKey: ["team-phone-numbers", teamId] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Phone Services</h2>
        <p className="text-muted-foreground">Manage phone numbers for SMS and voice</p>
      </div>

      {/* Stackit Phone - Green Gradient Header */}
      <Card className="overflow-hidden border-border">
        <CardHeader className="relative bg-gradient-to-r from-emerald-500 to-green-600 text-white">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  Stackit Phone
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">Twilio Powered</Badge>
                </CardTitle>
                <CardDescription className="text-white/70">
                  Send SMS, make calls, and use with your automations
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setMarketplaceOpen(true)}
              size="sm"
              className="bg-white text-emerald-600 hover:bg-white/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Get a Phone Number
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : phoneNumbers && phoneNumbers.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Your Phone Numbers
              </h3>
              <div className="space-y-2">
                {phoneNumbers.map((number) => (
                  <div
                    key={number.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-foreground">
                            {formatPhoneNumber(number.phone_number)}
                          </span>
                          {number.is_default && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {number.friendly_name && <span>{number.friendly_name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        {(number.capabilities as { sms?: boolean })?.sms && (
                          <Badge variant="outline" className="h-6">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            SMS
                          </Badge>
                        )}
                        {(number.capabilities as { voice?: boolean })?.voice && (
                          <Badge variant="outline" className="h-6">
                            <Volume2 className="h-3 w-3 mr-1" />
                            Voice
                          </Badge>
                        )}
                      </div>
                      <span className="font-semibold text-emerald-600">
                        {formatPrice(number.monthly_cost_cents || 250)}/mo
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!number.is_default && (
                            <DropdownMenuItem
                              onClick={() => setDefaultMutation.mutate(number.id)}
                              disabled={setDefaultMutation.isPending}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => releaseMutation.mutate(number.phone_number)}
                            disabled={releaseMutation.isPending}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Release Number
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <Phone className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Get Your First Phone Number
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Purchase a phone number to send SMS messages and make calls with your automations
              </p>
              <Button onClick={() => setMarketplaceOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Get a Phone Number
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PhoneNumberMarketplace
        open={marketplaceOpen}
        onOpenChange={setMarketplaceOpen}
        teamId={teamId}
        onNumberPurchased={() => {
          queryClient.invalidateQueries({ queryKey: ["team-phone-numbers", teamId] });
        }}
      />
    </div>
  );
}
