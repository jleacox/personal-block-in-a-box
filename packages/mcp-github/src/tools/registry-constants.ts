/**
 * GitHub MCP Tool Names Constants
 * 
 * ⚠️ AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * 
 * This file is generated from src/tools/registry.ts by scripts/generate-registry-constants.ts
 * Run "npm run generate-registry-constants" from project root to regenerate.
 * 
 * Generated at: 2026-01-02T08:13:04.042Z
 */

/**
 * Array of all GitHub MCP tool names
 * 
 * This is a lightweight export that can be imported by the gateway
 * without importing the entire registry (which causes issues in Cloudflare Workers).
 */
export const GITHUB_TOOL_NAMES = [
  'github_actions_get',
  'github_actions_list',
  'github_actions_run_trigger',
  'github_add_issue_comment',
  'github_compare_commits',
  'github_create_issue',
  'github_create_or_update_file',
  'github_create_pr',
  'github_delete_file',
  'github_get_commit',
  'github_get_commit_diff',
  'github_get_file_contents',
  'github_get_file_tree',
  'github_get_issue',
  'github_get_job_logs',
  'github_get_pull_request',
  'github_get_pull_request_diff',
  'github_get_raw_file_url',
  'github_get_repo',
  'github_list_commits',
  'github_list_directory',
  'github_list_issues',
  'github_list_pull_requests',
  'github_list_repos',
  'github_merge_pull_request',
  'github_search_code',
  'github_update_issue',
] as const;

/**
 * Type for GitHub MCP tool names
 */
export type GITHUBToolName = typeof GITHUB_TOOL_NAMES[number];

/**
 * Check if a string is a valid GitHub MCP tool name
 */
export function isGITHUBToolName(name: string): name is GITHUBToolName {
  return GITHUB_TOOL_NAMES.includes(name as GITHUBToolName);
}
