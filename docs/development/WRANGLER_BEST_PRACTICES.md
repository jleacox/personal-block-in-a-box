# Wrangler Configuration Best Practices

## Overview

`wrangler.toml` files should be committed to git, but with placeholders for personal/subdomain-specific values. Actual deployment values are set via:
- `wrangler.toml.local` (gitignored, local overrides)
- `wrangler secret put` (for secrets)
- Environment variables

## What Should Be Gitignored

### ✅ Always Gitignore

1. **`.wrangler/` directory** - Build artifacts and temporary files
   - Added to root `.gitignore`
   - Contains compiled bundles, dev server files, etc.

2. **`wrangler.toml.local`** - Local overrides (if you create one)
   - Personal subdomains, local KV namespace IDs, etc.
   - Can contain personal references since it's gitignored

3. **`.env` and `.env.local`** - Environment variables
   - Already in `.gitignore`
   - Can contain secrets/credentials since gitignored

### ✅ Commit to Git

1. **`wrangler.toml`** - Base configuration
   - Should use placeholders: `YOUR_SUBDOMAIN`, `YOUR_USER_ID`
   - Non-secret configuration (KV namespace IDs are OK if they're already public)
   - Works as a template for others

## Best Practice Pattern

### wrangler.toml (Committed)

```toml
name = "mcp-gateway"
main = "src/index.ts"
compatibility_date = "2024-12-30"
compatibility_flags = ["nodejs_compat"]

# Environment variables (use placeholders)
[vars]
OAUTH_BROKER_URL = "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev"
USER_ID = "YOUR_USER_ID"

# KV Namespaces (real IDs are OK - they're not secrets)
[[kv_namespaces]]
binding = "OAUTH_TOKENS"
id = "f6553e7719f64e30a230177f152b6db1"
preview_id = "cc14169a48ae4bde8f81e583624dea86"
```

### wrangler.toml.local (Gitignored, Optional)

Create this file locally if you want to override values:

```toml
# This file is gitignored - can contain personal values
[vars]
OAUTH_BROKER_URL = "https://oauth-broker.your-subdomain.workers.dev"
USER_ID = "your-user-id"
```

**Note:** Wrangler automatically merges `wrangler.toml.local` with `wrangler.toml` if it exists.

### Secrets (Never in Files)

```bash
# Set secrets via wrangler CLI (never in files)
cd packages/oauth-broker
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
```

## Current Setup

### ✅ Root `.gitignore`

```
.wrangler/          # Wrangler build artifacts
.env                # Environment variables
.env.local          # Local environment variables
```

### ✅ Package-Level `.gitignore`

Each package has its own `.gitignore` for package-specific ignores:
- `node_modules/`
- `dist/`
- `wrangler.toml.local` (if you create one)

### ✅ wrangler.toml Files

All `wrangler.toml` files use placeholders:
- `YOUR_SUBDOMAIN` instead of actual subdomain
- `YOUR_USER_ID` instead of actual user ID
- Real KV namespace IDs are OK (they're not secrets)

## Making wrangler.toml Functional for Deployment

### Option 1: Use wrangler.toml.local (Recommended)

1. Create `wrangler.toml.local` in each package directory
2. Add personal values (this file is gitignored)
3. Wrangler automatically merges it with `wrangler.toml`

**Example:**
```bash
# packages/mcp-gateway/wrangler.toml.local
[vars]
OAUTH_BROKER_URL = "https://oauth-broker.your-subdomain.workers.dev"
USER_ID = "your-user-id"
```

### Option 2: Override via Environment Variables

```bash
# Set environment variables before deploying
export OAUTH_BROKER_URL="https://oauth-broker.your-subdomain.workers.dev"
export USER_ID="your-user-id"
wrangler deploy
```

### Option 3: Edit wrangler.toml Locally (Not Recommended)

You can edit `wrangler.toml` directly, but:
- ❌ Changes will show up in `git status`
- ❌ Risk of accidentally committing personal values
- ✅ Use `wrangler.toml.local` instead

## Documentation Rule Update

**Rule:** If a file is gitignored, it's OK to use personal references/credentials in it.

**Examples:**
- ✅ `.env.local` - Can contain `GITHUB_TOKEN=ghp_xxx` (gitignored)
- ✅ `wrangler.toml.local` - Can contain `OAUTH_BROKER_URL = "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev"` (gitignored)
- ✅ `.wrangler/` directory - Can contain anything (gitignored)
- ❌ `wrangler.toml` - Must use placeholders (committed to git)
- ❌ `README.md` - Must use placeholders (committed to git)

## Summary

1. **`.wrangler/`** - Always gitignored (build artifacts)
2. **`wrangler.toml`** - Committed with placeholders
3. **`wrangler.toml.local`** - Gitignored, can have personal values (optional)
4. **Secrets** - Use `wrangler secret put` (never in files)
5. **Personal values in gitignored files** - ✅ OK
6. **Personal values in committed files** - ❌ Never

