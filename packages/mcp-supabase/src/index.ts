#!/usr/bin/env node

/**
 * Supabase MCP Server (stdio transport for local development)
 * Cloudflare Workers compatible - uses @supabase/supabase-js with fetch
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SupabaseConfig } from './utils/supabase-client.js';

// Import tools
import * as databaseTools from './tools/database.js';

// Create MCP server
const server = new Server(
  {
    name: 'supabase-mcp',
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
        name: 'query',
        description: 'Query data from a Supabase table. Supports filtering, ordering, and pagination.',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name',
            },
            select: {
              type: 'string',
              description: 'Columns to select (default: "*")',
              default: '*',
            },
            filter: {
              type: 'object',
              description: 'Filter conditions (e.g., { "id": { "eq": 1 }, "name": { "like": "%test%" } })',
            },
            orderBy: {
              type: 'string',
              description: 'Column to order by',
            },
            orderAscending: {
              type: 'boolean',
              description: 'Order ascending (default: true)',
              default: true,
            },
            limit: {
              type: 'number',
              description: 'Maximum number of rows to return',
            },
            offset: {
              type: 'number',
              description: 'Number of rows to skip',
            },
          },
          required: ['table'],
        },
      },
      {
        name: 'insert',
        description: 'Insert rows into a Supabase table.',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name',
            },
            rows: {
              type: 'array',
              description: 'Array of row objects to insert',
              items: {
                type: 'object',
              },
            },
          },
          required: ['table', 'rows'],
        },
      },
      {
        name: 'update',
        description: 'Update rows in a Supabase table.',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name',
            },
            values: {
              type: 'object',
              description: 'Values to update',
            },
            filter: {
              type: 'object',
              description: 'Filter conditions to identify rows to update',
            },
          },
          required: ['table', 'values', 'filter'],
        },
      },
      {
        name: 'delete',
        description: 'Delete rows from a Supabase table.',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name',
            },
            filter: {
              type: 'object',
              description: 'Filter conditions to identify rows to delete',
            },
          },
          required: ['table', 'filter'],
        },
      },
      {
        name: 'list_tables',
        description: 'List all tables in the public schema. Requires the list_tables() RPC function to be installed in Supabase (see sql/list_tables.sql).',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const config: SupabaseConfig = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
  };

  try {
    let result;
    switch (name) {
      case 'query':
        result = await databaseTools.query(config, args || {});
        break;
      case 'insert':
        result = await databaseTools.insert(config, args || {});
        break;
      case 'update':
        result = await databaseTools.update(config, args || {});
        break;
      case 'delete':
        result = await databaseTools.deleteRows(config, args || {});
        break;
      case 'list_tables':
        result = await databaseTools.listTables(config, args || {});
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

