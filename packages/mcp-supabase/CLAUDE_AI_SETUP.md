# Setting Up Supabase MCP for Claude.ai

## Why Use Our Custom MCP Instead of Official?

Supabase's official MCP server (`https://mcp.supabase.com/mcp`) is designed for direct connections (like Cursor) and **doesn't work with Claude.ai's remote MCP setup**. It will error out when you try to use it.

**Solution:** Use our custom Supabase MCP integrated into your gateway. This works perfectly with Claude.ai.

## Setup Steps

### 1. Get Your Supabase Credentials

1. Go to your Supabase project: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL**: `https://YOUR_PROJECT_REF.supabase.co`
   - **service_role key**: For MCP servers (bypasses RLS, full admin access) - **Recommended for MCP**
   - **anon/public key**: For client-side operations (respects RLS) - Not recommended for MCP

**Recommendation:** Use the **service_role key** for MCP servers. MCP servers typically need full database access without RLS restrictions, similar to server-side applications.

### 2. Configure Gateway

You have two options:

#### Option A: Use `wrangler.toml.local` (Recommended for Development)

Edit `packages/mcp-gateway/wrangler.toml.local`:

```toml
[vars]
OAUTH_BROKER_URL = "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev"
USER_ID = "YOUR_USER_ID"
SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_KEY = "your-service-role-key-here"
```

#### Option B: Use Secrets (Recommended for Production)

```powershell
cd packages\mcp-gateway

# Set Supabase URL
wrangler secret put SUPABASE_URL
# When prompted, paste: https://YOUR_PROJECT_REF.supabase.co

# Set Supabase Key
wrangler secret put SUPABASE_KEY
# When prompted, paste: your-service-role-key-here
```

### 3. Build and Deploy Gateway

```powershell
# Build Supabase MCP
cd packages\mcp-supabase
npm install
npm run build

# Deploy gateway (includes Supabase MCP)
cd ..\mcp-gateway
npm install
wrangler deploy
```

### 4. Add to Claude.ai

1. Go to [Claude.ai Settings](https://claude.ai/settings)
2. Navigate to **MCP Servers** or **Custom Tools**
3. Add a new remote MCP server:
   - **Name**: `Personal Block-in-a-Box` (or your gateway name)
   - **URL**: `https://mcp-gateway.YOUR_SUBDOMAIN.workers.dev/mcp/sse`
   - **Authentication**: None needed (uses environment variables)

**Important:** Use your **gateway URL**, NOT the official Supabase MCP URL!

### 5. Test in Claude.ai

Try these commands:
- "Query the users table from Supabase"
- "Insert a new row into the tasks table"
- "Update the status column in the projects table"

## Available Tools

Once configured, you'll have access to these Supabase tools:

- **`query`**: Query data from tables with filtering, ordering, pagination
- **`insert`**: Insert rows into tables
- **`update`**: Update rows in tables
- **`delete`**: Delete rows from tables

## Example Usage

### Query with filters:
```
Query the users table where status equals 'active', ordered by created_at descending, limit 10
```

### Insert rows:
```
Insert a new user with name 'John Doe' and email 'john@example.com' into the users table
```

### Update rows:
```
Update all users where last_login is older than 2024-01-01, set status to 'inactive'
```

## Troubleshooting

### "Supabase configuration missing"
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are set in `wrangler.toml.local` or as secrets
- Redeploy the gateway after setting secrets

### "Table not found"
- Check that the table name is correct
- Verify your Supabase key has access to the table
- Check Row Level Security (RLS) policies if using anon key

### "Authentication error"
- Verify your Supabase key is correct
- Check if you need service_role key instead of anon key (for admin operations)

## Security Notes

- **Service Role Key** (Recommended for MCP): Bypasses RLS, full admin access - **Use this for MCP servers**
- **Anon Key**: Respects Row Level Security (RLS) policies - use only if you want RLS restrictions
- **Why Service Role for MCP?**: MCP servers are server-side applications that need full database access, similar to backend services. The service_role key is designed for this use case.
- **Security**: Never commit keys to git - use `wrangler.toml.local` (gitignored) or `wrangler secret put`
- **Best Practice**: Store service_role key securely (Cloudflare Workers secrets), never expose in client-side code

## Comparison: Official vs Custom

| Feature | Official Supabase MCP | Our Custom MCP |
|---------|----------------------|----------------|
| **Cursor (Local)** | ✅ Works | ✅ Works |
| **Claude.ai (Remote)** | ❌ Errors | ✅ Works |
| **Gateway Integration** | ❌ No | ✅ Yes |
| **Unified Tools** | ❌ No | ✅ Yes (GitHub, Calendar, etc.) |
| **Voice Access** | ❌ No | ✅ Yes (via Claude phone app) |

**Recommendation:**
- Use **Official Supabase MCP** for Cursor (local development)
- Use **Our Custom Supabase MCP** for Claude.ai (remote access)

