/**
 * Supabase client utility
 * Cloudflare Workers compatible - uses @supabase/supabase-js with fetch
 * 
 * Supabase uses API keys (not OAuth), so no OAuth broker needed.
 * Configuration via environment variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_KEY: Your Supabase service role key (recommended for MCP servers)
 * 
 * Key Types:
 * - Service Role Key: Bypasses RLS, full admin access - Recommended for MCP servers
 * - Anon Key: Respects RLS policies - Use only if you want RLS restrictions
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
}

/**
 * Get Supabase client
 * 
 * Priority:
 * 1. Direct config (supabaseUrl, supabaseKey)
 * 2. Environment variables (SUPABASE_URL, SUPABASE_KEY)
 */
export function getSupabaseClient(config: SupabaseConfig): SupabaseClient {
  const url = config.supabaseUrl || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : undefined);
  const key = config.supabaseKey || (typeof process !== 'undefined' ? process.env.SUPABASE_KEY : undefined);

  if (!url || !key) {
    throw new Error('Supabase configuration missing. Set SUPABASE_URL and SUPABASE_KEY environment variables or provide supabaseUrl and supabaseKey in config.');
  }

  // Create Supabase client with fetch (Cloudflare Workers compatible)
  return createClient(url, key, {
    global: {
      fetch: fetch, // Use global fetch (works in both Node.js and Cloudflare Workers)
    },
  });
}

