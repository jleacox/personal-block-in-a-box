# OAuth Broker Setup

## Quick Start

### 1. Create KV Namespace

```bash
cd packages/oauth-broker
wrangler kv namespace create "OAUTH_TOKENS"
wrangler kv namespace create "OAUTH_TOKENS" --preview
```

Update `wrangler.toml` with the returned namespace IDs.

### 2. Set OAuth Credentials

**Google OAuth (Web-based client):**
```bash
cd packages/oauth-broker

# Set Google Client ID
wrangler secret put GOOGLE_CLIENT_ID
# Paste your Google Client ID

# Set Google Client Secret
wrangler secret put GOOGLE_CLIENT_SECRET
# Paste your Google Client Secret
```

**Note:** If secrets already exist, `wrangler secret put` will overwrite them with new values.

# GitHub (create OAuth app first - see docs/setup/OAUTH_CREDENTIALS_SETUP.md)
wrangler secret put GITHUB_CLIENT_ID
# Paste your GitHub Client ID

wrangler secret put GITHUB_CLIENT_SECRET
# Paste your GitHub Client Secret
```

### 3. Get Your Cloudflare Workers URL (Free!)

**No web hosting needed!** Cloudflare Workers provides free HTTPS URLs:

1. **Deploy the worker** (see step 4 below)
2. **After deployment**, `wrangler deploy` will show your worker URL:
   ```
   https://oauth-broker.YOUR_SUBDOMAIN.workers.dev
   ```
   Where `YOUR_SUBDOMAIN` is automatically assigned by Cloudflare.

3. **Find your URL:**
   - Check the output of `wrangler deploy`
   - Or visit [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages → `oauth-broker`

4. **Use this URL** for OAuth redirect URIs:
   ```
   https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/callback/google
   ```

**Note:** Cloudflare Workers are free for reasonable usage. No credit card required!

### 4. Verify Google Redirect URI

Make sure your Google OAuth client has this redirect URI configured:
```
https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/callback/google
```

Replace `YOUR_SUBDOMAIN` with your actual Cloudflare Workers subdomain from step 3.

Verify in:
- [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials

### 5. Deploy

```bash
wrangler deploy
```

The output will show your worker URL. Save this URL for OAuth redirect URI configuration.

### 6. Test

Visit (after deployment, replace with your actual subdomain and user ID):
```
https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/auth/google?user_id=YOUR_USER_ID
```

Complete OAuth flow, should see "✓ Successfully connected!"

## Next Steps

1. Update MCP gateway with OAuth broker URL
2. Update Cursor config to use OAuth broker
3. Connect your accounts via OAuth broker UI

See `docs/setup/OAUTH_CREDENTIALS_SETUP.md` for detailed instructions.

