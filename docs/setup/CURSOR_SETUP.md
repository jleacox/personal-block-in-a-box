# Cursor MCP Setup Guide

## Quick Answer: How to Reference GitHub MCP

### ✅ Both PAT and OAuth Broker Supported!

The MCP server supports **both** authentication methods simultaneously:

**Priority (automatic):**
1. **OAuth broker** (if `OAUTH_BROKER_URL` + `USER_ID` are set) ← Tries first
2. **Direct PAT** (`GITHUB_TOKEN`) ← Falls back automatically if broker fails or not configured
3. Error only if neither is available

**1. Build the package:**
```powershell
cd packages\mcp-github
npm install
npm run build
```

**2. Configure Cursor:**

### Option A: OAuth Broker (Recommended for Production)

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-github/dist/index.js"],
      "env": {
        "OAUTH_BROKER_URL": "https://auth.yourdomain.com",
        "USER_ID": "YOUR_USER_ID"
      }
    }
  }
}
```

**How it works:**
- MCP server calls `POST https://auth.yourdomain.com/token/github` with your `USER_ID`
- OAuth broker returns a fresh GitHub token
- **Auto-refreshes** tokens when expired
- Falls back to `GITHUB_TOKEN` if broker is unavailable

### Option B: Direct PAT (Simple for Development)

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-github/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_personal_access_token_here"
      }
    }
  }
}
```

### Option C: Both (Best of Both Worlds!)

You can set **both** - broker will be tried first, PAT is the fallback:

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-github/dist/index.js"],
      "env": {
        "OAUTH_BROKER_URL": "https://auth.yourdomain.com",
        "USER_ID": "YOUR_USER_ID",
        "GITHUB_TOKEN": "ghp_your_pat_here"
      }
    }
  }
}
```

**Why both?**
- OAuth broker for production (auto-refresh, multi-user ready)
- PAT as fallback if broker is down or not configured yet
- Seamless transition: Start with PAT, add broker later, remove PAT when ready

## What You Get

### Core Tools
- ✅ `create_issue` - Create GitHub issues
- ✅ `list_issues` - List issues with filters
- ✅ `get_issue` - Get issue details
- ✅ `update_issue` - Update issues
- ✅ `add_issue_comment` - Add comments
- ✅ `list_repos` - List your repositories
- ✅ `get_repo` - Get repository details
- ✅ `create_pr` - Create pull requests
- ✅ `list_pull_requests` - List PRs
- ✅ `get_pull_request` - Get PR details
- ✅ `merge_pull_request` - Merge PRs

### Actions Tools (NEW!)
- ✅ `actions_list` - List workflows, runs, jobs, artifacts
- ✅ `actions_get` - Get workflow/run/job details
- ✅ `actions_run_trigger` - Run, rerun, cancel workflows
- ✅ `get_job_logs` - Get job logs (with failed_only option)

## Testing

After configuring, restart Cursor and try:

```
"List my GitHub repositories"
"Create an issue in personal-block-in-a-box: Test OAuth broker integration"
"List workflows in personal-block-in-a-box repository"
"Get logs for failed jobs in the latest workflow run"
```

## Next: Build OAuth Broker

Once you build the OAuth broker (`packages/oauth-broker/`), you'll:
1. Register one GitHub OAuth app (as developer)
2. Users click "Connect GitHub" button
3. Tokens stored in Cloudflare KV
4. MCP servers fetch tokens automatically
5. **No more PATs!**

The GitHub MCP is already ready for this - just needs the broker deployed.

