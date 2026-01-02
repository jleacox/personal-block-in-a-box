# GitHub OAuth Quick Start

Switch from PAT (Personal Access Token) to OAuth client credentials using the OAuth broker.

## Step 1: Create GitHub OAuth App

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: `Personal Block-in-a-Box` (or any name)
   - **Homepage URL**: `https://yourdomain.com` (or any URL - not critical)
   - **Authorization callback URL**: `https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/callback/github`
     - Replace `YOUR_SUBDOMAIN` with your actual Cloudflare Workers subdomain
     - Example: `https://oauth-broker.your-subdomain.workers.dev/callback/github`
4. Click **"Register application"**
5. **Copy your credentials:**
   - **Client ID** (shown immediately on the page)
   - **Client Secret** (click "Generate a new client secret" button, then copy it)

## Step 2: Set Secrets in OAuth Broker

```bash
cd packages/oauth-broker

# Set GitHub Client ID
wrangler secret put GITHUB_CLIENT_ID
# When prompted, paste your GitHub Client ID and press Enter

# Set GitHub Client Secret
wrangler secret put GITHUB_CLIENT_SECRET
# When prompted, paste your GitHub Client Secret and press Enter
```

**Important:** 
- `wrangler secret put` requires **INTERACTIVE input** - you'll be prompted
- **DO NOT** pipe values: `echo $value | wrangler secret put` creates empty secrets!
- You must be in the `packages/oauth-broker` directory

## Step 3: Verify OAuth Broker is Deployed

```bash
cd packages/oauth-broker
wrangler deploy
```

After deployment, note your OAuth broker URL (shown in output):
```
https://oauth-broker.YOUR_SUBDOMAIN.workers.dev
```

## Step 4: Test GitHub OAuth Flow

1. **Start OAuth flow:**
   ```
   https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/auth/github?user_id=YOUR_USER_ID
   ```
   - Replace `YOUR_SUBDOMAIN` with your actual subdomain
   - Replace `YOUR_USER_ID` with your identifier (e.g., `your-username`)

2. **Authorize the app** on GitHub (you'll be redirected to GitHub)

3. **You should see:** "✓ Successfully connected GitHub!"

## Step 5: Update Cursor Configuration

Update your Cursor MCP configuration file (typically `~/.cursor/mcp.json` or `config/cursor.json`):

**Remove the PAT:**
```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-github/dist/index.js"],
      "env": {
        "OAUTH_BROKER_URL": "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev",
        "USER_ID": "YOUR_USER_ID"
      }
    }
  }
}
```

**Note:** Use `${workspaceFolder}` for workspace-relative paths, or provide an absolute path to your project directory.

**Remove this (old PAT method):**
```json
// ❌ Remove this
"GITHUB_TOKEN": "ghp_xxx"
```

## Step 6: Test in Cursor

1. **Restart Cursor** (to reload MCP config)
2. **Try a GitHub command:**
   - "List my repositories"
   - "Create an issue in personal-block-in-a-box: Test OAuth"
3. **It should work!** The MCP server will automatically fetch tokens from the OAuth broker.

## How It Works

1. **Cursor calls GitHub MCP** → MCP server checks for `OAUTH_BROKER_URL`
2. **MCP server calls OAuth broker** → `POST /token/github` with `{ user_id: "YOUR_USER_ID" }`
3. **OAuth broker returns token** → Fresh token (auto-refreshes if expired)
4. **MCP server uses token** → Makes GitHub API calls

## Troubleshooting

### "OAuth broker error" or "No token available"

**Check:**
1. OAuth broker is deployed: `curl https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/health`
2. You completed the OAuth flow (Step 4)
3. `OAUTH_BROKER_URL` and `USER_ID` are set correctly in Cursor config
4. Secrets are set: Check with `wrangler secret list` (from `packages/oauth-broker`)

### "Failed to fetch token from OAuth broker"

**Solution:**
1. Verify OAuth flow was completed (visit `/auth/github?user_id=YOUR_USER_ID` again)
2. Check OAuth broker logs: `cd packages/oauth-broker && wrangler tail`
3. Verify secrets are set: `wrangler secret list`

### Still using PAT?

**The MCP server falls back to PAT automatically if:**
- OAuth broker is not configured (`OAUTH_BROKER_URL` not set)
- OAuth broker returns an error
- `GITHUB_TOKEN` is set in environment

**To force OAuth only:** Remove `GITHUB_TOKEN` from your environment/config.

## Benefits Over PAT

✅ **One-click connection** - No manual token creation  
✅ **Automatic refresh** - Tokens refresh automatically  
✅ **Multi-user ready** - Just change `USER_ID`  
✅ **Easy revocation** - Revoke in GitHub OAuth settings  
✅ **Better security** - No tokens in local files  

## Next Steps

Once GitHub OAuth is working:
- ✅ You can remove `GITHUB_TOKEN` from your local config
- ✅ Same pattern works for Google Calendar (already set up!)
- ✅ Ready for multi-user support (just change `USER_ID`)

