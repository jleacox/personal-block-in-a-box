# Automation Scripts Roadmap

## Overview

This document outlines the implementation plan for automation scripts and agentic setup workflows to make Personal Block-in-a-Box accessible to non-technical users.

See [`../vision/AUTOMATION_VISION.md`](../vision/AUTOMATION_VISION.md) for the vision and goals.

---

## Phase 1: Essential Scripts (Quick Wins)

### 1. Setup Validation Script

**File:** `scripts/validate-setup.js`

**Features:**
- Check if all required files exist
- Validate `wrangler.toml.local` files have real values (not placeholders)
- Test OAuth broker connectivity
- Check if Cloudflare secrets are set
- Validate Cursor config paths
- Provide checklist of what's missing

**Output:**
```
✅ OAuth broker deployed
✅ GitHub OAuth secrets set
❌ Google OAuth secrets missing
✅ Cursor config exists
❌ wrangler.toml.local files missing
```

### 2. Cursor Config Generator

**File:** `scripts/generate-cursor-config.js`

**Features:**
- Read `config/cursor.json.example`
- Prompt for workspace path (auto-detect current directory)
- Prompt for OAuth broker URL
- Prompt for User ID
- Generate `cursor.json` with correct paths
- Optionally copy to Cursor config location

**Usage:**
```bash
npm run setup:cursor-config
```

### 3. Wrangler Local Config Generator

**File:** `scripts/generate-wrangler-local.js`

**Features:**
- Detect or prompt for OAuth broker URL
- Prompt for User ID
- Generate `wrangler.toml.local` for all packages
- Validate URLs
- Skip if files already exist (with override option)

**Usage:**
```bash
npm run setup:wrangler-local
```

---

## Phase 2: OAuth Setup Guides

### 4. GitHub OAuth App Setup Guide

**File:** `scripts/setup-github-oauth.js`

**Features:**
- Open GitHub OAuth app creation page (or provide URL)
- Guide through form fields:
  - Application name (suggest: "Personal Block-in-a-Box")
  - Homepage URL (optional)
  - Authorization callback URL (auto-fill from OAuth broker URL)
- Validate callback URL format
- Provide instructions for copying Client ID/Secret
- Optionally run `wrangler secret put` commands interactively

**Usage:**
```bash
npm run setup:github-oauth
```

**Output:**
```
1. Opening GitHub OAuth app creation page...
2. Your OAuth broker URL: https://oauth-broker.YOUR_SUBDOMAIN.workers.dev
3. Use this callback URL: https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/callback/github
4. After creating the app, paste your Client ID:
   > [user pastes]
5. Paste your Client Secret:
   > [user pastes]
6. Setting secrets in Cloudflare...
   ✅ GITHUB_CLIENT_ID set
   ✅ GITHUB_CLIENT_SECRET set
```

### 5. Google Cloud OAuth Client Setup Guide

**File:** `scripts/setup-google-oauth.js`

**Features:**
- Open Google Cloud Console (or provide URL)
- Guide through OAuth client creation:
  - Select "Web application"
  - Add redirect URI (auto-fill from OAuth broker URL)
- Validate redirect URI format
- Provide instructions for copying Client ID/Secret
- Optionally run `wrangler secret put` commands

**Usage:**
```bash
npm run setup:google-oauth
```

### 6. OAuth Broker Secrets Setup

**File:** `scripts/setup-oauth-secrets.js`

**Features:**
- Interactive prompts for all OAuth credentials
- Runs `wrangler secret put` commands
- Validates secrets were set
- Tests OAuth broker connectivity
- Provides checklist of what's set

**Usage:**
```bash
npm run setup:oauth-secrets
```

---

## Phase 3: Full Automation

### 7. Interactive Setup Wizard

**File:** `scripts/setup-wizard.js`

**Features:**
- One command to rule them all
- Guides through entire setup:
  1. Check prerequisites (Node.js, npm, Cloudflare account)
  2. Install dependencies
  3. Build packages
  4. Deploy OAuth broker (or guide deployment)
  5. Create GitHub OAuth app (guided)
  6. Create Google OAuth client (guided)
  7. Set OAuth secrets
  8. Generate configs
  9. Validate setup
- Saves progress (can resume)
- Non-technical friendly (clear prompts, explanations)

**Usage:**
```bash
npm run setup
```

**Example Flow:**
```
Welcome to Personal Block-in-a-Box Setup!

Step 1/9: Checking prerequisites...
✅ Node.js 18+ installed
✅ npm installed
❌ Cloudflare account not detected

Would you like to:
1. Open Cloudflare signup (I'll wait for you to sign up)
2. Skip (you'll set this up later)
3. Exit

> 1

[Opens browser]
After you sign up, press Enter to continue...

Step 2/9: Installing dependencies...
✅ Dependencies installed

Step 3/9: Building packages...
✅ Packages built

Step 4/9: Setting up OAuth broker...
Do you have an OAuth broker deployed?
1. Yes, I'll provide the URL
2. No, help me deploy it
3. Skip for now

> 2

[Guides through wrangler deploy]
...
```

### 8. Progress Saving

**File:** `.setup-progress.json` (gitignored)

**Features:**
- Save setup state after each step
- Allow resuming from any step
- Validate previous steps before continuing
- Clear progress option

**Format:**
```json
{
  "version": "1.0",
  "steps": {
    "prerequisites": { "completed": true, "timestamp": "2024-12-30T..." },
    "dependencies": { "completed": true, "timestamp": "2024-12-30T..." },
    "oauth-broker": { "completed": true, "url": "https://..." },
    "github-oauth": { "completed": false }
  }
}
```

---

## Implementation Details

### Script Structure

```
scripts/
├── validate-setup.js          # Phase 1
├── generate-cursor-config.js  # Phase 1
├── generate-wrangler-local.js # Phase 1
├── setup-github-oauth.js      # Phase 2
├── setup-google-oauth.js      # Phase 2
├── setup-oauth-secrets.js     # Phase 2
├── setup-wizard.js            # Phase 3
└── utils/
    ├── prompts.js             # Interactive prompts helper
    ├── cloudflare.js           # Cloudflare API helpers
    ├── validation.js           # Validation helpers
    └── progress.js             # Progress saving/loading
```

### Dependencies

```json
{
  "devDependencies": {
    "inquirer": "^9.0.0",        // Interactive prompts
    "chalk": "^5.0.0",           // Colored output
    "open": "^9.0.0"             // Open browser
  }
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "setup": "node scripts/setup-wizard.js",
    "setup:cursor-config": "node scripts/generate-cursor-config.js",
    "setup:wrangler-local": "node scripts/generate-wrangler-local.js",
    "setup:github-oauth": "node scripts/setup-github-oauth.js",
    "setup:google-oauth": "node scripts/setup-google-oauth.js",
    "setup:oauth-secrets": "node scripts/setup-oauth-secrets.js",
    "validate-setup": "node scripts/validate-setup.js"
  }
}
```

---

## Non-Technical User Documentation

### Quick Start Guide

**File:** `docs/setup/QUICK_START.md`

**Content:**
1. Clone the repo
2. Run `npm run setup`
3. Follow the prompts
4. Done!

**That's it!** The wizard handles everything.

### Troubleshooting Guide

**File:** `docs/setup/TROUBLESHOOTING.md`

**Common Issues:**
- "OAuth broker not found" → Run `npm run setup:oauth-broker`
- "Secrets not set" → Run `npm run setup:oauth-secrets`
- "Config files missing" → Run `npm run setup:cursor-config`

---

## Success Criteria

### Non-Technical User Can:
- ✅ Complete setup in < 30 minutes
- ✅ Set up without reading technical docs
- ✅ Understand what each step does
- ✅ Recover from errors
- ✅ Resume if interrupted

### Technical User Can:
- ✅ Still do manual setup
- ✅ Use individual scripts
- ✅ Understand automation (transparent)

---

## Next Steps

1. **Start with validation script** - Helps identify gaps
2. **Add config generators** - Simplifies common tasks
3. **Create OAuth guides** - Most complex part
4. **Build wizard** - Ties it all together

---

## Related Documents

- [`../vision/AUTOMATION_VISION.md`](../vision/AUTOMATION_VISION.md) - Vision and goals
- [`../setup/CURSOR_SETUP.md`](../setup/CURSOR_SETUP.md) - Manual Cursor setup
- [`../setup/OAUTH_CREDENTIALS_SETUP.md`](../setup/OAUTH_CREDENTIALS_SETUP.md) - Manual OAuth setup

