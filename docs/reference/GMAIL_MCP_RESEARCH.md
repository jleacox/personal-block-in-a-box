# Gmail MCP Research & Implementation Plan

> Research on available Gmail MCP servers and plan for porting to Personal Block-in-a-Box

## Project Requirements

Based on your use case (email processing with PDF parsing), you need:

**Core Tools:**
- `list_messages` - List/search emails
- `get_message` - Get email content (with PDF parsing)
- `send_message` - Send emails
- `create_draft` - Create draft emails
- `list_labels` - List Gmail labels

**Technical Requirements:**
- ✅ Cloudflare Workers compatible (TypeScript/JavaScript only)
- ✅ Open source (can be forked/ported)
- ✅ OAuth broker integration support
- ✅ Dual transport (stdio for local, HTTP for Workers)
- ✅ PDF parsing support (for attachments)

---

## Options Evaluated

### 1. **GongRzhe/Gmail-MCP-Server** ✅ **VERIFIED**

**GitHub:** https://github.com/GongRzhe/Gmail-MCP-Server  
**Language:** TypeScript/JavaScript ✅  
**Stars:** 880 | **Forks:** 250 | **Last Updated:** August 2025

**Pros:**
- ✅ Open source (ISC license)
- ✅ TypeScript/JavaScript (matches your stack)
- ✅ Comprehensive toolset (19 tools!)
- ✅ Well-documented with examples
- ✅ Active community (880 stars, 250 forks)
- ✅ Includes label management, filters, batch operations
- ✅ Attachment support (download, send with attachments)

**Cons:**
- ❌ **Uses `googleapis` package** - NOT Cloudflare Workers compatible (requires Node.js APIs)
- ❌ **Uses `google-auth-library`** - Node.js-specific, not Workers compatible
- ❌ **Uses `nodemailer`** - Node.js-specific, not Workers compatible
- ❌ **Uses Node.js modules** (`fs`, `http`, `path`, `os`) - Not Workers compatible
- ❌ **Local file-based OAuth** - Not OAuth broker pattern
- ❌ **No PDF parsing** - Only downloads attachments, doesn't parse PDFs
- ❌ **Single large file** (54KB `index.ts`) - Not modular like Calendar/Drive pattern

**Tools Available (19 total):**
1. `send_email` - Send email with attachments
2. `draft_email` - Create draft with attachments
3. `read_email` - Read email with attachment info
4. `search_emails` - Search emails with Gmail query syntax
5. `modify_email` - Add/remove labels
6. `delete_email` - Delete email
7. `list_email_labels` - List all labels
8. `create_label` - Create new label
9. `update_label` - Update label
10. `delete_label` - Delete label
11. `get_or_create_label` - Find or create label
12. `batch_modify_emails` - Batch label operations
13. `batch_delete_emails` - Batch delete
14. `create_filter` - Create Gmail filter
15. `list_filters` - List all filters
16. `get_filter` - Get filter details
17. `delete_filter` - Delete filter
18. `create_filter_from_template` - Create filter from template
19. `download_attachment` - Download attachment to filesystem

**Verdict:** **Excellent reference, but requires significant porting** - TypeScript is good, but uses Node.js-specific packages that won't work on Cloudflare Workers. Use as reference for tool structure and Gmail API patterns, but rebuild implementation using REST API with `fetch` (like Calendar/Drive).

---

### 2. **Commercial/SaaS Options** (Not Suitable)

- **Zapier Gmail MCP** - SaaS, not open source
- **Metorial Gmail Integration** - SaaS, not open source
- **Google Workspace MCP Server** - Commercial, not open source
- **MintMCP Gmail Server** - Enterprise SaaS, not open source

**Verdict:** Not suitable - Need open source for porting

---

## Implementation Plan

### Phase 1: Research & Analysis

1. **Find GongRzhe repository**
   - Search GitHub for exact repository
   - Review code structure
   - Check language and dependencies
   - Identify tools available

2. **Assess Compatibility**
   - Check if uses `googleapis` package (NOT Workers compatible)
   - Check OAuth pattern (local file vs broker)
   - Check PDF parsing approach
   - Identify porting requirements

### Phase 2: Porting Strategy ✅ **CONFIRMED**

**GongRzhe uses Node.js-specific packages - Porting Required:**

1. **Replace `googleapis` package:**
   - Use Gmail REST API directly with `fetch`
   - Follow pattern from `packages/mcp-calendar/src/utils/calendar-client.ts`
   - Create `packages/mcp-gmail/src/utils/gmail-client.ts`

2. **Replace `google-auth-library`:**
   - Use OAuth broker pattern (same as Calendar/Drive)
   - Remove local file-based OAuth (`~/.gmail-mcp/credentials.json`)
   - Use `OAUTH_BROKER_URL` and `USER_ID` environment variables

3. **Replace `nodemailer`:**
   - Build RFC822 messages manually using `fetch` and base64 encoding
   - Or use a Workers-compatible email library (if available)
   - Handle MIME encoding manually for attachments

4. **Remove Node.js modules:**
   - `fs` - Not needed (no local file storage)
   - `http` - Not needed (OAuth broker handles auth)
   - `path` - Not needed (no file paths)
   - `os` - Not needed (no OS-specific paths)

5. **Restructure code:**
   - Split large `index.ts` into modular files
   - Follow Calendar/Drive pattern: `tools/`, `utils/`
   - Separate `index.ts` (stdio) and `worker.ts` (HTTP)

6. **Add PDF parsing:**
   - Research Workers-compatible PDF parsing library
   - Add PDF text extraction to `read_email` tool
   - Parse PDF attachments automatically

### Phase 3: Implementation

**Structure (following Calendar/Drive pattern):**
```
packages/mcp-gmail/
├── src/
│   ├── index.ts          # Stdio transport
│   ├── worker.ts         # HTTP transport
│   ├── tools/
│   │   └── messages.ts  # Gmail tools
│   └── utils/
│       ├── gmail-client.ts  # Gmail API client (REST with fetch)
│       ├── validation.ts    # Parameter validation
│       └── errors.ts        # Error handling
├── package.json
├── tsconfig.json
└── README.md
```

**Tools to Implement (Prioritized):**

**Phase 1 - Core Tools (Essential):**
1. `list_messages` / `search_emails` - List/search emails (with Gmail query syntax)
2. `get_message` / `read_email` - Get email with full content + PDF parsing
3. `send_email` - Send email (with attachment support)
4. `create_draft` - Create draft email (with attachment support)

**Phase 2 - Organization Tools:**
5. `list_labels` - List Gmail labels
6. `modify_email` - Add/remove labels (move to folders)
7. `delete_email` - Delete email
8. `get_or_create_label` - Find or create label (useful for organization)

**Phase 3 - Advanced Features (If Needed):**
9. `create_label` - Create new label
10. `update_label` - Update label
11. `delete_label` - Delete label
12. `batch_modify_emails` - Batch label operations
13. `batch_delete_emails` - Batch delete
14. `download_attachment` - Download attachment (Workers-compatible approach)
15. `create_filter` - Create Gmail filter (advanced)
16. `list_filters` - List filters
17. `delete_filter` - Delete filter

**Note:** Following consolidation philosophy - start with Phase 1, add Phase 2 if needed for workflow, Phase 3 only if actual use cases arise.

**PDF Parsing:**
- Parse PDF attachments from emails
- Extract text content
- Return as part of message content

---

## Next Steps

1. ✅ **Find GongRzhe repository** - Found: https://github.com/GongRzhe/Gmail-MCP-Server
2. ✅ **Review code** - Assessed compatibility (requires porting)
3. ✅ **Create porting plan** - Documented above
4. ⏳ **Implement following Calendar/Drive patterns** - Ready to start

## Implementation Priority

**Recommended Approach:**
1. **Start with Phase 1 tools** (core email operations)
2. **Add PDF parsing** using `pdfjs-dist` or similar Workers-compatible library
3. **Test with OAuth broker** integration
4. **Add Phase 2 tools** if needed for workflow
5. **Add Phase 3 tools** only if actual use cases arise (consolidation philosophy)

---

## Gmail API Requirements

**OAuth Scopes:**
- `https://www.googleapis.com/auth/gmail.readonly` - Read emails
- `https://www.googleapis.com/auth/gmail.send` - Send emails
- `https://www.googleapis.com/auth/gmail.modify` - Full access (read, send, modify)

**API Endpoints:**
- `GET /gmail/v1/users/me/messages` - List messages
- `GET /gmail/v1/users/me/messages/{id}` - Get message
- `POST /gmail/v1/users/me/messages/send` - Send message
- `POST /gmail/v1/users/me/drafts` - Create draft
- `GET /gmail/v1/users/me/labels` - List labels

**PDF Parsing:**
- Download attachment from Gmail API (base64 encoded)
- Research Workers-compatible PDF parsing:
  - `pdf-parse` - ❌ NOT Workers compatible (uses Node.js `fs`)
  - `pdfjs-dist` - ✅ Workers compatible (Mozilla's PDF.js)
  - Alternative: Use external service or parse on client side
- Extract text content and include in `read_email` response
- Return PDF text as part of message content for AI context

---

## References

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Gmail REST API Reference](https://developers.google.com/gmail/api/reference/rest)
- Existing implementations: `packages/mcp-calendar/` and `packages/mcp-drive/` for patterns

