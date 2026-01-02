/**
 * Google Calendar MCP Server (HTTP transport for Cloudflare Workers)
 * 
 * This is the entry point for Cloudflare Workers deployment.
 * Uses the same tool implementations as index.ts but with HTTP transport.
 */

import { CalendarConfig } from './utils/calendar-client.js';

// Import tools (same as index.ts)
import * as eventsTools from './tools/events.js';

/**
 * List tools handler
 */
async function handleListTools(): Promise<any> {
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
            calendarId: { type: 'string', default: 'primary' },
            timeMin: { type: 'string' },
            timeMax: { type: 'string' },
            maxResults: { type: 'number', default: 10 },
            q: { type: 'string' },
          },
        },
      },
      {
        name: 'get_event',
        description: 'Get details of a specific calendar event',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: { type: 'string', default: 'primary' },
            eventId: { type: 'string' },
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
            calendarId: { type: 'string', default: 'primary' },
            summary: { type: 'string' },
            description: { type: 'string' },
            start: { type: 'string' },
            end: { type: 'string' },
            location: { type: 'string' },
            attendees: { type: 'array', items: { type: 'string' } },
            timeZone: { type: 'string', default: 'UTC' },
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
            calendarId: { type: 'string', default: 'primary' },
            eventId: { type: 'string' },
            summary: { type: 'string' },
            description: { type: 'string' },
            start: { type: 'string' },
            end: { type: 'string' },
            location: { type: 'string' },
            timeZone: { type: 'string', default: 'UTC' },
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
            calendarId: { type: 'string', default: 'primary' },
            eventId: { type: 'string' },
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
            calendarId: { type: 'string', default: 'primary' },
            q: { type: 'string' },
            timeMin: { type: 'string' },
            timeMax: { type: 'string' },
            maxResults: { type: 'number', default: 10 },
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
            calendarId: { type: 'string', default: 'primary' },
            eventId: { type: 'string' },
            response: { type: 'string', enum: ['accepted', 'declined', 'tentative', 'needsAction'] },
            comment: { type: 'string' },
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
            timeMin: { type: 'string' },
            timeMax: { type: 'string' },
            calendarIds: { type: 'array', items: { type: 'string' }, default: ['primary'] },
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
            calendarId: { type: 'string', default: 'primary' },
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
            action: { type: 'string', enum: ['list', 'add'], default: 'list' },
            userId: { type: 'string' },
          },
        },
      },
    ],
  };
}

/**
 * Handle tool call
 */
async function handleCallTool(
  request: { params: { name: string; arguments?: Record<string, any> } },
  env: any
): Promise<any> {
  const { name, arguments: args } = request.params;

  const config: CalendarConfig = {
    accessToken: env.GOOGLE_ACCESS_TOKEN,
    oauthBrokerUrl: env.OAUTH_BROKER_URL,
    userId: env.USER_ID,
  };

  switch (name) {
    case 'list_calendars':
      return await eventsTools.listCalendars(config, args || {});
    case 'list_events':
      return await eventsTools.listEvents(config, args || {});
    case 'get_event':
      return await eventsTools.getEvent(config, args || {});
    case 'create_event':
      return await eventsTools.createEvent(config, args || {});
    case 'update_event':
      return await eventsTools.updateEvent(config, args || {});
    case 'delete_event':
      return await eventsTools.deleteEvent(config, args || {});
    case 'search_events':
      return await eventsTools.searchEvents(config, args || {});
    case 'respond_to_event':
      return await eventsTools.respondToEvent(config, args || {});
    case 'get_freebusy':
      return await eventsTools.getFreebusy(config, args || {});
    case 'get_current_time':
      return await eventsTools.getCurrentTime(config, args || {});
    case 'list_colors':
      return await eventsTools.listColors(config, args || {});
    case 'manage_accounts':
      return await eventsTools.manageAccounts(config, args || {});
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Cloudflare Worker export
 */
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }

      // Only allow POST requests
      if (request.method !== 'POST') {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32600, message: 'Invalid Request: Only POST method allowed' },
            id: null,
          }),
          {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Parse JSON-RPC request
      const jsonRpcRequest = await request.json();

      if (!jsonRpcRequest.jsonrpc || jsonRpcRequest.jsonrpc !== '2.0') {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
            id: jsonRpcRequest.id || null,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      let result: any;

      // Handle MCP methods
      if (jsonRpcRequest.method === 'tools/list') {
        result = await handleListTools();
      } else if (jsonRpcRequest.method === 'tools/call') {
        // Create a request object matching the schema
        const mcpRequest = {
          params: jsonRpcRequest.params || {},
        };
        result = await handleCallTool(mcpRequest, env);
      } else {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32601, message: `Method not found: ${jsonRpcRequest.method}` },
            id: jsonRpcRequest.id || null,
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Return JSON-RPC response
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          result,
          id: jsonRpcRequest.id || null,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } catch (error: any) {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: error.message || 'Internal server error',
          },
          id: null,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

