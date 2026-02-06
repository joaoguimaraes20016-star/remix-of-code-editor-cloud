// Utility functions for generating and validating slugs

/**
 * Generates a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generates a unique booking slug for a team
 * Checks for uniqueness and appends a random suffix if needed
 */
export async function generateUniqueBookingSlug(
  teamName: string,
  supabase: any,
  excludeTeamId?: string
): Promise<string> {
  let baseSlug = generateSlug(teamName);
  
  // Ensure minimum length
  if (baseSlug.length < 3) {
    baseSlug = `${baseSlug}-team`;
  }

  // Check uniqueness
  let query = supabase
    .from("teams")
    .select("id")
    .eq("booking_slug", baseSlug);

  if (excludeTeamId) {
    query = query.neq("id", excludeTeamId);
  }

  const { data: existing } = await query.maybeSingle();

  // If slug exists, append random suffix
  if (existing) {
    const suffix = Math.random().toString(36).slice(2, 6);
    baseSlug = `${baseSlug}-${suffix}`;
    
    // Double-check uniqueness with suffix
    let checkQuery = supabase
      .from("teams")
      .select("id")
      .eq("booking_slug", baseSlug);
    
    if (excludeTeamId) {
      checkQuery = checkQuery.neq("id", excludeTeamId);
    }
    
    const { data: stillExists } = await checkQuery.maybeSingle();
    
    // If still exists (unlikely), append timestamp
    if (stillExists) {
      baseSlug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
    }
  }

  return baseSlug;
}
