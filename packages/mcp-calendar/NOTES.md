# Google Calendar MCP Implementation Notes

## Comparison with Old Repo

The old repo (`mobile-voice-to-code-platform`) already had a Cloudflare Workers-compatible Google Calendar implementation in `packages/cloudflare-gateway/src/mcp-handlers.ts`.

### Key Differences

**Old Repo Implementation:**
- Uses OAuth2 refresh token flow (client ID + secret + refresh token)
- Automatic token refresh with caching
- Tool names prefixed with `google_calendar_` (e.g., `google_calendar_list_events`)
- Integrated directly into the gateway's `mcp-handlers.ts`
- Has `list_calendars` tool

**This Implementation:**
- Supports three auth methods (OAuth broker, refresh token flow, direct token)
- Tool names match MCP standard (no prefix, e.g., `list_events`)
- Standalone package with dual transport (stdio + HTTP)
- Also has `list_calendars` tool
- Can be used independently or integrated into gateway

### What We Adopted

1. **Refresh Token Flow**: Added support for OAuth2 refresh token flow from the old repo
2. **Token Caching**: Implemented token caching with expiry tracking
3. **List Calendars**: Added the `list_calendars` tool that was in the old implementation

### What's Different

1. **Tool Naming**: We use standard MCP tool names (no `google_calendar_` prefix)
2. **Architecture**: Standalone package vs. integrated into gateway
3. **Auth Flexibility**: Supports OAuth broker pattern for multi-user scenarios

## Migration Path

If you want to use the old implementation instead:
- The old `GoogleCalendarMCP` class in `mcp-handlers.ts` is already working
- You can import it directly into your gateway
- Tool names will be different (`google_calendar_*` vs standard names)

This new implementation provides:
- More flexible authentication options
- Standard MCP tool naming
- Standalone package that can be used independently
- Same Cloudflare Workers compatibility

