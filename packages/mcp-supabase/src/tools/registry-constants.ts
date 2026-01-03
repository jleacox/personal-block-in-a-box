/**
 * Supabase MCP Tool Names Constants
 * 
 * ⚠️ AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * 
 * This file is generated from src/tools/registry.ts by scripts/generate-registry-constants.ts
 * Run "npm run generate-registry-constants" from project root to regenerate.
 * 
 * Generated at: 2026-01-02T08:13:04.048Z
 */

/**
 * Array of all Supabase MCP tool names
 * 
 * This is a lightweight export that can be imported by the gateway
 * without importing the entire registry (which causes issues in Cloudflare Workers).
 */
export const SUPABASE_TOOL_NAMES = [
  'supabase_delete',
  'supabase_execute_sql',
  'supabase_insert',
  'supabase_list_tables',
  'supabase_query',
  'supabase_update',
] as const;

/**
 * Type for Supabase MCP tool names
 */
export type SUPABASEToolName = typeof SUPABASE_TOOL_NAMES[number];

/**
 * Check if a string is a valid Supabase MCP tool name
 */
export function isSUPABASEToolName(name: string): name is SUPABASEToolName {
  return SUPABASE_TOOL_NAMES.includes(name as SUPABASEToolName);
}
