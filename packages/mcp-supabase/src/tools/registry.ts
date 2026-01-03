/**
 * Supabase MCP Tools Registry
 * 
 * Single source of truth for all Supabase MCP tools.
 * Add new tools here - they will automatically be:
 * - Validated in index.ts and worker.ts
 * - Routed in gateway
 * - Checked by validation script
 */

// Import all tool implementations
import * as databaseTools from './database.js';
import type { SupabaseConfig } from '../utils/supabase-client.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool handler function type
 */
export type ToolHandler = (config: SupabaseConfig, args: Record<string, any>) => Promise<CallToolResult>;

/**
 * Registry of all Supabase MCP tools
 * 
 * Format: toolName -> handler function
 * 
 * When adding a new tool:
 * 1. Implement the handler in the appropriate tools/*.ts file
 * 2. Add it here with the tool name and handler
 * 3. The tool will automatically be available everywhere
 */
export const TOOL_HANDLERS: Record<string, ToolHandler> = {
  // Database Operations
  supabase_query: databaseTools.query,
  supabase_insert: databaseTools.insert,
  supabase_update: databaseTools.update,
  supabase_delete: databaseTools.deleteRows,
  supabase_list_tables: databaseTools.listTables,
  supabase_execute_sql: databaseTools.executeSql,
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
export function getToolHandler(toolName: string): ToolHandler | undefined {
  return TOOL_HANDLERS[toolName];
}

/**
 * Check if a tool exists
 */
export function hasTool(toolName: string): boolean {
  return toolName in TOOL_HANDLERS;
}

