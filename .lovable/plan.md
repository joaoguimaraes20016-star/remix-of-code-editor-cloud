

# Customizable Role Labels - Remove Hardcoded "Setter" / "Closer"

## Overview

Replace all hardcoded "Setter" and "Closer" terminology throughout the CRM with customizable labels that team admins can configure. This creates a generic "Member Leaderboard" approach while allowing teams to define their own role names if desired.

---

## Summary of Changes

1. **Add `custom_labels` JSONB column** to the `teams` table to store customizable terminology
2. **Create a React Context** (`TeamLabelsContext`) to provide labels throughout the app
3. **Update all components** to use dynamic labels instead of hardcoded strings
4. **Add a "Terminology" settings section** in Team Settings for admins to customize labels

---

## Database Schema Change

### Migration: Add `custom_labels` column to `teams` table

```sql
ALTER TABLE public.teams 
ADD COLUMN custom_labels jsonb DEFAULT '{
  "role_1": "Setter",
  "role_2": "Closer",
  "role_1_plural": "Setters",
  "role_2_plural": "Closers",
  "role_1_short": "S",
  "role_2_short": "C"
}'::jsonb;

COMMENT ON COLUMN public.teams.custom_labels IS 'Customizable terminology for roles and CRM elements';
```

This allows teams to customize:
- `role_1` / `role_2`: Singular names (default: "Setter" / "Closer")
- `role_1_plural` / `role_2_plural`: Plural names (default: "Setters" / "Closers")
- `role_1_short` / `role_2_short`: Abbreviations for compact displays (default: "S" / "C")

---

## Implementation Details

### 1. Create TeamLabelsContext

**New File**: `src/contexts/TeamLabelsContext.tsx`

This context will:
- Fetch the team's `custom_labels` from Supabase
- Provide a `getLabel()` helper function
- Default to standard terminology if not customized

```typescript
interface TeamLabels {
  role_1: string;        // "Setter" by default
  role_2: string;        // "Closer" by default
  role_1_plural: string; // "Setters" by default
  role_2_plural: string; // "Closers" by default
  role_1_short: string;  // "S" by default
  role_2_short: string;  // "C" by default
}

interface TeamLabelsContextValue {
  labels: TeamLabels;
  getLabel: (key: keyof TeamLabels) => string;
  getRoleLabel: (dbRole: 'setter' | 'closer', plural?: boolean) => string;
  loading: boolean;
}
```

Usage example:
```typescript
const { getRoleLabel } = useTeamLabels();
// getRoleLabel('setter') => "Setter" (or custom label)
// getRoleLabel('closer', true) => "Closers" (or custom plural label)
```

### 2. Update Components to Use Dynamic Labels

| Component | Current Hardcoded Text | Change To |
|-----------|------------------------|-----------|
| `ActivityTracker.tsx` | "Setters Activity Today" | `{getRoleLabel('setter', true)} Activity Today` |
| `ActivityTracker.tsx` | "Closers Activity Today" | `{getRoleLabel('closer', true)} Activity Today` |
| `AppointmentsBookedBreakdown.tsx` | "Setter" / "Closer" labels | Dynamic via `getRoleLabel()` |
| `Performance.tsx` | "S: X · C: Y" | `{labels.role_1_short}: X · {labels.role_2_short}: Y` |
| `TaskTypeDefaults.tsx` | "Setter" / "Closer" radio options | Dynamic labels |
| `TemplateVariablePicker.tsx` | "Setter Name" / "Closer Name" | Dynamic labels for descriptions |
| `TeamSettings.tsx` | Role dropdown options | Dynamic labels |

### 3. Add Terminology Settings UI

**Update**: `src/pages/TeamSettings.tsx`

Add a new tab called "Terminology" (or add a section to the existing "Branding" tab) where admins can:

```text
+--------------------------------------------------+
|  Terminology                                      |
|  Customize the labels used in your CRM            |
|                                                   |
|  Role 1 (Database: setter)                        |
|  ┌──────────────────────────────────────┐        |
|  │ Setter                               │        |
|  └──────────────────────────────────────┘        |
|  Plural: Setters    Short: S                     |
|                                                   |
|  Role 2 (Database: closer)                        |
|  ┌──────────────────────────────────────┐        |
|  │ Closer                               │        |
|  └──────────────────────────────────────┘        |
|  Plural: Closers    Short: C                     |
|                                                   |
|  [Reset to Defaults]  [Save]                     |
+--------------------------------------------------+
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| **Database Migration** | Create | Add `custom_labels` JSONB column to `teams` |
| `src/contexts/TeamLabelsContext.tsx` | Create | Context provider for team labels |
| `src/components/TeamLabelsProvider.tsx` | Create | Provider wrapper component |
| `src/pages/TeamSettings.tsx` | Modify | Add Terminology settings tab |
| `src/components/appointments/ActivityTracker.tsx` | Modify | Use dynamic labels |
| `src/components/AppointmentsBookedBreakdown.tsx` | Modify | Use dynamic labels |
| `src/pages/Performance.tsx` | Modify | Use dynamic labels for S:/C: |
| `src/components/task-flow/TaskTypeDefaults.tsx` | Modify | Use dynamic labels |
| `src/components/automations/builder/TemplateVariablePicker.tsx` | Modify | Use dynamic labels |
| `src/integrations/supabase/types.ts` | Update | Add `custom_labels` to Teams type |

---

## Technical Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                        TeamLayout                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              TeamLabelsProvider                        │  │
│  │   ┌─────────────────────────────────────────────────┐ │  │
│  │   │  Fetches custom_labels from teams table         │ │  │
│  │   │  Provides: labels, getLabel(), getRoleLabel()   │ │  │
│  │   └─────────────────────────────────────────────────┘ │  │
│  │                          │                             │  │
│  │    ┌─────────────────────┴───────────────────────┐    │  │
│  │    ▼                     ▼                       ▼    │  │
│  │ Performance     ActivityTracker     AppointmentsBreakdown│
│  │ (uses labels)   (uses labels)       (uses labels)     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Default Values and Backward Compatibility

- If `custom_labels` is NULL or missing keys, fall back to defaults:
  - `role_1`: "Setter"
  - `role_2`: "Closer"
  - `role_1_plural`: "Setters"
  - `role_2_plural`: "Closers"
  - `role_1_short`: "S"
  - `role_2_short`: "C"

- Existing teams won't need to do anything; they'll see the same labels they see now
- Only teams that want custom terminology need to configure it

---

## Example Customization Scenarios

| Use Case | role_1 | role_2 | role_1_plural | role_2_plural |
|----------|--------|--------|---------------|---------------|
| Default Sales Team | Setter | Closer | Setters | Closers |
| Real Estate | Agent | Broker | Agents | Brokers |
| Consulting | Rep | Consultant | Reps | Consultants |
| Generic | Member | Lead | Members | Leads |
| Support Team | Intake | Specialist | Intake | Specialists |

---

## Result

After implementation:
- All "Setter" / "Closer" labels throughout the app will be dynamically pulled from team settings
- Admins can customize these labels in Team Settings > Terminology
- The database role values (`setter`, `closer`) remain unchanged for compatibility
- Only the **display labels** are customizable

