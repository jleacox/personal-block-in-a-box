# Cloudflare Worker Architecture Decision

> **Note:** This document covers OAuth broker separation. For MCP gateway pattern (combined vs separate MCP workers), see [GATEWAY_PATTERN_DECISION.md](./GATEWAY_PATTERN_DECISION.md).

## Question: Separate OAuth Broker vs Consolidated Worker?

Should OAuth broker and MCP gateway be:
1. **Separate workers** (dedicated OAuth broker + separate MCP gateway)
2. **Consolidated worker** (OAuth + MCP routing in one worker)

## Recommendation: **Separate Workers** (Recommended)

### Architecture

```
┌─────────────────────────────────────┐
│   OAuth Broker Worker                │
│   https://auth.yourdomain.com       │
│                                      │
│   Routes:                           │
│   GET  /auth/{service}              │
│   GET  /callback/{service}          │
│   POST /token/{service}             │
│                                      │
│   Storage: Cloudflare KV            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   MCP Gateway Worker                │
│   https://mcp.yourdomain.com        │
│                                      │
│   Routes:                           │
│   POST /mcp/sse                     │
│   GET  /mcp/servers                 │
│                                      │
│   Calls OAuth Broker for tokens    │
│   Routes to MCP servers            │
└─────────────────────────────────────┘
```

### Why Separate?

**Pros:**
1. ✅ **Separation of concerns** - Auth logic separate from routing logic
2. ✅ **Independent scaling** - OAuth broker and gateway can scale differently
3. ✅ **Easier testing** - Test OAuth flows independently
4. ✅ **Clearer boundaries** - OAuth broker is reusable by other services
5. ✅ **Better security** - OAuth secrets isolated from MCP routing
6. ✅ **Easier maintenance** - Changes to OAuth don't affect MCP routing

**Cons:**
- ⚠️ Two deployments instead of one
- ⚠️ Two workers to manage

### Alternative: Consolidated Worker (Old Repo Pattern)

The old repo (`mobile-voice-to-code-platform`) used a consolidated approach:
- Single `cloudflare-gateway` worker
- OAuth endpoints + MCP routing in one place
- Simpler deployment (one worker)

**When to use consolidated:**
- Small projects with limited OAuth needs
- You want simpler deployment
- OAuth and MCP routing are tightly coupled

## Recommended Structure for This Repo

### Option 1: Separate Workers (Recommended)

```
packages/
├── oauth-broker/          # Dedicated OAuth worker
│   ├── src/
│   │   ├── index.ts       # OAuth endpoints only
│   │   ├── oauth.ts       # OAuth flow logic
│   │   └── storage.ts     # KV operations
│   └── wrangler.toml
│
└── mcp-gateway/           # MCP routing worker
    ├── src/
    │   ├── index.ts       # MCP routing only
    │   ├── mcp-handlers.ts
    │   └── auth.ts        # Calls OAuth broker
    └── wrangler.toml
```

**Benefits:**
- OAuth broker can be reused by other projects
- Clear separation of concerns
- Easier to test and maintain

### Option 2: Consolidated Worker (Simpler)

```
packages/
└── mcp-gateway/           # Combined OAuth + MCP routing
    ├── src/
    │   ├── index.ts       # All routes (OAuth + MCP)
    │   ├── oauth.ts       # OAuth flow logic
    │   ├── mcp-handlers.ts
    │   └── auth.ts
    └── wrangler.toml
```

**Benefits:**
- One deployment
- Simpler for small projects
- Matches old repo pattern

## Comparison with Old Repo

**Old Repo (`mobile-voice-to-code-platform`):**
- ✅ Consolidated: `packages/cloudflare-gateway` has both OAuth and MCP routing
- ✅ Uses Hono framework
- ✅ Single worker deployment

**This Repo:**
- **Recommendation**: Separate workers for better architecture
- **Alternative**: Consolidated if you want simpler deployment

## Decision Matrix

| Factor | Separate Workers | Consolidated |
|--------|-----------------|--------------|
| **Deployment complexity** | 2 deployments | 1 deployment |
| **Code organization** | Better separation | More coupled |
| **Reusability** | OAuth broker reusable | Tightly coupled |
| **Testing** | Easier to test | More complex |
| **Scaling** | Independent | Together |
| **Maintenance** | Clearer boundaries | All in one place |

## Recommendation

**Start with separate workers** for this repo:
1. Better architecture (separation of concerns)
2. OAuth broker can be reused
3. Easier to test and maintain
4. Can always consolidate later if needed

**If you want simpler deployment**, consolidated is fine too (matches old repo pattern).

## Implementation Plan

### Phase 1: OAuth Broker (Separate Worker)
```
packages/oauth-broker/
- Deploy to: https://auth.yourdomain.com
- Handles: OAuth flows, token storage, token refresh
- Used by: MCP gateway, future services
```

### Phase 2: MCP Gateway (Separate Worker)
```
packages/mcp-gateway/
- Deploy to: https://mcp.yourdomain.com
- Handles: MCP routing, tool execution
- Calls: OAuth broker for tokens
```

### Alternative: Consolidated
```
packages/mcp-gateway/
- Deploy to: https://mcp.yourdomain.com
- Handles: Both OAuth and MCP routing
- Single worker, simpler deployment
```

