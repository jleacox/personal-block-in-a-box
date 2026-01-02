# Google Calendar MCP Setup

## Quick Start

### 1. Build the Package

```powershell
cd packages\mcp-calendar
npm install
npm run build
```

### 2. Authentication Setup

**For Cursor (Local Development):**

You have two options:

#### Option A: OAuth Broker (Recommended for Consistency)

**Works from Cursor!** The OAuth broker runs on Cloudflare Workers, but Cursor can call it via HTTP.

1. Deploy OAuth broker to Cloudflare (one-time setup)
2. Connect your Google account via broker UI
3. Configure `OAUTH_BROKER_URL` and `USER_ID` in Cursor config
4. Done! Same setup works for Cursor, Cloudflare, and mobile

**Pros:** One setup for all environments, automatic refresh, secure
**Cons:** Requires broker deployment, needs internet connection

#### Option B: Direct Access Token (Simpler for Local-Only)

- Get a Google OAuth token with Calendar scope
- Set `GOOGLE_ACCESS_TOKEN` in Cursor config
- Works immediately, no broker needed

**Pros:** Fast setup, works offline
**Cons:** Manual token refresh, different from production setup

**Recommendation:** Use OAuth broker if you're building for production. Use direct token if you're just testing locally.

See `docs/setup/CURSOR_OAUTH_OPTIONS.md` for detailed comparison.

### 3. Update Cursor Config

Add to your `mcp.json`:

**With OAuth Broker (Recommended):**
```json
{
  "mcpServers": {
    "google-calendar": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-calendar/dist/index.js"],
      "env": {
        "OAUTH_BROKER_URL": "https://auth.yourdomain.com",
        "USER_ID": "YOUR_USER_ID"
      }
    }
  }
}
```

**With Direct Token (Temporary for local dev):**
```json
{
  "mcpServers": {
    "google-calendar": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-calendar/dist/index.js"],
      "env": {
        "GOOGLE_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

**Note**: OAuth broker takes priority. If both are set, broker is tried first, then falls back to direct token.

### 4. Restart Cursor

Restart Cursor to load the new MCP server.

### 5. Test

Try in Cursor:
- "List my calendar events for today"
- "Create a calendar event: Meeting at 2pm tomorrow"

## For Cloudflare Workers

The `worker.ts` file is ready for Cloudflare Workers deployment. Once the gateway is set up, you can:

1. Deploy the calendar worker
2. Add it to the gateway routing
3. Access it via claude.ai (automatically works in phone app!)

See `docs/setup/GOOGLE_CALENDAR_CLOUDFLARE.md` for details.

## Tools Available

- `list_events` - List events with optional filtering
- `get_event` - Get event details
- `create_event` - Create new event
- `update_event` - Update existing event
- `delete_event` - Delete event

## Differences from @cocal/google-calendar-mcp

- ✅ Uses Google Calendar REST API directly (no `googleapis` package)
- ✅ Cloudflare Workers compatible
- ✅ OAuth broker support
- ✅ Same dual transport pattern as GitHub MCP

