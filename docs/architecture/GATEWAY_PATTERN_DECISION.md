# Gateway Pattern Decision: Combined Gateway vs Separate Workers

## Executive Summary

**Decision:** Use a **Combined Gateway** pattern where a single Cloudflare Worker imports MCP handler code directly, rather than deploying separate workers for each MCP.

**Why:** Eliminates network latency from HTTP calls between workers, simplifies deployment, and matches industry best practices for serverless architectures. Separate packages still provide code organization and local standalone usage.

---

## The Two Approaches

### Option 1: Separate Workers (What We Initially Considered)

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Claude.ai)                    │
└───────────────────────┬─────────────────────────────────┘
                         │ HTTP
                         ↓
┌─────────────────────────────────────────────────────────┐
│              MCP Gateway Worker                         │
│  (Routes requests to appropriate MCP workers)            │
└───────┬───────────────────────┬─────────────────────────┘
        │ HTTP                   │ HTTP
        ↓                        ↓
┌──────────────────┐   ┌──────────────────────┐
│  GitHub MCP      │   │  Calendar MCP         │
│  Worker          │   │  Worker               │
│                  │   │                       │
│  - Issues        │   │  - Events             │
│  - PRs           │   │  - Calendars          │
│  - Actions       │   │  - Freebusy           │
└────────┬─────────┘   └──────────┬───────────┘
         │                        │
         ↓                        ↓
    GitHub API              Google Calendar API
```

**Network Hops:**
- Client → Gateway: 1 HTTP call (~50-100ms)
- Gateway → GitHub Worker: 1 HTTP call (~50-100ms)
- GitHub Worker → GitHub API: 1 HTTP call (~50-100ms)
- **Total: 3 hops, ~150-300ms latency**

**With Service Bindings (Cloudflare internal):**
- Client → Gateway: 1 HTTP call (~50-100ms)
- Gateway → GitHub Worker: Service binding (~1-5ms internal)
- GitHub Worker → GitHub API: 1 HTTP call (~50-100ms)
- **Total: 3 hops, ~101-205ms latency** (better, but still extra hop)

### Option 2: Combined Gateway (What We Chose)

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Claude.ai)                    │
└───────────────────────┬─────────────────────────────────┘
                         │ HTTP
                         ↓
┌─────────────────────────────────────────────────────────┐
│              MCP Gateway Worker                         │
│                                                          │
│  ┌──────────────────┐   ┌──────────────────────┐      │
│  │  GitHub Handler  │   │  Calendar Handler    │      │
│  │  (direct import) │   │  (direct import)      │      │
│  │                  │   │                       │      │
│  │  - Issues        │   │  - Events             │      │
│  │  - PRs           │   │  - Calendars          │      │
│  │  - Actions       │   │  - Freebusy           │      │
│  └────────┬─────────┘   └──────────┬───────────┘      │
│           │                         │                   │
│           └───────────┬─────────────┘                   │
│                       │ (direct function calls)         │
└───────────────────────┼─────────────────────────────────┘
                        │
                        ↓
        ┌───────────────────────────────┐
        │   External APIs               │
        │   GitHub | Google Calendar     │
        └───────────────────────────────┘
```

**Network Hops:**
- Client → Gateway: 1 HTTP call (~50-100ms)
- Gateway → GitHub API: 1 HTTP call (~50-100ms) (direct, no intermediate worker)
- **Total: 2 hops, ~100-200ms latency**

**Key Difference:** No HTTP call between gateway and MCP handlers - they're direct function calls within the same worker.

---

## Why Separate Packages Still Matter

Even though the gateway imports handlers directly, separate packages (`packages/mcp-github/`, `packages/mcp-calendar/`) are still valuable:

### 1. **Local Standalone Usage (stdio transport)**

Each MCP package can run as a separate process for local development:

```json
// Cursor mcp.json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["packages/mcp-github/dist/index.js"]  // Separate process
    },
    "google-calendar": {
      "command": "node",
      "args": ["packages/mcp-calendar/dist/index.js"]  // Separate process
    }
  }
}
```

**Local Architecture:**
```
Cursor IDE
  ├─→ spawns mcp-github (stdio) → separate Node.js process
  └─→ spawns mcp-calendar (stdio) → separate Node.js process
```

Each MCP is a **separate process** when used locally. The packages must be standalone.

### 2. **Code Reuse**

Same tool code works for both:
- **Local (stdio)**: `packages/mcp-github/src/index.ts` - standalone MCP server
- **Remote (gateway)**: `packages/mcp-gateway/src/mcp-handlers.ts` - imports same tool functions

**Example:**
```typescript
// packages/mcp-github/src/tools/issues.ts
export async function createIssue(octokit: Octokit, args: any) {
  // Tool implementation
}

// Used in local stdio server:
import { createIssue } from './tools/issues.js';
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'create_issue') {
    return await createIssue(octokit, request.params.arguments);
  }
});

// Used in gateway (direct import):
import { createIssue } from '../../mcp-github/src/tools/issues.js';
const result = await createIssue(octokit, args);
```

### 3. **Testing & Development**

- Test each MCP independently
- Develop tools without touching gateway code
- Clear boundaries and responsibilities

### 4. **Future Flexibility**

Can extract to separate workers later if needed:
- If GitHub MCP needs independent scaling
- If Calendar MCP needs different region deployment
- If we want to offer MCPs as separate services

### 5. **Code Organization**

- Clear separation of concerns
- Easier to maintain
- Easier to open source individual MCPs
- Matches monorepo best practices

---

## What Block Did (For Reference)

**Block's Architecture:**
- **Transport:** stdio only (no HTTP/remote access)
- **Deployment:** All MCP servers run locally in Electron app
- **Network:** Zero network calls between MCPs (all in-process)
- **Pattern:** Each MCP is a separate process, but all run on same machine

**Why Block's Approach Doesn't Apply:**
- Block: Desktop app only, no remote access needed
- Us: Multi-interface (Cursor, Claude Desktop, Claude.ai, mobile)
- Block: No network routing decisions (everything local)
- Us: Need to optimize for remote access latency

**Key Insight:** Block didn't face this decision because they only used stdio transport. We need HTTP transport for remote access, which introduces network latency considerations.

---

## Best Practices in the Wild

### Industry Pattern: "Unified Gateway + Segregated Server Code"

This pattern is common in serverless architectures:

**Vercel's Approach:**
- Separate packages (`@vercel/edge`, `@vercel/functions`)
- Combined deployment (one edge function can import multiple packages)
- Same code works locally and in production

**Netlify's Approach:**
- Separate packages for different functions
- Combined deployment when functions share code
- Direct imports for better performance

**Cloudflare Workers Best Practice:**
- Use Service Bindings for internal communication (faster than HTTP)
- But direct imports are even faster (no network call at all)
- Combine related functionality in one worker when possible

### When to Use Separate Workers

Use separate workers when:
- ✅ MCPs need independent scaling (e.g., GitHub gets 10x more traffic)
- ✅ MCPs need different regions (e.g., Calendar in EU, GitHub in US)
- ✅ MCPs have different security requirements
- ✅ MCPs are developed/maintained by different teams
- ✅ You want to offer MCPs as separate services/products

### When to Use Combined Gateway

Use combined gateway when:
- ✅ MCPs share similar traffic patterns
- ✅ Latency is critical (fewer network hops)
- ✅ Simpler deployment is preferred
- ✅ MCPs are part of same product/service
- ✅ Code organization via packages is sufficient

**Our Case:** Combined gateway makes sense because:
- All MCPs are part of "Personal Block-in-a-Box"
- Latency matters for voice/mobile use cases
- Simpler deployment (one worker vs many)
- Code organization via packages is sufficient
- Can split later if needed

---

## Network Traffic Comparison

### Separate Workers (HTTP)

```
Request Flow:
1. Client → Gateway: HTTP POST (~50-100ms)
2. Gateway → GitHub Worker: HTTP POST (~50-100ms)
3. GitHub Worker → GitHub API: HTTP GET (~50-100ms)
4. GitHub API → GitHub Worker: Response (~50-100ms)
5. GitHub Worker → Gateway: Response (~50-100ms)
6. Gateway → Client: Response (~50-100ms)

Total: 6 network calls, ~300-600ms end-to-end
```

### Separate Workers (Service Bindings)

```
Request Flow:
1. Client → Gateway: HTTP POST (~50-100ms)
2. Gateway → GitHub Worker: Service Binding (~1-5ms internal)
3. GitHub Worker → GitHub API: HTTP GET (~50-100ms)
4. GitHub API → GitHub Worker: Response (~50-100ms)
5. GitHub Worker → Gateway: Response (~1-5ms internal)
6. Gateway → Client: Response (~50-100ms)

Total: 4 external + 2 internal calls, ~152-260ms end-to-end
```

### Combined Gateway (Direct Imports)

```
Request Flow:
1. Client → Gateway: HTTP POST (~50-100ms)
2. Gateway → GitHub API: HTTP GET (~50-100ms) [direct function call, no network]
3. GitHub API → Gateway: Response (~50-100ms)
4. Gateway → Client: Response (~50-100ms)

Total: 4 network calls, ~200-400ms end-to-end
```

**Latency Savings:** ~100-200ms per request (33-50% faster)

---

## Implementation Pattern

### Package Structure

```
packages/
├── mcp-github/              # Standalone MCP server
│   ├── src/
│   │   ├── index.ts         # stdio transport (local)
│   │   ├── worker.ts        # HTTP transport (standalone worker option)
│   │   ├── tools/           # Tool implementations
│   │   └── utils/           # Shared utilities
│   └── package.json
│
├── mcp-calendar/            # Standalone MCP server
│   ├── src/
│   │   ├── index.ts         # stdio transport (local)
│   │   ├── worker.ts        # HTTP transport (standalone worker option)
│   │   ├── tools/           # Tool implementations
│   │   └── utils/           # Shared utilities
│   └── package.json
│
└── mcp-gateway/             # Combined gateway
    ├── src/
    │   ├── index.ts         # Main gateway entry point
    │   └── mcp-handlers.ts  # Imports from mcp-github, mcp-calendar
    └── package.json
```

### Gateway Handler Pattern

```typescript
// packages/mcp-gateway/src/mcp-handlers.ts
import { createIssue } from '../../mcp-github/src/tools/issues.js';
import { listEvents } from '../../mcp-calendar/src/tools/events.js';

export class GitHubMCP {
  async callTool(toolName: string, args: any) {
    switch (toolName) {
      case 'create_issue':
        return await createIssue(this.octokit, args);  // Direct function call
      // ...
    }
  }
}
```

**Key Point:** Gateway imports tool functions directly, not via HTTP or service bindings.

---

## Decision Matrix

| Factor | Separate Workers | Combined Gateway | Winner |
|--------|-----------------|------------------|--------|
| **Latency** | 3 hops (~150-300ms) | 2 hops (~100-200ms) | ✅ Combined |
| **Deployment** | Multiple workers | Single worker | ✅ Combined |
| **Scaling** | Independent | Together | ✅ Separate |
| **Code Organization** | Packages + Workers | Packages only | ✅ Combined |
| **Testing** | Test workers separately | Test gateway + packages | ✅ Separate |
| **Maintenance** | More complex | Simpler | ✅ Combined |
| **Cost** | More requests | Fewer requests | ✅ Combined |
| **Flexibility** | Can scale independently | Must scale together | ✅ Separate |

**Our Decision:** Combined Gateway wins on 5/8 factors, including the critical ones (latency, deployment, cost).

---

## Migration Path

If we need to split later:

1. **Extract to separate workers:**
   - Deploy `mcp-github/src/worker.ts` as standalone worker
   - Deploy `mcp-calendar/src/worker.ts` as standalone worker
   - Update gateway to call workers via HTTP/service bindings

2. **Code stays the same:**
   - Tool implementations don't change
   - Only transport layer changes (direct import → HTTP call)

3. **Gradual migration:**
   - Can migrate one MCP at a time
   - Gateway can support both patterns during transition

---

## Summary

**Decision:** Use **Combined Gateway** pattern.

**Rationale:**
1. ✅ **Latency:** 33-50% faster (2 hops vs 3 hops)
2. ✅ **Simplicity:** One deployment vs multiple
3. ✅ **Cost:** Fewer network requests
4. ✅ **Code Reuse:** Same tool code for local (stdio) and remote (gateway)
5. ✅ **Flexibility:** Can split to separate workers later if needed

**Separate packages still provide:**
- Local standalone usage (stdio transport)
- Code organization and maintainability
- Independent testing and development
- Future flexibility to split if needed

**This matches:**
- Industry best practices (Vercel, Netlify patterns)
- Serverless optimization principles (minimize network hops)
- Your old repo's proven pattern
- Block's philosophy (simpler is better, but adapted for remote access)

---

## References

- [Cloudflare Workers Service Bindings](https://developers.cloudflare.com/workers/configuration/bindings/service-bindings/)
- [Vercel Edge Functions Architecture](https://vercel.com/docs/concepts/functions/edge-functions)
- [Block's MCP Server Playbook](https://developer.squareup.com/blog/building-effective-agents)
- [Serverless Architecture Patterns](https://aws.amazon.com/blogs/compute/building-well-architected-serverless-applications/)

