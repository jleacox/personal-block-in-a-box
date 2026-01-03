/**
 * GitHub MCP Tools Registry
 * 
 * Single source of truth for all GitHub MCP tools.
 * Add new tools here - they will automatically be:
 * - Validated in index.ts and worker.ts
 * - Routed in gateway
 * - Checked by validation script
 */

// Import all tool implementations
import * as issuesTools from './issues.js';
import * as reposTools from './repositories.js';
import * as prTools from './pull-requests.js';
import * as actionsTools from './actions.js';
import * as filesTools from './files.js';
import * as commitsTools from './commits.js';
import * as diffsTools from './diffs.js';
import * as searchTools from './search.js';
import * as fileTreeTools from './file-tree.js';
import type { Octokit } from '@octokit/rest';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool handler function type
 */
export type ToolHandler = (octokit: Octokit, args: Record<string, any>) => Promise<CallToolResult>;

/**
 * Tool handler with optional content window size
 */
export type ToolHandlerWithWindow = (octokit: Octokit, args: Record<string, any>, windowSize?: number) => Promise<CallToolResult>;

/**
 * Registry of all GitHub MCP tools
 * 
 * Format: toolName -> handler function
 * 
 * When adding a new tool:
 * 1. Implement the handler in the appropriate tools/*.ts file
 * 2. Add it here with the tool name and handler
 * 3. The tool will automatically be available everywhere
 */
export const TOOL_HANDLERS: Record<string, ToolHandler | ToolHandlerWithWindow> = {
  // Issues
  github_create_issue: issuesTools.createIssue,
  github_list_issues: issuesTools.listIssues,
  github_get_issue: issuesTools.getIssue,
  github_update_issue: issuesTools.updateIssue,
  github_add_issue_comment: issuesTools.addIssueComment,
  
  // Repositories
  github_list_repos: reposTools.listRepos,
  github_get_repo: reposTools.getRepo,
  
  // Pull Requests
  github_create_pr: prTools.createPullRequest,
  github_list_pull_requests: prTools.listPullRequests,
  github_get_pull_request: prTools.getPullRequest,
  github_merge_pull_request: prTools.mergePullRequest,
  
  // Actions
  github_actions_list: actionsTools.actionsList,
  github_actions_get: actionsTools.actionsGet,
  github_actions_run_trigger: actionsTools.actionsRunTrigger,
  github_get_job_logs: actionsTools.getJobLogs, // Special: needs CONTENT_WINDOW_SIZE
  
  // Files
  github_get_file_contents: filesTools.getFileContents,
  github_list_directory: filesTools.listDirectory,
  github_create_or_update_file: filesTools.createOrUpdateFile,
  github_delete_file: filesTools.deleteFile,
  
  // Commits
  github_list_commits: commitsTools.listCommits,
  github_get_commit: commitsTools.getCommit,
  
  // Diffs
  github_compare_commits: diffsTools.compareCommits,
  github_get_commit_diff: diffsTools.getCommitDiff,
  github_get_pull_request_diff: diffsTools.getPullRequestDiff,
  
  // Code Search
  github_search_code: searchTools.searchCode,
  
  // File Tree
  github_get_file_tree: fileTreeTools.getFileTree,
  github_get_raw_file_url: fileTreeTools.getRawFileUrl,
};

/**
 * Get all tool names
 */
export function getAllToolNames(): string[] {
  return Object.keys(TOOL_HANDLERS);
}

/**
 * Get tool handler by name
 */
export function getToolHandler(toolName: string): ToolHandler | ToolHandlerWithWindow | undefined {
  return TOOL_HANDLERS[toolName];
}

/**
 * Check if a tool exists
 */
export function hasTool(toolName: string): boolean {
  return toolName in TOOL_HANDLERS;
}
