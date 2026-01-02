# Google Calendar MCP Server

Cloudflare Workers compatible Google Calendar MCP server using REST API directly (no `googleapis` package).

## Features

- ✅ List calendars and events (with time range and search filtering)
- ✅ Get event details
- ✅ Create events (timed and all-day)
- ✅ Update events
- ✅ Delete events
- ✅ Search events by text query
- ✅ Respond to event invitations (accept/decline/tentative)
- ✅ Check free/busy availability
- ✅ Get current time in calendar timezone
- ✅ List available event colors
- ✅ OAuth broker support (with PAT fallback)
- ✅ Dual transport (stdio for local, HTTP for Cloudflare Workers)

## Installation

```bash
cd packages/mcp-calendar
npm install
npm run build
```

## Usage

### Local Development (stdio)

```bash
npm start
```

Configure in Cursor/Claude Desktop:
```json
{
  "mcpServers": {
    "google-calendar": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-calendar/dist/index.js"],
      "env": {
        "GOOGLE_ACCESS_TOKEN": "your-token-here",
        "OAUTH_BROKER_URL": "https://auth.yourdomain.com",
        "USER_ID": "YOUR_USER_ID"
      }
    }
  }
}
```

### Cloudflare Workers (HTTP)

Import in your Worker:
```typescript
import calendarWorker from './packages/mcp-calendar/src/worker.js';

export default calendarWorker;
```

## Tools

- `list_calendars` - List all calendars accessible to the user
- `list_events` - List calendar events with optional filtering
- `get_event` - Get details of a specific event
- `create_event` - Create a new calendar event
- `update_event` - Update an existing event
- `delete_event` - Delete an event
- `search_events` - Search events by text query
- `respond_to_event` - Respond to event invitations (accept, decline, tentative, or no response)
- `get_freebusy` - Check availability (free/busy) across calendars
- `get_current_time` - Get current date and time in calendar's timezone
- `list_colors` - List available event and calendar colors
- `manage_accounts` - Manage OAuth accounts (list connected accounts, get OAuth URL to add new account)

## Authentication

The Calendar MCP supports **two authentication methods**:

### Method 1: OAuth Broker (Recommended)

**Benefits:**
- ✅ No local credentials needed
- ✅ Automatic token refresh
- ✅ Multi-user support (just change `USER_ID`)
- ✅ Secure token storage in Cloudflare KV

**Configuration:**
```json
{
  "env": {
    "OAUTH_BROKER_URL": "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev",
    "USER_ID": "YOUR_USER_ID"
  }
}
```

### Method 2: Direct Access Token (Fallback)

**For local development or simple setups:**
```json
{
  "env": {
    "GOOGLE_ACCESS_TOKEN": "your-access-token-here"
  }
}
```

**Note:** Direct tokens require manual refresh when expired. Use OAuth broker for production!

**Priority:** OAuth broker is tried first, then falls back to direct token if broker is not configured.

## Cloudflare Workers Compatibility

✅ Uses Google Calendar REST API with `fetch` (no Node.js APIs)
✅ No `googleapis` package dependency
✅ Works on Cloudflare Workers

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Run
npm start
```

