/**
 * Parameter validation utilities
 * Reused from GitHub MCP pattern
 */

export function requiredParam<T>(
  args: Record<string, any>,
  name: string
): T {
  const value = args[name];
  if (value === undefined || value === null) {
    throw new Error(`Missing required parameter: ${name}`);
  }
  return value as T;
}

export function optionalParam<T>(
  args: Record<string, any>,
  name: string,
  defaultValue?: T
): T | undefined {
  const value = args[name];
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return value as T;
}

export function optionalIntParam(
  args: Record<string, any>,
  name: string,
  defaultValue?: number
): number {
  const value = args[name];
  if (value === undefined || value === null) {
    return defaultValue ?? 0;
  }
  const num = typeof value === 'number' ? value : parseInt(String(value), 10);
  return isNaN(num) ? (defaultValue ?? 0) : num;
}

