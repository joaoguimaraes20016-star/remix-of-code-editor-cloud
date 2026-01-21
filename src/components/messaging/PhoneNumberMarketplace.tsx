import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, Phone, Check, MessageSquare, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  country: string;
  capabilities: {
    sms: boolean;
    voice: boolean;
    mms: boolean;
  };
  monthlyPriceCents: number;
}

interface PhoneNumberMarketplaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onNumberPurchased: () => void;
}

export function PhoneNumberMarketplace({
  open,
  onOpenChange,
  teamId,
  onNumberPurchased,
}: PhoneNumberMarketplaceProps) {
  const [numberType, setNumberType] = useState<"local" | "toll-free">("local");
  const [areaCode, setAreaCode] = useState("");
  const [searchResults, setSearchResults] = useState<AvailableNumber[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("search-phone-numbers", {
        body: {
          teamId,
          country: "US",
          type: numberType,
          areaCode: areaCode || undefined,
          smsEnabled: true,
          voiceEnabled: true,
          limit: 20,
        },
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || "Search failed");
      }

      return data.numbers as AvailableNumber[];
    },
    onSuccess: (numbers) => {
      setSearchResults(numbers);
      setHasSearched(true);
      setSelectedNumber(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const { data, error } = await supabase.functions.invoke("purchase-phone-number", {
        body: {
          teamId,
          phoneNumber,
          setAsDefault: true,
        },
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || "Purchase failed");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Phone number purchased successfully!");
      onNumberPurchased();
      onOpenChange(false);
      resetState();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetState = () => {
    setSearchResults([]);
    setSelectedNumber(null);
    setHasSearched(false);
    setAreaCode("");
  };

  const handleSearch = () => {
    searchMutation.mutate();
  };

  const handlePurchase = () => {
    if (!selectedNumber) return;
    purchaseMutation.mutate(selectedNumber);
  };

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
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Get a Phone Number</DialogTitle>
          <DialogDescription>
            Search and purchase a phone number for your team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Number Type Selection */}
          <RadioGroup
            value={numberType}
            onValueChange={(v) => setNumberType(v as "local" | "toll-free")}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="local" id="local" />
              <Label htmlFor="local" className="font-normal cursor-pointer">
                Local Number
                <span className="text-muted-foreground ml-1">($2.50/mo)</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="toll-free" id="toll-free" />
              <Label htmlFor="toll-free" className="font-normal cursor-pointer">
                Toll-Free Number
                <span className="text-muted-foreground ml-1">($5.00/mo)</span>
              </Label>
            </div>
          </RadioGroup>

          {/* Area Code Search (for local numbers) */}
          {numberType === "local" && (
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="areaCode" className="text-sm">Area Code (optional)</Label>
                <Input
                  id="areaCode"
                  placeholder="e.g., 512, 415, 212"
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleSearch}
            disabled={searchMutation.isPending}
            className="w-full"
          >
            {searchMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Available Numbers
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="flex-1 overflow-y-auto mt-4 -mx-6 px-6">
            {searchResults.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Phone className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No numbers found. Try a different area code or number type.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-2">
                {searchResults.map((number) => (
                  <Card
                    key={number.phoneNumber}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50",
                      selectedNumber === number.phoneNumber && "border-primary ring-2 ring-primary/20"
                    )}
                    onClick={() => setSelectedNumber(number.phoneNumber)}
                  >
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Phone className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-lg">
                              {formatPhoneNumber(number.phoneNumber)}
                            </span>
                            {selectedNumber === number.phoneNumber && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {number.locality && <span>{number.locality},</span>}
                            <span>{number.region}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                          {number.capabilities.sms && (
                            <Badge variant="outline" className="h-6">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              SMS
                            </Badge>
                          )}
                          {number.capabilities.voice && (
                            <Badge variant="outline" className="h-6">
                              <Volume2 className="h-3 w-3 mr-1" />
                              Voice
                            </Badge>
                          )}
                        </div>
                        <span className="font-semibold text-primary">
                          {formatPrice(number.monthlyPriceCents)}/mo
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Purchase Button */}
        {selectedNumber && (
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={purchaseMutation.isPending}
            >
              {purchaseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Purchasing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Purchase Number
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
