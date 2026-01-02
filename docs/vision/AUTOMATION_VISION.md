# Automation & Agentic Setup Vision

## Goal

Make Personal Block-in-a-Box **accessible to non-technical users** through automation scripts and guided workflows. The OAuth broker pattern provides the abstraction layer (no local credentials needed), and automation scripts provide the setup guidance.

## Why OAuth Broker is "Next Best Thing to SaaS"

**SaaS Approach (Full Abstraction):**
- User signs up → Everything configured automatically
- No technical knowledge required
- But: Requires hosting, user management, billing, etc.

**OAuth Broker Pattern (Personal, but Accessible):**
- ✅ **No local credentials** - OAuth broker handles tokens
- ✅ **One OAuth app per service** - Simpler than per-MCP apps
- ✅ **Multi-user ready** - Just change `USER_ID`
- ✅ **Free Cloudflare Workers** - No hosting costs
- ⚠️ **Still requires setup** - OAuth apps, Cloudflare deployment

**Automation Goal:** Make the setup as easy as SaaS, but keep it personal and free.

---

## Automation Scripts Needed

### 1. Cursor Config Generator

**Script:** `scripts/generate-cursor-config.js`

**What it does:**
- Reads `config/cursor.json.example`
- Prompts for:
  - Workspace path
  - OAuth broker URL (or detects from Cloudflare)
  - User ID
- Generates personalized `cursor.json` with correct paths
- Optionally copies to Cursor config location

**Usage:**
```bash
npm run setup:cursor
# Interactive prompts → generates config
```

### 2. Wrangler Local Config Generator

**Script:** `scripts/generate-wrangler-local.js`

**What it does:**
- Detects Cloudflare Workers subdomain (from `wrangler deploy` output or prompts)
- Prompts for:
  - OAuth broker URL
  - User ID
- Generates `wrangler.toml.local` files for all packages
- Validates URLs

**Usage:**
```bash
npm run setup:wrangler-local
# Interactive prompts → generates all wrangler.toml.local files
```

### 3. GitHub OAuth App Setup Guide

**Script:** `scripts/setup-github-oauth.js` or interactive guide

**What it does:**
- Opens GitHub OAuth app creation page
- Guides user through:
  - Application name
  - Homepage URL
  - Authorization callback URL (auto-fills from OAuth broker URL)
- Validates callback URL format
- Provides copy-paste instructions for Client ID/Secret
- Optionally runs `wrangler secret put` commands

**Usage:**
```bash
npm run setup:github-oauth
# Opens browser → guides through OAuth app creation
```

### 4. Google Cloud OAuth Client Setup Guide

**Script:** `scripts/setup-google-oauth.js` or interactive guide

**What it does:**
- Opens Google Cloud Console
- Guides user through:
  - Creating OAuth client (web-based)
  - Setting redirect URI (auto-fills from OAuth broker URL)
  - Copying Client ID/Secret
- Validates redirect URI format
- Optionally runs `wrangler secret put` commands

**Usage:**
```bash
npm run setup:google-oauth
# Opens browser → guides through OAuth client creation
```

### 5. OAuth Broker Secrets Setup

**Script:** `scripts/setup-oauth-secrets.js`

**What it does:**
- Prompts for OAuth credentials (GitHub, Google, etc.)
- Runs `wrangler secret put` commands interactively
- Validates secrets were set correctly
- Tests OAuth broker connectivity

**Usage:**
```bash
npm run setup:oauth-secrets
# Interactive prompts → sets all OAuth secrets
```

### 6. Setup Validation Script

**Script:** `scripts/validate-setup.js`

**What it does:**
- Checks if all required files exist
- Validates `wrangler.toml.local` files
- Tests OAuth broker connectivity
- Checks if secrets are set
- Validates Cursor config
- Provides checklist of what's missing

**Usage:**
```bash
npm run validate-setup
# Checks everything → reports what's missing
```

### 7. Interactive Setup Wizard

**Script:** `scripts/setup-wizard.js`

**What it does:**
- One command to rule them all
- Guides user through entire setup:
  1. Clone repo
  2. Install dependencies
  3. Build packages
  4. Set up OAuth broker
  5. Create OAuth apps (GitHub, Google)
  6. Set secrets
  7. Generate configs
  8. Validate setup
- Saves progress (can resume)
- Non-technical friendly (clear prompts, explanations)

**Usage:**
```bash
npm run setup
# Interactive wizard → complete setup
```

---

## Agentic Setup Workflows

### Workflow 1: First-Time User Onboarding

```
1. User clones repo
2. Runs: npm run setup
3. Wizard asks:
   - "Do you have a Cloudflare account?" → If no, guides to create one
   - "Have you deployed OAuth broker?" → If no, guides deployment
   - "Do you have GitHub OAuth app?" → If no, opens setup guide
   - "Do you have Google OAuth client?" → If no, opens setup guide
4. Wizard generates all configs
5. Wizard validates setup
6. User is ready!
```

### Workflow 2: OAuth App Creation (Agentic)

**For GitHub:**
```
1. Script opens: https://github.com/settings/developers/oauth_apps/new
2. Script detects OAuth broker URL from wrangler.toml.local
3. Script pre-fills:
   - Application name: "Personal Block-in-a-Box"
   - Callback URL: "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/callback/github"
4. User clicks "Register application"
5. Script prompts: "Paste your Client ID"
6. Script prompts: "Paste your Client Secret"
7. Script runs: wrangler secret put GITHUB_CLIENT_ID
8. Script runs: wrangler secret put GITHUB_CLIENT_SECRET
9. Script validates secrets were set
```

**For Google:**
```
1. Script opens: https://console.cloud.google.com/apis/credentials
2. Script detects OAuth broker URL
3. Script guides:
   - "Click 'Create Credentials' → 'OAuth client ID'"
   - "Select 'Web application'"
   - "Add redirect URI: https://oauth-broker.YOUR_SUBDOMAIN.workers.dev/callback/google"
4. User creates client
5. Script prompts for Client ID/Secret
6. Script sets secrets via wrangler
```

### Workflow 3: Config Generation (Agentic)

```
1. Script detects:
   - Current directory (workspace root)
   - Cloudflare Workers URLs (from wrangler deploy or prompts)
   - User preferences (from previous runs or prompts)
2. Script generates:
   - cursor.json (with correct paths)
   - wrangler.toml.local (all packages)
   - .env.local (if needed)
3. Script validates all configs
4. Script provides next steps
```

---

## Non-Technical User Path

### Current Path (Technical)
```
1. Clone repo
2. Read docs
3. Create OAuth apps manually
4. Set secrets manually
5. Generate configs manually
6. Deploy manually
```

### Future Path (Non-Technical)
```
1. Clone repo
2. Run: npm run setup
3. Follow prompts (wizard handles everything)
4. Done!
```

### Key Abstractions

1. **OAuth Broker** - No local credentials needed
2. **Automated OAuth Setup** - Scripts guide OAuth app creation
3. **Config Generation** - Scripts generate all configs
4. **Validation** - Scripts check everything is correct
5. **One Command** - `npm run setup` does it all

---

## Implementation Priority

### Phase 1: Essential Scripts
1. ✅ Cursor config generator
2. ✅ Wrangler local config generator
3. ✅ Setup validation script

### Phase 2: OAuth Setup Guides
4. ⏳ GitHub OAuth app setup guide
5. ⏳ Google Cloud OAuth client setup guide
6. ⏳ OAuth broker secrets setup script

### Phase 3: Full Automation
7. ⏳ Interactive setup wizard
8. ⏳ Agentic OAuth app creation (browser automation)
9. ⏳ Progress saving/resume capability

---

## Example: Non-Technical User Experience

**Before (Technical):**
```
User: "I want to use this but I don't know how to set up OAuth apps"
→ Reads 5 different docs
→ Creates OAuth apps manually
→ Copies/pastes secrets
→ Generates configs manually
→ Deploys manually
→ Something breaks → debug
```

**After (Automated):**
```
User: "I want to use this"
→ Runs: npm run setup
→ Wizard: "Let's set up your OAuth broker. Do you have a Cloudflare account?"
→ User: "No"
→ Wizard: "I'll open Cloudflare signup. After you sign up, come back here."
→ [User signs up]
→ Wizard: "Great! Now let's deploy your OAuth broker..."
→ [Wizard deploys]
→ Wizard: "Now let's create your GitHub OAuth app. I'll open GitHub..."
→ [Wizard guides through OAuth app creation]
→ Wizard: "Perfect! Your setup is complete. You can now use Cursor with GitHub MCP!"
```

---

## Technical Considerations

### Browser Automation
- Could use Puppeteer/Playwright for OAuth app creation
- Or: Provide clear step-by-step guide with auto-filled URLs
- Or: Hybrid - guide + validation

### Secret Management
- `wrangler secret put` requires interactive input
- Script can prompt user, then run command
- Or: Use environment variables (less secure, but simpler)

### Progress Saving
- Save setup state to `.setup-progress.json` (gitignored)
- Allow resuming from any step
- Validate previous steps before continuing

### Error Handling
- Clear error messages
- Suggestions for fixes
- Links to relevant docs
- Option to skip steps and do manually

---

## Success Metrics

**Non-Technical User Can:**
- ✅ Set up entire stack in < 30 minutes
- ✅ Complete setup without reading docs
- ✅ Understand what each step does (clear explanations)
- ✅ Recover from errors (helpful messages)
- ✅ Resume if interrupted (progress saving)

**Technical User Can:**
- ✅ Still do manual setup if preferred
- ✅ Use individual scripts for specific tasks
- ✅ Understand what automation does (transparent)

---

## Next Steps

1. **Start with validation script** - Helps identify what's missing
2. **Add config generators** - Simplifies setup
3. **Create OAuth setup guides** - Most complex part
4. **Build interactive wizard** - Ties it all together

See [`docs/development/AUTOMATION_ROADMAP.md`](../development/AUTOMATION_ROADMAP.md) for detailed implementation plan.

