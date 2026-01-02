# OAuth Broker + MCP Gateway Architecture Explained

## The Problem They Solve

**Without OAuth Broker:**
```
Every MCP server needs its own OAuth app registration
  ↓
Gmail MCP: Register OAuth app with Google
Calendar MCP: Register OAuth app with Google  
Drive MCP: Register OAuth app with Google
Asana MCP: Register OAuth app with Asana
GitHub MCP: Register OAuth app with GitHub
  ↓
Result: 5+ manual OAuth registrations per user
        60+ minutes of setup time
        Non-technical users can't do it
```

**With OAuth Broker:**
```
YOU register OAuth apps once (as developer)
  ↓
Users click "Connect Google" on your interface
  ↓
OAuth broker manages tokens for them
  ↓
MCP servers fetch tokens from broker on-demand
  ↓
Result: 1-click setup per service
        3 minutes total setup time
        Non-technical users can do it
```

---

## OAuth Broker Deep Dive

### What It Does

**Central authentication service that:**
1. Holds YOUR registered OAuth applications (Google, Asana, GitHub, etc.)
2. Handles OAuth flows for users (redirects, callbacks, token exchange)
3. Stores user tokens securely (encrypted in KV storage)
4. Issues temporary tokens to MCP servers when they need to call APIs

### Architecture

```
┌─────────────────────────────────────────────────────┐
│          OAuth Broker (Cloudflare Worker)           │
│         https://auth.yourdomain.com                 │
│                                                      │
│  Routes:                                            │
│  GET  /auth/{service}     - Start OAuth flow       │
│  GET  /callback/{service} - OAuth callback         │
│  POST /token/{service}    - Issue temp token       │
│                                                      │
│  Storage (Cloudflare KV):                           │
│    user_123_google_token: {                         │
│      access_token: "ya29.xxx",                      │
│      refresh_token: "1//xxx",                       │
│      expires_at: 1234567890                         │
│    }                                                 │
└─────────────────────────────────────────────────────┘
```

### Flow Example: User Connects Google

```
Step 1: User clicks "Connect Google Calendar"
  ↓
GET https://auth.yourdomain.com/auth/google?user_id=user_123&scope=calendar
  ↓
Step 2: Broker redirects to Google OAuth
  ↓
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_OAUTH_CLIENT_ID&
  redirect_uri=https://auth.yourdomain.com/callback/google&
  scope=https://www.googleapis.com/auth/calendar&
  state=user_123
  ↓
Step 3: User approves on Google's page
  ↓
Step 4: Google redirects back to broker
  ↓
GET https://auth.yourdomain.com/callback/google?code=4/xxx&state=user_123
  ↓
Step 5: Broker exchanges code for tokens
  ↓
POST https://oauth2.googleapis.com/token
  code: "4/xxx"
  client_id: YOUR_CLIENT_ID
  client_secret: YOUR_CLIENT_SECRET
  ↓
Step 6: Broker stores tokens in KV
  ↓
KV.put("user_123_google_token", {
  access_token: "ya29.xxx",
  refresh_token: "1//xxx",
  expires_at: timestamp
})
  ↓
Step 7: User sees "✓ Google Calendar connected"
```

### MCP Server Uses Token

```
When Calendar MCP needs to create event:
  ↓
POST https://auth.yourdomain.com/token/google
  user_id: "user_123"
  ↓
Broker checks KV for user_123_google_token
  ↓
If expired, refresh it using refresh_token
  ↓
Return temporary token (valid 10 minutes)
  ↓
MCP server uses token to call Google Calendar API
  ↓
POST https://www.googleapis.com/calendar/v3/calendars/.../events
  Authorization: Bearer ya29.xxx
```

### Code Example: OAuth Broker

```javascript
// cloudflare-workers/oauth-broker/index.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Start OAuth flow
    if (url.pathname.startsWith('/auth/')) {
      const service = url.pathname.split('/')[2];
      const userId = url.searchParams.get('user_id');
      
      const config = getOAuthConfig(service);
      const authUrl = new URL(config.authEndpoint);
      authUrl.searchParams.set('client_id', config.clientId);
      authUrl.searchParams.set('redirect_uri', `https://auth.yourdomain.com/callback/${service}`);
      authUrl.searchParams.set('scope', config.scope);
      authUrl.searchParams.set('state', userId);
      authUrl.searchParams.set('response_type', 'code');
      
      return Response.redirect(authUrl.toString());
    }
    
    // Handle OAuth callback
    if (url.pathname.startsWith('/callback/')) {
      const service = url.pathname.split('/')[2];
      const code = url.searchParams.get('code');
      const userId = url.searchParams.get('state');
      
      // Exchange code for tokens
      const config = getOAuthConfig(service);
      const tokenResponse = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: `https://auth.yourdomain.com/callback/${service}`,
          grant_type: 'authorization_code'
        })
      });
      
      const tokens = await tokenResponse.json();
      
      // Store tokens
      await env.KV.put(
        `${userId}_${service}_token`,
        JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + (tokens.expires_in * 1000)
        })
      );
      
      return new Response('Success! You can close this window.', { status: 200 });
    }
    
    // Issue temporary token to MCP server
    if (url.pathname.startsWith('/token/')) {
      const service = url.pathname.split('/')[2];
      const body = await request.json();
      const userId = body.user_id;
      
      // Get stored tokens
      const storedTokens = await env.KV.get(`${userId}_${service}_token`, 'json');
      
      // Refresh if expired
      if (Date.now() > storedTokens.expires_at) {
        const config = getOAuthConfig(service);
        const refreshResponse = await fetch(config.tokenEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            refresh_token: storedTokens.refresh_token,
            client_id: config.clientId,
            client_secret: config.clientSecret,
            grant_type: 'refresh_token'
          })
        });
        
        const newTokens = await refreshResponse.json();
        storedTokens.access_token = newTokens.access_token;
        storedTokens.expires_at = Date.now() + (newTokens.expires_in * 1000);
        
        await env.KV.put(`${userId}_${service}_token`, JSON.stringify(storedTokens));
      }
      
      return new Response(JSON.stringify({
        access_token: storedTokens.access_token,
        expires_at: storedTokens.expires_at
      }));
    }
  }
};

function getOAuthConfig(service) {
  const configs = {
    google: {
      authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly'
    },
    github: {
      authEndpoint: 'https://github.com/login/oauth/authorize',
      tokenEndpoint: 'https://github.com/login/oauth/access_token',
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      scope: 'repo user'
    }
  };
  
  return configs[service];
}
```

---

## MCP Gateway Deep Dive

### What It Does

**Routing layer that:**
1. Receives MCP requests from remote clients (voice app, mobile)
2. Routes to appropriate MCP server
3. Translates between Streamable HTTP (remote) and stdio/HTTP (local MCP servers)
4. Provides unified endpoint for all MCP operations

### Architecture

```
┌─────────────────────────────────────────────────────┐
│          MCP Gateway (Cloudflare Worker)            │
│         https://mcp.yourdomain.com/sse              │
│                                                      │
│  Receives: Streamable HTTP MCP requests             │
│  Routes to: Individual MCP server workers           │
│  Returns: Streamable HTTP MCP responses             │
└─────────────────────────────────────────────────────┘
                    ↓
        ┌───────────┼───────────┐
        ↓           ↓           ↓
  ┌─────────┐ ┌─────────┐ ┌─────────┐
  │ GitHub  │ │ Gmail   │ │Calendar │
  │   MCP   │ │  MCP    │ │  MCP    │
  │ Worker  │ │ Worker  │ │ Worker  │
  └─────────┘ └─────────┘ └─────────┘
```

### Flow Example: Voice → Create GitHub Issue

```
Voice app (SystemPrompt.io)
  ↓
"Create GitHub issue in household-coo: Email parser broken"
  ↓
POST https://mcp.yourdomain.com/sse
  Content-Type: application/json
  Body: {
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "create_issue",
      "arguments": {
        "repo": "jleacox/household-coo",
        "title": "Email parser broken",
        "body": "Reported via voice"
      }
    },
    "id": 1
  }
  ↓
MCP Gateway receives request
  ↓
Determines this is for GitHub MCP server
  ↓
Routes to GitHub MCP Worker
  ↓
GitHub MCP Worker:
  1. Fetches OAuth token from broker
  2. Calls GitHub API
  3. Returns MCP response
  ↓
MCP Gateway forwards response
  ↓
Voice app receives:
  {
    "jsonrpc": "2.0",
    "result": {
      "content": [{
        "type": "text",
        "text": "Created issue #23: https://github.com/jleacox/household-coo/issues/23"
      }]
    },
    "id": 1
  }
  ↓
Voice responds: "Created issue #23"
```

### Code Example: MCP Gateway

```javascript
// cloudflare-workers/mcp-gateway/index.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/mcp/sse') {
      // Parse MCP request
      const mcpRequest = await request.json();
      
      // Determine which server to route to
      const server = determineServer(mcpRequest);
      
      // Route to appropriate worker
      switch(server) {
        case 'github':
          return env.GITHUB_MCP.fetch(request);
        case 'gmail':
          return env.GMAIL_MCP.fetch(request);
        case 'calendar':
          return env.CALENDAR_MCP.fetch(request);
        default:
          return new Response(JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32601, message: "Server not found" },
            id: mcpRequest.id
          }), { status: 404 });
      }
    }
    
    return new Response('Not found', { status: 404 });
  }
};

function determineServer(mcpRequest) {
  // Route based on tool name prefix or method
  if (mcpRequest.method === 'tools/list') {
    return 'all'; // Return combined tool list
  }
  
  if (mcpRequest.method === 'tools/call') {
    const toolName = mcpRequest.params.name;
    
    if (toolName.startsWith('github_') || toolName.includes('issue') || toolName.includes('pr')) {
      return 'github';
    }
    if (toolName.includes('email') || toolName.includes('gmail')) {
      return 'gmail';
    }
    if (toolName.includes('calendar') || toolName.includes('event')) {
      return 'calendar';
    }
  }
  
  return null;
}
```

---

## Key Differences

### OAuth Broker vs Direct OAuth

**Direct OAuth (what you have now):**
```
Each MCP server has hardcoded tokens
  ↓
process.env.GITHUB_TOKEN
process.env.GOOGLE_TOKEN
  ↓
Problem: Tokens expire, can't easily support multiple users
```

**OAuth Broker (scalable):**
```
MCP servers fetch tokens dynamically
  ↓
fetch('https://auth.yourdomain.com/token/github')
  ↓
Supports multiple users, auto-refresh, revocation
```

### MCP Gateway vs Direct Server Access

**Direct Server Access (local only):**
```
Claude Desktop → stdio → MCP server on localhost
  ↓
Works great locally
Can't access from phone/voice
```

**MCP Gateway (remote + local):**
```
Voice app → HTTPS → Gateway → MCP Worker
          ↓
Same MCP servers, different transport
Works from anywhere
```

---

## Why Both Are Needed

**OAuth Broker:** Solves authentication for non-technical users
**MCP Gateway:** Solves remote access for voice/mobile

**Together:**
```
User clicks "Connect Google" (OAuth Broker handles it)
  ↓
User says "Add calendar event tomorrow at 2pm" (MCP Gateway routes it)
  ↓
Calendar MCP fetches token from OAuth Broker
  ↓
Creates event using Google Calendar API
  ↓
Voice responds "Event created"
```

**Without them:**
```
User manually registers OAuth app (can't do it)
  ↓
User can only use Claude Desktop on laptop (not mobile)
```

---

## Deployment

```bash
# OAuth Broker
cd cloudflare-workers/oauth-broker
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler deploy

# MCP Gateway  
cd cloudflare-workers/mcp-gateway
wrangler deploy

# Bind MCP servers as service bindings
wrangler.toml:
[[services]]
binding = "GITHUB_MCP"
service = "github-mcp-worker"

[[services]]
binding = "GMAIL_MCP"
service = "gmail-mcp-worker"
```

---

## For Your Use Case

**Local development (Cursor, Claude Desktop):**
- Don't need OAuth broker (use env vars)
- Don't need MCP gateway (use stdio)

**Remote access (Voice app):**
- Need OAuth broker (multi-user auth)
- Need MCP gateway (remote routing)

**Recommendation:**
Build local-first, add broker + gateway when you want voice access.
