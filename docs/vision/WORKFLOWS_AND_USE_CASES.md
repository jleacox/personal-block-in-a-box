# Workflows & Use Cases

## Overview

Personal Block-in-a-Box enables powerful workflows for **personal productivity automation** that bridge development, life organization, and strategic decision-making. This document outlines the workflows this system enables and the unique benefits it provides.

---

## Core Value Propositions

### 1. **Universal Remote MCP Access**

**The Problem:**
- Claude.ai doesn't support all MCP servers yet
- Many services don't have certified remote MCP servers
- You're limited to what Claude officially supports

**The Solution:**
- Deploy **any MCP server** to Cloudflare Workers
- Access it remotely via Claude.ai (web) and Claude phone app (voice)
- No need to wait for Claude to add support
- No need for certified servers - use your own implementations

**Example:**
- Want to use a custom Supabase MCP? Deploy it → Access it remotely
- Need a specialized Gmail MCP with PDF parsing? Deploy it → Access it remotely
- Found a community MCP that's not certified? Deploy it → Access it remotely

### 2. **Strategic vs Tactical Decision-Making**

**The Problem:**
- Cursor is great for tactical coding (writing code, fixing bugs)
- Claude.ai is great for strategic thinking (architecture, planning, documentation)
- No easy way to share context between them

**The Solution:**
- **Cursor (Local MCPs)**: Fast, direct access for coding tasks
- **Claude.ai (Remote MCPs)**: Strategic planning, documentation, voice access
- **Shared Memory**: Google Drive MCP for `.md` doc memory sharing
- **Same Tools**: Both access the same GitHub, Calendar, etc.

**Workflow:**
```
1. Strategic Planning (Claude.ai):
   - "Review my GitHub issues and create a roadmap"
   - Claude accesses GitHub MCP → Creates roadmap doc
   - Saves to Google Drive via Drive MCP

2. Tactical Implementation (Cursor):
   - Cursor reads roadmap from Drive MCP
   - Implements features using GitHub MCP
   - Updates issues, creates PRs

3. Documentation (Claude.ai):
   - "Document what we built this week"
   - Claude reads PRs via GitHub MCP
   - Creates documentation, saves to Drive MCP
```

### 3. **Personal Life Organization**

**The Problem:**
- Personal projects scattered across GitHub repos
- Calendar events, emails, tasks in different systems
- No unified view or automation

**The Solution:**
- **Unified Access**: All services accessible via voice (Claude phone app)
- **Cross-Service Automation**: Email → Calendar, GitHub → Tasks, etc.
- **Memory Management**: Shared docs between Cursor and Claude

**Workflow:**
```
Morning Routine (Claude Phone App - Voice):
- "What's on my calendar today?"
- "Any urgent GitHub issues?"
- "Create a calendar event for code review at 2pm"
- "Add a GitHub issue: Review PR #42"
```

---

## Personal Development Workflows

### Workflow 1: Issue-Driven Development

**Scenario:** You're working on a personal project and want to track progress.

**Setup:**
- GitHub MCP (remote) for Claude.ai
- GitHub MCP (local) for Cursor
- Google Drive MCP for documentation

**Flow:**
```
1. Strategic Planning (Claude.ai):
   "Review my personal-block-in-a-box repo and create a roadmap for next month"
   → Claude lists issues, PRs, analyzes codebase
   → Creates roadmap.md in Google Drive

2. Tactical Work (Cursor):
   - Reads roadmap.md from Drive MCP
   - Creates GitHub issues for features
   - Implements features
   - Creates PRs

3. Documentation (Claude.ai):
   "Document what I built this week"
   → Claude reads PRs, commits
   → Creates weekly summary in Drive MCP
```

### Workflow 2: Voice-Driven Development

**Scenario:** You're away from your computer but want to track ideas or create issues.

**Setup:**
- Claude phone app with remote GitHub MCP
- Remote Calendar MCP

**Flow:**
```
Walking/Driving:
"Create a GitHub issue in personal-block-in-a-box: Add automation scripts for setup"
→ Claude creates issue via GitHub MCP

"Add a calendar reminder for tomorrow at 9am: Review automation PR"
→ Claude creates calendar event

Later (at computer):
→ Cursor shows new issue
→ You implement it
```

### Workflow 3: Cross-Repository Management

**Scenario:** You have multiple personal projects and want to manage them all.

**Setup:**
- GitHub MCP (remote) for overview
- Individual repos accessible via voice

**Flow:**
```
"List all my GitHub repos and show me which ones have open issues"
→ Claude lists repos, checks issues for each
→ Provides summary

"Create an issue in mobile-voice-to-code-platform: Add voice commands"
→ Claude creates issue in specific repo
```

---

## Personal Life Organization Workflows

### Workflow 4: Email → Calendar Automation

**Scenario:** School newsletters, event invitations, etc. arrive via email.

**Setup:**
- Gmail MCP (with PDF parsing)
- Calendar MCP (remote)
- Claude Vision API for PDF parsing

**Flow:**
```
1. Gmail MCP monitors inbox
2. Detects school newsletter PDF
3. Extracts dates using Claude Vision API
4. Creates calendar events automatically
5. Notifies you: "Added 5 events from school newsletter"
```

### Workflow 5: Task Management Integration

**Scenario:** You want to track tasks across GitHub, Calendar, and Asana.

**Setup:**
- GitHub MCP (issues)
- Calendar MCP (events)
- Asana MCP (tasks) - Use [Asana's official MCP server](https://developers.asana.com/docs/using-asanas-mcp-server)

**Flow:**
```
"Show me all my tasks across GitHub, Calendar, and Asana for this week"
→ Claude queries all three MCPs
→ Provides unified view

"Create a GitHub issue and an Asana task for: Refactor authentication"
→ Claude creates both
```

### Workflow 6: Voice-Based Life Management

**Scenario:** You want to manage your life via voice while away from computer.

**Setup:**
- All MCPs accessible via Claude phone app (remote)

**Flow:**
```
Morning (while getting ready):
"What's on my calendar today?"
"What GitHub issues need my attention?"
"Create a calendar event for dinner with Sarah at 7pm"

Evening (while cooking):
"Add a GitHub issue: Fix calendar sync bug"
"Show me my calendar for next week"
```

---

## Strategic vs Tactical Decision-Making

### Workflow 7: Architecture Planning

**Scenario:** You want to plan a new feature but need both strategic thinking and tactical implementation.

**Setup:**
- Cursor (local MCPs) for code
- Claude.ai (remote MCPs) for planning
- Google Drive MCP for shared docs

**Flow:**
```
1. Strategic Planning (Claude.ai):
   "Review my codebase and create an architecture plan for adding OAuth broker"
   → Claude reads code via GitHub MCP
   → Analyzes current structure
   → Creates architecture.md in Drive MCP

2. Tactical Implementation (Cursor):
   - Reads architecture.md from Drive MCP
   - Implements OAuth broker
   - Creates PRs, updates issues

3. Documentation (Claude.ai):
   "Document the OAuth broker implementation"
   → Claude reads PR, code changes
   → Creates documentation in Drive MCP
```

### Workflow 8: Documentation Generation

**Scenario:** You want to keep documentation up-to-date without manual work.

**Setup:**
- GitHub MCP for code/PRs
- Drive MCP for documentation

**Flow:**
```
"Generate documentation for all my recent PRs"
→ Claude reads PRs via GitHub MCP
→ Analyzes changes
→ Creates/updates documentation in Drive MCP
→ Links to PRs, explains decisions
```

### Workflow 9: Code Review & Analysis

**Scenario:** You want strategic code review before merging.

**Setup:**
- GitHub MCP (remote) for Claude.ai
- GitHub MCP (local) for Cursor

**Flow:**
```
1. Create PR in Cursor (tactical)
2. Review in Claude.ai (strategic):
   "Review PR #42 and provide feedback"
   → Claude reads PR, code changes
   → Analyzes architecture, patterns
   → Provides strategic feedback
3. Update PR in Cursor based on feedback
```

---

## Startup & Small Team Use Cases

### Use Case 1: Early-Stage Startup

**Scenario:** Small team (2-5 people) needs productivity automation without enterprise tools.

**Benefits:**
- **Cost**: Free Cloudflare Workers vs expensive SaaS
- **Flexibility**: Custom MCPs for your specific needs
- **Integration**: All tools accessible via voice (Claude phone app)
- **Multi-User**: OAuth broker supports multiple users (just change `USER_ID`)

**Workflows:**
```
Team Management:
- "Show me all open issues across our repos"
- "Create a calendar event for team standup"
- "What PRs need review?"

Voice Access:
- Team members can manage tasks via voice
- No need to be at computer
- Works on phone, tablet, etc.
```

### Use Case 2: Freelancer/Consultant

**Scenario:** Managing multiple client projects, personal projects, and life.

**Benefits:**
- **Unified View**: All projects in one place
- **Voice Access**: Manage tasks while away from computer
- **Documentation**: Shared docs between Cursor and Claude
- **Automation**: Email → Calendar, GitHub → Tasks

**Workflows:**
```
Client Management:
- "Show me all issues for client X"
- "Create a calendar event for client meeting"
- "Document what I did for client Y this week"

Personal Projects:
- Separate repos, same tools
- Voice access for quick task creation
```

### Use Case 3: Open Source Maintainer

**Scenario:** Managing open source projects, personal projects, and contributions.

**Benefits:**
- **Issue Management**: Voice access to create/update issues
- **PR Review**: Strategic review via Claude.ai
- **Documentation**: Auto-generate docs from PRs
- **Community**: Quick responses via voice

**Workflows:**
```
Community Management:
- "List all open PRs in my repos"
- "Review PR #123 and provide feedback"
- "Create an issue for: Add feature X"

Documentation:
- Auto-generate changelog from PRs
- Update README based on new features
- Create contributor guides
```

---

## Advanced Workflows

### Workflow 10: Automated Operations Queue

**Scenario:** You want event-driven automation (GitHub Actions → Supabase → Agent).

**Setup:**
- GitHub MCP (Actions webhooks)
- Supabase MCP (operations queue)
- Operations agent (event-driven)

**Flow:**
```
1. GitHub Actions workflow fails
2. Webhook → Cloudflare Worker
3. Worker writes to Supabase: operations_queue
4. Operations agent wakes up (event-driven)
5. Agent analyzes failure using Claude API
6. Agent creates PR with fix OR escalates to you
```

### Workflow 11: Multi-Service Orchestration

**Scenario:** You want to coordinate actions across multiple services.

**Setup:**
- All MCPs accessible via Claude.ai

**Flow:**
```
"Create a GitHub issue, add a calendar reminder, and create an Asana task for: Refactor auth"
→ Claude calls GitHub MCP (create issue)
→ Claude calls Calendar MCP (create event)
→ Claude calls Asana MCP (create task)
→ All coordinated in one request
```

### Workflow 12: Memory-Enhanced Conversations

**Scenario:** You want Claude to remember context across sessions.

**Setup:**
- Google Drive MCP for shared docs
- Both Cursor and Claude.ai access same docs

**Flow:**
```
Session 1 (Claude.ai):
"Create a project plan for feature X"
→ Claude creates plan.md in Drive MCP

Session 2 (Cursor):
→ Cursor reads plan.md from Drive MCP
→ Implements feature

Session 3 (Claude.ai):
"Update the project plan based on what we built"
→ Claude reads plan.md, PRs, code
→ Updates plan with actual implementation
```

---

## Unique Benefits

### 1. **No Dependency on Claude's Roadmap**

- Don't wait for Claude to add support for a service
- Deploy your own MCP server → Access it remotely
- Use community MCPs that aren't certified
- Full control over your tools

### 2. **Voice Access to Everything**

- Claude phone app works automatically with remote MCPs
- Manage your entire stack via voice
- No need to be at computer
- Works while walking, driving, etc.

### 3. **Strategic + Tactical Integration**

- Cursor for coding (tactical)
- Claude.ai for planning (strategic)
- Shared memory via Drive MCP
- Same tools, different contexts

### 4. **Personal Life + Development**

- Same system for personal projects and life organization
- Unified access to GitHub, Calendar, Email, Tasks
- Cross-service automation
- Voice access for quick actions

### 5. **Free & Personal**

- Free Cloudflare Workers (no hosting costs)
- Personal OAuth (no enterprise requirements)
- Full control (no vendor lock-in)
- Multi-user ready (just change `USER_ID`)

---

## Comparison: Before vs After

### Before (Without Personal Block-in-a-Box)

**Development:**
- Cursor for coding
- Manual GitHub issue management
- No voice access
- No remote MCP access

**Life Organization:**
- Separate tools (GitHub, Calendar, Email)
- No integration
- Manual task management
- No voice access

**Strategic Planning:**
- Manual documentation
- No shared memory between Cursor and Claude
- No automated workflows

### After (With Personal Block-in-a-Box)

**Development:**
- ✅ Cursor for coding (local MCPs)
- ✅ Voice access to GitHub (remote MCPs)
- ✅ Automated issue management
- ✅ Remote MCP access via Claude.ai

**Life Organization:**
- ✅ Unified access to all services
- ✅ Cross-service automation
- ✅ Voice access for quick actions
- ✅ Integrated task management

**Strategic Planning:**
- ✅ Shared memory via Drive MCP
- ✅ Automated documentation
- ✅ Strategic review via Claude.ai
- ✅ Tactical implementation via Cursor

---

## Getting Started

To enable these workflows:

1. **Set up OAuth broker** - Central token management
2. **Deploy MCP gateway** - Remote access to all MCPs
3. **Configure Claude.ai** - Add remote MCPs (works automatically in phone app!)
4. **Set up local MCPs** - For Cursor development
5. **Add Google Drive MCP** - For shared memory (coming soon)

See [`../setup/CLAUDE_AI_SETUP.md`](../setup/CLAUDE_AI_SETUP.md) for remote MCP setup.

See [`../setup/CURSOR_SETUP.md`](../setup/CURSOR_SETUP.md) for local MCP setup.

---

## Future Workflows (Planned)

- **Gmail MCP with PDF parsing** - ✅ Completed - Automated event extraction
- **Asana Integration** - ✅ Available - Use [Asana's official MCP server](https://developers.asana.com/docs/using-asanas-mcp-server) for task management
- **Supabase MCP** - ✅ Completed - Operations queue automation
- **Google Drive MCP** - ✅ Completed - Shared memory between Cursor and Claude
- **Automated setup scripts** - Make it accessible to non-technical users

See [`CURRENT_STATE.md`](./CURRENT_STATE.md) for implementation status.

