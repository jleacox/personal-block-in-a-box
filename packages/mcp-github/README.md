# GitHub MCP Server (JavaScript/TypeScript Port)

Full JavaScript/TypeScript port of the official GitHub MCP server, including consolidated Actions support.

## Features

- ✅ All core GitHub operations (Issues, PRs, Repos, Branches, Commits, Files)
- ✅ Consolidated GitHub Actions tools (workflows, runs, jobs, logs)
- ✅ Dual transport support (stdio for local, HTTP for Cloudflare Workers)
- ✅ Cloudflare Workers compatible (Web APIs only)

## Porting Status

This is a port from the official Go implementation:
- **Source:** `github.com/github/github-mcp-server`
- **Actions Source:** `flip-actions-tool-ff-to-default` branch
- **Language:** Go → TypeScript/JavaScript

## Installation

```bash
cd packages/mcp-github
npm install
npm run build
```

## Usage

### Local Development (stdio)

```bash
npm start
```

Configure in Cursor/Claude Desktop:

**Option 1: OAuth Broker (Recommended)**
```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["path/to/packages/mcp-github/dist/index.js"],
      "env": {
        "OAUTH_BROKER_URL": "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev",
        "USER_ID": "YOUR_USER_ID"
      }
    }
  }
}
```

**Option 2: Direct PAT (Fallback)**
```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["path/to/packages/mcp-github/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your-pat-here"
      }
    }
  }
}
```

**Priority:** OAuth broker is tried first, then falls back to `GITHUB_TOKEN` if broker is not configured.

### Cloudflare Workers (HTTP)

Import in your Worker:
```typescript
import { createWorker } from './worker.js';

export default {
  fetch: createWorker()
};
```

## Authentication

The GitHub MCP supports **two authentication methods**:

### Method 1: OAuth Broker (Recommended)

**Benefits:**
- ✅ No local credentials needed
- ✅ Automatic token refresh
- ✅ Multi-user support (just change `USER_ID`)
- ✅ Secure token storage in Cloudflare KV

### Method 2: Direct PAT (Fallback)

**For local development or simple setups:**
- Set `GITHUB_TOKEN` environment variable with your Personal Access Token
- Create PAT in: [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)

**Note:** PATs don't expire automatically but can be revoked. Use OAuth broker for production!

## Tools

### Core Tools
- Issues: create, list, get, update, close, add comment
- Pull Requests: create, list, get, update, merge, review
- Repositories: list, get, create, update
- Branches: list, get, create, delete
- Commits: list, get, create
- Files: get contents, create, update, delete

### Actions Tools (Consolidated)
- `actions_list` - List workflows, runs, jobs, artifacts
- `actions_get` - Get details of workflows, runs, jobs, artifacts
- `actions_run_trigger` - Run, rerun, cancel workflows, delete logs
- `get_job_logs` - Get job logs with failed_only and return_content options

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Run
npm start
```

## Credits

- Ported from: [github/github-mcp-server](https://github.com/github/github-mcp-server)
- Actions tools from: `flip-actions-tool-ff-to-default` branch
- Original implementation: Go
- This port: TypeScript/JavaScript for Cloudflare Workers compatibility

