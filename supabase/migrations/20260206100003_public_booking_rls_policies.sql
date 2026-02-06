-- ============================================
-- PUBLIC BOOKING RLS POLICIES
-- ============================================
-- These policies allow unauthenticated users to read
-- teams and event types for the public booking page.
-- Without these, the public booking page shows "Team not found"
-- because all existing SELECT policies require auth.uid().
-- ============================================

-- 1. Allow anyone to look up teams by booking_slug (public booking page)
-- Only exposes teams that have set a booking_slug (opted into public booking)
DROP POLICY IF EXISTS "Public can view teams by booking_slug" ON public.teams;
CREATE POLICY "Public can view teams by booking_slug"
  ON public.teams FOR SELECT
  USING (booking_slug IS NOT NULL);

-- 2. Allow anyone to view active event types (for public booking pages)
-- Only exposes event types that are explicitly marked active
DROP POLICY IF EXISTS "Public can view active event types" ON public.event_types;
CREATE POLICY "Public can view active event types"
  ON public.event_types FOR SELECT
  USING (is_active = true);
