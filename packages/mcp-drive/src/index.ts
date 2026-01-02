#!/usr/bin/env node

/**
 * Google Drive MCP Server (stdio transport for local development)
 * Cloudflare Workers compatible - uses Google Drive REST API with fetch
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DriveConfig } from './utils/drive-client.js';

// Import tools
import * as filesTools from './tools/files.js';

// Create MCP server
const server = new Server(
  {
    name: 'google-drive-mcp',
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
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const config: DriveConfig = {
    accessToken: process.env.GOOGLE_ACCESS_TOKEN,
    oauthBrokerUrl: process.env.OAUTH_BROKER_URL,
    userId: process.env.USER_ID,
  };

  try {
    let result;
    switch (name) {
      case 'read_file':
        result = await filesTools.readFile(config, args || {});
        break;
      case 'write_file':
        result = await filesTools.writeFile(config, args || {});
        break;
      case 'list_files':
        result = await filesTools.listFiles(config, args || {});
        break;
      case 'search':
        result = await filesTools.search(config, args || {});
        break;
      case 'createFolder':
        result = await filesTools.createFolder(config, args || {});
        break;
      case 'moveItem':
        result = await filesTools.moveItem(config, args || {});
        break;
      case 'renameItem':
        result = await filesTools.renameItem(config, args || {});
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

