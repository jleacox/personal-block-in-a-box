# MCP Platform Support Research

## Summary

Research findings on Model Context Protocol (MCP) support across major AI platforms.

## Platform Support Status

### ✅ Claude (Anthropic)
**Status:** Native MCP Support

- **Claude Desktop:** Full MCP support via stdio transport
- **Claude.ai:** MCP support via HTTP/SSE transport
- **OAuth Pattern:** Supports OAuth broker pattern (works with our setup)
- **Documentation:** [Anthropic MCP Documentation](https://docs.anthropic.com/en/docs/build-with-claude/mcp)

**Integration:** Works seamlessly with our OAuth broker setup. No additional OAuth apps needed.

### ❌ Google Gemini
**Status:** API-Level MCP Support Only (No User-Facing Configuration)

- **Managed MCP Servers:** Google provides fully-managed, remote MCP servers for developers
- **MCP Toolbox:** Open-source MCP servers for databases (AlloyDB, Spanner, Cloud SQL, Bigtable)
- **Vertex AI Integration:** MCP support integrated into Vertex AI for developers
- **User Interface:** No way to add/configure MCP servers in Gemini UI (only "Gems" and built-in custom apps)
- **Documentation:** [Google Cloud MCP Blog Post](https://cloud.google.com/blog/products/ai-machine-learning/announcing-official-mcp-support-for-google-services)

**Integration:** MCP support exists at the API level for developers building applications, but there's no user-facing way to connect MCP servers to Gemini (unlike Claude.ai which has native MCP support in the UI).

### ❌ ChatGPT (OpenAI)
**Status:** No Native MCP Support

- **Custom GPTs:** Use Actions (OpenAPI schema), not MCP protocol
- **Function Calling:** Uses OpenAI's function calling format, not MCP JSON-RPC
- **OAuth Pattern:** Handles OAuth itself, requires separate OAuth apps per service (GitHub limitation)

**Integration:** Would require:
1. OpenAPI Actions wrapper (we built `/openapi.json` and `/actions` endpoints)
2. Separate OAuth apps for each service (GitHub only allows one redirect URI)
3. Custom OAuth flow (ChatGPT handles OAuth, passes Bearer tokens)

**Recommendation:** Not worth the complexity. Use Claude.ai instead (only platform with native user-facing MCP support).

## OAuth Complexity Comparison

| Platform | MCP Support | OAuth Pattern | OAuth Apps Needed |
|----------|------------|--------------|------------------|
| **Claude** | ✅ Native | OAuth broker | 1 per service (shared) |
| **Gemini** | ❌ API-only | N/A (no user-facing MCP) | N/A |
| **ChatGPT** | ❌ No | Handles OAuth itself | 2 per service (GitHub limitation) |

## Code Status

### Active (Claude only)
- `/mcp/sse` - Main MCP endpoint (works with Claude)
- OAuth broker integration - Works with Claude

### Deprecated/Experimental (ChatGPT Only)
- `/openapi.json` - OpenAPI schema for ChatGPT Actions (deprecated - ChatGPT doesn't support MCP)
- `/actions` - ChatGPT Actions handler (deprecated - ChatGPT doesn't support MCP)
- `/.well-known/oauth-authorization-server` - ChatGPT OAuth discovery (deprecated)
- `/.well-known/oauth` - Legacy OAuth discovery (deprecated)
- `/oauth` - Alternative OAuth discovery (deprecated)
- `/oauth/:service/config` - OAuth config endpoint (deprecated)

**Note:** These endpoints are kept for potential future use but are not actively maintained since ChatGPT doesn't support MCP natively.

## Recommendations

1. **Primary Platform:** Use Claude.ai for MCP integration
   - Native MCP support
   - Works with OAuth broker
   - No additional OAuth apps needed

2. **Not Available:** Google Gemini MCP integration
   - MCP support exists at API level for developers
   - No user-facing way to configure MCP servers in Gemini UI
   - Only "Gems" and built-in custom apps available

3. **Skip:** ChatGPT MCP integration
   - Doesn't support MCP natively
   - Requires complex OpenAPI wrapper
   - Requires multiple OAuth apps per service
   - Not worth the maintenance burden

## References

- [Google Cloud MCP Announcement](https://cloud.google.com/blog/products/ai-machine-learning/announcing-official-mcp-support-for-google-services)
- [Google MCP Toolbox for Databases](https://cloud.google.com/blog/products/ai-machine-learning/mcp-toolbox-for-databases-now-supports-model-context-protocol)
- [Anthropic MCP Documentation](https://docs.anthropic.com/en/docs/build-with-claude/mcp)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)

