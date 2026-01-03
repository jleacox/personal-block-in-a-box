# Unified Tool Registry System Design

## Goal

Create a unified tool registry system that works for **all MCP packages** (GitHub, Calendar, Gmail, Drive, Supabase), not just GitHub.

## Current State

- **GitHub**: Has registry system (`src/tools/registry.ts`) with generated constants
- **Calendar, Gmail, Drive, Supabase**: Tools defined directly in `index.ts` files, hardcoded arrays in gateway

## Architecture

### 1. Package-Level Registries (Optional)

Each package can optionally have a `src/tools/registry.ts` file:

```typescript
// packages/mcp-calendar/src/tools/registry.ts
export const TOOL_HANDLERS: Record<string, ToolHandler> = {
  calendar_list_calendars: eventsTools.listCalendars,
  calendar_list_events: eventsTools.listEvents,
  // ... all tools (all prefixed with calendar_)
};

export function getAllToolNames(): string[] {
  return Object.keys(TOOL_HANDLERS);
}
```

**Benefits:**
- Single source of truth for tool names
- Enables validation
- Enables auto-generation of constants

### 2. Root-Level Scripts

Move registry scripts to `scripts/` folder (package-agnostic):

- `scripts/generate-registry-constants.ts` - Discovers all packages with registries, generates constants
- `scripts/validate-tools.ts` - Validates all packages with registries

**Discovery Pattern:**
```typescript
// Find all packages with registry.ts
const packages = [
  'mcp-github',
  'mcp-calendar',  // if registry.ts exists
  'mcp-gmail',     // if registry.ts exists
  'mcp-drive',     // if registry.ts exists
  'mcp-supabase',  // if registry.ts exists
];
```

### 3. Generated Constants Per Package

Each package with a registry gets its own constants file:

- `packages/mcp-github/src/tools/registry-constants.ts` (already exists)
- `packages/mcp-calendar/src/tools/registry-constants.ts` (new)
- `packages/mcp-gmail/src/tools/registry-constants.ts` (new)
- `packages/mcp-drive/src/tools/registry-constants.ts` (new)
- `packages/mcp-supabase/src/tools/registry-constants.ts` (new)

**Format:**
```typescript
export const CALENDAR_TOOL_NAMES = ['calendar_list_calendars', 'calendar_list_events', ...] as const;
export type CalendarToolName = typeof CALENDAR_TOOL_NAMES[number];
export function isCalendarToolName(name: string): name is CalendarToolName { ... }
```

### 4. Gateway Auto-Import

Gateway imports constants from all packages:

```typescript
import { GITHUB_TOOL_NAMES } from '../../mcp-github/src/tools/registry-constants.js';
import { CALENDAR_TOOL_NAMES } from '../../mcp-calendar/src/tools/registry-constants.js';
import { GMAIL_TOOL_NAMES } from '../../mcp-gmail/src/tools/registry-constants.js';
import { DRIVE_TOOL_NAMES } from '../../mcp-drive/src/tools/registry-constants.js';
import { SUPABASE_TOOL_NAMES } from '../../mcp-supabase/src/tools/registry-constants.js';

// Routing
if (GITHUB_TOOL_NAMES.includes(toolName)) return 'github';
if (CALENDAR_TOOL_NAMES.includes(toolName)) return 'calendar';
// ... etc
```

**Fallback:** If a package doesn't have a registry yet, keep hardcoded array temporarily.

## Implementation Plan

1. **Move scripts to root** - Make them package-agnostic
2. **Create registries for other packages** - Extract tool names from index.ts
3. **Update generation script** - Discover and process all packages
4. **Update validation script** - Validate all packages
5. **Update gateway** - Import all constants
6. **Update documentation** - Reflect unified system

## Migration Strategy

- **Phase 1**: Move scripts, update GitHub (already has registry)
- **Phase 2**: Create registries for Calendar, Gmail, Drive, Supabase
- **Phase 3**: Generate constants for all packages
- **Phase 4**: Update gateway to use all constants
- **Phase 5**: Remove hardcoded arrays from gateway

## Benefits

1. **Consistency**: All packages use same registry pattern
2. **Automatic Routing**: Gateway uses generated constants (no hardcoding)
3. **Validation**: Catch missing registrations across all packages
4. **Maintainability**: Single source of truth per package
5. **Extensibility**: Easy to add new packages

