/**
 * Gmail MCP Tool Names Constants
 * 
 * ⚠️ AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * 
 * This file is generated from src/tools/registry.ts by scripts/generate-registry-constants.ts
 * Run "npm run generate-registry-constants" from project root to regenerate.
 * 
 * Generated at: 2026-01-02T08:13:04.045Z
 */

/**
 * Array of all Gmail MCP tool names
 * 
 * This is a lightweight export that can be imported by the gateway
 * without importing the entire registry (which causes issues in Cloudflare Workers).
 */
export const GMAIL_TOOL_NAMES = [
  'gmail_create_filter',
  'gmail_create_filter_from_template',
  'gmail_create_label',
  'gmail_delete_filter',
  'gmail_delete_label',
  'gmail_draft_email',
  'gmail_extract_dates_from_email',
  'gmail_get_filter',
  'gmail_get_or_create_label',
  'gmail_list_filters',
  'gmail_list_labels',
  'gmail_modify_email',
  'gmail_read_email',
  'gmail_search_emails',
  'gmail_send_email',
  'gmail_update_label',
] as const;

/**
 * Type for Gmail MCP tool names
 */
export type GMAILToolName = typeof GMAIL_TOOL_NAMES[number];

/**
 * Check if a string is a valid Gmail MCP tool name
 */
export function isGMAILToolName(name: string): name is GMAILToolName {
  return GMAIL_TOOL_NAMES.includes(name as GMAILToolName);
}
