# OAuth Broker Setup for GitHub MCP

## Why OAuth Broker Instead of PAT?

**PAT (Personal Access Token) Problems:**
- ❌ Manual token creation in GitHub settings
- ❌ Tokens expire and need manual refresh
- ❌ Hard to manage multiple users
- ❌ Security risk if tokens are committed

**OAuth Broker Benefits:**
- ✅ One-click "Connect GitHub" button
- ✅ Automatic token refresh
- ✅ Supports multiple users
- ✅ Centralized token management
- ✅ Easy revocation

## Quick Setup Options

### Option 1: Use OAuth Broker (Recommended)

**Cursor Configuration:**
```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-github/dist/index.js"],
      "env": {
        "OAUTH_BROKER_URL": "https://auth.yourdomain.com",
        "USER_ID": "your-user-id"
      }
    }
  }
}
```

**How it works:**
1. MCP server calls `POST https://auth.yourdomain.com/token/github` with `{ user_id: "your-user-id" }`
2. OAuth broker returns fresh token (auto-refreshes if expired)
3. MCP server uses token for GitHub API calls

### Option 2: Direct Token (Fallback)

**For local development only:**
```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-github/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    }
  }
}
```

**Priority order:**
1. OAuth broker (if `OAUTH_BROKER_URL` and `USER_ID` are set)
2. Direct `GITHUB_TOKEN` environment variable
3. Error if neither is available

## OAuth Broker Implementation

The MCP server automatically:
- Checks for `OAUTH_BROKER_URL` and `USER_ID` environment variables
- If present, fetches token from broker before each API call
- Falls back to `GITHUB_TOKEN` if broker is not configured
- Handles broker errors gracefully (falls back to direct token)

## Next Steps

1. **Build OAuth broker** (see `packages/oauth-broker/` when created)
2. **Deploy broker** to Cloudflare Workers
3. **Connect your GitHub account** via broker UI
4. **Configure Cursor** with `OAUTH_BROKER_URL` and `USER_ID`
5. **No more PATs needed!**

## For Now (Temporary)

If you want to use it immediately without OAuth broker:

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-github/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your-github-pat-here"
      }
    }
  }
}
```

But the code is ready for OAuth broker - just add the env vars when broker is ready!

