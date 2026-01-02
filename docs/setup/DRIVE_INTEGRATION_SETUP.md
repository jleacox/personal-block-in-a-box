# Google Drive Integration Setup

> **Purpose:** Configure Google Drive as shared memory between Cursor and Claude.ai sessions

## Overview

This project uses Google Drive to share context and memory between Cursor (tactical/implementation) and Claude.ai (strategic/planning) sessions. This enables:
- Continuity across tools
- Context window management
- Explicit handoffs between Cursor and Claude
- Session summaries and decision tracking

## Setup Steps

### 1. Create Google Drive Folder Structure

Create a folder in your Google Drive for this project (or use an existing one):

```
Google Drive/
└── [your-project-folder]/
    ├── CURRENT_STATE.md          # Executive summary (quick reference)
    ├── NEXT_SESSION.md           # Quick start for new sessions
    ├── CLAUDE_CONTEXT_SNAPSHOT.md # Working memory for Claude sessions
    ├── CROSS_TOOL_HANDOFFS.md    # Coordination between tools
    └── logs/
        ├── SESSION_LOG.md        # Implementation session summaries
        ├── DECISIONS_LOG.md      # Architecture/design decisions
        ├── ISSUES_LOG.md         # Problems encountered & solutions
        ├── CLAUDE_SESSIONS.md    # Strategic session summaries
        └── META_LOG.md           # Decisions about communication system
```

### 2. Get Folder IDs

1. Open your Google Drive folder in a web browser
2. Click on the folder to open it
3. The folder ID is in the URL: `https://drive.google.com/drive/folders/FOLDER_ID`
4. Copy the folder ID (the long string after `/folders/`)

**Example:**
- URL: `https://drive.google.com/drive/folders/1qWi-3XtF7SB-uSGTOMeUfWhWmDLKhI2E`
- Folder ID: `1qWi-3XtF7SB-uSGTOMeUfWhWmDLKhI2E`

### 3. Create Logs Subfolder

1. Inside your main Drive folder, create a subfolder named `logs`
2. Get the folder ID for the logs subfolder (same process as above)

### 4. (Optional) Create Context Backup Folder

For full context backups when approaching token limits:
1. Create a separate folder for context backups
2. Get its folder ID

### 5. Configure in Global Cursor Rules

**Cursor now uses Settings > Rules > User Rules for global rules** (`.cursorrules` is deprecated for global rules).

**Option 1: Via Cursor Settings (Recommended)**
1. Open Cursor
2. Go to **Settings** > **Rules** > **User Rules**
3. Add your Drive folder IDs in the User Rules editor
4. Use the template from `docs/setup/GLOBAL_CURSOR_RULES_TEMPLATE.md`

**Option 2: Direct Database Access (Advanced)**
Global rules are stored in Cursor's internal database:
- **Windows:** `%APPDATA%\Cursor\User\globalStorage\state.vscdb`
- **macOS:** `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
- **Linux:** `~/.config/Cursor/User/globalStorage/state.vscdb`

**Note:** Direct database editing is not recommended. Use the Settings UI instead.

**Example Global Rules Entry:**
```markdown
# Google Drive Integration (Personal)

## Drive Folders
Primary communication folder: YOUR_FOLDER_ID_HERE
Logs subfolder: YOUR_LOGS_FOLDER_ID_HERE
Context backup folder: YOUR_BACKUP_FOLDER_ID_HERE (optional)
```

### 6. Initialize Drive Files

Use the Google Drive MCP to create the initial files, or create them manually:

**Required Files:**
- `CURRENT_STATE.md` - Copy from `docs/vision/CURRENT_STATE.md` or create executive summary
- `NEXT_SESSION.md` - Quick start template
- `logs/SESSION_LOG.md` - Session log template
- `logs/DECISIONS_LOG.md` - Decisions log template
- `logs/ISSUES_LOG.md` - Issues log template
- `logs/CLAUDE_SESSIONS.md` - Claude sessions log template
- `logs/META_LOG.md` - Meta log template
- `CROSS_TOOL_HANDOFFS.md` - Handoffs log template
- `CLAUDE_CONTEXT_SNAPSHOT.md` - Context snapshot template

**See:** `docs/vision/DRIVE_STORAGE_PHILOSOPHY.md` for file structure and usage guidelines

## Usage

### For Cursor Sessions (Implementation)

**Note:** These instructions are for **Cursor IDE** sessions. Cursor is less subject to context limits (auto-summation helps), but still update logs for continuity.

**At start of session:**
1. Read `NEXT_SESSION.md` for quick context
2. Check recent `SESSION_LOG.md` entries
3. Review `CROSS_TOOL_HANDOFFS.md` for work from Claude.ai

**During session:**
- Update `SESSION_LOG.md` with implementation details
- Add to `DECISIONS_LOG.md` for architecture decisions
- Add to `ISSUES_LOG.md` for problems/solutions

**At end of session:**
- Update `NEXT_SESSION.md` with where you left off
- Add final entry to `SESSION_LOG.md`

### For Claude.ai Sessions (Strategic)

**Note:** These instructions are for **Claude.ai** (web/phone app), not Cursor. Claude.ai sessions are more subject to context window limits.

**At start of session:**
1. Read `NEXT_SESSION.md` for quick start
2. Read `CLAUDE_CONTEXT_SNAPSHOT.md` for working memory
3. Check `CROSS_TOOL_HANDOFFS.md` for work from Cursor
4. Review `CURRENT_STATE.md` for project status

**During session (when approaching token limits):**
- At 80%: Update `CLAUDE_CONTEXT_SNAPSHOT.md` with current working memory
- At 90%: Write full context backup to backup folder

**At end of session:**
- Update `CLAUDE_CONTEXT_SNAPSHOT.md` with final working memory
- Add entry to `logs/CLAUDE_SESSIONS.md` for strategic discussions
- Update `NEXT_SESSION.md` with current status
- Create handoff in `CROSS_TOOL_HANDOFFS.md` if work moves to Cursor

## File Descriptions

**Strategic (Claude.ai domain):**
- `CLAUDE_SESSIONS.md` - Strategic discussions, planning, decision rationale
- `CLAUDE_CONTEXT_SNAPSHOT.md` - Working memory, updated throughout session
- `CURRENT_STATE.md` - Executive summary of project status (quick reference)

**Implementation (Cursor domain):**
- `SESSION_LOG.md` - Implementation details, code changes, technical work
- `DECISIONS_LOG.md` - Architecture/design decisions and rationale
- `ISSUES_LOG.md` - Problems encountered and their solutions

**Coordination:**
- `CROSS_TOOL_HANDOFFS.md` - Explicit coordination between Claude and Cursor
- `NEXT_SESSION.md` - Quick start, active threads, where we left off
- `META_LOG.md` - Decisions about the communication system itself

## Benefits

1. **Continuity** - Context persists across Cursor and Claude sessions
2. **Context Management** - Handle token limits by saving snapshots
3. **Explicit Handoffs** - Clear coordination when work moves between tools
4. **Decision Tracking** - Record why decisions were made
5. **Problem Solving** - Avoid repeating solved problems

## Troubleshooting

**Can't access Drive folder:**
- Verify folder ID is correct
- Check Google Drive MCP is configured and authenticated
- Ensure folder permissions allow access

**Files not updating:**
- Check Google Drive MCP authentication
- Verify folder IDs in global Cursor rules
- Check file permissions in Drive

**See also:**
- `docs/vision/DRIVE_STORAGE_PHILOSOPHY.md` - Detailed Drive organization strategy
- `docs/troubleshooting/GMAIL_OAUTH_ISSUES.md` - OAuth troubleshooting (applies to Drive too)

