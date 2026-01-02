# Claude API Wrapper MCP

> Idea: MCP server that wraps Claude's API to extract documents and context from conversations

## The Problem

**Context Window Limits:**
- Claude conversations can exceed context window limits
- Important context gets lost when conversation ends
- No easy way to extract and save important parts of conversations
- Phone conversations "drop off" when context is lost

**Memory Isolation:**
- Claude's internal memory is not accessible via MCP
- Can't programmatically extract summaries or context
- Manual copy-paste is tedious and error-prone

## The Solution: Claude API Wrapper MCP

An MCP server that wraps Claude's API to:
- Extract documents from conversations
- Auto-save summaries when approaching context limits
- Pull important context from Claude's system
- Bridge Claude's internal memory with Google Drive

## Potential Features

### 1. Extract Documents from Conversations

**Tool: `extract_document`**
- Extract markdown documents from Claude conversations
- Save to Google Drive automatically
- Preserve formatting and structure

**Use case:**
```
Claude conversation generates a document → 
Extract via MCP → Save to Drive → 
Accessible by Cursor and future Claude sessions
```

### 2. Auto-Save Summaries

**Tool: `save_conversation_summary`**
- Automatically save conversation summaries
- Trigger when approaching context limits
- Extract key points and decisions

**Use case:**
```
Claude conversation approaching limit → 
Auto-extract summary → Save to Drive → 
Continue conversation with reference to saved summary
```

### 3. Context Window Management

**Tool: `manage_context`**
- Monitor context window usage
- Extract important context before it's lost
- Save to Drive for future sessions

**Use case:**
```
Context window at 80% → 
Extract important context → 
Save to Drive → 
Continue with fresh context
```

### 4. Pull Documents from Claude

**Tool: `get_conversation_documents`**
- List documents in current conversation
- Extract specific documents by ID
- Save to Drive or return as content

**Use case:**
```
"Extract all markdown documents from this conversation"
→ MCP lists documents → 
User selects which to save → 
Saved to Drive
```

## Implementation Challenges

### 1. Claude API Access

**Question:** Does Claude expose an API for accessing conversation content?

**Options:**
- Use Claude's Messages API (if available)
- Use Claude's system prompts to extract content
- Parse conversation history (if accessible)

### 2. Context Limit Detection

**Question:** How to detect when approaching context limits?

**Options:**
- Monitor token count via API
- Use Claude's system messages about limits
- Manual triggers (user-initiated saves)

### 3. Auto-Save Triggers

**Question:** Where can auto-save be configured?

**Options:**
- Claude.ai web interface (can configure rules)
- Claude Desktop (can configure MCPs)
- Claude phone app (may not support custom rules)
- MCP-level triggers (if API supports it)

## Integration with Google Drive MCP

**Workflow:**
```
Claude conversation → 
Claude API wrapper extracts document → 
Google Drive MCP saves to Drive → 
Future sessions load from Drive
```

**Example:**
```
1. Claude conversation generates architecture plan
2. Claude API wrapper MCP extracts the plan
3. Google Drive MCP saves to: conversations/2025-01-15-architecture-plan.md
4. Next session (Cursor or Claude) reads from Drive
5. Continues with full context
```

## Use Cases

### 1. Phone Conversations

**Problem:** Phone conversations drop off when context is lost

**Solution:**
- Auto-save summaries during phone conversations
- Save to Drive automatically
- Continue conversation later with full context

**Challenge:** Phone app may not support custom MCPs or rules

### 2. Long Planning Sessions

**Problem:** Long planning sessions exceed context limits

**Solution:**
- Auto-extract summaries at intervals
- Save important decisions to Drive
- Continue with reference to saved context

### 3. Document Generation

**Problem:** Claude generates documents but they're lost when conversation ends

**Solution:**
- Extract documents automatically
- Save to Drive
- Accessible by both Cursor and Claude

## Research Needed

1. **Claude API capabilities:**
   - Does Claude expose conversation content via API?
   - Can we access conversation history programmatically?
   - What APIs are available for context management?

2. **Auto-save implementation:**
   - Where can auto-save rules be configured?
   - Can MCPs trigger auto-saves?
   - How to detect context limit approaching?

3. **Phone app support:**
   - Does Claude phone app support custom MCPs?
   - Can rules be configured for phone app?
   - What's the best approach for phone conversations?

## Next Steps

1. **Research Claude API** - What's available for conversation/document access?
2. **Prototype extraction** - Can we extract documents from conversations?
3. **Test auto-save** - Where can auto-save be configured?
4. **Document findings** - Update this doc with research results

## References

- [Claude API Documentation](https://docs.anthropic.com/) - Check for conversation/document APIs
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification
- [Google Drive MCP](./GOOGLE_DRIVE_USE_CASE.md) - Integration target

