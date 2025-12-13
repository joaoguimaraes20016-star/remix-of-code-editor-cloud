import { supabase } from "@/integrations/supabase/client";
import type { FunnelEvent, RecordEventResult } from "./types";

/**
 * recordEvent - attempts to persist a funnel event to the backend.
 * Strategy:
 * 1) Try calling a dedicated Edge Function `record-funnel-event` if available.
 * 2) Fallback to inserting into the `events` table directly via Supabase client.
 * The function is resilient: it returns an object with success/error but never throws.
 */
export async function recordEvent(event: FunnelEvent): Promise<RecordEventResult> {
  try {
    // Prefer serverless function if available (allows DB migrations and unique upserts server-side)
    try {
      const { data, error } = await supabase.functions.invoke("record-funnel-event", {
        body: event,
      });

      if (error) {
        console.warn("record-funnel-event function returned error, falling back to direct insert", error);
      } else {
        // Function returned successfully. Expect shape { inserted: boolean, event?: object }
        // @ts-ignore
        const inserted = data?.inserted;
        // @ts-ignore
        const returnedEvent = data?.event;

        if (inserted === false) {
          // Idempotent duplicate — treat as success
          if (process.env.NODE_ENV !== "production") {
            // @ts-ignore
            console.debug("recordEvent: dedupe hit (inserted=false)", event.dedupe_key);
          }
          return { success: true, event: returnedEvent as FunnelEvent | undefined };
        }

        return { success: true, event: returnedEvent as FunnelEvent | undefined };
      }
    } catch (fnErr) {
      // Function might not exist or be restricted; fall back to direct insert
      console.debug("record-funnel-event function not available or failed, using direct insert", fnErr);
    }

    // Fallback: insert into `events` table. This assumes an `events` table exists.
    const { data, error } = await supabase.from("events").insert(event).select().limit(1).single();
    if (error) {
      // If insert fails (missing table or constraint), return error rather than throwing
      return { success: false, error };
    }

    return { success: true, event: data as FunnelEvent };
  } catch (err) {
    return { success: false, error: err };
  }
}

export default recordEvent;
