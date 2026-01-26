
# Add Phone Services to Marketing Page

## Overview

Add a "Phone Services" section to the Marketing page, matching the GHL-style interface where users can purchase phone numbers from Twilio. All the infrastructure already exists - we just need to wire it up with the correct styling.

---

## Current State

The Marketing page currently has:
- Email Services (configure sending domains)
- Usage History (view transactions)

The following components already exist but are not used:
- `PhoneNumberList.tsx` - Displays owned phone numbers
- `PhoneNumberMarketplace.tsx` - Dialog to search/purchase numbers

Backend already has:
- `team_phone_numbers` table in database
- `search-phone-numbers` edge function (Twilio search)
- `purchase-phone-number` edge function (Twilio purchase)
- `release-phone-number` edge function (Twilio release)

---

## Changes Summary

| Area | Change |
|------|--------|
| **Marketing.tsx** | Add "phone" section to navigation, update types, render PhoneSettings |
| **PhoneSettings.tsx** | NEW component styled like EmailSettings with gradient headers |

---

## 1. Update Marketing Page Navigation

### File: `src/pages/Marketing.tsx`

**Add Phone icon to imports:**
```typescript
import { Mail, History, Megaphone, Phone } from "lucide-react";
```

**Add phone section:**
```typescript
type MarketingSection = "email" | "phone" | "history";

const sections = [
  { id: "email" as const, label: "Email Services", icon: Mail, description: "Configure sending domains" },
  { id: "phone" as const, label: "Phone Services", icon: Phone, description: "Manage phone numbers" },
  { id: "history" as const, label: "Usage History", icon: History, description: "View transactions" },
];
```

**Import and render PhoneSettings:**
```typescript
import { PhoneSettings } from "@/components/messaging/PhoneSettings";

const renderContent = () => {
  switch (activeSection) {
    case "email":
      return <EmailSettings teamId={teamId!} />;
    case "phone":
      return <PhoneSettings teamId={teamId!} />;
    case "history":
      return <UsageHistory teamId={teamId!} />;
  }
};
```

---

## 2. Create PhoneSettings Component

### File: `src/components/messaging/PhoneSettings.tsx` (NEW)

This component will follow the same structure as EmailSettings with:
- Gradient hero header (green/teal theme to match phone branding)
- Stats about phone usage
- List of owned phone numbers
- "Get a Phone Number" button

```text
+----------------------------------------------------------+
|  PHONE SERVICES PAGE                                      |
|----------------------------------------------------------|
|  ┌────────────────────────────────────────────────────┐  |
|  │  GREEN GRADIENT HERO HEADER                        │  |
|  │  📞 Stackit Phone                                   │  |
|  │  Send SMS and make calls with your team numbers    │  |
|  │                              [+ Get a Phone Number] │  |
|  └────────────────────────────────────────────────────┘  |
|                                                           |
|  ┌────────────────────────────────────────────────────┐  |
|  │  YOUR PHONE NUMBERS                                │  |
|  │  ┌─────────────────────────────────────────────┐   │  |
|  │  │ (512) 555-1234    SMS | Voice   $2.50/mo  ⚙ │   │  |
|  │  └─────────────────────────────────────────────┘   │  |
|  │  ┌─────────────────────────────────────────────┐   │  |
|  │  │ (800) 555-5678    SMS | Voice   $5.00/mo  ⚙ │   │  |
|  │  └─────────────────────────────────────────────┘   │  |
|  └────────────────────────────────────────────────────┘  |
|                                                           |
|  ┌────────────────────────────────────────────────────┐  |
|  │  EMPTY STATE (if no numbers)                       │  |
|  │  📞 Get Your First Phone Number                    │  |
|  │  Purchase a number to send SMS and make calls     │  |
|  │  [Get a Phone Number]                              │  |
|  └────────────────────────────────────────────────────┘  |
+----------------------------------------------------------+
```

**Component Structure:**

```typescript
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Plus, MessageSquare, Volume2, Star, MoreHorizontal, Trash2 } from "lucide-react";
import { PhoneNumberMarketplace } from "./PhoneNumberMarketplace";
import { toast } from "sonner";
// ... other imports

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold">Phone Services</h2>
        <p className="text-muted-foreground">Manage phone numbers for SMS and voice</p>
      </div>

      {/* Stackit Phone - Green Gradient Header */}
      <Card className="overflow-hidden">
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
          {/* Phone number list or empty state */}
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
```

---

## 3. Features Included

The PhoneSettings component will include:

1. **Hero Header** - Green gradient matching the Fanbasis style
2. **Phone Number List** - Table showing:
   - Phone number (formatted)
   - Capabilities (SMS, Voice badges)
   - Monthly cost
   - Default indicator
   - Actions dropdown (Set as Default, Release)
3. **Empty State** - Clean CTA when no numbers exist
4. **Marketplace Dialog** - Already exists, will be triggered by button
5. **Set Default** - Ability to mark a number as default
6. **Release Number** - Ability to release a number back to Twilio

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/Marketing.tsx` | Modify | Add phone section to navigation |
| `src/components/messaging/PhoneSettings.tsx` | Create | New component with phone management UI |

---

## Visual Result

After implementation:
- **Marketing sidebar** will have 3 sections: Email Services, Phone Services, Usage History
- **Phone Services page** will show a green gradient hero header with phone icon
- **Phone numbers** displayed in a clean table with capabilities and pricing
- **"Get a Phone Number"** button opens the marketplace dialog
- **Consistent styling** matches Email Services with the gradient header pattern
