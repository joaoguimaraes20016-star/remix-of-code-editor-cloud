

# Update Performance & Pipeline UI to Fanbasis Style

## Overview

Apply the premium "Fanbasis style" design patterns (gradient cards, visual hierarchy, glassmorphism, backdrop-blur) to both the Performance and Pipeline pages for a cohesive, high-impact UI.

---

## Design Patterns to Apply

Based on the Dashboard's Fanbasis style:

| Pattern | Description |
|---------|-------------|
| **Gradient Hero Cards** | Vibrant gradient backgrounds (`from-violet-600 via-purple-600 to-indigo-700`) with white text |
| **Background Decorations** | Circular shapes with `bg-white/10` and `bg-white/5` for depth |
| **Icon Containers** | `p-2 rounded-lg bg-white/20` for icons on gradient cards |
| **Backdrop Blur Buttons** | `bg-white/20 hover:bg-white/30 backdrop-blur-sm` for actions on gradients |
| **Secondary Cards** | Clean cards with `p-4`, colored icon backgrounds (`bg-primary/10`), and clear hierarchy |
| **Live Indicators** | Animated ping dots for real-time data |

---

## Performance Page Updates

### Current State
- Plain header with `text-2xl font-bold`
- Basic cards with conditional borders for task states
- Standard Card components for EODReportsHub and ActivityTracker

### Target State

```text
+----------------------------------------------------------+
|  ┌────────────────────────────────────────────────────┐  |
|  │  GRADIENT HERO HEADER                               │  |
|  │  🎯 Team Performance                                │  |
|  │  Monitor your team's productivity        [● LIVE]   │  |
|  └────────────────────────────────────────────────────┘  |
|                                                           |
|  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      |
|  │ GRADIENT     │ │ GRADIENT     │ │ GRADIENT     │      |
|  │ Red/Orange   │ │ Amber/Yellow │ │ Green/Teal   │      |
|  │ OVERDUE: 3   │ │ TODAY: 5     │ │ UPCOMING: 12 │      |
|  └──────────────┘ └──────────────┘ └──────────────┘      |
|                                                           |
|  ┌────────────────────────────────────────────────────┐  |
|  │  EOD Reports (styled header)                        │  |
|  │  Team members with clean cards                      │  |
|  └────────────────────────────────────────────────────┘  |
|                                                           |
|  ┌────────────────────────────────────────────────────┐  |
|  │  Team Activity (styled header)                      │  |
|  │  ActivityTracker + AppointmentsBreakdown            │  |
|  └────────────────────────────────────────────────────┘  |
+----------------------------------------------------------+
```

### Changes to `src/pages/Performance.tsx`

1. **Add Gradient Hero Header**
   - Replace plain header with gradient banner similar to DashboardHero
   - Include live indicator dot
   - Use `bg-gradient-to-br from-violet-600/10 via-purple-600/10 to-indigo-700/10` for subtle gradient

2. **Convert Task Summary Cards to Gradient Cards**
   - Overdue: `from-rose-500 via-red-500 to-orange-600` gradient
   - Due Today: `from-amber-500 via-orange-500 to-yellow-500` gradient  
   - Upcoming: `from-emerald-500 via-teal-500 to-cyan-600` gradient
   - Add circular background decorations
   - White text with proper hierarchy

3. **Style Section Cards**
   - Add subtle gradient headers to EODReportsHub and Team Activity sections
   - Use consistent padding and spacing

---

## Pipeline Page Updates

### Current State
- Direct render of DealPipeline without any header
- No visual branding or context

### Target State (Minimized)

```text
+----------------------------------------------------------+
|  ┌────────────────────────────────────────────────────┐  |
|  │  Pipeline                      [Manage Stages] [+] │  |
|  │  Your sales pipeline                [● LIVE]       │  |
|  └────────────────────────────────────────────────────┘  |
|                                                           |
|  ┌────────────────────────────────────────────────────┐  |
|  │            KANBAN PIPELINE BOARD                    │  |
|  │  [New] [Contacted] [Deposit] [Closed Won]          │  |
|  └────────────────────────────────────────────────────┘  |
+----------------------------------------------------------+
```

### Changes to `src/pages/SalesDashboard.tsx` (Pipeline View)

1. **Add Compact Gradient Header**
   - Subtle gradient banner (lighter than Dashboard)
   - Live indicator for real-time updates
   - Keep "Manage Pipeline Stages" and "+ Add Sale" buttons in header

2. **Minimize Chrome**
   - No metric cards on Pipeline (they live on Dashboard)
   - Focus purely on the kanban board
   - Use a muted/subtle gradient for the header

### Changes to `src/components/appointments/AppointmentsHub.tsx`

1. **Add Minimal Header Inside Component**
   - Small context header with live indicator
   - Clean, minimal branding consistent with Fanbasis style

---

## Implementation Details

### File Changes

| File | Changes |
|------|---------|
| `src/pages/Performance.tsx` | Add gradient hero header, convert task cards to gradient style |
| `src/pages/SalesDashboard.tsx` | Add subtle gradient header for Pipeline view |
| `src/components/appointments/EODReportsHub.tsx` | Style header with gradient accent |
| `src/components/appointments/ActivityTracker.tsx` | Add styled section header |

### New Gradient Definitions

```typescript
// Task status gradients
const taskGradients = {
  overdue: "from-rose-500 via-red-500 to-orange-600",
  today: "from-amber-500 via-orange-500 to-yellow-500", 
  upcoming: "from-emerald-500 via-teal-500 to-cyan-600",
};
```

### Performance Hero Header

```typescript
<div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600/10 via-purple-600/10 to-indigo-700/10 border border-violet-500/20 p-6">
  {/* Background decorations */}
  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10" />
  <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-purple-500/5" />
  
  <div className="relative flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Target className="h-6 w-6 text-violet-500" />
        Team Performance
      </h1>
      <p className="text-muted-foreground text-sm mt-1">
        Monitor your team's activity and productivity
      </p>
    </div>
    
    {/* Live indicator */}
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-xs font-medium text-muted-foreground">LIVE</span>
    </div>
  </div>
</div>
```

### Task Summary Gradient Cards

```typescript
<div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-500 via-red-500 to-orange-600 p-5 text-white shadow-lg">
  {/* Background decorations */}
  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
  <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />
  
  <div className="relative">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-white/80">Overdue Tasks</span>
      <div className="p-2 rounded-lg bg-white/20">
        <AlertCircle className="h-4 w-4 text-white" />
      </div>
    </div>
    <div className="text-3xl font-bold">{taskSummary.overdue}</div>
    <p className="text-sm text-white/70 mt-1">
      {labels.role_1_short}: {taskSummary.overdueSetters} · {labels.role_2_short}: {taskSummary.overdueClosers}
    </p>
  </div>
</div>
```

### Pipeline Subtle Header

```typescript
<div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-900/5 to-slate-800/5 border border-border/50">
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-lg bg-primary/10">
      <Kanban className="h-5 w-5 text-primary" />
    </div>
    <div>
      <h2 className="font-semibold">Pipeline</h2>
      <p className="text-xs text-muted-foreground">Drag cards to update status</p>
    </div>
  </div>
  
  {/* Live indicator */}
  <div className="flex items-center gap-2">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
    <span className="text-xs font-medium text-muted-foreground">LIVE</span>
  </div>
</div>
```

---

## Result

After implementation:
- **Performance** = Premium gradient hero + gradient task summary cards + styled sections
- **Pipeline** = Minimal subtle header + kanban board focus + live indicator
- **Dashboard** = Unchanged (already has Fanbasis style)

All three sections share the same design DNA:
- Gradient accents
- Background decorations  
- Live indicators
- Consistent typography hierarchy
- Premium glassmorphism effects

