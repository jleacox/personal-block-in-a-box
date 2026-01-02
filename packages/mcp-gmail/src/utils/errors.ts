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
 * Handle Gmail API errors
 */
export function handleGmailError(error: any): {
  content: Array<{ type: 'text'; text: string }>;
  isError: boolean;
} {
  if (error.status || error.statusCode) {
    return createErrorResponse(
      error.message || 'Gmail API error',
      error.status || error.statusCode,
      error.response
    );
  }

  return createErrorResponse(error.message || 'Unknown error');
}

