# GitHub Actions Integration Strategy

## Current Situation

- ✅ **Using**: GitHub Docker MCP (Go-based) for Cursor
- ❌ **Missing**: GitHub Actions support
- 🎯 **Goal**: Add Actions support that works on Cloudflare Workers

## Recommended Approach: Hybrid

### Keep What Works
- Continue using official GitHub Docker MCP for:
  - Issues, PRs, Repos, etc.
  - Local development (Cursor, Claude Desktop)

### Add What's Missing
- Build JavaScript Actions-only server for:
  - Cloudflare Workers deployment
  - Actions-specific tools

## Structure

```
personal-block-in-a-box/
├── packages/
│   └── mcp-github-actions/          # ⭐ NEW: Actions-only server
│       ├── package.json
│       ├── src/
│       │   ├── index.ts             # stdio transport (local)
│       │   ├── worker.ts            # HTTP transport (Cloudflare)
│       │   └── tools/
│       │       └── actions.ts       # Ported from Go
│       └── README.md
│
└── config/
    └── cursor.json                  # Use BOTH servers
```

## Cursor Configuration

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "ghcr.io/github/github-mcp-server:latest"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "github-actions": {
      "command": "node",
      "args": ["packages/mcp-github-actions/src/index.ts"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    }
  }
}
```

## Why This Works

1. **Minimal Porting**: Only port Actions tools (4 consolidated tools)
2. **Reuse Existing**: Keep using Docker MCP for everything else
3. **Cloudflare Ready**: JavaScript server works on Workers
4. **Incremental**: Add Actions support without rebuilding everything

## Tools to Port

From `flip-actions-tool-ff-to-default` branch:

1. `actions_list` - ~200 lines of Go → ~150 lines of TypeScript
2. `actions_get` - ~300 lines of Go → ~200 lines of TypeScript  
3. `actions_run_trigger` - ~250 lines of Go → ~180 lines of TypeScript
4. `get_job_logs` - ~150 lines of Go → ~120 lines of TypeScript

**Total**: ~900 lines of Go → ~650 lines of TypeScript

## Alternative: Full Port (If You Want)

If you want a single unified server:

```
packages/mcp-github/                 # Full JavaScript port
├── src/
│   ├── index.ts                     # All tools (stdio)
│   ├── worker.ts                    # All tools (HTTP)
│   └── tools/
│       ├── issues.ts
│       ├── pull-requests.ts
│       ├── repositories.ts
│       └── actions.ts               # ⭐ Actions included
```

**Trade-off**: More work upfront, but single codebase.

## Recommendation

**Start with Actions-only server** (Option 1):
- Faster to implement
- Proves Cloudflare Workers compatibility
- Can always expand later

**Move to full port later** (Option 2) if:
- You want single codebase
- Docker becomes a pain
- You want full control

## Next Steps

1. Create `packages/mcp-github-actions/` structure
2. Port the 4 consolidated Actions tools
3. Test locally with Cursor
4. Deploy to Cloudflare Workers
5. (Optional) Expand to full port later

Ready to start?

