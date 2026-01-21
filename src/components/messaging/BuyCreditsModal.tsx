import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Phone, MessagesSquare, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  channel: string;
  is_popular: boolean;
}

interface BuyCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  defaultChannel?: "sms" | "voice" | "whatsapp";
  onPurchaseComplete?: () => void;
}

export function BuyCreditsModal({
  open,
  onOpenChange,
  teamId,
  defaultChannel = "sms",
  onPurchaseComplete,
}: BuyCreditsModalProps) {
  const [selectedChannel, setSelectedChannel] = useState(defaultChannel);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const { data: packages, isLoading } = useQuery({
    queryKey: ["credit-packages", selectedChannel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("channel", selectedChannel)
        .eq("is_active", true)
        .order("sort_order");
      
      if (error) throw error;
      return data as CreditPackage[];
    },
    enabled: open,
  });

  // For now, directly add credits (in production, integrate with Stripe)
  const purchaseMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const pkg = packages?.find((p) => p.id === packageId);
      if (!pkg) throw new Error("Package not found");

      // Add credits via RPC
      const { data, error } = await supabase.rpc("add_credits", {
        p_team_id: teamId,
        p_channel: selectedChannel,
        p_amount: pkg.credits,
        p_transaction_type: "purchase",
        p_description: `Purchased ${pkg.name} package (${pkg.credits} credits)`,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Credits added successfully!");
      onPurchaseComplete?.();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Purchase error:", error);
      toast.error("Failed to add credits. Please try again.");
    },
  });

  const handlePurchase = () => {
    if (!selectedPackage) return;
    purchaseMutation.mutate(selectedPackage);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buy Credits</DialogTitle>
          <DialogDescription>
            Select a credit package to add to your account
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedChannel} onValueChange={(v) => setSelectedChannel(v as typeof selectedChannel)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sms" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2">
              <Phone className="h-4 w-4" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessagesSquare className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedChannel} className="mt-4">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="h-32" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {packages?.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50",
                      selectedPackage === pkg.id && "border-primary ring-2 ring-primary/20",
                      pkg.is_popular && "relative"
                    )}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    {pkg.is_popular && (
                      <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                        Most Popular
                      </Badge>
                    )}
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{pkg.name}</h3>
                        {selectedPackage === pkg.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="mt-2">
                        <span className="text-3xl font-bold">{pkg.credits.toLocaleString()}</span>
                        <span className="text-muted-foreground ml-1">
                          {selectedChannel === "voice" ? "minutes" : "credits"}
                        </span>
                      </div>
                      <div className="mt-2 text-xl font-semibold text-primary">
                        {formatPrice(pkg.price_cents)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatPrice(pkg.price_cents / pkg.credits * 100)} per{" "}
                        {selectedChannel === "voice" ? "minute" : "credit"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selectedPackage || purchaseMutation.isPending}
            onClick={handlePurchase}
          >
            {purchaseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {purchaseMutation.isPending ? "Processing..." : "Add Credits"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
