/**
 * MCP Handlers for Gateway
 * 
 * Imports tool functions directly from MCP packages
 * No HTTP calls - direct function calls for better performance
 */

import { Octokit } from '@octokit/rest';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { Fetcher } from '@cloudflare/workers-types';
import { getOctokit } from '../../mcp-github/src/utils/octokit.js';
import { CalendarConfig } from '../../mcp-calendar/src/utils/calendar-client.js';
import { GmailConfig } from '../../mcp-gmail/src/utils/gmail-client.js';
import { DriveConfig } from '../../mcp-drive/src/utils/drive-client.js';
import { SupabaseConfig } from '../../mcp-supabase/src/utils/supabase-client.js';

// Import GitHub tools
import * as githubIssues from '../../mcp-github/src/tools/issues.js';
import * as githubRepos from '../../mcp-github/src/tools/repositories.js';
import * as githubPRs from '../../mcp-github/src/tools/pull-requests.js';
import * as githubActions from '../../mcp-github/src/tools/actions.js';
import * as githubFiles from '../../mcp-github/src/tools/files.js';

// Import Calendar tools
import * as calendarEvents from '../../mcp-calendar/src/tools/events.js';

// Import Gmail tools
import * as gmailMessages from '../../mcp-gmail/src/tools/messages.js';
import * as gmailLabels from '../../mcp-gmail/src/tools/labels.js';
import * as gmailFilters from '../../mcp-gmail/src/tools/filters.js';
import * as gmailExtractDates from '../../mcp-gmail/src/tools/extract-dates.js';

// Import Drive tools
import * as driveFiles from '../../mcp-drive/src/tools/files.js';

// Import Supabase tools
import * as databaseTools from '../../mcp-supabase/src/tools/database.js';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

// Use CallToolResult from MCP SDK for type compatibility
export type MCPToolResult = CallToolResult;

/**
 * GitHub MCP Handler
 */
export class GitHubMCP {
  private octokit: Octokit | null = null;
  private oauthBrokerUrl?: string;
  private userId?: string;
  private githubToken?: string;
  private env?: { OAUTH_BROKER?: Fetcher };

  constructor(
    githubToken?: string,
    oauthBrokerUrl?: string,
    userId?: string,
    env?: { OAUTH_BROKER?: Fetcher }
  ) {
    this.githubToken = githubToken;
    this.oauthBrokerUrl = oauthBrokerUrl;
    this.userId = userId;
    this.env = env;
  }

  private async getOctokit(): Promise<Octokit> {
    if (!this.octokit) {
      console.log(`[GitHubMCP] Creating Octokit instance...`);
      console.log(`[GitHubMCP] Config:`, {
        hasDirectToken: !!this.githubToken,
        oauthBrokerUrl: this.oauthBrokerUrl || 'not set',
        userId: this.userId || 'not set',
        hasServiceBinding: !!this.env?.OAUTH_BROKER,
      });
      this.octokit = await getOctokit(
        this.githubToken,
        this.oauthBrokerUrl,
        this.userId,
        this.env
      );
      console.log(`[GitHubMCP] Octokit instance created`);
    }
    return this.octokit;
  }

  async listTools(): Promise<MCPTool[]> {
    // Return all GitHub tools
    return [
      // Issues
      {
        name: 'create_issue',
        description: 'Create a new GitHub issue',
        inputSchema: {
          type: 'object',
          properties: {
            repo: { type: 'string' },
            title: { type: 'string' },
            body: { type: 'string' },
            labels: { type: 'array', items: { type: 'string' } },
            assignees: { type: 'array', items: { type: 'string' } },
          },
          required: ['repo', 'title'],
        },
      },
      {
        name: 'list_issues',
        description: 'List issues in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            state: { type: 'string', enum: ['open', 'closed', 'all'] },
            page: { type: 'number' },
            per_page: { type: 'number' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'get_issue',
        description: 'Get details of a specific issue',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            issue_number: { type: 'number' },
          },
          required: ['owner', 'repo', 'issue_number'],
        },
      },
      {
        name: 'update_issue',
        description: 'Update an existing issue',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            issue_number: { type: 'number' },
            title: { type: 'string' },
            body: { type: 'string' },
            state: { type: 'string', enum: ['open', 'closed'] },
          },
          required: ['owner', 'repo', 'issue_number'],
        },
      },
      {
        name: 'add_issue_comment',
        description: 'Add a comment to an issue',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            issue_number: { type: 'number' },
            body: { type: 'string' },
          },
          required: ['owner', 'repo', 'issue_number', 'body'],
        },
      },
      // Repositories
      {
        name: 'list_repos',
        description: 'List repositories',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            type: { type: 'string', enum: ['all', 'owner', 'member'] },
            page: { type: 'number' },
            per_page: { type: 'number' },
          },
          required: ['owner'],
        },
      },
      {
        name: 'get_repo',
        description: 'Get details of a specific repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
          },
          required: ['owner', 'repo'],
        },
      },
      // Pull Requests
      {
        name: 'create_pr',
        description: 'Create a new pull request',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            title: { type: 'string' },
            head: { type: 'string' },
            base: { type: 'string' },
            body: { type: 'string' },
          },
          required: ['owner', 'repo', 'title', 'head', 'base'],
        },
      },
      {
        name: 'list_pull_requests',
        description: 'List pull requests in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            state: { type: 'string', enum: ['open', 'closed', 'all'] },
            page: { type: 'number' },
            per_page: { type: 'number' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'get_pull_request',
        description: 'Get details of a specific pull request',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            pull_number: { type: 'number' },
          },
          required: ['owner', 'repo', 'pull_number'],
        },
      },
      {
        name: 'merge_pull_request',
        description: 'Merge a pull request',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            pull_number: { type: 'number' },
            merge_method: { type: 'string', enum: ['merge', 'squash', 'rebase'] },
          },
          required: ['owner', 'repo', 'pull_number'],
        },
      },
      // Actions
      {
        name: 'actions_list',
        description: 'List workflows, runs, jobs, or artifacts',
        inputSchema: {
          type: 'object',
          properties: {
            method: { type: 'string', enum: ['list_workflows', 'list_workflow_runs', 'list_workflow_jobs', 'list_workflow_run_artifacts'] },
            owner: { type: 'string' },
            repo: { type: 'string' },
            resource_id: { type: 'string' },
          },
          required: ['method', 'owner', 'repo'],
        },
      },
      {
        name: 'actions_get',
        description: 'Get details of workflows, runs, jobs, or artifacts',
        inputSchema: {
          type: 'object',
          properties: {
            method: { type: 'string', enum: ['get_workflow', 'get_workflow_run', 'get_workflow_job', 'get_workflow_run_usage', 'get_workflow_run_logs_url', 'download_workflow_run_artifact'] },
            owner: { type: 'string' },
            repo: { type: 'string' },
            resource_id: { type: 'string' },
          },
          required: ['method', 'owner', 'repo', 'resource_id'],
        },
      },
      {
        name: 'actions_run_trigger',
        description: 'Run, rerun, cancel workflows, or delete logs',
        inputSchema: {
          type: 'object',
          properties: {
            method: { type: 'string', enum: ['run_workflow', 'rerun_workflow_run', 'rerun_failed_jobs', 'cancel_workflow_run', 'delete_workflow_run_logs'] },
            owner: { type: 'string' },
            repo: { type: 'string' },
            workflow_id: { type: 'string' },
            ref: { type: 'string' },
            run_id: { type: 'number' },
          },
          required: ['method', 'owner', 'repo'],
        },
      },
      {
        name: 'get_job_logs',
        description: 'Get job logs with failed_only and return_content options',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            job_id: { type: 'number' },
            run_id: { type: 'number' },
            failed_only: { type: 'boolean' },
            return_content: { type: 'boolean' },
            tail_lines: { type: 'number' },
          },
          required: ['owner', 'repo'],
        },
      },
    ];
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    const octokit = await this.getOctokit();

    try {
      switch (toolName) {
        // Issues
        case 'create_issue':
          return await githubIssues.createIssue(octokit, args);
        case 'list_issues':
          return await githubIssues.listIssues(octokit, args);
        case 'get_issue':
          return await githubIssues.getIssue(octokit, args);
        case 'update_issue':
          return await githubIssues.updateIssue(octokit, args);
        case 'add_issue_comment':
          return await githubIssues.addIssueComment(octokit, args);

        // Repositories
        case 'list_repos':
          return await githubRepos.listRepos(octokit, args);
        case 'get_repo':
          return await githubRepos.getRepo(octokit, args);

        // Pull Requests
        case 'create_pr':
          return await githubPRs.createPullRequest(octokit, args);
        case 'list_pull_requests':
          return await githubPRs.listPullRequests(octokit, args);
        case 'get_pull_request':
          return await githubPRs.getPullRequest(octokit, args);
        case 'merge_pull_request':
          return await githubPRs.mergePullRequest(octokit, args);

        // Actions
        case 'actions_list':
          return await githubActions.actionsList(octokit, args);
        case 'actions_get':
          return await githubActions.actionsGet(octokit, args);
        case 'actions_run_trigger':
          return await githubActions.actionsRunTrigger(octokit, args);
        case 'get_job_logs':
          return await githubActions.getJobLogs(octokit, args);
        // Files
        case 'get_file_contents':
          return await githubFiles.getFileContents(octokit, args);
        case 'list_directory':
          return await githubFiles.listDirectory(octokit, args);
        case 'create_or_update_file':
          return await githubFiles.createOrUpdateFile(octokit, args);
        case 'delete_file':
          return await githubFiles.deleteFile(octokit, args);
        default:
          return {
            content: [{ type: 'text', text: `Unknown GitHub tool: ${toolName}` }],
            isError: true,
          };
      }
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `GitHub tool error: ${error.message || 'Unknown error'}` }],
        isError: true,
      };
    }
  }
}

/**
 * Google Calendar MCP Handler
 */
export class GoogleCalendarMCP {
  private config: CalendarConfig;

  constructor(
    accessToken?: string,
    oauthBrokerUrl?: string,
    userId?: string
  ) {
    this.config = {
      accessToken,
      oauthBrokerUrl,
      userId,
    };
  }

  async listTools(): Promise<MCPTool[]> {
    return [
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
    ];
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    try {
      switch (toolName) {
        case 'list_calendars':
          return await calendarEvents.listCalendars(this.config, args);
        case 'list_events':
          return await calendarEvents.listEvents(this.config, args);
        case 'get_event':
          return await calendarEvents.getEvent(this.config, args);
        case 'create_event':
          return await calendarEvents.createEvent(this.config, args);
        case 'update_event':
          return await calendarEvents.updateEvent(this.config, args);
        case 'delete_event':
          return await calendarEvents.deleteEvent(this.config, args);
        case 'search_events':
          return await calendarEvents.searchEvents(this.config, args);
        case 'respond_to_event':
          return await calendarEvents.respondToEvent(this.config, args);
        case 'get_freebusy':
          return await calendarEvents.getFreebusy(this.config, args);
        case 'get_current_time':
          return await calendarEvents.getCurrentTime(this.config, args);
        case 'list_colors':
          return await calendarEvents.listColors(this.config, args);
        case 'manage_accounts':
          return await calendarEvents.manageAccounts(this.config, args);
        default:
          return {
            content: [{ type: 'text', text: `Unknown Calendar tool: ${toolName}` }],
            isError: true,
          };
      }
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Calendar tool error: ${error.message || 'Unknown error'}` }],
        isError: true,
      };
    }
  }
}

/**
 * Gmail MCP Handler
 */
export class GmailMCP {
  private config: GmailConfig;

  constructor(
    accessToken?: string,
    oauthBrokerUrl?: string,
    userId?: string,
    anthropicApiKey?: string
  ) {
    this.config = {
      accessToken,
      oauthBrokerUrl,
      userId,
      anthropicApiKey,
    };
  }

  async listTools(): Promise<MCPTool[]> {
    return [
      { name: 'search_emails', description: 'Search for emails using Gmail search syntax', inputSchema: { type: 'object', properties: { query: { type: 'string' }, maxResults: { type: 'number', default: 10 } }, required: ['query'] } },
      { name: 'read_email', description: 'Retrieves the content of a specific email by its ID', inputSchema: { type: 'object', properties: { messageId: { type: 'string' } }, required: ['messageId'] } },
      { 
        name: 'send_email', 
        description: 'Sends a new email immediately. Supports plain text, HTML, multipart, and attachments.', 
        inputSchema: { 
          type: 'object', 
          properties: { 
            to: { type: 'array', items: { type: 'string' }, description: 'Array of recipient email addresses' },
            subject: { type: 'string', description: 'Email subject line' },
            body: { type: 'string', description: 'Plain text email body content' },
            htmlBody: { type: 'string', description: 'Optional HTML version of the email body' },
            cc: { type: 'array', items: { type: 'string' }, description: 'Optional array of CC recipient email addresses' },
            bcc: { type: 'array', items: { type: 'string' }, description: 'Optional array of BCC recipient email addresses' },
            attachments: { 
              type: 'array', 
              items: { 
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  content: { type: 'string', description: 'Base64-encoded file content' },
                  mimeType: { type: 'string' }
                },
                required: ['filename', 'content', 'mimeType']
              },
              description: 'Optional array of file attachments'
            }
          }, 
          required: ['to', 'subject', 'body'] 
        } 
      },
      { name: 'draft_email', description: 'Creates a draft email without sending it', inputSchema: { type: 'object', properties: { to: { type: 'array', items: { type: 'string' } }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] } },
      { name: 'modify_email', description: 'Modifies email labels', inputSchema: { type: 'object', properties: { messageId: { type: 'string' }, addLabelIds: { type: 'array', items: { type: 'string' } }, removeLabelIds: { type: 'array', items: { type: 'string' } } }, required: ['messageId'] } },
      { name: 'list_labels', description: 'Retrieves all available Gmail labels', inputSchema: { type: 'object', properties: {} } },
      { name: 'create_label', description: 'Creates a new Gmail label', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
      { name: 'update_label', description: 'Updates an existing Gmail label', inputSchema: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } }, required: ['id'] } },
      { name: 'delete_label', description: 'Deletes a Gmail label', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
      { name: 'get_or_create_label', description: 'Gets an existing label by name or creates it', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
      { name: 'list_filters', description: 'Retrieves all Gmail filters', inputSchema: { type: 'object', properties: {} } },
      { name: 'create_filter', description: 'Creates a new Gmail filter', inputSchema: { type: 'object', properties: { criteria: { type: 'object' }, action: { type: 'object' } }, required: ['criteria', 'action'] } },
      { name: 'get_filter', description: 'Gets details of a specific Gmail filter', inputSchema: { type: 'object', properties: { filterId: { type: 'string' } }, required: ['filterId'] } },
      { name: 'delete_filter', description: 'Deletes a Gmail filter', inputSchema: { type: 'object', properties: { filterId: { type: 'string' } }, required: ['filterId'] } },
      { name: 'create_filter_from_template', description: 'Creates a filter using a pre-defined template', inputSchema: { type: 'object', properties: { template: { type: 'string' }, parameters: { type: 'object' } }, required: ['template', 'parameters'] } },
      { name: 'extract_dates_from_email', description: 'Extract dates and events from email content and PDF/image attachments', inputSchema: { type: 'object', properties: { messageId: { type: 'string' }, parseAttachments: { type: 'boolean' }, useClaude: { type: 'boolean' } }, required: ['messageId'] } },
    ];
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    const toolId = crypto.randomUUID();
    console.log(`\n[GMAIL-TOOL-${toolId}] ========== GMAIL TOOL CALL ==========`);
    console.log(`[GMAIL-TOOL-${toolId}] Tool: ${toolName}`);
    console.log(`[GMAIL-TOOL-${toolId}] Config:`, {
      hasAccessToken: !!this.config.accessToken,
      oauthBrokerUrl: this.config.oauthBrokerUrl || 'not set',
      userId: this.config.userId || 'not set',
    });
    console.log(`[GMAIL-TOOL-${toolId}] Arguments:`, JSON.stringify(args, null, 2));
    
    const toolStartTime = Date.now();
    try {
      let result: MCPToolResult;
      
      switch (toolName) {
        case 'search_emails':
          console.log(`[GMAIL-TOOL-${toolId}] 🔍 Calling searchEmails...`);
          result = await gmailMessages.searchEmails(this.config, args);
          break;
        case 'read_email':
          console.log(`[GMAIL-TOOL-${toolId}] 📖 Calling readEmail...`);
          result = await gmailMessages.readEmail(this.config, args);
          break;
        case 'send_email':
          console.log(`[GMAIL-TOOL-${toolId}] 📧📧📧 CALLING sendEmail 📧📧📧`);
          console.log(`[GMAIL-TOOL-${toolId}] Email details:`);
          console.log(`[GMAIL-TOOL-${toolId}]   To: ${JSON.stringify(args.to)}`);
          console.log(`[GMAIL-TOOL-${toolId}]   Subject: "${args.subject}"`);
          console.log(`[GMAIL-TOOL-${toolId}]   Body: "${args.body?.substring(0, 100)}${args.body?.length > 100 ? '...' : ''}"`);
          console.log(`[GMAIL-TOOL-${toolId}]   HTML Body: ${args.htmlBody ? 'yes' : 'no'}`);
          console.log(`[GMAIL-TOOL-${toolId}]   CC: ${args.cc ? JSON.stringify(args.cc) : 'none'}`);
          console.log(`[GMAIL-TOOL-${toolId}]   BCC: ${args.bcc ? JSON.stringify(args.bcc) : 'none'}`);
          console.log(`[GMAIL-TOOL-${toolId}]   Attachments: ${args.attachments ? args.attachments.length : 0}`);
          const sendStart = Date.now();
          result = await gmailMessages.sendEmail(this.config, args);
          const sendDuration = Date.now() - sendStart;
          console.log(`[GMAIL-TOOL-${toolId}] 📧 sendEmail completed in ${sendDuration}ms`);
          console.log(`[GMAIL-TOOL-${toolId}] Result:`, JSON.stringify(result, null, 2));
          break;
        case 'draft_email':
          console.log(`[GMAIL-TOOL-${toolId}] 📝 Calling draftEmail...`);
          result = await gmailMessages.draftEmail(this.config, args);
          break;
        case 'modify_email':
          console.log(`[GMAIL-TOOL-${toolId}] ✏️ Calling modifyEmail...`);
          result = await gmailMessages.modifyEmail(this.config, args);
          break;
        case 'list_labels':
          console.log(`[GMAIL-TOOL-${toolId}] 🏷️ Calling listLabels...`);
          result = await gmailLabels.listLabels(this.config, args);
          break;
        case 'create_label':
          console.log(`[GMAIL-TOOL-${toolId}] ➕ Calling createLabel...`);
          result = await gmailLabels.createLabel(this.config, args);
          break;
        case 'update_label':
          console.log(`[GMAIL-TOOL-${toolId}] 🔄 Calling updateLabel...`);
          result = await gmailLabels.updateLabel(this.config, args);
          break;
        case 'delete_label':
          console.log(`[GMAIL-TOOL-${toolId}] 🗑️ Calling deleteLabel...`);
          result = await gmailLabels.deleteLabel(this.config, args);
          break;
        case 'get_or_create_label':
          console.log(`[GMAIL-TOOL-${toolId}] 🔍 Calling getOrCreateLabel...`);
          result = await gmailLabels.getOrCreateLabel(this.config, args);
          break;
        case 'list_filters':
          console.log(`[GMAIL-TOOL-${toolId}] 🔍 Calling listFilters...`);
          result = await gmailFilters.listFilters(this.config, args);
          break;
        case 'create_filter':
          console.log(`[GMAIL-TOOL-${toolId}] ➕ Calling createFilter...`);
          result = await gmailFilters.createFilter(this.config, args);
          break;
        case 'get_filter':
          console.log(`[GMAIL-TOOL-${toolId}] 🔍 Calling getFilter...`);
          result = await gmailFilters.getFilter(this.config, args);
          break;
        case 'delete_filter':
          console.log(`[GMAIL-TOOL-${toolId}] 🗑️ Calling deleteFilter...`);
          result = await gmailFilters.deleteFilter(this.config, args);
          break;
        case 'create_filter_from_template':
          console.log(`[GMAIL-TOOL-${toolId}] 📋 Calling createFilterFromTemplate...`);
          result = await gmailFilters.createFilterFromTemplate(this.config, args);
          break;
        case 'extract_dates_from_email':
          console.log(`[GMAIL-TOOL-${toolId}] 📅 Calling extractDatesFromEmail...`);
          result = await gmailExtractDates.extractDatesFromEmail(this.config, args);
          break;
        default:
          console.error(`[GMAIL-TOOL-${toolId}] ❌ Unknown tool: ${toolName}`);
          return { content: [{ type: 'text', text: `Unknown Gmail tool: ${toolName}` }], isError: true };
      }
      
      const toolDuration = Date.now() - toolStartTime;
      console.log(`[GMAIL-TOOL-${toolId}] ⏱️ Tool completed in ${toolDuration}ms`);
      console.log(`[GMAIL-TOOL-${toolId}] Result isError: ${result.isError}`);
      console.log(`[GMAIL-TOOL-${toolId}] ========== END GMAIL TOOL ==========\n`);
      return result;
    } catch (error: any) {
      const toolDuration = Date.now() - toolStartTime;
      console.error(`[GMAIL-TOOL-${toolId}] ❌❌❌ EXCEPTION after ${toolDuration}ms:`);
      console.error(`[GMAIL-TOOL-${toolId}] Error: ${error.message}`);
      console.error(`[GMAIL-TOOL-${toolId}] Stack:`, error.stack);
      console.log(`[GMAIL-TOOL-${toolId}] ========== END GMAIL TOOL (ERROR) ==========\n`);
      return { content: [{ type: 'text', text: `Gmail tool error: ${error.message || 'Unknown error'}` }], isError: true };
    }
  }
}

/**
 * Drive MCP Handler
 */
export class DriveMCP {
  private config: DriveConfig;

  constructor(
    accessToken?: string,
    oauthBrokerUrl?: string,
    userId?: string
  ) {
    this.config = {
      accessToken,
      oauthBrokerUrl,
      userId,
    };
  }

  async listTools(): Promise<MCPTool[]> {
    return [
      { name: 'read_file', description: 'Read a file from Google Drive', inputSchema: { type: 'object', properties: { fileId: { type: 'string' } }, required: ['fileId'] } },
      { name: 'write_file', description: 'Write or update a file in Google Drive', inputSchema: { type: 'object', properties: { fileName: { type: 'string' }, content: { type: 'string' }, fileId: { type: 'string' }, parentFolderId: { type: 'string' } }, required: ['fileName', 'content'] } },
      { name: 'list_files', description: 'List files in a folder', inputSchema: { type: 'object', properties: { folderId: { type: 'string' }, query: { type: 'string' }, pageSize: { type: 'number', default: 50 } } } },
      { name: 'search', description: 'Search for files across Google Drive', inputSchema: { type: 'object', properties: { query: { type: 'string' }, pageSize: { type: 'number', default: 50 }, pageToken: { type: 'string' } }, required: ['query'] } },
      { name: 'createFolder', description: 'Create a new folder in Google Drive', inputSchema: { type: 'object', properties: { name: { type: 'string' }, parentFolderId: { type: 'string' } }, required: ['name'] } },
      { name: 'moveItem', description: 'Move a file or folder to a different location', inputSchema: { type: 'object', properties: { itemId: { type: 'string' }, destinationFolderId: { type: 'string' } }, required: ['itemId'] } },
      { name: 'renameItem', description: 'Rename a file or folder', inputSchema: { type: 'object', properties: { itemId: { type: 'string' }, newName: { type: 'string' } }, required: ['itemId', 'newName'] } },
    ];
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    try {
      switch (toolName) {
        case 'read_file': return await driveFiles.readFile(this.config, args);
        case 'write_file': return await driveFiles.writeFile(this.config, args);
        case 'list_files': return await driveFiles.listFiles(this.config, args);
        case 'search': return await driveFiles.search(this.config, args);
        case 'createFolder': return await driveFiles.createFolder(this.config, args);
        case 'moveItem': return await driveFiles.moveItem(this.config, args);
        case 'renameItem': return await driveFiles.renameItem(this.config, args);
        default: return { content: [{ type: 'text', text: `Unknown Drive tool: ${toolName}` }], isError: true };
      }
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Drive tool error: ${error.message || 'Unknown error'}` }], isError: true };
    }
  }
}

/**
 * Supabase MCP Handler
 */
export class SupabaseMCP {
  private config: SupabaseConfig;

  constructor(
    supabaseUrl?: string,
    supabaseKey?: string
  ) {
    this.config = {
      supabaseUrl,
      supabaseKey,
    };
  }

  async listTools(): Promise<MCPTool[]> {
    return [
      { name: 'query', description: 'Query data from a Supabase table. Supports filtering, ordering, and pagination.', inputSchema: { type: 'object', properties: { table: { type: 'string' }, select: { type: 'string', default: '*' }, filter: { type: 'object' }, orderBy: { type: 'string' }, orderAscending: { type: 'boolean', default: true }, limit: { type: 'number' }, offset: { type: 'number' } }, required: ['table'] } },
      { name: 'insert', description: 'Insert rows into a Supabase table.', inputSchema: { type: 'object', properties: { table: { type: 'string' }, rows: { type: 'array', items: { type: 'object' } } }, required: ['table', 'rows'] } },
      { name: 'update', description: 'Update rows in a Supabase table.', inputSchema: { type: 'object', properties: { table: { type: 'string' }, values: { type: 'object' }, filter: { type: 'object' } }, required: ['table', 'values', 'filter'] } },
      { name: 'delete', description: 'Delete rows from a Supabase table.', inputSchema: { type: 'object', properties: { table: { type: 'string' }, filter: { type: 'object' } }, required: ['table', 'filter'] } },
      { name: 'list_tables', description: 'List all tables in the public schema. Requires the list_tables() RPC function to be installed in Supabase (see sql/list_tables.sql).', inputSchema: { type: 'object', properties: {}, required: [] } },
    ];
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    const toolId = crypto.randomUUID();
    console.log(`\n[SUPABASE-TOOL-${toolId}] ========== SUPABASE TOOL CALL ==========`);
    console.log(`[SUPABASE-TOOL-${toolId}] Tool: ${toolName}`);
    console.log(`[SUPABASE-TOOL-${toolId}] Config:`, {
      hasSupabaseUrl: !!this.config.supabaseUrl,
      hasSupabaseKey: !!this.config.supabaseKey,
      supabaseUrl: this.config.supabaseUrl ? `${this.config.supabaseUrl.substring(0, 30)}...` : 'not set',
    });
    console.log(`[SUPABASE-TOOL-${toolId}] Arguments:`, JSON.stringify(args, null, 2));
    
    const toolStartTime = Date.now();
    try {
      let result: MCPToolResult;
      
      switch (toolName) {
        case 'query':
          console.log(`[SUPABASE-TOOL-${toolId}] 🔍 Calling query...`);
          result = await databaseTools.query(this.config, args);
          break;
        case 'insert':
          console.log(`[SUPABASE-TOOL-${toolId}] ➕ Calling insert...`);
          result = await databaseTools.insert(this.config, args);
          break;
        case 'update':
          console.log(`[SUPABASE-TOOL-${toolId}] 🔄 Calling update...`);
          result = await databaseTools.update(this.config, args);
          break;
        case 'delete':
          console.log(`[SUPABASE-TOOL-${toolId}] 🗑️ Calling delete...`);
          result = await databaseTools.deleteRows(this.config, args);
          break;
        case 'list_tables':
          console.log(`[SUPABASE-TOOL-${toolId}] 📋📋📋 CALLING listTables 📋📋📋`);
          console.log(`[SUPABASE-TOOL-${toolId}] Config check before call:`, {
            supabaseUrl: this.config.supabaseUrl || 'MISSING',
            supabaseKey: this.config.supabaseKey ? 'SET (hidden)' : 'MISSING',
          });
          const listStart = Date.now();
          result = await databaseTools.listTables(this.config, args);
          const listDuration = Date.now() - listStart;
          console.log(`[SUPABASE-TOOL-${toolId}] 📋 listTables completed in ${listDuration}ms`);
          console.log(`[SUPABASE-TOOL-${toolId}] Result isError: ${result.isError}`);
          if (result.isError) {
            console.error(`[SUPABASE-TOOL-${toolId}] ❌ listTables error:`, JSON.stringify(result.content, null, 2));
          } else {
            const resultPreview = result.content?.[0]?.text?.substring(0, 500) || 'no content';
            console.log(`[SUPABASE-TOOL-${toolId}] ✅ listTables result preview: ${resultPreview}...`);
          }
          break;
        default:
          console.error(`[SUPABASE-TOOL-${toolId}] ❌ Unknown tool: ${toolName}`);
          return { content: [{ type: 'text', text: `Unknown Supabase tool: ${toolName}` }], isError: true };
      }
      
      const toolDuration = Date.now() - toolStartTime;
      console.log(`[SUPABASE-TOOL-${toolId}] ⏱️ Tool completed in ${toolDuration}ms`);
      console.log(`[SUPABASE-TOOL-${toolId}] Result isError: ${result.isError}`);
      console.log(`[SUPABASE-TOOL-${toolId}] ========== END SUPABASE TOOL ==========\n`);
      return result;
    } catch (error: any) {
      const toolDuration = Date.now() - toolStartTime;
      console.error(`[SUPABASE-TOOL-${toolId}] ❌❌❌ EXCEPTION after ${toolDuration}ms:`);
      console.error(`[SUPABASE-TOOL-${toolId}] Error: ${error.message}`);
      console.error(`[SUPABASE-TOOL-${toolId}] Stack:`, error.stack);
      console.error(`[SUPABASE-TOOL-${toolId}] Error name: ${error.name}`);
      console.log(`[SUPABASE-TOOL-${toolId}] ========== END SUPABASE TOOL (ERROR) ==========\n`);
      return { content: [{ type: 'text', text: `Supabase tool error: ${error.message || 'Unknown error'}` }], isError: true };
    }
  }
}

