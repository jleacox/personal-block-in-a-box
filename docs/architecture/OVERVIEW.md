# Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Local Development                          │
│  Cursor IDE ←→ MCP Servers (stdio)                     │
│  Claude Desktop ←→ MCP Servers (stdio)                 │
└─────────────────────────────────────────────────────────┘
                        ↓ Git sync
┌─────────────────────────────────────────────────────────┐
│            Remote Access (Claude.ai / Mobile)           │
│                                                          │
│  Claude.ai (web) / Claude Phone App                     │
│         ↓                                               │
│  Cloudflare Worker Gateway                              │
│         ↓                                               │
│  MCP Servers (same codebase, HTTP transport)            │
│         ↓                                               │
│  OAuth Broker → Service APIs                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                  Services                                │
│  GitHub | Drive | Gmail | Calendar | Supabase           │
│  (Asana via official MCP: https://mcp.asana.com/sse)   │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

- **Runtime**: Node.js/TypeScript (Cloudflare Workers compatible)
- **Infrastructure**: Cloudflare Workers (serverless, free tier)
- **Database**: Supabase (managed Postgres, free tier)
- **Authentication**: OAuth broker pattern (central token management)
- **MCP Protocol**: `@modelcontextprotocol/sdk`

## Project Structure

```
personal-block-in-a-box/
├── packages/                    # Your own MCP servers (full source)
│   ├── mcp-github/             # Full JavaScript port of GitHub MCP + Actions
│   ├── mcp-gateway/             # Cloudflare Worker gateway for remote access
│   ├── oauth-broker/           # Central OAuth token management
│   └── mcp-supabase/            # Custom Supabase MCP server
│
├── vendor/                      # Git-ignored, contains forked MCP servers
│   ├── mcp-gmail/               # Fork with PDF parsing enhancements
│   ├── mcp-calendar/            # Fork with enhancements
│   └── README.md                # Setup instructions
│
├── config/                      # MCP configuration files
│   ├── cursor.json.example      # Cursor IDE configuration
│   └── claude-desktop.json.example
│
├── docs/                        # Documentation
│   ├── vision/                  # Intent, current state, philosophy
│   ├── architecture/            # Architecture decisions
│   ├── development/             # Development guides
│   ├── setup/                   # Setup instructions
│   └── reference/               # Reference documentation
│
└── scripts/                     # Setup and utility scripts
```

## Key Architecture Decisions

### TypeScript Everywhere
- **Decision:** Use TypeScript for all MCPs (local and remote)
- **Why:** Cloudflare Workers require JavaScript/TypeScript (cannot run Go)
- **Result:** Single codebase for local (Cursor/Claude Desktop) and remote (Cloudflare Workers)

### Dual Transport Support
- **Local (stdio)**: For Cursor IDE and Claude Desktop
- **Remote (HTTP)**: For Cloudflare Workers and voice/mobile access
- **Same codebase**: Different transport layer, same MCP server logic

### Combined Gateway Pattern
- **Decision:** Single gateway worker that imports MCP handlers directly (not separate workers)
- **Why:** Eliminates network latency (2 hops vs 3 hops), simpler deployment, matches industry best practices
- **Result:** 33-50% faster requests, one deployment instead of many
- **Details:** See [GATEWAY_PATTERN_DECISION.md](./GATEWAY_PATTERN_DECISION.md)

### OAuth Broker Pattern
- **Central token management**: One OAuth app registration per service
- **Multi-user ready**: Just change `USER_ID`
- **Auto-refresh**: Tokens refresh automatically
- **Secure**: Tokens stored in Cloudflare KV, not in code

### Monorepo Structure
- **packages/**: Your own implementations (full source, in monorepo)
- **vendor/**: Forked servers (git-ignored, separate repos, managed via scripts)
- **Extract later**: If a package gets popular, can extract to separate repo

## Transport Layers

### stdio Transport (Local)
- Used by: Cursor IDE, Claude Desktop
- Implementation: `packages/mcp-github/src/index.ts`
- Communication: Standard input/output streams
- Authentication: Environment variables or OAuth broker

### HTTP Transport (Remote)
- Used by: Cloudflare Workers, Claude.ai, Claude phone app
- Implementation: `packages/mcp-github/src/worker.ts`
- Communication: HTTP requests/responses
- Authentication: OAuth broker (tokens fetched on-demand)
- **Note**: Remote MCPs added to claude.ai automatically work in Claude phone app!

## Authentication Flow

### With OAuth Broker
```
Tool Call → MCP Server
  ↓
Check: OAUTH_BROKER_URL set?
  ↓ YES
POST /token/github { user_id: "user" }
  ↓
Broker returns: { access_token: "gho_xxx" }
  ↓
Use token for GitHub API call
```

### Without OAuth Broker (Fallback)
```
Tool Call → MCP Server
  ↓
Use GITHUB_TOKEN from env
  ↓
Use token for GitHub API call
```

## Cloudflare Workers Compatibility

**Requirements:**
- ✅ JavaScript/TypeScript only (no Go, Python, Docker)
- ✅ Web APIs only (no Node.js-specific APIs)
- ✅ Use `fetch` for HTTP requests
- ✅ Use Web Crypto API (not Node.js crypto)
- ✅ Use Cloudflare KV for storage (not file system)

**Compatible Libraries:**
- ✅ `@octokit/rest` - GitHub API client
- ✅ `@modelcontextprotocol/sdk` - MCP protocol
- ✅ Standard Web APIs (fetch, URL, etc.)

**Incompatible Libraries:**
- ❌ `googleapis` - Requires Node.js APIs
- ❌ Python/Go processes - Not supported
- ❌ Docker containers - Not supported

See [`CLOUDFLARE_WORKERS.md`](./CLOUDFLARE_WORKERS.md) for detailed compatibility information.

