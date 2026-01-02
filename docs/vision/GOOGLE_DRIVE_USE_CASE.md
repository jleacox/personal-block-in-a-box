# Google Drive MCP - Memory Sharing Use Case

## The Problem

When working with AI assistants in different interfaces (Cursor IDE vs Claude.ai), you want to share context and memory between them. Currently, each interface has its own conversation history and context.

## The Solution

Use Google Drive to store `.md` (markdown) documents that serve as shared memory/context between Cursor and Claude.

## Use Cases

### 1. Project Context Documents
- Store project architecture decisions in `docs/architecture-decisions.md`
- Both Cursor and Claude can read/write to this document
- Maintains shared understanding across interfaces

### 2. Conversation Summaries
- After important conversations, save summaries to Drive
- Next session (in different interface) can load previous context
- Enables continuity across tools

### 3. Task Lists & Notes
- Shared task lists that both interfaces can update
- Meeting notes accessible from anywhere
- Project status documents

### 4. Code Documentation
- Code explanations and patterns
- API documentation
- Design decisions

## Implementation

### Google Drive MCP Tools Needed

**Minimal set (following consolidation philosophy):**
- `drive_read_file` - Read .md file from Drive
- `drive_write_file` - Write/update .md file to Drive
- `drive_list_files` - List files in a folder (for finding context docs)

**That's it!** Three tools cover the use case. No need for:
- File permissions management (unless needed)
- Folder creation (can be done manually)
- Complex search (list_files is sufficient)

## Example Workflow

### In Cursor:
```
"Save this architecture decision to Drive: 
 docs/architecture-decisions.md"
```

### Later in Claude.ai:
```
"Read the architecture decisions document from Drive"
```

Both interfaces now share the same context!

## Benefits

1. **Shared Memory** - Context persists across interfaces
2. **Simple** - Just markdown files, easy to read/edit
3. **Accessible** - Works from any interface with Drive access
4. **Versioned** - Google Drive keeps version history
5. **Searchable** - Can search Drive for relevant context docs

## Integration with Other MCPs

- **GitHub MCP**: Can reference Drive docs in issue descriptions
- **Gmail MCP**: Can attach Drive docs to emails
- **Calendar MCP**: Can link Drive docs in event descriptions

## Storage Philosophy

See [`DRIVE_STORAGE_PHILOSOPHY.md`](./DRIVE_STORAGE_PHILOSOPHY.md) for detailed guidance on:
- How to organize Drive folders
- What to store in Drive vs. Git
- Memory flow between tools
- Context window management

## Next Steps

1. ✅ Implement minimal Google Drive MCP (7 tools: read, write, list, search, createFolder, moveItem, renameItem)
2. Test with a simple context document
3. Use in real workflows
4. Expand only if additional needs arise

## Future Enhancements

- **Claude API wrapper MCP** - Auto-extract summaries from Claude conversations
- **Auto-save triggers** - Save to Drive when approaching context limits
- See [`DRIVE_STORAGE_PHILOSOPHY.md`](./DRIVE_STORAGE_PHILOSOPHY.md) for more details

