/**
 * GitHub Issues Tools
 * Ported from Go implementation: github.com/github/github-mcp-server
 */

import { Octokit } from '@octokit/rest';
import { requiredParam, optionalParam, parseRepo, getPaginationParams } from '../utils/validation.js';
import { handleGitHubError } from '../utils/errors.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface CreateIssueArgs {
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

export interface ListIssuesArgs {
  owner: string;
  repo: string;
  state?: 'open' | 'closed' | 'all';
  labels?: string;
  assignee?: string;
  creator?: string;
  mentioned?: string;
  page?: number;
  per_page?: number;
}

export interface GetIssueArgs {
  owner: string;
  repo: string;
  issue_number: number;
}

export interface UpdateIssueArgs {
  owner: string;
  repo: string;
  issue_number: number;
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  state_reason?: 'completed' | 'not_planned' | 'reopened';
  labels?: string[];
  assignees?: string[];
}

export interface AddIssueCommentArgs {
  owner: string;
  repo: string;
  issue_number: number;
  body: string;
}

/**
 * Create a new GitHub issue
 */
export async function createIssue(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const repo = requiredParam<string>(args, 'repo');
    const title = requiredParam<string>(args, 'title');
    const body = optionalParam<string>(args, 'body', '');
    const labels = optionalParam<string[]>(args, 'labels', []);
    const assignees = optionalParam<string[]>(args, 'assignees', []);

    const { owner, repo: repoName } = parseRepo(repo);

    const response = await octokit.rest.issues.create({
      owner,
      repo: repoName,
      title,
      body: body || undefined,
      labels: labels && labels.length > 0 ? labels : undefined,
      assignees: assignees && assignees.length > 0 ? assignees : undefined,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Created issue #${response.data.number}: ${response.data.html_url}\n\nTitle: ${response.data.title}\nState: ${response.data.state}`,
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

/**
 * List issues in a repository
 */
export async function listIssues(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const owner = requiredParam<string>(args, 'owner');
    const repo = requiredParam<string>(args, 'repo');
    const state = optionalParam<'open' | 'closed' | 'all'>(args, 'state', 'open');
    const labels = optionalParam<string>(args, 'labels');
    const assignee = optionalParam<string>(args, 'assignee');
    const creator = optionalParam<string>(args, 'creator');
    const mentioned = optionalParam<string>(args, 'mentioned');
    const pagination = getPaginationParams(args);

    const response = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state,
      labels: labels || undefined,
      assignee: assignee || undefined,
      creator: creator || undefined,
      mentioned: mentioned || undefined,
      page: pagination.page,
      per_page: pagination.per_page,
    });

    const issues = response.data.map((issue) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      html_url: issue.html_url,
      user: issue.user?.login,
      labels: issue.labels.map((label: any) => label.name || label),
      assignees: issue.assignees?.map((a) => a.login) || [],
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${issues.length} issue(s):\n\n${issues
            .map(
              (i) =>
                `#${i.number}: ${i.title} (${i.state}) - ${i.html_url}`
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
 * Get a specific issue
 */
export async function getIssue(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const owner = requiredParam<string>(args, 'owner');
    const repo = requiredParam<string>(args, 'repo');
    const issue_number = requiredParam<number>(args, 'issue_number');

    const response = await octokit.rest.issues.get({
      owner,
      repo,
      issue_number,
    });

    const issue = {
      number: response.data.number,
      title: response.data.title,
      body: response.data.body,
      state: response.data.state,
      html_url: response.data.html_url,
      user: response.data.user?.login,
      labels: response.data.labels.map((label: any) => label.name || label),
      assignees: response.data.assignees?.map((a) => a.login) || [],
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
      closed_at: response.data.closed_at,
      comments: response.data.comments,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(issue, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

/**
 * Update an issue
 */
export async function updateIssue(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const owner = requiredParam<string>(args, 'owner');
    const repo = requiredParam<string>(args, 'repo');
    const issue_number = requiredParam<number>(args, 'issue_number');
    const title = optionalParam<string>(args, 'title');
    const body = optionalParam<string>(args, 'body');
    const state = optionalParam<'open' | 'closed'>(args, 'state');
    const state_reason = optionalParam<'completed' | 'not_planned' | 'reopened'>(
      args,
      'state_reason'
    );
    const labels = optionalParam<string[]>(args, 'labels') || undefined;
    const assignees = optionalParam<string[]>(args, 'assignees') || undefined;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (body !== undefined) updateData.body = body;
    if (state !== undefined) updateData.state = state;
    if (state_reason !== undefined) updateData.state_reason = state_reason;
    if (labels !== undefined) updateData.labels = labels;
    if (assignees !== undefined) updateData.assignees = assignees;

    const response = await octokit.rest.issues.update({
      owner,
      repo,
      issue_number,
      ...updateData,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Updated issue #${response.data.number}: ${response.data.html_url}\n\nTitle: ${response.data.title}\nState: ${response.data.state}`,
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

/**
 * Add a comment to an issue
 */
export async function addIssueComment(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const owner = requiredParam<string>(args, 'owner');
    const repo = requiredParam<string>(args, 'repo');
    const issue_number = requiredParam<number>(args, 'issue_number');
    const body = requiredParam<string>(args, 'body');

    const response = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Added comment to issue #${issue_number}: ${response.data.html_url}`,
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

