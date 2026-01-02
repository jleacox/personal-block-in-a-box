# Google Drive Storage Philosophy

> How to organize Google Drive for memory sharing between Cursor and Claude

> **Note:** This document describes the general approach. For troubleshooting Gmail/Drive MCP issues, see [`docs/troubleshooting/GMAIL_OAUTH_ISSUES.md`](../troubleshooting/GMAIL_OAUTH_ISSUES.md).

## Core Principle

**Google Drive serves as working memory, not permanent documentation.**

- **Drive** = Ephemeral, working memory, context snapshots, conversation summaries
- **Git/Repo** = Permanent, versioned documentation, architecture decisions
- **Claude's internal memory** = Session-specific context (can be extracted to Drive)

## Recommended Drive Structure

### For Technical Users (with GitHub repos)

```
Google Drive/
└── [project-name]/              # One folder per project
    ├── conversations/           # Session summaries
    │   ├── 2025-01-15-cursor-session.md
    │   └── 2025-01-15-claude-planning.md
    ├── context/                  # Context snapshots
    │   ├── current-project-state.md
    │   └── recent-decisions.md
    └── working-notes/            # Temporary notes
        └── ideas-in-progress.md
```

**Why separate from repo docs:**
- Repo `docs/` = Permanent, versioned, in git
- Drive = Working memory, ephemeral, shared between tools
- No duplication - each serves a different purpose

### For Non-Technical Users (no GitHub)

```
Google Drive/
├── conversations/                # All conversation summaries
│   ├── 2025-01-15-work-session.md
│   └── 2025-01-15-personal-planning.md
├── context/                      # Context snapshots
│   ├── current-projects.md
│   └── important-decisions.md
└── documents/                    # Permanent documents (since no git)
    ├── project-plans/
    └── meeting-notes/
```

**Why different:**
- No git repo = Drive becomes both working memory AND permanent storage
- Still separate conversations/context from permanent docs
- Can organize by project in subfolders if needed

## Memory Flow

### Three-Layer Memory System

1. **Claude's Internal Memory** (session-specific)
   - Current conversation context
   - Can be extracted to Drive when approaching limits
   - Auto-saves important context to Drive

2. **Google Drive** (shared working memory)
   - Conversation summaries
   - Context snapshots
   - Working notes
   - Accessible by both Cursor and Claude

3. **Git Repository** (permanent documentation)
   - Architecture decisions
   - Setup guides
   - Reference documentation
   - Versioned, permanent

### Workflow Example

```
1. Claude.ai conversation:
   - Strategic planning session
   - Approaches context limit
   - Auto-saves summary to Drive: conversations/2025-01-15-claude-planning.md

2. Cursor IDE session:
   - Reads context from Drive: context/current-project-state.md
   - Implements features
   - Saves progress to Drive: conversations/2025-01-15-cursor-session.md

3. Next Claude.ai session:
   - Loads previous context from Drive
   - Continues from where it left off
   - No context lost!
```

## Context Window Management

### Auto-Save to Drive

**When approaching Claude's context limit:**
- Extract important context from conversation
- Save summary to Drive automatically
- Continue conversation with reference to saved context
- Next session loads from Drive

**Implementation ideas:**
- Claude API wrapper MCP to extract documents
- Auto-save triggers when context approaches limit
- Manual save option for important moments

### What to Save

**Always save:**
- Conversation summaries (what was discussed)
- Important decisions made
- Context snapshots (current project state)
- Working notes (ideas in progress)

**Don't save:**
- Full conversation transcripts (too verbose)
- Temporary debugging notes (unless important)
- Duplicate information already in repo docs

## Integration with Other MCPs

### GitHub MCP
- Reference Drive docs in issue descriptions
- Link to Drive context docs from PRs
- Keep repo docs in git, working memory in Drive

### Calendar MCP
- Link Drive docs in event descriptions
- Save meeting notes to Drive
- Reference Drive context in calendar events

### Gmail MCP (future)
- Attach Drive docs to emails
- Save important emails to Drive as context

## Personalization

**For project maintainers:**
- Configure Drive folder IDs in global Cursor rules (see `docs/setup/DRIVE_INTEGRATION_SETUP.md`)
- See `docs/personal/DRIVE_STRUCTURE.md` (gitignored) for personal preferences
- General structure documented here, personal tweaks in separate files

**For contributors:**
- Follow general structure in this doc
- Set up your own Drive folder (see `docs/setup/DRIVE_INTEGRATION_SETUP.md`)
- Adapt to your own needs
- Document your structure if it differs significantly

## Best Practices

1. **Keep it organized** - Use folders to separate conversations, context, and notes
2. **Regular cleanup** - Archive old conversations, keep context current
3. **Name consistently** - Use dates and descriptive names
4. **Don't duplicate** - If it's in repo docs, don't duplicate in Drive
5. **Share strategically** - Drive is for working memory, not everything

## Future Enhancements

- **Claude API wrapper MCP** - Auto-extract summaries from Claude conversations
- **Auto-save triggers** - Save to Drive when approaching context limits
- **Smart organization** - Auto-organize by project, date, or topic
- **Search integration** - Better search across Drive for context retrieval

