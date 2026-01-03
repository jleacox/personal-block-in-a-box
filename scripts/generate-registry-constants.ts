#!/usr/bin/env node

/**
 * Generate registry constants files for all MCP packages
 * 
 * This script discovers all packages with registry.ts files and generates
 * constants files with just the tool names arrays. This allows the gateway
 * to import tool names without importing the entire registry (which causes
 * issues in Cloudflare Workers).
 * 
 * Run: npm run generate-registry-constants
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Package configuration
interface PackageConfig {
  name: string;
  packageName: string; // e.g., "GITHUB", "CALENDAR", "GMAIL"
  displayName: string; // e.g., "GitHub MCP", "Calendar MCP"
}

const PACKAGES: PackageConfig[] = [
  { name: 'mcp-github', packageName: 'GITHUB', displayName: 'GitHub MCP' },
  { name: 'mcp-calendar', packageName: 'CALENDAR', displayName: 'Calendar MCP' },
  { name: 'mcp-gmail', packageName: 'GMAIL', displayName: 'Gmail MCP' },
  { name: 'mcp-drive', packageName: 'DRIVE', displayName: 'Drive MCP' },
  { name: 'mcp-supabase', packageName: 'SUPABASE', displayName: 'Supabase MCP' },
];

function generateConstantsForPackage(pkg: PackageConfig): boolean {
  const packageRoot = join(projectRoot, 'packages', pkg.name);
  const registryPath = join(packageRoot, 'src/tools/registry.ts');
  const outputPath = join(packageRoot, 'src/tools/registry-constants.ts');

  // Check if registry exists
  if (!existsSync(registryPath)) {
    console.log(`⏭️  Skipping ${pkg.name} (no registry.ts found)`);
    return false;
  }

  // Read the registry file
  const registryContent = readFileSync(registryPath, 'utf-8');

  // Extract tool names from TOOL_HANDLERS object
  const handlersSectionMatch = registryContent.match(/export const TOOL_HANDLERS[^}]+}/s);
  if (!handlersSectionMatch) {
    console.error(`❌ Could not find TOOL_HANDLERS object in ${registryPath}`);
    return false;
  }

  const handlersSection = handlersSectionMatch[0];
  const toolNames: string[] = [];

  // Match tool names - pattern: tool_name: handler, (with optional inline comments)
  // Supports both snake_case (tool_name) and camelCase (toolName)
  const toolNameRegex = /^\s*([a-z_][a-z0-9_]*|[a-z][a-zA-Z0-9]*)\s*:\s*[^,]+(?:,\s*(?:\/\/.*)?)?$/gm;
  let match;

  while ((match = toolNameRegex.exec(handlersSection)) !== null) {
    const toolName = match[1];
    // Skip if it's a comment line
    if (!toolName.startsWith('//') && toolName.length > 0) {
      toolNames.push(toolName);
    }
  }

  // Sort and deduplicate
  const allToolNames = [...new Set(toolNames)].sort();

  if (allToolNames.length === 0) {
    console.error(`❌ No tool names found in ${registryPath}`);
    return false;
  }

  // Generate the constants file
  const typeName = `${pkg.packageName}_TOOL_NAMES`;
  const typeTypeName = `${pkg.packageName}ToolName`;
  const typeCheckName = `is${pkg.packageName}ToolName`;

  const constantsContent = `/**
 * ${pkg.displayName} Tool Names Constants
 * 
 * ⚠️ AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * 
 * This file is generated from src/tools/registry.ts by scripts/generate-registry-constants.ts
 * Run "npm run generate-registry-constants" from project root to regenerate.
 * 
 * Generated at: ${new Date().toISOString()}
 */

/**
 * Array of all ${pkg.displayName} tool names
 * 
 * This is a lightweight export that can be imported by the gateway
 * without importing the entire registry (which causes issues in Cloudflare Workers).
 */
export const ${typeName} = [
${allToolNames.map(name => `  '${name}',`).join('\n')}
] as const;

/**
 * Type for ${pkg.displayName} tool names
 */
export type ${typeTypeName} = typeof ${typeName}[number];

/**
 * Check if a string is a valid ${pkg.displayName} tool name
 */
export function ${typeCheckName}(name: string): name is ${typeTypeName} {
  return ${typeName}.includes(name as ${typeTypeName});
}
`;

  // Write the generated file
  writeFileSync(outputPath, constantsContent, 'utf-8');

  console.log(`✅ Generated ${outputPath}`);
  console.log(`   Found ${allToolNames.length} tools`);
  return true;
}

// Main execution
console.log('🔧 Generating registry constants for all packages...\n');

let successCount = 0;
let skipCount = 0;

for (const pkg of PACKAGES) {
  if (generateConstantsForPackage(pkg)) {
    successCount++;
  } else {
    skipCount++;
  }
  console.log(''); // Empty line between packages
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ Generated: ${successCount} package(s)`);
console.log(`   ⏭️  Skipped: ${skipCount} package(s) (no registry.ts)`);

if (successCount === 0) {
  console.error('\n❌ No packages with registries found!');
  process.exit(1);
}

console.log('\n✅ Done!');

