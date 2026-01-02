# Cloudflare Workers Strategy

## Why Cloudflare Workers?

- **Free tier**: 100K requests/day (sufficient for personal use)
- **Zero infrastructure**: No servers to manage
- **Global edge**: Fast response times worldwide
- **Automatic scaling**: Handles traffic spikes automatically
- **HTTPS included**: Automatic SSL certificates
- **Simple deployment**: `wrangler deploy` command

## Compatibility Requirements

### ✅ Compatible

- **Languages**: JavaScript/TypeScript only
- **APIs**: Web APIs (fetch, URL, Web Crypto, etc.)
- **Libraries**: 
  - `@octokit/rest` - GitHub API client
  - `@modelcontextprotocol/sdk` - MCP protocol
  - Any library that uses Web APIs only

### ❌ Incompatible

- **Languages**: Go, Python, Rust (must be compiled to JavaScript)
- **APIs**: Node.js-specific APIs (fs, child_process, etc.)
- **Libraries**:
  - `googleapis` - Requires Node.js APIs (use REST API with `fetch` instead)
  - Any library that uses file system or child processes

## Known Incompatibilities

**Cloudflare Workers:**
- ❌ `googleapis` - Use REST API with `fetch` instead
- ❌ Python/Go - Use TypeScript/JavaScript only
- ❌ Docker - Not supported
- ❌ File system operations - Use KV or external storage
- ❌ Child processes (`spawn`, `exec`) - Not supported
- ❌ Long-running processes - Workers have execution time limits

**Workarounds:**
- Use REST APIs directly with `fetch` instead of SDKs
- Use Web Crypto API instead of Node.js crypto
- Use `fetch` for HTTP requests instead of Node.js `http`
- Use Cloudflare KV for storage instead of file system

## Deployment

### Gateway Deployment

**Deploy from gateway directory:**
```powershell
cd packages\mcp-gateway
wrangler deploy
```

**Wrangler v4 Syntax Changes:**
- ✅ `wrangler kv namespace create "NAME"` (not `kv:namespace`)
- ✅ `wrangler kv key put --namespace-id=<ID> --remote "key" "value"` (use `--remote` for production)
- ✅ `wrangler kv key get --namespace-id=<ID> --remote "key"` (use `--remote` for production)
- ✅ Use `compatibility_flags = ["nodejs_compat"]` (not `node_compat = true`)

### Authentication

- Gateway uses bearer token authentication stored in Cloudflare KV
- Protected endpoints require `Authorization: Bearer <token>` header
- See gateway README for token management

**Set Secrets:**
```powershell
# IMPORTANT: Must run from the gateway directory where wrangler.toml is located
cd packages\mcp-gateway

# wrangler secret put expects INTERACTIVE input - you'll be prompted to enter the value
# DO NOT pipe values to it (echo $value | wrangler secret put) - this creates empty secrets!
wrangler secret put GITHUB_TOKEN
# When prompted, paste your token and press Enter
```

**⚠️ CRITICAL: Secret Setting Rules**
- Always run `wrangler secret put` from `packages\mcp-gateway` directory
- `wrangler secret put` requires INTERACTIVE input - you'll be prompted
- NEVER pipe values: `echo $value | wrangler secret put KEY` creates empty secrets!
- If you see "Required Worker name missing", you're in the wrong directory
- After setting secrets, they're immediately available (no redeploy needed)

## Cost Breakdown

**Monthly Costs (Personal Use):**
- Cloudflare Workers: $0 (free tier: 100K requests/day)
- Cloudflare KV: $0 (free tier: 100K reads/day, 1K writes/day)
- Supabase: $0 (free tier: 500MB, 2GB bandwidth)
- Claude API: ~$10-20 (PDF parsing, reasoning)
- Domain: $12/year (optional, for OAuth broker)

**Total: ~$10-20/month** (mostly Claude API for email processing)

Compare to AWS/Azure/GCP: **80-90% cheaper** with zero infrastructure management.

## Testing

### Local Testing

```powershell
cd packages\mcp-gateway
npm run dev
# Server runs on http://localhost:8787
```

### Deployed Testing

**View Logs:**
```powershell
cd packages\mcp-gateway
wrangler tail
```

## Compatibility Check Process

Before building, recommending, or implementing any approach, library, or language, **MUST verify compatibility** with Cloudflare Workers:

1. **Before recommending a library/package:**
   - Search for: `"[package-name]" "cloudflare workers" compatibility`
   - Check official documentation for runtime requirements
   - Look for known issues or workarounds
   - Verify if it requires Node.js-specific APIs

2. **Before recommending a language:**
   - Cloudflare Workers: **Only JavaScript/TypeScript**
   - Local development: **Node.js with TypeScript**

3. **Before recommending an approach:**
   - Check if it requires file system access (Workers don't have it)
   - Check if it requires child processes (Workers don't support `spawn`)
   - Check if it requires native modules (may not work in Workers)

4. **If compatibility is uncertain:**
   - **Research first** - don't guess or assume
   - Look for official documentation or community solutions
   - Consider alternative approaches that are known to work
   - Document the compatibility check in code comments

