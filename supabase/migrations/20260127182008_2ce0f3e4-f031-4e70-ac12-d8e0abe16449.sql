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

CREATE POLICY "Team members can view payments"
ON public.payments FOR SELECT
USING (is_team_member(auth.uid(), team_id));

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