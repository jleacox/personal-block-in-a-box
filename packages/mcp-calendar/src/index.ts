#!/usr/bin/env node

/**
 * Google Calendar MCP Server (stdio transport for local development)
 * Cloudflare Workers compatible - uses Google Calendar REST API with fetch
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { CalendarConfig } from './utils/calendar-client.js';

// Import tools
import * as eventsTools from './tools/events.js';

// Create MCP server
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

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_calendars',
        description: 'List all calendars accessible to the user',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_events',
        description: 'List calendar events. Supports filtering by time range and search query.',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: {
              type: 'string',
              description: 'Calendar ID (default: "primary")',
              default: 'primary',
            },
            timeMin: {
              type: 'string',
              description: 'Lower bound (exclusive) for an event\'s start time. ISO 8601 format (e.g., "2024-01-01T00:00:00Z")',
            },
            timeMax: {
              type: 'string',
              description: 'Upper bound (exclusive) for an event\'s end time. ISO 8601 format (e.g., "2024-12-31T23:59:59Z")',
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of events to return (default: 10, max: 2500)',
              default: 10,
            },
            q: {
              type: 'string',
              description: 'Free text search terms to find events that match these terms',
            },
          },
        },
      },
      {
        name: 'get_event',
        description: 'Get details of a specific calendar event',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: {
              type: 'string',
              description: 'Calendar ID (default: "primary")',
              default: 'primary',
            },
            eventId: {
              type: 'string',
              description: 'Event ID',
            },
          },
          required: ['eventId'],
        },
      },
      {
        name: 'create_event',
        description: 'Create a new calendar event',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: {
              type: 'string',
              description: 'Calendar ID (default: "primary")',
              default: 'primary',
            },
            summary: {
              type: 'string',
              description: 'Event title/summary',
            },
            description: {
              type: 'string',
              description: 'Event description',
            },
            start: {
              type: 'string',
              description: 'Event start time. ISO 8601 format for timed events (e.g., "2024-01-01T10:00:00Z") or date for all-day events (e.g., "2024-01-01")',
            },
            end: {
              type: 'string',
              description: 'Event end time. ISO 8601 format for timed events (e.g., "2024-01-01T11:00:00Z") or date for all-day events (e.g., "2024-01-02")',
            },
            location: {
              type: 'string',
              description: 'Event location',
            },
            attendees: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of attendee email addresses',
            },
            timeZone: {
              type: 'string',
              description: 'Time zone for the event (default: "UTC")',
              default: 'UTC',
            },
          },
          required: ['summary', 'start', 'end'],
        },
      },
      {
        name: 'update_event',
        description: 'Update an existing calendar event',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: {
              type: 'string',
              description: 'Calendar ID (default: "primary")',
              default: 'primary',
            },
            eventId: {
              type: 'string',
              description: 'Event ID',
            },
            summary: {
              type: 'string',
              description: 'New event title/summary',
            },
            description: {
              type: 'string',
              description: 'New event description',
            },
            start: {
              type: 'string',
              description: 'New event start time. ISO 8601 format for timed events or date for all-day events',
            },
            end: {
              type: 'string',
              description: 'New event end time. ISO 8601 format for timed events or date for all-day events',
            },
            location: {
              type: 'string',
              description: 'New event location',
            },
            timeZone: {
              type: 'string',
              description: 'Time zone for the event (default: "UTC")',
              default: 'UTC',
            },
          },
          required: ['eventId'],
        },
      },
      {
        name: 'delete_event',
        description: 'Delete a calendar event',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: {
              type: 'string',
              description: 'Calendar ID (default: "primary")',
              default: 'primary',
            },
            eventId: {
              type: 'string',
              description: 'Event ID',
            },
          },
          required: ['eventId'],
        },
      },
      {
        name: 'search_events',
        description: 'Search events by text query',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: {
              type: 'string',
              description: 'Calendar ID (default: "primary")',
              default: 'primary',
            },
            q: {
              type: 'string',
              description: 'Search query text',
            },
            timeMin: {
              type: 'string',
              description: 'Lower bound (exclusive) for an event\'s start time. ISO 8601 format',
            },
            timeMax: {
              type: 'string',
              description: 'Upper bound (exclusive) for an event\'s end time. ISO 8601 format',
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of events to return (default: 10)',
              default: 10,
            },
          },
          required: ['q'],
        },
      },
      {
        name: 'respond_to_event',
        description: 'Respond to event invitations (accept, decline, tentative, or no response)',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: {
              type: 'string',
              description: 'Calendar ID (default: "primary")',
              default: 'primary',
            },
            eventId: {
              type: 'string',
              description: 'Event ID',
            },
            response: {
              type: 'string',
              description: 'Response: "accepted", "declined", "tentative", or "needsAction"',
              enum: ['accepted', 'declined', 'tentative', 'needsAction'],
            },
            comment: {
              type: 'string',
              description: 'Optional comment to include with the response',
            },
          },
          required: ['eventId', 'response'],
        },
      },
      {
        name: 'get_freebusy',
        description: 'Check availability (free/busy) across calendars',
        inputSchema: {
          type: 'object',
          properties: {
            timeMin: {
              type: 'string',
              description: 'Start time (ISO 8601 format, e.g., "2024-01-01T00:00:00Z")',
            },
            timeMax: {
              type: 'string',
              description: 'End time (ISO 8601 format, e.g., "2024-01-31T23:59:59Z")',
            },
            calendarIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of calendar IDs to check (default: ["primary"])',
              default: ['primary'],
            },
          },
          required: ['timeMin', 'timeMax'],
        },
      },
      {
        name: 'get_current_time',
        description: 'Get current date and time in calendar\'s timezone',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: {
              type: 'string',
              description: 'Calendar ID (default: "primary")',
              default: 'primary',
            },
          },
        },
      },
      {
        name: 'list_colors',
        description: 'List available event and calendar colors',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'manage_accounts',
        description: 'Manage OAuth accounts (list connected accounts, get OAuth URL to add new account)',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              description: 'Action: "list" to check account status, "add" to get OAuth URL',
              enum: ['list', 'add'],
              default: 'list',
            },
            userId: {
              type: 'string',
              description: 'User ID to check or add (defaults to configured USER_ID)',
            },
          },
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

  try {
    let result;
    switch (name) {
      case 'list_calendars':
        result = await eventsTools.listCalendars(config, args || {});
        break;
      case 'list_events':
        result = await eventsTools.listEvents(config, args || {});
        break;
      case 'get_event':
        result = await eventsTools.getEvent(config, args || {});
        break;
      case 'create_event':
        result = await eventsTools.createEvent(config, args || {});
        break;
      case 'update_event':
        result = await eventsTools.updateEvent(config, args || {});
        break;
      case 'delete_event':
        result = await eventsTools.deleteEvent(config, args || {});
        break;
      case 'search_events':
        result = await eventsTools.searchEvents(config, args || {});
        break;
      case 'respond_to_event':
        result = await eventsTools.respondToEvent(config, args || {});
        break;
      case 'get_freebusy':
        result = await eventsTools.getFreebusy(config, args || {});
        break;
      case 'get_current_time':
        result = await eventsTools.getCurrentTime(config, args || {});
        break;
      case 'list_colors':
        result = await eventsTools.listColors(config, args || {});
        break;
      case 'manage_accounts':
        result = await eventsTools.manageAccounts(config, args || {});
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    return result;
  } catch (error: any) {
    return {
      content: [{ type: 'text' as const, text: `Error: ${error.message || 'Unknown error'}` }],
      isError: true,
    };
  }
});

// Start server
const transport = new StdioServerTransport();
server.connect(transport);

