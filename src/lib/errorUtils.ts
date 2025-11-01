import { supabase } from "@/integrations/supabase/client";

/**
 * Log error to backend for monitoring
 */
async function logErrorToBackend(error: any, context?: Record<string, any>) {
  try {
    // Get current user if available
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.functions.invoke('log-error', {
      body: {
        team_id: context?.teamId || null,
        user_id: user?.id || null,
        error_type: error?.code || 'unknown',
        error_message: error?.message || String(error),
        error_context: {
          ...context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }
      }
    });
  } catch (logError) {
    // Silently fail - don't break the app if logging fails
    console.error('Failed to log error:', logError);
  }
}

/**
 * Sanitize error messages for user display
 * Prevents exposing database structure, table names, and internal logic
 */
export function getUserFriendlyError(error: any, context?: Record<string, any>): string {
  // Log to backend in both dev and production
  logErrorToBackend(error, context);
  
  // Don't log sensitive error details in production console
  if (import.meta.env.DEV) {
    console.error('[Debug only]:', error);
  }
  
  // Handle specific error codes with generic messages
  if (error?.code === '23505') {
    return 'This record already exists';
  }
  
  if (error?.code === '23503') {
    return 'Unable to complete operation due to data dependency';
  }
  
  if (error?.code === '42501') {
    return 'Access denied';
  }
  
  // Generic RLS policy violations
  if (error?.message?.includes('RLS') || error?.message?.includes('policy')) {
    return 'Access denied';
  }
  
  // Generic foreign key violations
  if (error?.message?.includes('foreign key')) {
    return 'Unable to complete operation';
  }
  
  // Generic unique constraint violations
  if (error?.message?.includes('unique constraint')) {
    return 'This record already exists';
  }
  
  // Network errors
  if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
    return 'Network error. Please check your connection';
  }
  
  // Default generic message
  return 'An error occurred. Please try again';
}
