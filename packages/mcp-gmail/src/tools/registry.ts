/**
 * Gmail MCP Tools Registry
 * 
 * Single source of truth for all Gmail MCP tools.
 * Add new tools here - they will automatically be:
 * - Validated in index.ts and worker.ts
 * - Routed in gateway
 * - Checked by validation script
 */

// Import all tool implementations
import * as messagesTools from './messages.js';
import * as labelsTools from './labels.js';
import * as filtersTools from './filters.js';
import * as extractDatesTools from './extract-dates.js';
import type { GmailConfig } from '../utils/gmail-client.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool handler function type
 */
export type ToolHandler = (config: GmailConfig, args: Record<string, any>) => Promise<CallToolResult>;

/**
 * Registry of all Gmail MCP tools
 * 
 * Format: toolName -> handler function
 * 
 * When adding a new tool:
 * 1. Implement the handler in the appropriate tools/*.ts file
 * 2. Add it here with the tool name and handler
 * 3. The tool will automatically be available everywhere
 */
export const TOOL_HANDLERS: Record<string, ToolHandler> = {
  // Messages
  gmail_search_emails: messagesTools.searchEmails,
  gmail_read_email: messagesTools.readEmail,
  gmail_send_email: messagesTools.sendEmail,
  gmail_draft_email: messagesTools.draftEmail,
  gmail_modify_email: messagesTools.modifyEmail,
  
  // Labels
  gmail_list_labels: labelsTools.listLabels,
  gmail_create_label: labelsTools.createLabel,
  gmail_update_label: labelsTools.updateLabel,
  gmail_delete_label: labelsTools.deleteLabel,
  gmail_get_or_create_label: labelsTools.getOrCreateLabel,
  
  // Filters
  gmail_list_filters: filtersTools.listFilters,
  gmail_create_filter: filtersTools.createFilter,
  gmail_get_filter: filtersTools.getFilter,
  gmail_delete_filter: filtersTools.deleteFilter,
  gmail_create_filter_from_template: filtersTools.createFilterFromTemplate,
  
  // Utilities
  gmail_extract_dates_from_email: extractDatesTools.extractDatesFromEmail,
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

