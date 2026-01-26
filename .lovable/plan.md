

# Sidebar Navigation Reorganization

## Overview
Reorganize the sidebar navigation by creating a new "Performance" page with a simplified overview, keeping Dashboard separate for detailed CRM views, and updating the Schedule page to include a filter for viewing appointments, tasks, or both.

---

## Summary of Changes

1. **Create new "Performance" page** - A focused view with just the Today toggle/period selector and quick revenue metrics
2. **Update sidebar navigation** - Add Performance item, keep Pipeline separate
3. **Update Schedule page** - Add filter to show "All", "Appointments only", or "Tasks only"

---

## Detailed Implementation

### 1. Create New Performance Page

**File**: `src/pages/Performance.tsx` (new file)

This page will contain:
- The period toggle (Daily/Weekly/Monthly) 
- Large revenue display for the selected period
- Quick summary metric cards (CC Revenue, Total MRR, Close Rate)

Structure:
```text
+--------------------------------------------+
|  Performance                               |
|  Your revenue at a glance                  |
|                                            |
|  [Daily] [Weekly] [Monthly]                |
|                                            |
|  $12,500.00                                |
|  Total Revenue Today                       |
|                                            |
|  ┌─────────┐ ┌─────────┐ ┌─────────┐      |
|  │CC Rev   │ │Total MRR│ │Close %  │      |
|  │$8,500   │ │$4,200   │ │68%      │      |
|  └─────────┘ └─────────┘ └─────────┘      |
+--------------------------------------------+
```

The component will:
- Reuse `DashboardHero` component for revenue display
- Reuse `DashboardMetricCard` components for the 3 metric cards
- Pull the same data currently used in the SalesDashboard

---

### 2. Update Sidebar Navigation

**File**: `src/components/TeamSidebar.tsx`

Update the `mainNavItems` array to:
- Add "Performance" item with `TrendingUp` icon (or similar) pointing to `/performance`
- Keep "Dashboard" (detailed CRM analytics)  
- Keep "Pipeline" separate

New structure:
```typescript
const mainNavItems = [
  { id: "home", label: "Team Hub", icon: Home, path: "" },
  { id: "performance", label: "Performance", icon: TrendingUp, path: "/performance" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "pipeline", label: "Pipeline", icon: Kanban, path: "/pipeline" },
  { id: "funnels", label: "Funnels", icon: Layers, path: "/funnels" },
  { id: "workflows", label: "Workflows", icon: Workflow, path: "/workflows" },
  { id: "marketing", label: "Marketing", icon: Megaphone, path: "/marketing" },
  { id: "schedule", label: "Schedule", icon: CalendarDays, path: "/schedule" },
  { id: "chat", label: "Team Chat", icon: MessageCircle, path: "/chat" },
  { id: "payments", label: "Payments", icon: CreditCard, path: "/payments" },
  { id: "apps", label: "Apps", icon: Grid3X3, path: "/apps" },
];
```

---

### 3. Add Route for Performance Page

**File**: `src/App.tsx`

Add new route within the TeamLayout:
```typescript
<Route path="performance" element={<Performance />} />
```

---

### 4. Update Schedule Page with Filter

**File**: `src/pages/Schedule.tsx`

Add a filter toggle to the page header that allows users to view:
- **All** - Both appointments and tasks (current behavior)
- **Appointments** - Only appointments
- **Tasks** - Only tasks

Implementation approach:
- Add `filterMode` state: `"all" | "appointments" | "tasks"`
- Add a segmented toggle next to the existing "My Schedule" / "Team Schedule" toggle
- Modify `getScheduleItems()` to filter based on the selected mode

UI structure:
```text
+------------------------------------------------------------+
|  📅 Schedule                                               |
|  Your upcoming calls and tasks                             |
|                                                            |
|  [My Schedule] [Team Schedule]    [All] [Appointments] [Tasks]
+------------------------------------------------------------+
```

---

## Technical Details

### Performance Page Component Structure

```typescript
// src/pages/Performance.tsx
export default function Performance() {
  // Uses same data fetching logic as SalesDashboard
  // - Fetch appointments for CC Revenue calculation
  // - Fetch appointments for close rate
  // - Fetch MRR data
  
  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      {/* Header */}
      <DashboardHero userName={currentUserName} teamId={teamId} />
      
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardMetricCard ... gradient="green" />  {/* CC Revenue */}
        <DashboardMetricCard ... gradient="blue" />   {/* Total MRR */}
        <DashboardMetricCard ... gradient="red" />    {/* Close Rate */}
      </div>
    </div>
  );
}
```

### Schedule Filter Implementation

```typescript
// In Schedule.tsx
const [filterMode, setFilterMode] = useState<"all" | "appointments" | "tasks">("all");

const getScheduleItems = (): ScheduleItem[] => {
  if (!data) return [];
  const items: ScheduleItem[] = [];
  
  // Add appointments only if not filtering for tasks only
  if (filterMode !== "tasks") {
    data.appointments.forEach((apt) => { ... });
  }
  
  // Add tasks only if not filtering for appointments only  
  if (filterMode !== "appointments") {
    data.tasks.forEach((task) => { ... });
  }
  
  return items.sort((a, b) => a.time.getTime() - b.time.getTime());
};
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/Performance.tsx` | Create new page |
| `src/components/TeamSidebar.tsx` | Add Performance nav item |
| `src/App.tsx` | Add Performance route |
| `src/pages/Schedule.tsx` | Add filter toggle for appointments/tasks |

---

## Visual Result

After implementation:
- **Sidebar** will have "Performance" as a quick-access item for revenue overview
- **Dashboard** remains for detailed CRM analytics
- **Pipeline** stays separate for the kanban board
- **Schedule** allows filtering between all items, appointments only, or tasks only

