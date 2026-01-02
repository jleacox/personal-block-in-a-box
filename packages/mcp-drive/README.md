# Google Drive MCP Server

Cloudflare Workers compatible Google Drive MCP server using REST API directly (no `googleapis` package).

**Minimal implementation** following consolidation philosophy - only 3 tools for memory sharing use case.

## Features

- ✅ Read files from Google Drive (supports regular files and Google Docs - exports to markdown)
- ✅ Write/update files in Google Drive (creates new or updates existing)
- ✅ List files in folders (with search query support)
- ✅ OAuth broker support (with PAT fallback)
- ✅ Dual transport (stdio for local, HTTP for Cloudflare Workers)
- ✅ Cloudflare Workers compatible (uses `fetch`, no Node.js APIs)

## Installation

```bash
cd packages/mcp-drive
npm install
npm run build
```

## Usage

### Local Development (stdio)

```bash
npm start
```

Configure in Cursor/Claude Desktop:
```json
{
  "mcpServers": {
    "google-drive": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-drive/dist/index.js"],
      "env": {
        "GOOGLE_ACCESS_TOKEN": "your-token-here",
        "OAUTH_BROKER_URL": "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev",
        "USER_ID": "YOUR_USER_ID"
      }
    }
  }
}
```

### Cloudflare Workers (HTTP)

Import in your Worker:
```typescript
import driveWorker from './packages/mcp-drive/src/worker.js';

export default driveWorker;
```

## Tools

Following consolidation philosophy - minimal set of 7 tools:

- **`read_file`** - Read a file from Google Drive
  - Supports both regular files and Google Docs (exports to markdown)
  - Parameters: `fileId` (required)
  
- **`write_file`** - Write or update a file in Google Drive
  - Creates new file if `fileId` not provided, updates existing file if `fileId` provided
  - **Updating in place is easy**: Just provide the `fileId` from a previous read/list/search
  - **Upload to folder directly**: Use `parentFolderId` to place file in specific folder
  - Parameters: `fileName` (required), `content` (required), `fileId` (optional), `parentFolderId` (optional)
  
- **`list_files`** - List files in a folder
  - Supports listing root folder or specific folder, and search query to find files by name
  - Parameters: `folderId` (optional), `query` (optional), `pageSize` (optional, default: 50, max: 100)

- **`search`** - Search for files across Google Drive
  - Searches across entire Drive (not limited to a folder) using full-text search
  - Parameters: `query` (required), `pageSize` (optional, default: 50, max: 100), `pageToken` (optional)

- **`createFolder`** - Create a new folder in Google Drive
  - Creates folder in root if `parentFolderId` not provided
  - Parameters: `name` (required), `parentFolderId` (optional)

- **`moveItem`** - Move a file or folder to a different location
  - Useful for organizing files after upload or reorganizing folder structure
  - Parameters: `itemId` (required), `destinationFolderId` (optional - defaults to root)

- **`renameItem`** - Rename a file or folder
  - Useful when file names need to change or be corrected
  - Parameters: `itemId` (required), `newName` (required)

## Use Case: Memory Sharing Between Cursor and Claude

This MCP is designed for sharing `.md` (markdown) documents between Cursor IDE and Claude.ai:

1. **In Cursor:** Save architecture decisions, notes, or context to Google Drive
2. **In Claude.ai:** Read those same documents for context
3. **Shared Memory:** Both interfaces access the same documents

### Example Workflows

**Basic Workflow:**
```
# In Cursor:
"Save this architecture decision to Drive: docs/architecture-decisions.md"

# Later in Claude.ai:
"Read the architecture decisions document from Drive"
```

**Organized Workflow:**
```
# Create folder structure
"Create a folder called 'project-docs' in Drive"
"Create a folder called 'architecture' inside 'project-docs'"

# Upload local files to specific folder
"Upload my local architecture.md file to the 'project-docs/architecture' folder"

# Update files in place (easy - just provide fileId)
"Update the architecture.md file with this new decision" 
# (Claude finds fileId from previous read/list/search, updates in place)

# Reorganize later if needed
"Move architecture.md from root to the 'project-docs/architecture' folder"
"Rename 'architecture.md' to 'architecture-decisions.md'"
```

**Key Benefits:**
- ✅ **Update in place is easy**: `write_file` with `fileId` updates existing files
- ✅ **Upload to folders directly**: Use `parentFolderId` when creating files
- ✅ **Reorganize later**: `moveItem` and `renameItem` for organization
- ✅ **No need to delete**: Can be done manually in Drive UI if needed

## Authentication

The Drive MCP supports **two authentication methods**:

### Method 1: OAuth Broker (Recommended)

**Benefits:**
- ✅ No local credentials needed
- ✅ Automatic token refresh
- ✅ Multi-user support (just change `USER_ID`)
- ✅ Secure token storage in Cloudflare KV

**Configuration:**
```json
{
  "env": {
    "OAUTH_BROKER_URL": "https://oauth-broker.YOUR_SUBDOMAIN.workers.dev",
    "USER_ID": "YOUR_USER_ID"
  }
}
```

### Method 2: Direct Access Token (Fallback)

**For local development or simple setups:**
```json
{
  "env": {
    "GOOGLE_ACCESS_TOKEN": "your-access-token-here"
  }
}
```

**Note:** Direct tokens require manual refresh when expired. Use OAuth broker for production!

**Priority:** OAuth broker is tried first, then falls back to direct token if broker is not configured.

## Google Drive API Scopes

Required OAuth scopes:
- `https://www.googleapis.com/auth/drive.file` - Access to files created by the app
- `https://www.googleapis.com/auth/drive.readonly` - Read-only access (if you need to read existing files)

For full access (read/write any file):
- `https://www.googleapis.com/auth/drive` - Full access to Google Drive

## Cloudflare Workers Compatibility

✅ Uses Google Drive REST API with `fetch` (no Node.js APIs)
✅ No `googleapis` package dependency
✅ Works on Cloudflare Workers
✅ Handles Google Docs export to markdown automatically

## File Format Support

- **Markdown files** (`.md`) - Read/write directly
- **Text files** (`.txt`) - Read/write directly
- **Google Docs** - Automatically exported to markdown when reading
- **Other Google Workspace files** - Exported as text when reading

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Run
npm start
```

## Implementation Notes

- **Minimal tools:** Only 3 tools following consolidation philosophy
- **No over-engineering:** Focused on memory sharing use case
- **Cloudflare Workers first:** Built with Workers compatibility from the start
- **OAuth broker integration:** Matches existing `mcp-calendar` pattern
- **Dual transport:** Same codebase for local (stdio) and remote (HTTP)

## References

- [Google Drive API v3](https://developers.google.com/drive/api/v3/about-sdk)
- [Google Drive REST API](https://developers.google.com/drive/api/v3/reference)
- [Model Context Protocol](https://modelcontextprotocol.io/)

