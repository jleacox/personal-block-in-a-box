# Project Intent & Vision

## The Story

**Block** (formerly Square) built an internal AI agent system called "Goose" that transformed how their ~8,000 employees work. Using 60+ Model Context Protocol (MCP) servers, they achieved **50-75% time savings** on common engineering tasks. They open-sourced their architecture and published a comprehensive playbook, proving that MCP infrastructure delivers measurable productivity gains at enterprise scale. See [`../reference/GOOSE_VS_BLOCK_IN_A_BOX.md`](../reference/GOOSE_VS_BLOCK_IN_A_BOX.md) for detailed analysis and links to Block's original case study articles.

**"Block-in-a-Box"** means taking Block's proven patterns and making them accessible for personal use—packaging their enterprise-grade architecture into something an individual can deploy and use. It's Block's infrastructure, but sized for one person instead of 8,000 employees.

**"Personal"** emphasizes that this is designed for individual productivity automation, not enterprise deployment. It's your own personal AI infrastructure, running on Cloudflare Workers (free tier) and Supabase (free tier), costing ~$10-20/month instead of millions.

## The Goal

This repository implements Block's MCP server design patterns for personal productivity automation. It's a **full JavaScript/TypeScript port** of the official GitHub MCP server (originally written in Go), plus additional integrations for Gmail, Calendar, Drive, Supabase, and more. For Asana, we use [Asana's official MCP server](https://developers.asana.com/docs/using-asanas-mcp-server) - no custom implementation needed.

## What Makes This Different

**Block's Goose:**
- Single Electron app interface
- 60+ internal MCP servers
- Databricks-hosted LLM (enterprise)
- Desktop-only access
- Enterprise security/compliance

**Personal Block-in-a-Box:**
- Multiple interfaces (Cursor, Claude Desktop, Claude.ai, Claude phone app)
- 5-6 core MCP servers (what you actually use)
- Direct Claude API (simple, affordable)
- Desktop + mobile access (remote MCPs in claude.ai work automatically in phone app!)
- Personal OAuth (simple, secure)

## Core Principles

1. **Design from workflows, not endpoints** - Build tools that match how you actually work
2. **Consolidate tools aggressively** - Fewer high-level operations > many granular ones
3. **Event-driven agents** - Not scheduled polling
4. **Size limits with helpful fallbacks** - Graceful degradation when content is too large
5. **Context window management** - Active management of conversation context
6. **Separate read-only from destructive operations** - Clear permission boundaries

## Success Criteria

- ✅ Full GitHub MCP port with Actions support
- ✅ Works locally (Cursor, Claude Desktop)
- ✅ Works remotely (Cloudflare Workers, Claude.ai, Claude phone app)
- ✅ OAuth broker for easy authentication
- ✅ ~$10-20/month operating cost
- ✅ Open source and reusable

## Philosophy

**From Block's playbook:**
> "Design from workflows, not endpoints. Consolidate aggressively. Focus tool availability per session. Manage context windows actively."

**Applied here:**
> Start with YOUR workflows. Build what YOU use. Open source what OTHERS need. Don't build unused infrastructure.

**Motto:**
> "Ship weekly, not perfection."

