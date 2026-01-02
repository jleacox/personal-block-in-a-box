# MCP Protocol Gotchas

Common pitfalls and bugs when implementing MCP servers.

> **See also:** [Cloudflare Worker-to-Worker Fetch (Error 1042)](./CLOUDFLARE_WORKER_TO_WORKER_FETCH.md) for issues with workers fetching from other workers.

## JSON-RPC ID Handling

### The Problem

When handling JSON-RPC request IDs, using `requestBody.id || null` will break when the request ID is `0` (or other falsy values like `false`, `""`).

### Why It Breaks

In JavaScript:
```javascript
0 || null        // → null (WRONG - 0 is a valid ID!)
false || null    // → null (WRONG - false could be a valid ID!)
"" || null       // → null (WRONG - empty string could be valid!)
undefined || null // → null (CORRECT - undefined should become null)
```

JSON-RPC 2.0 allows `0` as a valid request ID. When the response ID doesn't match the request ID, clients may:
- Treat the response as invalid
- Re-initialize the connection
- Stop processing subsequent requests

### The Solution

Always use `!== undefined` check to preserve falsy values:

```typescript
// ❌ WRONG - breaks when request.id is 0
const responseId = requestBody.id || null;

// ✅ CORRECT - preserves 0 and other falsy values
const responseId = requestBody.id !== undefined ? requestBody.id : null;
```

### Real-World Impact

**Bug:** Claude.ai was calling `initialize` repeatedly instead of proceeding with `tools/list` and `tools/call`.

**Root Cause:** Response IDs were `null` when request IDs were `0`, causing Claude.ai to think the connection was broken.

**Fix:** Changed all `requestBody.id || null` to `requestBody.id !== undefined ? requestBody.id : null` throughout the gateway.

**Result:** Claude.ai now correctly maintains the connection and proceeds with tool calls.

### Where This Applies

This pattern must be used in **all** JSON-RPC response handlers:
- `initialize` responses
- `tools/list` responses
- `tools/call` responses
- `resources/list` responses
- Error responses
- Notification responses

### Code Pattern

```typescript
// Standard pattern for all JSON-RPC responses
return c.json({
  jsonrpc: '2.0',
  result: { /* ... */ },
  id: requestBody.id !== undefined ? requestBody.id : null,
});
```

## Protocol Version Mismatch

### The Problem

Hardcoding protocol version in `initialize` response can cause compatibility issues.

### The Solution

Always use the protocol version the client sends:

```typescript
// ❌ WRONG - hardcoded version
protocolVersion: '2024-11-05'

// ✅ CORRECT - use client's version
protocolVersion: params?.protocolVersion || '2024-11-05'
```

## OAuth Capability Confusion

### The Problem

Including standard MCP OAuth capability in `initialize` response when using OAuth broker pattern can confuse clients.

### The Solution

Remove OAuth capability from `initialize` response if using OAuth broker pattern:

```typescript
capabilities: {
  tools: { listChanged: true },
  resources: { listChanged: true },
  // Don't include oauth capability if using broker pattern
}
```

## Gmail API Issues

### Authorization Header Truncation

**Problem:** Token was being truncated to first 20 characters in Authorization header.

**Fix:** Use full token:
```typescript
// ❌ WRONG - truncates token
'Authorization': `Bearer ${token.substring(0, 20)}...`

// ✅ CORRECT - full token
'Authorization': `Bearer ${token}`
```

**Location:** `packages/mcp-gmail/src/utils/gmail-client.ts` line 129

### Base64 Encoding Mismatch

**Problem:** Gmail API returns base64url-encoded data, but Claude API expects standard base64.

**Fix:** Convert base64url to standard base64:
```typescript
// Gmail returns base64url (uses - and _)
// Claude expects standard base64 (uses + and /)
const base64Data = attachmentData.data.replace(/-/g, '+').replace(/_/g, '/');
```

**Location:** `packages/mcp-gmail/src/tools/extract-dates.ts` line 503

**See:** [Gmail OAuth Issues](./GMAIL_OAUTH_ISSUES.md) for detailed troubleshooting

## References

- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Gateway README](../packages/mcp-gateway/README.md) - Troubleshooting section
- [Gmail OAuth Issues](./GMAIL_OAUTH_ISSUES.md)
- [Cloudflare Worker-to-Worker Fetch](./CLOUDFLARE_WORKER_TO_WORKER_FETCH.md)

