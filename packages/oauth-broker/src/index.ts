/**
 * OAuth Broker - Centralized token management for MCP servers
 * 
 * Handles OAuth flows and token storage for:
 * - GitHub
 * - Google (Calendar, Gmail, Drive)
 * - Future services
 * 
 * Routes:
 * - GET  /auth/{service}     - Start OAuth flow
 * - GET  /callback/{service} - OAuth callback
 * - POST /token/{service}    - Issue temporary token to MCP servers
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

export interface Env {
  // OAuth credentials (set via wrangler secret put)
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  
  // KV Namespace
  OAUTH_TOKENS: KVNamespace;
}

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

interface StoredTokens {
  access_token: string;
  refresh_token: string | null;
  expires_at: number;
  scope?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Log all incoming requests
app.use('*', async (c, next) => {
  console.log(`[BROKER] 🔔 Incoming request: ${c.req.method} ${c.req.path}`);
  console.log(`[BROKER] Full URL: ${c.req.url}`);
  console.log(`[BROKER] Headers:`, Object.fromEntries(c.req.raw.headers.entries()));
  await next();
});

// CORS middleware
app.use('*', cors({
  origin: '*', // Adjust for production
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'healthy', service: 'oauth-broker' });
});

// Start OAuth flow
app.get('/auth/:service', async (c) => {
  const service = c.req.param('service');
  const userId = c.req.query('user_id');
  const scope = c.req.query('scope') || getDefaultScope(service);
  
  if (!userId) {
    return c.json({ error: 'user_id is required' }, 400);
  }
  
  const config = getOAuthConfig(service, c.env);
  if (!config) {
    return c.json({ error: `Unsupported service: ${service}` }, 400);
  }
  
  // Build OAuth authorization URL
  const authUrl = new URL(config.authEndpoint);
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', `${getBaseUrl(c.req.url)}/callback/${service}`);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', userId);
  authUrl.searchParams.set('response_type', 'code');
  
  // Google-specific parameters for refresh tokens
  if (service === 'google') {
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
  }
  
  return c.redirect(authUrl.toString());
});

// OAuth callback
app.get('/callback/:service', async (c) => {
  const service = c.req.param('service');
  const code = c.req.query('code');
  const userId = c.req.query('state');
  const error = c.req.query('error');
  
  if (error) {
    return c.text(`OAuth error: ${error}`, 400);
  }
  
  if (!code || !userId) {
    return c.text('Missing code or state parameter', 400);
  }
  
  const config = getOAuthConfig(service, c.env);
  if (!config) {
    return c.text(`Unsupported service: ${service}`, 400);
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: `${getBaseUrl(c.req.url)}/callback/${service}`,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return c.text(`Token exchange failed: ${errorText}`, 500);
    }
    
    const tokens = await tokenResponse.json() as OAuthTokenResponse;
    
    // Store tokens in KV
    const tokenKey = `${userId}_${service}_token`;
    
    // GitHub OAuth Apps don't provide expires_in or refresh_token
    // Tokens are long-lived until revoked
    // Set expiration to 1 year from now for GitHub, or use expires_in for other services
    let expiresAt: number;
    if (service === 'github') {
      // GitHub tokens don't expire, but set a far future date for storage
      expiresAt = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 year
    } else {
      expiresAt = Date.now() + (tokens.expires_in ? tokens.expires_in * 1000 : 3600 * 1000);
    }
    
    await c.env.OAUTH_TOKENS.put(tokenKey, JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: expiresAt,
      scope: tokens.scope,
    }));
    
    return c.text('✓ Successfully connected! You can close this window.');
  } catch (error: any) {
    return c.text(`Error: ${error.message}`, 500);
  }
});

// Issue temporary token to MCP servers
app.post('/token/:service', async (c) => {
  const service = c.req.param('service');
  console.log(`[BROKER] POST /token/${service} - Request received`);
  console.log(`[BROKER] Request URL: ${c.req.url}`);
  console.log(`[BROKER] Request method: ${c.req.method}`);
  console.log(`[BROKER] Request headers:`, Object.fromEntries(c.req.raw.headers.entries()));
  
  let body: any = {};
  try {
    body = await c.req.json();
    console.log(`[BROKER] Request body:`, body);
  } catch (error: any) {
    console.error(`[BROKER] Failed to parse request body:`, error.message);
  }
  
  const userId = body.user_id;
  console.log(`[BROKER] Extracted userId: ${userId}`);
  
  if (!userId) {
    console.error(`[BROKER] ❌ Missing user_id in request`);
    return c.json({ error: 'user_id is required' }, 400);
  }
  
  const tokenKey = `${userId}_${service}_token`;
  console.log(`[BROKER] Looking up token key: ${tokenKey}`);
  const storedTokens = await c.env.OAUTH_TOKENS.get(tokenKey, 'json') as StoredTokens | null;
  console.log(`[BROKER] Stored tokens found: ${!!storedTokens}`);
  
  if (!storedTokens) {
    console.error(`[BROKER] ❌ No tokens found for key: ${tokenKey}`);
    return c.json({ error: 'No tokens found. Please connect your account first.' }, 404);
  }
  
  // Refresh token if expired, or always refresh for Google to ensure scopes are up-to-date
  // GitHub OAuth Apps don't have refresh tokens, so skip refresh for GitHub
  if (service !== 'github') {
    // Always refresh Google tokens to ensure we have the latest scopes
    // For other services, only refresh if expired
    const shouldRefresh = service === 'google' || Date.now() >= storedTokens.expires_at;
    
    if (shouldRefresh) {
      const config = getOAuthConfig(service, c.env);
      if (!config || !storedTokens.refresh_token) {
        return c.json({ error: 'Token expired and cannot be refreshed' }, 401);
      }
      
      try {
        const refreshResponse = await fetch(config.tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: new URLSearchParams({
            refresh_token: storedTokens.refresh_token,
            client_id: config.clientId,
            client_secret: config.clientSecret,
            grant_type: 'refresh_token',
          }),
        });
        
        if (!refreshResponse.ok) {
          return c.json({ error: 'Failed to refresh token' }, 500);
        }
        
        const newTokens = await refreshResponse.json() as OAuthTokenResponse;
        storedTokens.access_token = newTokens.access_token;
        storedTokens.expires_at = Date.now() + (newTokens.expires_in ? newTokens.expires_in * 1000 : 3600 * 1000);
        
        // Update stored tokens
        await c.env.OAUTH_TOKENS.put(tokenKey, JSON.stringify(storedTokens));
      } catch (error: any) {
        return c.json({ error: `Token refresh failed: ${error.message}` }, 500);
      }
    }
  }
  
  // Return temporary token (valid for 10 minutes)
  return c.json({
    access_token: storedTokens.access_token,
    expires_at: storedTokens.expires_at,
  });
});

// Helper functions
function getOAuthConfig(service: string, env: Env) {
  const configs: Record<string, any> = {
    github: {
      authEndpoint: 'https://github.com/login/oauth/authorize',
      tokenEndpoint: 'https://github.com/login/oauth/access_token',
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    google: {
      authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }
  };
  
  const config = configs[service];
  if (!config || !config.clientId || !config.clientSecret) {
    return null;
  }
  
  return config;
}

function getDefaultScope(service: string): string {
  const scopes: Record<string, string> = {
    github: 'repo user',
    google: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly'
  };
  
  return scopes[service] || '';
}

function getBaseUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  return `${url.protocol}//${url.host}`;
}

// Catch-all route for debugging (must be last)
app.all('*', async (c) => {
  console.log(`[BROKER] ⚠️ Unmatched route: ${c.req.method} ${c.req.path}`);
  console.log(`[BROKER] Full URL: ${c.req.url}`);
  console.log(`[BROKER] Headers:`, Object.fromEntries(c.req.raw.headers.entries()));
  return c.json({ error: `Route not found: ${c.req.method} ${c.req.path}` }, 404);
});

export default app;

