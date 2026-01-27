

# Database Security Hardening: Critical Pre-Launch Fixes

## Overview

This plan addresses the **2 critical (ERROR) security issues** identified by the Supabase database linter, plus adds policies to **7 tables with RLS enabled but zero policies**.

| Priority | Issue Type | Count | Tables Affected |
|----------|-----------|-------|-----------------|
| **Critical** | RLS Disabled in Public | 1 | `events` |
| **Critical** | Sensitive Columns Exposed | 1 | Linked to `events` |
| **High** | RLS Enabled, No Policies | 7 | `automations`, `asset_field_templates`, `message_logs`, `payments`, `team_automation_rules`, `team_follow_up_flow_config`, `team_follow_up_settings` |

---

## Critical Issue 1: `events` Table Has RLS Disabled

### Current State
- RLS is **disabled** on the `events` table
- Contains funnel analytics data including:
  - `session_id` - User session identifiers
  - `lead_id` - References to lead submissions
  - `payload` - May contain email addresses and form data
- No foreign key to `funnels.team_id` for authorization checks
- Publicly queryable via PostgREST API

### Risk Assessment
**HIGH RISK**: Anyone with the Supabase anon key can:
- Query all funnel event data across all teams
- Extract email addresses from event payloads
- Enumerate session IDs and lead behavior
- Perform competitive intelligence gathering

### Solution

#### Step 1: Enable RLS on events table
```sql
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
```

#### Step 2: Create helper function for funnel team ownership
```sql
CREATE OR REPLACE FUNCTION public.get_funnel_team_id(p_funnel_id text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM funnels WHERE id::text = p_funnel_id
$$;
```

#### Step 3: Create RLS policies

**Policy 1: Team members can view their funnel events**
```sql
CREATE POLICY "Team members can view funnel events"
ON public.events FOR SELECT
USING (
  is_team_member(auth.uid(), get_funnel_team_id(funnel_id))
);
```

**Policy 2: Service role can insert events (for edge function)**
```sql
CREATE POLICY "Service role can insert events"
ON public.events FOR INSERT
WITH CHECK (true);
```

This policy allows the `record-funnel-event` edge function (using service role key) to insert events from public funnel pages.

---

## Critical Issue 2: Tables with RLS Enabled but No Policies

These tables have RLS enabled (good!) but zero policies defined, meaning **all access is denied** including legitimate uses. This can cause application bugs or force workarounds that bypass security.

### 2.1 `automations` Table

**Contains**: Team automation workflows (name, definition, triggers)  
**Has**: `team_id` column for authorization

```sql
-- Team members can view their automations
CREATE POLICY "Team members can view automations"
ON public.automations FOR SELECT
USING (is_team_member(auth.uid(), team_id));

-- Team admins can manage automations
CREATE POLICY "Team admins can manage automations"
ON public.automations FOR ALL
USING (is_team_admin(auth.uid(), team_id))
WITH CHECK (is_team_admin(auth.uid(), team_id));
```

### 2.2 `asset_field_templates` Table

**Contains**: Custom field templates for client assets  
**Has**: `team_id` column (nullable - can be null for system templates)

```sql
-- Team members can view their templates
CREATE POLICY "Team members can view asset field templates"
ON public.asset_field_templates FOR SELECT
USING (
  team_id IS NULL  -- System templates visible to all
  OR is_team_member(auth.uid(), team_id)
);

-- Team admins can manage their templates
CREATE POLICY "Team admins can manage asset field templates"
ON public.asset_field_templates FOR ALL
USING (
  team_id IS NOT NULL 
  AND is_team_admin(auth.uid(), team_id)
)
WITH CHECK (
  team_id IS NOT NULL 
  AND is_team_admin(auth.uid(), team_id)
);
```

### 2.3 `message_logs` Table

**Contains**: SMS/email delivery logs with PII (`to_address`, `from_address`)  
**Has**: `team_id` column

```sql
-- Team members can view their message logs
CREATE POLICY "Team members can view message logs"
ON public.message_logs FOR SELECT
USING (is_team_member(auth.uid(), team_id));

-- Service role can insert logs (for automation engine)
CREATE POLICY "Service role can insert message logs"
ON public.message_logs FOR INSERT
WITH CHECK (true);
```

### 2.4 `payments` Table

**Contains**: Payment transaction records  
**Analysis needed**: Check for `team_id` or relationship

```sql
-- First check table structure
-- If has team_id:
CREATE POLICY "Team members can view payments"
ON public.payments FOR SELECT
USING (is_team_member(auth.uid(), team_id));

-- Service role can insert/update payments (for webhooks)
CREATE POLICY "Service role can manage payments"
ON public.payments FOR ALL
USING (true)
WITH CHECK (true);
```

### 2.5 `team_automation_rules` Table

**Contains**: Team-specific automation rules  
**Has**: `team_id` column

```sql
-- Team admins can manage automation rules
CREATE POLICY "Team admins can manage automation rules"
ON public.team_automation_rules FOR ALL
USING (is_team_admin(auth.uid(), team_id))
WITH CHECK (is_team_admin(auth.uid(), team_id));
```

### 2.6 `team_follow_up_flow_config` Table

**Contains**: Follow-up workflow configuration  
**Has**: `team_id` column

```sql
-- Team admins can manage follow-up config
CREATE POLICY "Team admins can manage follow-up config"
ON public.team_follow_up_flow_config FOR ALL
USING (is_team_admin(auth.uid(), team_id))
WITH CHECK (is_team_admin(auth.uid(), team_id));
```

### 2.7 `team_follow_up_settings` Table

**Contains**: Follow-up settings per team  
**Has**: `team_id` column

```sql
-- Team members can view follow-up settings
CREATE POLICY "Team members can view follow-up settings"
ON public.team_follow_up_settings FOR SELECT
USING (is_team_member(auth.uid(), team_id));

-- Team admins can manage follow-up settings
CREATE POLICY "Team admins can manage follow-up settings"
ON public.team_follow_up_settings FOR ALL
USING (is_team_admin(auth.uid(), team_id))
WITH CHECK (is_team_admin(auth.uid(), team_id));
```

---

## Complete Migration Script

```sql
-- ============================================
-- SECURITY HARDENING MIGRATION
-- Priority: CRITICAL - Run before launch
-- ============================================

-- ===========================================
-- PART 1: Enable RLS on events table
-- ===========================================

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Helper function to get team_id from funnel
CREATE OR REPLACE FUNCTION public.get_funnel_team_id(p_funnel_id text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM funnels WHERE id::text = p_funnel_id LIMIT 1
$$;

-- Team members can view their funnel events
CREATE POLICY "Team members can view funnel events"
ON public.events FOR SELECT
USING (
  is_team_member(auth.uid(), get_funnel_team_id(funnel_id))
);

-- Service role can insert events (edge function uses service key)
CREATE POLICY "Service role can insert events"
ON public.events FOR INSERT
WITH CHECK (true);

-- ===========================================
-- PART 2: Add policies to automations table
-- ===========================================

CREATE POLICY "Team members can view automations"
ON public.automations FOR SELECT
USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can manage automations"
ON public.automations FOR ALL
USING (is_team_admin(auth.uid(), team_id))
WITH CHECK (is_team_admin(auth.uid(), team_id));

-- ===========================================
-- PART 3: Add policies to asset_field_templates
-- ===========================================

CREATE POLICY "Anyone can view system templates"
ON public.asset_field_templates FOR SELECT
USING (team_id IS NULL);

CREATE POLICY "Team members can view their templates"
ON public.asset_field_templates FOR SELECT
USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can manage templates"
ON public.asset_field_templates FOR ALL
USING (team_id IS NOT NULL AND is_team_admin(auth.uid(), team_id))
WITH CHECK (team_id IS NOT NULL AND is_team_admin(auth.uid(), team_id));

-- ===========================================
-- PART 4: Add policies to message_logs
-- ===========================================

CREATE POLICY "Team members can view message logs"
ON public.message_logs FOR SELECT
USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Service role can insert message logs"
ON public.message_logs FOR INSERT
WITH CHECK (true);

-- ===========================================
-- PART 5: Add policies to payments table
-- ===========================================

-- Note: Payments typically managed by webhooks, so service role access
CREATE POLICY "Service role can manage payments"
ON public.payments FOR ALL
USING (true)
WITH CHECK (true);

-- ===========================================
-- PART 6: Add policies to team_automation_rules
-- ===========================================

CREATE POLICY "Team admins can manage automation rules"
ON public.team_automation_rules FOR ALL
USING (is_team_admin(auth.uid(), team_id))
WITH CHECK (is_team_admin(auth.uid(), team_id));

-- ===========================================
-- PART 7: Add policies to team_follow_up_flow_config
-- ===========================================

CREATE POLICY "Team admins can manage follow-up config"
ON public.team_follow_up_flow_config FOR ALL
USING (is_team_admin(auth.uid(), team_id))
WITH CHECK (is_team_admin(auth.uid(), team_id));

-- ===========================================
-- PART 8: Add policies to team_follow_up_settings
-- ===========================================

CREATE POLICY "Team members can view follow-up settings"
ON public.team_follow_up_settings FOR SELECT
USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can manage follow-up settings"
ON public.team_follow_up_settings FOR ALL
USING (is_team_admin(auth.uid(), team_id))
WITH CHECK (is_team_admin(auth.uid(), team_id));

-- ===========================================
-- VERIFICATION: Run after migration
-- ===========================================
-- SELECT tablename, 
--        (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
-- FROM pg_tables t
-- WHERE schemaname = 'public'
--   AND (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) = 0;
```

---

## Implementation Steps

1. **Create migration file** with the SQL above
2. **Run migration** via Supabase dashboard or CLI
3. **Verify** by re-running the linter - should show 0 ERRORs for RLS issues
4. **Test** that:
   - Funnel event recording still works (edge function uses service role)
   - Automation management works in the app
   - Message logs are visible to team members
   - No broken functionality due to overly restrictive policies

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/[timestamp]_security_hardening_rls.sql` | Complete migration script |

---

## Post-Implementation Verification

After running the migration, verify with:

```sql
-- Check all tables now have policies
SELECT 
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = c.relname) as policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('events', 'automations', 'asset_field_templates', 'message_logs', 'payments', 'team_automation_rules', 'team_follow_up_flow_config', 'team_follow_up_settings')
ORDER BY c.relname;
```

Expected result: All tables should show `rls_enabled = true` and `policy_count >= 1`.

