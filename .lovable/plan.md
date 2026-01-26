
# Remove Presets & Match Fanbasis Style on Resources Page

## Overview

The Resources page currently shows preset sections (RESOURCES, OFFER, SCRIPTS & SOPS, TRAINING, TRACKING SHEETS) saved in the database and needs UI updates to match the Dashboard's Fanbasis style.

---

## Summary of Changes

| Area | Change |
|------|--------|
| **DEFAULT_CATEGORIES** | Already empty - confirm no hardcoded presets |
| **Database Migration** | Add a "Reset Sections" action for admins to clear existing presets |
| **Stats Cards** | Convert to gradient Fanbasis style (matching Dashboard) |
| **Admin Controls** | Simplify and style to match Fanbasis design |
| **Empty State** | Already has good empty state - enhance styling |

---

## 1. Stats Cards - Convert to Fanbasis Gradient Style

Current: Plain white cards with colored icon circles

Target: Match Dashboard's gradient metric cards

```text
+----------------------------------------------------------+
| ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       |
| │ GRADIENT     │ │ GRADIENT     │ │ GRADIENT     │       |
| │ Blue-Indigo  │ │ Violet-Purple│ │ Green-Teal   │       |
| │ Team Members │ │ Team Assets  │ │ Closed Deals │       |
| │      1       │ │      0       │ │      0       │       |
| └──────────────┘ └──────────────┘ └──────────────┘       |
+----------------------------------------------------------+
```

### Implementation

Replace the plain stats cards (lines 673-720) with gradient cards:

```typescript
{/* Stats Row - Fanbasis Gradient Style */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  {/* Team Members - Blue/Indigo gradient */}
  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-5 text-white shadow-lg">
    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
    <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white/80">Team Members</span>
        <div className="p-2 rounded-lg bg-white/20">
          <Users className="h-4 w-4 text-white" />
        </div>
      </div>
      <div className="text-3xl font-bold">{stats?.members ?? 0}</div>
    </div>
  </div>

  {/* Team Assets - Violet/Purple gradient */}
  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 p-5 text-white shadow-lg">
    ...
  </div>

  {/* Closed Deals - Green/Teal gradient */}
  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-5 text-white shadow-lg">
    ...
  </div>
</div>
```

---

## 2. Admin Controls - Simplify & Add Reset Option

Current: Has "Add Section" and "Add Asset" buttons

Target: Add a "Reset Sections" option to clear existing presets

### Implementation

Add a "Clear All Sections" option (only visible when sections exist):

```typescript
{canManage && localCategories.length > 0 && (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5 mr-1" />
        Clear All
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Clear All Sections?</AlertDialogTitle>
        <AlertDialogDescription>
          This will remove all sections and their organization. Assets will remain but become uncategorized.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={handleClearAllSections} className="bg-destructive">
          Clear All
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)}
```

Add handler function:

```typescript
const handleClearAllSections = async () => {
  setLocalCategories([]);
  try {
    await supabase
      .from("teams")
      .update({ asset_categories: [] })
      .eq("id", teamId);
    toast.success("All sections cleared");
    queryClient.invalidateQueries({ queryKey: ["team-categories", teamId] });
  } catch (error) {
    console.error("Error clearing sections:", error);
    toast.error("Failed to clear sections");
  }
};
```

---

## 3. Style Admin Controls Panel to Match Fanbasis

Update the admin controls panel (lines 732-769) with a more subtle style:

```typescript
{canManage && (
  <Card className="border-border/50 bg-card/50">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Settings2 className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Admin Controls</h3>
            <p className="text-xs text-muted-foreground">
              Manage sections and organize content
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {localCategories.length > 0 && (
            // Clear All button with confirmation
          )}
          <Button variant="outline" size="sm" onClick={openAddSection}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Section
          </Button>
          <Button size="sm" onClick={openUpload}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Asset
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

---

## 4. Remove "Team Assets" Header Duplication

Current: Has both "Resources" in hero and "Team Assets" as a section header

Target: Remove the "Team Assets" separate header - just keep the admin controls and sections

### Implementation

Remove lines 723-730 (the "Team Assets" header div):

```typescript
// REMOVE THIS:
<div className="flex flex-col gap-4">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-xl font-bold">Team Assets</h2>
      <p className="text-sm text-muted-foreground">Training materials, resources & onboarding</p>
    </div>
  </div>
  ...
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/TeamHubOverview.tsx` | Convert stats to gradient cards, add "Clear All" option, remove duplicate header, update admin panel styling |

---

## Visual Before & After

### Before
- Plain white stats cards with colored icons
- "Team Assets" duplicate header
- Gradient admin controls panel
- Preset sections showing in database

### After
- Gradient Fanbasis-style stats cards (blue, violet, green)
- No duplicate header
- Cleaner admin controls with "Clear All" option
- Users can clear all preset sections easily

---

## Result

After implementation:
- **Stats cards** = Beautiful gradient cards matching Dashboard style
- **No duplicate headers** = Cleaner visual hierarchy
- **Clear All option** = Easy way to remove preset sections
- **Consistent Fanbasis style** = Matches Dashboard/Performance pages
