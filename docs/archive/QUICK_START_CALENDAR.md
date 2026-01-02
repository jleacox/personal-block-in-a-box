# Quick Start: Google Calendar MCP for Cloudflare

## The Issue

`@cocal/google-calendar-mcp` uses `googleapis` package which **is NOT compatible** with Cloudflare Workers.

## Solution

Port it to TypeScript using Google Calendar REST API directly (like we did with GitHub MCP).

## Quick Steps

1. **Create package structure:**
   ```powershell
   mkdir packages\mcp-calendar
   cd packages\mcp-calendar
   npm init -y
   ```

2. **Follow the guide:** See [`docs/setup/GOOGLE_CALENDAR_CLOUDFLARE.md`](./docs/setup/GOOGLE_CALENDAR_CLOUDFLARE.md) for complete implementation

3. **Key points:**
   - Use Google Calendar REST API with `fetch` (not `googleapis`)
   - Follow the same pattern as `packages/mcp-github/`
   - Create both `index.ts` (stdio) and `worker.ts` (HTTP)
   - Support OAuth broker pattern

4. **Copy utilities from GitHub MCP:**
   - `src/utils/validation.ts`
   - `src/utils/errors.ts` (adapt for Calendar)

5. **Build and test:**
   ```powershell
   npm install
   npm run build
   npm start
   ```

6. **Update Cursor config** to use local version instead of `@cocal/google-calendar-mcp`

7. **Add to gateway** once deployed to Cloudflare

## Why This Approach?

- ✅ Cloudflare Workers compatible (uses `fetch`, not Node.js APIs)
- ✅ OAuth broker support (like GitHub MCP)
- ✅ Same dual transport pattern (stdio + HTTP)
- ✅ Consistent with project architecture

See the full guide: [`docs/setup/GOOGLE_CALENDAR_CLOUDFLARE.md`](./docs/setup/GOOGLE_CALENDAR_CLOUDFLARE.md)

