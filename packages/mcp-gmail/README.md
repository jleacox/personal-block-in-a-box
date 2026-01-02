# Gmail MCP Server

Cloudflare Workers compatible Gmail MCP server using REST API directly (no `googleapis` package).

## Features

- ✅ Search emails using Gmail search syntax
- ✅ Read emails with full content and attachment information
- ✅ Send emails (plain text, HTML, multipart, with attachments)
- ✅ Create draft emails (same features as send)
- ✅ Modify email labels (add/remove labels, move to folders, archive emails)
- ✅ OAuth broker support (with direct token fallback)
- ✅ Dual transport (stdio for local, HTTP for Cloudflare Workers)
- ✅ Cloudflare Workers compatible (uses `fetch`, no Node.js APIs)

## Installation

```bash
cd packages/mcp-gmail
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
    "gmail": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-gmail/dist/index.js"],
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
import gmailWorker from './packages/mcp-gmail/src/worker.js';

export default gmailWorker;
```

## Tools

### Phase 1: Core Email Operations

**`search_emails`** - Search for emails using Gmail search syntax
- Parameters: `query` (required), `maxResults` (optional, default: 10)
- Example: `query: "from:example@gmail.com has:attachment"`

**`read_email`** - Get email content with attachment information
- Parameters: `messageId` (required)
- Returns: Full email content, headers, and attachment details

**`send_email`** - Send email immediately
- Parameters: `to` (required), `subject` (required), `body` (required), `htmlBody`, `mimeType`, `cc`, `bcc`, `threadId`, `inReplyTo`, `attachments`
- Supports: Plain text, HTML, multipart, and attachments (base64-encoded)

**`draft_email`** - Create draft email (same features as send_email)
- Parameters: Same as `send_email`
- Creates draft without sending

**`modify_email`** - Add/remove labels (move to folders, archive emails)
- Parameters: `messageId` (required), `addLabelIds`, `removeLabelIds`
- To archive an email: Remove the `INBOX` label using `removeLabelIds: ["INBOX"]`

### Phase 2: Label Management

**`list_labels`** - List all Gmail labels (system and user)
- Returns: All labels grouped by type

**`create_label`** - Create a new Gmail label
- Parameters: `name` (required), `messageListVisibility`, `labelListVisibility`

**`update_label`** - Update an existing Gmail label
- Parameters: `id` (required), `name`, `messageListVisibility`, `labelListVisibility`

**`delete_label`** - Delete a user-created label (system labels cannot be deleted)
- Parameters: `id` (required)

**`get_or_create_label`** - Get existing label by name or create if not found
- Parameters: `name` (required), `messageListVisibility`, `labelListVisibility`

### Phase 2: Filter Management

**`list_filters`** - List all Gmail filters
- Returns: All filters with criteria and actions

**`create_filter`** - Create a new Gmail filter
- Parameters: `criteria` (required), `action` (required)
- Criteria: `from`, `to`, `subject`, `query`, `hasAttachment`, `size`, etc.
- Actions: `addLabelIds`, `removeLabelIds`, `forward`

**`get_filter`** - Get details of a specific filter
- Parameters: `filterId` (required)

**`delete_filter`** - Delete a Gmail filter
- Parameters: `filterId` (required)

**`create_filter_from_template`** - Create filter using pre-defined templates
- Parameters: `template` (required), `parameters` (required)
- Templates: `fromSender`, `withSubject`, `withAttachments`, `largeEmails`, `containingText`, `mailingList`

### Date Extraction

**`extract_dates_from_email`** - Extract dates and events from email content and attachments
- Parameters: `messageId` (required), `parseAttachments` (optional, default: true), `useClaude` (optional, default: true)
- Uses Claude API (with Vision for images) for intelligent extraction
- Falls back to regex if Claude is unavailable or disabled
- Supports PDF attachments and image attachments (PNG, JPG, etc.)
- Returns structured events, important dates, and date ranges
- Requires `ANTHROPIC_API_KEY` environment variable for Claude extraction

**⚠️ Important Usage Note:**
- You **cannot** use Gmail URLs directly (e.g., `https://mail.google.com/mail/u/0/#inbox/...`)
- You **must** either:
  1. Have the agent/MCP search for the email first using `search_emails`, then use the `messageId` from the results
  2. Provide search details (subject, from, date range, etc.) to find the email, then extract dates using the `messageId`
- The `messageId` is the Gmail API message ID (e.g., `19b637f4701b695e`), not a URL

## Gmail API Scopes

Required OAuth scopes:
- `https://www.googleapis.com/auth/gmail.readonly` - Read emails
- `https://www.googleapis.com/auth/gmail.send` - Send emails
- `https://www.googleapis.com/auth/gmail.modify` - Full access (read, send, modify, archive)

For full access (recommended):
- `https://www.googleapis.com/auth/gmail.modify` - Full access to Gmail

## Cloudflare Workers Compatibility

✅ Uses Gmail REST API with `fetch` (no Node.js APIs)
✅ No `googleapis` package dependency
✅ Works on Cloudflare Workers
✅ Manual RFC822 message building (no `nodemailer` dependency)
✅ Base64url encoding for Gmail API compatibility

## Authentication

**Priority:** OAuth broker is tried first, then falls back to direct token if broker is not configured.

**OAuth Broker (Recommended):**
- Handles refresh tokens automatically
- Stores credentials securely in Cloudflare KV
- Same setup works for Cursor, Cloudflare, and mobile

**Direct Token (Local Dev Only):**
- Set `GOOGLE_ACCESS_TOKEN` environment variable
- Requires manual token refresh
- Use OAuth broker for production

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

- **Minimal tools:** Phase 1 focuses on core email operations
- **Cloudflare Workers first:** Built with Workers compatibility from the start
- **OAuth broker integration:** Matches existing `mcp-calendar` and `mcp-drive` patterns
- **Dual transport:** Same codebase for local (stdio) and remote (HTTP)
- **RFC822 messages:** Manual message building for attachments (Workers-compatible)

## Phase 2 (Completed)

- ✅ Label management tools (list, create, update, delete, get_or_create)
- ✅ Filter management tools (create, list, get, delete, create_from_template)

## Future Enhancements

- PDF parsing support for attachments (using pdfjs-dist)

## References

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Gmail REST API Reference](https://developers.google.com/gmail/api/reference/rest)
- [Model Context Protocol](https://modelcontextprotocol.io/)

