# MCP Server Organization Strategy
**How to Structure Custom, Augmented, and Referenced Servers**

---

## The Three-Tier Strategy

Based on your existing implementations and community best practices:

```
┌─────────────────────────────────────────────────────────┐
│  Tier 1: Out-of-Box (Reference Only)                    │
│  • Don't fork, just npm install                         │
│  • List in package.json dependencies                    │
│  • Configure via environment variables                  │
│  Examples: @modelcontextprotocol/server-* packages     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Tier 2: Augmented (Fork + Enhance)                     │
│  • Fork existing implementation                         │
│  • Add your custom features                             │
│  • Credit original in README                            │
│  • Consider contributing back                           │
│  Examples: GongRzhe/gmail-mcp + PDF parsing            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Tier 3: Custom (Built from Scratch)                    │
│  • No existing implementation meets needs               │
│  • Built for specific workflow                          │
│  • Consider open sourcing if reusable                   │
│  Examples: Supabase operations, Voice integration       │
└─────────────────────────────────────────────────────────┘
```

---

## Directory Structure

### Recommended Organization

```
personal-block-in-a-box/
├── package.json                  # Out-of-box dependencies
├── README.md                     # Project overview
├── LICENSE                       # MIT or Apache 2.0
│
├── config/
│   ├── claude-desktop.json      # Claude Desktop config
│   ├── cursor-config.json       # Cursor MCP config
│   └── env.example              # Environment template
│
├── mcp-servers/
│   │
│   ├── 01-out-of-box/          # Tier 1: Reference only
│   │   └── README.md           # "These are npm packages"
│   │
│   ├── 02-augmented/           # Tier 2: Forked + enhanced
│   │   ├── gmail-mcp/          # Fork of GongRzhe/gmail-mcp
│   │   │   ├── ORIGINAL.md     # Link to original repo
│   │   │   ├── CHANGES.md      # What you changed
│   │   │   └── src/
│   │   │       └── index.ts    # Your enhancements
│   │   │
│   │   └── asana-mcp/          # Fork of asana-mcp
│   │       ├── ORIGINAL.md
│   │       ├── CHANGES.md
│   │       └── src/
│   │
│   └── 03-custom/              # Tier 3: Built from scratch
│       ├── supabase-mcp/       # Custom implementation
│       │   ├── README.md
│       │   └── src/
│       │
│       └── operations-mcp/     # Custom workflow automation
│           ├── README.md
│           └── src/
│
├── cloudflare-workers/
│   ├── mcp-gateway/            # Remote MCP routing
│   └── oauth-broker/           # OAuth token management
│
├── docs/
│   ├── ARCHITECTURE.md         # System design
│   ├── WORKFLOWS.md            # Usage examples
│   └── CONTRIBUTING.md         # For community
│
└── examples/
    ├── voice-commands/         # Example voice workflows
    └── cursor-snippets/        # Cursor integration examples
```

---

## Tier 1: Out-of-Box Servers (Reference Only)

### Strategy: Don't Fork, Just Use

**When to use:**
- Existing implementation is perfect
- No customization needed
- Official or widely-adopted package
- Actively maintained

**How to organize:**

```json
// package.json
{
  "dependencies": {
    "@modelcontextprotocol/server-filesystem": "^0.1.0",
    "@modelcontextprotocol/server-github": "^0.1.0"
  }
}
```

```markdown
<!-- mcp-servers/01-out-of-box/README.md -->
# Out-of-Box MCP Servers

These are standard MCP servers installed via npm. No custom code here.

## Included Servers

### Filesystem MCP
- **Package**: `@modelcontextprotocol/server-filesystem`
- **Purpose**: Safe file operations
- **Config**: See `config/claude-desktop.json`

### GitHub MCP (Official)
- **Package**: `@modelcontextprotocol/server-github`
- **Purpose**: GitHub repository operations
- **Config**: Requires `GITHUB_TOKEN` environment variable

## Installation

```bash
npm install
```

## Configuration

Copy `config/env.example` to `.env` and add your tokens.
```

**Claude Desktop Config:**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"]
    },
    "github-official": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token-here"
      }
    }
  }
}
```

---

## Tier 2: Augmented Servers (Fork + Enhance)

### Strategy: Credit + Contribute Back

**When to use:**
- Existing implementation is 80% right
- You need specific additional features
- Original is well-maintained
- Your changes might benefit others

**Example: Gmail MCP with PDF Parsing**

You mentioned you already have Gmail MCP. Let's organize it properly:

```
mcp-servers/02-augmented/gmail-mcp/
├── ORIGINAL.md              # Credit to original
├── CHANGES.md               # Your enhancements documented
├── package.json
├── README.md                # Your version's docs
└── src/
    ├── index.ts             # Main MCP server
    ├── gmail-client.ts      # Original functionality
    └── pdf-parser.ts        # YOUR ADDITION
```

**ORIGINAL.md:**
```markdown
# Original Source

This MCP server is based on [GongRzhe/gmail-mcp-server](https://github.com/GongRzhe/gmail-mcp-server).

**Original Author**: GongRzhe  
**License**: MIT  
**Original Repository**: https://github.com/GongRzhe/gmail-mcp-server

## Why Fork?

The original implementation is excellent for basic Gmail operations. We forked to add:
1. PDF/PNG attachment parsing using Claude Vision API
2. School newsletter date extraction
3. Calendar event creation from email content

All enhancements are documented in `CHANGES.md`.

## Contributing Back

We plan to contribute the PDF parsing feature back to the original repository via pull request.
```

**CHANGES.md:**
```markdown
# Changes from Original

## Version History

### v1.0.0 (Original Fork)
- Forked from GongRzhe/gmail-mcp-server v0.3.0
- No changes, baseline functionality

### v1.1.0 (PDF Parsing)
**Added:**
- `parsePDFAttachment()` function in `src/pdf-parser.ts`
- Integration with Claude Vision API for image-based PDFs
- New tool: `extract_dates_from_email`

**Files Changed:**
- `src/index.ts`: Added new tool definition
- `src/pdf-parser.ts`: NEW FILE
- `package.json`: Added dependencies:
  - `pdf-parse`: ^1.1.1
  - `@anthropic-ai/sdk`: ^0.30.0

**Configuration Added:**
```json
{
  "env": {
    "CLAUDE_API_KEY": "required for PDF parsing"
  }
}
```

### v1.2.0 (PNG Parsing)
**Added:**
- PNG attachment parsing using Claude Vision
- Better error handling for missing attachments

## Upstream Merge Status

- [ ] PDF parsing feature - PR pending
- [ ] PNG parsing feature - PR pending

## Maintenance Plan

We will:
1. Keep fork synced with upstream monthly
2. Contribute useful features back via PR
3. Document all custom features here
```

**README.md (Your Version):**
```markdown
# Gmail MCP Server (Enhanced)

Enhanced version of [GongRzhe/gmail-mcp-server](https://github.com/GongRzhe/gmail-mcp-server) with PDF/PNG parsing capabilities.

## Features

### From Original
- Read emails with filters
- Search emails
- Download attachments
- Label management

### Our Enhancements
- ✨ **PDF/PNG Parsing**: Extract dates from school newsletters
- ✨ **Vision AI Integration**: Claude Vision for image-based documents
- ✨ **Calendar Integration**: Auto-create events from extracted dates

## Installation

```bash
cd mcp-servers/02-augmented/gmail-mcp
npm install
```

## Configuration

```json
{
  "mcpServers": {
    "gmail-enhanced": {
      "command": "node",
      "args": ["path/to/gmail-mcp/src/index.js"],
      "env": {
        "GMAIL_TOKEN": "your-gmail-oauth-token",
        "CLAUDE_API_KEY": "your-claude-api-key"
      }
    }
  }
}
```

## Usage

### Extract Dates from Newsletter

```
User: "Process the school newsletter from today and extract all dates"

Claude calls: extract_dates_from_email(
  subject_filter: "newsletter",
  date_filter: "today"
)

Returns: [
  { date: "2025-01-15", event: "School Assembly" },
  { date: "2025-01-22", event: "Field Trip Permission Deadline" }
]
```

## Contributing

This is a fork with specific enhancements. We welcome:
- Bug reports specific to our additions
- Feature requests for PDF/PNG parsing
- Documentation improvements

For core Gmail functionality, please contribute to the [original repository](https://github.com/GongRzhe/gmail-mcp-server).

## License

MIT (same as original)

## Credits

Original implementation by [GongRzhe](https://github.com/GongRzhe). Enhanced with PDF/PNG parsing by Jason Leacox.
```

---

## Tier 3: Custom Servers (Built from Scratch)

### Strategy: Build for Your Workflow, Share if Useful

**When to use:**
- No existing implementation
- Highly specific to your workflow
- Experiments/prototypes
- Integration with custom systems (Supabase, your own APIs)

**Example: Supabase Operations MCP**

```
mcp-servers/03-custom/supabase-mcp/
├── README.md
├── package.json
├── src/
│   ├── index.ts
│   ├── supabase-client.ts
│   └── tools/
│       ├── query.ts
│       ├── insert.ts
│       └── update.ts
└── tests/
    └── integration.test.ts
```

**README.md:**
```markdown
# Supabase MCP Server

Custom MCP server for Supabase operations. Built specifically for household COO workflows but generalized for community use.

## Why Custom?

No existing Supabase MCP server provided the event-driven queue pattern we needed for operations agents.

## Features

- Query operations queue
- Insert/update agent status
- Real-time subscription support
- Type-safe queries using Supabase client

## Design Decisions

### Why Not Use Generic SQL MCP?

Existing SQL MCPs provide raw SQL execution. We needed:
1. Type-safe queries based on our schema
2. Real-time subscriptions
3. Row-level security integration
4. Automatic connection pooling

### Schema-Specific Tools

Instead of generic `execute_sql`, we provide:
- `query_operations_queue(status: string)`
- `update_agent_status(agent_id: string, status: string)`
- `insert_agent_result(agent_id: string, result: object)`

This makes LLM usage more reliable (fewer SQL syntax errors).

## Installation

```bash
cd mcp-servers/03-custom/supabase-mcp
npm install
```

## Configuration

```json
{
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": ["path/to/supabase-mcp/src/index.js"],
      "env": {
        "SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

## Contributing

This is a custom implementation for specific workflows. If you want similar functionality:
1. Fork this repo
2. Adapt to your schema
3. Submit PR if you generalize it

We're open to making this more generic if there's community interest.

## License

MIT

## Related

- [Supabase JS Client](https://github.com/supabase/supabase-js)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)
```

---

## Community Best Practices

### 1. Attribution Rules

**Always include in forks:**

```markdown
## Credits

This project includes code from or is inspired by:

- [Original Project Name](link) by [Author] - [Specific feature] under [License]
- [Another Project](link) by [Author] - [Specific feature] under [License]

All original licenses are preserved in `LICENSES/` directory.
```

**For significant forks:**

```markdown
## Forked from [Original Project]

This is a fork of [original-project](link) with the following enhancements:
- [Enhancement 1]
- [Enhancement 2]

We actively sync with upstream and contribute back useful features.

Last sync: 2025-01-15
Upstream version: v0.3.0
Our version: v1.1.0
```

### 2. License Compatibility

**When forking:**
1. Keep original license file
2. Add your copyright to files you modify
3. Don't change license terms without permission

```javascript
// src/enhanced-feature.ts
/*
 * Original implementation from gmail-mcp-server
 * Copyright (c) 2024 GongRzhe
 * 
 * Enhanced with PDF parsing
 * Copyright (c) 2025 Jason Leacox
 * 
 * Licensed under MIT License
 */
```

### 3. Contribution Strategy

**For augmented servers:**

```markdown
## Contributing Back to Upstream

We plan to contribute the following features back:

### Ready for PR
- [x] PDF attachment parsing
- [ ] Waiting for maintainer feedback

### In Progress
- [ ] PNG attachment parsing
- [ ] Needs more testing before PR

### Keeping Private
- Custom date extraction logic (too specific to our workflow)
```

### 4. Documentation Standards

**Each server needs:**

1. **README.md** - What it does, how to use
2. **CHANGES.md** (if augmented) - What you changed
3. **ORIGINAL.md** (if augmented) - Credit to source
4. **examples/** directory - Usage examples
5. **CONTRIBUTING.md** (if custom) - How others can help

---

## Your Specific Situation

### What You Have

Based on your comments:
- ✅ Several MCP servers already implemented
- ✅ Gmail MCP with custom features
- ✅ Calendar integration
- ✅ Supabase operations
- ✅ GitHub operations

### How to Organize

**Step 1: Identify Tier for Each Server**

```
GitHub MCP:
├─ Using: @modelcontextprotocol/server-github
├─ Customization: None
└─ Tier: 1 (Out-of-box)

Gmail MCP:
├─ Based on: GongRzhe/gmail-mcp-server
├─ Customization: PDF/PNG parsing
└─ Tier: 2 (Augmented)

Calendar MCP:
├─ Based on: ???
├─ Customization: ???
└─ Tier: ??? (Need to know your implementation)

Supabase MCP:
├─ Based on: None (custom)
├─ Purpose: Operations queue
└─ Tier: 3 (Custom)

Asana MCP:
├─ Based on: ???
├─ Customization: ???
└─ Tier: ??? (Need to know your implementation)
```

**Step 2: Reorganize Files**

```bash
# Create tier directories
mkdir -p mcp-servers/{01-out-of-box,02-augmented,03-custom}

# Move existing servers to appropriate tiers
mv gmail-mcp mcp-servers/02-augmented/
mv supabase-mcp mcp-servers/03-custom/

# Document out-of-box servers
echo "See package.json" > mcp-servers/01-out-of-box/README.md
```

**Step 3: Add Attribution**

For each augmented server:
```bash
cd mcp-servers/02-augmented/gmail-mcp
touch ORIGINAL.md CHANGES.md
```

Fill in ORIGINAL.md with source info.
Fill in CHANGES.md with your modifications.

**Step 4: Create Master README**

```markdown
# Personal Block-in-a-Box MCP Servers

## Quick Start

1. Install out-of-box dependencies: `npm install`
2. Configure Claude Desktop: Copy `config/claude-desktop.json.example`
3. Set environment variables: Copy `config/env.example` to `.env`

## Server Organization

### Tier 1: Out-of-Box (npm packages)
- GitHub (official): `@modelcontextprotocol/server-github`

### Tier 2: Augmented (forked + enhanced)
- Gmail with PDF parsing: Based on `GongRzhe/gmail-mcp-server`
- [Other augmented servers]

### Tier 3: Custom (built from scratch)
- Supabase operations: Custom implementation for household COO
- [Other custom servers]

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Workflows](docs/WORKFLOWS.md)
- [Contributing](docs/CONTRIBUTING.md)

## Credits

See individual server directories for attribution.
```

---

## Cloudflare Workers Consideration

### Your Question: "Unified gateway vs segregated servers?"

**Recommendation: Unified Gateway + Segregated Server Code**

**Architecture:**

```
Single Cloudflare Worker (Gateway):
  ↓
Routes requests to appropriate handler:
  ↓
├─ /github/* → github-handler.js
├─ /gmail/* → gmail-handler.js  
├─ /calendar/* → calendar-handler.js
└─ /asana/* → asana-handler.js

Handlers import from shared MCP server code:
  ↓
mcp-servers/02-augmented/gmail-mcp/src/
  ↓
Used by:
• Local: stdio transport
• Remote: Cloudflare Worker HTTP transport
```

**Why Unified Gateway:**
1. Single deployment
2. Single endpoint for voice app
3. Easier routing logic
4. Simpler OAuth broker integration
5. One SSL certificate

**Why Segregated Code:**
1. Each server maintainable independently
2. Can test locally without Cloudflare
3. Follows MCP server architecture
4. Easy to open source individual servers

**Implementation:**

```javascript
// cloudflare-workers/mcp-gateway/index.js
import { handleGitHub } from '../../mcp-servers/02-augmented/github-mcp/worker.js';
import { handleGmail } from '../../mcp-servers/02-augmented/gmail-mcp/worker.js';
import { handleCalendar } from '../../mcp-servers/02-augmented/calendar-mcp/worker.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Route based on path
    if (url.pathname.startsWith('/github')) {
      return handleGitHub(request, env);
    }
    if (url.pathname.startsWith('/gmail')) {
      return handleGmail(request, env);
    }
    if (url.pathname.startsWith('/calendar')) {
      return handleCalendar(request, env);
    }
    
    return new Response('Not found', { status: 404 });
  }
};
```

```javascript
// mcp-servers/02-augmented/gmail-mcp/worker.js
import { GmailMCPServer } from './src/index.js';

export async function handleGmail(request, env) {
  const server = new GmailMCPServer({
    oauthBroker: env.OAUTH_BROKER_URL,
    claudeApiKey: env.CLAUDE_API_KEY
  });
  
  return server.handleHTTPRequest(request);
}
```

---

## For Non-Technical Users

### Your Question: "Make easier to implement from open source"

**Problem: Open source + easy install are in tension**

**Open Source Friction:**
```
1. Clone repo
2. Install Node.js
3. Configure environment variables
4. Register OAuth apps (60+ minutes)
5. Deploy to Cloudflare (requires account)
6. Configure Claude Desktop/Cursor
```

**Easy Install Would Require:**
```
1. Click "Deploy to Cloudflare" button
2. Click "Connect Google"
3. Done (3 minutes)
```

**Can't Have Both Unless:**

**Option A: Hybrid Model (Recommended)**

```
For Technical Users (Open Source):
  └─ Full source code on GitHub
  └─ DIY OAuth registration
  └─ Manual Cloudflare deployment
  └─ Benefits: Full control, privacy, learning

For Non-Technical Users (Managed Service):
  └─ Deploy button uses YOUR OAuth apps
  └─ One-click deployment
  └─ You provide OAuth broker as service
  └─ Benefits: Fast setup, support revenue
```

**Option B: Detailed Deployment Guide**

Make open source as easy as possible:

```markdown
# One-Time Setup (30 minutes)

## Step 1: Install Node.js
[Downloadinstallation button for each OS]

## Step 2: Clone Repository
```bash
git clone https://github.com/jleacox/personal-block-in-a-box
cd personal-block-in-a-box
npm install
```

## Step 3: Deploy to Cloudflare (Free)
```bash
npx wrangler login
npx wrangler deploy
```

## Step 4: Connect Services
Click these links to authorize:
- [Connect Google →] (opens OAuth flow)
- [Connect GitHub →] (opens OAuth flow)
- [Connect Asana →] (opens OAuth flow)

## Step 5: Configure Claude Desktop
Copy this to your config:
[Auto-generated JSON with your deployment URL]

Done! Try: "Create a GitHub issue about testing"
```

**Option C: Video Walkthrough**

Record 10-minute video:
1. Install Node.js
2. Clone repo
3. Deploy to Cloudflare
4. Connect services
5. Test with Claude Desktop

Embed on README.

---

## Recommendation for You

### Phase 1: Organize Existing (This Week)

```bash
# Reorganize your current servers
1. Create tier directories
2. Move servers to appropriate tiers
3. Add ORIGINAL.md to augmented servers
4. Add CHANGES.md documenting your modifications
5. Update main README with structure
```

### Phase 2: Document (Next Week)

```bash
# Make it easy for others
1. Create config/env.example
2. Write config/claude-desktop.json.example
3. Add examples/ directory with workflows
4. Write docs/ARCHITECTURE.md
5. Add quick start to README
```

### Phase 3: Open Source (When Ready)

```bash
# Publish on GitHub
1. Choose license (MIT recommended)
2. Add CONTRIBUTING.md
3. Create GitHub repo
4. Push code
5. Announce on r/LocalLLaMA, X, etc.
```

### Phase 4: Simplify (Optional)

```bash
# If you want non-technical users
1. Deploy OAuth broker as service
2. Create "Deploy to Cloudflare" button
3. Build setup wizard UI
4. Charge $10/month for hosted OAuth broker
```

---

## Summary

**Server Organization:**
- Tier 1 (Out-of-box): npm dependencies only
- Tier 2 (Augmented): Fork + credit + document changes
- Tier 3 (Custom): From scratch + open source if useful

**Attribution:**
- ORIGINAL.md for forks
- CHANGES.md for modifications
- README.md for your version
- Contribute back when possible

**Cloudflare:**
- Unified gateway (single worker)
- Segregated server code (maintainability)
- Shared between local and remote

**Non-Technical Users:**
- Hybrid model: Open source + managed OAuth broker
- OR: Excellent documentation + video
- Don't compromise on open source principles
