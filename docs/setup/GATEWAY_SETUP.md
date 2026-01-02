# MCP Gateway Setup

The MCP Gateway is a combined Cloudflare Worker that routes remote MCP requests to GitHub, Calendar, and other MCP servers. It uses direct function imports (not HTTP calls) for optimal performance.

## Architecture

See [`../architecture/GATEWAY_PATTERN_DECISION.md`](../architecture/GATEWAY_PATTERN_DECISION.md) for why we use a combined gateway pattern.

**Key Points:**
- Single Cloudflare Worker deployment
- Direct imports from `mcp-github` and `mcp-calendar` packages
- No HTTP calls between workers (33-50% faster)
- OAuth broker integration for token management

## Prerequisites

1. **OAuth Broker Deployed**: See [`OAUTH_SETUP.md`](./OAUTH_SETUP.md)
2. **MCP Packages Built**: 
   ```bash
   cd packages/mcp-github && npm run build
   cd packages/mcp-calendar && npm run build
   ```

## Configuration

### 1. Update `wrangler.toml`

Edit `packages/mcp-gateway/wrangler.toml`:

```toml
[vars]
OAUTH_BROKER_URL = "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev"
USER_ID = "YOUR_USER_ID"
```

### 2. Set Secrets (Optional)

If you want to use direct tokens as fallback (not recommended for production):

```bash
cd packages/mcp-gateway
wrangler secret put GITHUB_TOKEN
wrangler secret put GOOGLE_ACCESS_TOKEN
```

**Note:** OAuth broker is recommended - no local secrets needed!

## Deployment

```bash
cd packages/mcp-gateway
npm install
wrangler deploy
```

## Testing

### Health Check

```bash
curl https://mcp-gateway.YOUR_SUBDOMAIN.workers.dev/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "mcp-gateway"
}
```

### List Available Servers

```bash
curl https://mcp-gateway.YOUR_SUBDOMAIN.workers.dev/mcp/servers
```

Expected response:
```json
{
  "servers": [
    {
      "id": "github",
      "name": "GitHub",
      "status": "available"
    },
    {
      "id": "google-calendar",
      "name": "Google Calendar",
      "status": "available"
    }
  ]
}
```

### List Tools

```bash
curl -X POST https://mcp-gateway.YOUR_SUBDOMAIN.workers.dev/mcp/sse \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

### Call a Tool

```bash
curl -X POST https://mcp-gateway.YOUR_SUBDOMAIN.workers.dev/mcp/sse \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list_repos",
      "arguments": {
        "owner": "YOUR_GITHUB_USERNAME"
      }
    },
    "id": 1
  }'
```

## Integration with Claude.ai

1. Go to [Claude.ai Settings](https://claude.ai/settings)
2. Add MCP Server:
   - **Name**: `Personal Block-in-a-Box`
   - **URL**: `https://mcp-gateway.YOUR_SUBDOMAIN.workers.dev/mcp/sse`
   - **Method**: `POST`

3. **Note:** Remote MCPs added to claude.ai automatically work in the Claude phone app! 🎉

See [`CLAUDE_AI_SETUP.md`](./CLAUDE_AI_SETUP.md) for detailed instructions.

## Local Development

The gateway can be tested locally using Wrangler:

```bash
cd packages/mcp-gateway
npm run dev
```

This starts a local server at `http://localhost:8787` that mimics the Cloudflare Worker environment.

## Troubleshooting

### "MCP worker URL not configured"

**Problem:** Gateway is trying to call separate workers via HTTP (old pattern).

**Solution:** Ensure you're using the latest gateway code that imports handlers directly. Check `packages/mcp-gateway/src/index.ts` - it should use `getMCPHandlers()` and call handlers directly, not via HTTP.

### "OAuth broker error"

**Problem:** OAuth broker is not accessible or not configured.

**Solution:**
1. Verify OAuth broker is deployed: `curl https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/health`
2. Check `OAUTH_BROKER_URL` in `wrangler.toml`
3. Ensure `USER_ID` is set correctly

### "Tool execution error"

**Problem:** Tool call failed.

**Solution:**
1. Check Wrangler logs: `wrangler tail`
2. Verify OAuth tokens are available (check OAuth broker)
3. Ensure tool arguments are correct (check tool schema)

## Architecture Notes

- **Combined Gateway**: All MCP handlers in one worker (better performance)
- **Direct Imports**: No HTTP calls between workers (faster)
- **OAuth Broker**: Central token management (no local secrets)
- **Code Reuse**: Same tool code for local (stdio) and remote (gateway)

See [`../architecture/GATEWAY_PATTERN_DECISION.md`](../architecture/GATEWAY_PATTERN_DECISION.md) for detailed architecture decisions.

