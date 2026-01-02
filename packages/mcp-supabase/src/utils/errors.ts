/**
 * Error handling utilities for Supabase MCP
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export function handleSupabaseError(error: any): CallToolResult {
  const message = error.message || 'Unknown error';
  const details = error.details || error.hint || error.code || '';
  
  return {
    content: [{
      type: 'text' as const,
      text: `Supabase error: ${message}${details ? `\nDetails: ${details}` : ''}`,
    }],
    isError: true,
  };
}

