/**
 * Gmail API client using REST API (Cloudflare Workers compatible)
 * Uses fetch instead of googleapis package
 * 
 * Authentication priority:
 * 1. OAuth broker (recommended) - No local credentials needed!
 * 2. Direct access token (temporary fallback for local dev)
 * 
 * Note: OAuth broker handles refresh tokens automatically, so you don't need
 * to store client_id, client_secret, or refresh_token locally.
 */

export interface GmailConfig {
  accessToken?: string;
  oauthBrokerUrl?: string;
  userId?: string;
  anthropicApiKey?: string; // For date extraction with Claude API
}

/**
 * Get access token from OAuth broker or direct token
 * 
 * OAuth broker is recommended - it handles refresh tokens automatically
 * and stores credentials securely in Cloudflare KV (not in local files).
 */
export async function getAccessToken(
  config: GmailConfig
): Promise<string | undefined> {
  const tokenId = crypto.randomUUID();
  console.log(`\n[GMAIL-TOKEN-${tokenId}] ========== GETTING GMAIL TOKEN ==========`);
  console.log(`[GMAIL-TOKEN-${tokenId}] Config:`, {
    oauthBrokerUrl: config.oauthBrokerUrl || 'not set',
    userId: config.userId || 'not set',
    hasAccessToken: !!config.accessToken,
  });
  
  // Priority 1: OAuth broker (recommended - no local credentials needed!)
  if (config.oauthBrokerUrl && config.userId) {
    console.log(`[GMAIL-TOKEN-${tokenId}] 🔐 Fetching token from OAuth broker...`);
    console.log(`[GMAIL-TOKEN-${tokenId}] Broker URL: ${config.oauthBrokerUrl}/token/google`);
    console.log(`[GMAIL-TOKEN-${tokenId}] User ID: ${config.userId}`);
    
    try {
      const tokenStart = Date.now();
      const response = await fetch(`${config.oauthBrokerUrl}/token/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: config.userId }),
      });
      const tokenDuration = Date.now() - tokenStart;
      
      console.log(`[GMAIL-TOKEN-${tokenId}] Broker response: ${response.status} in ${tokenDuration}ms`);

      if (response.ok) {
        const data = await response.json();
        if (data.access_token) {
          console.log(`[GMAIL-TOKEN-${tokenId}] ✅ Token received (length: ${data.access_token.length})`);
          console.log(`[GMAIL-TOKEN-${tokenId}] Token expires_at: ${data.expires_at ? new Date(data.expires_at).toISOString() : 'unknown'}`);
          console.log(`[GMAIL-TOKEN-${tokenId}] ========== END GET TOKEN ==========\n`);
          return data.access_token;
        } else {
          console.error(`[GMAIL-TOKEN-${tokenId}] ❌ No access_token in response:`, JSON.stringify(data));
        }
      } else {
        const errorText = await response.text();
        console.error(`[GMAIL-TOKEN-${tokenId}] ❌ OAuth broker error ${response.status}: ${errorText}`);
        // Fall through to direct token for local dev
      }
    } catch (error: any) {
      console.error(`[GMAIL-TOKEN-${tokenId}] ❌ Failed to fetch token from broker:`, error.message, error.stack);
      // Fall through to direct token for local dev
    }
  } else {
    console.log(`[GMAIL-TOKEN-${tokenId}] ℹ️ OAuth broker not configured, checking direct token...`);
  }

  // Priority 2: Direct access token (temporary fallback for local dev)
  // Note: This requires manual token refresh. Use OAuth broker for production!
  if (config.accessToken) {
    console.log(`[GMAIL-TOKEN-${tokenId}] ✅ Using direct access token (length: ${config.accessToken.length})`);
    console.log(`[GMAIL-TOKEN-${tokenId}] ========== END GET TOKEN ==========\n`);
    return config.accessToken;
  }
  
  const envToken = typeof process !== 'undefined' ? process.env.GOOGLE_ACCESS_TOKEN : undefined;
  if (envToken) {
    console.log(`[GMAIL-TOKEN-${tokenId}] ✅ Using GOOGLE_ACCESS_TOKEN from env (length: ${envToken.length})`);
    console.log(`[GMAIL-TOKEN-${tokenId}] ========== END GET TOKEN ==========\n`);
    return envToken;
  }
  
  console.error(`[GMAIL-TOKEN-${tokenId}] ❌ No token available!`);
  console.log(`[GMAIL-TOKEN-${tokenId}] ========== END GET TOKEN (ERROR) ==========\n`);
  return undefined;
}

/**
 * Make authenticated request to Gmail API
 */
export async function gmailRequest(
  endpoint: string,
  config: GmailConfig,
  options: RequestInit = {}
): Promise<any> {
  const requestId = crypto.randomUUID();
  console.log(`\n[GMAIL-API-${requestId}] ========== GMAIL API REQUEST ==========`);
  console.log(`[GMAIL-API-${requestId}] Endpoint: ${endpoint}`);
  console.log(`[GMAIL-API-${requestId}] Method: ${options.method || 'GET'}`);
  
  const tokenStart = Date.now();
  const token = await getAccessToken(config);
  const tokenDuration = Date.now() - tokenStart;

  if (!token) {
    console.error(`[GMAIL-API-${requestId}] ❌ No token available after ${tokenDuration}ms`);
    console.log(`[GMAIL-API-${requestId}] ========== END API REQUEST (ERROR) ==========\n`);
    throw new Error('No Gmail access token available. Configure OAuth broker (recommended) or set GOOGLE_ACCESS_TOKEN for local dev.');
  }

  console.log(`[GMAIL-API-${requestId}] ✅ Token obtained in ${tokenDuration}ms`);
  const url = `https://www.googleapis.com/gmail/v1${endpoint}`;
  console.log(`[GMAIL-API-${requestId}] 🌐 Making request to: ${url}`);
  console.log(`[GMAIL-API-${requestId}] Request body size: ${options.body ? (typeof options.body === 'string' ? options.body.length : 'unknown') : 'none'}`);
  
  const apiStart = Date.now();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const apiDuration = Date.now() - apiStart;
  
  console.log(`[GMAIL-API-${requestId}] Response: ${response.status} ${response.statusText} in ${apiDuration}ms`);

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText || response.statusText };
    }
    
    console.error(`[GMAIL-API-${requestId}] ❌ Gmail API error:`);
    console.error(`[GMAIL-API-${requestId}]   Status: ${response.status}`);
    console.error(`[GMAIL-API-${requestId}]   Error:`, JSON.stringify(errorData, null, 2));
    console.log(`[GMAIL-API-${requestId}] ========== END API REQUEST (ERROR) ==========\n`);
    
    const error: any = new Error(`Gmail API error: ${response.status} ${errorData.error?.message || errorData.message || response.statusText}`);
    error.status = response.status;
    error.response = errorData;
    throw error;
  }

  const result = await response.json();
  console.log(`[GMAIL-API-${requestId}] ✅ Request successful`);
  console.log(`[GMAIL-API-${requestId}] Result keys:`, Object.keys(result).join(', '));
  console.log(`[GMAIL-API-${requestId}] ========== END API REQUEST ==========\n`);
  return result;
}

/**
 * Get attachment data from Gmail API
 * Returns base64url-encoded attachment data
 */
export async function getAttachment(
  messageId: string,
  attachmentId: string,
  config: GmailConfig
): Promise<{ data: string; size: number }> {
  const token = await getAccessToken(config);

  if (!token) {
    throw new Error('No Gmail access token available. Configure OAuth broker (recommended) or set GOOGLE_ACCESS_TOKEN for local dev.');
  }

  const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
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
    
    const error: any = new Error(`Gmail API error: ${response.status} ${errorData.error?.message || errorData.message || response.statusText}`);
    error.status = response.status;
    error.response = errorData;
    throw error;
  }

  const data = await response.json();
  return {
    data: data.data, // base64url-encoded
    size: data.size || 0,
  };
}

