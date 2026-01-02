/**
 * Google Calendar API client using REST API (Cloudflare Workers compatible)
 * Uses fetch instead of googleapis package
 * 
 * Authentication priority:
 * 1. OAuth broker (recommended) - No local credentials needed!
 * 2. Direct access token (temporary fallback for local dev)
 * 
 * Note: OAuth broker handles refresh tokens automatically, so you don't need
 * to store client_id, client_secret, or refresh_token locally.
 */

export interface CalendarConfig {
  accessToken?: string;
  oauthBrokerUrl?: string;
  userId?: string;
}

/**
 * Get access token from OAuth broker or direct token
 * 
 * OAuth broker is recommended - it handles refresh tokens automatically
 * and stores credentials securely in Cloudflare KV (not in local files).
 */
async function getAccessToken(
  config: CalendarConfig
): Promise<string | undefined> {
  // Priority 1: OAuth broker (recommended - no local credentials needed!)
  if (config.oauthBrokerUrl && config.userId) {
    try {
      const response = await fetch(`${config.oauthBrokerUrl}/token/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: config.userId }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.access_token;
      } else {
        console.error(`OAuth broker error: ${response.status} ${response.statusText}`);
        // Fall through to direct token for local dev
      }
    } catch (error) {
      console.error('Failed to fetch token from OAuth broker:', error);
      // Fall through to direct token for local dev
    }
  }

  // Priority 2: Direct access token (temporary fallback for local dev)
  // Note: This requires manual token refresh. Use OAuth broker for production!
  return config.accessToken || (typeof process !== 'undefined' ? process.env.GOOGLE_ACCESS_TOKEN : undefined);
}

/**
 * Make authenticated request to Google Calendar API
 */
export async function calendarRequest(
  endpoint: string,
  config: CalendarConfig,
  options: RequestInit = {}
): Promise<any> {
  const token = await getAccessToken(config);

  if (!token) {
    throw new Error('No Google Calendar access token available. Configure OAuth broker (recommended) or set GOOGLE_ACCESS_TOKEN for local dev.');
  }

  const url = `https://www.googleapis.com/calendar/v3${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText || response.statusText };
    }
    
    const error: any = new Error(`Google Calendar API error: ${response.status} ${errorData.error?.message || errorData.message || response.statusText}`);
    error.status = response.status;
    error.response = errorData;
    throw error;
  }

  return response.json();
}

