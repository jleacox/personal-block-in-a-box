/**
 * Google Drive MCP Server (HTTP transport for Cloudflare Workers)
 * 
 * This is the entry point for Cloudflare Workers deployment.
 * Uses the same tool implementations as index.ts but with HTTP transport.
 */

import { DriveConfig } from './utils/drive-client.js';

// Import tools (same as index.ts)
import * as filesTools from './tools/files.js';

/**
 * List tools handler
 */
async function handleListTools(): Promise<any> {
  return {
    tools: [
      {
        name: 'read_file',
        description: 'Read a file from Google Drive. Supports both regular files and Google Docs (exports to markdown).',
        inputSchema: {
          type: 'object',
          properties: {
            fileId: {
              type: 'string',
              description: 'File ID from Google Drive',
            },
          },
          required: ['fileId'],
        },
      },
      {
        name: 'write_file',
        description: 'Write or update a file in Google Drive. Creates new file if fileId not provided, updates existing file if fileId provided.',
        inputSchema: {
          type: 'object',
          properties: {
            fileName: {
              type: 'string',
              description: 'File name (e.g., "notes.md", "document.txt")',
            },
            content: {
              type: 'string',
              description: 'File content',
            },
            fileId: {
              type: 'string',
              description: 'File ID to update (optional - if not provided, creates new file)',
            },
            parentFolderId: {
              type: 'string',
              description: 'Parent folder ID (optional - if not provided, file is created in root)',
            },
          },
          required: ['fileName', 'content'],
        },
      },
      {
        name: 'list_files',
        description: 'List files in a folder. Supports listing root folder or specific folder, and search query to find files by name.',
        inputSchema: {
          type: 'object',
          properties: {
            folderId: {
              type: 'string',
              description: 'Folder ID (optional - defaults to root if not provided)',
            },
            query: {
              type: 'string',
              description: 'Search query to find files by name (optional)',
            },
            pageSize: {
              type: 'number',
              description: 'Maximum number of files to return (optional, default: 50, max: 100)',
              default: 50,
            },
          },
        },
      },
      {
        name: 'search',
        description: 'Search for files across Google Drive. Searches across entire Drive (not limited to a folder) using full-text search.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (searches file names and content)',
            },
            pageSize: {
              type: 'number',
              description: 'Maximum number of results to return (optional, default: 50, max: 100)',
              default: 50,
            },
            pageToken: {
              type: 'string',
              description: 'Token for next page of results (optional)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'createFolder',
        description: 'Create a new folder in Google Drive. Creates folder in root if parentFolderId not provided.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Folder name',
            },
            parentFolderId: {
              type: 'string',
              description: 'Parent folder ID (optional - if not provided, folder is created in root)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'moveItem',
        description: 'Move a file or folder to a different location. Useful for organizing files after upload or reorganizing folder structure.',
        inputSchema: {
          type: 'object',
          properties: {
            itemId: {
              type: 'string',
              description: 'ID of the file or folder to move',
            },
            destinationFolderId: {
              type: 'string',
              description: 'Destination folder ID (optional - if not provided, moves to root)',
            },
          },
          required: ['itemId'],
        },
      },
      {
        name: 'renameItem',
        description: 'Rename a file or folder. Useful when file names need to change or be corrected.',
        inputSchema: {
          type: 'object',
          properties: {
            itemId: {
              type: 'string',
              description: 'ID of the file or folder to rename',
            },
            newName: {
              type: 'string',
              description: 'New name for the file or folder',
            },
          },
          required: ['itemId', 'newName'],
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

  const config: DriveConfig = {
    accessToken: env.GOOGLE_ACCESS_TOKEN,
    oauthBrokerUrl: env.OAUTH_BROKER_URL,
    userId: env.USER_ID,
  };

  switch (name) {
    case 'read_file':
      return await filesTools.readFile(config, args || {});
    case 'write_file':
      return await filesTools.writeFile(config, args || {});
    case 'list_files':
      return await filesTools.listFiles(config, args || {});
    case 'search':
      return await filesTools.search(config, args || {});
    case 'createFolder':
      return await filesTools.createFolder(config, args || {});
    case 'moveItem':
      return await filesTools.moveItem(config, args || {});
    case 'renameItem':
      return await filesTools.renameItem(config, args || {});
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

