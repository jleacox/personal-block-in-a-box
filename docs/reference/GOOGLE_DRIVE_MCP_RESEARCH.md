# Google Drive MCP Research & Recommendation

> Research on available Google Drive MCP servers and recommendation for Personal Block-in-a-Box

## Project Requirements

Based on your use case (memory sharing between Cursor and Claude via `.md` files), you need:

**Minimal Tool Set:**
- `drive_read_file` - Read .md file from Drive
- `drive_write_file` - Write/update .md file to Drive  
- `drive_list_files` - List files in a folder (for finding context docs)

**Technical Requirements:**
- ✅ Cloudflare Workers compatible (TypeScript/JavaScript only)
- ✅ Open source (can be forked/ported)
- ✅ OAuth broker integration support
- ✅ Dual transport (stdio for local, HTTP for Workers)

---

## Options Evaluated

### 1. **isaacphi/mcp-gdrive** ✅ **VERIFIED**

**GitHub:** https://github.com/isaacphi/mcp-gdrive  
**Language:** TypeScript ✅  
**Stars:** 246 | **Forks:** 89 | **Last Updated:** May 2025

**Pros:**
- ✅ Open source (MIT license)
- ✅ TypeScript (matches your stack)
- ✅ Focused on Drive + Sheets (not over-engineered)
- ✅ Tools: `gdrive_search`, `gdrive_read_file`, `gsheets_read`, `gsheets_update_cell`
- ✅ Active community (246 stars, 89 forks)
- ✅ Simple, focused implementation

**Cons:**
- ❌ **Uses `googleapis` npm package** - NOT Cloudflare Workers compatible (requires Node.js APIs)
- ❌ **Uses `@google-cloud/local-auth`** - Node.js-specific, not Workers compatible
- ❌ **Local file-based OAuth** - Not OAuth broker pattern
- ❌ Includes Sheets tools (you only need Drive)
- ❌ Would require significant porting to work on Workers

**Verdict:** **Good reference, but can't use directly** - TypeScript is good, but uses Node.js-specific packages that won't work on Cloudflare Workers. Use as reference for API patterns, but build your own.

---

### 2. **piotr-agier/google-drive-mcp** ✅ **VERIFIED**

**GitHub:** https://github.com/piotr-agier/google-drive-mcp  
**Language:** JavaScript/TypeScript ✅  
**Stars:** 11 | **Forks:** 12 | **Last Updated:** December 2025

**Pros:**
- ✅ Open source (MIT license)
- ✅ JavaScript/TypeScript (matches your stack)
- ✅ Supports Drive, Docs, Sheets, Slides
- ✅ OAuth 2.0 authentication
- ✅ Automatic format conversion for Google Workspace files
- ✅ Comprehensive documentation

**Cons:**
- ❌ **Uses `googleapis` npm package** - NOT Cloudflare Workers compatible (requires Node.js APIs)
- ❌ **Uses `@google-cloud/local-auth`** - Node.js-specific, not Workers compatible
- ❌ **Uses `express` for local auth server** - Not Cloudflare Workers compatible
- ❌ **Local file-based OAuth** - Not OAuth broker pattern
- ❌ **Over-engineered** - Many tools (30+), you only need 3
- ❌ Would require significant porting to work on Workers

**Verdict:** **Good reference, but can't use directly** - Well-structured but uses Node.js-specific packages and has way more features than needed. Use as reference for API patterns.

---

### 3. **Google Workspace MCP Server** (workspacemcp.com)

**Pros:**
- ✅ Comprehensive (Drive, Docs, Sheets, Calendar, Gmail, etc.)
- ✅ Multi-user OAuth 2.1
- ✅ One-click installation

**Cons:**
- ❌ **Not open source** (commercial/SaaS)
- ❌ Can't fork/port for Cloudflare Workers
- ❌ Over-engineered for your needs
- ❌ Requires their hosting

**Verdict:** **Not suitable** - Not open source, can't be integrated into your stack.

---

### 4. **Zapier Google Drive MCP**

**Pros:**
- ✅ No-code setup
- ✅ Various file operations

**Cons:**
- ❌ **Not open source** (SaaS)
- ❌ Requires Zapier subscription
- ❌ Can't be self-hosted
- ❌ Not Cloudflare Workers compatible

**Verdict:** **Not suitable** - SaaS only, can't integrate with your architecture.

---

### 5. **viaSocket Google Drive MCP**

**Pros:**
- ✅ Built-in authentication
- ✅ Easy setup

**Cons:**
- ❌ **Not open source** (SaaS)
- ❌ Can't be self-hosted
- ❌ Limited features

**Verdict:** **Not suitable** - SaaS only, can't integrate with your architecture.

---

## Recommendation: **Build from Scratch** ⭐

### Why Not Fork Existing Repos?

**Both `isaacphi/mcp-gdrive` and `piotr-agier/google-drive-mcp` have the same issues:**
1. ❌ **Use `googleapis` npm package** - Requires Node.js APIs, NOT Cloudflare Workers compatible
2. ❌ **Use `@google-cloud/local-auth`** - Node.js-specific authentication, not Workers compatible
3. ❌ **Local file-based OAuth** - Not your OAuth broker pattern
4. ❌ **Would require major refactoring** - Essentially rewriting the API layer

**The `googleapis` package is the blocker:**
- It uses Node.js `http`/`https` modules (not available in Workers)
- It uses Node.js `fs` for credential loading (not available in Workers)
- It requires Node.js-specific crypto APIs
- **Solution:** Use Google Drive REST API directly with `fetch` (Web API, Workers compatible)

### Implementation Strategy

**Build from Scratch (Recommended)**
1. Use Google Drive REST API directly with `fetch` (Cloudflare Workers compatible)
2. Implement minimal 3 tools: `read_file`, `write_file`, `list_files`
3. Follow your existing `mcp-calendar` pattern for OAuth broker integration
4. Use `isaacphi/mcp-gdrive` and `piotr-agier/google-drive-mcp` as **reference** for API usage patterns
5. Add dual transport (stdio + HTTP) from the start

**Why This Approach:**
- ✅ Cloudflare Workers compatible from day one
- ✅ OAuth broker integration (matches your architecture)
- ✅ Dual transport support (stdio + HTTP)
- ✅ Follows your consolidation philosophy (only 3 tools)
- ✅ No unnecessary features
- ✅ Cleaner codebase (no porting legacy code)

---

## Implementation Plan

### Phase 1: Minimal Implementation (3 Tools)

Following your consolidation philosophy, implement only what you need:

```typescript
// Minimal tool set
- drive_read_file(fileId: string, format?: 'text' | 'markdown')
- drive_write_file(fileId: string, content: string, format?: 'text' | 'markdown')
- drive_list_files(folderId?: string, query?: string)
```

### Phase 2: OAuth Integration

- Use existing OAuth broker pattern (like `mcp-calendar`)
- Google Drive API scopes: `https://www.googleapis.com/auth/drive.file`
- Token management via OAuth broker

### Phase 3: Cloudflare Workers Compatibility

- Use Google Drive REST API with `fetch` (not `googleapis` npm package)
- Web APIs only (no Node.js-specific code)
- Test on Workers before deploying

### Phase 4: Dual Transport

- `src/index.ts` - stdio transport (local)
- `src/worker.ts` - HTTP transport (Workers)
- Same MCP server logic, different transport

---

## Google Drive API Reference

**REST API (Cloudflare Workers Compatible):**
- Base URL: `https://www.googleapis.com/drive/v3`
- Authentication: OAuth 2.0 (via OAuth broker)
- File operations: `GET /files/{fileId}`, `PATCH /files/{fileId}`, `GET /files`
- Export Google Docs: `GET /files/{fileId}/export?mimeType=text/markdown`

**Key Endpoints:**
- `GET /files/{fileId}` - Get file metadata
- `GET /files/{fileId}?alt=media` - Download file content
- `GET /files/{fileId}/export?mimeType=text/markdown` - Export Google Doc as markdown
- `PATCH /files/{fileId}` - Update file metadata
- `POST /files/{fileId}/upload` - Upload file content
- `GET /files?q={query}` - List/search files

---

## Next Steps

1. ✅ **Verified both repos** - Both are TypeScript/JavaScript but use `googleapis` (not Workers compatible)
2. **Build from scratch** - Use Google Drive REST API with `fetch` (Workers compatible)
3. **Follow mcp-calendar pattern** - Use as reference for OAuth broker integration
4. **Reference existing repos** - Use `isaacphi/mcp-gdrive` and `piotr-agier/google-drive-mcp` for API usage patterns
5. **Implement minimal 3 tools** - Don't over-engineer
6. **Test on Cloudflare Workers** - Verify compatibility before full implementation

---

## References

- [isaacphi/mcp-gdrive](https://github.com/isaacphi/mcp-gdrive)
- [piotr-agier/google-drive-mcp](https://github.com/piotr-agier/google-drive-mcp)
- [Google Drive API v3](https://developers.google.com/drive/api/v3/about-sdk)
- [Google Drive REST API](https://developers.google.com/drive/api/v3/reference)

---

## Final Recommendation: **Build from Scratch** ⭐

**Why:** Both existing repos use `googleapis` npm package which requires Node.js APIs and is **NOT Cloudflare Workers compatible**. Building from scratch ensures:

- ✅ **Cloudflare Workers compatible** - Use REST API with `fetch` (Web API)
- ✅ **OAuth broker integration** - Matches your architecture pattern
- ✅ **Dual transport support** - stdio (local) + HTTP (Workers) from the start
- ✅ **Follows consolidation philosophy** - Only 3 tools, no unnecessary features
- ✅ **Cleaner codebase** - No porting legacy Node.js-specific code
- ✅ **Better control** - Implement exactly what you need

**Reference the existing repos for:**
- Google Drive API endpoint patterns
- OAuth flow understanding (but use your OAuth broker instead)
- File export/import logic (Google Docs → Markdown conversion)
- Error handling patterns

**But implement your own using:**
- Google Drive REST API with `fetch` (not `googleapis`)
- Your OAuth broker pattern (like `mcp-calendar`)
- Your dual transport pattern (stdio + HTTP)
- Your consolidation philosophy (minimal tools)

