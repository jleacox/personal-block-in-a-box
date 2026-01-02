/**
 * Gmail MCP Server (HTTP transport for Cloudflare Workers)
 * 
 * This is the entry point for Cloudflare Workers deployment.
 * Uses the same tool implementations as index.ts but with HTTP transport.
 */

import { GmailConfig } from './utils/gmail-client.js';

// Import tools (same as index.ts)
import * as messagesTools from './tools/messages.js';
import * as labelsTools from './tools/labels.js';
import * as filtersTools from './tools/filters.js';
import * as extractDatesTools from './tools/extract-dates.js';

/**
 * List tools handler
 */
async function handleListTools(): Promise<any> {
  return {
    tools: [
      {
        name: 'search_emails',
        description: 'Search for emails using Gmail search syntax (e.g., "from:example@gmail.com", "has:attachment", "after:2024/01/01")',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            maxResults: { type: 'number', default: 10 },
          },
          required: ['query'],
        },
      },
      {
        name: 'read_email',
        description: 'Retrieves the content of a specific email by its ID. Includes attachment information and supports PDF parsing.',
        inputSchema: {
          type: 'object',
          properties: {
            messageId: { type: 'string' },
          },
          required: ['messageId'],
        },
      },
      {
        name: 'send_email',
        description: 'Sends a new email immediately. Supports plain text, HTML, multipart, and attachments.',
        inputSchema: {
          type: 'object',
          properties: {
            to: { type: 'array', items: { type: 'string' } },
            subject: { type: 'string' },
            body: { type: 'string' },
            htmlBody: { type: 'string' },
            mimeType: { type: 'string', enum: ['text/plain', 'text/html', 'multipart/alternative'], default: 'text/plain' },
            cc: { type: 'array', items: { type: 'string' } },
            bcc: { type: 'array', items: { type: 'string' } },
            threadId: { type: 'string' },
            inReplyTo: { type: 'string' },
            attachments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  content: { type: 'string' },
                  mimeType: { type: 'string' },
                },
                required: ['filename', 'content', 'mimeType'],
              },
            },
          },
          required: ['to', 'subject', 'body'],
        },
      },
      {
        name: 'draft_email',
        description: 'Creates a draft email without sending it. Supports same features as send_email.',
        inputSchema: {
          type: 'object',
          properties: {
            to: { type: 'array', items: { type: 'string' } },
            subject: { type: 'string' },
            body: { type: 'string' },
            htmlBody: { type: 'string' },
            mimeType: { type: 'string', enum: ['text/plain', 'text/html', 'multipart/alternative'], default: 'text/plain' },
            cc: { type: 'array', items: { type: 'string' } },
            bcc: { type: 'array', items: { type: 'string' } },
            threadId: { type: 'string' },
            inReplyTo: { type: 'string' },
            attachments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  content: { type: 'string' },
                  mimeType: { type: 'string' },
                },
                required: ['filename', 'content', 'mimeType'],
              },
            },
          },
          required: ['to', 'subject', 'body'],
        },
      },
      {
        name: 'modify_email',
        description: 'Modifies email labels (add/remove labels, move to different folders). To archive an email, remove the INBOX label.',
        inputSchema: {
          type: 'object',
          properties: {
            messageId: { type: 'string' },
            addLabelIds: { type: 'array', items: { type: 'string' } },
            removeLabelIds: { type: 'array', items: { type: 'string' }, description: 'List of label IDs to remove (e.g., ["INBOX"] to archive)' },
          },
          required: ['messageId'],
        },
      },
      {
        name: 'list_labels',
        description: 'Retrieves all available Gmail labels (system and user)',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'create_label',
        description: 'Creates a new Gmail label',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            messageListVisibility: { type: 'string', enum: ['show', 'hide'] },
            labelListVisibility: { type: 'string', enum: ['labelShow', 'labelShowIfUnread', 'labelHide'] },
          },
          required: ['name'],
        },
      },
      {
        name: 'update_label',
        description: 'Updates an existing Gmail label',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            messageListVisibility: { type: 'string', enum: ['show', 'hide'] },
            labelListVisibility: { type: 'string', enum: ['labelShow', 'labelShowIfUnread', 'labelHide'] },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_label',
        description: 'Deletes a Gmail label (user-created labels only)',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_or_create_label',
        description: 'Gets an existing label by name or creates it if it doesn\'t exist',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            messageListVisibility: { type: 'string', enum: ['show', 'hide'] },
            labelListVisibility: { type: 'string', enum: ['labelShow', 'labelShowIfUnread', 'labelHide'] },
          },
          required: ['name'],
        },
      },
      {
        name: 'list_filters',
        description: 'Retrieves all Gmail filters',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'create_filter',
        description: 'Creates a new Gmail filter with custom criteria and actions',
        inputSchema: {
          type: 'object',
          properties: {
            criteria: {
              type: 'object',
              properties: {
                from: { type: 'string' },
                to: { type: 'string' },
                subject: { type: 'string' },
                query: { type: 'string' },
                negatedQuery: { type: 'string' },
                hasAttachment: { type: 'boolean' },
                excludeChats: { type: 'boolean' },
                size: { type: 'number' },
                sizeComparison: { type: 'string', enum: ['unspecified', 'smaller', 'larger'] },
              },
            },
            action: {
              type: 'object',
              properties: {
                addLabelIds: { type: 'array', items: { type: 'string' } },
                removeLabelIds: { type: 'array', items: { type: 'string' } },
                forward: { type: 'string' },
              },
            },
          },
          required: ['criteria', 'action'],
        },
      },
      {
        name: 'get_filter',
        description: 'Gets details of a specific Gmail filter',
        inputSchema: {
          type: 'object',
          properties: {
            filterId: { type: 'string' },
          },
          required: ['filterId'],
        },
      },
      {
        name: 'delete_filter',
        description: 'Deletes a Gmail filter',
        inputSchema: {
          type: 'object',
          properties: {
            filterId: { type: 'string' },
          },
          required: ['filterId'],
        },
      },
      {
        name: 'create_filter_from_template',
        description: 'Creates a filter using a pre-defined template for common scenarios',
        inputSchema: {
          type: 'object',
          properties: {
            template: { type: 'string', enum: ['fromSender', 'withSubject', 'withAttachments', 'largeEmails', 'containingText', 'mailingList'] },
            parameters: {
              type: 'object',
              properties: {
                senderEmail: { type: 'string' },
                subjectText: { type: 'string' },
                searchText: { type: 'string' },
                listIdentifier: { type: 'string' },
                sizeInBytes: { type: 'number' },
                labelIds: { type: 'array', items: { type: 'string' } },
                archive: { type: 'boolean' },
                markAsRead: { type: 'boolean' },
                markImportant: { type: 'boolean' },
              },
            },
          },
          required: ['template', 'parameters'],
        },
      },
      {
        name: 'extract_dates_from_email',
        description: 'Extract dates and events from email content and PDF/image attachments. Uses Claude API for intelligent extraction, falls back to regex if needed.',
        inputSchema: {
          type: 'object',
          properties: {
            messageId: { type: 'string' },
            parseAttachments: { type: 'boolean' },
            useClaude: { type: 'boolean' },
          },
          required: ['messageId'],
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

  const config: GmailConfig = {
    accessToken: env.GOOGLE_ACCESS_TOKEN,
    oauthBrokerUrl: env.OAUTH_BROKER_URL,
    userId: env.USER_ID,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
  };

  switch (name) {
    case 'search_emails':
      return await messagesTools.searchEmails(config, args || {});
    case 'read_email':
      return await messagesTools.readEmail(config, args || {});
    case 'send_email':
      return await messagesTools.sendEmail(config, args || {});
    case 'draft_email':
      return await messagesTools.draftEmail(config, args || {});
    case 'modify_email':
      return await messagesTools.modifyEmail(config, args || {});
    case 'list_labels':
      return await labelsTools.listLabels(config, args || {});
    case 'create_label':
      return await labelsTools.createLabel(config, args || {});
    case 'update_label':
      return await labelsTools.updateLabel(config, args || {});
    case 'delete_label':
      return await labelsTools.deleteLabel(config, args || {});
    case 'get_or_create_label':
      return await labelsTools.getOrCreateLabel(config, args || {});
    case 'list_filters':
      return await filtersTools.listFilters(config, args || {});
    case 'create_filter':
      return await filtersTools.createFilter(config, args || {});
    case 'get_filter':
      return await filtersTools.getFilter(config, args || {});
    case 'delete_filter':
      return await filtersTools.deleteFilter(config, args || {});
    case 'create_filter_from_template':
      return await filtersTools.createFilterFromTemplate(config, args || {});
    case 'extract_dates_from_email':
      return await extractDatesTools.extractDatesFromEmail(config, args || {});
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

