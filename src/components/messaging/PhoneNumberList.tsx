import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Phone, Plus, MoreHorizontal, Star, Trash2, MessageSquare, Volume2 } from "lucide-react";
import { PhoneNumberMarketplace } from "./PhoneNumberMarketplace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PhoneNumber {
  id: string;
  team_id: string;
  phone_number: string;
  phone_number_sid: string;
  friendly_name: string | null;
  country_code: string;
  capabilities: Record<string, boolean> | null;
  monthly_cost_cents: number;
  is_default: boolean;
  is_active: boolean;
  purchased_at: string;
}

interface PhoneNumberListProps {
  teamId: string;
  phoneNumbers: PhoneNumber[];
  isLoading: boolean;
  onNumbersChanged: () => void;
}

export function PhoneNumberList({ teamId, phoneNumbers, isLoading, onNumbersChanged }: PhoneNumberListProps) {
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(null);

  const setDefaultMutation = useMutation({
    mutationFn: async (phoneId: string) => {
      // Unset current default
      await supabase
        .from("team_phone_numbers")
        .update({ is_default: false })
        .eq("team_id", teamId)
        .eq("is_default", true);
      
      // Set new default
      const { error } = await supabase
        .from("team_phone_numbers")
        .update({ is_default: true })
        .eq("id", phoneId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Default phone number updated");
      onNumbersChanged();
    },
    onError: () => {
      toast.error("Failed to update default number");
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async (phoneId: string) => {
      const { data, error } = await supabase.functions.invoke("release-phone-number", {
        body: { teamId, phoneNumberId: phoneId },
      });
      
      if (error || !data.success) {
        throw new Error(data?.error || error?.message || "Failed to release number");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Phone number released");
      setReleaseDialogOpen(false);
      setSelectedNumber(null);
      onNumbersChanged();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleReleaseClick = (number: PhoneNumber) => {
    setSelectedNumber(number);
    setReleaseDialogOpen(true);
  };

  const formatPhoneNumber = (phone: string) => {
    // Format +1XXXXXXXXXX to (XXX) XXX-XXXX
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="animate-pulse">Loading phone numbers...</div>
        </CardContent>
      </Card>
    );
  }

  if (phoneNumbers.length === 0) {
    return (
      <>
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="py-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
              <Phone className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Get Your First Phone Number</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Purchase a phone number to send SMS, make calls, and use with your automations.
            </p>
            <Button className="mt-4" onClick={() => setMarketplaceOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Get a Phone Number
            </Button>
          </CardContent>
        </Card>

        <PhoneNumberMarketplace
          open={marketplaceOpen}
          onOpenChange={setMarketplaceOpen}
          teamId={teamId}
          onNumberPurchased={onNumbersChanged}
        />
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Your Phone Numbers</CardTitle>
            <CardDescription>
              Manage your phone numbers for SMS and voice
            </CardDescription>
          </div>
          <Button onClick={() => setMarketplaceOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Number
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone Number</TableHead>
                <TableHead>Capabilities</TableHead>
                <TableHead>Monthly Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phoneNumbers.map((number) => (
                <TableRow key={number.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">
                        {formatPhoneNumber(number.phone_number)}
                      </span>
                      {number.is_default && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                    {number.friendly_name && (
                      <p className="text-sm text-muted-foreground">{number.friendly_name}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {number.capabilities?.sms && (
                        <Badge variant="outline" className="gap-1">
                          <MessageSquare className="h-3 w-3" />
                          SMS
                        </Badge>
                      )}
                      {number.capabilities?.voice && (
                        <Badge variant="outline" className="gap-1">
                          <Volume2 className="h-3 w-3" />
                          Voice
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatPrice(number.monthly_cost_cents)}/mo
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!number.is_default && (
                          <DropdownMenuItem
                            onClick={() => setDefaultMutation.mutate(number.id)}
                          >
                            <Star className="mr-2 h-4 w-4" />
                            Set as Default
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleReleaseClick(number)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Release Number
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PhoneNumberMarketplace
        open={marketplaceOpen}
        onOpenChange={setMarketplaceOpen}
        teamId={teamId}
        onNumberPurchased={onNumbersChanged}
      />

      <AlertDialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release Phone Number</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to release{" "}
              <span className="font-mono font-semibold">
                {selectedNumber && formatPhoneNumber(selectedNumber.phone_number)}
              </span>
              ? This action cannot be undone and the number may become unavailable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => selectedNumber && releaseMutation.mutate(selectedNumber.id)}
            >
              {releaseMutation.isPending ? "Releasing..." : "Release Number"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
