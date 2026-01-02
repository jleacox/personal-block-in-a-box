# OAuth Broker Architecture

## Overview

The OAuth broker provides central token management for all MCP servers, eliminating the need for individual OAuth app registrations per server and enabling multi-user support.

## How It Works

✅ **GitHub MCP supports both PAT and OAuth broker simultaneously!**

The code automatically:
1. **First**: Checks for `OAUTH_BROKER_URL` and `USER_ID` environment variables
   - If present → Fetches token from OAuth broker before each API call
   - If broker fails → Falls back to PAT automatically
2. **Fallback**: Uses `GITHUB_TOKEN` (PAT) if broker not configured or unavailable
3. **Error**: Only if neither is available

**You can use both at the same time!** The broker is tried first, PAT is the safety net.

## Architecture

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

## Token Fetching Flow

```
Tool Call → MCP Server
  ↓
Check: OAUTH_BROKER_URL set?
  ↓ YES
POST /token/github { user_id: "user" }
  ↓
Broker checks KV for user_github_token
  ↓
If expired, refresh it using refresh_token
  ↓
Return temporary token (valid 10 minutes)
  ↓
MCP server uses token to call GitHub API
  ↓
Return result

  ↓ NO (fallback)
Use GITHUB_TOKEN from env
  ↓
Use token for GitHub API call
  ↓
Return result
```

## Configuration

### With OAuth Broker (No PAT needed!)

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-github/dist/index.js"],
      "env": {
        "OAUTH_BROKER_URL": "https://auth.yourdomain.com",
        "USER_ID": "YOUR_USER_ID"
      }
    }
  }
}
```

**What happens:**
- MCP server calls `POST https://auth.yourdomain.com/token/github` with `{ user_id: "YOUR_USER_ID" }`
- Broker returns fresh token (auto-refreshes if expired)
- MCP uses token for GitHub API
- **No PAT needed!**

### Without OAuth Broker (Temporary PAT)

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-github/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

**What happens:**
- MCP server uses `GITHUB_TOKEN` directly
- Works immediately, but you manage token expiration manually

## Benefits

1. **No PAT management** - Broker handles tokens
2. **Auto-refresh** - Tokens refresh automatically
3. **Multi-user ready** - Just change `USER_ID`
4. **Secure** - Tokens stored in Cloudflare KV, not in code
5. **Easy revocation** - Revoke in broker UI, not GitHub settings
6. **Single OAuth app** - One registration per service (not per server)

## Implementation Status

- ✅ GitHub MCP code ready for OAuth broker
- ⏳ OAuth broker implementation (`packages/oauth-broker/`) - Next step
- ⏳ Gateway integration (after broker)

You can use PAT temporarily, but the code is ready to switch to OAuth broker as soon as it's built!

## Next Steps

1. **Build OAuth broker** (`packages/oauth-broker/`)
2. **Deploy to Cloudflare Workers**
3. **Register GitHub OAuth app** (one-time, as developer)
4. **Connect your account** via broker UI
5. **Update Cursor config** with `OAUTH_BROKER_URL` and `USER_ID`
6. **Done!** No more PATs

See [`../setup/OAUTH_SETUP.md`](../setup/OAUTH_SETUP.md) for detailed setup instructions.
