/**
 * Error handling utilities
 * Ported from Go implementation patterns
 */

export class GitHubMCPError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: any
  ) {
    super(message);
    this.name = 'GitHubMCPError';
  }
}

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
 * Handle GitHub API errors
 */
export function handleGitHubError(error: any): {
  content: Array<{ type: 'text'; text: string }>;
  isError: boolean;
} {
  if (error.status) {
    return createErrorResponse(
      error.message || 'GitHub API error',
      error.status,
      error.response
    );
  }

  return createErrorResponse(error.message || 'Unknown error');
}

