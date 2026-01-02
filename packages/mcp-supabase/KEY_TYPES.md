# Supabase Key Types for MCP Servers

## Overview

Supabase provides different API keys for different use cases. For MCP servers, you need to choose the right key type based on your security requirements.

## Key Types

### 1. Service Role Key (Recommended for MCP) ✅

**What it is:**
- Legacy key name: `service_role` key
- New key name: `secret` key (same functionality, better security)
- Full admin access to your Supabase project
- **Bypasses Row Level Security (RLS) policies**

**When to use:**
- ✅ **MCP servers** (server-side applications)
- ✅ Backend services
- ✅ Admin operations
- ✅ When you need full database access

**Security:**
- ⚠️ **Never expose in client-side code**
- ✅ Store securely (Cloudflare Workers secrets, environment variables)
- ✅ Designed for server-side use

**Example:**
```toml
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # service_role key
```

### 2. Anon Key (Not Recommended for MCP) ❌

**What it is:**
- Legacy key name: `anon` key
- New key name: `publishable` key (same functionality)
- Public-facing key, safe to expose
- **Respects Row Level Security (RLS) policies**

**When to use:**
- ✅ Client-side applications (web, mobile)
- ✅ Public APIs
- ✅ When you want RLS restrictions
- ❌ **Not recommended for MCP servers** (unless you specifically want RLS)

**Security:**
- ✅ Safe to expose in client-side code
- ✅ Respects RLS policies (good for multi-tenant apps)
- ❌ May be too restrictive for MCP servers

**Example:**
```toml
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # anon key
```

## Comparison

| Feature | Service Role Key | Anon Key |
|---------|----------------|----------|
| **RLS Bypass** | ✅ Yes | ❌ No (respects RLS) |
| **Admin Access** | ✅ Full | ❌ Limited by RLS |
| **Client-Side Safe** | ❌ No | ✅ Yes |
| **MCP Server Use** | ✅ **Recommended** | ❌ Not recommended |
| **Backend Use** | ✅ Yes | ❌ No |

## Why Service Role Key for MCP?

MCP servers are **server-side applications** that need:
1. **Full database access** - Query any table, insert/update/delete without RLS restrictions
2. **Admin operations** - Create tables, manage schemas, etc.
3. **No RLS interference** - RLS is designed for client-side apps, not server-side services

This is the same pattern as:
- Backend APIs
- Serverless functions
- Admin tools
- ETL processes

## What the Old Python MCP Did

Most Python Supabase MCP implementations use the **service_role key** because:
- They're server-side applications
- They need full database access
- RLS restrictions would break functionality
- It's the standard pattern for backend services

## Security Best Practices

1. **Store securely:**
   ```toml
   # wrangler.toml.local (gitignored)
   SUPABASE_KEY = "your-service-role-key"
   ```
   Or use secrets:
   ```bash
   wrangler secret put SUPABASE_KEY
   ```

2. **Never commit to git:**
   - ✅ Use `wrangler.toml.local` (gitignored)
   - ✅ Use `wrangler secret put` for production
   - ❌ Never commit to `wrangler.toml`

3. **Rotate regularly:**
   - Supabase dashboard → Settings → API → Regenerate keys

4. **Monitor usage:**
   - Check Supabase logs for unusual activity
   - Use Supabase dashboard to monitor API usage

## Configuration Example

### For MCP Server (Recommended)

```toml
# packages/mcp-gateway/wrangler.toml.local
[vars]
SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_KEY = "your-service-role-key-here"  # ✅ Service role key
```

### Alternative: Using Secrets (Production)

```bash
cd packages/mcp-gateway
wrangler secret put SUPABASE_URL
# Paste: https://YOUR_PROJECT_REF.supabase.co

wrangler secret put SUPABASE_KEY
# Paste: your-service-role-key-here
```

## Getting Your Service Role Key

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Find **service_role** key (or **secret** key in new projects)
5. Copy the key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

**⚠️ Warning:** The service_role key has full admin access. Treat it like a password!

## Summary

**For MCP Servers:**
- ✅ **Use Service Role Key** - Full access, bypasses RLS
- ❌ **Don't use Anon Key** - Too restrictive, respects RLS

**Our Implementation:**
- Already supports service_role key
- Just set `SUPABASE_KEY` to your service_role key
- Works exactly like the old Python MCP implementations

