#!/usr/bin/env node

/**
 * GitHub MCP Server (stdio transport for local development)
 * Full JavaScript/TypeScript port of github.com/github/github-mcp-server
 * 
 * Supports:
 * - Issues, PRs, Repositories, Branches, Commits, Files
 * - Consolidated GitHub Actions tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Octokit } from '@octokit/rest';
import { getOctokit, getOctokitSync } from './utils/octokit.js';

// Import tools
import * as issuesTools from './tools/issues.js';
import * as reposTools from './tools/repositories.js';
import * as prTools from './tools/pull-requests.js';
import * as actionsTools from './tools/actions.js';
import * as filesTools from './tools/files.js';

// Content window size for log handling (100KB default)
const CONTENT_WINDOW_SIZE = 100000;

// Create MCP server
const server = new Server(
  {
    name: 'github-mcp',
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
      // Issues tools
      {
        name: 'create_issue',
        description: 'Create a new GitHub issue in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            repo: { type: 'string', description: 'Repository in format "owner/repo"' },
            title: { type: 'string', description: 'Issue title' },
            body: { type: 'string', description: 'Issue body/description' },
            labels: { type: 'array', items: { type: 'string' }, description: 'Array of label names' },
            assignees: { type: 'array', items: { type: 'string' }, description: 'Array of assignee usernames' },
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
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            state: { type: 'string', enum: ['open', 'closed', 'all'], description: 'Issue state', default: 'open' },
            labels: { type: 'string', description: 'Comma-separated list of label names' },
            assignee: { type: 'string', description: 'Filter by assignee username' },
            creator: { type: 'string', description: 'Filter by creator username' },
            mentioned: { type: 'string', description: 'Filter by mentioned username' },
            page: { type: 'number', description: 'Page number', default: 1 },
            per_page: { type: 'number', description: 'Results per page (max 100)', default: 30 },
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
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            issue_number: { type: 'number', description: 'Issue number' },
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
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            issue_number: { type: 'number', description: 'Issue number' },
            title: { type: 'string', description: 'New issue title' },
            body: { type: 'string', description: 'New issue body' },
            state: { type: 'string', enum: ['open', 'closed'], description: 'Issue state' },
            state_reason: { type: 'string', enum: ['completed', 'not_planned', 'reopened'], description: 'Reason for state change' },
            labels: { type: 'array', items: { type: 'string' }, description: 'Array of label names' },
            assignees: { type: 'array', items: { type: 'string' }, description: 'Array of assignee usernames' },
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
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            issue_number: { type: 'number', description: 'Issue number' },
            body: { type: 'string', description: 'Comment body' },
          },
          required: ['owner', 'repo', 'issue_number', 'body'],
        },
      },
      // Repository tools
      {
        name: 'list_repos',
        description: 'List repositories for authenticated user',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['all', 'owner', 'member'], description: 'Repository type', default: 'all' },
            sort: { type: 'string', enum: ['created', 'updated', 'pushed', 'full_name'], description: 'Sort field', default: 'updated' },
            direction: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction', default: 'desc' },
            page: { type: 'number', description: 'Page number', default: 1 },
            per_page: { type: 'number', description: 'Results per page (max 100)', default: 30 },
          },
        },
      },
      {
        name: 'get_repo',
        description: 'Get details of a specific repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
          },
          required: ['owner', 'repo'],
        },
      },
      // Pull Request tools
      {
        name: 'create_pr',
        description: 'Create a pull request',
        inputSchema: {
          type: 'object',
          properties: {
            repo: { type: 'string', description: 'Repository in format "owner/repo"' },
            title: { type: 'string', description: 'PR title' },
            head: { type: 'string', description: 'Branch to merge from' },
            base: { type: 'string', description: 'Branch to merge into (default: main)' },
            body: { type: 'string', description: 'PR description' },
          },
          required: ['repo', 'title', 'head'],
        },
      },
      {
        name: 'list_pull_requests',
        description: 'List pull requests in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            state: { type: 'string', enum: ['open', 'closed', 'all'], description: 'PR state', default: 'open' },
            head: { type: 'string', description: 'Filter by head branch' },
            base: { type: 'string', description: 'Filter by base branch' },
            page: { type: 'number', description: 'Page number', default: 1 },
            per_page: { type: 'number', description: 'Results per page (max 100)', default: 30 },
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
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            pull_number: { type: 'number', description: 'Pull request number' },
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
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            pull_number: { type: 'number', description: 'Pull request number' },
            merge_method: { type: 'string', enum: ['merge', 'squash', 'rebase'], description: 'Merge method', default: 'merge' },
            commit_title: { type: 'string', description: 'Custom merge commit title' },
            commit_message: { type: 'string', description: 'Custom merge commit message' },
          },
          required: ['owner', 'repo', 'pull_number'],
        },
      },
      // Actions tools (consolidated)
      {
        name: 'actions_list',
        description: 'List GitHub Actions resources (workflows, workflow runs, jobs, and artifacts)',
        inputSchema: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              enum: ['list_workflows', 'list_workflow_runs', 'list_workflow_jobs', 'list_workflow_run_artifacts'],
              description: 'The action to perform',
            },
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            resource_id: {
              type: 'string',
              description: 'The unique identifier of the resource. This will vary based on the "method" provided:\n- Do not provide any resource ID for "list_workflows" method.\n- Provide a workflow ID or workflow file name (e.g. ci.yaml) for "list_workflow_runs" method.\n- Provide a workflow run ID for "list_workflow_jobs" and "list_workflow_run_artifacts" methods.',
            },
            workflow_runs_filter: {
              type: 'object',
              description: 'Filters for workflow runs. ONLY used when method is "list_workflow_runs"',
              properties: {
                actor: { type: 'string', description: 'Filter to a specific GitHub user\'s workflow runs' },
                branch: { type: 'string', description: 'Filter workflow runs to a specific Git branch' },
                event: { type: 'string', description: 'Filter workflow runs to a specific event type' },
                status: { type: 'string', enum: ['queued', 'in_progress', 'completed', 'requested', 'waiting'], description: 'Filter workflow runs to only runs with a specific status' },
              },
            },
            workflow_jobs_filter: {
              type: 'object',
              description: 'Filters for workflow jobs. ONLY used when method is "list_workflow_jobs"',
              properties: {
                filter: { type: 'string', enum: ['latest', 'all'], description: 'Filters jobs by their completed_at timestamp' },
              },
            },
            page: { type: 'number', description: 'Page number for pagination (default: 1)' },
            per_page: { type: 'number', description: 'Results per page for pagination (default: 30, max: 100)' },
          },
          required: ['method', 'owner', 'repo'],
        },
      },
      {
        name: 'actions_get',
        description: 'Get details of GitHub Actions resources (workflows, workflow runs, jobs, artifacts, usage, logs URL)',
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
              description: 'The method to execute',
            },
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            resource_id: {
              type: 'string',
              description: 'The unique identifier of the resource. This will vary based on the "method" provided:\n- Provide a workflow ID or workflow file name (e.g. ci.yaml) for "get_workflow" method.\n- Provide a workflow run ID for "get_workflow_run", "get_workflow_run_usage", and "get_workflow_run_logs_url" methods.\n- Provide an artifact ID for "download_workflow_run_artifact" method.\n- Provide a job ID for "get_workflow_job" method.',
            },
          },
          required: ['method', 'owner', 'repo', 'resource_id'],
        },
      },
      {
        name: 'actions_run_trigger',
        description: 'Trigger GitHub Actions workflow operations (run, rerun, cancel workflows and delete logs)',
        inputSchema: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              enum: ['run_workflow', 'rerun_workflow_run', 'rerun_failed_jobs', 'cancel_workflow_run', 'delete_workflow_run_logs'],
              description: 'The method to execute',
            },
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            workflow_id: {
              type: 'string',
              description: 'The workflow ID (numeric) or workflow file name (e.g., main.yml, ci.yaml). Required for "run_workflow" method.',
            },
            ref: {
              type: 'string',
              description: 'The git reference for the workflow. The reference can be a branch or tag name. Required for "run_workflow" method.',
            },
            inputs: {
              type: 'object',
              description: 'Inputs the workflow accepts. Only used for "run_workflow" method.',
              additionalProperties: { type: 'string' },
            },
            run_id: {
              type: 'number',
              description: 'The ID of the workflow run. Required for all methods except "run_workflow".',
            },
          },
          required: ['method', 'owner', 'repo'],
        },
      },
      {
        name: 'get_job_logs',
        description: 'Get GitHub Actions workflow job logs with failed_only and return_content options',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            job_id: {
              type: 'number',
              description: 'The unique identifier of the workflow job. Required when getting logs for a single job.',
            },
            run_id: {
              type: 'number',
              description: 'The unique identifier of the workflow run. Required when failed_only is true to get logs for all failed jobs in the run.',
            },
            failed_only: {
              type: 'boolean',
              description: 'When true, gets logs for all failed jobs in the workflow run specified by run_id. Requires run_id to be provided.',
              default: false,
            },
            return_content: {
              type: 'boolean',
              description: 'When true, returns actual log content instead of URLs. Default is false (returns URLs).',
              default: false,
            },
            tail_lines: {
              type: 'number',
              description: 'Number of lines to return from the end of the log. Only used when return_content is true.',
              default: 500,
            },
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
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!name || !args) {
    return {
      content: [{ type: 'text', text: 'Error: Missing tool name or arguments' }],
      isError: true,
    };
  }

  // Get Octokit client (supports OAuth broker or direct token)
  // For stdio transport, we can use async getOctokit
  let octokit: Octokit;
  try {
    octokit = await getOctokit(
      process.env.GITHUB_TOKEN,
      process.env.OAUTH_BROKER_URL,
      process.env.USER_ID
    );
  } catch (error: any) {
    // Fallback to sync version if async fails
    console.error('OAuth broker fetch failed, using direct token:', error);
    octokit = getOctokitSync(process.env.GITHUB_TOKEN);
  }

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
});

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GitHub MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

