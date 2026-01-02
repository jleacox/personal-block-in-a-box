/**
 * GitHub Pull Requests Tools
 * Ported from Go implementation: github.com/github/github-mcp-server
 */

import { Octokit } from '@octokit/rest';
import { requiredParam, optionalParam, parseRepo, getPaginationParams } from '../utils/validation.js';
import { handleGitHubError } from '../utils/errors.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Create a pull request
 */
export async function createPullRequest(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const repo = requiredParam<string>(args, 'repo');
    if (!repo) {
      throw new Error('repo parameter is required');
    }
    const title = requiredParam<string>(args, 'title');
    if (!title) {
      throw new Error('title parameter is required');
    }
    const head = requiredParam<string>(args, 'head');
    if (!head) {
      throw new Error('head parameter is required');
    }
    const base = optionalParam<string>(args, 'base', 'main');
    const body = optionalParam<string>(args, 'body', '');

    const { owner, repo: repoName } = parseRepo(repo);

    const response = await octokit.rest.pulls.create({
      owner,
      repo: repoName,
      title,
      head,
      base: base || 'main',
      body: body || undefined,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Created PR #${response.data.number}: ${response.data.html_url}\n\nTitle: ${response.data.title}\nState: ${response.data.state}\nBase: ${response.data.base.ref} ← Head: ${response.data.head.ref}`,
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

/**
 * List pull requests
 */
export async function listPullRequests(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const owner = requiredParam<string>(args, 'owner');
    const repo = requiredParam<string>(args, 'repo');
    const state = optionalParam<'open' | 'closed' | 'all'>(args, 'state', 'open');
    const head = optionalParam<string>(args, 'head');
    const base = optionalParam<string>(args, 'base');
    const pagination = getPaginationParams(args);

    const response = await octokit.rest.pulls.list({
      owner,
      repo,
      state,
      head: head || undefined,
      base: base || undefined,
      page: pagination.page,
      per_page: pagination.per_page,
    });

    const prs = response.data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      html_url: pr.html_url,
      user: pr.user?.login,
      head: pr.head.ref,
      base: pr.base.ref,
      mergeable: (pr as any).mergeable,
      merged: (pr as any).merged,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${prs.length} pull request(s):\n\n${prs
            .map(
              (pr) =>
                `#${pr.number}: ${pr.title} (${pr.state}) - ${pr.html_url}`
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
 * Get a specific pull request
 */
export async function getPullRequest(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const owner = requiredParam<string>(args, 'owner');
    const repo = requiredParam<string>(args, 'repo');
    const pull_number = requiredParam<number>(args, 'pull_number');

    const response = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number,
    });

    const pr = {
      number: response.data.number,
      title: response.data.title,
      body: response.data.body,
      state: response.data.state,
      html_url: response.data.html_url,
      user: response.data.user?.login,
      head: response.data.head.ref,
      base: response.data.base.ref,
      mergeable: response.data.mergeable,
      merged: response.data.merged,
      mergeable_state: response.data.mergeable_state,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
      merged_at: response.data.merged_at,
      additions: response.data.additions,
      deletions: response.data.deletions,
      changed_files: response.data.changed_files,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(pr, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

/**
 * Merge a pull request
 */
export async function mergePullRequest(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const owner = requiredParam<string>(args, 'owner');
    const repo = requiredParam<string>(args, 'repo');
    const pull_number = requiredParam<number>(args, 'pull_number');
    const merge_method = optionalParam<'merge' | 'squash' | 'rebase'>(args, 'merge_method', 'merge');
    const commit_title = optionalParam<string>(args, 'commit_title');
    const commit_message = optionalParam<string>(args, 'commit_message');

    const response = await octokit.rest.pulls.merge({
      owner,
      repo,
      pull_number,
      merge_method,
      commit_title: commit_title || undefined,
      commit_message: commit_message || undefined,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Merged PR #${pull_number}: ${response.data.message}\n\nSHA: ${response.data.sha}`,
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

