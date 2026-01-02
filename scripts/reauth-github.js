#!/usr/bin/env node

/**
 * GitHub OAuth Re-authentication Script
 * 
 * Re-authenticates with GitHub OAuth to get a fresh token.
 * Reads OAUTH_BROKER_URL and USER_ID from .env.local
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load .env.local
function loadEnvLocal() {
  try {
    const envPath = join(projectRoot, '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // Remove quotes if present
          env[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return env;
  } catch (error) {
    console.error('❌ Error reading .env.local:', error.message);
    console.error('   Make sure .env.local exists in the project root.');
    process.exit(1);
  }
}

// Get environment variables
const env = loadEnvLocal();
const OAUTH_BROKER_URL = env.OAUTH_BROKER_URL;
const USER_ID = env.USER_ID;

if (!OAUTH_BROKER_URL) {
  console.error('❌ OAUTH_BROKER_URL not found in .env.local');
  console.error('   Please add: OAUTH_BROKER_URL=https://oauth-broker.YOUR_SUBDOMAIN.workers.dev');
  process.exit(1);
}

if (!USER_ID) {
  console.error('❌ USER_ID not found in .env.local');
  console.error('   Please add: USER_ID=your_user_id');
  process.exit(1);
}

// Normalize OAUTH_BROKER_URL (remove trailing slash if present)
const normalizedBrokerUrl = OAUTH_BROKER_URL.replace(/\/+$/, '');

// Build OAuth URL
const authUrl = new URL(`${normalizedBrokerUrl}/auth/github`);
authUrl.searchParams.set('user_id', USER_ID);

console.log('🔐 GitHub OAuth Re-authentication');
console.log('');
console.log('Configuration:');
console.log(`  OAuth Broker: ${normalizedBrokerUrl}`);
console.log(`  User ID: ${USER_ID}`);
console.log('');
console.log('Opening browser for OAuth authentication...');
console.log('');

// Open browser (cross-platform)
const openBrowser = async (url) => {
  const platform = process.platform;
  let command;
  
  if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else if (platform === 'darwin') {
    command = `open "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  
  try {
    await execAsync(command);
  } catch (error) {
    console.error('⚠️  Could not open browser automatically.');
    console.error('   Please open this URL manually:');
    console.error('');
    console.error(`   ${url}`);
    console.error('');
  }
};

// Main
(async () => {
  try {
    await openBrowser(authUrl.toString());
    
    console.log('✅ Browser opened!');
    console.log('');
    console.log('Instructions:');
    console.log('  1. Complete the OAuth flow in your browser');
    console.log('  2. Authorize the GitHub OAuth app');
    console.log('  3. You should see: "✓ Successfully connected! You can close this window."');
    console.log('  4. Your token will be stored in the OAuth broker');
    console.log('');
    console.log('If the browser didn\'t open, visit this URL:');
    console.log(`  ${authUrl.toString()}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();


