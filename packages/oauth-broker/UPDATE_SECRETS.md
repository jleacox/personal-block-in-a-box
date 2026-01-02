# Updating OAuth Secrets in Cloudflare

## Update Google OAuth Secrets

Since you created a new web-based OAuth client, update the secrets:

```bash
cd packages/oauth-broker

# Update Google Client ID (overwrites old one)
wrangler secret put GOOGLE_CLIENT_ID
# Paste your Google Client ID when prompted

# Update Google Client Secret (overwrites old one)
wrangler secret put GOOGLE_CLIENT_SECRET
# Paste your Google Client Secret when prompted
```

**Note:** `wrangler secret put` will overwrite the existing secret if it already exists, so you can just run it again with the new values.

## Verify Secrets

After updating, you can verify by checking the worker logs or testing the OAuth flow:

```
https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/auth/google?user_id=YOUR_USER_ID
```

Replace:
- `YOUR_SUBDOMAIN` - Your Cloudflare Workers subdomain (see note below)
- `YOUR_USER_ID` - Your user identifier (e.g., your name or email)

## Getting Your Cloudflare Workers URL (Free!)

**No web hosting needed!** Cloudflare Workers provides free HTTPS URLs:

1. **After deploying** your worker with `wrangler deploy`, you'll get a URL like:
   ```
   https://oauth-broker.YOUR_SUBDOMAIN.workers.dev
   ```
   Where `YOUR_SUBDOMAIN` is automatically assigned by Cloudflare (usually your account name or a random string).

2. **Find your URL:**
   - Check the output of `wrangler deploy` - it shows your worker URL
   - Or visit [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages → Your worker name

3. **Use this URL** for:
   - OAuth redirect URIs in Google/GitHub OAuth apps
   - `OAUTH_BROKER_URL` in your MCP configurations
   - Testing OAuth flows

**Note:** Cloudflare Workers are free for reasonable usage. No credit card required for the free tier!

