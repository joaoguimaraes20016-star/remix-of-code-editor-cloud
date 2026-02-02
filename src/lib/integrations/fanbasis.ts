/**
 * Fanbasis OAuth Integration Utilities
 * 
 * Helper functions for integrating with Fanbasis OAuth 2.0 API
 */

import { supabase } from '@/integrations/supabase/client';

export interface FanbasisConfig {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
  creator_id?: string;
  creator_name?: string;
  connected_at: string;
  last_refreshed_at?: string;
}

export interface FanbasisIntegration {
  id: string;
  team_id: string;
  integration_type: 'fanbasis';
  is_connected: boolean;
  config: FanbasisConfig;
  created_at: string;
  updated_at: string;
}

/**
 * Start Fanbasis OAuth flow (for use in FanbasisConfig component)
 * Note: This is NOT used in PaymentsPortal which opens popup directly
 */
export async function connectFanbasis(
  teamId: string,
  redirectUri?: string
): Promise<{ success: boolean; creatorId?: string; error?: string }> {
  return new Promise(async (resolve) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        resolve({ success: false, error: 'Not authenticated' });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fanbasis-oauth-start`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId,
            redirectUri: redirectUri || window.location.href,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        resolve({ success: false, error: error.error || 'Failed to start OAuth' });
        return;
      }

      const { authUrl } = await response.json();

      const popup = window.open(
        authUrl,
        'fanbasis-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        resolve({ success: false, error: 'Popup blocked. Please allow popups for this site.' });
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'fanbasis-oauth-success') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          resolve({ success: true, creatorId: event.data.creatorId });
        } else if (event.data.type === 'fanbasis-oauth-error') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          resolve({ success: false, error: event.data.error });
        }
      };

      window.addEventListener('message', handleMessage);

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          resolve({ success: false, error: 'OAuth cancelled by user' });
        }
      }, 1000);
    } catch (error) {
      resolve({ success: false, error: String(error) });
    }
  });
}

/**
 * Check if Fanbasis is connected for a team
 */
export async function isFanbasisConnected(teamId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('team_integrations')
      .select('is_connected')
      .eq('team_id', teamId)
      .eq('integration_type', 'fanbasis')
      .maybeSingle();

    if (error) {
      console.error('Error checking Fanbasis connection:', error);
      return false;
    }

    return data?.is_connected || false;
  } catch (error) {
    console.error('Error checking Fanbasis connection:', error);
    return false;
  }
}

/**
 * Get Fanbasis integration details
 */
export async function getFanbasisIntegration(
  teamId: string
): Promise<FanbasisIntegration | null> {
  try {
    const { data, error } = await supabase
      .from('team_integrations')
      .select('*')
      .eq('team_id', teamId)
      .eq('integration_type', 'fanbasis')
      .maybeSingle();

    if (error) {
      console.error('Error fetching Fanbasis integration:', error);
      return null;
    }

    return data as unknown as FanbasisIntegration | null;
  } catch (error) {
    console.error('Error fetching Fanbasis integration:', error);
    return null;
  }
}

/**
 * Get a valid Fanbasis access token (with automatic refresh if needed)
 */
export async function getFanbasisToken(teamId: string): Promise<string | null> {
  try {
    const integration = await getFanbasisIntegration(teamId);

    if (!integration || !integration.is_connected) {
      console.error('Fanbasis not connected');
      return null;
    }

    const config = integration.config;
    const expiresAt = new Date(config.expires_at);
    const now = new Date();

    // Refresh if token expires within 24 hours
    const shouldRefresh = (expiresAt.getTime() - now.getTime()) < 24 * 60 * 60 * 1000;

    if (shouldRefresh) {
      console.log('Fanbasis token expiring soon, refreshing...');
      const refreshed = await refreshFanbasisToken(teamId);
      
      if (!refreshed) {
        console.error('Failed to refresh Fanbasis token');
        return null;
      }

      // Fetch updated token
      const updated = await getFanbasisIntegration(teamId);
      return updated?.config?.access_token || null;
    }

    return config.access_token;
  } catch (error) {
    console.error('Error getting Fanbasis token:', error);
    return null;
  }
}

/**
 * Refresh Fanbasis access token
 */
export async function refreshFanbasisToken(teamId: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('Not authenticated');
      return false;
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fanbasis-refresh-token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to refresh Fanbasis token:', data.error);
      
      // If reconnect required, mark as disconnected
      if (data.reconnect_required) {
        console.warn('Fanbasis reconnection required');
      }
      
      return false;
    }

    return data.success || false;
  } catch (error) {
    console.error('Error refreshing Fanbasis token:', error);
    return false;
  }
}

/**
 * Disconnect Fanbasis integration
 */
export async function disconnectFanbasis(teamId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('team_integrations')
      .update({
        is_connected: false,
        config: {
          disconnected_at: new Date().toISOString(),
          disconnect_reason: 'user_requested',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('team_id', teamId)
      .eq('integration_type', 'fanbasis');

    if (error) {
      console.error('Error disconnecting Fanbasis:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error disconnecting Fanbasis:', error);
    return false;
  }
}

/**
 * Make an authenticated request to Fanbasis API
 */
export async function callFanbasisAPI<T = any>(
  teamId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const token = await getFanbasisToken(teamId);

    if (!token) {
      return { error: 'No valid access token available' };
    }

    const fanbasisBaseUrl = import.meta.env.VITE_FANBASIS_BASE_URL || 'https://fanbasis.com';
    const url = `${fanbasisBaseUrl}/api/${endpoint.replace(/^\//, '')}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If 401, try refreshing token once
      if (response.status === 401) {
        const refreshed = await refreshFanbasisToken(teamId);
        
        if (refreshed) {
          // Retry request with new token
          const newToken = await getFanbasisToken(teamId);
          
          if (newToken) {
            const retryResponse = await fetch(url, {
              ...options,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json',
              },
            });

            if (retryResponse.ok) {
              const data = await retryResponse.json();
              return { data };
            }
          }
        }
      }

      const errorText = await response.text();
      return { error: `API request failed: ${response.status} ${errorText}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: String(error) };
  }
}

/**
 * Get creator information from Fanbasis
 */
export async function getFanbasisCreatorInfo(teamId: string) {
  return callFanbasisAPI(teamId, '/me', { method: 'GET' });
}

/**
 * Check if token needs refresh (expires within specified hours)
 */
export function shouldRefreshToken(expiresAt: string, hoursBeforeExpiry: number = 24): boolean {
  const expiresAtDate = new Date(expiresAt);
  const now = new Date();
  const hoursUntilExpiry = (expiresAtDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return hoursUntilExpiry < hoursBeforeExpiry;
}

/**
 * Format token expiration time for display
 */
export function formatTokenExpiry(expiresAt: string): string {
  const expiresAtDate = new Date(expiresAt);
  const now = new Date();
  const msUntilExpiry = expiresAtDate.getTime() - now.getTime();
  
  if (msUntilExpiry < 0) {
    return 'Expired';
  }
  
  const daysUntilExpiry = Math.floor(msUntilExpiry / (1000 * 60 * 60 * 24));
  const hoursUntilExpiry = Math.floor((msUntilExpiry % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (daysUntilExpiry > 0) {
    return `${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`;
  }
  
  return `${hoursUntilExpiry} hour${hoursUntilExpiry > 1 ? 's' : ''}`;
}
