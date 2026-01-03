#!/usr/bin/env node

/**
 * Validate tool registries for all MCP packages
 * 
 * Validates that:
 * 1. Generated constants match registries
 * 2. All packages with registries have generated constants
 * 
 * Run: npm run validate-tools
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface PackageConfig {
  name: string;
  packageName: string;
  displayName: string;
}

const PACKAGES: PackageConfig[] = [
  { name: 'mcp-github', packageName: 'GITHUB', displayName: 'GitHub MCP' },
  { name: 'mcp-calendar', packageName: 'CALENDAR', displayName: 'Calendar MCP' },
  { name: 'mcp-gmail', packageName: 'GMAIL', displayName: 'Gmail MCP' },
  { name: 'mcp-drive', packageName: 'DRIVE', displayName: 'Drive MCP' },
  { name: 'mcp-supabase', packageName: 'SUPABASE', displayName: 'Supabase MCP' },
];

function validatePackage(pkg: PackageConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const packageRoot = join(projectRoot, 'packages', pkg.name);
  const registryPath = join(packageRoot, 'src/tools/registry.ts');
  const constantsPath = join(packageRoot, 'src/tools/registry-constants.ts');

  // Check if registry exists
  if (!existsSync(registryPath)) {
    // No registry = no validation needed
    return { valid: true, errors: [] };
  }

  // Registry exists, so constants should exist
  if (!existsSync(constantsPath)) {
    errors.push(`❌ ${pkg.displayName}: registry.ts exists but registry-constants.ts is missing`);
    errors.push(`   Run: npm run generate-registry-constants`);
    return { valid: false, errors };
  }

  // Read both files
  const registryContent = readFileSync(registryPath, 'utf-8');
  const constantsContent = readFileSync(constantsPath, 'utf-8');

  // Extract tool names from registry
  const handlersSectionMatch = registryContent.match(/export const TOOL_HANDLERS[^}]+}/s);
  if (!handlersSectionMatch) {
    errors.push(`❌ ${pkg.displayName}: Could not find TOOL_HANDLERS in registry.ts`);
    return { valid: false, errors };
  }

  const handlersSection = handlersSectionMatch[0];
  const registryToolNames: string[] = [];

  const toolNameRegex = /^\s*([a-z_]+)\s*:\s*[^,]+(?:,\s*(?:\/\/.*)?)?$/gm;
  let match;

  while ((match = toolNameRegex.exec(handlersSection)) !== null) {
    const toolName = match[1];
    if (!toolName.startsWith('//') && toolName.length > 0) {
      registryToolNames.push(toolName);
    }
  }

  const registryTools = [...new Set(registryToolNames)].sort();

  // Extract tool names from constants
  const constantsArrayMatch = constantsContent.match(/export const \w+_TOOL_NAMES = \[([^\]]+)\]/s);
  if (!constantsArrayMatch) {
    errors.push(`❌ ${pkg.displayName}: Could not find TOOL_NAMES array in registry-constants.ts`);
    return { valid: false, errors };
  }

  const constantsArrayContent = constantsArrayMatch[1];
  const constantsTools: string[] = [];
  const toolNameInArrayRegex = /'([a-z_]+)'/g;

  while ((match = toolNameInArrayRegex.exec(constantsArrayContent)) !== null) {
    constantsTools.push(match[1]);
  }

  const constantsToolsSorted = [...new Set(constantsTools)].sort();

  // Compare
  if (registryTools.length !== constantsToolsSorted.length) {
    errors.push(`❌ ${pkg.displayName}: Registry has ${registryTools.length} tools but constants has ${constantsToolsSorted.length}`);
    return { valid: false, errors };
  }

  for (let i = 0; i < registryTools.length; i++) {
    if (registryTools[i] !== constantsToolsSorted[i]) {
      errors.push(`❌ ${pkg.displayName}: Mismatch at index ${i}: registry="${registryTools[i]}" vs constants="${constantsToolsSorted[i]}"`);
      return { valid: false, errors };
    }
  }

  return { valid: true, errors: [] };
}

// Main execution
console.log('🔍 Validating tool registries for all packages...\n');

let validCount = 0;
let invalidCount = 0;
let skippedCount = 0;
const allErrors: string[] = [];

for (const pkg of PACKAGES) {
  const result = validatePackage(pkg);
  
  if (result.errors.length === 0) {
    if (existsSync(join(projectRoot, 'packages', pkg.name, 'src/tools/registry.ts'))) {
      console.log(`✅ ${pkg.displayName}: Registry and constants are in sync`);
      validCount++;
    } else {
      skippedCount++;
    }
  } else {
    console.log(`❌ ${pkg.displayName}: Validation failed`);
    allErrors.push(...result.errors);
    invalidCount++;
  }
}

console.log('');

if (allErrors.length > 0) {
  console.error('🔴 Validation Failed!\n');
  allErrors.forEach(err => console.error(`  ${err}`));
  console.error(`\nTotal: ${allErrors.length} error(s)\n`);
  console.error('To fix: Run "npm run generate-registry-constants" to regenerate constants.\n');
  process.exit(1);
} else {
  console.log('✅ All registries are valid!\n');
  console.log(`📊 Summary:`);
  console.log(`   ✅ Valid: ${validCount} package(s)`);
  console.log(`   ⏭️  Skipped: ${skippedCount} package(s) (no registry.ts)`);
  console.log(`   ❌ Invalid: ${invalidCount} package(s)\n`);
  process.exit(0);
}

