import { supabase } from '@/integrations/supabase/client';

let columnExistsCache: boolean | null = null;

/**
 * Checks if an error is related to the parent_account_id column not existing.
 * Standardized error detection for missing column errors.
 * 
 * @param error - The error object from Supabase or catch block
 * @returns boolean - true if error indicates column doesn't exist
 */
export function isParentAccountIdColumnError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = (error.message || '').toLowerCase();
  const errorCode = error.code || '';
  
  return (
    errorCode === 'PGRST116' || // Column not found (PostgREST)
    errorCode === '42703' || // Undefined column (PostgreSQL)
    errorMessage.includes('parent_account_id') ||
    errorMessage.includes('does not exist') ||
    errorMessage.includes('schema cache') ||
    (errorMessage.includes('column') && errorMessage.includes('not found'))
  );
}

/**
 * Checks if the parent_account_id column exists in the teams table.
 * Uses caching to avoid repeated queries.
 * 
 * @returns Promise<boolean> - true if column exists, false otherwise
 */
export async function checkParentAccountIdExists(): Promise<boolean> {
  // Return cached value if available
  if (columnExistsCache !== null) return columnExistsCache;
  
  try {
    // Try to select the column - if it doesn't exist, Supabase will return an error
    const { error } = await supabase
      .from('teams')
      .select('parent_account_id')
      .limit(1);
    
    // Check for specific error codes that indicate column doesn't exist
    if (error) {
      const errorMessage = error.message?.toLowerCase() || '';
      const errorCode = error.code || '';
      
      // Common Supabase/PostgREST error codes for missing columns
      if (
        errorCode === 'PGRST116' || // Column not found
        errorCode === '42703' || // Undefined column (PostgreSQL)
        errorMessage.includes('parent_account_id') ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('schema cache') ||
        errorMessage.includes('column') && errorMessage.includes('not found')
      ) {
        columnExistsCache = false;
        return false;
      }
      
      // Other errors - assume column might exist but query failed for other reasons
      // Return false to be safe
      columnExistsCache = false;
      return false;
    }
    
    // No error means column exists
    columnExistsCache = true;
    return true;
  } catch (err: any) {
    // Catch any unexpected errors
    if (isParentAccountIdColumnError(err)) {
      columnExistsCache = false;
      return false;
    }
    
    // Unknown error - assume column doesn't exist to be safe
    columnExistsCache = false;
    return false;
  }
}

/**
 * Clears the cache for column existence check.
 * Useful if you want to force a re-check after migrations.
 */
export function clearColumnExistsCache(): void {
  columnExistsCache = null;
}
