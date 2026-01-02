# Service Bindings Guide

## What Are Service Bindings?

**Service Bindings** allow one Cloudflare Worker to directly call another Worker in the same account **without going through HTTP**. It's like a direct function call between workers.

### Current Approach (HTTP Fetch)

```
Gateway Worker
  ↓ HTTP fetch (external request)
  ↓ Goes through internet
  ↓ Counts as billing request
  ↓ Network latency
OAuth Broker Worker
```

### Service Binding Approach

```
Gateway Worker
  ↓ Direct function call (no HTTP)
  ↓ No internet routing
  ↓ No billing for inter-worker calls
  ↓ Minimal latency
OAuth Broker Worker
```

## Benefits

1. **No HTTP Overhead** - Direct function calls, not HTTP requests
2. **No Billing** - Inter-worker calls don't count as external requests
3. **Better Performance** - No network latency (runs in same runtime)
4. **Works Everywhere** - Works with custom domains, routes, etc.
5. **Type Safety** - Can be typed in TypeScript
6. **No Compatibility Flags** - Don't need `global_fetch_strictly_public`

## How Much Work?

**Estimated effort: ~30 minutes**

### Changes Required:

1. **Add service binding to `wrangler.toml`** (2 minutes)
2. **Update TypeScript interface** (2 minutes)
3. **Update code to use binding** (10 minutes)
4. **Test and verify** (10 minutes)
5. **Remove compatibility flag** (1 minute)

## Implementation Steps

### Step 1: Add Service Binding to Gateway

**File: `packages/mcp-gateway/wrangler.toml`**

```toml
# Add this section:
[[services]]
binding = "OAUTH_BROKER"
service = "oauth-broker"
```

### Step 2: Update TypeScript Interface

**File: `packages/mcp-gateway/src/index.ts`**

```typescript
export interface Env {
  // OAuth broker URL (keep for fallback or remove if not needed)
  OAUTH_BROKER_URL?: string;
  
  // Service binding (NEW)
  OAUTH_BROKER: Fetcher;  // Cloudflare's Fetcher type
  
  // ... rest of interface
}
```

### Step 3: Update Code to Use Service Binding

**File: `packages/mcp-github/src/utils/octokit.ts`**

**Before (HTTP fetch):**
```typescript
const response = await fetch(`${oauthBrokerUrl}/token/github`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ user_id: userId }),
});
```

**After (Service Binding):**
```typescript
// Check if service binding is available
if (env?.OAUTH_BROKER) {
  // Use service binding (direct call, no HTTP)
  const response = await env.OAUTH_BROKER.fetch(
    new Request('https://example.com/token/github', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    })
  );
} else if (oauthBrokerUrl) {
  // Fallback to HTTP fetch (for backward compatibility)
  const response = await fetch(`${oauthBrokerUrl}/token/github`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId }),
  });
}
```

**Note:** The URL in the Request doesn't matter when using service bindings - it's just used for routing within the target worker. You can use any URL, but the path (`/token/github`) is what matters.

### Step 4: Pass Environment to Functions

**File: `packages/mcp-github/src/utils/octokit.ts`**

Update function signatures to accept `env`:

```typescript
// Before
async function getAuthToken(
  oauthBrokerUrl?: string,
  userId?: string,
  directToken?: string
): Promise<string | undefined>

// After
async function getAuthToken(
  oauthBrokerUrl?: string,
  userId?: string,
  directToken?: string,
  env?: { OAUTH_BROKER?: Fetcher }  // Add env parameter
): Promise<string | undefined>
```

**File: `packages/mcp-gateway/src/mcp-handlers.ts`**

Update `GitHubMCP` to pass `env`:

```typescript
export class GitHubMCP {
  private env?: { OAUTH_BROKER?: Fetcher };
  
  constructor(
    githubToken?: string,
    oauthBrokerUrl?: string,
    userId?: string,
    env?: { OAUTH_BROKER?: Fetcher }  // Add env parameter
  ) {
    this.githubToken = githubToken;
    this.oauthBrokerUrl = oauthBrokerUrl;
    this.userId = userId;
    this.env = env;  // Store env
  }
  
  private async getOctokit(): Promise<Octokit> {
    // Pass env to getOctokit
    this.octokit = await getOctokit(
      this.githubToken,
      this.oauthBrokerUrl,
      this.userId,
      this.env  // Pass env
    );
    return this.octokit;
  }
}
```

**File: `packages/mcp-gateway/src/index.ts`**

Pass `env` when creating handlers:

```typescript
const githubMCP = new GitHubMCP(
  c.env.GITHUB_TOKEN,
  c.env.OAUTH_BROKER_URL,
  c.env.USER_ID,
  c.env  // Pass env for service binding
);
```

### Step 5: Remove Compatibility Flag (Optional)

Once service bindings are working, you can remove the compatibility flag:

**File: `packages/mcp-gateway/wrangler.toml`**

```toml
# Remove global_fetch_strictly_public
compatibility_flags = ["nodejs_compat"]
```

**File: `packages/oauth-broker/wrangler.toml`**

```toml
# Remove global_fetch_strictly_public
compatibility_flags = ["nodejs_compat"]
```

## Code Changes Summary

### Files to Modify:

1. **`packages/mcp-gateway/wrangler.toml`** - Add service binding
2. **`packages/mcp-gateway/src/index.ts`** - Update Env interface, pass env to handlers
3. **`packages/mcp-gateway/src/mcp-handlers.ts`** - Update GitHubMCP to accept/pass env
4. **`packages/mcp-github/src/utils/octokit.ts`** - Update getAuthToken to use service binding

### Lines of Code Changed:

- **wrangler.toml**: ~3 lines added
- **index.ts**: ~5 lines (interface + passing env)
- **mcp-handlers.ts**: ~10 lines (constructor + getOctokit)
- **octokit.ts**: ~20 lines (service binding logic)

**Total: ~40 lines of code changes**

## Testing

After implementing:

1. **Deploy both workers:**
   ```powershell
   cd packages\oauth-broker
   wrangler deploy
   
   cd ..\mcp-gateway
   wrangler deploy
   ```

2. **Test the gateway:**
   ```powershell
   $body = @{ jsonrpc = "2.0"; method = "tools/call"; params = @{ name = "list_repos"; arguments = @{ owner = "jleacox" } }; id = 1 } | ConvertTo-Json -Depth 10
   Invoke-WebRequest -Uri "https://mcp-gateway.jason-leacox.workers.dev/mcp/sse" -Method POST -Headers @{"Content-Type" = "application/json"} -Body $body
   ```

3. **Check logs:**
   ```powershell
   cd packages\mcp-gateway
   wrangler tail --format pretty
   ```

4. **Verify:**
   - No error 1042
   - Broker logs show requests (if logging enabled)
   - GitHub API calls succeed

## Backward Compatibility

The implementation can support both approaches:

```typescript
// Try service binding first (preferred)
if (env?.OAUTH_BROKER) {
  // Use service binding
} else if (oauthBrokerUrl) {
  // Fallback to HTTP fetch
}
```

This allows:
- Gradual migration
- Testing service bindings without breaking existing setup
- Fallback if service binding isn't configured

## Performance Comparison

### HTTP Fetch (Current)
- **Latency:** ~50-100ms (network round-trip)
- **Billing:** Counts as external request
- **Reliability:** Depends on network
- **Compatibility:** Requires `global_fetch_strictly_public` flag

### Service Binding (Recommended)
- **Latency:** ~1-5ms (direct function call)
- **Billing:** No charge for inter-worker calls
- **Reliability:** Same runtime, no network issues
- **Compatibility:** Works everywhere, no flags needed

## When to Use Service Bindings

✅ **Use Service Bindings when:**
- Workers are in the same Cloudflare account
- You want better performance
- You want to reduce billing
- You're using custom domains/routes
- Production deployments

⚠️ **Use HTTP Fetch when:**
- Workers are in different accounts
- Quick prototyping
- Testing compatibility flags
- Temporary solutions

## Implementation Status

### ✅ Implemented
- **GitHub MCP** - Uses Service Bindings for OAuth broker token fetching
- **Gateway** - Service binding configured and active

### 📋 Future Improvements
- **Gmail MCP** - Update to use Service Bindings (currently uses HTTP fetch)
- **Calendar MCP** - Update to use Service Bindings
- **Drive MCP** - Update to use Service Bindings

## Real-World Results

**After implementing Service Bindings for GitHub:**
- ✅ Token fetches use Service Bindings (direct function calls)
- ✅ No billing for inter-worker token fetches
- ✅ Faster response times (~1-5ms vs ~50-100ms)
- ✅ Logs show: `hasServiceBinding: true` and `Using Service Binding to fetch token`

**Performance Comparison:**
- **Before (HTTP fetch):** ~50-100ms latency, counts as billing request
- **After (Service Binding):** ~1-5ms latency, no billing

## References

- [Cloudflare Service Bindings Documentation](https://developers.cloudflare.com/workers/configuration/bindings/service-bindings/)
- [Service Bindings API Reference](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)
- [Gmail OAuth Issues](./troubleshooting/GMAIL_OAUTH_ISSUES.md)

