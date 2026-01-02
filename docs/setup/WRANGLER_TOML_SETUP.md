# Wrangler.toml Setup Guide

## Overview

This project uses `wrangler.toml` files for Cloudflare Workers configuration. These files contain personal values (subdomains, user IDs, API keys) and are **gitignored** to prevent committing sensitive information.

## Setup Process

### 1. Copy Example Files

Each package has a `wrangler.toml.example` file. Copy it to create your own `wrangler.toml`:

```bash
# For each package that needs configuration:
cd packages/mcp-gateway
cp wrangler.toml.example wrangler.toml
```

### 2. Fill In Your Values

Edit `wrangler.toml` and replace placeholders:

```toml
[vars]
OAUTH_BROKER_URL = "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev"  # Replace YOUR_SUBDOMAIN
USER_ID = "YOUR_USER_ID"  # Replace with your user ID
```

### 3. Deploy

Now `wrangler deploy` will use your actual values:

```bash
cd packages/mcp-gateway
wrangler deploy
```

## Why This Approach?

### Problem with `wrangler.toml.local`

**`wrangler.toml.local` only works for `wrangler dev`, NOT for `wrangler deploy`.**

- ✅ `wrangler dev` - Uses `wrangler.toml.local` (merges with `wrangler.toml`)
- ❌ `wrangler deploy` - **Ignores `wrangler.toml.local`** (only uses `wrangler.toml`)

This is why your production deployments weren't getting the correct values.

### Solution: Gitignore `wrangler.toml`

1. **Personal values in `wrangler.toml`** - Contains your actual subdomains, user IDs, etc.
2. **Gitignored** - Never committed to the repository
3. **Example files** - `wrangler.toml.example` shows the structure with placeholders
4. **Each developer** - Creates their own `wrangler.toml` from the example

## Packages That Need Configuration

### `packages/mcp-gateway/`
- **Required:** `OAUTH_BROKER_URL`, `USER_ID`
- **Optional:** `SUPABASE_URL`, `SUPABASE_KEY` (or use secrets)

### `packages/oauth-broker/`
- **Required:** KV namespace IDs (already in example)
- **Secrets:** OAuth client IDs/secrets (set via `wrangler secret put`)

### `packages/mcp-github/`
- **Required:** `OAUTH_BROKER_URL`

### `packages/mcp-calendar/`
- **Required:** `OAUTH_BROKER_URL`

## Secrets vs Variables

### Variables (`[vars]` in `wrangler.toml`)
- Non-sensitive configuration
- URLs, user IDs, feature flags
- **Gitignored** (personal values)

### Secrets (`wrangler secret put`)
- Sensitive credentials
- API keys, OAuth client secrets
- **Never in files** - set interactively:
  ```bash
  cd packages/oauth-broker
  wrangler secret put GOOGLE_CLIENT_SECRET
  # Paste value when prompted
  ```

## Best Practices

1. **Never commit `wrangler.toml`** - It's gitignored for a reason
2. **Always update `wrangler.toml.example`** - When adding new variables
3. **Use secrets for sensitive data** - Not `[vars]`
4. **Document in README** - What variables are needed and why

## Troubleshooting

### "Variable not found" in production
- Check that `wrangler.toml` exists (not just `.example`)
- Verify values are correct (not placeholders)
- Redeploy after changes: `wrangler deploy`

### "Secret not found"
- Set secrets interactively: `wrangler secret put SECRET_NAME`
- Must run from package directory where `wrangler.toml` exists
- Secrets are per-worker, not global

### Values work locally but not in production
- `wrangler.toml.local` only works for `wrangler dev`
- Production uses `wrangler.toml` only
- Make sure values are in `wrangler.toml`, not just `.local`

## References

- [Cloudflare Workers Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Wrangler Secrets](https://developers.cloudflare.com/workers/wrangler/commands/#secret)

