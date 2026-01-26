

# Navigation & Resources Page Redesign - Fanbasis Style

## Overview

This plan addresses three main changes:
1. **Reorder sidebar navigation** - Move "Dashboard" to be the first item
2. **Rename "Team Hub" to "Resources"** - Update the sidebar and page identity
3. **Simplify the Resources page** - Remove hardcoded "Sales CRM" and "Funnels" quick action buttons, remove default category sections, and make it fully customizable with Fanbasis styling

---

## Summary of Changes

| Area | Change |
|------|--------|
| **Sidebar Navigation** | Reorder: Dashboard first, rename "Team Hub" → "Resources", remove "Funnels" button |
| **Resources Page** | Remove quick actions (Sales CRM, Funnels), remove default categories, start with empty customizable state |
| **Styling** | Apply Fanbasis gradient hero header, consistent with Dashboard/Performance pages |

---

## 1. Sidebar Navigation Updates

### File: `src/components/TeamSidebar.tsx`

**Current Order:**
```
Team Hub → Performance → Dashboard → Pipeline → Funnels → Workflows → ...
```

**New Order:**
```
Dashboard → Resources → Performance → Pipeline → Workflows → ...
```

**Changes:**
- Move "Dashboard" to be the first item
- Rename "Team Hub" to "Resources" and update icon to `BookOpen`
- Remove "Funnels" from the navigation (it's still accessible from Dashboard if needed)

```typescript
const mainNavItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "resources", label: "Resources", icon: BookOpen, path: "" }, // Was "Team Hub"
  { id: "performance", label: "Performance", icon: TrendingUp, path: "/performance" },
  { id: "pipeline", label: "Pipeline", icon: Kanban, path: "/pipeline" },
  // Funnels REMOVED
  { id: "workflows", label: "Workflows", icon: Workflow, path: "/workflows" },
  { id: "marketing", label: "Marketing", icon: Megaphone, path: "/marketing" },
  { id: "schedule", label: "Schedule", icon: CalendarDays, path: "/schedule" },
  { id: "chat", label: "Team Chat", icon: MessageCircle, path: "/chat" },
  { id: "payments", label: "Payments", icon: CreditCard, path: "/payments" },
  { id: "apps", label: "Apps", icon: Grid3X3, path: "/apps" },
];
```

---

## 2. Resources Page Redesign

### File: `src/pages/TeamHubOverview.tsx`

**What Gets Removed:**
1. **Quick Actions section** (Sales CRM & Funnels cards) - Lines 486-503, 739-763
2. **DEFAULT_CATEGORIES constant** - Lines 64-72 (replace with empty array)
3. **"Team Overview" subtitle** - Change to "Resources" with proper Fanbasis styling

**What Gets Added:**
1. **Fanbasis-style gradient hero header** - Consistent with Dashboard/Performance pages
2. **Empty state by default** - No hardcoded sections, admins can add their own
3. **Improved "Add Section" empty state** - Encourage customization

### New Resources Page Structure

```text
+----------------------------------------------------------+
|  ┌────────────────────────────────────────────────────┐  |
|  │  GRADIENT HERO HEADER (Fanbasis style)             │  |
|  │  📚 Resources                                       │  |
|  │  Training materials & team assets                  │  |
|  └────────────────────────────────────────────────────┘  |
|                                                           |
|  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         |
|  │ Team Members│ │ Team Assets │ │ Closed Deals│         |
|  │     12      │ │      8      │ │      45     │         |
|  └─────────────┘ └─────────────┘ └─────────────┘         |
|                                                           |
|  ┌────────────────────────────────────────────────────┐  |
|  │  Admin Controls (if admin)                          │  |
|  │  [+ Add Section]  [+ Add Asset]                     │  |
|  └────────────────────────────────────────────────────┘  |
|                                                           |
|  ┌────────────────────────────────────────────────────┐  |
|  │  EMPTY STATE (if no sections)                       │  |
|  │  "Create your first section to organize content"    │  |
|  │  [+ Add Section]                                    │  |
|  └────────────────────────────────────────────────────┘  |
|                                                           |
|  OR (if sections exist):                                  |
|  ┌────────────────────────────────────────────────────┐  |
|  │  [CUSTOM SECTION 1] [CUSTOM SECTION 2]              │  |
|  │  (whatever the admin creates)                       │  |
|  └────────────────────────────────────────────────────┘  |
+----------------------------------------------------------+
```

---

## 3. Detailed Implementation

### A. Hero Header Update

Replace the current plain header with a Fanbasis-style gradient banner:

```typescript
{/* Hero Header */}
<div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600/10 via-purple-600/10 to-indigo-700/10 border border-violet-500/20 p-6">
  {/* Background decorations */}
  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10" />
  <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-purple-500/5" />
  
  <div className="relative flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Avatar className="h-14 w-14 rounded-lg border-2 border-violet-500/30">
        <AvatarImage src={teamLogo || undefined} className="object-cover" />
        <AvatarFallback className="rounded-lg bg-violet-600 text-white">
          {getInitials(teamName)}
        </AvatarFallback>
      </Avatar>
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-violet-500" />
          Resources
        </h1>
        <p className="text-muted-foreground text-sm">
          Training materials, resources & team assets
        </p>
      </div>
    </div>
    <Badge variant="secondary" className="text-sm">
      {role || "Member"}
    </Badge>
  </div>
</div>
```

### B. Remove Quick Actions

Delete the entire quick actions section that shows "Sales CRM" and "Funnels" cards.

### C. Empty Default State

Change `DEFAULT_CATEGORIES` to an empty array so teams start fresh:

```typescript
const DEFAULT_CATEGORIES: AssetCategory[] = [];
```

### D. Add Empty State UI

When no sections exist, show an inviting empty state:

```typescript
{localCategories.length === 0 && (
  <Card className="border-dashed border-2 border-border/50 bg-muted/20">
    <CardContent className="flex flex-col items-center justify-center py-12">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <BookOpen className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-2">No sections yet</h3>
      <p className="text-muted-foreground text-sm text-center mb-4 max-w-md">
        Create custom sections to organize your team's training materials, resources, and onboarding content.
      </p>
      {canManage && (
        <Button onClick={() => { setEditingSection(null); setSectionDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Your First Section
        </Button>
      )}
    </CardContent>
  </Card>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/TeamSidebar.tsx` | Reorder nav items, rename "Team Hub" → "Resources", add BookOpen icon, remove Funnels |
| `src/pages/TeamHubOverview.tsx` | Remove quick actions, change header to Fanbasis style, empty default categories, add empty state UI |

---

## Visual Before & After

### Before (Current State)
- "Team Hub" is first in nav with Home icon
- Funnels appears in navigation
- Quick action cards for "Sales CRM" and "Funnels"
- Default categories: Resources, Offer, Scripts & SOPs, Training, etc.

### After (New State)
- "Dashboard" is first in nav
- "Resources" (was Team Hub) is second with BookOpen icon
- Funnels removed from navigation
- NO quick action cards
- NO default categories - start empty
- Fanbasis gradient hero header
- Empty state encourages customization

---

## Result

After implementation:
- **Dashboard** = First item in navigation (the landing hub for metrics)
- **Resources** = Clean, fully customizable content hub with Fanbasis styling
- **No hardcoded sections** = Teams can create exactly what they need
- **No Sales CRM/Funnels shortcuts** = These are accessed via Pipeline and Dashboard
- **Consistent premium styling** = Matches the Fanbasis design language throughout

