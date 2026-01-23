
# Fix: FathomConfig Not Showing Connected State

## Problem Identified
The `FathomConfig` component queries for `config` field but the `team_integrations_public` view only exposes `config_safe` (for security - to hide tokens).

**Current code (line 83):**
```typescript
.select("integration_type, is_connected, config")
```

**Should be:**
```typescript
.select("integration_type, is_connected, config_safe")
```

## Changes Required

### File: `src/components/FathomConfig.tsx`

| Line | Change |
|------|--------|
| 16-24 | Update interface to use `config_safe` instead of `config` |
| 83 | Change select query from `config` to `config_safe` |
| 95-97 | Update property access from `config` to `config_safe` |

### Specific Changes

**1. Update interface (lines 16-24):**
```typescript
interface FathomIntegrationPublic {
  integration_type: string;
  is_connected: boolean;
  config_safe: {
    user_email?: string;
    user_name?: string;
    connected_at?: string;
  } | null;
}
```

**2. Update query select (line 83):**
```typescript
.select("integration_type, is_connected, config_safe")
```

**3. Update property access (lines 95-97):**
```typescript
const userEmail = integration?.config_safe?.user_email;
const userName = integration?.config_safe?.user_name;
const connectedAt = integration?.config_safe?.connected_at;
```

## Root Cause
The `team_integrations_public` view is a security layer that masks sensitive data like access tokens. It exposes:
- `is_connected` - connection status
- `config_safe` - safe metadata (email, name, connected_at)

It does NOT expose:
- `config` - the raw config (would contain tokens)

Since `config` isn't in the view, the query returns `null` for that field, making the component think there's no connected data even though `is_connected` is `true`.

## Result
After this fix, when you click "Manage" on a connected Fathom integration, it will correctly show the connected status with user details and a disconnect button.
