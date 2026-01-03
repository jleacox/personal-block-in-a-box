# Personal Block-in-a-Box

**Take back control of your systems.** Personal Block-in-a-Box gives you **write access and full control** over GitHub, Calendar, Email, Tasks, and more—all accessible via voice, code, and conversation. This isn't just read-only integration; you can **create issues while walking**, **plan architecture in Claude.ai**, **implement in Cursor**, and have both systems share the same memory through Google Drive. The result? A **recursively self-improving, multi-agentic system** where Cursor handles tactical coding, Claude handles strategic thinking, and they both reference the same documentation and context.

**Real examples:**
- **Voice control**: "Create a GitHub issue in my repo: Fix calendar sync bug" while driving—it happens instantly
- **Cross-memory workflow**: Claude.ai analyzes your codebase, creates an architecture plan in Google Drive, then Cursor reads that plan and implements it—both systems referencing the same shared documentation
- **Strategic + Tactical**: Plan features philosophically in Claude.ai, implement them tactically in Cursor, document the decisions automatically—all with shared memory
- **Extensible control**: Deploy any MCP server you want (even community ones that aren't certified), access it remotely via voice, and extend your system however you need

This is **your infrastructure, your control, your extensibility**. No waiting for Claude to add support. No vendor lock-in. Just full write/control access to all your systems, accessible from anywhere, with shared memory between your coding environment and your strategic thinking environment.

---

## The Story Behind the Name

**Block** (formerly Square) built an internal AI agent system called "Goose" that transformed how their ~8,000 employees work. Using 60+ Model Context Protocol (MCP) servers, they achieved **50-75% time savings** on common engineering tasks. They open-sourced their architecture and published a comprehensive playbook, proving that MCP infrastructure delivers measurable productivity gains at enterprise scale.

**"Block-in-a-Box"** means taking Block's proven patterns and making them accessible for personal use—packaging their enterprise-grade architecture into something an individual can deploy and use. It's Block's infrastructure, but sized for one person instead of 8,000 employees.

**"Personal"** emphasizes that this is designed for individual productivity automation, not enterprise deployment. It's your own personal AI infrastructure, running on Cloudflare Workers (free tier) and Supabase (free tier), costing ~$10-20/month instead of millions.

---

## The Intent

This repository gives you **full write/control access** to your systems through an extensible, multi-agentic architecture. It's a **full JavaScript/TypeScript port** of the official GitHub MCP server (originally written in Go), plus additional integrations for Google Calendar, Google Drive, Gmail, Supabase, and more.

### Why This Exists

**Take Back Control:**
- **Full write access** - Create, update, delete across GitHub, Calendar, Email, Tasks—not just read-only
- **Extensible architecture** - Deploy any MCP server you want, even community ones that aren't certified
- **Your infrastructure** - No waiting for Claude to add support, no vendor lock-in, full control

**Multi-Agentic Self-Improving Systems:**
- **Cursor (tactical coding)**: Fast, direct access for writing code and fixing bugs
- **Claude.ai (strategic thinking)**: Philosophical conversations, architecture planning, documentation
- **Shared memory**: Google Drive MCP enables cross-memory reference—both systems read/write the same documentation
- **Recursive improvement**: Claude plans → Cursor implements → Claude documents → Both reference shared docs → System improves itself

**Voice Control & Remote Access:**
- **Talk to your stack** - Full write access via voice (Claude phone app)
- **Manage from anywhere** - Create issues while walking, check calendar while driving
- **Unified control** - One system for personal projects and life organization
- **Cross-service automation** - Email → Calendar, GitHub → Tasks, all coordinated

**See [Workflows & Use Cases](./docs/vision/WORKFLOWS_AND_USE_CASES.md) for detailed examples.**

---

## Why Claude + Cursor + MCP?

This stack is built specifically for **Claude (Anthropic) and Cursor IDE** using the **Model Context Protocol (MCP)** standard. Here's why this combination makes sense and why alternatives (ChatGPT, Gemini, Microsoft) would require significant architectural changes:

### Claude's MCP Commitment

**Anthropic went all-in on MCP as an open standard:**
- ✅ **Native MCP support** in Claude Desktop and Claude.ai (user-facing configuration)
- ✅ **OAuth broker pattern** - Centralized token management that works seamlessly
- ✅ **Open standard** - MCP is open source, not proprietary to Anthropic
- ✅ **Ecosystem-first** - "Build once, use everywhere" philosophy
- ✅ **Voice integration** - Remote MCPs in Claude.ai automatically work in Claude phone app

### Why Not ChatGPT, Gemini, or Microsoft?

**ChatGPT (OpenAI):**
- ❌ **No native MCP support** - Uses Actions (OpenAPI schema), not MCP protocol
- ❌ **Different OAuth model** - ChatGPT handles OAuth itself, requiring separate OAuth apps per service
- ❌ **GitHub limitation** - GitHub only allows one redirect URI per OAuth app, so you'd need multiple OAuth apps (one for ChatGPT, one for other tools)
- ❌ **Proprietary approach** - Actions are OpenAI-specific, not an open standard
- ⚠️ **Beta MCP support** - Added March 2025, but enterprise/developer mode only, not consumer-facing

**To use this stack with ChatGPT would require:**
1. Building OpenAPI Actions wrapper (converting MCP JSON-RPC to OpenAPI)
2. Creating separate OAuth apps for each service (GitHub limitation)
3. Custom OAuth flow (ChatGPT handles OAuth, passes Bearer tokens differently)
4. Maintaining two integration paths (MCP for Claude, Actions for ChatGPT)

**Gemini (Google):**
- ❌ **No user-facing MCP** - MCP support exists at API level for developers only
- ❌ **No consumer access** - End users can't configure MCP servers in Gemini UI
- ❌ **"Gems" instead** - Google uses curated "Gems" (like ChatGPT's Actions) for consumers
- ❌ **Enterprise focus** - MCP is a developer tool (Vertex AI), not a consumer feature

**To use this stack with Gemini would require:**
1. Building a custom client application (Gemini doesn't support user-facing MCP)
2. Using Vertex AI API directly (not the consumer Gemini interface)
3. Losing the voice/mobile access that makes this stack valuable

**Microsoft Copilot/Power Automate:**
- ❌ **No consumer-facing MCP** - Microsoft Copilot doesn't support user-configured MCP servers
- ❌ **Different OAuth** - Microsoft Entra ID (Azure AD) requires separate OAuth implementation
- ❌ **Different protocols** - Uses Plugins/Connectors/Graph API, not MCP
- ❌ **Enterprise focus** - Designed for enterprise, not personal use

**To use this stack with Microsoft would require:**
1. Microsoft Entra ID OAuth integration (different from standard OAuth broker)
2. Plugin/Connector wrapper (not native MCP)
3. Microsoft Graph API integration (REST API, not MCP)
4. Separate codebase for Microsoft services

### OAuth Architecture Differences

**Claude's OAuth Pattern (Works with This Stack):**
```
User → Claude.ai → OAuth Broker → Service API
                    ↓
              Single OAuth app per service
              Centralized token management
              Auto-refresh tokens
```

- **One OAuth app per service** (shared across all MCP servers)
- **OAuth broker handles everything** - Token storage, refresh, multi-user support
- **Works seamlessly** - No additional OAuth apps needed for different clients

**ChatGPT's OAuth Pattern (Would Require Changes):**
```
User → ChatGPT → ChatGPT OAuth Handler → Service API
                    ↓
              Separate OAuth app per service
              ChatGPT manages tokens
              Different redirect URIs needed
```

- **Multiple OAuth apps needed** - One per service, potentially one per client (GitHub limitation)
- **ChatGPT handles OAuth** - Different flow than OAuth broker pattern
- **Redirect URI conflicts** - GitHub only allows one redirect URI per OAuth app

**Microsoft's OAuth Pattern (Would Require Changes):**
```
User → Microsoft Copilot → Microsoft Entra ID → Microsoft Graph API
                              ↓
                    Azure AD App Registration
                    Microsoft-specific scopes
                    Multi-tenant support
```

- **Microsoft Entra ID** - Different OAuth provider (Azure AD)
- **Different token format** - Microsoft JWT tokens with Microsoft claims
- **Enterprise-focused** - Multi-tenant architecture, not personal use

**Gemini's Pattern (No Consumer MCP):**
- **No user-facing OAuth** - MCP is API-level only for developers
- **Would require custom client** - Not accessible via Gemini UI

### The Compatibility Advantage

**Why Claude + MCP is more compatible:**

1. **Open Standard** - MCP is open source and platform-agnostic
2. **Single Integration Path** - One MCP server works with Claude Desktop, Claude.ai, and Claude phone app
3. **OAuth Broker Pattern** - Centralized authentication that scales across clients
4. **No Vendor Lock-in** - MCP servers can work with any MCP-compatible client
5. **Future-Proof** - Industry is converging on MCP (OpenAI and Microsoft backing it)

**Why ChatGPT/Gemini/Microsoft would require new clients:**

1. **Different Protocols** - Actions (ChatGPT), Function Calling (Gemini), Plugins/Graph API (Microsoft) vs MCP JSON-RPC
2. **Different OAuth Flows** - Each platform handles OAuth differently
3. **Platform-Specific Code** - Would need separate implementations for each platform
4. **Maintenance Burden** - Supporting multiple protocols increases complexity

### The Bottom Line

**Claude + Cursor + MCP = Maximum Compatibility:**
- ✅ **Claude** - Native MCP support, OAuth broker pattern, voice access
- ✅ **Cursor** - Local MCP support via stdio transport
- ✅ **MCP** - Open standard, works across platforms, future-proof

**ChatGPT/Gemini/Microsoft = Platform-Specific Complexity:**
- ❌ **ChatGPT** - Requires Actions wrapper, multiple OAuth apps, proprietary protocol
- ❌ **Gemini** - No consumer MCP, would require custom client development
- ❌ **Microsoft Copilot/Power Automate** - No consumer MCP, uses Plugins/Connectors, requires Microsoft Entra ID OAuth (different from standard OAuth)

**See [`docs/reference/MCP_VS_ACTIONS_PHILOSOPHY.md`](./docs/reference/MCP_VS_ACTIONS_PHILOSOPHY.md), [`docs/reference/MCP_PLATFORM_SUPPORT.md`](./docs/reference/MCP_PLATFORM_SUPPORT.md), and [`docs/reference/MICROSOFT_ECOSYSTEM_MCP_COMPATIBILITY.md`](./docs/reference/MICROSOFT_ECOSYSTEM_MCP_COMPATIBILITY.md) for detailed platform comparisons.**

---

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
- ✅ **Tool name prefixing** - All tools prefixed with system identifiers (`github_`, `calendar_`, `gmail_`, `drive_`, `supabase_`) for clarity in Claude's UI

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
├── scripts/                      # Setup and utility scripts
│   ├── generate-registry-constants.ts  # Generate tool registry constants
│   ├── validate-tools.ts        # Validate tool registrations
│   └── pipeline/                # Email/calendar pipeline scripts (legacy)
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
