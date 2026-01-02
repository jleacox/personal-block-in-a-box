# Personal Block-in-a-Box

> An open-source implementation of Block's MCP infrastructure for personal productivity automation. Bring Block's proven 50-75% time savings patterns to individual use.

---

## The Story Behind the Name

**Block** (formerly Square) built an internal AI agent system called "Goose" that transformed how their ~8,000 employees work. Using 60+ Model Context Protocol (MCP) servers, they achieved **50-75% time savings** on common engineering tasks. They open-sourced their architecture and published a comprehensive playbook, proving that MCP infrastructure delivers measurable productivity gains at enterprise scale.

**"Block-in-a-Box"** means taking Block's proven patterns and making them accessible for personal use—packaging their enterprise-grade architecture into something an individual can deploy and use. It's Block's infrastructure, but sized for one person instead of 8,000 employees.

**"Personal"** emphasizes that this is designed for individual productivity automation, not enterprise deployment. It's your own personal AI infrastructure, running on Cloudflare Workers (free tier) and Supabase (free tier), costing ~$10-20/month instead of millions.

---

## The Intent

This repository implements Block's MCP server design patterns for personal productivity automation. It's a **full JavaScript/TypeScript port** of the official GitHub MCP server (originally written in Go), plus additional integrations for Google Calendar, Google Drive, Gmail, Supabase, and more.

### Why This Exists

**For Personal Development:**
- Bridge strategic planning (Claude.ai) and tactical coding (Cursor)
- Voice access to your entire development stack via Claude phone app
- Shared memory between Cursor and Claude for documentation and context

**For Personal Life Organization:**
- Unified access to GitHub, Calendar, Email, Tasks via voice
- Cross-service automation (Email → Calendar, GitHub → Tasks)
- Manage your life and projects from anywhere

**For Universal Remote MCP Access:**
- Deploy **any MCP server** to Cloudflare Workers
- Access it remotely via Claude.ai and Claude phone app
- No need to wait for Claude to add support
- No need for certified servers - use your own implementations

**See [Workflows & Use Cases](./docs/vision/WORKFLOWS_AND_USE_CASES.md) for detailed examples.**

### What Makes This Different

**Block's Goose:**
- Single Electron app interface
- 60+ internal MCP servers
- Databricks-hosted LLM (enterprise)
- Desktop-only access
- Enterprise security/compliance

**Personal Block-in-a-Box:**
- Multiple interfaces (Cursor, Claude Desktop, Claude.ai, **Claude phone app with voice**)
- 5-6 core MCP servers (what you actually use)
- Direct Claude API (simple, affordable)
- Desktop + mobile + **voice access** (remote MCPs in claude.ai work automatically in Claude phone app!)
- Personal OAuth (simple, secure)

### Design Philosophy (From Block's Playbook)

1. **Design from workflows, not endpoints** - Build tools that match how you actually work
2. **Consolidate tools aggressively** - Fewer high-level operations > many granular ones
3. **Event-driven agents** - Not scheduled polling
4. **Size limits with helpful fallbacks** - Graceful degradation when content is too large
5. **Context window management** - Active management of conversation context
6. **Separate read-only from destructive operations** - Clear permission boundaries

---

## What This Enables

### 🎯 **Universal Remote MCP Access**
Deploy **any MCP server** to Cloudflare Workers and access it remotely via Claude.ai (web) and Claude phone app (voice). No need to wait for Claude to add support or rely on certified servers.

### 🧠 **Strategic + Tactical Integration**
- **Cursor (Local MCPs)**: Fast, direct access for coding tasks
- **Claude.ai (Remote MCPs)**: Strategic planning, documentation, voice access
- **Shared Memory**: Google Drive MCP for `.md` doc memory sharing between Cursor and Claude

### 🗣️ **Voice Access to Everything**
Claude phone app automatically works with remote MCPs - manage your entire stack via voice while walking, driving, or away from your computer.

### 🏠 **Personal Life + Development**
Same system for personal projects and life organization. Unified access to GitHub, Calendar, Email, Tasks with cross-service automation.

**See [Workflows & Use Cases](./docs/vision/WORKFLOWS_AND_USE_CASES.md) for detailed examples and use cases.**

---

## 🚀 Available Integrations

### ✅ Completed MCP Servers

- **GitHub** - Full port with Issues, PRs, Repos, and Actions support
- **Google Calendar** - 12 tools for event management
- **Google Drive** - 7 tools for document memory sharing
- **Gmail** - Email processing with PDF/image parsing and date extraction
- **Supabase** - Database operations with table introspection

### ⏳ Planned

- **Cloudflare** - Self-debugging capabilities for Workers and infrastructure

### ✅ Using Official MCP Servers

- **Asana** - Use [Asana's official MCP server](https://developers.asana.com/docs/using-asanas-mcp-server) (`https://mcp.asana.com/sse`) - Works with Claude.ai, Claude phone app, and Cursor. No need to build our own!

**All MCP servers support:**
- ✅ Local access (Cursor IDE, Claude Desktop)
- ✅ Remote access (Claude.ai, Claude phone app with voice)
- ✅ Cloudflare Workers compatible
- ✅ OAuth broker integration

See the [Features](#features) section below for detailed capabilities of each integration.

---

## Architecture

### Local vs Remote Patterns

**Local Development (Individual MCP Servers):**
```
Cursor IDE / Claude Desktop
  ↓ (stdio transport)
Individual MCP Servers
  ├─ mcp-github (separate process)
  ├─ mcp-calendar (separate process)
  └─ Each runs standalone
```
- ✅ **Best for:** Local development, Cursor IDE, Claude Desktop
- ✅ **Simple:** Each MCP is a separate Node.js process
- ✅ **Direct:** No network calls between MCPs
- ✅ **Flexible:** Can use OAuth broker or direct tokens (PAT)

**Remote Access (OAuth Broker + MCP Gateway):**
```
Claude.ai (web) / Claude Phone App (voice!)
  ↓ (HTTPS)
MCP Gateway (Cloudflare Worker)
  ↓ (direct imports, no HTTP)
Combined MCP Handlers
  ├─ GitHub tools
  ├─ Calendar tools
  └─ All in one worker
  ↓
OAuth Broker (Cloudflare Worker)
  ↓ (token management)
Service APIs (GitHub, Google, etc.)
```
- ✅ **Best for:** Remote access, Claude.ai, Claude phone app, voice commands
- ✅ **OAuth Broker:** Central token management (free Cloudflare Worker)
- ✅ **MCP Gateway:** Combined worker (33-50% faster than separate workers)
- ✅ **Voice Enabled:** Talk to your stack directly via Claude phone app!

**Why Two Patterns?**
- **Local:** Simpler, faster for development (no network latency)
- **Remote:** Enables mobile/voice access, multi-user support, centralized auth
- **Same Code:** MCP servers work in both patterns (stdio for local, HTTP for remote)

### Technology Stack

- **Runtime**: Node.js/TypeScript (Cloudflare Workers compatible)
- **Infrastructure**: Cloudflare Workers (serverless, **free tier** - OAuth broker and gateway are free!)
- **Database**: Supabase (managed Postgres, free tier)
- **Authentication**: OAuth broker pattern (central token management, **free Cloudflare Worker**)
- **MCP Protocol**: `@modelcontextprotocol/sdk`

### Project Structure

```
personal-block-in-a-box/
├── packages/                    # Your own MCP servers (full source)
│   ├── mcp-github/             # Full JavaScript port of GitHub MCP + Actions
│   ├── mcp-calendar/           # Google Calendar MCP (12 tools)
│   ├── mcp-drive/              # Google Drive MCP (7 tools for document memory)
│   ├── mcp-gmail/              # Gmail MCP with PDF parsing and date extraction
│   ├── mcp-gateway/            # Cloudflare Worker gateway (combined, remote access, free cloudflare worker)
│   ├── oauth-broker/           # Central OAuth token management (free Cloudflare Worker)
│   └── mcp-supabase/           # Supabase MCP server (database operations)
│
├── config/                      # MCP configuration files
│   └── cursor.json.example      # Cursor IDE configuration
│
├── docs/                        # Comprehensive documentation
│   ├── README.md                # Documentation index
│   ├── vision/                  # Intent, current state, philosophy
│   ├── architecture/            # Architecture decisions
│   ├── development/             # Development guides
│   ├── setup/                   # Setup instructions
│   └── reference/               # API references
│
└── README.md                    # This file
```

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cursor IDE or Claude Desktop (for local development)
- (Optional) Cloudflare account (for remote access - **free tier is sufficient**)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jleacox/personal-block-in-a-box.git
   cd personal-block-in-a-box
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build MCP servers:**
   ```bash
   cd packages/mcp-github
   npm run build
   
   cd ../mcp-calendar
   npm run build
   ```

4. **Configure Cursor:**
   - Copy `config/cursor.json.example` to your Cursor config location
   - Update paths to match your system
   - See [`docs/setup/CURSOR_SETUP.md`](./docs/setup/CURSOR_SETUP.md) for details

See [`docs/setup/CURSOR_SETUP.md`](./docs/setup/CURSOR_SETUP.md) for detailed setup instructions.

---

## Features

### 🔵 GitHub MCP Server

A complete JavaScript/TypeScript port of the official GitHub MCP server, including:

- **Issues**: Create, list, get, update, add comments
- **Pull Requests**: Create, list, get, merge
- **Repositories**: List, get
- **GitHub Actions**: List workflows, runs, jobs, artifacts; trigger workflows; get logs

**Consolidated Actions Tools:**
- `actions_list` - List workflows, runs, jobs, artifacts
- `actions_get` - Get details of workflows, runs, jobs, artifacts
- `actions_run_trigger` - Run, rerun, cancel workflows, delete logs
- `get_job_logs` - Get job logs with failed_only and return_content options

### 📅 Google Calendar MCP Server

Full port with 12 tools (Cloudflare Workers compatible):

- **Events**: list, get, create, update, delete, search
- **Calendars**: list calendars
- **Advanced**: respond to invitations, check free/busy, get current time, list colors, manage accounts

### 📁 Google Drive MCP Server

7 tools for document memory sharing between Cursor and Claude:

- **Files**: read_file, write_file, list_files, search
- **Organization**: createFolder, moveItem, renameItem
- **Use Case**: Store `.md` documentation that both Cursor and Claude can access

### 📧 Gmail MCP Server

Full email processing with PDF/image parsing and intelligent date extraction:

- **Email Operations**: search_emails, read_email, send_email, draft_email, modify_email
- **Label Management**: list, create, update, delete, get_or_create labels
- **Filter Management**: create, list, get, delete, create_from_template
- **Date Extraction**: `extract_dates_from_email` - Extract dates from email content and PDF/image attachments using Claude API

### 🗄️ Supabase MCP Server

Database operations for email/calendar tracking and general data management:

- **Query**: Query data with filtering, ordering, and pagination
- **Modify**: Insert, update, and delete rows
- **Introspection**: `list_tables` - List all tables in public schema (requires RPC function)
- **Compatible**: Works with existing email scraping workflows (processed_emails, calendar_events tables)

### Dual Transport Support

- **Local (stdio)**: For Cursor IDE and Claude Desktop
- **Remote (HTTP)**: For Cloudflare Workers, Claude.ai, and **Claude phone app with voice**

Same MCP server code, different transport layer.

### OAuth Broker Integration

**Free Cloudflare Worker** for central OAuth token management:

- Single OAuth app registration per service
- Automatic token refresh
- Secure token storage (Cloudflare KV - free tier)
- Multi-user support (just change `USER_ID`)
- No local credentials needed
- **Service Bindings** - Direct worker-to-worker calls (no billing, faster performance)

See [`docs/setup/OAUTH_SETUP.md`](./docs/setup/OAUTH_SETUP.md) for setup.

### MCP Gateway

**Free Cloudflare Worker** that combines all MCP handlers in one worker:

- **33-50% faster** than separate workers (direct imports, no HTTP calls)
- Single deployment (simpler than multiple workers)
- Routes requests to GitHub, Calendar, and other MCP servers
- Works with Claude.ai and **Claude phone app automatically**

See [`docs/setup/GATEWAY_SETUP.md`](./docs/setup/GATEWAY_SETUP.md) for deployment.

---

## Voice Access via Claude Phone App

**🎉 Remote MCPs added to claude.ai automatically work in the Claude phone app!**

You can **talk to your stack directly**:

- "Create a GitHub issue in personal-block-in-a-box: Fix calendar sync bug"
- "What's on my calendar tomorrow?"
- "List my open GitHub pull requests"
- "Add a calendar event for tomorrow at 2pm: Team meeting"

The Claude phone app uses the same remote MCP configuration as claude.ai, so once you set it up in claude.ai, it works automatically on your phone with voice!

**Real-World Use Cases:**
- **Walking/Driving**: Create issues, check calendar, manage tasks via voice
- **Morning Routine**: "What's on my calendar today? Any urgent GitHub issues?"
- **Evening Planning**: "Create a GitHub issue and calendar reminder for: Review PR #42"

See [`docs/setup/CLAUDE_AI_SETUP.md`](./docs/setup/CLAUDE_AI_SETUP.md) for setup.

See [`docs/vision/WORKFLOWS_AND_USE_CASES.md`](./docs/vision/WORKFLOWS_AND_USE_CASES.md) for more workflow examples.

---

## Cost Breakdown

**Monthly Costs (Personal Use):**
- **Cloudflare Workers**: $0 (free tier: 100K requests/day) - OAuth broker and gateway are free!
- **Supabase**: $0 (free tier: 500MB, 2GB bandwidth)
- **Claude API**: ~$10-20 (PDF parsing, reasoning)
- **Domain**: $12/year (optional, for custom domain - Workers URLs are free!)

**Total: ~$10-20/month** (mostly Claude API for email processing)

Compare to AWS/Azure/GCP: **80-90% cheaper** with zero infrastructure management.

---

## Development

### Building

```bash
# Build all packages
npm run build

# Build specific package
cd packages/mcp-github
npm run build
```

### Testing Locally

```bash
# Test GitHub MCP in Cursor
# Configure cursor.json with absolute path
# Restart Cursor
# Test basic operations (list repos, create issue)

# Test Gateway locally
cd packages/mcp-gateway
npm run dev
# Server runs on http://localhost:8787
```

### Deploying to Cloudflare

```bash
# Deploy OAuth broker (free!)
cd packages/oauth-broker
wrangler deploy

# Deploy gateway (free!)
cd packages/mcp-gateway
wrangler deploy
```

See [`docs/setup/GATEWAY_SETUP.md`](./docs/setup/GATEWAY_SETUP.md) for detailed deployment instructions.

---

## Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- **[docs/README.md](./docs/README.md)** - Documentation index and quick start for AI agents
- **[docs/vision/](./docs/vision/)** - Project intent, current state, and philosophy
- **[docs/architecture/](./docs/architecture/)** - Architecture decisions and patterns
- **[docs/development/](./docs/development/)** - Development guides and workflows
- **[docs/setup/](./docs/setup/)** - Setup instructions for Cursor, Cloudflare, and OAuth

**Quick Links:**
- [Setting up MCP in Cursor](./docs/setup/CURSOR_SETUP.md)
- [GitHub OAuth Quick Start](./docs/setup/GITHUB_OAUTH_QUICKSTART.md)
- [OAuth Broker Architecture](./docs/architecture/OAUTH_BROKER.md)
- [Gateway Pattern Decision](./docs/architecture/GATEWAY_PATTERN_DECISION.md)
- [Setting up Remote MCPs in Claude.ai](./docs/setup/CLAUDE_AI_SETUP.md)

---

## Philosophy

**From Block's playbook:**
> "Design from workflows, not endpoints. Consolidate aggressively. Focus tool availability per session. Manage context windows actively."

**Applied here:**
> Start with YOUR workflows. Build what YOU use. Open source what OTHERS need. Don't build unused infrastructure.

---

## Roadmap

- [x] Full GitHub MCP port (issues, PRs, repos, Actions)
- [x] Google Calendar MCP (12 tools, Cloudflare Workers compatible)
- [x] Google Drive MCP (7 tools for document memory sharing)
- [x] Gmail MCP with PDF parsing and date extraction
- [x] Supabase MCP (database operations with table introspection)
- [x] OAuth broker (free Cloudflare Worker)
- [x] MCP gateway (combined worker, free Cloudflare Worker)
- [x] Remote access via Claude.ai (works automatically in Claude phone app!)
- [ ] Cloudflare MCP (self-debugging capabilities)
- [x] Asana integration - Using [Asana's official MCP server](https://developers.asana.com/docs/using-asanas-mcp-server) (no custom implementation needed)

---

## Contributing

This is a personal project, but contributions are welcome! Areas where help is especially appreciated:

- Additional MCP server implementations
- Documentation improvements
- Cloudflare Workers optimizations
- OAuth broker enhancements

---

## Acknowledgments

- **Block** - For open-sourcing Goose and publishing the MCP server playbook
- **Anthropic** - For the Model Context Protocol specification
- **GitHub** - For the official GitHub MCP server (Go implementation)
- **Community** - For the various MCP servers that inspired this work

---

## References

- [Block's MCP Server Playbook](https://developer.squareup.com/blog/building-effective-agents)
- [Goose Architecture](https://github.com/block/goose)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Official GitHub MCP Server](https://github.com/github/github-mcp-server)

---

**Built with ❤️ for personal productivity automation**
