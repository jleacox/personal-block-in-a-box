# Documentation Index

> **For AI Agents:** Start here to understand the project's intent, vision, and current state.

## Quick Start for Agents

1. **Read Intent & Vision**: [`vision/INTENT.md`](./vision/INTENT.md) - Why this project exists
2. **⭐ Understand the Relationship to Block**: [`reference/GOOSE_VS_BLOCK_IN_A_BOX.md`](./reference/GOOSE_VS_BLOCK_IN_A_BOX.md) - **Essential reading** explaining that Goose is an MCP client while this project provides MCP server infrastructure. Includes links to Block's original case study articles and market positioning analysis.
3. **Understand Current State**: [`vision/CURRENT_STATE.md`](./vision/CURRENT_STATE.md) - What's built, what's next
4. **Review Architecture**: [`architecture/OVERVIEW.md`](./architecture/OVERVIEW.md) - How it's structured
5. **Check Development Guide**: [`development/GUIDE.md`](./development/GUIDE.md) - How to work on it

## Documentation Structure

### Vision & Intent
- **[INTENT.md](./vision/INTENT.md)** - Project purpose, story, and goals
- **[CURRENT_STATE.md](./vision/CURRENT_STATE.md)** - What's implemented, what's planned
- **[PHILOSOPHY.md](./vision/PHILOSOPHY.md)** - Design principles from Block's playbook
- **[WORKFLOWS_AND_USE_CASES.md](./vision/WORKFLOWS_AND_USE_CASES.md)** - ⭐ **Workflows:** Detailed examples of what this system enables (personal dev, life organization, strategic/tactical integration, startup use cases)
- **[AUTOMATION_VISION.md](./vision/AUTOMATION_VISION.md)** - Automation scripts and agentic setup for non-technical users
- **[GOOGLE_DRIVE_USE_CASE.md](./vision/GOOGLE_DRIVE_USE_CASE.md)** - Google Drive MCP for memory sharing
- **[DRIVE_STORAGE_PHILOSOPHY.md](./vision/DRIVE_STORAGE_PHILOSOPHY.md)** - ⭐ **Storage Strategy:** How to organize Drive for memory sharing (technical vs non-technical users)
- **[CLAUDE_API_WRAPPER_MCP.md](./vision/CLAUDE_API_WRAPPER_MCP.md)** - ⭐ **Future Idea:** MCP to extract documents from Claude conversations and auto-save to Drive

### Case Studies & Reference
- **[GOOSE_VS_BLOCK_IN_A_BOX.md](./reference/GOOSE_VS_BLOCK_IN_A_BOX.md)** - ⭐ **Primary Reference:** Comprehensive explanation of the relationship between Goose (MCP client) and this project (MCP server infrastructure). Includes links to Block's original case study articles, market positioning, competitive analysis, FAQ, and strategic messaging. **Start here** to understand why this project exists.
- **[MCP_VS_ACTIONS_PHILOSOPHY.md](./reference/MCP_VS_ACTIONS_PHILOSOPHY.md)** - ⭐ **Platform Philosophy:** Deep dive into why ChatGPT uses Actions (OpenAPI) while Claude uses MCP. Analyzes each company's strategic approach (Anthropic, OpenAI, Google) and market positioning. Explains the split, timeline, and industry direction.
- **[MCP_PLATFORM_SUPPORT.md](./reference/MCP_PLATFORM_SUPPORT.md)** - ⭐ **Platform Research:** MCP support status for Claude, Google Gemini, and ChatGPT. Documents which platforms support MCP natively, OAuth complexity, and recommendations. Explains why ChatGPT integration was deprecated.
- **[block_comparison_chart.md](./archive/block_comparison_chart.md)** - **Technical Deep Dive:** Detailed architecture comparison table between Block's Goose (enterprise, 60+ MCP servers) and this personal implementation. Covers deployment models, security, cost structure, usage patterns, and design philosophy in tabular format.

### Architecture
- **[OVERVIEW.md](./architecture/OVERVIEW.md)** - High-level architecture and decisions
- **[GATEWAY_PATTERN_DECISION.md](./architecture/GATEWAY_PATTERN_DECISION.md)** - ⭐ **Major Decision:** Combined gateway vs separate workers (latency, network traffic, best practices)
- **[WORKER_ARCHITECTURE.md](./architecture/WORKER_ARCHITECTURE.md)** - OAuth broker vs consolidated worker decision
- **[MCP_ORGANIZATION.md](./architecture/MCP_ORGANIZATION.md)** - How MCP servers are organized
- **[OAUTH_BROKER.md](./architecture/OAUTH_BROKER.md)** - OAuth broker architecture
- **[CLOUDFLARE_WORKERS.md](./architecture/CLOUDFLARE_WORKERS.md)** - Cloudflare Workers strategy

### Development
- **[GUIDE.md](./development/GUIDE.md)** - Development workflow and conventions
- **[PORTING.md](./development/PORTING.md)** - Porting from Go to TypeScript
- **[WRANGLER_BEST_PRACTICES.md](./development/WRANGLER_BEST_PRACTICES.md)** - ⭐ Wrangler configuration best practices (gitignore rules, personal values)
- **[SETUP_REMOTE.md](./development/SETUP_REMOTE.md)** - Initial GitHub repository setup
- **[AUTOMATION_VISION.md](./vision/AUTOMATION_VISION.md)** - ⭐ **Vision:** Automation scripts and agentic setup for non-technical users
- **[AUTOMATION_ROADMAP.md](./development/AUTOMATION_ROADMAP.md)** - ⭐ **Roadmap:** Implementation plan for automation scripts
- **[TESTING.md](./development/TESTING.md)** - Testing strategies

### Setup & Usage
- **[CURSOR_SETUP.md](./setup/CURSOR_SETUP.md)** - Setting up MCP in Cursor IDE
- **[GITHUB_OAUTH_QUICKSTART.md](./setup/GITHUB_OAUTH_QUICKSTART.md)** - ⭐ **Quick Start:** Switch from PAT to GitHub OAuth
- **[CURSOR_OAUTH_OPTIONS.md](./setup/CURSOR_OAUTH_OPTIONS.md)** - OAuth broker vs direct tokens for Cursor
- **[OAUTH_CREDENTIALS_SETUP.md](./setup/OAUTH_CREDENTIALS_SETUP.md)** - Creating GitHub/Google OAuth apps and setting credentials
- **[OAUTH_SETUP.md](./setup/OAUTH_SETUP.md)** - Setting up OAuth broker
- **[GATEWAY_SETUP.md](./setup/GATEWAY_SETUP.md)** - ⭐ **Deploying the MCP Gateway** (combined worker for remote access)
- **[WRANGLER_LOCAL_SETUP.md](./setup/WRANGLER_LOCAL_SETUP.md)** - Setting up `wrangler.toml.local` for deployment (personal values)
- **[CLAUDE_AI_SETUP.md](./setup/CLAUDE_AI_SETUP.md)** - Setting up remote MCPs in Claude.ai (works automatically in phone app!)
- **[GOOGLE_CALENDAR_CLOUDFLARE.md](./setup/GOOGLE_CALENDAR_CLOUDFLARE.md)** - Porting Google Calendar MCP for Cloudflare Workers

### Reference
- **[GOOSE_VS_BLOCK_IN_A_BOX.md](./reference/GOOSE_VS_BLOCK_IN_A_BOX.md)** - ⭐ **Primary Reference:** Relationship to Block, market positioning, original case study links
- **[TOOL_COMPARISON.md](./reference/TOOL_COMPARISON.md)** - Tool comparison with official GitHub MCP
- **[API_REFERENCE.md](./reference/API_REFERENCE.md)** - API documentation (if needed)

### Archive
- **[block_comparison_chart.md](./archive/block_comparison_chart.md)** - ⭐ **Block Case Study** (see Case Studies & Reference section above)
- **[GATEWAY_BUILD_SUMMARY.md](./archive/GATEWAY_BUILD_SUMMARY.md)** - Historical build summary for MCP Gateway
- **[QUICK_START_CALENDAR.md](./archive/QUICK_START_CALENDAR.md)** - Historical quick start guide for Calendar MCP (now completed)
- **[founding_docs/](./archive/)** - Other original planning documents (historical reference)

## Key Principles (For Agents)

1. **Design from workflows, not endpoints** - Build tools that match how users actually work
2. **Consolidate tools aggressively** - Fewer high-level operations > many granular ones
3. **Event-driven agents** - Not scheduled polling
4. **Cloudflare Workers compatible** - Everything must work on Workers (JavaScript/TypeScript only)
5. **Start simple, add complexity later** - Don't over-engineer upfront

## Current Implementation Status

- ✅ **GitHub MCP**: Full JavaScript port with Actions support
- ✅ **Google Calendar MCP**: Full port with 12 tools (Cloudflare Workers compatible)
- ✅ **Google Drive MCP**: 7 tools (read, write, list, search, createFolder, moveItem, renameItem) - Cloudflare Workers compatible
- ✅ **OAuth Broker**: Central token management (deployed)
- ✅ **MCP Gateway**: Combined gateway with direct imports (ready to deploy)
- ✅ **Dual Transport**: stdio (local) + HTTP (Workers)
- ✅ **Mobile Access**: Remote MCPs in claude.ai work automatically in Claude phone app!
- ✅ **Gmail MCP**: Email processing with PDF/image parsing and date extraction
- ✅ **Supabase MCP**: Database operations with table introspection
- ✅ **Asana Integration**: Using [Asana's official MCP server](https://developers.asana.com/docs/using-asanas-mcp-server) (no custom implementation needed)
- 💡 **Future Ideas**: Claude API wrapper MCP for auto-saving conversation summaries

See [`vision/CURRENT_STATE.md`](./vision/CURRENT_STATE.md) for detailed status.

