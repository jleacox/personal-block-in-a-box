# Setting Up Remote MCPs in Claude.ai

## Discovery

🎉 **Remote MCPs added to claude.ai automatically work in the Claude phone app!**

This means you don't need a separate voice app or SystemPrompt.io. Once you add a remote MCP to claude.ai, it's automatically available in the Claude phone app.

## Setup Process

### 1. Deploy MCP Gateway to Cloudflare Workers

First, deploy your MCP gateway to Cloudflare Workers:

```powershell
cd packages\mcp-gateway
wrangler deploy
```

This gives you a URL like: `https://your-gateway.your-subdomain.workers.dev`

### 2. Add Remote MCP in Claude.ai

1. Go to [claude.ai](https://claude.ai)
2. Click on your profile/settings
3. Navigate to "MCP Servers" or "Custom Tools"
4. Add a new remote MCP server:
   - **Name**: GitHub MCP (or whatever you want)
   - **URL**: `https://your-gateway.your-subdomain.workers.dev/mcp/github`
   - **Authentication**: Bearer token (if required)

### 3. Test in Claude.ai

Try using the MCP tools in a conversation:
- "List my GitHub repositories"
- "Create a GitHub issue in personal-block-in-a-box: Test issue"

### 4. Use in Claude Phone App

**The MCP automatically appears in the Claude phone app!** No additional setup needed.

Just open the Claude phone app and the same tools are available.

## Architecture

```
Claude.ai (web)
  ↓
Remote MCP URL → Cloudflare Worker Gateway
  ↓
Routes to appropriate MCP server
  ↓
Returns results

Claude Phone App
  ↓
Same remote MCP URL (synced automatically)
  ↓
Same Cloudflare Worker Gateway
  ↓
Same results
```

## Benefits

1. **No separate voice app needed** - Claude phone app works out of the box
2. **Automatic sync** - Add once in claude.ai, works everywhere
3. **Simple setup** - Just deploy gateway and add URL
4. **Consistent experience** - Same tools in web and mobile

## Authentication

For remote MCPs, you'll typically use:
- **OAuth Broker**: Central token management (recommended)
- **Bearer Token**: Direct token in gateway configuration

See [`../architecture/OAUTH_BROKER.md`](../architecture/OAUTH_BROKER.md) for OAuth broker setup.

## Next Steps

1. Deploy gateway to Cloudflare Workers
2. Add remote MCP URL to claude.ai
3. Test in Claude.ai web interface
4. Test in Claude phone app (should work automatically!)

