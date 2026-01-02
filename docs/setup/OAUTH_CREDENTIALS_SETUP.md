# OAuth Credentials Setup Guide

## Getting Your Cloudflare Workers URL (Free!)

**No web hosting needed!** Cloudflare Workers provides free HTTPS URLs:

1. **Deploy your OAuth broker worker** (see `packages/oauth-broker/SETUP.md`)
2. **After deployment**, you'll get a URL like:
   ```
   https://oauth-broker.YOUR_SUBDOMAIN.workers.dev
   ```
   Where `YOUR_SUBDOMAIN` is automatically assigned by Cloudflare.

3. **Find your URL:**
   - Check the output of `wrangler deploy`
   - Or visit [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages

4. **Use this URL** for all OAuth redirect URIs below.

**Note:** Cloudflare Workers are free for reasonable usage. No credit card required for the free tier!

## Google OAuth

### Using Existing Google Credentials

1. **Set secrets in OAuth broker:**
   ```bash
   cd packages/oauth-broker
   wrangler secret put GOOGLE_CLIENT_ID
   # Paste your Google Client ID when prompted
   
   wrangler secret put GOOGLE_CLIENT_SECRET
   # Paste your Google Client Secret when prompted
   ```

2. **Update redirect URI in Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to: APIs & Services → Credentials
   - Find your OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/callback/google`
   - Save

### Creating New Google OAuth App (If Needed)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable APIs:
   - Google Calendar API
   - Gmail API
   - Google Drive API
4. Go to: APIs & Services → Credentials
5. Click "Create Credentials" → "OAuth client ID"
6. Application type: "Web application"
7. Authorized redirect URIs:
   - `https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/callback/google`
   - `http://localhost:8787/callback/google` (for local dev)
8. Copy Client ID and Client Secret
9. Set secrets in OAuth broker (see above)

## GitHub OAuth App

### Creating GitHub OAuth App

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: `Personal Block-in-a-Box`
   - **Homepage URL**: `https://yourdomain.com` (or any URL)
   - **Authorization callback URL**: `https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/callback/github`
4. Click "Register application"
5. Copy:
   - **Client ID** (shown on the page)
   - **Client Secret** (click "Generate a new client secret")

### Setting GitHub Secrets in OAuth Broker

```bash
cd packages/oauth-broker
wrangler secret put GITHUB_CLIENT_ID
# Paste your GitHub Client ID

wrangler secret put GITHUB_CLIENT_SECRET
# Paste your GitHub Client Secret
```

## Quick Setup Checklist

### Google
- ⏳ Create OAuth app in Google Cloud Console (or use existing)
- ⏳ Set redirect URI: `https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/callback/google`
- ⏳ Copy Client ID and Client Secret
- ⏳ Set secrets in OAuth broker

### GitHub
- ⏳ Create OAuth app on GitHub
- ⏳ Set redirect URI: `https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/callback/github`
- ⏳ Copy Client ID and Client Secret
- ⏳ Set secrets in OAuth broker

## After Setting Secrets

1. **Deploy OAuth broker:**
   ```bash
   cd packages/oauth-broker
   wrangler deploy
   ```

2. **Test OAuth flow:**
   - Visit: `https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/auth/google?user_id=YOUR_USER_ID`
   - Replace `YOUR_SUBDOMAIN` with your actual Cloudflare Workers subdomain
   - Replace `YOUR_USER_ID` with your user identifier (e.g., your name or email)
   - Complete OAuth flow
   - Should see "✓ Successfully connected!"

3. **Update MCP gateway:**
   - Update `packages/mcp-gateway/wrangler.toml`:
     ```toml
     [vars]
     OAUTH_BROKER_URL = "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev"
     ```

4. **Update Cursor config:**
   ```json
   {
     "mcpServers": {
       "google-calendar": {
         "command": "node",
         "args": ["${workspaceFolder}/packages/mcp-calendar/dist/index.js"],
         "env": {
           "OAUTH_BROKER_URL": "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev",
           "USER_ID": "YOUR_USER_ID"
         }
       }
     }
   }
   ```
   
   Replace:
   - `YOUR_SUBDOMAIN` with your actual Cloudflare Workers subdomain
   - `YOUR_USER_ID` with your user identifier

## Notes

- **Redirect URIs must match exactly** - including protocol (https) and path
- **Google requires `access_type=offline`** - Already included in OAuth broker code
- **Refresh tokens** - Google provides refresh tokens automatically with `prompt=consent`
- **GitHub tokens** - Don't expire, but can be revoked in GitHub settings

