# MCP Gateway

Routes remote MCP requests to appropriate MCP servers.

## Platform Support

**✅ Supported:**
- **Claude.ai** - Native MCP support (recommended)

**❌ Not Supported:**
- **ChatGPT** - Doesn't support MCP natively (uses Actions/OpenAPI instead)
- **Google Gemini** - No user-facing MCP server configuration (only API-level MCP support for developers)

See [`docs/reference/MCP_PLATFORM_SUPPORT.md`](../../docs/reference/MCP_PLATFORM_SUPPORT.md) for detailed research and recommendations.

## Features

- ✅ Routes MCP requests to GitHub, Calendar, Gmail, etc.
- ✅ Fetches tokens from OAuth broker
- ✅ Handles MCP protocol over HTTP
- ✅ Supports service bindings for performance

## Setup

### 1. Configure OAuth Broker URL

Update `wrangler.toml`:
```toml
[vars]
OAUTH_BROKER_URL = "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev"
```

### 2. Deploy MCP Workers

Deploy individual MCP workers (GitHub, Calendar, etc.) first, then bind them:

```toml
[[services]]
binding = "GITHUB_MCP"
service = "github-mcp"

[[services]]
binding = "CALENDAR_MCP"
service = "calendar-mcp"
```

### 3. Deploy Gateway

```bash
cd packages/mcp-gateway
wrangler deploy
```

## API

### List Servers

```
GET /mcp/servers
```

### MCP Request

```
POST /mcp/sse
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "list_events",
    "arguments": { ... }
  },
  "id": 1
}
```

## Architecture

```
Client (Claude.ai, Voice app)
  ↓
MCP Gateway (routes request)
  ↓
OAuth Broker (fetches token)
  ↓
MCP Worker (GitHub, Calendar, etc.)
  ↓
External API (GitHub, Google, etc.)
```

## Troubleshooting

### Claude.ai Re-initializes Connection After Every Request

**Symptom:** Claude.ai calls `initialize` repeatedly instead of proceeding with `tools/list` and `tools/call`.

**Cause:** JSON-RPC response `id` field is `null` when request `id` is `0` (or other falsy values).

**Solution:** Always use `requestBody.id !== undefined ? requestBody.id : null` instead of `requestBody.id || null`.

**Why:** In JavaScript, `0 || null` evaluates to `null` because `0` is falsy. JSON-RPC allows `0` as a valid request ID, so the response must preserve it. When the response ID doesn't match the request ID, clients may treat it as invalid and re-initialize the connection.

**Example:**
```typescript
// ❌ WRONG - breaks when request.id is 0
id: requestBody.id || null

// ✅ CORRECT - preserves 0 and other falsy values
id: requestBody.id !== undefined ? requestBody.id : null
```

**Related Issue:** This bug caused Claude.ai to see `null` response IDs when request IDs were `0`, leading to connection re-initialization after every request.

