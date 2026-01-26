
# Fix Performance Page - Team Performance Focus

## The Problem
The Performance page I created shows revenue metrics (DashboardHero with period toggle, CC Revenue, MRR, Close Rate), which is essentially a duplicate of Dashboard functionality. 

The user wants **Performance** to show **Team Performance** - the actual activity tracking for setters and closers, task management, and EOD reports. This is the content currently shown in the "Overview" tab of the Pipeline page.

---

## Solution

### 1. Rewrite `src/pages/Performance.tsx`

Replace the current revenue-focused content with team performance content:
- **Task Summary Cards** - Overdue tasks, Due Today, Upcoming (7 days)
- **EOD Reports Hub** - Team member end-of-day reports
- **Team Performance Section** - ActivityTracker showing Setters/Closers activity
- **Appointments Booked Breakdown** - Performance metrics by team member

This mirrors the `AdminOverview` component structure but as a standalone page.

**New Structure:**
```text
+------------------------------------------------------------+
|  Team Performance                                           |
|  Monitor your team's activity and productivity              |
|                                                             |
|  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           |
|  │ Overdue     │ │ Due Today   │ │ Upcoming    │           |
|  │ Tasks: 2    │ │ Tasks: 5    │ │ (7 days): 8 │           |
|  │ S:1  C:1    │ │ S:3  C:2    │ │             │           |
|  └─────────────┘ └─────────────┘ └─────────────┘           |
|                                                             |
|  📋 EOD Reports                                             |
|  └─ Team member daily reports expandable section            |
|                                                             |
|  👥 Team Performance                                        |
|  ┌─────────────────────────┬─────────────────────────┐     |
|  │ Setters Activity Today  │ Closers Activity Today  │     |
|  │ - Member 1 (Active)     │ - Member A (Active)     │     |
|  │ - Member 2 (Idle)       │ - Member B (Inactive)   │     |
|  └─────────────────────────┴─────────────────────────┘     |
|                                                             |
|  📊 Appointments Booked Breakdown                           |
|  └─ Performance metrics by team member                      |
+------------------------------------------------------------+
```

---

## Implementation Details

### File Changes

| File | Change |
|------|--------|
| `src/pages/Performance.tsx` | **Rewrite** - Replace revenue metrics with team performance content |

### Component Reuse

The Performance page will import and use existing components:

```typescript
import { ActivityTracker } from "@/components/appointments/ActivityTracker";
import { EODReportsHub } from "@/components/appointments/EODReportsHub";
import { AppointmentsBookedBreakdown } from "@/components/AppointmentsBookedBreakdown";
```

### Data Requirements

The page will load:
1. **Confirmation tasks** - To show overdue, due today, upcoming counts
2. **MRR follow-up tasks** - Additional task counts
3. **Team members** - To determine setter vs closer assignments

### Key Code Structure

```typescript
// src/pages/Performance.tsx
export default function Performance() {
  const { teamId } = useParams();
  const [loading, setLoading] = useState(true);
  const [taskSummary, setTaskSummary] = useState({
    overdue: 0,
    dueToday: 0,
    upcoming: 0,
    overdueSetters: 0,
    overdueClosers: 0,
    dueTodaySetters: 0,
    dueTodayClosers: 0,
  });

  // Load task summary data (same logic as AdminOverview)
  
  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Team Performance</h1>
        <p className="text-muted-foreground text-sm">
          Monitor your team's activity and productivity
        </p>
      </div>

      {/* Task Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Overdue, Due Today, Upcoming cards */}
      </div>

      {/* EOD Reports */}
      <EODReportsHub teamId={teamId} />

      {/* Team Performance - Activity Tracker */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTracker teamId={teamId} />
          <Separator />
          <AppointmentsBookedBreakdown teamId={teamId} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Result

After this change:
- **Performance** = Team activity, task management, setter/closer tracking
- **Dashboard** = Revenue metrics, CC Revenue, MRR, Close Rate (DashboardHero with "Keep stacking" message)
- **Pipeline** = Kanban board for deals

Each section has a clear, distinct purpose without duplication.
