/**
 * Calendar MCP Tool Names Constants
 * 
 * ⚠️ AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * 
 * This file is generated from src/tools/registry.ts by scripts/generate-registry-constants.ts
 * Run "npm run generate-registry-constants" from project root to regenerate.
 * 
 * Generated at: 2026-01-02T08:13:04.044Z
 */

/**
 * Array of all Calendar MCP tool names
 * 
 * This is a lightweight export that can be imported by the gateway
 * without importing the entire registry (which causes issues in Cloudflare Workers).
 */
export const CALENDAR_TOOL_NAMES = [
  'calendar_create_event',
  'calendar_delete_event',
  'calendar_get_current_time',
  'calendar_get_event',
  'calendar_get_freebusy',
  'calendar_list_calendars',
  'calendar_list_colors',
  'calendar_list_events',
  'calendar_manage_accounts',
  'calendar_respond_to_event',
  'calendar_search_events',
  'calendar_update_event',
] as const;

/**
 * Type for Calendar MCP tool names
 */
export type CALENDARToolName = typeof CALENDAR_TOOL_NAMES[number];

/**
 * Check if a string is a valid Calendar MCP tool name
 */
export function isCALENDARToolName(name: string): name is CALENDARToolName {
  return CALENDAR_TOOL_NAMES.includes(name as CALENDARToolName);
}
