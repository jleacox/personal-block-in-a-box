/**
 * Google Calendar MCP Tools Registry
 * 
 * Single source of truth for all Calendar MCP tools.
 * Add new tools here - they will automatically be:
 * - Validated in index.ts and worker.ts
 * - Routed in gateway
 * - Checked by validation script
 */

// Import all tool implementations
import * as eventsTools from './events.js';
import type { CalendarConfig } from '../utils/calendar-client.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool handler function type
 */
export type ToolHandler = (config: CalendarConfig, args: Record<string, any>) => Promise<CallToolResult>;

/**
 * Registry of all Calendar MCP tools
 * 
 * Format: toolName -> handler function
 * 
 * When adding a new tool:
 * 1. Implement the handler in the appropriate tools/*.ts file
 * 2. Add it here with the tool name and handler
 * 3. The tool will automatically be available everywhere
 */
export const TOOL_HANDLERS: Record<string, ToolHandler> = {
  // Calendars
  calendar_list_calendars: eventsTools.listCalendars,
  
  // Events
  calendar_list_events: eventsTools.listEvents,
  calendar_get_event: eventsTools.getEvent,
  calendar_create_event: eventsTools.createEvent,
  calendar_update_event: eventsTools.updateEvent,
  calendar_delete_event: eventsTools.deleteEvent,
  calendar_search_events: eventsTools.searchEvents,
  calendar_respond_to_event: eventsTools.respondToEvent,
  
  // Utility
  calendar_get_freebusy: eventsTools.getFreebusy,
  calendar_get_current_time: eventsTools.getCurrentTime,
  calendar_list_colors: eventsTools.listColors,
  calendar_manage_accounts: eventsTools.manageAccounts,
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

