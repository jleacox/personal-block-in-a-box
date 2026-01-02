/**
 * Supabase MCP Server (HTTP transport for Cloudflare Workers)
 * 
 * This is the entry point for Cloudflare Workers deployment.
 * Uses the same tool implementations as index.ts but with HTTP transport.
 */

import { SupabaseConfig } from './utils/supabase-client.js';

// Import tools (same as index.ts)
import * as databaseTools from './tools/database.js';

/**
 * List tools handler
 */
async function handleListTools(): Promise<any> {
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
}

/**
 * Handle tool call
 */
async function handleCallTool(
  request: { params: { name: string; arguments?: Record<string, any> } },
  env: any
): Promise<any> {
  const { name, arguments: args } = request.params;

  const config: SupabaseConfig = {
    supabaseUrl: env.SUPABASE_URL,
    supabaseKey: env.SUPABASE_KEY,
  };

  switch (name) {
    case 'query':
      return await databaseTools.query(config, args || {});
    case 'insert':
      return await databaseTools.insert(config, args || {});
    case 'update':
      return await databaseTools.update(config, args || {});
    case 'delete':
      return await databaseTools.deleteRows(config, args || {});
    case 'list_tables':
      return await databaseTools.listTables(config, args || {});
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

