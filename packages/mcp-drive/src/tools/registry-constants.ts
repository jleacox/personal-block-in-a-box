/**
 * Drive MCP Tool Names Constants
 * 
 * ⚠️ AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * 
 * This file is generated from src/tools/registry.ts by scripts/generate-registry-constants.ts
 * Run "npm run generate-registry-constants" from project root to regenerate.
 * 
 * Generated at: 2026-01-02T08:13:04.047Z
 */

/**
 * Array of all Drive MCP tool names
 * 
 * This is a lightweight export that can be imported by the gateway
 * without importing the entire registry (which causes issues in Cloudflare Workers).
 */
export const DRIVE_TOOL_NAMES = [
  'drive_create_folder',
  'drive_list_files',
  'drive_move_item',
  'drive_read_file',
  'drive_rename_item',
  'drive_search',
  'drive_write_file',
] as const;

/**
 * Type for Drive MCP tool names
 */
export type DRIVEToolName = typeof DRIVE_TOOL_NAMES[number];

/**
 * Check if a string is a valid Drive MCP tool name
 */
export function isDRIVEToolName(name: string): name is DRIVEToolName {
  return DRIVE_TOOL_NAMES.includes(name as DRIVEToolName);
}
