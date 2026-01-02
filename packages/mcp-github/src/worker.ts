/**
 * GitHub MCP Server (HTTP transport for Cloudflare Workers)
 * 
 * This is the entry point for Cloudflare Workers deployment.
 * Uses the same tool implementations as index.ts but with HTTP transport.
 */

import { Octokit } from '@octokit/rest';
import { getOctokit } from './utils/octokit.js';

// Import tools (same as index.ts)
import * as issuesTools from './tools/issues.js';
import * as reposTools from './tools/repositories.js';
import * as prTools from './tools/pull-requests.js';
import * as actionsTools from './tools/actions.js';
import * as filesTools from './tools/files.js';

// Content window size for log handling
const CONTENT_WINDOW_SIZE = 100000;

/**
 * List tools handler
 */
async function handleListTools(): Promise<any> {
  return {
    tools: [
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
          description: 'List repositories for authenticated user',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['all', 'owner', 'member'] },
              sort: { type: 'string', enum: ['created', 'updated', 'pushed', 'full_name'] },
              page: { type: 'number' },
              per_page: { type: 'number' },
            },
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
          description: 'Create a pull request',
          inputSchema: {
            type: 'object',
            properties: {
              repo: { type: 'string' },
              title: { type: 'string' },
              head: { type: 'string' },
              base: { type: 'string' },
              body: { type: 'string' },
            },
            required: ['repo', 'title', 'head'],
          },
        },
        {
          name: 'list_pull_requests',
          description: 'List pull requests',
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
        // Actions (consolidated)
        {
          name: 'actions_list',
          description: 'List GitHub Actions resources',
          inputSchema: {
            type: 'object',
            properties: {
              method: {
                type: 'string',
                enum: ['list_workflows', 'list_workflow_runs', 'list_workflow_jobs', 'list_workflow_run_artifacts'],
              },
              owner: { type: 'string' },
              repo: { type: 'string' },
              resource_id: { type: 'string' },
              page: { type: 'number' },
              per_page: { type: 'number' },
            },
            required: ['method', 'owner', 'repo'],
          },
        },
        {
          name: 'actions_get',
          description: 'Get details of GitHub Actions resources',
          inputSchema: {
            type: 'object',
            properties: {
              method: {
                type: 'string',
                enum: [
                  'get_workflow',
                  'get_workflow_run',
                  'get_workflow_job',
                  'get_workflow_run_usage',
                  'get_workflow_run_logs_url',
                  'download_workflow_run_artifact',
                ],
              },
              owner: { type: 'string' },
              repo: { type: 'string' },
              resource_id: { type: 'string' },
            },
            required: ['method', 'owner', 'repo', 'resource_id'],
          },
        },
        {
          name: 'actions_run_trigger',
          description: 'Trigger GitHub Actions workflow operations',
          inputSchema: {
            type: 'object',
            properties: {
              method: {
                type: 'string',
                enum: ['run_workflow', 'rerun_workflow_run', 'rerun_failed_jobs', 'cancel_workflow_run', 'delete_workflow_run_logs'],
              },
              owner: { type: 'string' },
              repo: { type: 'string' },
              workflow_id: { type: 'string' },
              ref: { type: 'string' },
              inputs: { type: 'object' },
              run_id: { type: 'number' },
            },
            required: ['method', 'owner', 'repo'],
          },
        },
        {
          name: 'get_job_logs',
          description: 'Get GitHub Actions workflow job logs',
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
      // File tools
      {
        name: 'get_file_contents',
        description: 'Get contents of a file or list directory contents. Returns file content for files, directory listing for directories.',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'File or directory path (e.g., "src/index.ts" or "src/")' },
            ref: { type: 'string', description: 'Branch, tag, or commit SHA (optional, defaults to default branch)' },
          },
          required: ['owner', 'repo', 'path'],
        },
      },
      {
        name: 'list_directory',
        description: 'List files and directories in a directory (alias for get_file_contents with directory path)',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'Directory path (e.g., "src/" or "packages/")' },
            ref: { type: 'string', description: 'Branch, tag, or commit SHA (optional, defaults to default branch)' },
          },
          required: ['owner', 'repo', 'path'],
        },
      },
      {
        name: 'create_or_update_file',
        description: 'Create a new file or update an existing file in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'File path (e.g., "src/index.ts")' },
            message: { type: 'string', description: 'Commit message' },
            content: { type: 'string', description: 'File content (plain text, will be base64 encoded)' },
            branch: { type: 'string', description: 'Branch name (optional, defaults to default branch)' },
            sha: { type: 'string', description: 'File SHA (required for updates, get from get_file_contents first)' },
          },
          required: ['owner', 'repo', 'path', 'message', 'content'],
        },
      },
      {
        name: 'delete_file',
        description: 'Delete a file from a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'File path (e.g., "src/index.ts")' },
            message: { type: 'string', description: 'Commit message' },
            sha: { type: 'string', description: 'File SHA (required, get from get_file_contents first)' },
            branch: { type: 'string', description: 'Branch name (optional, defaults to default branch)' },
          },
          required: ['owner', 'repo', 'path', 'message', 'sha'],
        },
      },
    ],
  };
}

/**
 * Call tool handler
 */
async function handleCallTool(request: { params: { name: string; arguments: any } }, env: any): Promise<any> {
    const { name, arguments: args } = request.params;

    if (!name || !args) {
      return {
        content: [{ type: 'text', text: 'Error: Missing tool name or arguments' }],
        isError: true,
      };
    }

    // Get Octokit client from environment
    // In Cloudflare Workers, env is captured from closure
    const auth = env.GITHUB_TOKEN;
    const octokit = await getOctokit(
      auth,
      env.OAUTH_BROKER_URL,
      env.USER_ID
    );

    try {
      switch (name) {
        // Issues
        case 'create_issue':
          return await issuesTools.createIssue(octokit, args);
        case 'list_issues':
          return await issuesTools.listIssues(octokit, args);
        case 'get_issue':
          return await issuesTools.getIssue(octokit, args);
        case 'update_issue':
          return await issuesTools.updateIssue(octokit, args);
        case 'add_issue_comment':
          return await issuesTools.addIssueComment(octokit, args);

        // Repositories
        case 'list_repos':
          return await reposTools.listRepos(octokit, args);
        case 'get_repo':
          return await reposTools.getRepo(octokit, args);

        // Pull Requests
        case 'create_pr':
          return await prTools.createPullRequest(octokit, args);
        case 'list_pull_requests':
          return await prTools.listPullRequests(octokit, args);
        case 'get_pull_request':
          return await prTools.getPullRequest(octokit, args);
        case 'merge_pull_request':
          return await prTools.mergePullRequest(octokit, args);

        // Actions (consolidated)
        case 'actions_list':
          return await actionsTools.actionsList(octokit, args);
        case 'actions_get':
          return await actionsTools.actionsGet(octokit, args);
        case 'actions_run_trigger':
          return await actionsTools.actionsRunTrigger(octokit, args);
        case 'get_job_logs':
          return await actionsTools.getJobLogs(octokit, args, CONTENT_WINDOW_SIZE);

        // Files
        case 'get_file_contents':
          return await filesTools.getFileContents(octokit, args);
        case 'list_directory':
          return await filesTools.listDirectory(octokit, args);
        case 'create_or_update_file':
          return await filesTools.createOrUpdateFile(octokit, args);
        case 'delete_file':
          return await filesTools.deleteFile(octokit, args);

        default:
          return {
            content: [{ type: 'text', text: `Error: Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message || 'Unknown error'}` }],
        isError: true,
      };
    }
}

/**
 * Cloudflare Worker handler
 * Handles MCP JSON-RPC requests over HTTP
 */
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Only handle POST requests
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      // Parse JSON-RPC request
      const jsonRpcRequest = await request.json() as {
        jsonrpc?: string;
        method?: string;
        params?: any;
        id?: string | number;
      };

      // Validate JSON-RPC 2.0 format
      if (jsonRpcRequest.jsonrpc !== '2.0' || !jsonRpcRequest.method) {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32600, message: 'Invalid Request' },
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

