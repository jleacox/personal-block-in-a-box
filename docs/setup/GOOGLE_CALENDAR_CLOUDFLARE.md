# Making Google Calendar MCP Available on Cloudflare

## The Problem

The `@cocal/google-calendar-mcp` package you're using in Cursor likely uses the `googleapis` npm package, which **is NOT compatible** with Cloudflare Workers (requires Node.js APIs).

## Solution: Port to TypeScript for Cloudflare Workers

Follow the same pattern as the GitHub MCP - create a TypeScript implementation that uses Google Calendar REST API directly with `fetch` (Cloudflare Workers compatible).

## Step 1: Create Calendar MCP Package

Create a new package following the GitHub MCP pattern:

```powershell
# From project root
mkdir packages\mcp-calendar
cd packages\mcp-calendar
npm init -y
```

## Step 2: Set Up Package Structure

Create `packages/mcp-calendar/package.json`:

```json
{
  "name": "@personal-block-in-a-box/mcp-calendar",
  "version": "0.1.0",
  "description": "Google Calendar MCP server - Cloudflare Workers compatible",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## Step 3: Create TypeScript Config

Create `packages/mcp-calendar/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## Step 4: Create Google Calendar Client

Create `packages/mcp-calendar/src/utils/calendar-client.ts`:

```typescript
/**
 * Google Calendar API client using REST API (Cloudflare Workers compatible)
 * Uses fetch instead of googleapis package
 */

export interface CalendarConfig {
  accessToken?: string;
  oauthBrokerUrl?: string;
  userId?: string;
}

/**
 * Get access token from OAuth broker or direct token
 */
async function getAccessToken(
  oauthBrokerUrl?: string,
  userId?: string,
  directToken?: string
): Promise<string | undefined> {
  // Try OAuth broker first
  if (oauthBrokerUrl && userId) {
    try {
      const response = await fetch(`${oauthBrokerUrl}/token/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.access_token;
      }
    } catch (error) {
      console.error('Failed to fetch token from OAuth broker:', error);
    }
  }

  // Fall back to direct token
  return directToken || process.env.GOOGLE_ACCESS_TOKEN;
}

/**
 * Make authenticated request to Google Calendar API
 */
export async function calendarRequest(
  endpoint: string,
  config: CalendarConfig,
  options: RequestInit = {}
): Promise<any> {
  const token = await getAccessToken(
    config.oauthBrokerUrl,
    config.userId,
    config.accessToken
  );

  if (!token) {
    throw new Error('No Google Calendar access token available');
  }

  const url = `https://www.googleapis.com/calendar/v3${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Google Calendar API error: ${response.status} ${error.message || response.statusText}`);
  }

  return response.json();
}
```

## Step 5: Create Calendar Tools

Create `packages/mcp-calendar/src/tools/events.ts`:

```typescript
import { calendarRequest, CalendarConfig } from '../utils/calendar-client.js';
import { requiredParam, optionalParam } from '../utils/validation.js';
import { handleError } from '../utils/errors.js';

export interface CallToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * List calendar events
 */
export async function listEvents(
  config: CalendarConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const calendarId = optionalParam<string>(args, 'calendarId', 'primary');
    const timeMin = optionalParam<string>(args, 'timeMin');
    const timeMax = optionalParam<string>(args, 'timeMax');
    const maxResults = optionalParam<number>(args, 'maxResults', 10);

    const params = new URLSearchParams({
      maxResults: String(maxResults),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (timeMin) params.set('timeMin', timeMin);
    if (timeMax) params.set('timeMax', timeMax);

    const data = await calendarRequest(
      `/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      config
    );

    const events = data.items || [];
    const summary = events.map((event: any) => {
      const start = event.start?.dateTime || event.start?.date;
      return `- ${event.summary || '(No title)'} (${start})`;
    }).join('\n');

    return {
      content: [{
        type: 'text',
        text: `Found ${events.length} events:\n\n${summary || 'No events found'}`,
      }],
    };
  } catch (error: any) {
    return handleError(error);
  }
}

/**
 * Create calendar event
 */
export async function createEvent(
  config: CalendarConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const calendarId = optionalParam<string>(args, 'calendarId', 'primary');
    const summary = requiredParam<string>(args, 'summary');
    const description = optionalParam<string>(args, 'description');
    const start = requiredParam<string>(args, 'start');
    const end = requiredParam<string>(args, 'end');
    const location = optionalParam<string>(args, 'location');

    const event = {
      summary,
      description,
      start: {
        dateTime: start,
        timeZone: 'UTC',
      },
      end: {
        dateTime: end,
        timeZone: 'UTC',
      },
      location,
    };

    const data = await calendarRequest(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      config,
      {
        method: 'POST',
        body: JSON.stringify(event),
      }
    );

    return {
      content: [{
        type: 'text',
        text: `Created event: ${data.summary}\nStart: ${data.start.dateTime}\nLink: ${data.htmlLink}`,
      }],
    };
  } catch (error: any) {
    return handleError(error);
  }
}
```

## Step 6: Create stdio Transport (Local)

Create `packages/mcp-calendar/src/index.ts`:

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { CalendarConfig } from './utils/calendar-client.js';
import * as eventsTools from './tools/events.js';

const server = new Server(
  {
    name: 'google-calendar-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_events',
        description: 'List calendar events',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: { type: 'string', default: 'primary' },
            timeMin: { type: 'string' },
            timeMax: { type: 'string' },
            maxResults: { type: 'number', default: 10 },
          },
        },
      },
      {
        name: 'create_event',
        description: 'Create a calendar event',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: { type: 'string', default: 'primary' },
            summary: { type: 'string' },
            description: { type: 'string' },
            start: { type: 'string' },
            end: { type: 'string' },
            location: { type: 'string' },
          },
          required: ['summary', 'start', 'end'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const config: CalendarConfig = {
    accessToken: process.env.GOOGLE_ACCESS_TOKEN,
    oauthBrokerUrl: process.env.OAUTH_BROKER_URL,
    userId: process.env.USER_ID,
  };

  switch (name) {
    case 'list_events':
      return await eventsTools.listEvents(config, args);
    case 'create_event':
      return await eventsTools.createEvent(config, args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start server
const transport = new StdioServerTransport();
server.connect(transport);
```

## Step 7: Create HTTP Transport (Cloudflare Workers)

Create `packages/mcp-calendar/src/worker.ts` following the pattern from `packages/mcp-github/src/worker.ts`.

## Step 8: Update Cursor Config

Update your Cursor `mcp.json` to use the local version:

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

## Step 9: Add to Gateway

Once the gateway is built, add calendar routing to `packages/mcp-gateway/src/index.ts`.

## Quick Start

1. Create the package structure (Steps 1-3)
2. Copy utility files from `mcp-github` (validation, errors)
3. Implement calendar tools using REST API (Steps 4-5)
4. Create stdio transport (Step 6)
5. Create HTTP transport (Step 7)
6. Build and test locally
7. Deploy to Cloudflare Workers

## Key Differences from @cocal/google-calendar-mcp

- ✅ Uses Google Calendar REST API directly (no `googleapis` package)
- ✅ Cloudflare Workers compatible
- ✅ OAuth broker support
- ✅ Same dual transport pattern as GitHub MCP

## Reference

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [GitHub MCP Implementation](../development/PORTING.md) - Use as reference for structure

