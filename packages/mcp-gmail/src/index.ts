#!/usr/bin/env node

/**
 * Gmail MCP Server (stdio transport for local development)
 * Cloudflare Workers compatible - uses Gmail REST API with fetch
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { GmailConfig } from './utils/gmail-client.js';

// Import tools
import * as messagesTools from './tools/messages.js';
import * as labelsTools from './tools/labels.js';
import * as filtersTools from './tools/filters.js';
import * as extractDatesTools from './tools/extract-dates.js';

// Create MCP server
const server = new Server(
  {
    name: 'gmail-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Get config from environment
function getConfig(): GmailConfig {
  return {
    accessToken: typeof process !== 'undefined' ? process.env.GOOGLE_ACCESS_TOKEN : undefined,
    oauthBrokerUrl: typeof process !== 'undefined' ? process.env.OAUTH_BROKER_URL : undefined,
    userId: typeof process !== 'undefined' ? process.env.USER_ID : undefined,
    anthropicApiKey: typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : undefined,
  };
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_emails',
        description: 'Search for emails using Gmail search syntax (e.g., "from:example@gmail.com", "has:attachment", "after:2024/01/01")',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Gmail search query (e.g., "from:sender@example.com", "has:attachment", "subject:meeting")',
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results to return (default: 10, max: 100)',
              default: 10,
            },
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
            messageId: {
              type: 'string',
              description: 'ID of the email message to retrieve',
            },
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
            to: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of recipient email addresses',
            },
            subject: {
              type: 'string',
              description: 'Email subject',
            },
            body: {
              type: 'string',
              description: 'Email body content (used for text/plain or when htmlBody not provided)',
            },
            htmlBody: {
              type: 'string',
              description: 'HTML version of the email body',
            },
            mimeType: {
              type: 'string',
              enum: ['text/plain', 'text/html', 'multipart/alternative'],
              description: 'Email content type (default: "text/plain")',
              default: 'text/plain',
            },
            cc: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of CC recipients',
            },
            bcc: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of BCC recipients',
            },
            threadId: {
              type: 'string',
              description: 'Thread ID to reply to',
            },
            inReplyTo: {
              type: 'string',
              description: 'Message ID being replied to',
            },
            attachments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  content: { type: 'string', description: 'Base64-encoded file content' },
                  mimeType: { type: 'string' },
                },
                required: ['filename', 'content', 'mimeType'],
              },
              description: 'List of file attachments (base64-encoded content)',
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
            to: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of recipient email addresses',
            },
            subject: {
              type: 'string',
              description: 'Email subject',
            },
            body: {
              type: 'string',
              description: 'Email body content',
            },
            htmlBody: {
              type: 'string',
              description: 'HTML version of the email body',
            },
            mimeType: {
              type: 'string',
              enum: ['text/plain', 'text/html', 'multipart/alternative'],
              description: 'Email content type (default: "text/plain")',
              default: 'text/plain',
            },
            cc: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of CC recipients',
            },
            bcc: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of BCC recipients',
            },
            threadId: {
              type: 'string',
              description: 'Thread ID to reply to',
            },
            inReplyTo: {
              type: 'string',
              description: 'Message ID being replied to',
            },
            attachments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  content: { type: 'string', description: 'Base64-encoded file content' },
                  mimeType: { type: 'string' },
                },
                required: ['filename', 'content', 'mimeType'],
              },
              description: 'List of file attachments (base64-encoded content)',
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
            messageId: {
              type: 'string',
              description: 'ID of the email message to modify',
            },
            addLabelIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of label IDs to add to the message',
            },
            removeLabelIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of label IDs to remove from the message (e.g., ["INBOX"] to archive)',
            },
          },
          required: ['messageId'],
        },
      },
      {
        name: 'list_labels',
        description: 'Retrieves all available Gmail labels (system and user)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_label',
        description: 'Creates a new Gmail label',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name for the new label',
            },
            messageListVisibility: {
              type: 'string',
              enum: ['show', 'hide'],
              description: 'Whether to show or hide the label in the message list',
            },
            labelListVisibility: {
              type: 'string',
              enum: ['labelShow', 'labelShowIfUnread', 'labelHide'],
              description: 'Visibility of the label in the label list',
            },
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
            id: {
              type: 'string',
              description: 'ID of the label to update',
            },
            name: {
              type: 'string',
              description: 'New name for the label',
            },
            messageListVisibility: {
              type: 'string',
              enum: ['show', 'hide'],
              description: 'Whether to show or hide the label in the message list',
            },
            labelListVisibility: {
              type: 'string',
              enum: ['labelShow', 'labelShowIfUnread', 'labelHide'],
              description: 'Visibility of the label in the label list',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_label',
        description: 'Deletes a Gmail label (user-created labels only, system labels cannot be deleted)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID of the label to delete',
            },
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
            name: {
              type: 'string',
              description: 'Name of the label to get or create',
            },
            messageListVisibility: {
              type: 'string',
              enum: ['show', 'hide'],
              description: 'Whether to show or hide the label in the message list (used when creating)',
            },
            labelListVisibility: {
              type: 'string',
              enum: ['labelShow', 'labelShowIfUnread', 'labelHide'],
              description: 'Visibility of the label in the label list (used when creating)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'list_filters',
        description: 'Retrieves all Gmail filters',
        inputSchema: {
          type: 'object',
          properties: {},
        },
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
              description: 'Criteria for matching emails',
            },
            action: {
              type: 'object',
              properties: {
                addLabelIds: { type: 'array', items: { type: 'string' } },
                removeLabelIds: { type: 'array', items: { type: 'string' } },
                forward: { type: 'string' },
              },
              description: 'Actions to perform on matching emails',
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
            filterId: {
              type: 'string',
              description: 'ID of the filter to retrieve',
            },
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
            filterId: {
              type: 'string',
              description: 'ID of the filter to delete',
            },
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
            template: {
              type: 'string',
              enum: ['fromSender', 'withSubject', 'withAttachments', 'largeEmails', 'containingText', 'mailingList'],
              description: 'Pre-defined filter template to use',
            },
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
              description: 'Template-specific parameters',
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
            messageId: {
              type: 'string',
              description: 'ID of the email message to extract dates from',
            },
            parseAttachments: {
              type: 'boolean',
              description: 'Parse PDF and image attachments (default: true)',
            },
            useClaude: {
              type: 'boolean',
              description: 'Use Claude API for extraction (default: true, falls back to regex if false or unavailable)',
            },
          },
          required: ['messageId'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const config = getConfig();

  try {
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
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
const transport = new StdioServerTransport();
server.connect(transport);

