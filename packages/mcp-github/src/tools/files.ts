/**
 * GitHub Files Tools
 * 
 * Ported from github.com/github/github-mcp-server
 * Provides file/directory browsing and file content reading
 */

import { Octokit } from '@octokit/rest';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { requiredParam, optionalParam } from '../utils/validation.js';
import { handleGitHubError } from '../utils/errors.js';

/**
 * Get contents of a file or directory
 * 
 * If path is a file, returns file contents
 * If path is a directory, returns directory listing
 */
export async function getFileContents(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const owner = requiredParam<string>(args, 'owner');
    const repo = requiredParam<string>(args, 'repo');
    const path = requiredParam<string>(args, 'path');
    const ref = optionalParam<string>(args, 'ref'); // branch, tag, or commit SHA

    const params: any = {
      owner,
      repo,
      path,
    };
    if (ref) {
      params.ref = ref;
    }

    const response = await octokit.repos.getContent(params);

    if (Array.isArray(response.data)) {
      // Directory listing
      const items = response.data.map((item: any) => {
        return `- ${item.type === 'dir' ? '📁' : '📄'} ${item.name}${item.type === 'dir' ? '/' : ''}${item.size ? ` (${item.size} bytes)` : ''}`;
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Directory: ${path}\n\n${items.join('\n')}`,
        }],
      };
    } else {
      // File content
      const file = response.data as any;
      
      if (file.encoding === 'base64' && file.content) {
        // Decode base64 content (Cloudflare Workers compatible)
        // Use atob for base64 decoding in Workers, or Buffer in Node.js
        let content: string;
        if (typeof Buffer !== 'undefined') {
          // Node.js environment
          content = Buffer.from(file.content as string, 'base64').toString('utf-8');
        } else {
          // Cloudflare Workers environment
          content = atob(file.content as string);
        }
        
        return {
          content: [{
            type: 'text' as const,
            text: `File: ${path}\nSize: ${file.size} bytes\n\n${content}`,
          }],
        };
      } else {
        return {
          content: [{
            type: 'text' as const,
            text: `File: ${path}\nSize: ${file.size} bytes\nEncoding: ${file.encoding || 'unknown'}\n\nContent not available in text format.`,
          }],
        };
      }
    }
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

/**
 * List files in a directory (alias for getFileContents with directory path)
 */
export async function listDirectory(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  // This is essentially the same as getFileContents for a directory
  return getFileContents(octokit, args);
}

/**
 * Create or update a file
 */
export async function createOrUpdateFile(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const owner = requiredParam<string>(args, 'owner');
    const repo = requiredParam<string>(args, 'repo');
    const path = requiredParam<string>(args, 'path');
    const message = requiredParam<string>(args, 'message');
    const content = requiredParam<string>(args, 'content');
    const branch = optionalParam<string>(args, 'branch');
    const sha = optionalParam<string>(args, 'sha'); // Required for updates

    // Encode content to base64 (Cloudflare Workers compatible)
    let encodedContent: string;
    if (typeof Buffer !== 'undefined') {
      // Node.js environment
      encodedContent = Buffer.from(content, 'utf-8').toString('base64');
    } else {
      // Cloudflare Workers environment
      encodedContent = btoa(content);
    }

    const params: any = {
      owner,
      repo,
      path,
      message,
      content: encodedContent,
    };

    if (branch) {
      params.branch = branch;
    }

    if (sha) {
      // Update existing file
      params.sha = sha;
    }

    const response = await octokit.repos.createOrUpdateFileContents(params);
    
    const action = sha ? 'updated' : 'created';
    const contentUrl = response.data.content?.html_url || 'N/A';
    
    return {
      content: [{
        type: 'text' as const,
        text: `File ${action}: ${path}\nCommit: ${response.data.commit.sha}\nURL: ${contentUrl}`,
      }],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

/**
 * Delete a file
 */
export async function deleteFile(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const owner = requiredParam<string>(args, 'owner');
    const repo = requiredParam<string>(args, 'repo');
    const path = requiredParam<string>(args, 'path');
    const message = requiredParam<string>(args, 'message');
    const sha = requiredParam<string>(args, 'sha'); // Required - get from getFileContents first
    const branch = optionalParam<string>(args, 'branch');

    const params: any = {
      owner,
      repo,
      path,
      message,
      sha,
    };

    if (branch) {
      params.branch = branch;
    }

    const response = await octokit.repos.deleteFile(params);
    
    return {
      content: [{
        type: 'text' as const,
        text: `File deleted: ${path}\nCommit: ${response.data.commit.sha}`,
      }],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

