
# Redesign Dashboard UI to Match Fanbasis/Billing Style

## Overview
Transform the current Dashboard page to match the premium, high-impact visual style used in the Billing and Payments sections, inspired by the Fanbasis design. This involves replacing the current basic `MetricCard` grid and `RevenueSummaryCard` with gradient hero cards, adding a personalized welcome header, and improving the overall visual hierarchy.

---

## Key Design Elements from Fanbasis

Based on the reference screenshot:
- **Personalized welcome header** with emoji
- **Large primary metric display** with period toggles (Daily/Weekly/Monthly)
- **3 gradient hero cards** in a row for key metrics
- **Clean earnings chart** with date range filters
- **Recent Activity sidebar** (optional, can be a collapsible section)

---

## Changes Required

### 1. Create New Dashboard Hero Component

Create `src/components/dashboard/DashboardHero.tsx` with:
- Personalized welcome message: "Welcome Back, [Name]! 👋"
- Large earnings today display with period toggle (Today/Week/Month)
- Gradient background styling matching Fanbasis

```text
+------------------------------------------+
|  Welcome Back, Joao Felipe! 👋           |
|                                          |
|  $0.00         [Daily] Weekly  Monthly   |
|  Total Earnings Today                    |
|                                          |
|  [=== Earnings Chart ===]                |
+------------------------------------------+
```

### 2. Create Gradient Metric Cards

Create `src/components/dashboard/DashboardMetricCard.tsx` - a new gradient-based metric card component following the pattern from `WalletCard`, `PaymentMethodCard`, and `AutoRechargeSettings`.

**Gradient Assignments:**
| Card | Gradient |
|------|----------|
| CC Revenue | Purple-to-Blue (`from-violet-600 via-purple-600 to-blue-600`) |
| Total MRR | Pink-to-Orange (`from-pink-500 via-rose-500 to-orange-500`) |
| Close Rate / Disputes | Teal-to-Cyan (`from-emerald-600 via-teal-600 to-cyan-600`) |

Each card includes:
- Background decoration circles (matching existing billing pattern)
- Icon with semi-transparent background
- Large metric value
- Descriptive subtitle
- Optional action button

### 3. Create Recent Activity Component

Create `src/components/dashboard/RecentActivity.tsx`:
- "Recent Activity" header with "LIVE" indicator badge
- Scrollable list of recent commissions/deals
- Real-time updates via Supabase subscription
- Each item shows: icon, title, description, time ago

### 4. Update SalesDashboard.tsx Layout

Restructure the dashboard tab content:

```text
+--------------------------------------------------+
| Welcome Back, [Name]! 👋                         |
| $X,XXX           [Today] [Week] [Month]          |
| Total Earnings Today                             |
+--------------------------------------------------+

+----------------+----------------+----------------+
| CC Revenue     | Total MRR      | Close Rate     |
| (purple grad)  | (pink grad)    | (teal grad)    |
| $XX,XXX        | $X,XXX         | XX%            |
| X deals closed | Recurring rev  | X/Y showed     |
+----------------+----------------+----------------+

+--------------------------------------------------+
| Earnings Overview                                |
| [Last 4 weeks] [Select Date] - [Select Date]     |
| compare to [Previous period] [Daily v]           |
|                                                  |
| [=== Revenue Chart ===]                          |
+--------------------------------------------------+

+--------------------------------------------------+
| [Commission Leaderboard]    | [Recent Activity]  |
| (existing component)        | (new sidebar)      |
+--------------------------------------------------+
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/dashboard/DashboardHero.tsx` | Create | Welcome header with large earnings and period toggle |
| `src/components/dashboard/DashboardMetricCard.tsx` | Create | Gradient metric card component |
| `src/components/dashboard/RecentActivity.tsx` | Create | Recent activity feed with LIVE indicator |
| `src/components/dashboard/index.ts` | Create | Barrel export file |
| `src/pages/SalesDashboard.tsx` | Update | Replace current layout with new premium components |
| `src/components/RevenueChart.tsx` | Update | Add enhanced header with date filters and comparison controls |

---

## Detailed Component Specifications

### DashboardHero.tsx

```typescript
interface DashboardHeroProps {
  userName: string | null;
  teamId: string;
}
```

Features:
- Fetch revenue data for Today/Week/Month (reuse existing `RevenueSummaryCard` logic)
- Toggle buttons styled as pills (like Fanbasis: `bg-[#EF476F]` for active)
- Large `$0.00` display with "Total Earnings Today" subtitle
- Optional mini sparkline chart embedded

Styling:
- Full-width container
- Clean white/card background
- Primary accent color for active period toggle

### DashboardMetricCard.tsx

```typescript
interface DashboardMetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: "purple" | "pink" | "teal" | "blue" | "orange";
  actionLabel?: string;
  onAction?: () => void;
}
```

Gradient presets:
```typescript
const gradients = {
  purple: "from-violet-600 via-purple-600 to-indigo-700",
  pink: "from-pink-500 via-rose-500 to-orange-500",
  teal: "from-emerald-600 via-teal-600 to-cyan-700",
  blue: "from-blue-500 via-blue-600 to-indigo-600",
  orange: "from-orange-500 via-amber-500 to-yellow-500",
};
```

### RecentActivity.tsx

```typescript
interface RecentActivityProps {
  teamId: string;
}
```

Features:
- Header with "Recent Activity" title and red "LIVE" dot indicator
- Fetch recent sales/commissions from `sales` table
- Real-time subscription for live updates
- Scrollable container (`max-h-[400px] overflow-y-auto`)
- Each item: Commission type icon, "Referral Commission" title, "$X.XX commission from [Name]", relative time

---

## Updated SalesDashboard Layout

The dashboard content will be restructured to:

1. **Hero Section** - Full width welcome with earnings toggle
2. **Metric Cards Row** - 3-column grid of gradient cards
3. **Earnings Overview** - Chart section with date filters
4. **Two-Column Bottom** - Leaderboard + Recent Activity side by side

Remove:
- Current `RevenueSummaryCard` (logic moves to `DashboardHero`)
- Current 6-column `MetricCard` grid (replaced with 3 gradient cards)
- "Not Closed Deals Alert" (move to a notification or toast)

---

## Visual Style Tokens

Following existing billing/payments patterns:

| Element | Style |
|---------|-------|
| Card container | `rounded-xl shadow-lg overflow-hidden` |
| Background decoration | `absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10` |
| Text on gradient | `text-white`, `text-white/80`, `text-white/60` |
| Action buttons | `bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0` |
| Period toggles | Pill-style with `bg-primary text-primary-foreground` for active |
| LIVE indicator | `bg-red-500 animate-pulse rounded-full w-2 h-2` |

---

## Mobile Responsiveness

- Hero section: Stack vertically on mobile
- Metric cards: 1-column on mobile, 3-column on desktop
- Recent Activity: Full width below chart on mobile, sidebar on desktop
- Period toggles: Horizontal scroll if needed on small screens

---

## Data Flow

No new API calls required - reuse existing:
- `getTeamPaymentsInRange()` for revenue calculations
- `supabase.from('sales')` for recent activity
- `supabase.from('appointments')` for metrics

Real-time subscriptions already exist in `SalesDashboard.tsx` and will be leveraged by the new components.
