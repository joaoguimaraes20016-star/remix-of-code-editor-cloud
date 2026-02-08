/**
 * High-Ticket Sales Readiness: Attribution & Scoring Tests
 *
 * Tests all fixes from the high-ticket sales readiness audit:
 * 1. UTM attribution storage in submit-funnel-lead
 * 2. Native booking attribution (funnel_lead_id on appointments)
 * 3. Automation booking attribution (book_appointment passes funnel_lead_id)
 * 4. Calendly webhook attribution (funnel_lead_id lookup by email/phone)
 * 5. Engagement scoring triggers (opens, clicks, bookings, submissions)
 * 6. DND enforcement in send-email, send-sms, send-whatsapp
 * 7. Revenue attribution chain (funnel → booking → deal → revenue)
 * 8. Migration verification (funnel_lead_id column, indexes, backfill)
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ============================================================
// HELPER: Read source file content for verification
// ============================================================
function readSourceFile(relativePath: string): string {
  const fullPath = path.resolve(process.cwd(), relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

// ============================================================
// 1. UTM ATTRIBUTION STORAGE
// ============================================================

describe("UTM Attribution Storage (submit-funnel-lead)", () => {
  const source = readSourceFile("supabase/functions/submit-funnel-lead/index.ts");

  it("should extract utm_source from request body", () => {
    expect(source).toContain("body.utm_source");
    expect(source).toContain("const utm_source");
  });

  it("should extract utm_medium from request body", () => {
    expect(source).toContain("body.utm_medium");
    expect(source).toContain("const utm_medium");
  });

  it("should extract utm_campaign from request body", () => {
    expect(source).toContain("body.utm_campaign");
    expect(source).toContain("const utm_campaign");
  });

  it("should include UTM fields in funnel_leads INSERT", () => {
    // The INSERT into funnel_leads must include all 3 UTM fields
    const insertSection = source.substring(
      source.indexOf('.insert({'),
      source.indexOf('.insert({') + 600,
    );
    expect(insertSection).toContain("utm_source");
    expect(insertSection).toContain("utm_medium");
    expect(insertSection).toContain("utm_campaign");
  });

  it("should include UTM fields in funnel_leads UPDATE (when provided)", () => {
    // The UPDATE should only set UTM fields when they have values (spread operator)
    const startIdx = source.indexOf("const updatePayload");
    const updateSection = source.substring(startIdx, startIdx + 700);
    expect(updateSection).toContain("utm_source");
    expect(updateSection).toContain("utm_medium");
    expect(updateSection).toContain("utm_campaign");
  });

  it("should not overwrite existing UTM with null on UPDATE", () => {
    // Update should use conditional spread: ...(utm_source && { utm_source })
    // This prevents overwriting existing UTM data with null
    const startIdx = source.indexOf("const updatePayload");
    const updateSection = source.substring(startIdx, startIdx + 700);
    // Should use conditional spread or similar pattern
    expect(updateSection).toMatch(/\.\.\.\(utm_source/);
    expect(updateSection).toMatch(/\.\.\.\(utm_medium/);
    expect(updateSection).toMatch(/\.\.\.\(utm_campaign/);
  });

  it("should handle missing UTM params gracefully (null coalescing)", () => {
    // Should use ?? null or ?? undefined, not direct assignment
    expect(source).toMatch(/utm_source.*\?\?.*null/);
    expect(source).toMatch(/utm_medium.*\?\?.*null/);
    expect(source).toMatch(/utm_campaign.*\?\?.*null/);
  });
});

// ============================================================
// 2. NATIVE BOOKING ATTRIBUTION
// ============================================================

describe("Native Booking Attribution (create-booking)", () => {
  const source = readSourceFile("supabase/functions/create-booking/index.ts");

  it("should accept funnel_lead_id from request body", () => {
    expect(source).toContain("funnel_lead_id");
    // Should destructure from body
    expect(source).toMatch(/funnel_lead_id/);
  });

  it("should include funnel_lead_id in appointmentData INSERT", () => {
    // The appointmentData object must include funnel_lead_id
    // The object is large due to multi-line ternary expressions, so we need a wide window
    const startIdx = source.indexOf("const appointmentData");
    const appointmentSection = source.substring(startIdx, startIdx + 1200);
    expect(appointmentSection).toContain("funnel_lead_id");
  });

  it("should set source to 'native' for native bookings", () => {
    expect(source).toContain('source: "native"');
  });

  it("should generate booking_token for native bookings", () => {
    expect(source).toContain("booking_token");
  });

  it("should still update funnel_leads table for booked_at tracking", () => {
    // The original behavior of updating funnel_leads.calendly_booked_at should remain
    expect(source).toContain("calendly_booked_at");
  });
});

// ============================================================
// 3. AUTOMATION BOOKING ATTRIBUTION
// ============================================================

describe("Automation Booking Attribution (book_appointment action)", () => {
  const source = readSourceFile(
    "supabase/functions/automation-trigger/actions/appointment-actions.ts",
  );

  it("should extract funnel_lead_id from context.lead", () => {
    expect(source).toContain("context.lead?.funnel_lead_id");
  });

  it("should pass funnel_lead_id to create-booking request", () => {
    // The fetch body should include funnel_lead_id
    const fetchSection = source.substring(
      source.indexOf("body: JSON.stringify({"),
      source.indexOf("body: JSON.stringify({") + 300,
    );
    expect(fetchSection).toContain("funnel_lead_id");
  });

  it("should fall back to context.lead.id if funnel_lead_id is missing", () => {
    // Pattern: context.lead?.funnel_lead_id || context.lead?.id
    expect(source).toMatch(/context\.lead\?\.funnel_lead_id.*\|\|.*context\.lead\?\.id/);
  });

  it("should resolve lead email from context for booking", () => {
    expect(source).toContain("context.lead?.email");
    expect(source).toContain("context.appointment?.lead_email");
  });

  it("should skip booking when no contact info available", () => {
    expect(source).toContain("no_contact_info_for_booking");
  });
});

// ============================================================
// 4. CALENDLY WEBHOOK ATTRIBUTION
// ============================================================

describe("Calendly Webhook Attribution (calendly-webhook)", () => {
  const source = readSourceFile("supabase/functions/calendly-webhook/index.ts");

  it("should lookup funnel_lead_id by email/phone before INSERT", () => {
    expect(source).toContain("funnel_leads");
    // Should query funnel_leads table
    expect(source).toContain("funnelLeadId");
  });

  it("should include funnel_lead_id in appointmentToInsert", () => {
    const insertSection = source.substring(
      source.indexOf("const appointmentToInsert"),
      source.indexOf("const appointmentToInsert") + 1200,
    );
    expect(insertSection).toContain("funnel_lead_id");
  });

  it("should order funnel_leads by created_at DESC to get most recent", () => {
    expect(source).toContain("ascending: false");
  });

  it("should handle lookup errors gracefully (non-fatal)", () => {
    // Attribution lookup failure should not block the booking
    expect(source).toContain("ATTRIBUTION");
    expect(source).toMatch(/catch.*lookupErr/s);
  });

  it("should log successful attribution linkage", () => {
    expect(source).toContain("Linked Calendly booking to funnel_lead");
  });
});

// ============================================================
// 5. ENGAGEMENT SCORING TRIGGERS (Migration)
// ============================================================

describe("Engagement Scoring Triggers (migration)", () => {
  const migration = readSourceFile(
    "supabase/migrations/20260212100000_attribution_and_engagement_scoring.sql",
  );

  it("should create engagement score trigger for message opens/clicks", () => {
    expect(migration).toContain("update_engagement_score_on_message");
    expect(migration).toContain("trigger_engagement_score_on_message");
  });

  it("should award +5 for email opens", () => {
    expect(migration).toContain("'opened' THEN v_score_delta := 5");
  });

  it("should award +10 for email clicks", () => {
    expect(migration).toContain("'clicked' THEN v_score_delta := 10");
  });

  it("should create engagement trigger for appointment booking (+50)", () => {
    expect(migration).toContain("update_engagement_on_booking");
    expect(migration).toContain("trigger_engagement_on_appointment_insert");
    expect(migration).toContain("engagement_score, 0) + 50");
  });

  it("should create engagement trigger for lead submission (+20)", () => {
    expect(migration).toContain("update_engagement_on_lead_submit");
    expect(migration).toContain("trigger_engagement_on_lead_submit");
    expect(migration).toContain("engagement_score, 0) + 20");
  });

  it("should update last_activity_at when scoring", () => {
    expect(migration).toContain("last_activity_at = NOW()");
  });

  it("should match contacts by email (case-insensitive) for scoring", () => {
    expect(migration).toContain("lower(email) = lower(NEW.to_address)");
  });

  it("should only fire on delivery_status changes (not every update)", () => {
    expect(migration).toContain("OLD.delivery_status IS DISTINCT FROM NEW.delivery_status");
  });

  it("should only score lead submissions with status = 'lead'", () => {
    expect(migration).toContain("NEW.status = 'lead'");
  });
});

// ============================================================
// 6. DND ENFORCEMENT
// ============================================================

describe("DND Enforcement (send-email)", () => {
  const source = readSourceFile("supabase/functions/send-email/index.ts");

  it("should check dnd_email before sending", () => {
    expect(source).toContain("dnd_email");
  });

  it("should return DND error code when contact opted out", () => {
    expect(source).toContain("DND_EMAIL");
  });

  it("should query contacts table for DND status", () => {
    expect(source).toContain('.from("contacts")');
    expect(source).toContain('.select("dnd_email")');
  });

  it("should be fail-open on DND check errors (non-blocking)", () => {
    expect(source).toContain("DND check failed, proceeding");
  });

  it("should log DND blocks for monitoring", () => {
    expect(source).toContain("[send-email] DND:");
  });
});

describe("DND Enforcement (send-sms)", () => {
  const source = readSourceFile("supabase/functions/send-sms/index.ts");

  it("should check dnd_sms before sending", () => {
    expect(source).toContain("dnd_sms");
  });

  it("should return DND error code when contact opted out", () => {
    expect(source).toContain("DND_SMS");
  });

  it("should be fail-open on DND check errors", () => {
    expect(source).toContain("DND check failed, proceeding");
  });
});

describe("DND Enforcement (send-whatsapp)", () => {
  const source = readSourceFile("supabase/functions/send-whatsapp/index.ts");

  it("should check dnd_sms for WhatsApp (shared channel)", () => {
    expect(source).toContain("dnd_sms");
  });

  it("should return DND error code when contact opted out", () => {
    expect(source).toContain("DND_WHATSAPP");
  });

  it("should strip 'whatsapp:' prefix for phone lookup", () => {
    expect(source).toContain("whatsapp:");
    expect(source).toContain("replace");
  });

  it("should be fail-open on DND check errors", () => {
    expect(source).toContain("DND check failed, proceeding");
  });
});

// ============================================================
// 7. REVENUE ATTRIBUTION CHAIN
// ============================================================

describe("Revenue Attribution Chain (End-to-End)", () => {
  it("should have complete funnel → contact → booking → deal → revenue chain", () => {
    // 1. Frontend captures UTM and sends to backend
    const normalizer = readSourceFile(
      "src/flow-canvas/shared/hooks/normalizeSubmitPayload.ts",
    );
    expect(normalizer).toContain("utm_source");
    expect(normalizer).toContain("utm_medium");
    expect(normalizer).toContain("utm_campaign");

    // 2. Backend stores UTM in funnel_leads
    const submitLead = readSourceFile(
      "supabase/functions/submit-funnel-lead/index.ts",
    );
    expect(submitLead).toContain("utm_source: utm_source || null");

    // 3. Booking stores funnel_lead_id on appointment
    const createBooking = readSourceFile(
      "supabase/functions/create-booking/index.ts",
    );
    expect(createBooking).toContain("funnel_lead_id: funnel_lead_id || null");

    // 4. Migration adds funnel_lead_id column to appointments
    const migration = readSourceFile(
      "supabase/migrations/20260212100000_attribution_and_engagement_scoring.sql",
    );
    expect(migration).toContain(
      "ADD COLUMN IF NOT EXISTS funnel_lead_id uuid REFERENCES funnel_leads(id)",
    );
  });

  it("should support revenue attribution query", () => {
    // The migration creates an index for attribution queries
    const migration = readSourceFile(
      "supabase/migrations/20260212100000_attribution_and_engagement_scoring.sql",
    );
    expect(migration).toContain("idx_appointments_funnel_lead_id");
  });

  it("should backfill existing appointments with funnel_lead_id", () => {
    const migration = readSourceFile(
      "supabase/migrations/20260212100000_attribution_and_engagement_scoring.sql",
    );
    // Should UPDATE existing appointments by matching email/phone
    expect(migration).toContain("UPDATE appointments");
    expect(migration).toContain("fl.email = a2.lead_email");
    expect(migration).toContain("fl.phone = a2.lead_phone");
  });

  it("all three booking paths should store funnel_lead_id", () => {
    // Path 1: Native booking
    const createBooking = readSourceFile(
      "supabase/functions/create-booking/index.ts",
    );
    const cbStartIdx = createBooking.indexOf("const appointmentData");
    const appointmentDataSection = createBooking.substring(cbStartIdx, cbStartIdx + 1200);
    expect(appointmentDataSection).toContain("funnel_lead_id");

    // Path 2: Calendly webhook
    const calendlyWebhook = readSourceFile(
      "supabase/functions/calendly-webhook/index.ts",
    );
    const calendlyInsert = calendlyWebhook.substring(
      calendlyWebhook.indexOf("const appointmentToInsert"),
      calendlyWebhook.indexOf("const appointmentToInsert") + 1200,
    );
    expect(calendlyInsert).toContain("funnel_lead_id");

    // Path 3: Automation action
    const appointmentActions = readSourceFile(
      "supabase/functions/automation-trigger/actions/appointment-actions.ts",
    );
    expect(appointmentActions).toContain("funnel_lead_id: funnelLeadId");
  });
});

// ============================================================
// 8. MIGRATION VERIFICATION
// ============================================================

describe("Migration: Attribution & Engagement Scoring", () => {
  const migration = readSourceFile(
    "supabase/migrations/20260212100000_attribution_and_engagement_scoring.sql",
  );

  it("should add funnel_lead_id column with foreign key to funnel_leads", () => {
    expect(migration).toContain("funnel_lead_id uuid REFERENCES funnel_leads(id)");
  });

  it("should use ON DELETE SET NULL for funnel_lead_id", () => {
    expect(migration).toContain("ON DELETE SET NULL");
  });

  it("should create partial index on funnel_lead_id (only non-null)", () => {
    expect(migration).toContain("idx_appointments_funnel_lead_id");
    expect(migration).toContain("WHERE funnel_lead_id IS NOT NULL");
  });

  it("should use IF NOT EXISTS for idempotent migration", () => {
    expect(migration).toContain("IF NOT EXISTS");
  });

  it("should backfill within same team_id for safety", () => {
    expect(migration).toContain("fl.team_id = a2.team_id");
  });

  it("should use DISTINCT ON for single best match per appointment", () => {
    expect(migration).toContain("DISTINCT ON (a2.id)");
  });

  it("should use SECURITY DEFINER for trigger functions", () => {
    const securityCount = (migration.match(/SECURITY DEFINER/g) || []).length;
    // Should have SECURITY DEFINER on all trigger functions (at least 3)
    expect(securityCount).toBeGreaterThanOrEqual(3);
  });

  it("should set search_path to public for security", () => {
    const searchPathCount = (migration.match(/search_path TO 'public'/g) || []).length;
    expect(searchPathCount).toBeGreaterThanOrEqual(1);
  });

  it("should DROP triggers before CREATE to be idempotent", () => {
    expect(migration).toContain("DROP TRIGGER IF EXISTS trigger_engagement_score_on_message");
    expect(migration).toContain("DROP TRIGGER IF EXISTS trigger_engagement_on_appointment_insert");
    expect(migration).toContain("DROP TRIGGER IF EXISTS trigger_engagement_on_lead_submit");
  });
});

// ============================================================
// 9. ARCHITECTURE CONSISTENCY
// ============================================================

describe("Architecture Consistency", () => {
  it("funnel_leads table schema should have UTM columns", () => {
    const types = readSourceFile("src/integrations/supabase/types.ts");
    expect(types).toContain("utm_source");
    expect(types).toContain("utm_medium");
    expect(types).toContain("utm_campaign");
  });

  it("contacts table should have engagement_score column", () => {
    const types = readSourceFile("src/integrations/supabase/types.ts");
    expect(types).toContain("engagement_score");
    expect(types).toContain("last_activity_at");
  });

  it("contacts table should have DND columns", () => {
    const types = readSourceFile("src/integrations/supabase/types.ts");
    expect(types).toContain("dnd_email");
    expect(types).toContain("dnd_sms");
    expect(types).toContain("dnd_voice");
  });

  it("engagement_score should be available in automation variable schema", () => {
    const varSchema = readSourceFile("src/lib/automations/variableSchema.ts");
    expect(varSchema).toContain("contact.engagement_score");
  });

  it("book_appointment should be a registered action type", () => {
    const types = readSourceFile("src/lib/automations/types.ts");
    expect(types).toContain("'book_appointment'");
    expect(types).toContain("Schedule an appointment");
  });

  it("appointment_booked should be a registered trigger type", () => {
    const types = readSourceFile("src/lib/automations/types.ts");
    expect(types).toContain("'appointment_booked'");
  });

  it("native booking should set source to 'native'", () => {
    const createBooking = readSourceFile(
      "supabase/functions/create-booking/index.ts",
    );
    expect(createBooking).toContain('source: "native"');
  });

  it("frontend normalizer should capture UTM params from metadata", () => {
    const normalizer = readSourceFile(
      "src/flow-canvas/shared/hooks/normalizeSubmitPayload.ts",
    );
    expect(normalizer).toContain("metadata?.utm_source");
    expect(normalizer).toContain("metadata?.utm_medium");
    expect(normalizer).toContain("metadata?.utm_campaign");
  });
});

// ============================================================
// 10. CALENDARBLOCK NATIVE BOOKING ATTRIBUTION (Frontend)
// ============================================================

describe("CalendarBlock Native Booking Attribution (Frontend)", () => {
  const calendarSource = readSourceFile(
    "src/funnel-builder-v3/editor/blocks/CalendarBlock.tsx",
  );
  const runtimeContextSource = readSourceFile(
    "src/funnel-builder-v3/context/FunnelRuntimeContext.tsx",
  );
  const rendererSource = readSourceFile(
    "src/funnel-builder-v3/runtime/FunnelV3Renderer.tsx",
  );

  // --- CalendarBlock sends funnel_lead_id ---

  it("CalendarBlock should import useFunnelRuntimeOptional", () => {
    expect(calendarSource).toContain("useFunnelRuntimeOptional");
    expect(calendarSource).toContain(
      "import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext'",
    );
  });

  it("CalendarBlock should call useFunnelRuntimeOptional to get runtime context", () => {
    expect(calendarSource).toContain("useFunnelRuntimeOptional()");
  });

  it("CalendarBlock should pass funnel_lead_id in native booking request body", () => {
    // Find the JSON.stringify body for the create-booking request
    const bodyStart = calendarSource.indexOf("body: JSON.stringify({");
    expect(bodyStart).toBeGreaterThan(-1);
    const bodySection = calendarSource.substring(bodyStart, bodyStart + 500);
    expect(bodySection).toContain("funnel_lead_id");
  });

  it("CalendarBlock should use runtime?.leadId for funnel_lead_id", () => {
    expect(calendarSource).toContain("runtime?.leadId");
  });

  // --- FunnelRuntimeContext exposes leadId ---

  it("FunnelRuntimeContext should define leadId in context type", () => {
    // The interface should include leadId
    const typeStart = runtimeContextSource.indexOf("interface FunnelRuntimeContextType");
    expect(typeStart).toBeGreaterThan(-1);
    const typeSection = runtimeContextSource.substring(typeStart, typeStart + 800);
    expect(typeSection).toContain("leadId: string | null");
  });

  it("FunnelRuntimeContext should accept leadId as a provider prop", () => {
    const propsStart = runtimeContextSource.indexOf("interface FunnelRuntimeProviderProps");
    expect(propsStart).toBeGreaterThan(-1);
    const propsSection = runtimeContextSource.substring(propsStart, propsStart + 500);
    expect(propsSection).toContain("leadId");
  });

  it("FunnelRuntimeContext should include leadId in context value", () => {
    // The useMemo context value should include leadId
    const memoStart = runtimeContextSource.indexOf("const contextValue = useMemo");
    expect(memoStart).toBeGreaterThan(-1);
    const memoSection = runtimeContextSource.substring(memoStart, memoStart + 800);
    expect(memoSection).toContain("leadId");
  });

  it("FunnelRuntimeContext should include leadId in useMemo dependency array", () => {
    // Find the dependency array of the useMemo for contextValue
    const depsStart = runtimeContextSource.indexOf("}), [");
    expect(depsStart).toBeGreaterThan(-1);
    const depsSection = runtimeContextSource.substring(depsStart, depsStart + 600);
    expect(depsSection).toContain("leadId");
  });

  // --- FunnelV3Renderer extracts and passes leadId ---

  it("FunnelV3Renderer should extract leadId from useUnifiedLeadSubmit", () => {
    expect(rendererSource).toContain("leadId");
    // Should destructure leadId from the hook
    expect(rendererSource).toMatch(/const\s*\{[^}]*leadId[^}]*\}\s*=\s*useUnifiedLeadSubmit/);
  });

  it("FunnelV3Renderer should pass leadId to FunnelRuntimeProvider", () => {
    expect(rendererSource).toContain("leadId={leadId}");
  });

  // --- End-to-end: CalendarBlock → create-booking ---

  it("end-to-end: CalendarBlock booking request targets create-booking endpoint", () => {
    expect(calendarSource).toContain("functions/v1/create-booking");
  });

  it("end-to-end: create-booking accepts funnel_lead_id and stores it", () => {
    const createBookingSource = readSourceFile(
      "supabase/functions/create-booking/index.ts",
    );
    // Backend accepts funnel_lead_id
    expect(createBookingSource).toContain("funnel_lead_id");
    // Backend includes it in appointment INSERT
    const startIdx = createBookingSource.indexOf("const appointmentData");
    const section = createBookingSource.substring(startIdx, startIdx + 1200);
    expect(section).toContain("funnel_lead_id");
  });

  it("all four booking paths should now have attribution", () => {
    // Path 1: Native booking via CalendarBlock (frontend → create-booking)
    const bodyStart = calendarSource.indexOf("body: JSON.stringify({");
    const bodySection = calendarSource.substring(bodyStart, bodyStart + 500);
    expect(bodySection).toContain("funnel_lead_id");

    // Path 2: Automation action (book_appointment → create-booking)
    const appointmentActions = readSourceFile(
      "supabase/functions/automation-trigger/actions/appointment-actions.ts",
    );
    expect(appointmentActions).toContain("funnel_lead_id: funnelLeadId");

    // Path 3: Calendly webhook (lookup by email/phone)
    const calendlyWebhook = readSourceFile(
      "supabase/functions/calendly-webhook/index.ts",
    );
    expect(calendlyWebhook).toContain("funnelLeadId");

    // Path 4: Direct API call to create-booking (accepts funnel_lead_id param)
    const createBooking = readSourceFile(
      "supabase/functions/create-booking/index.ts",
    );
    expect(createBooking).toContain("funnel_lead_id");
  });
});
