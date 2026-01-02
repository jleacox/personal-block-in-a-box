/**
 * Error handling utilities
 * Adapted from GitHub MCP pattern
 */

/**
 * Create error response for MCP
 */
export function createErrorResponse(
  message: string,
  statusCode?: number,
  response?: any
): {
  content: Array<{ type: 'text'; text: string }>;
  isError: boolean;
} {
  return {
    content: [
      {
        type: 'text' as const,
        text: `Error: ${message}${statusCode ? ` (${statusCode})` : ''}`,
      },
    ],
    isError: true,
  };
}

/**
 * Handle Google Calendar API errors
 */
export function handleCalendarError(error: any): {
  content: Array<{ type: 'text'; text: string }>;
  isError: boolean;
} {
  if (error.status || error.statusCode) {
    return createErrorResponse(
      error.message || 'Google Calendar API error',
      error.status || error.statusCode,
      error.response
    );
  }

  return createErrorResponse(error.message || 'Unknown error');
}

