# GitHub Actions Integration - Structure Recommendation

## Recommended Folder Structure

```
personal-block-in-a-box/
├── packages/
│   └── mcp-github/                    # Your JavaScript port of GitHub MCP
│       ├── package.json
│       ├── README.md
│       ├── src/
│       │   ├── index.ts               # Main MCP server (stdio + HTTP support)
│       │   ├── worker.ts              # Cloudflare Worker entry point
│       │   ├── tools/
│       │   │   ├── issues.ts          # Issue tools
│       │   │   ├── pull-requests.ts   # PR tools
│       │   │   ├── repositories.ts    # Repo tools
│       │   │   └── actions.ts         # ⭐ NEW: Actions tools (consolidated)
│       │   └── utils/
│       │       ├── octokit.ts         # Octokit client setup
│       │       └── transport.ts       # Transport layer (stdio/HTTP)
│       └── tsconfig.json
│
├── cloudflare-workers/
│   └── mcp-gateway/
│       └── src/
│           └── index.ts               # Routes to mcp-github/worker.ts
│
├── vendor/                            # Git-ignored (for forks)
│   └── README.md
│
└── config/
    └── cursor.json.example
```

## Why This Structure?

### 1. **`packages/mcp-github/`** - Your JavaScript Port
- **Location**: In monorepo (not vendor) because you're porting, not forking
- **Purpose**: Full JavaScript/TypeScript port of GitHub MCP server
- **Cloudflare Compatible**: Uses Node.js-compatible APIs only

### 2. **Actions Tools Location**
- **File**: `packages/mcp-github/src/tools/actions.ts`
- **Why separate file**: Keeps code organized, easier to maintain
- **Imports**: Used by both `index.ts` (stdio) and `worker.ts` (Cloudflare)

### 3. **Dual Transport Support**
- **`index.ts`**: stdio transport for Cursor/Claude Desktop
- **`worker.ts`**: HTTP transport for Cloudflare Workers
- **Shared code**: Both import from `tools/actions.ts`

## Branch Strategy

**Recommendation: Feature Branch**

```bash
# Create feature branch
git checkout -b feature/github-actions-support

# Work on Actions implementation
# ... make changes ...

# When ready, merge to main
git checkout main
git merge feature/github-actions-support
```

**Why feature branch?**
- Keeps main clean while developing
- Easy to test independently
- Can create PR if you want to review changes

## Implementation Plan

### Phase 1: Structure Setup (Today)
1. Create `packages/mcp-github/` directory structure
2. Set up TypeScript configuration
3. Create base MCP server with stdio transport
4. Add Octokit client setup

### Phase 2: Port Core Tools (Week 1)
1. Port basic tools (issues, PRs, repos)
2. Test in Cursor
3. Ensure stdio transport works

### Phase 3: Add Actions Support (Week 2)
1. Port consolidated Actions tools from Go implementation
2. Implement `actions_list`, `actions_get`, `actions_run_trigger`, `get_job_logs`
3. Test with real GitHub Actions workflows

### Phase 4: Cloudflare Workers Support (Week 3)
1. Create `worker.ts` entry point
2. Add HTTP transport layer
3. Deploy to Cloudflare Workers
4. Test remote access

## Consolidated Actions Tools to Port

Based on `flip-actions-tool-ff-to-default` branch:

### 1. `actions_list`
**Methods:**
- `list_workflows` - List workflows in repo
- `list_workflow_runs` - List runs for a workflow
- `list_workflow_jobs` - List jobs for a run
- `list_workflow_run_artifacts` - List artifacts for a run

### 2. `actions_get`
**Methods:**
- `get_workflow` - Get workflow details
- `get_workflow_run` - Get run details
- `get_workflow_job` - Get job details
- `get_workflow_run_usage` - Get usage stats
- `get_workflow_run_logs_url` - Get logs download URL
- `download_workflow_run_artifact` - Get artifact download URL

### 3. `actions_run_trigger`
**Methods:**
- `run_workflow` - Trigger workflow dispatch
- `rerun_workflow_run` - Rerun a workflow run
- `rerun_failed_jobs` - Rerun only failed jobs
- `cancel_workflow_run` - Cancel a running workflow
- `delete_workflow_run_logs` - Delete logs

### 4. `get_job_logs`
**Features:**
- Get logs for single job (`job_id`)
- Get logs for all failed jobs (`run_id` + `failed_only=true`)
- Return URLs or actual content (`return_content`)
- Tail lines support (`tail_lines`)

## Cloudflare Workers Compatibility

### Key Considerations:

1. **No Node.js-specific APIs**
   - Use Web APIs (fetch, URL, etc.)
   - Avoid `fs`, `path`, `os` modules
   - Use `@octokit/rest` (works in Workers)

2. **Environment Variables**
   - Use `env` parameter in Worker handler
   - Store tokens in Cloudflare Secrets

3. **Transport Layer**
   - stdio → HTTP/SSE for Workers
   - Use MCP's Streamable HTTP transport

4. **Dependencies**
   - All packages must be Workers-compatible
   - Check: `@octokit/rest` ✅, `@modelcontextprotocol/sdk` ✅

## Next Steps

1. **Create folder structure** (I'll do this now)
2. **Set up TypeScript config**
3. **Create base MCP server**
4. **Port Actions tools from Go to TypeScript**

Ready to create the structure?

