/**
 * Parameter validation utilities
 * Ported from Go implementation patterns
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

export function optionalBoolParam(
  args: Record<string, any>,
  name: string,
  defaultValue?: boolean
): boolean {
  const value = args[name];
  if (value === undefined || value === null) {
    return defaultValue ?? false;
  }
  return Boolean(value);
}

/**
 * Parse repository string (owner/repo) into components
 */
export function parseRepo(repo: string): { owner: string; repo: string } {
  const parts = repo.split('/');
  if (parts.length !== 2) {
    throw new Error(`Invalid repo format: ${repo}. Expected "owner/repo"`);
  }
  return { owner: parts[0], repo: parts[1] };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  per_page: number;
}

export function getPaginationParams(
  args: Record<string, any>
): PaginationParams {
  return {
    page: optionalIntParam(args, 'page', 1),
    per_page: Math.min(optionalIntParam(args, 'per_page', 30), 100),
  };
}

