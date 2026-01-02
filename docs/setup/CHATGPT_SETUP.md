# Testing MCP Gateway with ChatGPT

## ⚠️ Important Limitation

**ChatGPT Custom GPTs do NOT support MCP servers directly.** They use Actions (OpenAPI schema), not MCP protocol.

If you're trying to add the MCP gateway as an MCP server in ChatGPT, it will hang because ChatGPT expects OpenAPI Actions, not MCP JSON-RPC.

## Recommended Approach: Use Claude.ai Instead

**Claude.ai natively supports MCP servers** and is the recommended way to use this gateway:

1. Go to [Claude.ai](https://claude.ai)
2. Add the MCP gateway URL: `https://mcp-gateway.YOUR_SUBDOMAIN.workers.dev/mcp/sse`
3. Configure OAuth if needed
4. Start using MCP tools directly

This is much simpler and works out of the box.

## Alternative: Expose MCP as OpenAPI Actions (Advanced)

If you must use ChatGPT, you need to expose the MCP tools as OpenAPI Actions. This requires:

1. Creating an OpenAPI schema that maps MCP tools to Actions
2. Handling the conversion between ChatGPT's function calling and MCP's JSON-RPC
3. Additional complexity and maintenance

**This is not recommended** - use Claude.ai instead.

## Overview

If you still want to try ChatGPT integration, here are the options:

1. **Custom GPT with Actions** - Create a Custom GPT that calls the gateway API (requires OpenAPI conversion)
2. **Direct API Testing** - Test the gateway directly via HTTP requests
3. **Function Calling Wrapper** - Create a wrapper that converts MCP tools to ChatGPT function calls

## Option 1: Custom GPT with OAuth (Recommended - Like Snowflake)

This approach uses OAuth client ID/secret, similar to how Snowflake MCP works.

### Step 1: Get OAuth Client ID and Secret

Get your OAuth credentials from the OAuth broker:

```powershell
cd packages\oauth-broker
wrangler secret list
```

You'll need:
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` for GitHub
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for Google Calendar

**Note:** These are stored as secrets, so you'll need to retrieve them. If you don't have them set, see [`OAUTH_CREDENTIALS_SETUP.md`](./OAUTH_CREDENTIALS_SETUP.md).

### Step 2: Create a Custom GPT

1. Go to [ChatGPT](https://chat.openai.com)
2. Click "Create" → "GPT"
3. Configure your GPT:
   - **Name**: Personal Block-in-a-Box
   - **Description**: Access GitHub, Calendar, and other services via MCP gateway
   - **Instructions**: "You are a helpful assistant that can interact with GitHub, Google Calendar, and other services through the MCP gateway API."

### Step 3: Add OAuth Authentication

In the GPT configuration, go to "Authentication" and select "OAuth":

**For GitHub:**
- **OAuth Client ID**: Your GitHub OAuth App Client ID (from GitHub OAuth App settings)
  - Your current Client ID: `0v23litHaVefg40cdD1I`
- **OAuth Client Secret**: Your GitHub OAuth App Client Secret (from GitHub OAuth App settings)
  - Your current Client Secret: `3d8f495e196b9db5c1925751847f51a9aea8ac82` (from .env.local)
- **Authorization URL**: `https://github.com/login/oauth/authorize`
- **Token URL**: `https://github.com/login/oauth/access_token`
- **Scope**: `repo user`
- **Redirect URI**: 
  - **Option A (if ChatGPT allows custom redirect URI)**: `https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/callback/github`
  - **Option B (if ChatGPT requires its own redirect URI)**: Create a new OAuth app with ChatGPT's redirect URI
  
**Important:** According to [GitHub's documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#redirect-urls), the `redirect_uri` parameter is optional. If ChatGPT doesn't require you to specify one, GitHub will use the callback URL from your OAuth app settings. However, ChatGPT needs to receive the OAuth callback itself, so you may need a separate OAuth app if ChatGPT requires a different redirect URI.

**Note:** The Client ID and Secret should be the same ones stored in your OAuth broker. If you need to create a new OAuth app, see [`OAUTH_CREDENTIALS_SETUP.md`](./OAUTH_CREDENTIALS_SETUP.md).

**For Google Calendar:**
- **OAuth Client ID**: Your Google OAuth Client ID (from Google Cloud Console)
- **OAuth Client Secret**: Your Google OAuth Client Secret (from Google Cloud Console)
- **Authorization URL**: `https://accounts.google.com/o/oauth2/v2/auth`
- **Token URL**: `https://oauth2.googleapis.com/token`
- **Scope**: `https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.file`
- **Redirect URI**: `https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/callback/google` (must match your Google OAuth App's redirect URI)

**Note:** The Client ID and Secret should be the same ones stored in your OAuth broker.

### Step 4: Add Actions

In the GPT configuration, go to "Actions" and add a new action:

**Action Configuration:**
- **Name**: MCP Gateway
- **Description**: Interact with MCP servers (GitHub, Calendar, etc.)
- **Base URL**: `https://mcp-gateway.YOUR_SUBDOMAIN.workers.dev`
- **Authentication**: OAuth (configured above - ChatGPT will handle OAuth and pass Bearer tokens)

**Endpoints to Add:**

1. **List Tools**
   - Method: POST
   - Path: `/mcp/sse`
   - Request Body:
     ```json
     {
       "jsonrpc": "2.0",
       "method": "tools/list",
       "id": 1
     }
     ```

2. **Call Tool**
   - Method: POST
   - Path: `/mcp/sse`
   - Request Body:
     ```json
     {
       "jsonrpc": "2.0",
       "method": "tools/call",
       "id": 2,
       "params": {
         "name": "tool_name",
         "arguments": {}
       }
     }
     ```

**Important:** ChatGPT will automatically add the `Authorization: Bearer <token>` header when OAuth is configured. The gateway will use this token directly instead of fetching from the OAuth broker.

**Endpoints to Add:**

1. **List Tools**
   - Method: POST
   - Path: `/mcp/sse`
   - Request Body:
     ```json
     {
       "jsonrpc": "2.0",
       "method": "tools/list",
       "id": 1
     }
     ```

2. **Call Tool**
   - Method: POST
   - Path: `/mcp/sse`
   - Request Body:
     ```json
     {
       "jsonrpc": "2.0",
       "method": "tools/call",
       "id": 2,
       "params": {
         "name": "tool_name",
         "arguments": {}
       }
     }
     ```

### Step 3: Test

Try prompts like:
- "List my GitHub repositories"
- "What's on my calendar today?"
- "Create a GitHub issue in personal-block-in-a-box: Test from ChatGPT"

## Option 2: Direct API Testing

You can test the gateway directly using curl or any HTTP client:

```bash
# List available tools
curl -X POST https://mcp-gateway.YOUR_SUBDOMAIN.workers.dev/mcp/sse \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'

# Call a tool
curl -X POST https://mcp-gateway.YOUR_SUBDOMAIN.workers.dev/mcp/sse \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "id": 2,
    "params": {
      "name": "list_repos",
      "arguments": {
        "owner": "jleacox",
        "type": "owner",
        "per_page": 5
      }
    }
  }'
```

## Option 3: Function Calling Wrapper (Advanced)

For a more native ChatGPT experience, you could create a wrapper service that:
1. Fetches tools from the MCP gateway
2. Converts them to ChatGPT function definitions
3. Handles function calls and routes them back to the gateway

This would require additional development but would provide a more seamless ChatGPT integration.

## Current Gateway Status

**Gateway URL:** `https://mcp-gateway.YOUR_SUBDOMAIN.workers.dev`

**Available Endpoints:**
- `GET /health` - Health check
- `GET /mcp/servers` - List available MCP servers
- `POST /mcp/sse` - MCP protocol endpoint (JSON-RPC 2.0)

**Available Tools:**
- 15 GitHub tools (issues, repos, PRs, Actions)
- 12 Google Calendar tools (events, calendars, etc.)

## Authentication

The gateway uses the OAuth broker for authentication:
- **OAuth Broker URL**: `https://oauth-broker.YOUR_SUBDOMAIN.workers.dev`
- **User ID**: `YOUR_USER_ID`
- Tokens are fetched automatically from the OAuth broker
- No client-side authentication needed

## Troubleshooting

**401 Authentication Errors:**
- Make sure you've completed the OAuth flow for GitHub/Google
- Run `npm run reauth:github` or `npm run reauth:google-all` if needed
- Check that the OAuth broker has your tokens stored

**Gateway Not Responding:**
- Check gateway health: `curl https://mcp-gateway.YOUR_SUBDOMAIN.workers.dev/health`
- Check gateway logs: `cd packages/mcp-gateway && wrangler tail`

**Tool Not Found:**
- List available tools first: `POST /mcp/sse` with `method: "tools/list"`
- Check tool name spelling and required parameters

## Next Steps

1. Test the gateway directly using curl/HTTP client
2. Create a Custom GPT with Actions pointing to the gateway
3. Test basic operations (list repos, list events)
4. Expand to more complex workflows

