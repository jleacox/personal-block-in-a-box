/**
 * GitHub Actions Tools (Consolidated)
 * Ported from Go implementation: github.com/github/github-mcp-server
 * Source: flip-actions-tool-ff-to-default branch
 * 
 * Consolidated tools that group related functionality:
 * - actions_list: List workflows, workflow runs, jobs, and artifacts
 * - actions_get: Get details of workflows, runs, jobs, artifacts, usage, logs URL
 * - actions_run_trigger: Run, rerun, cancel workflows and delete logs
 * - get_job_logs: Get job logs with failed_only and return_content options
 */

import { Octokit } from '@octokit/rest';
import {
  requiredParam,
  optionalParam,
  optionalIntParam,
  optionalBoolParam,
  getPaginationParams,
} from '../utils/validation.js';
import { handleGitHubError } from '../utils/errors.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Method constants for consolidated actions tools
const ACTIONS_METHOD_LIST_WORKFLOWS = 'list_workflows';
const ACTIONS_METHOD_LIST_WORKFLOW_RUNS = 'list_workflow_runs';
const ACTIONS_METHOD_LIST_WORKFLOW_JOBS = 'list_workflow_jobs';
const ACTIONS_METHOD_LIST_WORKFLOW_ARTIFACTS = 'list_workflow_run_artifacts';

const ACTIONS_METHOD_GET_WORKFLOW = 'get_workflow';
const ACTIONS_METHOD_GET_WORKFLOW_RUN = 'get_workflow_run';
const ACTIONS_METHOD_GET_WORKFLOW_JOB = 'get_workflow_job';
const ACTIONS_METHOD_GET_WORKFLOW_RUN_USAGE = 'get_workflow_run_usage';
const ACTIONS_METHOD_GET_WORKFLOW_RUN_LOGS_URL = 'get_workflow_run_logs_url';
const ACTIONS_METHOD_DOWNLOAD_WORKFLOW_ARTIFACT = 'download_workflow_run_artifact';

const ACTIONS_METHOD_RUN_WORKFLOW = 'run_workflow';
const ACTIONS_METHOD_RERUN_WORKFLOW_RUN = 'rerun_workflow_run';
const ACTIONS_METHOD_RERUN_FAILED_JOBS = 'rerun_failed_jobs';
const ACTIONS_METHOD_CANCEL_WORKFLOW_RUN = 'cancel_workflow_run';
const ACTIONS_METHOD_DELETE_WORKFLOW_RUN_LOGS = 'delete_workflow_run_logs';

/**
 * actions_list - List GitHub Actions resources
 */
export async function actionsList(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const owner = requiredParam<string>(args, 'owner');
    const repo = requiredParam<string>(args, 'repo');
    const method = requiredParam<string>(args, 'method');
    const resource_id = optionalParam<string>(args, 'resource_id');
    const pagination = getPaginationParams(args);

    switch (method) {
      case ACTIONS_METHOD_LIST_WORKFLOWS:
        return await listWorkflows(octokit, owner, repo, pagination);

      case ACTIONS_METHOD_LIST_WORKFLOW_RUNS:
        if (!resource_id) {
          return {
            content: [{ type: 'text' as const, text: 'Error: resource_id is required for list_workflow_runs' }],
            isError: true,
          };
        }
        return await listWorkflowRuns(octokit, owner, repo, resource_id, args, pagination);

      case ACTIONS_METHOD_LIST_WORKFLOW_JOBS:
        if (!resource_id) {
          return {
            content: [{ type: 'text' as const, text: 'Error: resource_id (run_id) is required for list_workflow_jobs' }],
            isError: true,
          };
        }
        const runId = parseInt(resource_id, 10);
        if (isNaN(runId)) {
          return {
            content: [{ type: 'text' as const, text: 'Error: resource_id must be a number for list_workflow_jobs' }],
            isError: true,
          };
        }
        return await listWorkflowJobs(octokit, owner, repo, runId, args, pagination);

      case ACTIONS_METHOD_LIST_WORKFLOW_ARTIFACTS:
        if (!resource_id) {
          return {
            content: [{ type: 'text' as const, text: 'Error: resource_id (run_id) is required for list_workflow_run_artifacts' }],
            isError: true,
          };
        }
        const artifactRunId = parseInt(resource_id, 10);
        if (isNaN(artifactRunId)) {
          return {
            content: [{ type: 'text' as const, text: 'Error: resource_id must be a number for list_workflow_run_artifacts' }],
            isError: true,
          };
        }
        return await listWorkflowArtifacts(octokit, owner, repo, artifactRunId, pagination);

      default:
        return {
          content: [{ type: 'text' as const, text: `Error: Unknown method: ${method}` }],
          isError: true,
        };
    }
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

/**
 * actions_get - Get details of GitHub Actions resources
 */
export async function actionsGet(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const owner = requiredParam<string>(args, 'owner');
    const repo = requiredParam<string>(args, 'repo');
    const method = requiredParam<string>(args, 'method');
    const resource_id = requiredParam<string>(args, 'resource_id');

    switch (method) {
      case ACTIONS_METHOD_GET_WORKFLOW:
        return await getWorkflow(octokit, owner, repo, resource_id);

      case ACTIONS_METHOD_GET_WORKFLOW_RUN:
        const runId = parseInt(resource_id, 10);
        if (isNaN(runId)) {
          return {
            content: [{ type: 'text' as const, text: 'Error: resource_id must be a number for get_workflow_run' }],
            isError: true,
          };
        }
        return await getWorkflowRun(octokit, owner, repo, runId);

      case ACTIONS_METHOD_GET_WORKFLOW_JOB:
        const jobId = parseInt(resource_id, 10);
        if (isNaN(jobId)) {
          return {
            content: [{ type: 'text' as const, text: 'Error: resource_id must be a number for get_workflow_job' }],
            isError: true,
          };
        }
        return await getWorkflowJob(octokit, owner, repo, jobId);

      case ACTIONS_METHOD_GET_WORKFLOW_RUN_USAGE:
        const usageRunId = parseInt(resource_id, 10);
        if (isNaN(usageRunId)) {
          return {
            content: [{ type: 'text' as const, text: 'Error: resource_id must be a number for get_workflow_run_usage' }],
            isError: true,
          };
        }
        return await getWorkflowRunUsage(octokit, owner, repo, usageRunId);

      case ACTIONS_METHOD_GET_WORKFLOW_RUN_LOGS_URL:
        const logsRunId = parseInt(resource_id, 10);
        if (isNaN(logsRunId)) {
          return {
            content: [{ type: 'text' as const, text: 'Error: resource_id must be a number for get_workflow_run_logs_url' }],
            isError: true,
          };
        }
        return await getWorkflowRunLogsURL(octokit, owner, repo, logsRunId);

      case ACTIONS_METHOD_DOWNLOAD_WORKFLOW_ARTIFACT:
        const artifactId = parseInt(resource_id, 10);
        if (isNaN(artifactId)) {
          return {
            content: [{ type: 'text' as const, text: 'Error: resource_id must be a number for download_workflow_run_artifact' }],
            isError: true,
          };
        }
        return await downloadWorkflowArtifact(octokit, owner, repo, artifactId);

      default:
        return {
          content: [{ type: 'text' as const, text: `Error: Unknown method: ${method}` }],
          isError: true,
        };
    }
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

/**
 * actions_run_trigger - Trigger GitHub Actions workflow operations
 */
export async function actionsRunTrigger(
  octokit: Octokit,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const owner = requiredParam<string>(args, 'owner');
    const repo = requiredParam<string>(args, 'repo');
    const method = requiredParam<string>(args, 'method');

    switch (method) {
      case ACTIONS_METHOD_RUN_WORKFLOW:
        const workflow_id = requiredParam<string>(args, 'workflow_id');
        const ref = requiredParam<string>(args, 'ref');
        const inputs = optionalParam<Record<string, string>>(args, 'inputs', {});
        return await runWorkflow(octokit, owner, repo, workflow_id, ref, inputs || {});

      case ACTIONS_METHOD_RERUN_WORKFLOW_RUN:
        const rerunRunId = requiredParam<number>(args, 'run_id');
        return await rerunWorkflowRun(octokit, owner, repo, rerunRunId);

      case ACTIONS_METHOD_RERUN_FAILED_JOBS:
        const failedJobsRunId = requiredParam<number>(args, 'run_id');
        return await rerunFailedJobs(octokit, owner, repo, failedJobsRunId);

      case ACTIONS_METHOD_CANCEL_WORKFLOW_RUN:
        const cancelRunId = requiredParam<number>(args, 'run_id');
        return await cancelWorkflowRun(octokit, owner, repo, cancelRunId);

      case ACTIONS_METHOD_DELETE_WORKFLOW_RUN_LOGS:
        const deleteLogsRunId = requiredParam<number>(args, 'run_id');
        return await deleteWorkflowRunLogs(octokit, owner, repo, deleteLogsRunId);

      default:
        return {
          content: [{ type: 'text' as const, text: `Error: Unknown method: ${method}` }],
          isError: true,
        };
    }
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

/**
 * get_job_logs - Get GitHub Actions workflow job logs
 */
export async function getJobLogs(
  octokit: Octokit,
  args: Record<string, any>,
  contentWindowSize: number = 100000
): Promise<CallToolResult> {
  try {
    const owner = requiredParam<string>(args, 'owner');
    const repo = requiredParam<string>(args, 'repo');
    const job_id = optionalIntParam(args, 'job_id');
    const run_id = optionalIntParam(args, 'run_id');
    const failed_only = optionalBoolParam(args, 'failed_only', false);
    const return_content = optionalBoolParam(args, 'return_content', false);
    const tail_lines = optionalIntParam(args, 'tail_lines', 500);

    if (failed_only && run_id === 0) {
      return {
        content: [{ type: 'text' as const, text: 'Error: run_id is required when failed_only is true' }],
        isError: true,
      };
    }

    if (!failed_only && job_id === 0) {
      return {
        content: [{ type: 'text' as const, text: 'Error: job_id is required when failed_only is false' }],
        isError: true,
      };
    }

    if (failed_only && run_id > 0) {
      return await handleFailedJobLogs(octokit, owner, repo, run_id, return_content, tail_lines, contentWindowSize);
    } else if (job_id > 0) {
      return await handleSingleJobLogs(octokit, owner, repo, job_id, return_content, tail_lines, contentWindowSize);
    }

    return {
      content: [{ type: 'text' as const, text: 'Error: Either job_id must be provided for single job logs, or run_id with failed_only=true for failed job logs' }],
      isError: true,
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

// Helper functions for actions_list methods

async function listWorkflows(
  octokit: Octokit,
  owner: string,
  repo: string,
  pagination: { page: number; per_page: number }
): Promise<CallToolResult> {
  try {
    const response = await octokit.rest.actions.listRepoWorkflows({
      owner,
      repo,
      page: pagination.page,
      per_page: pagination.per_page,
    });

    const workflows = response.data.workflows.map((wf: any) => ({
      id: wf.id,
      name: wf.name,
      path: wf.path,
      state: wf.state,
      created_at: wf.created_at,
      updated_at: wf.updated_at,
      url: wf.url,
      html_url: wf.html_url,
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ total_count: response.data.total_count, workflows }, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

async function listWorkflowRuns(
  octokit: Octokit,
  owner: string,
  repo: string,
  resourceId: string,
  args: Record<string, any>,
  pagination: { page: number; per_page: number }
): Promise<CallToolResult> {
  try {
    const workflowRunsFilter = optionalParam<Record<string, any>>(args, 'workflow_runs_filter', {}) || {};
    
    const opts: any = {
      page: pagination.page,
      per_page: pagination.per_page,
    };

    if (workflowRunsFilter && workflowRunsFilter.actor) opts.actor = workflowRunsFilter.actor;
    if (workflowRunsFilter && workflowRunsFilter.branch) opts.branch = workflowRunsFilter.branch;
    if (workflowRunsFilter && workflowRunsFilter.event) opts.event = workflowRunsFilter.event;
    if (workflowRunsFilter && workflowRunsFilter.status) opts.status = workflowRunsFilter.status;

    let response;
    const workflowIdInt = parseInt(resourceId, 10);
    if (!isNaN(workflowIdInt)) {
      response = await octokit.rest.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflowIdInt,
        ...opts,
      });
    } else {
      response = await octokit.rest.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: resourceId,
        ...opts,
      });
    }

    const runs = response.data.workflow_runs.map((run) => ({
      id: run.id,
      name: run.name,
      head_branch: run.head_branch,
      head_sha: run.head_sha,
      status: run.status,
      conclusion: run.conclusion,
      workflow_id: run.workflow_id,
      created_at: run.created_at,
      updated_at: run.updated_at,
      html_url: run.html_url,
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ total_count: response.data.total_count, workflow_runs: runs }, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

async function listWorkflowJobs(
  octokit: Octokit,
  owner: string,
  repo: string,
  runId: number,
  args: Record<string, any>,
  pagination: { page: number; per_page: number }
): Promise<CallToolResult> {
  try {
    const workflowJobsFilter = optionalParam<Record<string, any>>(args, 'workflow_jobs_filter', {}) || {};

    const opts: any = {
      page: pagination.page,
      per_page: pagination.per_page,
    };

    if (workflowJobsFilter && workflowJobsFilter.filter) {
      opts.filter = workflowJobsFilter.filter; // 'latest' or 'all'
    }

    const response = await octokit.rest.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: runId,
      ...opts,
    });

    const jobs = response.data.jobs.map((job) => ({
      id: job.id,
      name: job.name,
      status: job.status,
      conclusion: job.conclusion,
      started_at: job.started_at,
      completed_at: job.completed_at,
      steps: job.steps?.map((step) => ({
        name: step.name,
        status: step.status,
        conclusion: step.conclusion,
      })),
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ total_count: response.data.total_count, jobs }, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

async function listWorkflowArtifacts(
  octokit: Octokit,
  owner: string,
  repo: string,
  runId: number,
  pagination: { page: number; per_page: number }
): Promise<CallToolResult> {
  try {
    const response = await octokit.rest.actions.listWorkflowRunArtifacts({
      owner,
      repo,
      run_id: runId,
      page: pagination.page,
      per_page: pagination.per_page,
    });

    const artifacts = response.data.artifacts.map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      size_in_bytes: artifact.size_in_bytes,
      created_at: artifact.created_at,
      expires_at: artifact.expires_at,
      url: artifact.url,
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ total_count: response.data.total_count, artifacts }, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

// Helper functions for actions_get methods

async function getWorkflow(
  octokit: Octokit,
  owner: string,
  repo: string,
  resourceId: string
): Promise<CallToolResult> {
  try {
    let response;
    const workflowIdInt = parseInt(resourceId, 10);
    if (!isNaN(workflowIdInt)) {
      response = await octokit.rest.actions.getWorkflow({
        owner,
        repo,
        workflow_id: workflowIdInt,
      });
    } else {
      response = await octokit.rest.actions.getWorkflow({
        owner,
        repo,
        workflow_id: resourceId,
      });
    }

    const workflow = {
      id: response.data.id,
      name: response.data.name,
      path: response.data.path,
      state: response.data.state,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
      url: response.data.url,
      html_url: response.data.html_url,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(workflow, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

async function getWorkflowRun(
  octokit: Octokit,
  owner: string,
  repo: string,
  runId: number
): Promise<CallToolResult> {
  try {
    const response = await octokit.rest.actions.getWorkflowRun({
      owner,
      repo,
      run_id: runId,
    });

    const run = {
      id: response.data.id,
      name: response.data.name,
      head_branch: response.data.head_branch,
      head_sha: response.data.head_sha,
      status: response.data.status,
      conclusion: response.data.conclusion,
      workflow_id: response.data.workflow_id,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
      html_url: response.data.html_url,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(run, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

async function getWorkflowJob(
  octokit: Octokit,
  owner: string,
  repo: string,
  jobId: number
): Promise<CallToolResult> {
  try {
    const response = await octokit.rest.actions.getJobForWorkflowRun({
      owner,
      repo,
      job_id: jobId,
    });

    const job = {
      id: response.data.id,
      name: response.data.name,
      status: response.data.status,
      conclusion: response.data.conclusion,
      started_at: response.data.started_at,
      completed_at: response.data.completed_at,
      steps: response.data.steps?.map((step) => ({
        name: step.name,
        status: step.status,
        conclusion: step.conclusion,
      })),
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(job, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

async function getWorkflowRunUsage(
  octokit: Octokit,
  owner: string,
  repo: string,
  runId: number
): Promise<CallToolResult> {
  try {
    const response = await octokit.rest.actions.getWorkflowRunUsage({
      owner,
      repo,
      run_id: runId,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

async function getWorkflowRunLogsURL(
  octokit: Octokit,
  owner: string,
  repo: string,
  runId: number
): Promise<CallToolResult> {
  try {
    const response = await octokit.rest.actions.downloadWorkflowRunLogs({
      owner,
      repo,
      run_id: runId,
    });

    // Note: Octokit returns a redirect URL, we need to extract it
    // The response is actually a redirect, so we get the URL from headers
    const result = {
      logs_url: typeof response.data === 'string' ? response.data : response.url || '',
      message: 'Workflow run logs are available for download',
      note: 'The logs_url provides a download link for the complete workflow run logs as a ZIP archive. You can download this archive to extract and examine individual job logs.',
      warning: 'This downloads ALL logs as a ZIP file which can be large and expensive. For debugging failed jobs, consider using get_job_logs with failed_only=true and run_id instead.',
      optimization_tip: `Use: get_job_logs with parameters {run_id: ${runId}, failed_only: true} for more efficient failed job debugging`,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

async function downloadWorkflowArtifact(
  octokit: Octokit,
  owner: string,
  repo: string,
  artifactId: number
): Promise<CallToolResult> {
  try {
    const response = await octokit.rest.actions.downloadArtifact({
      owner,
      repo,
      artifact_id: artifactId,
      archive_format: 'zip',
    });

    const result = {
      download_url: typeof response.data === 'string' ? response.data : response.url || '',
      message: 'Artifact is available for download',
      note: 'The download_url provides a download link for the artifact as a ZIP archive. The link is temporary and expires after a short time.',
      artifact_id: artifactId,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

// Helper functions for actions_run_trigger methods

async function runWorkflow(
  octokit: Octokit,
  owner: string,
  repo: string,
  workflowId: string,
  ref: string,
  inputs: Record<string, string>
): Promise<CallToolResult> {
  try {
    let response;
    const workflowIdInt = parseInt(workflowId, 10);
    let workflowType: string;

    if (!isNaN(workflowIdInt)) {
      response = await octokit.rest.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflowIdInt,
        ref,
        inputs: Object.keys(inputs).length > 0 ? inputs : undefined,
      });
      workflowType = 'workflow_id';
    } else {
      response = await octokit.rest.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflowId,
        ref,
        inputs: Object.keys(inputs).length > 0 ? inputs : undefined,
      });
      workflowType = 'workflow_file';
    }

    const result = {
      message: 'Workflow run has been queued',
      workflow_type: workflowType,
      workflow_id: workflowId,
      ref,
      inputs,
      status: response.status,
      status_code: response.status,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

async function rerunWorkflowRun(
  octokit: Octokit,
  owner: string,
  repo: string,
  runId: number
): Promise<CallToolResult> {
  try {
    const response = await octokit.rest.actions.reRunWorkflow({
      owner,
      repo,
      run_id: runId,
    });

    const result = {
      message: 'Workflow run has been queued for re-run',
      run_id: runId,
      status: response.status,
      status_code: response.status,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

async function rerunFailedJobs(
  octokit: Octokit,
  owner: string,
  repo: string,
  runId: number
): Promise<CallToolResult> {
  try {
    const response = await octokit.rest.actions.reRunWorkflowFailedJobs({
      owner,
      repo,
      run_id: runId,
    });

    const result = {
      message: 'Failed jobs have been queued for re-run',
      run_id: runId,
      status: response.status,
      status_code: response.status,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

async function cancelWorkflowRun(
  octokit: Octokit,
  owner: string,
  repo: string,
  runId: number
): Promise<CallToolResult> {
  try {
    const response = await octokit.rest.actions.cancelWorkflowRun({
      owner,
      repo,
      run_id: runId,
    });

    const result = {
      message: 'Workflow run has been cancelled',
      run_id: runId,
      status: response.status,
      status_code: response.status,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

async function deleteWorkflowRunLogs(
  octokit: Octokit,
  owner: string,
  repo: string,
  runId: number
): Promise<CallToolResult> {
  try {
    const response = await octokit.rest.actions.deleteWorkflowRunLogs({
      owner,
      repo,
      run_id: runId,
    });

    const result = {
      message: 'Workflow run logs have been deleted',
      run_id: runId,
      status: response.status,
      status_code: response.status,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

// Helper functions for get_job_logs

async function handleSingleJobLogs(
  octokit: Octokit,
  owner: string,
  repo: string,
  jobId: number,
  returnContent: boolean,
  tailLines: number,
  contentWindowSize: number
): Promise<CallToolResult> {
  try {
    if (returnContent) {
      // Get actual log content
      const response = await octokit.rest.actions.downloadJobLogsForWorkflowRun({
        owner,
        repo,
        job_id: jobId,
      });

      // Note: Octokit returns a redirect URL, we need to fetch the actual content
      // For now, return the URL with a note that content fetching requires additional fetch call
      // In a full implementation, you'd fetch the URL and return the content
      const result = {
        job_id: jobId,
        logs_url: typeof response.data === 'string' ? response.data : response.url || '',
        message: 'Job logs URL retrieved. Set return_content=true and implement URL fetching to get actual content.',
        note: 'To get actual log content, fetch the logs_url and parse the response. For tail_lines, process the content after fetching.',
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } else {
      // Return URL only
      const response = await octokit.rest.actions.downloadJobLogsForWorkflowRun({
        owner,
        repo,
        job_id: jobId,
      });

      const result = {
        job_id: jobId,
        logs_url: typeof response.data === 'string' ? response.data : response.url || '',
        message: 'Job logs URL retrieved',
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

async function handleFailedJobLogs(
  octokit: Octokit,
  owner: string,
  repo: string,
  runId: number,
  returnContent: boolean,
  tailLines: number,
  contentWindowSize: number
): Promise<CallToolResult> {
  try {
    // First, get all jobs for the run
    const jobsResponse = await octokit.rest.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: runId,
    });

    // Filter to failed jobs only
    const failedJobs = jobsResponse.data.jobs.filter(
      (job) => job.conclusion === 'failure' || job.conclusion === 'cancelled'
    );

    if (failedJobs.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ message: 'No failed jobs found in this workflow run', run_id: runId }, null, 2),
          },
        ],
      };
    }

    // Get logs for each failed job
    const jobLogs: Array<{ job_id: number; job_name: string; logs_url: string }> = [];

    for (const job of failedJobs) {
      try {
        const logResponse = await octokit.rest.actions.downloadJobLogsForWorkflowRun({
          owner,
          repo,
          job_id: job.id,
        });

        jobLogs.push({
          job_id: job.id,
          job_name: job.name || `Job ${job.id}`,
          logs_url: typeof logResponse.data === 'string' ? logResponse.data : logResponse.url || '',
        });
      } catch (error: any) {
        // Continue with other jobs if one fails
        jobLogs.push({
          job_id: job.id,
          job_name: job.name || `Job ${job.id}`,
          logs_url: `Error retrieving logs: ${error.message}`,
        });
      }
    }

    const result = {
      run_id: runId,
      failed_jobs_count: failedJobs.length,
      job_logs: jobLogs,
      message: returnContent
        ? 'Log URLs retrieved. Set return_content=true and implement URL fetching to get actual content.'
        : 'Failed job log URLs retrieved',
      note: returnContent
        ? 'To get actual log content, fetch each logs_url and parse the response. For tail_lines, process the content after fetching.'
        : 'Use return_content=true to get actual log content instead of URLs',
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return handleGitHubError(error);
  }
}

