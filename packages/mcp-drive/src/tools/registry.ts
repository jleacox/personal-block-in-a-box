/**
 * Google Drive MCP Tools Registry
 * 
 * Single source of truth for all Drive MCP tools.
 * Add new tools here - they will automatically be:
 * - Validated in index.ts and worker.ts
 * - Routed in gateway
 * - Checked by validation script
 */

// Import all tool implementations
import * as filesTools from './files.js';
import type { DriveConfig } from '../utils/drive-client.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool handler function type
 */
export type ToolHandler = (config: DriveConfig, args: Record<string, any>) => Promise<CallToolResult>;

/**
 * Registry of all Drive MCP tools
 * 
 * Format: toolName -> handler function
 * 
 * When adding a new tool:
 * 1. Implement the handler in the appropriate tools/*.ts file
 * 2. Add it here with the tool name and handler
 * 3. The tool will automatically be available everywhere
 */
export const TOOL_HANDLERS: Record<string, ToolHandler> = {
  // Files
  drive_read_file: filesTools.readFile,
  drive_write_file: filesTools.writeFile,
  drive_list_files: filesTools.listFiles,
  drive_search: filesTools.search,
  
  // Folders and Organization
  drive_create_folder: filesTools.createFolder,
  drive_move_item: filesTools.moveItem,
  drive_rename_item: filesTools.renameItem,
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

