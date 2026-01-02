# Cloudflare Workers: Worker-to-Worker Fetch (Error 1042)

## Overview

When a Cloudflare Worker attempts to fetch from another Worker in the same zone, it may encounter **error code 1042**. This error indicates that the fetch request was blocked by Cloudflare's security restrictions.

## Error Code 1042

**Error Message:** `error code: 1042`

**What it means:** A Worker attempted to fetch from another Worker in the same zone, which is blocked by default.

**HTTP Status:** Usually returns as `404 Not Found` with the error code in the response body.

## Why Is This Disabled by Default?

Cloudflare blocks worker-to-worker fetch requests by default for several important reasons:

### 1. **Prevent Infinite Loops**
- Workers calling each other can create infinite loops
- Example: Worker A calls Worker B, which calls Worker A again
- This can consume resources and cause billing issues

### 2. **Security**
- Prevents accidental exposure of internal services
- Reduces attack surface by limiting inter-worker communication
- Forces explicit configuration for worker-to-worker communication

### 3. **Performance & Billing**
- Worker-to-worker calls still count as requests
- Can lead to unexpected billing if not carefully managed
- May cause performance degradation if not optimized

### 4. **Architectural Clarity**
- Encourages better architectural decisions
- Forces developers to think about service boundaries
- Promotes use of Service Bindings (the recommended approach)

## Solutions

### Solution 1: Enable Compatibility Flag (Quick Fix)

**For public hostnames only** (e.g., `*.workers.dev`), you can enable the `global_fetch_strictly_public` compatibility flag.

**In `wrangler.toml`:**

```toml
compatibility_flags = ["nodejs_compat", "global_fetch_strictly_public"]
```

**Apply to both workers:**
- The worker making the fetch request (gateway)
- The worker being fetched (broker)

**Limitations:**
- Only works for public hostnames (`*.workers.dev`)
- Does NOT work for custom domains or routes
- Still counts as external HTTP requests (billing applies)

**When to use:**
- Quick prototyping
- Public workers on `*.workers.dev` subdomains
- When Service Bindings aren't available

### Solution 2: Service Bindings (Recommended Best Practice)

**Service Bindings** are the recommended way for workers to communicate within the same zone.

**Benefits:**
- ✅ No HTTP overhead (direct function calls)
- ✅ No billing for inter-worker requests
- ✅ Works with custom domains and routes
- ✅ Better performance (no network latency)
- ✅ Type-safe bindings
- ✅ No compatibility flags needed

**In `wrangler.toml` (gateway worker):**

```toml
[[services]]
binding = "OAUTH_BROKER"
service = "oauth-broker"
```

**In code:**

```typescript
// Instead of:
const response = await fetch('https://oauth-broker.example.workers.dev/token/github', {
  method: 'POST',
  body: JSON.stringify({ user_id: userId }),
});

// Use:
const response = await env.OAUTH_BROKER.fetch(new Request('https://example.com/token/github', {
  method: 'POST',
  body: JSON.stringify({ user_id: userId }),
}));
```

**When to use:**
- Production deployments
- Workers in the same zone
- When performance matters
- Custom domains or routes

## Debugging Steps

If you encounter error 1042, follow these steps:

### 1. Identify the Error

Look for these symptoms:
- HTTP 404 responses with `error code: 1042` in the body
- No logs appearing in the target worker (request never reaches it)
- Fetch requests from one worker to another failing

**Example error response:**
```
error code: 1042
```

### 2. Verify Worker URLs

Check that both workers are:
- Deployed and accessible
- Using public `*.workers.dev` hostnames (if using compatibility flag)
- In the same Cloudflare account/zone

**Test the target worker directly:**
```powershell
# Test broker directly
$body = @{ user_id = "jason" } | ConvertTo-Json
Invoke-WebRequest -Uri "https://oauth-broker.example.workers.dev/token/github" `
  -Method POST -Headers @{"Content-Type" = "application/json"} -Body $body
```

### 3. Check Compatibility Flags

Verify both workers have the flag enabled:

**Gateway worker (`wrangler.toml`):**
```toml
compatibility_flags = ["nodejs_compat", "global_fetch_strictly_public"]
```

**Broker worker (`wrangler.toml`):**
```toml
compatibility_flags = ["nodejs_compat", "global_fetch_strictly_public"]
```

### 4. Add Logging

Add logging to trace the request flow:

**In the calling worker (gateway):**
```typescript
console.log(`[getAuthToken] Fetching from broker: ${brokerUrl}`);
const response = await fetch(brokerUrl, { ... });
console.log(`[getAuthToken] Broker response status: ${response.status}`);
```

**In the target worker (broker):**
```typescript
app.use('*', async (c, next) => {
  console.log(`[BROKER] 🔔 Incoming request: ${c.req.method} ${c.req.path}`);
  await next();
});
```

### 5. Check Worker Logs

**Gateway logs:**
```powershell
cd packages\mcp-gateway
wrangler tail --format pretty
```

**Broker logs:**
```powershell
cd packages\oauth-broker
wrangler tail --format pretty
```

**What to look for:**
- If broker logs show no incoming requests → Error 1042 (request blocked)
- If broker logs show requests → Check routing/authentication

### 6. Verify Deployment

Ensure both workers are deployed with the updated configuration:

```powershell
# Deploy gateway
cd packages\mcp-gateway
wrangler deploy

# Deploy broker
cd packages\oauth-broker
wrangler deploy
```

## Best Practices

### ✅ Recommended: Service Bindings

**Use Service Bindings for:**
- Production deployments
- Workers in the same zone
- Performance-critical applications
- Custom domains

**Example architecture:**
```
Gateway Worker
  └─ Service Binding → OAuth Broker Worker
  └─ Service Binding → GitHub MCP Worker
  └─ Service Binding → Calendar MCP Worker
```

### ⚠️ Acceptable: Compatibility Flag

**Use compatibility flag for:**
- Development/prototyping
- Public `*.workers.dev` hostnames only
- When Service Bindings aren't available
- Temporary solutions

### ❌ Not Recommended: External Fetch

**Avoid:**
- Fetching between workers via external URLs
- Using custom domains with compatibility flag (won't work)
- Bypassing Cloudflare's security measures

## Migration Path

If you're currently using the compatibility flag, consider migrating to Service Bindings:

### Step 1: Add Service Binding

**In gateway `wrangler.toml`:**
```toml
[[services]]
binding = "OAUTH_BROKER"
service = "oauth-broker"
```

### Step 2: Update Code

**Before (fetch):**
```typescript
const response = await fetch(`${oauthBrokerUrl}/token/github`, {
  method: 'POST',
  body: JSON.stringify({ user_id: userId }),
});
```

**After (service binding):**
```typescript
const response = await env.OAUTH_BROKER.fetch(
  new Request('https://example.com/token/github', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  })
);
```

### Step 3: Remove Compatibility Flag

Once Service Bindings are working, you can remove the compatibility flag:

```toml
# Remove this:
compatibility_flags = ["nodejs_compat", "global_fetch_strictly_public"]

# Keep only:
compatibility_flags = ["nodejs_compat"]
```

## Real-World Example

### Problem
- Gateway worker fetching from OAuth broker worker
- Error 1042: `error code: 1042`
- No logs in broker worker (request never reached it)

### Solution
1. Added `global_fetch_strictly_public` to both workers' `wrangler.toml`
2. Redeployed both workers
3. Verified fetch requests now reach the broker
4. Confirmed GitHub token retrieval works

### Code Changes

**`packages/mcp-gateway/wrangler.toml`:**
```toml
compatibility_flags = ["nodejs_compat", "global_fetch_strictly_public"]
```

**`packages/oauth-broker/wrangler.toml`:**
```toml
compatibility_flags = ["nodejs_compat", "global_fetch_strictly_public"]
```

## References

- [Cloudflare Workers Error Codes](https://developers.cloudflare.com/workers/observability/errors/)
- [Service Bindings Documentation](https://developers.cloudflare.com/workers/configuration/bindings/service-bindings/)
- [Compatibility Flags](https://developers.cloudflare.com/workers/configuration/compatibility-dates/#compatibility-flags)

## Summary

- **Error 1042** = Worker-to-worker fetch blocked by default
- **Why disabled:** Prevents infinite loops, improves security, controls billing
- **Quick fix:** Enable `global_fetch_strictly_public` compatibility flag (public hostnames only)
- **Best practice:** Use Service Bindings for production deployments
- **Debug:** Check logs, verify flags, test workers directly

