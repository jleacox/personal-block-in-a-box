/**
 * Validation utilities for Supabase MCP tools
 */

export function requiredParam<T>(args: Record<string, any>, name: string): T {
  if (!(name in args) || args[name] === undefined || args[name] === null) {
    throw new Error(`Missing required parameter: ${name}`);
  }
  return args[name] as T;
}

export function optionalParam<T>(args: Record<string, any>, name: string, defaultValue?: T): T | undefined {
  if (!(name in args) || args[name] === undefined || args[name] === null) {
    return defaultValue;
  }
  return args[name] as T;
}

