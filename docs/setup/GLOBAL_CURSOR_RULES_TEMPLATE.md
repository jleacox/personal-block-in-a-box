# Global Cursor Rules Template

> **Purpose:** Template for personal/global Cursor rules (not committed to repo)
> 
> **Location:** Configure in Cursor's Settings > Rules > User Rules
> 
> **How to Use:**
> 1. Open Cursor
> 2. Go to **Settings** > **Rules** > **User Rules**
> 3. Copy the content below and paste it into the User Rules editor
> 4. Replace `YOUR_FOLDER_ID_HERE` with your actual Google Drive folder IDs
> 
> **Note:** `.cursorrules` files are for project-specific rules. Global/user rules are managed in Cursor Settings.

## Google Drive Integration (Personal)

### Drive Folders

**Replace these with your actual Google Drive folder IDs:**

```
Primary communication folder: YOUR_FOLDER_ID_HERE
Logs subfolder: YOUR_LOGS_FOLDER_ID_HERE
Context backup folder: YOUR_BACKUP_FOLDER_ID_HERE
```

**How to get folder IDs:**
1. Open your Google Drive folder in a web browser
2. Click on the folder to open it
3. The folder ID is in the URL: `https://drive.google.com/drive/folders/FOLDER_ID`
4. Copy the folder ID (the long string after `/folders/`)

### Session Management & Context

**Note:** This section describes the workflow for **Claude.ai sessions** (strategic/planning). For **Cursor sessions** (implementation), see the project `.cursorrules` file.

**For Claude.ai Sessions (when approaching context window limits):**
- At 80%: Update `CLAUDE_CONTEXT_SNAPSHOT.md` in Drive folder: `YOUR_FOLDER_ID_HERE`
- At 90%: Write full context backup to Drive folder: `YOUR_BACKUP_FOLDER_ID_HERE`

**At the start of each Claude.ai session, check these Drive files:**
- `NEXT_SESSION.md` - Quick start and active conversation threads
- `CLAUDE_CONTEXT_SNAPSHOT.md` - Working memory from previous session
- `CROSS_TOOL_HANDOFFS.md` - Any work handed from Cursor
- `CURRENT_STATE.md` - Executive summary of project status

**At the end of significant Claude.ai sessions:**
- Update `CLAUDE_CONTEXT_SNAPSHOT.md` with working memory
- Add entry to `logs/CLAUDE_SESSIONS.md` for strategic discussions
- Update `NEXT_SESSION.md` with current status
- Create handoff in `CROSS_TOOL_HANDOFFS.md` if work moves to Cursor

**For Cursor Sessions (implementation):**
- Cursor is less subject to context limits (auto-summation helps)
- Update `SESSION_LOG.md` with implementation details
- Add to `DECISIONS_LOG.md` for architecture decisions
- Add to `ISSUES_LOG.md` for problems/solutions
- Update `NEXT_SESSION.md` at end of session

## Personal Preferences

**Add your personal preferences here:**
- Custom workflows
- Personal shortcuts
- Project-specific conventions
- Any other personal configuration

---

**See:** `docs/setup/DRIVE_INTEGRATION_SETUP.md` for detailed setup instructions

