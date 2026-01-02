# Setting Up wrangler.toml.local for Deployment

## Problem

The `wrangler.toml` files in this repo use placeholders (`YOUR_SUBDOMAIN`, `YOUR_USER_ID`) to keep them generic. This means they won't work directly for deployment.

## Solution: wrangler.toml.local

Create a `wrangler.toml.local` file in each package directory. This file is **gitignored**, so you can use your personal values.

## Quick Setup

### 1. OAuth Broker

Create `packages/oauth-broker/wrangler.toml.local`:

```toml
# This file is gitignored - can contain personal values
# Wrangler automatically merges this with wrangler.toml

# No vars needed for oauth-broker (uses secrets only)
```

### 2. MCP Gateway

Create `packages/mcp-gateway/wrangler.toml.local`:

```toml
# This file is gitignored - can contain personal values
[vars]
OAUTH_BROKER_URL = "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev"
USER_ID = "YOUR_USER_ID"
```

Replace `YOUR_SUBDOMAIN` and `YOUR_USER_ID` with your actual values.

### 3. GitHub MCP (if deploying separately)

Create `packages/mcp-github/wrangler.toml.local`:

```toml
[vars]
OAUTH_BROKER_URL = "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev"
```

### 4. Calendar MCP (if deploying separately)

Create `packages/mcp-calendar/wrangler.toml.local`:

```toml
[vars]
OAUTH_BROKER_URL = "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev"
```

## How It Works

1. Wrangler reads `wrangler.toml` (committed, with placeholders)
2. If `wrangler.toml.local` exists, Wrangler merges it (gitignored, with real values)
3. Local values override placeholder values
4. Result: Functional deployment config without committing personal info

## Example

**wrangler.toml (committed):**
```toml
[vars]
OAUTH_BROKER_URL = "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev"
USER_ID = "YOUR_USER_ID"
```

**wrangler.toml.local (gitignored):**
```toml
[vars]
OAUTH_BROKER_URL = "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev"
USER_ID = "jason"
```

**Result when deploying:**
- Uses `https://oauth-broker.YOUR_SUBDOMAIN.workers.dev`
- Uses `jason` as USER_ID
- Personal values never committed to git

## Alternative: Environment Variables

You can also override via environment variables:

```bash
export OAUTH_BROKER_URL="https://oauth-broker.your-subdomain.workers.dev"
export USER_ID="your-user-id"
cd packages/mcp-gateway
wrangler deploy
```

## Best Practice

✅ **Use `wrangler.toml.local`** for personal values (gitignored)  
✅ **Keep `wrangler.toml`** with placeholders (committed)  
✅ **Use `wrangler secret put`** for secrets (never in files)

See [`docs/development/WRANGLER_BEST_PRACTICES.md`](../development/WRANGLER_BEST_PRACTICES.md) for full details.

