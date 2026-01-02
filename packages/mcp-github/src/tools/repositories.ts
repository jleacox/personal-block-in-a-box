/**
 * GitHub Repositories Tools
 * Ported from Go implementation: github.com/github/github-mcp-server
 */

import { Octokit } from '@octokit/rest';
import { requiredParam, optionalParam, getPaginationParams } from '../utils/validation.js';
import { handleGitHubError } from '../utils/errors.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * List repositories for authenticated user
 */
export async function listRepos(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const pagination = getPaginationParams(args);
    const type = optionalParam<'all' | 'owner' | 'member'>(args, 'type', 'all');
    const sort = optionalParam<'created' | 'updated' | 'pushed' | 'full_name'>(args, 'sort', 'updated');
    const direction = optionalParam<'asc' | 'desc'>(args, 'direction', 'desc');

    const response = await octokit.rest.repos.listForAuthenticatedUser({
      type,
      sort,
      direction,
      page: pagination.page,
      per_page: pagination.per_page,
    });

    const repos = response.data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      default_branch: repo.default_branch,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      open_issues_count: repo.open_issues_count,
      updated_at: repo.updated_at,
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${repos.length} repository(ies):\n\n${repos
            .map(
              (r) =>
                `${r.full_name} (${r.private ? 'private' : 'public'}) - ${r.html_url}`
            )
            .join('\n')}`,
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

/**
 * Get a specific repository
 */
export async function getRepo(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const owner = requiredParam<string>(args, 'owner');
    const repo = requiredParam<string>(args, 'repo');

    const response = await octokit.rest.repos.get({
      owner,
      repo,
    });

    const repoData = {
      id: response.data.id,
      name: response.data.name,
      full_name: response.data.full_name,
      description: response.data.description,
      private: response.data.private,
      html_url: response.data.html_url,
      clone_url: response.data.clone_url,
      default_branch: response.data.default_branch,
      language: response.data.language,
      stargazers_count: response.data.stargazers_count,
      forks_count: response.data.forks_count,
      open_issues_count: response.data.open_issues_count,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
      pushed_at: response.data.pushed_at,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(repoData, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

