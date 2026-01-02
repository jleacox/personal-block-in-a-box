# Porting Guide: Go to TypeScript

## Overview

This guide documents the process of porting the official GitHub MCP server from Go to TypeScript/JavaScript for Cloudflare Workers compatibility.

## Source Material

- **Go Implementation:** `github.com/github/github-mcp-server` (main branch)
- **Actions Tools:** `flip-actions-tool-ff-to-default` branch (consolidated Actions tools)
- **Port to:** TypeScript/JavaScript in `packages/mcp-github/`

## Porting Approach

1. **Study Go implementation** - Understand the logic
2. **Port to TypeScript** - Use `@octokit/rest` for GitHub API calls
3. **Maintain feature parity** - Same functionality, different language
4. **Cloudflare compatible** - Use only Web APIs, no Node.js-specific code
5. **Dual transport** - Support both stdio (local) and HTTP (Workers)

## Tools Ported

### Core Tools (from main branch)
- ✅ Issues: create, list, get, update, close, add comment
- ✅ Pull Requests: create, list, get, update, merge
- ✅ Repositories: list, get

**Note**: Following consolidation philosophy - we have the tools we need. Additional tools (branches, commits, files) will only be added if actual workflow needs arise.

### Actions Tools (from flip-actions-tool-ff-to-default branch)
- ✅ `actions_list` - List workflows, runs, jobs, artifacts
- ✅ `actions_get` - Get details of workflows, runs, jobs, artifacts
- ✅ `actions_run_trigger` - Run, rerun, cancel workflows, delete logs
- ✅ `get_job_logs` - Get job logs with failed_only and return_content options

## Key Differences

### Language
- **Go**: Strong typing, compiled, excellent concurrency
- **TypeScript**: Strong typing, transpiled to JavaScript, async/await

### API Client
- **Go**: Custom HTTP client with GitHub API
- **TypeScript**: `@octokit/rest` - Official GitHub API client

### Error Handling
- **Go**: Explicit error returns
- **TypeScript**: Try/catch with error objects

### Transport
- **Go**: stdio only (local)
- **TypeScript**: stdio (local) + HTTP (Workers)

## Porting Checklist

When porting a new tool:

- [ ] Study Go implementation
- [ ] Map to Octokit methods
- [ ] Port parameter validation
- [ ] Port error handling
- [ ] Port response formatting
- [ ] Test locally
- [ ] Test in Cursor
- [ ] Document any differences
- [ ] Credit original in comments

## Common Patterns

### Parameter Validation

**Go:**
```go
repo := args["repo"].(string)
if repo == "" {
    return error
}
```

**TypeScript:**
```typescript
const repo = requiredParam<string>(args, 'repo');
```

### API Calls

**Go:**
```go
issue, _, err := client.Issues.Create(ctx, owner, repo, &github.IssueRequest{
    Title: &title,
    Body: &body,
})
```

**TypeScript:**
```typescript
const response = await octokit.rest.issues.create({
  owner,
  repo: repoName,
  title,
  body,
});
```

### Error Handling

**Go:**
```go
if err != nil {
    return handleError(err)
}
```

**TypeScript:**
```typescript
try {
  // ... code
} catch (error: any) {
  return handleGitHubError(error);
}
```

## Known Limitations

- `get_job_logs` with `return_content=true` currently returns URLs
  - Full implementation would fetch URLs and return content
  - Can be enhanced later if needed
- Some edge cases in error handling may need refinement
- Worker.ts HTTP transport may need adjustment based on MCP SDK version

## Feature Parity Status

**From Go Implementation:**
- ✅ Core GitHub operations (Issues, PRs, Repos) - **Complete for our workflows**
- ✅ Consolidated Actions tools (all 4 consolidated tools) - **Complete**

**Philosophy**: We have the tools we need. Additional tools will only be added if actual workflow needs arise, following the "consolidate aggressively" principle.

**Actions Support:**
- ✅ Full Actions capability (workflows, runs, jobs, logs, artifacts)
- ✅ All consolidated methods from `flip-actions-tool-ff-to-default` branch
- ✅ Ready for Cloudflare Workers deployment

## References

- [Official GitHub MCP Server (Go)](https://github.com/github/github-mcp-server)
- [Octokit REST API](https://octokit.github.io/rest.js/)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)
