# OAuth Broker

Centralized OAuth token management for MCP servers.

## Features

- ✅ OAuth flows for GitHub, Google
- ✅ Automatic token refresh
- ✅ Secure token storage in Cloudflare KV
- ✅ Multi-user support
- ✅ Simple API for MCP servers

**Note:** Asana integration uses [Asana's official MCP server](https://developers.asana.com/docs/using-asanas-mcp-server) - no OAuth broker needed for Asana.

## Setup

### 1. Create KV Namespace

```bash
cd packages/oauth-broker
wrangler kv namespace create "OAUTH_TOKENS"
wrangler kv namespace create "OAUTH_TOKENS" --preview
```

Update `wrangler.toml` with the namespace IDs.

### 2. Set OAuth Credentials

```bash
# Set secrets (run from packages/oauth-broker directory)
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

### 3. Deploy

```bash
wrangler deploy
```

## API

### Start OAuth Flow

```
GET /auth/{service}?user_id={userId}&scope={scope}
```

Example:
```
GET /auth/google?user_id=YOUR_USER_ID&scope=https://www.googleapis.com/auth/calendar
```

### OAuth Callback

```
GET /callback/{service}?code={code}&state={userId}
```

### Get Token (for MCP servers)

```
POST /token/{service}
Body: { "user_id": "YOUR_USER_ID" }
```

Response:
```json
{
  "access_token": "ya29.xxx",
  "expires_at": 1234567890
}
```

## Usage in MCP Servers

MCP servers call `/token/{service}` to get fresh tokens:

```typescript
const response = await fetch(`${OAUTH_BROKER_URL}/token/google`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: userId }),
});

const { access_token } = await response.json();
// Use access_token for API calls
```

## Supported Services

- `github` - GitHub OAuth
- `google` - Google OAuth (Calendar, Gmail, Drive)
