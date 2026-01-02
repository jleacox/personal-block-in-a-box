/**
 * Supabase Database tools
 * Cloudflare Workers compatible - uses @supabase/supabase-js
 * 
 * Tools for database operations:
 * - query: Execute SELECT queries
 * - insert: Insert rows into tables
 * - update: Update rows in tables
 * - delete: Delete rows from tables
 * - list_tables: List all tables in the public schema (requires RPC function)
 * - execute_sql: Execute raw SQL (if service role key is used)
 */

import { getSupabaseClient, SupabaseConfig } from '../utils/supabase-client.js';
import { requiredParam, optionalParam } from '../utils/validation.js';
import { handleSupabaseError } from '../utils/errors.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Query data from a table
 * Supports filtering, ordering, pagination
 */
export async function query(
  config: SupabaseConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const table = requiredParam<string>(args, 'table');
    const select = optionalParam<string>(args, 'select', '*');
    const filter = optionalParam<Record<string, any>>(args, 'filter');
    const orderBy = optionalParam<string>(args, 'orderBy');
    const orderAscending = optionalParam<boolean>(args, 'orderAscending', true);
    const limit = optionalParam<number>(args, 'limit');
    const offset = optionalParam<number>(args, 'offset');

    const supabase = getSupabaseClient(config);
    let query = supabase.from(table).select(select);

    // Apply filters
    if (filter) {
      for (const [column, value] of Object.entries(filter)) {
        if (typeof value === 'object' && value !== null) {
          // Support operators: { eq, neq, gt, gte, lt, lte, like, ilike, in, is }
          if ('eq' in value) query = query.eq(column, value.eq);
          else if ('neq' in value) query = query.neq(column, value.neq);
          else if ('gt' in value) query = query.gt(column, value.gt);
          else if ('gte' in value) query = query.gte(column, value.gte);
          else if ('lt' in value) query = query.lt(column, value.lt);
          else if ('lte' in value) query = query.lte(column, value.lte);
          else if ('like' in value) query = query.like(column, value.like);
          else if ('ilike' in value) query = query.ilike(column, value.ilike);
          else if ('in' in value) query = query.in(column, value.in);
          else if ('is' in value) query = query.is(column, value.is);
          else query = query.eq(column, value); // Default to equality
        } else {
          query = query.eq(column, value);
        }
      }
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy, { ascending: orderAscending });
    }

    // Apply pagination
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.range(offset, offset + (limit || 1000) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      }],
    };
  } catch (error: any) {
    return handleSupabaseError(error);
  }
}

/**
 * Insert rows into a table
 */
export async function insert(
  config: SupabaseConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const table = requiredParam<string>(args, 'table');
    const rows = requiredParam<any[]>(args, 'rows');

    const supabase = getSupabaseClient(config);
    const { data, error } = await supabase.from(table).insert(rows).select();

    if (error) {
      return handleSupabaseError(error);
    }

    return {
      content: [{
        type: 'text' as const,
        text: `Inserted ${Array.isArray(data) ? data.length : 1} row(s) into ${table}:\n${JSON.stringify(data, null, 2)}`,
      }],
    };
  } catch (error: any) {
    return handleSupabaseError(error);
  }
}

/**
 * Update rows in a table
 */
export async function update(
  config: SupabaseConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const table = requiredParam<string>(args, 'table');
    const values = requiredParam<Record<string, any>>(args, 'values');
    const filter = requiredParam<Record<string, any>>(args, 'filter');

    const supabase = getSupabaseClient(config);
    let query = supabase.from(table).update(values);

    // Apply filters
    for (const [column, value] of Object.entries(filter)) {
      if (typeof value === 'object' && value !== null) {
        if ('eq' in value) query = query.eq(column, value.eq);
        else if ('neq' in value) query = query.neq(column, value.neq);
        else if ('in' in value) query = query.in(column, value.in);
        else query = query.eq(column, value);
      } else {
        query = query.eq(column, value);
      }
    }

    const { data, error } = await query.select();

    if (error) {
      return handleSupabaseError(error);
    }

    return {
      content: [{
        type: 'text' as const,
        text: `Updated ${Array.isArray(data) ? data.length : 0} row(s) in ${table}:\n${JSON.stringify(data, null, 2)}`,
      }],
    };
  } catch (error: any) {
    return handleSupabaseError(error);
  }
}

/**
 * Delete rows from a table
 */
export async function deleteRows(
  config: SupabaseConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const table = requiredParam<string>(args, 'table');
    const filter = requiredParam<Record<string, any>>(args, 'filter');

    const supabase = getSupabaseClient(config);
    let query = supabase.from(table).delete();

    // Apply filters
    for (const [column, value] of Object.entries(filter)) {
      if (typeof value === 'object' && value !== null) {
        if ('eq' in value) query = query.eq(column, value.eq);
        else if ('neq' in value) query = query.neq(column, value.neq);
        else if ('in' in value) query = query.in(column, value.in);
        else query = query.eq(column, value);
      } else {
        query = query.eq(column, value);
      }
    }

    const { data, error } = await query.select();

    if (error) {
      return handleSupabaseError(error);
    }

    return {
      content: [{
        type: 'text' as const,
        text: `Deleted ${Array.isArray(data) ? data.length : 0} row(s) from ${table}:\n${JSON.stringify(data, null, 2)}`,
      }],
    };
  } catch (error: any) {
    return handleSupabaseError(error);
  }
}

/**
 * List all tables in the public schema
 * Requires the list_tables() RPC function to be installed in Supabase
 * 
 * To install the RPC function, run the SQL in sql/list_tables.sql
 * in your Supabase SQL Editor.
 */
export async function listTables(
  config: SupabaseConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  const listTablesId = crypto.randomUUID();
  console.log(`\n[LIST-TABLES-${listTablesId}] ========== LIST TABLES CALL ==========`);
  console.log(`[LIST-TABLES-${listTablesId}] Config:`, {
    hasSupabaseUrl: !!config.supabaseUrl,
    hasSupabaseKey: !!config.supabaseKey,
    supabaseUrl: config.supabaseUrl || 'MISSING',
  });
  console.log(`[LIST-TABLES-${listTablesId}] Args:`, JSON.stringify(args, null, 2));
  
  const startTime = Date.now();
  try {
    console.log(`[LIST-TABLES-${listTablesId}] 🔧 Getting Supabase client...`);
    const supabase = getSupabaseClient(config);
    console.log(`[LIST-TABLES-${listTablesId}] ✅ Supabase client created`);
    
    console.log(`[LIST-TABLES-${listTablesId}] 📞 Calling RPC function: list_tables`);
    const rpcStart = Date.now();
    const { data, error } = await supabase.rpc('list_tables');
    const rpcDuration = Date.now() - rpcStart;
    console.log(`[LIST-TABLES-${listTablesId}] ⏱️ RPC call completed in ${rpcDuration}ms`);

    if (error) {
      console.error(`[LIST-TABLES-${listTablesId}] ❌ RPC error:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      
      // Provide helpful error message if function doesn't exist
      if (error.code === '42883' || (error.message?.includes('function') && error.message?.includes('does not exist'))) {
        const errorResult = {
          content: [{
            type: 'text' as const,
            text: `Error: The list_tables() RPC function is not installed. Please run the SQL in sql/list_tables.sql in your Supabase SQL Editor to install it.\n\nOriginal error: ${error.message}`,
          }],
          isError: true,
        };
        console.log(`[LIST-TABLES-${listTablesId}] 📋 Returning function not found error`);
        return errorResult;
      }
      const handledError = handleSupabaseError(error);
      console.log(`[LIST-TABLES-${listTablesId}] 📋 Returning handled error`);
      return handledError;
    }

    console.log(`[LIST-TABLES-${listTablesId}] ✅ RPC call succeeded`);
    console.log(`[LIST-TABLES-${listTablesId}] Data type: ${typeof data}`);
    console.log(`[LIST-TABLES-${listTablesId}] Data is array: ${Array.isArray(data)}`);
    console.log(`[LIST-TABLES-${listTablesId}] Data length: ${Array.isArray(data) ? data.length : 'N/A'}`);
    
    const result = {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      }],
    };
    
    const totalDuration = Date.now() - startTime;
    console.log(`[LIST-TABLES-${listTablesId}] ⏱️ Total duration: ${totalDuration}ms`);
    console.log(`[LIST-TABLES-${listTablesId}] ========== END LIST TABLES ==========\n`);
    return result;
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error(`[LIST-TABLES-${listTablesId}] ❌❌❌ EXCEPTION after ${totalDuration}ms:`);
    console.error(`[LIST-TABLES-${listTablesId}] Error: ${error.message}`);
    console.error(`[LIST-TABLES-${listTablesId}] Stack:`, error.stack);
    console.error(`[LIST-TABLES-${listTablesId}] Error name: ${error.name}`);
    console.log(`[LIST-TABLES-${listTablesId}] ========== END LIST TABLES (ERROR) ==========\n`);
    return handleSupabaseError(error);
  }
}

/**
 * Execute raw SQL query
 * Note: Requires a custom RPC function in Supabase
 * 
 * To enable this, create an RPC function in Supabase:
 * CREATE OR REPLACE FUNCTION exec_sql(query text, params jsonb)
 * RETURNS jsonb AS $$
 * BEGIN
 *   -- Execute query and return results
 *   RETURN jsonb_build_object('result', 'SQL execution not implemented');
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 */
export async function executeSql(
  config: SupabaseConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const sql = requiredParam<string>(args, 'sql');
    const params = optionalParam<any[]>(args, 'params', []);

    // Note: Raw SQL execution requires a custom RPC function in Supabase
    // For now, we'll return an error suggesting to use the other tools
    // In the future, you could create an RPC function to enable this
    return {
      content: [{
        type: 'text' as const,
        text: 'Raw SQL execution requires a custom RPC function in Supabase. Use query/insert/update/delete tools instead. To enable execute_sql, create an RPC function in Supabase.',
      }],
      isError: true,
    };
  } catch (error: any) {
    return handleSupabaseError(error);
  }
}

