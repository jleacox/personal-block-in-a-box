#!/usr/bin/env node

/**
 * Google OAuth Re-authentication Script (All Services)
 * 
 * Re-authenticates with Google OAuth to get a fresh token with all scopes:
 * - Calendar
 * - Gmail (readonly)
 * - Drive
 * 
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

// All Google scopes
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',           // Calendar (full access)
  'https://www.googleapis.com/auth/gmail.modify',      // Gmail (full access: read, send, modify, delete)
  'https://www.googleapis.com/auth/drive',               // Drive (full access)
].join(' ');

// Normalize OAUTH_BROKER_URL (remove trailing slash if present)
const normalizedBrokerUrl = OAUTH_BROKER_URL.replace(/\/+$/, '');

// Build OAuth URL
const authUrl = new URL(`${normalizedBrokerUrl}/auth/google`);
authUrl.searchParams.set('user_id', USER_ID);
authUrl.searchParams.set('scope', GOOGLE_SCOPES);

console.log('🔐 Google OAuth Re-authentication (All Services)');
console.log('');
console.log('Configuration:');
console.log(`  OAuth Broker: ${normalizedBrokerUrl}`);
console.log(`  User ID: ${USER_ID}`);
console.log('');
console.log('Requested Scopes:');
console.log('  ✓ Google Calendar (full access)');
console.log('  ✓ Gmail (full access: read, send, modify, delete)');
console.log('  ✓ Google Drive (full access)');
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
console.log('  2. Grant permissions for all Google services:');
console.log('     - Calendar (full access)');
console.log('     - Gmail (full access: read, send, modify, delete)');
console.log('     - Drive (full access)');
    console.log('  3. You should see: "✓ Successfully connected! You can close this window."');
    console.log('  4. Your token will be updated with all Google scopes');
    console.log('');
    console.log('If the browser didn\'t open, visit this URL:');
    console.log(`  ${authUrl.toString()}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

