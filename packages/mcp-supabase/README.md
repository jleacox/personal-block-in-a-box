# Supabase MCP Server

Supabase MCP server for database operations. Cloudflare Workers compatible.

## Features

- ✅ Query data from Supabase tables
- ✅ Insert rows into tables
- ✅ Update rows in tables
- ✅ Delete rows from tables
- ✅ List all tables in the public schema
- ✅ Cloudflare Workers compatible
- ✅ Dual transport: stdio (local) + HTTP (Workers)

## Tools

### `query`
Query data from a Supabase table with filtering, ordering, and pagination.

**Parameters:**
- `table` (required): Table name
- `select` (optional): Columns to select (default: "*")
- `filter` (optional): Filter conditions (e.g., `{ "id": { "eq": 1 }, "name": { "like": "%test%" } }`)
- `orderBy` (optional): Column to order by
- `orderAscending` (optional): Order ascending (default: true)
- `limit` (optional): Maximum number of rows to return
- `offset` (optional): Number of rows to skip

**Filter Operators:**
- `eq`: Equal
- `neq`: Not equal
- `gt`: Greater than
- `gte`: Greater than or equal
- `lt`: Less than
- `lte`: Less than or equal
- `like`: Pattern match (case-sensitive)
- `ilike`: Pattern match (case-insensitive)
- `in`: Value in array
- `is`: IS NULL / IS NOT NULL

### `insert`
Insert rows into a Supabase table.

**Parameters:**
- `table` (required): Table name
- `rows` (required): Array of row objects to insert

### `update`
Update rows in a Supabase table.

**Parameters:**
- `table` (required): Table name
- `values` (required): Values to update
- `filter` (required): Filter conditions to identify rows to update

### `delete`
Delete rows from a Supabase table.

**Parameters:**
- `table` (required): Table name
- `filter` (required): Filter conditions to identify rows to delete

### `list_tables`
List all tables in the public schema. Returns table names, schema, and type.

**Parameters:**
- None required

**Setup Required:**
This tool requires a custom RPC function to be installed in your Supabase database. To install:

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Open the file `sql/list_tables.sql` from this package
4. Copy and paste the SQL into the editor
5. Click **Run** to execute

The function will be created and ready to use. The tool will return a helpful error message if the function is not installed.

## Configuration

### Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase service role key (recommended for MCP servers)

**Key Types:**
- **Service Role Key** (recommended): Bypasses Row Level Security (RLS), full admin access - **Use this for MCP servers**
- **Anon Key**: Respects RLS policies - use only if you want RLS restrictions
- **Secret Key** (new): Same as service_role key but with additional security measures

**Note:** Supabase uses API keys (not OAuth), so no OAuth broker is needed. For MCP servers that need full database access, use the **service_role key**.

### Local Development (stdio)

Set environment variables:
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-anon-key-or-service-role-key"
```

Or in Cursor config:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-supabase/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_KEY": "your-anon-key-or-service-role-key"
      }
    }
  }
}
```

### Remote Access (Cloudflare Workers)

Set environment variables in `wrangler.toml` or via `wrangler secret put`:

```bash
cd packages/mcp-gateway
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_KEY
```

Or in `wrangler.toml.local`:
```toml
[vars]
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_KEY = "your-anon-key-or-service-role-key"
```

## Building

```bash
cd packages/mcp-supabase
npm install
npm run build
```

## Usage Examples

### Query with filters
```json
{
  "table": "users",
  "select": "id, name, email",
  "filter": {
    "status": { "eq": "active" },
    "created_at": { "gte": "2024-01-01" }
  },
  "orderBy": "created_at",
  "orderAscending": false,
  "limit": 10
}
```

### Insert rows
```json
{
  "table": "users",
  "rows": [
    { "name": "John Doe", "email": "john@example.com" },
    { "name": "Jane Smith", "email": "jane@example.com" }
  ]
}
```

### Update rows
```json
{
  "table": "users",
  "values": { "status": "inactive" },
  "filter": { "last_login": { "lt": "2024-01-01" } }
}
```

### Delete rows
```json
{
  "table": "users",
  "filter": { "id": { "eq": 123 } }
}
```

### List tables
```json
{}
```

Returns:
```json
[
  {
    "table_name": "users",
    "table_schema": "public",
    "table_type": "BASE TABLE"
  },
  {
    "table_name": "posts",
    "table_schema": "public",
    "table_type": "BASE TABLE"
  }
]
```

## Security Notes

- **Anon Key**: Use for client-side operations (respects Row Level Security policies)
- **Service Role Key**: Use for admin operations (bypasses RLS, use with caution)

For production, prefer using the anon key and configure Row Level Security (RLS) policies in Supabase.

