# Design Philosophy

> Principles from Block's MCP playbook, applied to personal productivity automation.

## Core Principles

### 1. Design from Workflows, Not Endpoints

**What it means:**
- Build tools that match how users actually work
- Don't expose every API endpoint as a separate tool
- Think about the task, not the HTTP method

**Example:**
- ❌ Bad: `get_issue`, `update_issue`, `add_comment`, `add_label`, `assign_issue` (5 tools)
- ✅ Good: `manage_issue` with action parameter (1 tool)

### 2. Consolidate Tools Aggressively

**What it means:**
- Fewer high-level operations > many granular ones
- Reduce tool count per session
- Make tools more powerful, not more numerous

**Example from Block:**
- Linear: Consolidated 30+ tools into 2 (query + mutate)
- GitHub Actions: Consolidated 15+ tools into 4 (list, get, trigger, logs)

**Applied here:**
- GitHub Actions: 4 consolidated tools instead of 15+ individual ones
- Future: Consider GraphQL-style query/mutate pattern for complex services

### 3. Event-Driven Agents

**What it means:**
- Agents respond to events, not scheduled polling
- Use webhooks, streams, or event queues
- Wake up when something happens, not on a timer

**Example:**
- ❌ Bad: Poll GitHub Actions every minute
- ✅ Good: GitHub webhook → Supabase queue → Agent wakes up

### 4. Size Limits with Helpful Fallbacks

**What it means:**
- Set reasonable size limits (e.g., 400KB for files)
- When limit exceeded, provide helpful error message
- Suggest alternatives (head, tail, grep, etc.)

**Example:**
```
Error: File too large (2MB). 
Try: head -100 file.txt or tail -100 file.txt or grep "pattern" file.txt
```

### 5. Context Window Management

**What it means:**
- Actively manage conversation context
- Summarize long conversations
- Reset context when needed
- Don't let context grow unbounded

**Implementation:**
- After 5-7 turns, summarize and reset
- Use Claude's context window efficiently
- Don't include unnecessary history

### 6. Separate Read-Only from Destructive Operations

**What it means:**
- Clear permission boundaries
- Read operations: Always allow
- Write operations: Require confirmation or allowlisting
- Make it obvious what's safe vs. dangerous

**Example:**
- `list_repos` - Always safe
- `create_issue` - Requires confirmation
- `delete_repo` - Requires explicit allowlisting

## Implementation Guidelines

### Start Simple, Add Complexity Later

- Don't build unused infrastructure
- Prove value with minimal features
- Expand only when needed
- Extract to separate repos only if popular

### Cloudflare Workers First

- Everything must work on Workers
- Use Web APIs only (no Node.js-specific code)
- Test Workers compatibility before building
- Document compatibility decisions

### Incremental Development

- One MCP server at a time
- Prove it works before adding more
- Test locally, then deploy remotely
- Document as you build

### Open Source Mindset

- Build for yourself, share what others need
- Credit original implementations
- Document decisions and trade-offs
- Make it easy for others to contribute

## Anti-Patterns to Avoid

### ❌ Over-Engineering

- Don't build infrastructure you don't need
- Don't abstract too early
- Don't optimize prematurely

### ❌ Granular Tools

- Don't expose every API endpoint
- Don't create tools for one-off operations
- Don't fragment functionality unnecessarily

### ❌ Scheduled Polling

- Don't poll APIs on timers
- Don't waste resources checking for changes
- Use events/webhooks instead

### ❌ Ignoring Context Limits

- Don't let conversations grow unbounded
- Don't include unnecessary history
- Don't ignore context window warnings

## References

**Primary Sources:**
- [MCP in the Enterprise: Real World Adoption at Block](https://block.github.io/goose/blog/2025/04/21/mcp-in-enterprise/) - Block's definitive case study (April 2025)
- [Block's Playbook for Designing MCP Servers](https://engineering.block.xyz/blog/blocks-playbook-for-designing-mcp-servers) - Design principles (June 2025)
- [Goose Architecture](https://github.com/block/goose) - Open-source MCP client
- [Model Context Protocol Specification](https://modelcontextprotocol.io/) - Official MCP spec

**Related Documentation:**
- [`../reference/GOOSE_VS_BLOCK_IN_A_BOX.md`](../reference/GOOSE_VS_BLOCK_IN_A_BOX.md) - Comprehensive explanation of relationship to Block and market positioning

