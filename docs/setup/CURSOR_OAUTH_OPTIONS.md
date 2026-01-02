# OAuth Options for Cursor (Local Development)

## Quick Answer

**Yes, you can use OAuth broker from Cursor!** The OAuth broker runs on Cloudflare Workers, but Cursor can call it via HTTP just like any other service.

## Two Approaches

### Option 1: OAuth Broker (Recommended for Consistency)

**How it works:**
- OAuth broker is deployed to Cloudflare Workers (one-time setup)
- Cursor MCP server makes HTTP requests to the broker URL
- Broker handles token storage and refresh automatically
- **Same setup works for both Cursor (local) and Cloudflare Workers (remote)**

**Configuration:**
```json
{
  "mcpServers": {
    "google-calendar": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-calendar/dist/index.js"],
      "env": {
        "OAUTH_BROKER_URL": "https://auth.yourdomain.com",
        "USER_ID": "YOUR_USER_ID"
      }
    }
  }
}
```

**Pros:**
- ✅ One OAuth setup for all environments (Cursor, Cloudflare, mobile)
- ✅ Automatic token refresh
- ✅ No local credential files
- ✅ Multi-user ready
- ✅ Secure (credentials in Cloudflare KV, not local files)

**Cons:**
- ⚠️ Requires deploying OAuth broker first
- ⚠️ Requires internet connection (broker is on Cloudflare)

### Option 2: Direct Token (Simpler for Local-Only)

**How it works:**
- Set `GOOGLE_ACCESS_TOKEN` directly in Cursor config
- MCP server uses token immediately (no HTTP calls)
- Works offline
- **Only for local development**

**Configuration:**
```json
{
  "mcpServers": {
    "google-calendar": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-calendar/dist/index.js"],
      "env": {
        "GOOGLE_ACCESS_TOKEN": "ya29.your-token-here"
      }
    }
  }
}
```

**Pros:**
- ✅ Works immediately (no broker setup needed)
- ✅ Works offline
- ✅ Simple for local-only development

**Cons:**
- ❌ Tokens expire and need manual refresh
- ❌ Different setup for local vs remote
- ❌ Not multi-user friendly
- ❌ Token stored in config file (less secure)

## Recommendation

**For Cursor specifically:**

1. **If you're building for production/remote access**: Use OAuth broker
   - Deploy broker once to Cloudflare
   - Use same setup everywhere
   - Better long-term solution

2. **If you're just testing locally**: Use direct token
   - Faster to get started
   - No broker deployment needed
   - Switch to broker later when deploying

3. **Best of both worlds**: Use both!
   - Set `OAUTH_BROKER_URL` and `GOOGLE_ACCESS_TOKEN`
   - Code tries broker first, falls back to direct token
   - Works even if broker is down

## Can OAuth Broker Run Locally?

**Technically yes, but not recommended:**

You could run the OAuth broker locally using:
- `wrangler dev` (Cloudflare Workers local dev)
- A local Node.js server

But this adds complexity:
- Need to manage local KV storage (or mock it)
- Need to handle OAuth redirects (localhost URLs)
- More setup than just using the deployed broker

**Better approach:** Deploy broker to Cloudflare once, use it from everywhere.

## Current Implementation

The Calendar MCP already supports both patterns:

```typescript
// Priority 1: OAuth broker
if (config.oauthBrokerUrl && config.userId) {
  // Fetch token from broker
}

// Priority 2: Direct token (fallback)
return config.accessToken || process.env.GOOGLE_ACCESS_TOKEN;
```

**You can use either or both!**

## Next Steps

1. **For quick local testing**: Use `GOOGLE_ACCESS_TOKEN` in Cursor config
2. **For production setup**: Build and deploy OAuth broker, then switch to `OAUTH_BROKER_URL`
3. **For best of both**: Set both (broker first, token as fallback)

