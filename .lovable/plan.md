
# Separate Dashboard and Pipeline into Sidebar Sections

## Overview
Currently, the Sales CRM page contains two tabs: "Dashboard" and "Pipeline". This plan separates them into distinct sidebar navigation items, each with their own route and page.

---

## Current vs New Structure

| Current | New |
|---------|-----|
| Sales CRM (single sidebar item) | Dashboard (sidebar item) |
| └─ Dashboard tab | Pipeline (sidebar item) |
| └─ Pipeline tab | |

---

## Changes Required

### 1. Update TeamSidebar.tsx

Replace the single "Sales CRM" nav item with two separate items:

```
Current:
{ id: "crm", label: "Sales CRM", icon: TrendingUp, path: "/crm" }

New:
{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" }
{ id: "pipeline", label: "Pipeline", icon: Kanban, path: "/pipeline" }
```

This also requires importing additional icons (`LayoutDashboard`, `Kanban`) from lucide-react.

---

### 2. Update Routes in App.tsx

Add new routes and redirect the old `/crm` route:

```
Current:
<Route path="crm" element={<SalesDashboard />} />

New:
<Route path="dashboard" element={<SalesDashboard defaultTab="dashboard" />} />
<Route path="pipeline" element={<SalesDashboard defaultTab="appointments" />} />
<Route path="crm" element={<Navigate to="../dashboard" replace />} />  // Legacy redirect
```

---

### 3. Update SalesDashboard.tsx

Modify to accept a `defaultTab` prop and hide the internal tab navigation since the tabs are now controlled by the sidebar:

- Accept `defaultTab` prop to determine which view to show
- Remove the internal `TabsList` (the tabs at the top of the page)
- Still use `Tabs` component internally but without visible tabs
- Update page title based on which view is active

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/TeamSidebar.tsx` | Replace "Sales CRM" with "Dashboard" and "Pipeline" items, add new icons |
| `src/App.tsx` | Add `/dashboard` and `/pipeline` routes, redirect `/crm` |
| `src/pages/SalesDashboard.tsx` | Accept `defaultTab` prop, hide internal tab UI |

---

## Visual Result

**Before (Sidebar):**
```
Team Hub
Sales CRM    <- clicking opens page with tabs
Funnels
...
```

**After (Sidebar):**
```
Team Hub
Dashboard    <- goes directly to dashboard view
Pipeline     <- goes directly to pipeline view
Funnels
...
```

---

## Technical Details

### TeamSidebar.tsx changes:

```typescript
import { 
  Home, 
  LayoutDashboard,  // NEW
  Kanban,           // NEW for Pipeline
  Layers, 
  // ... rest
} from "lucide-react";

const mainNavItems = [
  { id: "home", label: "Team Hub", icon: Home, path: "" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "pipeline", label: "Pipeline", icon: Kanban, path: "/pipeline" },
  { id: "funnels", label: "Funnels", icon: Layers, path: "/funnels" },
  // ... rest of items
];
```

### SalesDashboard.tsx changes:

```typescript
interface SalesDashboardProps {
  defaultTab?: "dashboard" | "appointments";
}

const Index = ({ defaultTab = "dashboard" }: SalesDashboardProps) => {
  // Use defaultTab instead of internal state
  const activeTab = defaultTab;
  
  // Remove setActiveTab calls
  // Remove TabsList from JSX
  // Keep TabsContent components
};
```

### App.tsx route changes:

```typescript
<Route path="dashboard" element={<SalesDashboard defaultTab="dashboard" />} />
<Route path="pipeline" element={<SalesDashboard defaultTab="appointments" />} />
<Route path="crm" element={<Navigate to="../dashboard" replace />} />
```

---

## URL Handling

- Links using `?tab=pipeline` will need to redirect to `/pipeline`
- The existing URL parameter handling in SalesDashboard will be simplified since tabs are now controlled by routes
