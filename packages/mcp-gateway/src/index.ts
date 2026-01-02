/**
 * MCP Gateway - Routes remote MCP requests to appropriate servers
 * 
 * Architecture: Unified Gateway + Segregated Server Code
 * - Single Cloudflare Worker (one deployment, one endpoint)
 * - Imports MCP handler code directly (no HTTP calls between workers)
 * - Better performance: Direct function calls, no network hops
 * - Clean code organization: Each MCP in its own package
 * 
 * Handles:
 * - MCP protocol over HTTP/SSE
 * - Routing to GitHub, Calendar, Gmail, etc. MCP servers
 * - Token fetching from OAuth broker
 * - Authentication
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Fetcher } from '@cloudflare/workers-types';
import { GitHubMCP, GoogleCalendarMCP, GmailMCP, DriveMCP, SupabaseMCP } from './mcp-handlers.js';

export interface Env {
  // OAuth broker URL (fallback if service binding not available)
  OAUTH_BROKER_URL?: string;
  
  // OAuth broker service binding (preferred - direct function call, no HTTP)
  OAUTH_BROKER?: Fetcher;
  
  // GitHub token (optional - falls back to OAuth broker)
  GITHUB_TOKEN?: string;
  
  // Google Calendar token (optional - falls back to OAuth broker)
  GOOGLE_ACCESS_TOKEN?: string;
  
  // User ID for OAuth broker
  USER_ID?: string;
  
  // Claude API key for Gmail date extraction
  ANTHROPIC_API_KEY?: string;
  
  // Supabase configuration
  SUPABASE_URL?: string;
  SUPABASE_KEY?: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', cors({
  origin: '*', // Adjust for production
  credentials: true,
}));

// Initialize MCP handlers (reused across requests)
// If bearerToken is provided (from ChatGPT OAuth), use it directly
// Otherwise, fall back to OAuth broker or env vars
function getMCPHandlers(env: Env, bearerToken?: string, server?: string) {
  // If Bearer token provided, use it directly (ChatGPT OAuth flow)
  // Determine which service the token is for based on server or token format
  let githubToken = env.GITHUB_TOKEN;
  let googleToken = env.GOOGLE_ACCESS_TOKEN; // Shared for Calendar, Gmail, Drive
  
  if (bearerToken) {
    // Use Bearer token directly - ChatGPT handles OAuth
    if (server === 'github' || !server) {
      githubToken = bearerToken;
    }
    if (server === 'calendar' || server === 'gmail' || server === 'drive' || !server) {
      googleToken = bearerToken;
    }
  }
  
  const githubMCP = new GitHubMCP(
    githubToken,
    bearerToken ? undefined : env.OAUTH_BROKER_URL,
    bearerToken ? undefined : env.USER_ID,
    bearerToken ? undefined : env // Pass env for Service Binding support
  );
  
  const calendarMCP = new GoogleCalendarMCP(
    googleToken,
    bearerToken ? undefined : env.OAUTH_BROKER_URL,
    bearerToken ? undefined : env.USER_ID
  );
  
  const gmailMCP = new GmailMCP(
    googleToken,
    bearerToken ? undefined : env.OAUTH_BROKER_URL,
    bearerToken ? undefined : env.USER_ID,
    env.ANTHROPIC_API_KEY
  );
  
  const driveMCP = new DriveMCP(
    googleToken,
    bearerToken ? undefined : env.OAUTH_BROKER_URL,
    bearerToken ? undefined : env.USER_ID
  );
  
  const supabaseMCP = new SupabaseMCP(
    env.SUPABASE_URL,
    env.SUPABASE_KEY
  );
  
  return { githubMCP, calendarMCP, gmailMCP, driveMCP, supabaseMCP };
}

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'healthy', service: 'mcp-gateway' });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    service: 'mcp-gateway',
    version: '0.1.0',
    endpoints: {
      mcp: '/mcp/sse',
      health: '/health',
      servers: '/mcp/servers',
    },
    note: 'Uses OAuth broker pattern - tokens managed via oauth-broker service',
  });
});

// List available MCP servers
app.get('/mcp/servers', async (c) => {
  return c.json({
    servers: [
      {
        id: 'github',
        name: 'GitHub',
        status: 'available',
        note: 'Uses OAuth broker for authentication',
      },
      {
        id: 'google-calendar',
        name: 'Google Calendar',
        status: 'available',
        note: 'Uses OAuth broker for authentication',
      },
      {
        id: 'gmail',
        name: 'Gmail',
        status: 'available',
        note: 'Uses OAuth broker for authentication',
      },
      {
        id: 'google-drive',
        name: 'Google Drive',
        status: 'available',
        note: 'Uses OAuth broker for authentication',
      },
      {
        id: 'supabase',
        name: 'Supabase',
        status: 'available',
        note: 'Uses direct API keys (configured via secrets)',
      },
    ],
  });
});

// OAuth endpoints removed - using OAuth broker pattern only
// All OAuth flows go through the oauth-broker service

// MCP SSE endpoint - GET handler (for MCP clients that check this)
app.get('/mcp/sse', async (c) => {
  // Standard MCP endpoint info (works with Claude)
  return c.json({
    serverInfo: {
      name: 'mcp-gateway',
      version: '0.1.0',
    },
    note: 'Uses OAuth broker pattern for authentication',
  });
});

// MCP endpoint at root (for MCP clients that prefer root path)
app.post('/', async (c) => {
  // Delegate to the same handler as /mcp/sse
  return handleMCPRequest(c);
});

// MCP SSE endpoint (main entry point) - UNCHANGED for Claude compatibility
app.post('/mcp/sse', async (c) => {
  return handleMCPRequest(c);
});

// DEPRECATED: OpenAPI schema endpoint for ChatGPT Actions
// ChatGPT doesn't support MCP natively - this was experimental
// Kept for potential future use but not actively maintained
// See docs/reference/MCP_PLATFORM_SUPPORT.md for details
app.get('/openapi.json', async (c) => {
  const gatewayUrl = new URL(c.req.url).origin;
  return c.json(await generateOpenAPISchema(c.env, gatewayUrl));
});

// DEPRECATED: ChatGPT Actions endpoint (converts ChatGPT function calls to MCP)
// ChatGPT doesn't support MCP natively - this was experimental
// Kept for potential future use but not actively maintained
// See docs/reference/MCP_PLATFORM_SUPPORT.md for details
app.post('/actions', async (c) => {
  return handleChatGPTAction(c);
});

// Shared MCP request handler
async function handleMCPRequest(c: any) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  console.log(`\n========== [${requestId}] NEW MCP REQUEST ==========`);
  console.log(`[${requestId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`[${requestId}] URL: ${c.req.url}`);
  console.log(`[${requestId}] Method: ${c.req.method}`);
  console.log(`[${requestId}] User-Agent: ${c.req.header('User-Agent') || 'unknown'}`);
  console.log(`[${requestId}] Headers:`, JSON.stringify(Object.fromEntries(c.req.raw.headers.entries()), null, 2));
  
  try {
    console.log(`[${requestId}] Parsing request body...`);
    const requestBody = await c.req.json();
    const { method, params } = requestBody;
    console.log(`[${requestId}] Request parsed - method: ${method}, hasParams: ${!!params}`);
    console.log(`[${requestId}] Full request body:`, JSON.stringify(requestBody, null, 2));
    console.log(`[${requestId}] 🔍 METHOD CHECK: ${method} - is tools/list: ${method === 'tools/list'}, is tools/call: ${method === 'tools/call'}`);
    
    // Check for Bearer token (from OAuth clients that handle OAuth themselves)
    // Note: Claude uses OAuth broker pattern, but some clients may pass Bearer tokens
    const authHeader = c.req.header('Authorization');
    let bearerToken: string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      bearerToken = authHeader.substring(7);
      console.log(`[${requestId}] ✅ Bearer token found (length: ${bearerToken.length})`);
    } else {
      console.log(`[${requestId}] ℹ️ No Bearer token - will use OAuth broker pattern`);
    }
    
    // OAuth method handling removed - using OAuth broker pattern only
    
    // Handle initialize request (standard MCP protocol)
    if (method === 'initialize') {
      console.log(`[${requestId}] 🔄 Handling initialize request`);
      console.log(`[${requestId}] Initialize params:`, JSON.stringify(params || {}, null, 2));
      console.log(`[${requestId}] Request ID: ${requestBody.id}`);
      // Use the protocol version the client sent, or default to latest
      const clientProtocolVersion = params?.protocolVersion || '2024-11-05';
      console.log(`[${requestId}] Client protocol version: ${clientProtocolVersion}`);
      
      // CRITICAL: Ensure ID matches request ID exactly
      // Use !== undefined check to preserve 0 and other falsy values
      // DO NOT use: requestBody.id || null (breaks when id is 0)
      // See README.md troubleshooting section for details
      const responseId = requestBody.id !== undefined ? requestBody.id : null;
      console.log(`[${requestId}] Request ID: ${requestBody.id}, Response ID: ${responseId}`);
      
      const response = {
        jsonrpc: '2.0',
        result: {
          protocolVersion: clientProtocolVersion, // Match client's version
          capabilities: {
            // CRITICAL: tools.listChanged must be true to prompt client to call tools/list
            tools: {
              listChanged: true,
            },
            resources: {
              listChanged: true,
            },
            // Note: Claude.ai uses OAuth broker pattern, not standard MCP OAuth capability
            // OAuth capability removed to avoid confusion
          },
          serverInfo: {
            name: 'mcp-gateway',
            version: '0.1.0',
          },
        },
        id: responseId,
      };
      console.log(`[${requestId}] ✅ Initialize response:`, JSON.stringify(response, null, 2));
      console.log(`[${requestId}] 🔍 Response details:`);
      console.log(`[${requestId}]   - protocolVersion: ${response.result.protocolVersion}`);
      console.log(`[${requestId}]   - tools.listChanged: ${response.result.capabilities.tools.listChanged}`);
      console.log(`[${requestId}]   - resources.listChanged: ${response.result.capabilities.resources.listChanged}`);
      console.log(`[${requestId}]   - response id: ${response.id}`);
      console.log(`[${requestId}] ⚠️ NOTE: After initialize, client should send notifications/initialized, then tools/list`);
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ⏱️ Initialize completed in ${duration}ms`);
      console.log(`[${requestId}] 📤 Sending response to client...`);
      console.log(`[${requestId}] ========== END REQUEST ==========\n`);
      const jsonResponse = c.json(response);
      console.log(`[${requestId}] ✅ Response sent successfully`);
      return jsonResponse;
    }
    
    // Handle notifications/initialized (standard MCP protocol - client confirms initialization)
    if (method === 'notifications/initialized') {
      console.log(`[${requestId}] ✅ Handling notifications/initialized (client confirmed init)`);
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ⏱️ Initialized notification handled in ${duration}ms`);
      console.log(`[${requestId}] ⚠️ NOTE: Client should now send tools/list request`);
      console.log(`[${requestId}] ========== END REQUEST ==========\n`);
      // This is a notification - return empty result
      const notificationId = requestBody.id !== undefined ? requestBody.id : null;
      return c.json({ jsonrpc: '2.0', result: {}, id: notificationId });
    }
    
    // Handle any OAuth-related method requests
    if (method && (method.includes('oauth') || method.includes('auth'))) {
      return c.json({
        jsonrpc: '2.0',
        result: {
          oauth: {
            authorization_url: 'https://github.com/login/oauth/authorize',
            token_url: 'https://github.com/login/oauth/access_token',
            scopes: ['repo', 'user'],
          },
        },
        id: requestBody.id !== undefined ? requestBody.id : null,
      });
    }
    
    // Handle resources/list (MCP protocol - return empty resources)
    if (method === 'resources/list') {
      console.log(`[${requestId}] 📦 Handling resources/list request`);
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ⏱️ Resources list completed in ${duration}ms`);
      console.log(`[${requestId}] ========== END REQUEST ==========\n`);
      return c.json({
        jsonrpc: '2.0',
        result: { resources: [] },
        id: requestBody.id !== undefined ? requestBody.id : null,
      });
    }
    
    // Determine which MCP server to route to
    console.log(`[${requestId}] 🔍 Determining server for method: ${method}`);
    const server = determineServer(requestBody);
    console.log(`[${requestId}] ✅ Determined server: ${server}`);
    
    if (!server && method !== 'tools/list' && method !== 'tools/call') {
      console.error(`[${requestId}] ❌ Server not found for method: ${method}`);
      console.error(`[${requestId}] ⚠️ NOTE: This might be a notification or unsupported method`);
      // Don't return error for notifications - they don't need a response
      if (method.startsWith('notifications/')) {
        console.log(`[${requestId}] ℹ️ This is a notification, returning null response`);
        const notificationResponseId = requestBody.id !== undefined ? requestBody.id : null;
        return c.json({ jsonrpc: '2.0', result: null, id: notificationResponseId });
      }
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ⏱️ Request failed in ${duration}ms`);
      console.log(`[${requestId}] ========== END REQUEST ==========\n`);
      return c.json({
        jsonrpc: '2.0',
        error: { code: -32601, message: `Server not found for method: ${method}` },
        id: requestBody.id !== undefined ? requestBody.id : null,
      }, 404);
    }
    
    // Route to appropriate MCP handler (direct function calls, no HTTP)
    // If Bearer token is provided (from ChatGPT OAuth), use it directly
    // Otherwise, fall back to OAuth broker pattern
    console.log(`[${requestId}] 🔧 Getting MCP handlers...`);
    console.log(`[${requestId}] Environment check:`);
    console.log(`[${requestId}]   - OAUTH_BROKER_URL: ${c.env.OAUTH_BROKER_URL ? '✅ configured' : '❌ not configured'}`);
    console.log(`[${requestId}]   - OAUTH_BROKER (Service Binding): ${c.env.OAUTH_BROKER ? '✅ configured' : '❌ not configured'}`);
    console.log(`[${requestId}]   - USER_ID: ${c.env.USER_ID || '❌ not set'}`);
    console.log(`[${requestId}]   - GITHUB_TOKEN: ${c.env.GITHUB_TOKEN ? '✅ set' : '❌ not set'}`);
    console.log(`[${requestId}]   - GOOGLE_ACCESS_TOKEN: ${c.env.GOOGLE_ACCESS_TOKEN ? '✅ set' : '❌ not set'}`);
    console.log(`[${requestId}]   - SUPABASE_URL: ${c.env.SUPABASE_URL ? '✅ set' : '❌ not set'}`);
    console.log(`[${requestId}]   - SUPABASE_KEY: ${c.env.SUPABASE_KEY ? '✅ set' : '❌ not set'}`);
    
    const { githubMCP, calendarMCP, gmailMCP, driveMCP, supabaseMCP } = getMCPHandlers(
      c.env,
      bearerToken,
      server // Pass server to determine which token to use
    );
    console.log(`[${requestId}] ✅ MCP handlers created`);
    console.log(`[${requestId}] Supabase handler config:`, {
      hasSupabaseUrl: !!c.env.SUPABASE_URL,
      hasSupabaseKey: !!c.env.SUPABASE_KEY,
      supabaseUrl: c.env.SUPABASE_URL ? `${c.env.SUPABASE_URL.substring(0, 30)}...` : 'not set',
    });
    
    let result: any;
    
    if (method === 'tools/list') {
      console.log(`[${requestId}] 📋📋📋 TOOLS/LIST REQUEST RECEIVED 📋📋📋`);
      console.log(`[${requestId}] This is where tools/list should be handled!`);
      const listStartTime = Date.now();
      result = await handleListTools(githubMCP, calendarMCP, gmailMCP, driveMCP, supabaseMCP);
      const listDuration = Date.now() - listStartTime;
      console.log(`[${requestId}] ✅ Tools listed: ${result.tools?.length || 0} tools in ${listDuration}ms`);
      console.log(`[${requestId}] Tool names:`, result.tools?.map((t: any) => t.name).join(', ') || 'none');
      console.log(`[${requestId}] Supabase tools in list:`, result.tools?.filter((t: any) => t.name === 'list_tables' || t.name === 'query' || t.name === 'insert' || t.name === 'update' || t.name === 'delete').map((t: any) => t.name) || 'none');
    } else if (method === 'tools/call') {
      console.log(`[${requestId}] 🛠️🛠️🛠️ TOOLS/CALL REQUEST RECEIVED 🛠️🛠️🛠️`);
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      console.log(`[${requestId}] 🛠️ Calling tool: ${toolName}`);
      console.log(`[${requestId}] Tool arguments:`, JSON.stringify(toolArgs, null, 2));
      console.log(`[${requestId}] Server: ${server}`);
      
      const callStartTime = Date.now();
      result = await handleCallTool(server, params, githubMCP, calendarMCP, gmailMCP, driveMCP, supabaseMCP);
      const callDuration = Date.now() - callStartTime;
      
      if (result.isError) {
        console.error(`[${requestId}] ❌ Tool call returned error after ${callDuration}ms`);
        console.error(`[${requestId}] Error content:`, JSON.stringify(result.content, null, 2));
      } else {
        console.log(`[${requestId}] ✅ Tool call succeeded in ${callDuration}ms`);
        const resultPreview = result.content?.[0]?.text?.substring(0, 200) || 'no content';
        console.log(`[${requestId}] Result preview: ${resultPreview}...`);
      }
    } else {
      console.error(`[${requestId}] ❌ Unknown method: ${method}`);
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ⏱️ Request failed in ${duration}ms`);
      console.log(`[${requestId}] ========== END REQUEST ==========\n`);
      return c.json({
        jsonrpc: '2.0',
        error: { code: -32601, message: `Method not found: ${method}` },
        id: requestBody.id !== undefined ? requestBody.id : null,
      }, 404);
    }
    
    const totalDuration = Date.now() - startTime;
    console.log(`[${requestId}] ⏱️ Total request duration: ${totalDuration}ms`);
    console.log(`[${requestId}] 📤 Sending response...`);
    console.log(`[${requestId}] ========== END REQUEST ==========\n`);
    
    const finalResponseId = requestBody.id !== undefined ? requestBody.id : null;
    return c.json({
      jsonrpc: '2.0',
      result,
      id: finalResponseId,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] ❌❌❌ EXCEPTION after ${duration}ms:`);
    console.error(`[${requestId}] Error message: ${error.message}`);
    console.error(`[${requestId}] Error stack:`, error.stack);
    console.error(`[${requestId}] Error name: ${error.name}`);
    console.log(`[${requestId}] ========== END REQUEST (ERROR) ==========\n`);
    return c.json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error.message || 'Internal server error',
      },
      id: null,
    }, 500);
  }
}

// Helper functions
function determineServer(request: any): string | null {
  if (request.method === 'tools/list') {
    // Return all servers for tool listing
    return 'all';
  }
  
  if (request.method === 'tools/call') {
    const toolName = request.params?.name || '';
    
    // Route based on tool name patterns
    const githubTools = ['create_issue', 'list_issues', 'get_issue', 'update_issue', 'add_issue_comment',
      'list_repos', 'get_repo', 'create_pr', 'list_pull_requests', 'get_pull_request', 'merge_pull_request',
      'actions_list', 'actions_get', 'actions_run_trigger', 'get_job_logs'];
    
    const calendarTools = ['list_calendars', 'list_events', 'get_event', 'create_event', 'update_event',
      'delete_event', 'search_events', 'respond_to_event', 'get_freebusy', 'get_current_time',
      'list_colors', 'manage_accounts'];
    
    const gmailTools = ['search_emails', 'read_email', 'send_email', 'draft_email', 'modify_email',
      'list_labels', 'create_label', 'update_label', 'delete_label', 'get_or_create_label',
      'list_filters', 'create_filter', 'get_filter', 'delete_filter', 'create_filter_from_template',
      'extract_dates_from_email'];
    
    const driveTools = ['read_file', 'write_file', 'list_files', 'search', 'createFolder', 'moveItem', 'renameItem'];
    
    const supabaseTools = ['query', 'insert', 'update', 'delete', 'list_tables', 'execute_sql'];
    
    if (githubTools.includes(toolName)) {
      return 'github';
    }
    if (calendarTools.includes(toolName)) {
      return 'calendar';
    }
    if (gmailTools.includes(toolName)) {
      return 'gmail';
    }
    if (driveTools.includes(toolName)) {
      return 'drive';
    }
    if (supabaseTools.includes(toolName)) {
      return 'supabase';
    }
    
    // Fallback pattern matching
    if (toolName.includes('issue') || toolName.includes('pr') || toolName.includes('repo') || toolName.includes('action')) {
      return 'github';
    }
    if (toolName.includes('calendar') || toolName.includes('event') || toolName.includes('freebusy')) {
      return 'calendar';
    }
    if (toolName.includes('email') || toolName.includes('gmail') || toolName.includes('label') || toolName.includes('filter')) {
      return 'gmail';
    }
    if (toolName.includes('drive') || toolName.includes('file') || toolName.includes('folder')) {
      return 'drive';
    }
    if (toolName.includes('supabase') || toolName.includes('database') || toolName.includes('table') || toolName.includes('sql')) {
      return 'supabase';
    }
  }
  
  return null;
}

async function handleListTools(
  githubMCP: GitHubMCP,
  calendarMCP: GoogleCalendarMCP,
  gmailMCP: GmailMCP,
  driveMCP: DriveMCP,
  supabaseMCP: SupabaseMCP
): Promise<any> {
  const requestId = crypto.randomUUID();
  console.log(`\n[LIST-TOOLS-${requestId}] ========== LISTING TOOLS ==========`);
  const tools: any[] = [];
  
  try {
    console.log(`[LIST-TOOLS-${requestId}] 📋 Fetching GitHub tools...`);
    const githubStart = Date.now();
    const githubTools = await githubMCP.listTools();
    const githubDuration = Date.now() - githubStart;
    tools.push(...githubTools);
    console.log(`[LIST-TOOLS-${requestId}] ✅ GitHub: ${githubTools.length} tools in ${githubDuration}ms`);
  } catch (error: any) {
    console.error(`[LIST-TOOLS-${requestId}] ❌ Failed to list GitHub tools:`, error.message, error.stack);
  }
  
  try {
    console.log(`[LIST-TOOLS-${requestId}] 📋 Fetching Calendar tools...`);
    const calendarStart = Date.now();
    const calendarTools = await calendarMCP.listTools();
    const calendarDuration = Date.now() - calendarStart;
    tools.push(...calendarTools);
    console.log(`[LIST-TOOLS-${requestId}] ✅ Calendar: ${calendarTools.length} tools in ${calendarDuration}ms`);
  } catch (error: any) {
    console.error(`[LIST-TOOLS-${requestId}] ❌ Failed to list Calendar tools:`, error.message, error.stack);
  }
  
  try {
    console.log(`[LIST-TOOLS-${requestId}] 📋 Fetching Gmail tools...`);
    const gmailStart = Date.now();
    const gmailTools = await gmailMCP.listTools();
    const gmailDuration = Date.now() - gmailStart;
    tools.push(...gmailTools);
    console.log(`[LIST-TOOLS-${requestId}] ✅ Gmail: ${gmailTools.length} tools in ${gmailDuration}ms`);
    console.log(`[LIST-TOOLS-${requestId}] Gmail tool names:`, gmailTools.map((t: any) => t.name).join(', '));
  } catch (error: any) {
    console.error(`[LIST-TOOLS-${requestId}] ❌ Failed to list Gmail tools:`, error.message, error.stack);
  }
  
  try {
    console.log(`[LIST-TOOLS-${requestId}] 📋 Fetching Drive tools...`);
    const driveStart = Date.now();
    const driveTools = await driveMCP.listTools();
    const driveDuration = Date.now() - driveStart;
    tools.push(...driveTools);
    console.log(`[LIST-TOOLS-${requestId}] ✅ Drive: ${driveTools.length} tools in ${driveDuration}ms`);
  } catch (error: any) {
    console.error(`[LIST-TOOLS-${requestId}] ❌ Failed to list Drive tools:`, error.message, error.stack);
  }
  
  try {
    console.log(`[LIST-TOOLS-${requestId}] 📋 Fetching Supabase tools...`);
    const supabaseStart = Date.now();
    const supabaseTools = await supabaseMCP.listTools();
    const supabaseDuration = Date.now() - supabaseStart;
    tools.push(...supabaseTools);
    console.log(`[LIST-TOOLS-${requestId}] ✅ Supabase: ${supabaseTools.length} tools in ${supabaseDuration}ms`);
  } catch (error: any) {
    console.error(`[LIST-TOOLS-${requestId}] ❌ Failed to list Supabase tools:`, error.message, error.stack);
  }
  
  console.log(`[LIST-TOOLS-${requestId}] ✅ Total tools: ${tools.length}`);
  console.log(`[LIST-TOOLS-${requestId}] ========== END LIST TOOLS ==========\n`);
  return { tools };
}

async function handleCallTool(
  server: string,
  params: any,
  githubMCP: GitHubMCP,
  calendarMCP: GoogleCalendarMCP,
  gmailMCP: GmailMCP,
  driveMCP: DriveMCP,
  supabaseMCP: SupabaseMCP
): Promise<any> {
  const callId = crypto.randomUUID();
  const toolName = params?.name;
  const args = params?.arguments || {};
  
  console.log(`\n[CALL-TOOL-${callId}] ========== CALLING TOOL ==========`);
  console.log(`[CALL-TOOL-${callId}] Tool: ${toolName}`);
  console.log(`[CALL-TOOL-${callId}] Server: ${server}`);
  console.log(`[CALL-TOOL-${callId}] Arguments:`, JSON.stringify(args, null, 2));
  
  if (!toolName) {
    console.error(`[CALL-TOOL-${callId}] ❌ Tool name is required`);
    return {
      content: [{ type: 'text', text: 'Tool name is required' }],
      isError: true,
    };
  }
  
  const callStartTime = Date.now();
  try {
    let result: any;
    
    if (server === 'github') {
      console.log(`[CALL-TOOL-${callId}] 🔧 Calling GitHub tool: ${toolName}`);
      result = await githubMCP.callTool(toolName, args);
    } else if (server === 'calendar') {
      console.log(`[CALL-TOOL-${callId}] 🔧 Calling Calendar tool: ${toolName}`);
      result = await calendarMCP.callTool(toolName, args);
    } else if (server === 'gmail') {
      console.log(`[CALL-TOOL-${callId}] 🔧 Calling Gmail tool: ${toolName}`);
      if (toolName === 'send_email') {
        console.log(`[CALL-TOOL-${callId}] 📧 EMAIL SEND REQUEST:`);
        console.log(`[CALL-TOOL-${callId}]   To: ${JSON.stringify(args.to)}`);
        console.log(`[CALL-TOOL-${callId}]   Subject: ${args.subject}`);
        console.log(`[CALL-TOOL-${callId}]   Body length: ${args.body?.length || 0} chars`);
        console.log(`[CALL-TOOL-${callId}]   HTML body: ${args.htmlBody ? 'yes' : 'no'}`);
        console.log(`[CALL-TOOL-${callId}]   CC: ${args.cc ? JSON.stringify(args.cc) : 'none'}`);
        console.log(`[CALL-TOOL-${callId}]   BCC: ${args.bcc ? JSON.stringify(args.bcc) : 'none'}`);
      }
      result = await gmailMCP.callTool(toolName, args);
      if (toolName === 'send_email') {
        const duration = Date.now() - callStartTime;
        if (result.isError) {
          console.error(`[CALL-TOOL-${callId}] ❌ Email send failed after ${duration}ms`);
          console.error(`[CALL-TOOL-${callId}] Error:`, JSON.stringify(result.content, null, 2));
        } else {
          console.log(`[CALL-TOOL-${callId}] ✅ Email send succeeded in ${duration}ms`);
          console.log(`[CALL-TOOL-${callId}] Result:`, JSON.stringify(result.content, null, 2));
        }
      }
    } else if (server === 'drive') {
      console.log(`[CALL-TOOL-${callId}] 🔧 Calling Drive tool: ${toolName}`);
      result = await driveMCP.callTool(toolName, args);
    } else if (server === 'supabase') {
      console.log(`[CALL-TOOL-${callId}] 🔧 Calling Supabase tool: ${toolName}`);
      const supabaseStart = Date.now();
      result = await supabaseMCP.callTool(toolName, args);
      const supabaseDuration = Date.now() - supabaseStart;
      console.log(`[CALL-TOOL-${callId}] ⏱️ Supabase tool call took ${supabaseDuration}ms`);
      if (result.isError) {
        console.error(`[CALL-TOOL-${callId}] ❌ Supabase tool returned error`);
        console.error(`[CALL-TOOL-${callId}] Error content:`, JSON.stringify(result.content, null, 2));
      } else {
        const resultPreview = result.content?.[0]?.text?.substring(0, 200) || 'no content';
        console.log(`[CALL-TOOL-${callId}] ✅ Supabase tool succeeded, result preview: ${resultPreview}...`);
      }
    } else {
      console.error(`[CALL-TOOL-${callId}] ❌ Unknown server: ${server}`);
      return {
        content: [{ type: 'text', text: `Unknown MCP server: ${server}` }],
        isError: true,
      };
    }
    
    const duration = Date.now() - callStartTime;
    console.log(`[CALL-TOOL-${callId}] ⏱️ Tool call completed in ${duration}ms`);
    console.log(`[CALL-TOOL-${callId}] Result isError: ${result.isError}`);
    console.log(`[CALL-TOOL-${callId}] ========== END CALL TOOL ==========\n`);
    return result;
  } catch (error: any) {
    const duration = Date.now() - callStartTime;
    console.error(`[CALL-TOOL-${callId}] ❌❌❌ EXCEPTION after ${duration}ms:`);
    console.error(`[CALL-TOOL-${callId}] Error: ${error.message}`);
    console.error(`[CALL-TOOL-${callId}] Stack:`, error.stack);
    console.log(`[CALL-TOOL-${callId}] ========== END CALL TOOL (ERROR) ==========\n`);
    return {
      content: [{ type: 'text', text: `Tool execution error: ${error.message || 'Unknown error'}` }],
      isError: true,
    };
  }
}

// DEPRECATED: ChatGPT Actions handler (converts ChatGPT function calls to MCP)
// ChatGPT doesn't support MCP natively - this was experimental
// Kept for potential future use but not actively maintained
async function handleChatGPTAction(c: any) {
  try {
    const requestBody = await c.req.json();
    
    // Check for Bearer token from ChatGPT OAuth
    const authHeader = c.req.header('Authorization');
    let bearerToken: string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      bearerToken = authHeader.substring(7);
    }
    
    // ChatGPT Actions format: { name: "function_name", arguments: {...} }
    const { name, arguments: args } = requestBody;
    
    if (!name) {
      return c.json({ error: 'Missing function name' }, 400);
    }
    
    // Get MCP handlers (same as MCP endpoint)
    const server = determineServer({ method: 'tools/call', params: { name, arguments: args } });
    if (!server) {
      return c.json({ error: `Unknown tool: ${name}` }, 404);
    }
    
    const { githubMCP, calendarMCP } = getMCPHandlers(c.env, bearerToken, server);
    
    // Call the tool using MCP handler
    let result: any;
    if (server === 'github') {
      result = await githubMCP.callTool(name, args || {});
    } else if (server === 'calendar') {
      result = await calendarMCP.callTool(name, args || {});
    } else {
      return c.json({ error: `Unknown server: ${server}` }, 404);
    }
    
    // Convert MCP result to ChatGPT Actions format
    // ChatGPT expects: { result: "..." } or { error: "..." }
    if (result.isError) {
      return c.json({ 
        error: result.content?.[0]?.text || 'Unknown error',
        details: result 
      }, 500);
    }
    
    // Extract text content from MCP result
    const textContent = result.content?.find((c: any) => c.type === 'text')?.text || 
                       JSON.stringify(result);
    
    return c.json({ result: textContent });
  } catch (error: any) {
    return c.json({ 
      error: error.message || 'Internal server error',
      details: error.stack 
    }, 500);
  }
}

// DEPRECATED: Generate OpenAPI schema from MCP tools
// ChatGPT doesn't support MCP natively - this was experimental
// Kept for potential future use but not actively maintained
async function generateOpenAPISchema(env: Env, gatewayUrl?: string): Promise<any> {
  // Get MCP handlers to list tools
  const { githubMCP, calendarMCP } = getMCPHandlers(env);
  
  const githubTools = await githubMCP.listTools();
  const calendarTools = await calendarMCP.listTools();
  const allTools = [...githubTools, ...calendarTools];
  
  // Convert MCP tools to OpenAPI schema
  const paths: Record<string, any> = {};
  
  for (const tool of allTools) {
    const path = `/actions/${tool.name}`;
    
    // Convert MCP input schema to OpenAPI schema
    const properties: Record<string, any> = {};
    const required: string[] = [];
    
    if (tool.inputSchema.properties) {
      for (const [key, value] of Object.entries(tool.inputSchema.properties)) {
        properties[key] = convertMCPTypeToOpenAPI(value as any);
        if (tool.inputSchema.required?.includes(key)) {
          required.push(key);
        }
      }
    }
    
    paths[path] = {
      post: {
        summary: tool.description || tool.name,
        operationId: tool.name,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties,
                required: required.length > 0 ? required : undefined,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    result: { type: 'string' },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        security: [{ OAuth2: [] }],
      },
    };
  }
  
  return {
    openapi: '3.1.0',
    info: {
      title: 'MCP Gateway Actions',
      description: 'ChatGPT Actions interface for MCP Gateway',
      version: '0.1.0',
    },
    servers: [
      {
        url: gatewayUrl || 'https://mcp-gateway.YOUR_SUBDOMAIN.workers.dev',
      },
    ],
    paths,
    components: {
      securitySchemes: {
        OAuth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://github.com/login/oauth/authorize',
              tokenUrl: 'https://github.com/login/oauth/access_token',
              scopes: {
                repo: 'GitHub repository access',
                user: 'GitHub user access',
              },
            },
          },
        },
      },
    },
  };
}

// Helper to convert MCP types to OpenAPI types
function convertMCPTypeToOpenAPI(mcpType: any): any {
  if (typeof mcpType === 'string') {
    return { type: mcpType };
  }
  if (typeof mcpType === 'object' && mcpType !== null) {
    if (mcpType.type === 'array' && mcpType.items) {
      return {
        type: 'array',
        items: convertMCPTypeToOpenAPI(mcpType.items),
      };
    }
    return mcpType;
  }
  return { type: 'string' }; // Default fallback
}

export default app;

