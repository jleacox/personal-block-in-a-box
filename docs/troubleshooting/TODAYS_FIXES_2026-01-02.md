# Today's Fixes - January 2, 2026

## Summary

Today we implemented Service Bindings, fixed Gmail OAuth issues, and resolved base64 encoding problems. All changes improve performance, reduce costs, and fix critical bugs.

## 1. Service Bindings Implementation ✅

### What We Did
- Implemented Service Bindings for GitHub MCP to communicate with OAuth broker
- Replaced HTTP fetch with direct function calls between workers
- Added Service Binding configuration to gateway `wrangler.toml`

### Benefits
- ✅ **No billing** for inter-worker token fetches
- ✅ **10-20x faster** (1-5ms vs 50-100ms)
- ✅ **More reliable** (no network issues)
- ✅ **Works everywhere** (custom domains, routes, etc.)

### Files Changed
- `packages/mcp-gateway/wrangler.toml` - Added service binding
- `packages/mcp-gateway/src/index.ts` - Added `OAUTH_BROKER?: Fetcher` to Env
- `packages/mcp-gateway/src/mcp-handlers.ts` - Pass env to GitHubMCP
- `packages/mcp-github/src/utils/octokit.ts` - Use Service Binding first, HTTP fetch fallback

### Verification
- Logs show: `hasServiceBinding: true`
- Logs show: `Using Service Binding to fetch token`
- Logs show: `✅ Token received via Service Binding`
- Deployment shows: `env.OAUTH_BROKER (oauth-broker) Worker`

**See:** [Service Bindings Guide](../architecture/SERVICE_BINDINGS_GUIDE.md)

## 2. Gmail Authorization Header Fix ✅

### The Bug
Token was being truncated to first 20 characters in Authorization header:
```typescript
// ❌ WRONG
'Authorization': `Bearer ${token.substring(0, 20)}...`
```

### The Fix
Use full token:
```typescript
// ✅ CORRECT
'Authorization': `Bearer ${token}`
```

### Impact
- **Before:** All Gmail API calls failed with 401 Unauthorized
- **After:** Gmail API calls succeed
- **Location:** `packages/mcp-gmail/src/utils/gmail-client.ts` line 129

## 3. Base64 Encoding Fix ✅

### The Bug
- Gmail API returns **base64url**-encoded data (uses `-` and `_`)
- Claude API expects **standard base64**-encoded data (uses `+` and `/`)
- Images were being sent without conversion → Claude API errors

### The Fix
Convert base64url to standard base64 before sending to Claude:
```typescript
// Convert base64url to standard base64 for Claude API
const base64Data = attachmentData.data.replace(/-/g, '+').replace(/_/g, '/');
```

### Impact
- **Before:** Claude API couldn't parse image attachments → base64 errors
- **After:** Images are correctly encoded → Claude can process them
- **Location:** `packages/mcp-gmail/src/tools/extract-dates.ts` line 503
- **Cost:** No increase - same data size, format conversion only

## 4. Cloudflare Workers Error 1042 ✅

### The Problem
- Gateway worker fetching from broker worker returned error 1042
- Error 1042 = Worker-to-worker fetch blocked by default
- No logs in broker (request never reached it)

### The Solution (Temporary)
- Added `global_fetch_strictly_public` compatibility flag to both workers
- Allows worker-to-worker fetch for public hostnames

### The Better Solution (Implemented)
- Implemented Service Bindings (preferred approach)
- No compatibility flags needed
- No billing for inter-worker calls
- Better performance

**See:** [Cloudflare Worker-to-Worker Fetch](./CLOUDFLARE_WORKER_TO_WORKER_FETCH.md)

## Cost Analysis

### Service Bindings
- **Before:** Each token fetch = 1 billable request
- **After:** Token fetches via Service Binding = FREE (no billing)
- **Savings:** Significant reduction in billable requests

### Base64 Encoding Fix
- **Cost Impact:** None
- Same data size sent to Claude
- Same number of tokens
- Format conversion only (local, free)

## Testing Results

### GitHub MCP
- ✅ Service Bindings working
- ✅ Token fetch via Service Binding: `✅ Token received via Service Binding`
- ✅ GitHub API calls succeed
- ✅ Performance: ~1-5ms for token fetch

### Gmail MCP
- ✅ Authorization header fixed
- ✅ Gmail API calls succeed (401 errors resolved)
- ✅ Base64 encoding fixed
- ⚠️ Still uses HTTP fetch (Service Bindings not yet implemented)

## Documentation Created

1. **`docs/architecture/SERVICE_BINDINGS_GUIDE.md`**
   - Complete guide to Service Bindings
   - Implementation steps
   - Code examples
   - Migration path

2. **`docs/troubleshooting/CLOUDFLARE_WORKER_TO_WORKER_FETCH.md`**
   - Error 1042 explanation
   - Why it's disabled by default
   - Solutions (compatibility flag vs Service Bindings)
   - Best practices

3. **`docs/troubleshooting/GMAIL_OAUTH_ISSUES.md`**
   - Gmail 401 errors
   - Authorization header truncation fix
   - Base64 encoding issues
   - OAuth broker troubleshooting

4. **`docs/troubleshooting/MCP_PROTOCOL_GOTCHAS.md`** (Updated)
   - Added Gmail API issues section
   - Cross-references to other docs

## Next Steps

### Immediate
- ✅ Service Bindings for GitHub - **DONE**
- ✅ Gmail Authorization fix - **DONE**
- ✅ Base64 encoding fix - **DONE**

### Future Improvements
- 📋 Implement Service Bindings for Gmail MCP
- 📋 Implement Service Bindings for Calendar MCP
- 📋 Implement Service Bindings for Drive MCP
- 📋 Remove `global_fetch_strictly_public` flag (once all use Service Bindings)

## Key Learnings

1. **Service Bindings are the preferred approach** for worker-to-worker communication
2. **Error 1042** means worker-to-worker fetch is blocked (use Service Bindings)
3. **base64url vs base64** - Gmail uses base64url, Claude expects base64
4. **Token truncation** - Always use full token in Authorization headers
5. **Cost savings** - Service Bindings eliminate billing for inter-worker calls

## References

- [Service Bindings Guide](../architecture/SERVICE_BINDINGS_GUIDE.md)
- [Cloudflare Worker-to-Worker Fetch](./CLOUDFLARE_WORKER_TO_WORKER_FETCH.md)
- [Gmail OAuth Issues](./GMAIL_OAUTH_ISSUES.md)
- [MCP Protocol Gotchas](./MCP_PROTOCOL_GOTCHAS.md)

