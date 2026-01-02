# Development Guide

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Cursor IDE or Claude Desktop
- GitHub Personal Access Token (for GitHub MCP)
- (Optional) Cloudflare account (for remote access)

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/personal-block-in-a-box.git
   cd personal-block-in-a-box
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build packages:**
   ```bash
   npm run build
   ```

4. **Configure Cursor:**
   - Copy `config/cursor.json.example` to your Cursor config location
   - Update paths to match your system
   - Add your `GITHUB_TOKEN` to environment variables

See [`../setup/CURSOR_SETUP.md`](../setup/CURSOR_SETUP.md) for detailed setup instructions.

## Development Workflow

### Working on MCP Servers

1. **Navigate to package:**
   ```powershell
   cd packages\mcp-github
   ```

2. **Make changes:**
   - Edit TypeScript files in `src/`
   - Follow existing patterns
   - Ensure Cloudflare Workers compatibility

3. **Build:**
   ```powershell
   npm run build
   ```

4. **Test locally:**
   ```powershell
   npm start
   ```

5. **Test in Cursor:**
   - Restart Cursor after changes
   - Test tool calls
   - Verify responses

### Adding New Tools

1. **Create tool file** (if new category):
   ```typescript
   // src/tools/new-feature.ts
   import { Octokit } from '@octokit/rest';
   import { CallToolResult } from '../types';
   import { requiredParam, optionalParam } from '../utils/validation';
   import { handleGitHubError } from '../utils/errors';

   export async function newTool(
     octokit: Octokit,
     args: Record<string, any>
   ): Promise<CallToolResult> {
     try {
       const param = requiredParam<string>(args, 'param');
       // ... implementation
       return { content: [{ type: 'text', text: 'Result' }] };
     } catch (error: any) {
       return handleGitHubError(error);
     }
   }
   ```

2. **Register tool** in `src/index.ts`:
   - Add to `tools/list` handler
   - Add to `tools/call` handler

3. **Test:**
   - Build and restart Cursor
   - Test tool call
   - Verify error handling

### Code Style

- TypeScript for all MCP implementations
- ES modules (`"type": "module"` in package.json)
- Use `@modelcontextprotocol/sdk` for MCP protocol
- Use `@octokit/rest` for GitHub API
- Cloudflare Workers compatible (Web APIs only, no Node.js-specific code)
- Follow existing patterns in codebase

### Testing

- Test MCPs locally in Cursor first
- Verify configs are generated correctly
- Test Cloudflare Worker integration separately
- Check logs for path-related errors
- Test both stdio (local) and HTTP (Workers) transports

## Common Commands

### Install Dependencies
```powershell
# From project root
npm install
```

### Build
```powershell
# Build all packages
npm run build

# Build specific package
cd packages\mcp-github
npm run build
```

### Test Locally
```powershell
cd packages\mcp-github
npm start
```

### Deploy to Cloudflare
```powershell
cd packages\mcp-gateway
wrangler deploy
```

## Debugging

### Path Issues

If you see "module not found" or "cannot find module" errors:

1. Check current directory: `Get-Location`
2. Verify file exists: `Test-Path "packages\mcp-github\package.json"`
3. Reset to root: `cd <workspace-root>/personal-block-in-a-box`
4. Use absolute paths if needed (use `${workspaceFolder}` in Cursor configs)

### TypeScript Errors

- Ensure all imports use `.js` extension (ES modules)
- Check that types are correctly imported
- Verify `tsconfig.json` settings

### MCP Protocol Errors

- Check that tool schemas match MCP specification
- Verify request/response formats
- Check error handling

## Porting from Go

See [`PORTING.md`](./PORTING.md) for detailed porting guide.

## File Editing Rules

1. **Never commit secrets:**
   - `.env` - gitignored
   - `.env.local` - gitignored
   - Any files with API keys/tokens
   - `vendor/` directory - gitignored (separate repos)

2. **Always verify paths in configs:**
   - Use absolute paths for Windows compatibility in examples
   - Verify paths exist before committing
   - Use `${workspaceFolder}` in Cursor configs when possible

3. **Cloudflare Gateway:**
   - Never commit `token-data.json` or any files with tokens
   - Use `wrangler secret put` for secrets (never in code)
   - Always use `--remote` flag for production KV operations

4. **Document decisions:**
   - Update `docs/ARCHITECTURE.md` for architecture changes
   - Update `docs/development/PORTING.md` for porting notes
   - Update package READMEs for implementation details

## Monorepo Structure

- **Root `package.json`:** Workspace configuration
- **Package `package.json`:** Individual package dependencies
- **Workspace commands:** Run from root, affect all packages
- **Package commands:** Run from package directory

## Philosophy

- **Start simple** - Build what you need, add complexity later
- **Don't over-engineer** - Avoid building unused infrastructure
- **Incremental** - One MCP server at a time, prove it works
- **Extract later** - Build in monorepo, extract to separate repo if it gets popular
- **Cloudflare first** - Ensure everything works on Workers from the start

