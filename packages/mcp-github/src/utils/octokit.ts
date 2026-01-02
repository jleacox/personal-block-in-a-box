/**
 * Octokit client setup
 * Cloudflare Workers compatible - uses Web APIs only
 * Supports OAuth broker pattern for token management
 */

import { Octokit } from '@octokit/rest';
import type { Fetcher } from '@cloudflare/workers-types';

export interface OctokitConfig {
  auth?: string;
  baseUrl?: string;
  oauthBrokerUrl?: string;
  userId?: string;
}

/**
 * Fetch token from OAuth broker
 * Falls back to direct token if broker not configured
 * Supports both Service Bindings (preferred) and HTTP fetch (fallback)
 */
async function getAuthToken(
  oauthBrokerUrl?: string,
  userId?: string,
  directToken?: string,
  env?: { OAUTH_BROKER?: Fetcher }
): Promise<string | undefined> {
  console.log(`[getAuthToken] Starting token fetch...`);
  console.log(`[getAuthToken] Config:`, {
    oauthBrokerUrl: oauthBrokerUrl || 'not set',
    userId: userId || 'not set',
    hasDirectToken: !!directToken,
    hasServiceBinding: !!env?.OAUTH_BROKER,
  });
  
  // If OAuth broker is configured, fetch token from broker
  if (userId) {
    // Try Service Binding first (preferred - faster, no billing)
    if (env?.OAUTH_BROKER) {
      try {
        const requestBody = JSON.stringify({ user_id: userId });
        console.log(`[getAuthToken] Using Service Binding to fetch token`);
        console.log(`[getAuthToken] Request body: ${requestBody}`);
        
        // Service binding: URL doesn't matter, path does
        const response = await env.OAUTH_BROKER.fetch(
          new Request('https://example.com/token/github', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: requestBody,
          })
        );

        console.log(`[getAuthToken] Broker response status: ${response.status} ${response.statusText}`);
        
        const responseText = await response.text();
        console.log(`[getAuthToken] Broker response body: ${responseText}`);
        
        if (response.ok) {
          try {
            const data = JSON.parse(responseText) as { access_token?: string; expires_at?: number };
            if (data.access_token) {
              console.log(`[getAuthToken] ✅ Token received via Service Binding (length: ${data.access_token.length}, expires_at: ${data.expires_at})`);
              return data.access_token;
            } else {
              console.error(`[getAuthToken] ❌ No access_token in response:`, data);
            }
          } catch (parseError: any) {
            console.error(`[getAuthToken] ❌ Failed to parse broker response as JSON:`, parseError.message);
            console.error(`[getAuthToken] Response text was: ${responseText}`);
          }
        } else {
          console.error(`[getAuthToken] ❌ OAuth broker error: ${response.status} ${response.statusText}`);
          console.error(`[getAuthToken] Error response body: ${responseText}`);
          // Fall back to HTTP fetch if service binding fails
        }
      } catch (error: any) {
        console.error(`[getAuthToken] ❌ Failed to fetch token via Service Binding:`, error.message);
        console.error(`[getAuthToken] Error stack:`, error.stack);
        // Fall back to HTTP fetch if service binding fails
      }
    }
    
    // Fallback to HTTP fetch if service binding not available or failed
    if (oauthBrokerUrl) {
      try {
        const brokerUrl = `${oauthBrokerUrl}/token/github`;
        const requestBody = JSON.stringify({ user_id: userId });
        console.log(`[getAuthToken] Using HTTP fetch to broker: ${brokerUrl}`);
        console.log(`[getAuthToken] Request body: ${requestBody}`);
        
        const response = await fetch(brokerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
        });

        console.log(`[getAuthToken] Broker response status: ${response.status} ${response.statusText}`);
        console.log(`[getAuthToken] Broker response headers:`, Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log(`[getAuthToken] Broker response body: ${responseText}`);
        
        if (response.ok) {
          try {
            const data = JSON.parse(responseText) as { access_token?: string; expires_at?: number };
            if (data.access_token) {
              console.log(`[getAuthToken] ✅ Token received via HTTP fetch (length: ${data.access_token.length}, expires_at: ${data.expires_at})`);
              return data.access_token;
            } else {
              console.error(`[getAuthToken] ❌ No access_token in response:`, data);
            }
          } catch (parseError: any) {
            console.error(`[getAuthToken] ❌ Failed to parse broker response as JSON:`, parseError.message);
            console.error(`[getAuthToken] Response text was: ${responseText}`);
          }
        } else {
          console.error(`[getAuthToken] ❌ OAuth broker error: ${response.status} ${response.statusText}`);
          console.error(`[getAuthToken] Error response body: ${responseText}`);
          // Fall back to direct token if broker fails
        }
      } catch (error: any) {
        console.error(`[getAuthToken] ❌ Failed to fetch token from OAuth broker:`, error.message);
        console.error(`[getAuthToken] Error stack:`, error.stack);
        // Fall back to direct token if broker unavailable
      }
    }
  } else {
    console.log(`[getAuthToken] OAuth broker not configured (no userId), using direct token`);
  }

  // Fall back to direct token (PAT or env var)
  const fallbackToken = directToken || process.env.GITHUB_TOKEN;
  if (fallbackToken) {
    console.log(`[getAuthToken] ✅ Using direct token (length: ${fallbackToken.length})`);
  } else {
    console.error(`[getAuthToken] ❌ No token available (no broker config, no direct token)`);
  }
  return fallbackToken;
}

/**
 * Create an Octokit client instance
 * Compatible with both Node.js (local) and Cloudflare Workers
 * Supports OAuth broker pattern (Service Binding or HTTP fetch)
 */
export async function createOctokit(
  config: OctokitConfig = {},
  env?: { OAUTH_BROKER?: Fetcher }
): Promise<Octokit> {
  const { auth, baseUrl, oauthBrokerUrl, userId } = config;

  // Get token (from broker via Service Binding or HTTP, or direct)
  const token = await getAuthToken(oauthBrokerUrl, userId, auth, env);
  
  if (!token) {
    console.error(`[createOctokit] ❌ No token available - Octokit will be unauthenticated`);
    throw new Error('No GitHub token available. Configure OAuth broker or set GITHUB_TOKEN.');
  }

  console.log(`[createOctokit] ✅ Creating Octokit with token (length: ${token.length})`);
  return new Octokit({
    auth: token,
    baseUrl: baseUrl || process.env.GITHUB_API_URL,
    // Cloudflare Workers compatible - uses fetch internally
  });
}

/**
 * Get Octokit client from environment, config, or OAuth broker
 * 
 * Priority:
 * 1. OAuth broker via Service Binding (if env.OAUTH_BROKER is set)
 * 2. OAuth broker via HTTP fetch (if OAUTH_BROKER_URL and USER_ID are set)
 * 3. Direct auth parameter
 * 4. GITHUB_TOKEN environment variable
 */
export async function getOctokit(
  auth?: string,
  oauthBrokerUrl?: string,
  userId?: string,
  env?: { OAUTH_BROKER?: Fetcher }
): Promise<Octokit> {
  return createOctokit(
    {
      auth,
      oauthBrokerUrl: oauthBrokerUrl || process.env.OAUTH_BROKER_URL,
      userId: userId || process.env.USER_ID,
    },
    env
  );
}

/**
 * Synchronous version for backwards compatibility
 * Note: This will use direct token only (no OAuth broker)
 * Use getOctokit() for OAuth broker support
 */
export function getOctokitSync(auth?: string): Octokit {
  return new Octokit({
    auth: auth || process.env.GITHUB_TOKEN,
    baseUrl: process.env.GITHUB_API_URL,
  });
}

