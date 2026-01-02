# GitHub Organization Strategy for Personal Block-in-a-Box

## The Core Problem

**Your OAuth Broker/Gateway needs to reference:**
- Unmerged forks (your Gmail MCP fork with PDF parsing)
- Your custom servers (Supabase MCP)
- Out-of-box servers (official GitHub MCP)
- Servers in different languages (Go, Python, JavaScript)

**How do you organize this cleanly?**

---

## Option 1: Monorepo (Recommended for You)

### Structure

```
personal-block-in-a-box/          # Single GitHub repo
├── packages/
│   ├── oauth-broker/             # Cloudflare Worker
│   ├── mcp-gateway/              # Cloudflare Worker
│   │
│   ├── mcp-github/               # JavaScript port of Go server
│   ├── mcp-gmail/                # Fork of GongRzhe with enhancements
│   ├── mcp-calendar/             # Fork with enhancements
│   ├── mcp-asana/                # Fork with enhancements
│   ├── mcp-supabase/             # Custom server
│   └── shared/                   # Shared utilities
│
├── config/
│   ├── cursor.json              # Cursor MCP config
│   └── claude-desktop.json      # Claude Desktop config
│
├── docs/
│   ├── ARCHITECTURE.md
│   └── individual-server-docs/
│
└── package.json                 # Workspace configuration
```

### Why Monorepo Works for You

**Advantages:**
1. **Single source of truth** - All code in one place
2. **Easy cross-referencing** - Broker can import from `../mcp-gmail`
3. **Atomic commits** - Update server + broker in same commit
4. **Simpler deployment** - One `wrangler deploy` script
5. **Better for learning** - New users see everything together

**Disadvantages:**
1. **Harder to contribute back** - Need to extract individual servers for PRs
2. **Larger clone** - But not an issue for single repo

### Implementation

```json
// package.json (root)
{
  "name": "personal-block-in-a-box",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev:broker": "wrangler dev packages/oauth-broker",
    "dev:gateway": "wrangler dev packages/mcp-gateway",
    "deploy:all": "npm run deploy:broker && npm run deploy:gateway",
    "deploy:broker": "wrangler deploy packages/oauth-broker",
    "deploy:gateway": "wrangler deploy packages/mcp-gateway"
  }
}
```

```javascript
// packages/mcp-gateway/index.js
// Direct imports from monorepo
import { handleGmail } from '../mcp-gmail/worker.js';
import { handleGitHub } from '../mcp-github/worker.js';
import { handleCalendar } from '../mcp-calendar/worker.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/gmail')) {
      return handleGmail(request, env);
    }
    // ...
  }
};
```

### Attribution in Monorepo

```
packages/mcp-gmail/
├── FORK.md                      # Credit original
├── README.md                    # Your enhancements
└── src/
    └── index.js

// FORK.md
This package is a fork of GongRzhe/gmail-mcp-server
Original: https://github.com/GongRzhe/gmail-mcp-server
License: MIT
Our changes: Added PDF parsing with Claude Vision API
```

### Contributing Back from Monorepo

**When you want to PR:**

```bash
# Extract just the gmail package
cd packages/mcp-gmail

# Create temporary repo
git init
git add .
git commit -m "Add PDF parsing feature"

# Add original as remote
git remote add upstream https://github.com/GongRzhe/gmail-mcp-server
git fetch upstream

# Create PR branch
git checkout -b feature/pdf-parsing upstream/main
git cherry-pick <your-commits>

# Push to your fork
git remote add origin https://github.com/jleacox/gmail-mcp-server
git push origin feature/pdf-parsing

# Open PR on GitHub
```

---

## Option 2: GitHub Organization with Multiple Repos

### Structure

```
GitHub Organization: personal-block-in-a-box
├── personal-block-in-a-box/infrastructure     # Main deployment repo
│   ├── cloudflare-workers/
│   │   ├── oauth-broker/
│   │   └── mcp-gateway/
│   └── package.json                            # References other repos
│
├── personal-block-in-a-box/mcp-gmail          # Forked from GongRzhe
├── personal-block-in-a-box/mcp-calendar       # Forked from original
├── personal-block-in-a-box/mcp-github         # JavaScript port
├── personal-block-in-a-box/mcp-asana          # Forked
└── personal-block-in-a-box/mcp-supabase       # Custom
```

### Why Multi-Repo (Org) Might Work

**Advantages:**
1. **Clean fork/PR workflow** - Each server is independent repo
2. **Easier attribution** - Fork relationships visible on GitHub
3. **Selective cloning** - Only clone what you need
4. **Standard GitHub org** - Familiar pattern

**Disadvantages:**
1. **Complex cross-referencing** - Broker needs to import from other repos
2. **Dependency management** - Need to publish packages or use git submodules
3. **Harder deployment** - Multiple repos to sync
4. **More overhead** - 6+ repos to manage

### Implementation with Git Submodules

```bash
# Main infrastructure repo
git init personal-block-in-a-box-infrastructure

# Add MCP servers as submodules
git submodule add https://github.com/personal-block-in-a-box/mcp-gmail packages/mcp-gmail
git submodule add https://github.com/personal-block-in-a-box/mcp-github packages/mcp-github
git submodule add https://github.com/personal-block-in-a-box/mcp-calendar packages/mcp-calendar
```

**Problem: Cloudflare Workers can't use git submodules**

### Implementation with npm Packages

```json
// packages/mcp-gateway/package.json
{
  "dependencies": {
    "@personal-block/mcp-gmail": "github:personal-block-in-a-box/mcp-gmail#main",
    "@personal-block/mcp-github": "github:personal-block-in-a-box/mcp-github#main",
    "@personal-block/mcp-calendar": "github:personal-block-in-a-box/mcp-calendar#feature/my-enhancements"
  }
}
```

**Problem: References specific branches/commits, breaks if you rebase**

---

## Option 3: Hybrid (Monorepo + Org for Forks)

### Structure

```
Your GitHub Account (jleacox):
├── personal-block-in-a-box          # Monorepo (infrastructure + custom servers)
│   ├── packages/
│   │   ├── oauth-broker/
│   │   ├── mcp-gateway/
│   │   ├── mcp-supabase/            # Custom (only here)
│   │   └── shared/
│   └── vendor/                      # Git-ignored, managed separately
│       ├── mcp-gmail/               # → Cloned from your fork
│       ├── mcp-calendar/            # → Cloned from your fork
│       └── mcp-github/              # → Cloned from your fork
│
Your Forks (separate repos for PR workflow):
├── jleacox/gmail-mcp-server         # Fork of GongRzhe/gmail-mcp-server
├── jleacox/calendar-mcp-server      # Fork of original
└── jleacox/github-mcp-server        # Your JavaScript port
```

### How It Works

**For development:**
```bash
# Clone main repo
git clone https://github.com/jleacox/personal-block-in-a-box
cd personal-block-in-a-box

# Clone your forks into vendor/
git clone https://github.com/jleacox/gmail-mcp-server vendor/mcp-gmail
git clone https://github.com/jleacox/calendar-mcp-server vendor/mcp-calendar

# Gateway imports from vendor
// packages/mcp-gateway/index.js
import { handleGmail } from '../../vendor/mcp-gmail/worker.js';
```

**For contributing back:**
```bash
# Work directly in vendor directory
cd vendor/mcp-gmail

# Make changes
git checkout -b feature/pdf-parsing
# ... make changes ...
git commit -m "Add PDF parsing"

# Push to your fork
git push origin feature/pdf-parsing

# Open PR to original repo
```

**.gitignore in monorepo:**
```
vendor/*/
!vendor/README.md
```

**vendor/README.md:**
```markdown
# Vendor Directory

This directory contains MCP servers managed as separate repositories.

## Setup

```bash
git clone https://github.com/jleacox/gmail-mcp-server vendor/mcp-gmail
git clone https://github.com/jleacox/calendar-mcp-server vendor/mcp-calendar
```

## Active Forks

- **mcp-gmail**: Fork of GongRzhe/gmail-mcp-server with PDF parsing
- **mcp-calendar**: Fork of X with Y enhancements
```

---

## Recommendation: Monorepo (Option 1)

### Why This Works Best for You

1. **Simpler development** - Everything in one place
2. **Easier Cloudflare deployment** - No dependency management
3. **Faster iteration** - Change broker + server in one commit
4. **Clear for users** - Clone one repo, get everything
5. **PR workflow still works** - Extract individual packages when needed

### But with One Adjustment: Vendor Directory Pattern

**Use the hybrid approach for forked servers:**

```
personal-block-in-a-box/
├── packages/
│   ├── oauth-broker/              # Your code
│   ├── mcp-gateway/               # Your code
│   └── mcp-supabase/              # Your custom server
│
├── vendor/                        # Git-ignored
│   ├── mcp-gmail/                 # Clone of your fork
│   ├── mcp-calendar/              # Clone of your fork
│   └── README.md                  # Setup instructions
│
└── scripts/
    └── setup-vendor.sh            # Automated vendor clone
```

**scripts/setup-vendor.sh:**
```bash
#!/bin/bash

echo "Setting up vendor MCP servers..."

mkdir -p vendor

# Clone your forks
git clone https://github.com/jleacox/gmail-mcp-server vendor/mcp-gmail
git clone https://github.com/jleacox/calendar-mcp-server vendor/mcp-calendar
git clone https://github.com/jleacox/github-mcp-server vendor/mcp-github

echo "Vendor setup complete!"
echo "These are separate git repos - you can PR from vendor/ directories"
```

**User workflow:**
```bash
# Clone main repo
git clone https://github.com/jleacox/personal-block-in-a-box
cd personal-block-in-a-box

# Install dependencies
npm install

# Setup vendor MCP servers
npm run setup-vendor

# Start developing
npm run dev:gateway
```

---

## Language Compatibility Strategy

### You're Right: Cloudflare = JavaScript Only

**Original servers in other languages:**
- **GitHub MCP**: Go (modelcontextprotocol/servers)
- **Docker MCP**: Go
- **Python MCP servers**: Can't run on Cloudflare Workers

**Your options:**

### Option A: Port to JavaScript (Recommended)

**For each Go/Python server you need:**

1. Create JavaScript equivalent
2. Credit original in README
3. Contribute back if original wants JS version

```
vendor/mcp-github/              # Your JavaScript port
├── README.md
├── ORIGINAL.md                 # Credits Go implementation
└── src/
    └── index.js                # JavaScript version
```

**ORIGINAL.md:**
```markdown
# JavaScript Port of Official GitHub MCP Server

This is a JavaScript port of the official GitHub MCP server originally written in Go.

**Original**: https://github.com/modelcontextprotocol/servers/tree/main/src/github
**Language**: Go
**License**: MIT

## Why JavaScript Port?

The original Go implementation works great for local stdio usage. This JavaScript port enables:
1. Cloudflare Workers deployment (remote access)
2. Browser-based MCP clients
3. Simpler deployment (no Go toolchain)

## Differences from Original

- Language: Go → JavaScript
- Transport: stdio → Streamable HTTP (for Cloudflare)
- Dependencies: Go stdlib → Node.js + Octokit
- Feature parity: ~95% (missing: X, Y)

## Contributing Back

We maintain feature parity with the original. If you want Go-specific features, contribute to the original. If you want JavaScript improvements, contribute here.
```

### Option B: Hybrid Architecture

**For development (local):**
- Use original Go/Python servers (stdio)
- Fast, full-featured

**For production (remote/voice):**
- Use JavaScript ports on Cloudflare
- Only port features you actually use
- Document feature differences

```
Cursor/Claude Desktop (local):
  ↓ stdio
  ↓
Official Go GitHub MCP (full features)

Voice App (remote):
  ↓ HTTPS
  ↓
Your JavaScript GitHub MCP (core features only)
```

### Incremental Porting Strategy

**Don't port everything upfront:**

```bash
# Week 1: Port GitHub MCP
1. Identify tools you actually use (create issue, create PR, list repos)
2. Port only those tools to JavaScript
3. Test parity with original

# Week 2: Port Calendar MCP
1. Same strategy

# Week 3: Port Gmail MCP
1. Already JavaScript (GongRzhe), just enhance
```

**Track porting status:**

```markdown
## Feature Parity with Original

| Feature | Original (Go) | JavaScript Port | Status |
|---------|--------------|-----------------|--------|
| Create issue | ✅ | ✅ | Complete |
| Create PR | ✅ | ✅ | Complete |
| List repos | ✅ | ✅ | Complete |
| GitHub Actions | ✅ | ⏳ | Planned |
| Code search | ✅ | ❌ | Not needed |
```

---

## Your Specific Workflow

### Phase 1: Cursor Development (Local)

```bash
# Use original servers via stdio
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    },
    "gmail": {
      "command": "node",
      "args": ["vendor/mcp-gmail/src/index.js"]  # Your fork
    }
  }
}
```

### Phase 2: Port for Cloudflare

```bash
# Create JavaScript version
mkdir -p packages/mcp-github
# ... port code ...

# Test locally
node packages/mcp-github/src/index.js

# Deploy to Cloudflare
wrangler deploy packages/mcp-gateway
```

### Phase 3: OAuth Broker Integration

**This is where centralized tokens shine:**

```javascript
// packages/mcp-github/worker.js
export async function handleGitHub(request, env) {
  // Get token from OAuth broker
  const tokenResponse = await fetch(`${env.OAUTH_BROKER_URL}/token/github`, {
    method: 'POST',
    body: JSON.stringify({ user_id: 'jleacox' })
  });
  
  const { access_token } = await tokenResponse.json();
  
  // Use token for GitHub API
  const octokit = new Octokit({ auth: access_token });
  
  // Handle MCP request
  // ...
}
```

**No more managing individual .env files!**

---

## Final Recommendation

### GitHub Structure

```
Single Repo: github.com/jleacox/personal-block-in-a-box

Structure:
├── packages/
│   ├── oauth-broker/          # Central token management
│   ├── mcp-gateway/           # Router for remote access
│   ├── mcp-supabase/          # Custom server (no fork)
│   └── shared/                # Shared utilities
│
├── vendor/                    # Git-ignored, managed separately
│   ├── mcp-gmail/             # Clone of jleacox/gmail-mcp-server fork
│   ├── mcp-calendar/          # Clone of jleacox/calendar-mcp-server fork
│   └── mcp-github/            # Clone of jleacox/github-mcp-server (JS port)
│
├── scripts/
│   └── setup-vendor.sh        # Automated vendor setup
│
└── docs/
    └── PORTING_GUIDE.md       # Go → JavaScript porting notes
```

### Separate Fork Repos (for PR workflow)

```
github.com/jleacox/gmail-mcp-server
  └── Fork of: GongRzhe/gmail-mcp-server
  └── Branch: feature/pdf-parsing
  └── Purpose: PR back to original

github.com/jleacox/github-mcp-server  
  └── JavaScript port of official Go server
  └── Branch: main
  └── Purpose: Cloudflare-compatible version

github.com/jleacox/calendar-mcp-server
  └── Fork of: original-calendar-mcp
  └── Branch: feature/enhancements
  └── Purpose: PR back to original
```

### Development Workflow

```bash
# Initial setup
git clone https://github.com/jleacox/personal-block-in-a-box
cd personal-block-in-a-box
npm install
npm run setup-vendor

# Work on a fork
cd vendor/mcp-gmail
git checkout -b feature/new-enhancement
# ... make changes ...
git commit -m "Add new feature"
git push origin feature/new-enhancement
# Open PR to GongRzhe/gmail-mcp-server

# Update gateway to use new feature
cd ../../packages/mcp-gateway
# ... update imports ...
git commit -m "Use new Gmail feature"

# Deploy
npm run deploy:all
```

**This gives you:**
- ✅ Clean monorepo for deployment
- ✅ Separate forks for PR workflow  
- ✅ Central OAuth token management
- ✅ One command deploy
- ✅ Easy to port incrementally
- ✅ Clear attribution

**No GitHub org needed** - just personal account with clear repo structure.
